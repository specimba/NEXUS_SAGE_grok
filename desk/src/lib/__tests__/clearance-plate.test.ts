/**
 * UX-1 clearance plate (refs/UX-NEXT-3.md §1): gate rail + time bar on the picked plate; HELD → SIGNAL HOLD card with
 * the closest candidate. Crawl fields: excluded[].sources / age_h / pub, entry.pub, LEAD_CLOSEST, LEAD_LAST_PICK.
 * Fixtures: synthetic groups for each reason + real-crawl HELD fixtures (fixtures/lead-hold.ts).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyPick,
  decidePick,
  GNW_ONLY,
  lastPickDate,
  leadClosest,
  ownPublisherLabel,
  pubLabel,
  type LeadEntry,
  type LeadHistory,
} from "@/lib/lead-pick";
import { burn, closestGates, nextLeadSlot, staleGates } from "@/lib/take-plate";
import type { WireCluster } from "@/lib/wire";
import { withPub } from "@/lib/desk-view-inputs";
import { LEAD_TODAY as RAW_TODAY } from "@/data/lead-pick";
import { LEAD_CLOSEST, LEAD_LAST_PICK, LEAD_TODAY } from "@/data/desk-view";
import { heldHistory, realLastPick } from "./fixtures/lead-hold";

const DESK = fileURLToPath(new URL("../../..", import.meta.url));
const ist = (s: string) => Date.parse(`${s}+03:00`);
const hhmm = (ms: number) => new Date(ms + 3 * 3_600_000).toISOString().slice(11, 16);
const dayHH = (ms: number) => new Date(ms + 3 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");

function cl(id: string, over: Partial<WireCluster> = {}): WireCluster {
  const lead = id.replace(/^cl:/, "");
  return {
    id,
    title: `OpenAI model story ${id}`,
    url: `https://example.com/${lead}`,
    lead_id: lead,
    lead_source: "hn-algolia",
    sources: ["hn-algolia", "gnews-rss"],
    member_ids: [lead, `gnews:${lead.replace(/\W/g, "")}`],
    size: 2,
    at: "2026-09-25T01:00:00Z",
    first_seen: null,
    is_new: false,
    ...over,
  };
}
const PICK = "2026-09-25T03:11:00Z"; // 06:11 Istanbul
const empty: LeadHistory = { schema: 1, entries: [] };
const gnwOnly = cl("cl:gnews:g1", { lead_id: "gnews:g1", lead_source: "gnews-rss", member_ids: ["gnews:g1", "gnews:g2", "gnews:g3"], title: "OpenAI ships a model" });
const old = cl("cl:rss:deepmind:o1", { lead_id: "rss:deepmind:o1", lead_source: "rss-lab", member_ids: ["rss:deepmind:o1", "gnews:o2"], at: "2026-09-23T10:00:00Z" });
const politics = cl("cl:hn:p1", { title: "Trump signs OpenAI chip order" });
const amber = (g: { pass: boolean }[]) => g.filter((x) => !x.pass).length;

describe("UX-1 crawl fields (lead-pick)", () => {
  test("ruled-out records carry N SRC, whole-hour age and own publisher; a pick records its own publisher", () => {
    const fresh = cl("cl:hn:ok", { at: "2026-09-25T00:30:00Z" });
    const d = decidePick(empty, [gnwOnly, old, politics, fresh], { crawlAt: PICK, at: PICK });
    expect(d.action).toBe("picked");
    if (d.action !== "picked") return;
    expect(d.entry.pub).toBe("HN");
    const by = Object.fromEntries((d.entry.excluded ?? []).map((e) => [e.cluster_id, e]));
    expect(by["cl:gnews:g1"]).toEqual({ cluster_id: "cl:gnews:g1", headline: gnwOnly.title, reason: GNW_ONLY, sources: 3, age_h: 2 });
    expect(by["cl:rss:deepmind:o1"]).toMatchObject({ reason: "age>=36h", sources: 2, age_h: 41, pub: "DMD" });
    expect(by["cl:hn:p1"]).toMatchObject({ reason: "politics:trump", sources: 2, age_h: 2, pub: "HN" });
  });

  test("own-publisher label: lead item first, GNews and self-reposts never count", () => {
    expect(pubLabel("hn:1")).toBe("HN");
    expect(pubLabel("rss-sec:krebs:1")).toBe("SEC");
    expect(pubLabel("rss:deepmind:1")).toBe("DMD");
    expect(ownPublisherLabel(gnwOnly)).toBeNull();
    expect(ownPublisherLabel(cl("cl:gnews:x", { lead_id: "gnews:x", member_ids: ["gnews:x", "hn:9"] }))).toBe("HN");
    expect(ownPublisherLabel(cl("cl:gnews:y", { lead_id: "gnews:y", member_ids: ["gnews:y", "rss:openai:y"], self_repost_ids: ["rss:openai:y"] }))).toBeNull();
  });
  test("PASS-S1: analyst (anl:) and release (rel:) items are never the own publisher", () => {
    expect(ownPublisherLabel(cl("cl:anl:a", { lead_id: "anl:simonw:a", member_ids: ["anl:simonw:a", "anl:latent-space:b"] }))).toBeNull();
    expect(ownPublisherLabel(cl("cl:rel:r", { lead_id: "rel:ollama:v0.13.0", member_ids: ["rel:ollama:v0.13.0", "gnews:z"] }))).toBeNull();
    expect(ownPublisherLabel(cl("cl:anl:c", { lead_id: "anl:simonw:c", member_ids: ["anl:simonw:c", "rel:vllm:v0.12.0", "hn:7"] }))).toBe("HN");
  });

  test("last pick date skips HELD entries (two HELD days in a row still name the real pick)", () => {
    const e = (date: string, reason: LeadEntry["reason"]): LeadEntry => ({ date, reason, cluster_id: "c", headline: "h", url: null, sources: 2, sig: 1, at: `${date}T03:11:00Z`, crawl_at: `${date}T03:11:00Z` });
    expect(lastPickDate({ schema: 1, entries: [e("2026-10-13", "picked"), e("2026-10-14", "held"), e("2026-10-15", "held")] })).toBe("2026-10-13");
    expect(lastPickDate({ schema: 1, entries: [e("2026-10-15", "picked")] })).toBe("2026-10-15");
    expect(lastPickDate({ schema: 1, entries: [e("2026-10-01", "seed"), e("2026-10-02", "held")] })).toBe("2026-10-01");
    expect(lastPickDate(empty)).toBeNull();
  });

  test("closest candidate = first ruled-out record of the LATEST attempt; null on picked days", () => {
    const h1 = applyPick(empty, decidePick(empty, [gnwOnly], { crawlAt: PICK, at: PICK }));
    const T2 = "2026-09-25T07:11:00Z"; // 10:11 retry
    const d2 = decidePick(h1, [old, gnwOnly], { crawlAt: T2, at: T2 });
    const held = applyPick(h1, d2).entries.at(-1)!;
    expect(held.reason).toBe("held");
    expect(held.attempts?.length).toBe(2);
    const c = leadClosest(held)!;
    expect(c).toMatchObject({ headline: gnwOnly.title, reason: GNW_ONLY, sources: 3, at: T2 });
    const picked = decidePick(empty, [cl("cl:hn:ok")], { crawlAt: PICK, at: PICK });
    expect(leadClosest(picked.action === "picked" ? picked.entry : null)).toBeNull();
    expect(leadClosest(null)).toBeNull();
  });

  test("no Gmail or X-taste item can ever be the closest candidate", () => {
    const at = PICK;
    const base: LeadEntry = { date: "2026-09-25", reason: "held", cluster_id: null, headline: "", url: null, sources: 0, sig: null, at, crawl_at: at };
    const ex = [
      { cluster_id: "cl:gmail:abc", headline: "Gmail-led story", reason: GNW_ONLY, sources: 3 },
      { cluster_id: "cl:x:123", headline: "X post story", reason: GNW_ONLY, sources: 2 },
      { cluster_id: "cl:hn:7", headline: "Gmail-only own publisher", reason: GNW_ONLY, sources: 2, pub: "GML" },
      { cluster_id: "cl:hn:8", headline: "Taste", reason: "taste", sources: 2 },
    ];
    expect(leadClosest({ ...base, attempts: [{ at, crawl_at: at, excluded: ex }] })).toBeNull();
    const ok = { cluster_id: "cl:gnews:9", headline: "Real candidate", reason: GNW_ONLY, sources: 2 };
    expect(leadClosest({ ...base, attempts: [{ at, crawl_at: at, excluded: [...ex, ok] }] })?.headline).toBe("Real candidate");
    // and the picker itself never records an X / taste group (Wire gate)
    const x = cl("cl:x:1", { lead_id: "x:1", lead_source: "x", member_ids: ["x:1", "gnews:x1"] });
    const taste = cl("cl:hn:t1", { member_ids: ["hn:t1", "gnews:t1"] });
    const d = decidePick(empty, [x, taste], { crawlAt: PICK, at: PICK, tasteIds: ["hn:t1"] });
    expect(d.action === "held" ? d.entry.attempts?.[0]?.excluded ?? [] : ["not held"]).toEqual([]);
  });
});

describe("UX-1 gate rail: exactly one amber gate — the failing one", () => {
  const C = (reason: string, over = {}) => ({ headline: "h", reason, sources: 4, age_h: 3, at: PICK, ...over });
  test.each([
    ["GNW_ONLY", "pub", "GNW only", "✗ own publisher"],
    ["age>=36h", "fresh", "40h", "✗ fresh"],
    ["no-time", "fresh", "age ?", "✗ fresh"],
    ["politics:trump", "rule", "politics:trump", "✗ lead rule"],
    ["noise:investing", "rule", "noise:investing", "✗ lead rule"],
    ["noise:customer-deal", "rule", "noise:customer-deal", "✗ lead rule"],
  ])("%s → amber %s", (reason, k, label, note) => {
    const g = closestGates(C(reason, reason.startsWith("age") ? { age_h: 40, pub: "DMD" } : {}));
    expect(amber(g)).toBe(1);
    expect(g.find((x) => !x.pass)).toEqual({ k, label, note, pass: false });
    expect(g[0]).toEqual({ k: "src", label: "4 SRC", note: "≥2", pass: true });
  });
  test.each([
    ["analyst-only", "ANL only"],
    ["release", "REL only"],
  ])("PASS-S1 %s → the own-publisher gate is the one amber chip", (reason, label) => {
    const g = closestGates(C(reason));
    expect(amber(g)).toBe(1);
    expect(g.map((x) => `${x.label} ${x.note}`)).toEqual(["4 SRC ≥2", `${label} ✗ own publisher`, "3h fresh"]);
  });
  test("GNW_ONLY rail matches the mock: 4 SRC ≥2 · GNW only ✗ own publisher · 3h fresh", () => {
    expect(closestGates(C(GNW_ONLY)).map((g) => `${g.label} ${g.note}`)).toEqual(["4 SRC ≥2", "GNW only ✗ own publisher", "3h fresh"]);
    expect(closestGates(C(GNW_ONLY, { age_h: 0 }))[2]!.label).toBe("<1h");
  });
  test("older history rows without the new fields never guess: 2+ SRC, <36h, publisher gate left out", () => {
    const g = closestGates({ headline: "h", reason: "politics:gop", at: PICK });
    expect(g.map((x) => `${x.label}|${x.pass}`)).toEqual(["2+ SRC|true", "<36h|true", "politics:gop|false"]);
  });
  test("nothing reached 2 SRC → a single amber <2 SRC gate", () => {
    expect(closestGates(null)).toEqual([{ k: "src", label: "<2 SRC", note: "✗ ≥2", pass: false }]);
  });
  test("stale: the carried lead fails only the fresh gate (>48h)", () => {
    const g = staleGates({ sources: 2, pub: "HN" });
    expect(amber(g)).toBe(1);
    expect(g.map((x) => `${x.label} ${x.note}`)).toEqual(["2 SRC ≥2", "HN own publisher", ">48h ✗ fresh"]);
  });
});

describe("UX-1 time bar: next lead slot + fill = elapsed / total", () => {
  test.each([
    // [now IST, date, held, expected next slot IST]
    ["2026-10-16T00:16:00", "2026-10-15", false, "2026-10-16 06:11"], // mock: picked 06:21 → next pick 06:11
    ["2026-10-15T23:00:00", "2026-10-15", false, "2026-10-16 06:11"], // 02:11 never picks
    ["2026-10-16T10:00:00", "2026-10-15", false, "2026-10-16 10:11"], // missed 06 pick → catch-up slot
    ["2026-10-16T21:30:00", "2026-10-15", false, "2026-10-16 22:11"], // catch-up has no upper bound
    ["2026-10-16T08:39:00", "2026-10-16", true, "2026-10-16 10:11"], // mock: held 06:11 → next try 10:11
    ["2026-10-16T18:30:00", "2026-10-16", true, "2026-10-17 06:11"], // 21:11+ never retries a HELD date
    ["2026-10-16T14:11:00", "2026-10-16", true, "2026-10-16 18:11"], // strictly after now
    ["2026-10-16T05:00:00", "2026-10-16", true, "2026-10-16 06:11"],
  ])("%s · %s · held=%s → %s", (now, date, held, want) => {
    expect(dayHH(nextLeadSlot(ist(now), date, held))).toBe(want);
  });
  test("fill = elapsed / total, labelled with the time left", () => {
    const from = ist("2026-10-15T06:21:00");
    const to = nextLeadSlot(ist("2026-10-16T00:16:00"), "2026-10-15", false);
    expect(burn(from, to, ist("2026-10-16T00:16:00"))).toEqual({ pct: 75, left: "5h 55m" });
    expect(burn(from, to, from)).toEqual({ pct: 0, left: "23h 50m" });
    expect(burn(from, to, to + 60_000).pct).toBe(100);
    expect(burn(ist("2026-10-16T06:11:00"), ist("2026-10-16T10:11:00"), ist("2026-10-16T08:39:00"))).toEqual({ pct: 62, left: "1h 32m" });
    expect(hhmm(to)).toBe("06:11");
  });
});

describe("UX-1 fixtures from real crawl data (HELD)", () => {
  test("gnw: the real crawl minus its eligible stories → HELD, closest = a real GNews-only group with its real N SRC", () => {
    const { history, entry } = heldHistory((r) => r === GNW_ONLY);
    expect(entry.reason).toBe("held");
    expect(entry.headline).toBe(realLastPick().headline); // carries the real last pick
    expect(lastPickDate(history)).toBe(realLastPick().date);
    // Data-dependent (like "age" below): the 101922c crawl has no ≥2-SRC Google-News-only group, so there may be no candidate.
    const c = leadClosest(entry);
    if (c) {
      expect(c.reason).toBe(GNW_ONLY);
      expect(c.sources).toBeGreaterThanOrEqual(2);
      expect(c.pub).toBeUndefined();
      expect(amber(closestGates(c))).toBe(1);
    } else expect(entry.excluded ?? []).toEqual([]);
  });
  test("age: closest failed the fresh gate; none: nothing reached 2 SRC → no candidate", () => {
    const a = leadClosest(heldHistory((r) => r.startsWith("age>=")).entry);
    if (a) {
      expect(a.reason).toBe("age>=36h");
      expect(a.age_h!).toBeGreaterThanOrEqual(36);
      expect(closestGates(a).find((g) => !g.pass)?.k).toBe("fresh");
    }
    expect(leadClosest(heldHistory(() => false).entry)).toBeNull();
  });
  test("generated desk-view (real crawl): picked day → own-publisher pub, no closest; HELD day → closest from the attempt, no pub", () => {
    // The committed crawl decides which branch runs (101922c, 2026-10-19: HELD); both are real data, nothing invented.
    expect(LEAD_LAST_PICK).toBe(realLastPick().date);
    if (RAW_TODAY!.reason === "held") {
      expect(LEAD_TODAY?.pub).toBeUndefined();
      expect(LEAD_CLOSEST).toEqual(leadClosest(RAW_TODAY));
    } else {
      expect(LEAD_TODAY?.pub).toBe("HN");
      expect(withPub(RAW_TODAY)?.pub).toBe("HN");
      expect(LEAD_CLOSEST).toBeNull();
      expect(LEAD_LAST_PICK).toBe(RAW_TODAY!.date);
    }
  });
});

describe("UX-1 desk wiring + CSS", () => {
  const tsx = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
  const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
  const block = css.slice(css.indexOf("/* UX-1 clearance plate"));
  test("picked plate: gate rail (3 gates + sig) and time bar replace the meta line; Yesterday row stays", () => {
    expect(tsx).not.toContain("sage-take-meta");
    expect(tsx).toContain('aria-label="Why this is the lead: cleared 3 of 3 gates"');
    expect(tsx).toContain('<span className="take-gate take-gate-sig">sig {lead.sig ?? "—"}</span>');
    expect(tsx).toContain('a="picked" b="next pick"');
    expect(tsx).toContain('className="sage-take-yesterday sage-take-yesterday-link focus-phosphor text-sm"');
  });
  test("HELD card: SIGNAL HOLD, candidate headline wraps (headline class, no clamp), last pick → log is the log link", () => {
    expect(tsx).toContain(">SIGNAL HOLD</p>");
    expect(tsx).toMatch(/<q className="sage-headline" data-lead-closest="1">/);
    const card = tsx.slice(tsx.indexOf("function TakeHold"), tsx.indexOf("/** Beat 11 — lead log state"));
    expect(card).not.toMatch(/line-clamp|truncate/);
    expect(card).toContain('data-leadlog-link="1"');
    expect(card).toContain("last pick · {LEAD_LAST_PICK ?? lead.date} → log");
    expect(card).toContain('a="held" b="next try"');
  });
  test("time bars use useNow (no new timer)", () => {
    const brief = tsx.slice(tsx.indexOf("function Brief()"), tsx.indexOf("<BriefWire />"));
    expect(brief).toContain("const nowMs = leadNow ?? Date.parse(CRAWL_AT);");
    expect(tsx.slice(tsx.indexOf("function TakeGates"), tsx.indexOf("/** Beat 11 — lead log state"))).not.toMatch(/setInterval|setTimeout|useEffect/);
  });
  test("CSS: Skin V2 vars only, the only amber is the failed gate, ≥44px last-pick tap, candidate wraps", () => {
    expect(block.length).toBeGreaterThan(1000);
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(block.match(/var\(--pip-amber\)/g)?.length).toBe(4);
    for (const m of block.matchAll(/[^}]*var\(--pip-amber\)[^}]*\}/g)) expect(m[0]).toContain('[data-pass="0"]');
    expect(block).toContain(".take-hold-last{min-height:44px}");
    expect(block).not.toMatch(/take-hold[^{]*\{[^}]*(line-clamp|text-overflow)/);
  });
});
