import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildLeadLog, CODE_WIDTH, publisherFromUrl, reasonCode, renderLeadLogText, tapeLines, type LeadLog } from "@/lib/lead-log";
import { resolveKey } from "@/lib/keys";

const DESK = join(import.meta.dir, "../../..");
const HISTORY_PATH = join(DESK, "artifacts/sage/lead-history.json");

const ex = (headline: string, reason: string) => ({ cluster_id: `cl:${headline}`, headline, reason });
const PICKED = {
  date: "2026-09-26",
  at: "2026-09-26T03:11:00.000Z",
  crawl_at: "2026-09-26T03:10:00Z",
  cluster_id: "cl:hn:1",
  headline: "UN AI-safety CEOs",
  url: "https://www.reuters.com/x",
  sources: 2,
  sig: 3,
  reason: "picked",
  first_at: "2026-09-25T20:00:00.000Z",
  excluded: [
    ex("Claude enzyme", "age>=24h"),
    ex("Trump allies … Anthropic CEO", "politics:trump"),
    ex("5 AI Semiconductor Stocks", "noise:investing"),
  ],
};
const HELD = {
  date: "2026-09-27",
  at: "2026-09-27T03:11:00.000Z",
  crawl_at: "2026-09-27T03:10:00Z",
  cluster_id: "cl:hn:1",
  headline: "UN AI-safety CEOs",
  url: "https://www.reuters.com/x",
  sources: 2,
  sig: 3,
  reason: "held",
  note: "no qualifying story",
  excluded: [ex("BNP Paribas inks new Google Cloud deal", "noise:customer-deal")],
  attempts: [
    { at: "2026-09-27T03:11:00.000Z", crawl_at: "2026-09-27T03:10:00Z", excluded: [ex("Gemini TTS", "age>=24h"), ex("Gemini tarot", "GNW_ONLY")] },
    { at: "2026-09-27T07:12:00.000Z", crawl_at: "2026-09-27T07:11:00Z", excluded: [ex("BNP Paribas inks new Google Cloud deal", "noise:customer-deal")] },
  ],
};
const hist = (...entries: unknown[]) => ({ schema: 1, entries });

describe("Beat 11 lead log builder (artifacts/sage/lead-history.json → holotape)", () => {
  test("picked lead: one row with Istanbul pick time, PUBS from the history, ✓ LEAD + ✗ codes on the tape", () => {
    const log = buildLeadLog(hist(PICKED));
    expect(log.days).toHaveLength(1);
    const d = log.days[0]!;
    expect(d).toMatchObject({ date: "2026-09-26", state: "picked", headline: "UN AI-safety CEOs", sources: 2, sig: 3, pubs: ["reuters.com"] });
    expect(log.lastAt).toBe("2026-09-26T03:11:00.000Z");
    const text = renderLeadLogText(log).split("\n");
    expect(text[0]).toBe("HOLOTAPE · LEAD LOG · 1 day");
    expect(text[1]).toBe("2026-09-26 · 06:11 · UN AI-safety CEOs · 2 reuters.com · 3"); // 03:11Z = 06:11 UTC+3
    expect(text.slice(2)).toEqual([
      "> CANDIDATES 4 · 06:11 UTC+3",
      "  ✓ LEAD   UN AI-safety CEOs · 2 PUB · SIG 3",
      "  ✗ AGE    Claude enzyme · ≥24h at pick",
      "  ✗ POLIT  Trump allies … Anthropic CEO · trump",
      "  ✗ LIST   5 AI Semiconductor Stocks",
    ]);
  });

  test("HELD entry with attempts[]: muted HELD row carrying the previous lead, one tape pass per attempt", () => {
    const log = buildLeadLog(hist(PICKED, HELD));
    expect(log.days.map((d) => d.date)).toEqual(["2026-09-27", "2026-09-26"]); // newest first
    const d = log.days[0]!;
    expect(d.state).toBe("held");
    expect(d.headline).toBe("UN AI-safety CEOs"); // carried lead, rendered dim
    expect(d.passes).toHaveLength(2);
    expect(d.passes.every((p) => p.held && !p.lead)).toBe(true);
    expect(log.lastAt).toBe(PICKED.at); // last real pick, never the HELD retry
    const lines = tapeLines(d).map((l) => (l.kind === "head" ? `> ${l.text}` : `${l.mark} ${l.code} ${l.text}`));
    expect(lines).toEqual([
      "> PASS 1/2 · CANDIDATES 2 · 06:11 UTC+3 · HELD",
      "✗ AGE    Gemini TTS · ≥24h at pick",
      "✗ GNW    Gemini tarot · Google News only",
      "· HELD   no qualifying story",
      "> PASS 2/2 · CANDIDATES 1 · 10:12 UTC+3 · HELD",
      "✗ FILTER BNP Paribas inks new Google Cloud deal · customer-deal",
      "· HELD   no qualifying story",
    ]);
    expect(renderLeadLogText(log).split("\n")[1]).toBe("2026-09-27 · HELD · HELD · no qualifying story · UN AI-safety CEOs · 2 reuters.com · 3");
  });

  test("HELD without attempts[] falls back to the entry's own excluded list", () => {
    const bare: Partial<typeof HELD> = { ...HELD };
    delete bare.attempts;
    const d = buildLeadLog(hist(bare)).days[0]!;
    expect(d.passes).toHaveLength(1);
    expect(d.passes[0]!.out).toEqual([{ code: "FILTER", headline: "BNP Paribas inks new Google Cloud deal", detail: "customer-deal" }]);
  });

  test("same-date re-picks: superseded picks are tagged, the day shows the LAST entry", () => {
    const first = { ...PICKED, forced: true };
    const second = { ...PICKED, at: "2026-09-26T10:00:00.000Z", cluster_id: "cl:hn:2", headline: "Second pick", supersedes: "cl:hn:1", forced: true };
    const d = buildLeadLog(hist(first, second)).days[0]!;
    expect(d.headline).toBe("Second pick");
    expect(d.passes[0]!.tags).toEqual(["manual", "superseded"]);
    expect(tapeLines(d)[0]!.text).toBe("PASS 1/2 · CANDIDATES 4 · 06:11 UTC+3 · manual");
    expect(tapeLines(d)[1]!.text).toContain("· superseded");
  });

  test("reason codes: fixed-width vocabulary, raw reason kept as detail when the code loses it", () => {
    expect(reasonCode("age>=24h")).toEqual({ code: "AGE" });
    expect(reasonCode("politics:trump")).toEqual({ code: "POLIT", detail: "trump" });
    expect(reasonCode("noise:investing")).toEqual({ code: "LIST" });
    expect(reasonCode("GNW_ONLY")).toEqual({ code: "GNW", detail: "Google News only" });
    expect(reasonCode("noise:customer-deal")).toEqual({ code: "FILTER", detail: "customer-deal" });
    expect(reasonCode("no-time")).toEqual({ code: "FILTER", detail: "no-time" });
    expect(reasonCode("src<2")).toEqual({ code: "SRC<2" });
    expect(reasonCode("taste")).toEqual({ code: "TASTE" });
    for (const r of ["age>=24h", "politics:x", "noise:investing", "GNW_ONLY", "noise:customer-deal", "src<2", "taste"])
      expect(reasonCode(r).code.length).toBeLessThanOrEqual(CODE_WIDTH);
    const codes = tapeLines(buildLeadLog(hist(PICKED, HELD)).days[0]!).filter((l) => l.kind !== "head").map((l) => l.code);
    expect(new Set(codes.map((c) => c.length))).toEqual(new Set([CODE_WIDTH]));
  });

  test("publisher names come from the lead URL host", () => {
    expect(publisherFromUrl("https://www.ft.com/content/1")).toBe("ft.com");
    expect(publisherFromUrl("https://news.google.com/rss/articles/x")).toBe("Google News");
    expect(publisherFromUrl(null)).toBeNull();
    expect(publisherFromUrl("not a url")).toBeNull();
  });

  test("empty / missing / wrong-schema history ⇒ empty log, no throw", () => {
    for (const raw of [hist(), null, undefined, {}, { schema: 2, entries: [PICKED] }, { schema: 1, entries: "x" }]) {
      const log = buildLeadLog(raw);
      expect(log).toEqual({ days: [], lastAt: null });
      expect(renderLeadLogText(log)).toBe("HOLOTAPE · LEAD LOG · 0 days");
    }
  });

  test("rebuild rule: the real lead-history.json rebuilds the identical log (data + text), and it ships only slim fields", () => {
    const raw = readFileSync(HISTORY_PATH, "utf8");
    const a = buildLeadLog(JSON.parse(raw));
    const b = buildLeadLog(JSON.parse(raw));
    const c = buildLeadLog(JSON.parse(JSON.stringify(JSON.parse(raw))));
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(renderLeadLogText(b)).toBe(renderLeadLogText(a));
    expect(JSON.stringify(c)).toBe(JSON.stringify(a));
    // One row per Istanbul date in the history, newest first.
    const dates = [...new Set((JSON.parse(raw).entries as { date: string }[]).map((e) => e.date))].sort().reverse();
    expect(a.days.map((d) => d.date)).toEqual(dates);
    // Slim: no cluster ids / crawl stamps / first_at reach the client props.
    const s = JSON.stringify(a);
    for (const k of ["cluster_id", "crawl_at", "first_at", "supersedes", "excluded", "attempts", "note"]) expect(s).not.toContain(`"${k}"`);
    const log: LeadLog = a;
    expect(log.days.every((d) => d.passes.length >= 1)).toBe(true);
  });

  test("desk wiring: Yesterday line links ?view=leadlog, `l` toggles it, page builds the log at build time", () => {
    expect(resolveKey({ key: "l" })).toEqual({ t: "leadlog" });
    expect(resolveKey({ key: "l", ctrlKey: true })).toBeNull();
    expect(resolveKey({ key: "l" }, { typing: true })).toBeNull();
    const tsx = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
    expect(tsx).toContain('data-leadlog-link="1"');
    expect(tsx).toContain("→ log");
    expect(tsx).toContain('const LEADLOG_VIEW = "leadlog"');
    const page = readFileSync(join(DESK, "src/app/page.tsx"), "utf8");
    expect(page).toContain("buildLeadLog(leadHistory)");
    expect(page).not.toContain('"use client"');
    const panel = readFileSync(join(DESK, "src/components/sage/lead-log.tsx"), "utf8");
    expect(panel).not.toMatch(/fetch\(|from\s+["'][^"']*lead-history\.json/); // renders from props only
    const libSrc = readFileSync(join(DESK, "src/lib/lead-log.ts"), "utf8");
    expect(libSrc).toMatch(/import type \{ LeadEntry \} from "@\/lib\/lead-pick"/); // picker never enters the client bundle
  });

  test("Beat 11 CSS: Skin V2 vars only (no hex), nothing dimmer than --muted-foreground, reduced motion instant", () => {
    const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* Beat 11 — holotape lead log"));
    expect(block.length).toBeGreaterThan(500);
    expect(/#[0-9a-f]{3,8}\b/i.test(block)).toBe(false);
    expect(block).not.toMatch(/color:\s*var\(--(phosphor-deep|muted|border|signal-deep)\)/);
    expect(block).toContain("calc(var(--i, 0) * 40ms)");
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.leadlog-tape-line\s*\{\s*animation: none/);
    expect(block).toContain("height: 40px");
  });
});
