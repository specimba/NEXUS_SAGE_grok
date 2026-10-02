/**
 * Beat 11 — holotape lead log (refs/UX-BEAT11-12-HOLOTAPE-MOBILE.md). Pure builder: artifacts/sage/lead-history.json
 * → the slim rows the log renders (Director's rebuild rule: the view renders from this ONLY, so the same JSON always
 * rebuilds the same log). Built at build time in app/page.tsx (server component) and handed to the client as props —
 * no runtime fetch, and the raw history (cluster ids, crawl stamps, first_at…) never ships to the browser.
 * Type-only import from lead-pick so the client bundle never pulls the picker (wire / pulse-v5 / topic-heat).
 */
import type { LeadEntry } from "@/lib/lead-pick";
import { istHHMM, IST_LABEL } from "@/lib/ist-time";

/** Fixed-width (6ch) reason codes. GNW = Beat 5 rule (Google News only confirms, never leads). */
export type LogCode = "AGE" | "POLIT" | "LIST" | "TASTE" | "SRC<2" | "GNW" | "FILTER";
export const CODE_WIDTH = 6;

export type LogOut = { code: LogCode; headline: string; detail?: string };
export type LogPass = {
  /** Pick / attempt time (ISO, rendered in Istanbul time). */
  at: string;
  held: boolean;
  lead?: { headline: string; sources: number; sig: number | null };
  out: LogOut[];
  tags?: string[];
};
export type LogDay = {
  date: string;
  state: "picked" | "held" | "seed";
  at: string;
  /** Picked: the lead. HELD: the carried (previous) lead, shown dim. */
  headline: string;
  url: string | null;
  sources: number;
  sig: number | null;
  /** Publisher names known from the history (the lead URL's host — lead-history.json records no member list). */
  pubs: string[];
  passes: LogPass[];
};
export type LeadLog = { days: LogDay[]; lastAt: string | null };

/** Raw lead-history reason → fixed-width code (+ detail when the code alone loses information). */
export function reasonCode(reason: string): { code: LogCode; detail?: string } {
  const r = String(reason ?? "");
  if (r === "age>=24h") return { code: "AGE" };
  if (r.startsWith("politics:")) return { code: "POLIT", detail: r.slice("politics:".length) };
  if (r === "noise:investing") return { code: "LIST" };
  if (r === "GNW_ONLY") return { code: "GNW", detail: "Google News only" };
  if (/^taste\b|^x:/i.test(r)) return { code: "TASTE" };
  if (/^src<2$|^sources?<2$/i.test(r)) return { code: "SRC<2" };
  return { code: "FILTER", detail: r.startsWith("noise:") ? r.slice("noise:".length) : r || "unknown" };
}

/** "techcrunch.com" from the lead URL; Google News / HN get their desk names. */
export function publisherFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "news.google.com") return "Google News";
    if (host === "news.ycombinator.com") return "HN";
    return host || null;
  } catch {
    return null;
  }
}

type Excl = { headline: string; reason: string };
const outs = (ex: Excl[] | undefined): LogOut[] =>
  (ex ?? []).map((e) => {
    const c = reasonCode(e.reason);
    return { code: c.code, headline: String(e.headline ?? ""), ...(c.detail ? { detail: c.detail } : {}) };
  });

function passesFor(day: LeadEntry[]): LogPass[] {
  const passes: LogPass[] = [];
  day.forEach((e, i) => {
    const later = day.slice(i + 1);
    const tags: string[] = [];
    if (e.forced) tags.push("manual");
    if (e.catch_up) tags.push("catch-up");
    if (e.reason === "held") {
      const attempts = e.attempts?.length ? e.attempts : [{ at: e.at, excluded: e.excluded ?? [] }];
      // Entry flags (manual / catch-up) describe the crawl that created the HELD entry — its first attempt only.
      attempts.forEach((a, k) => passes.push({ at: a.at, held: true, out: outs(a.excluded), ...(k === 0 && tags.length ? { tags } : {}) }));
      return;
    }
    if (e.reason === "seed") tags.push("seed");
    if (e.reason === "picked" && e.cluster_id && later.some((l) => l.supersedes === e.cluster_id)) tags.push("superseded");
    passes.push({
      at: e.at,
      held: false,
      lead: { headline: e.headline, sources: e.sources, sig: e.sig },
      out: outs(e.excluded),
      ...(tags.length ? { tags } : {}),
    });
  });
  return passes.sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0));
}

/** lead-history.json (parsed) → the log. Newest day first; a day's state is its LAST entry (same rule as entryFor). */
export function buildLeadLog(raw: unknown): LeadLog {
  const h = raw as { schema?: number; entries?: LeadEntry[] } | null;
  const entries = h && h.schema === 1 && Array.isArray(h.entries) ? h.entries : [];
  const byDate = new Map<string, LeadEntry[]>();
  for (const e of entries) {
    if (!e || typeof e.date !== "string") continue;
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  }
  const days: LogDay[] = [...byDate.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const day = byDate.get(date)!;
      const last = day[day.length - 1]!;
      const pub = publisherFromUrl(last.url);
      return {
        date,
        state: last.reason === "held" ? "held" : last.reason === "seed" ? "seed" : "picked",
        at: last.attempts?.length ? last.attempts[last.attempts.length - 1]!.at : last.at,
        headline: String(last.headline ?? ""),
        url: last.url ?? null,
        sources: Number(last.sources) || 0,
        sig: last.sig ?? null,
        pubs: pub ? [pub] : [],
        passes: passesFor(day),
      };
    });
  const lastPick = days.find((d) => d.state === "picked");
  return { days, lastAt: lastPick?.at ?? null };
}

export type TapeLine = { kind: "head" | "lead" | "out" | "held" | "seed"; mark: string; code: string; text: string };

const pad = (code: string) => code.padEnd(CODE_WIDTH, " ");

/** The "tape playback" lines for one day (pure; the component renders exactly these). */
export function tapeLines(day: LogDay): TapeLine[] {
  const lines: TapeLine[] = [];
  const multi = day.passes.length > 1;
  day.passes.forEach((p, i) => {
    const n = p.out.length + (p.lead ? 1 : 0);
    const isSeed = p.tags?.includes("seed");
    const head = [
      multi ? `PASS ${i + 1}/${day.passes.length}` : null,
      isSeed ? "SEED" : `CANDIDATES ${n}`,
      `${istHHMM(p.at)} ${IST_LABEL}`,
      p.held ? "HELD" : null,
      ...(p.tags ?? []).filter((t) => t !== "seed" && t !== "superseded"),
    ].filter(Boolean);
    lines.push({ kind: "head", mark: ">", code: "", text: head.join(" · ") });
    if (p.lead) {
      if (isSeed) lines.push({ kind: "seed", mark: "·", code: pad("SEED"), text: `${p.lead.headline} · cycle 003 static pin` });
      else
        lines.push({
          kind: "lead",
          mark: "✓",
          code: pad("LEAD"),
          text: `${p.lead.headline} · ${p.lead.sources} PUB · SIG ${p.lead.sig ?? "—"}${p.tags?.includes("superseded") ? " · superseded" : ""}`,
        });
    }
    for (const o of p.out)
      lines.push({
        kind: "out",
        mark: "✗",
        code: pad(o.code),
        text: `${o.headline}${o.code === "AGE" ? " · ≥24h at pick" : o.detail ? ` · ${o.detail}` : ""}`,
      });
    if (p.held) lines.push({ kind: "held", mark: "·", code: pad("HELD"), text: "no qualifying story" });
  });
  return lines;
}

/** Plain-text render of the whole log (rows + every tape) — the rebuild-identity check compares this. */
export function renderLeadLogText(log: LeadLog): string {
  const out = [`HOLOTAPE · LEAD LOG · ${log.days.length} day${log.days.length === 1 ? "" : "s"}`];
  for (const d of log.days) {
    const pick = d.state === "held" ? "HELD" : d.state === "seed" ? "SEED" : istHHMM(d.at);
    const head = d.state === "held" ? `HELD · no qualifying story · ${d.headline || "—"}` : d.headline;
    out.push(`${d.date} · ${pick} · ${head} · ${d.sources}${d.pubs.length ? ` ${d.pubs.slice(0, 3).join(", ")}` : ""} · ${d.sig ?? "—"}`);
    for (const l of tapeLines(d)) out.push(l.kind === "head" ? `> ${l.text}` : `  ${l.mark} ${l.code} ${l.text}`);
  }
  return out.join("\n");
}
