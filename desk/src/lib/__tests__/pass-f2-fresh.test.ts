/** PASS-F2.1 acceptance 1–7 (refs/PASS-F2-FRESH-TLDR-PLAIN.md). */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildWire, wireHeader, type WireCluster } from "@/lib/wire";
import { decideLeadRefresh, leadRefreshLine, LEAD_REPICK_AFTER_H, LEAD_FRESH_AGE_H, LEAD_MAX_AGE_H, type LeadHistory, type LeadEntry } from "@/lib/lead-pick";

const CRAWL = "2026-10-23T12:00:00Z"; // 15:00 Istanbul
const hAgo = (h: number, from = CRAWL) => new Date(Date.parse(from) - h * 3_600_000).toISOString().replace(/\.\d{3}Z$/, "Z");

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
    at: hAgo(1),
    first_seen: null,
    is_new: false,
    ...over,
  };
}
const prevOf = (cs: WireCluster[]) => buildWire(cs, null, { at: "p", crawlAt: hAgo(4), backfillH: 0 });

describe("F2.1a — no dead 0 new", () => {
  test("1 · 0 new, gated rows at 2h and 5h: they show newest first; header names the newest; no '0 new'", () => {
    const old = [cl("cl:hn:1", { at: hAgo(20) }), cl("cl:hn:2", { at: hAgo(30) })];
    const r2 = cl("cl:hn:3", { at: hAgo(2) });
    const r5 = cl("cl:hn:4", { at: hAgo(5) });
    const all = [...old, r5, r2];
    const w = buildWire(all, prevOf(all), { at: CRAWL, crawlAt: CRAWL });
    expect(w.rows.map((r) => r.id)).toEqual(["cl:hn:3", "cl:hn:4"]);
    const head = wireHeader(CRAWL, w.rows);
    expect(head).toContain("no new stories this crawl · newest 2h ago");
    expect(head).not.toContain("0 new");
  });
  test("2 · 0 new and nothing gated in 6h: today's normal rows, header 'quiet · newest <n>h ago', no off-topic row", () => {
    const rows = [cl("cl:hn:1", { at: hAgo(11) }), cl("cl:hn:2", { at: hAgo(14) }), cl("cl:hn:9", { at: hAgo(1), title: "Best pizza in town" })];
    const w = buildWire(rows, prevOf(rows), { at: CRAWL, crawlAt: CRAWL });
    expect(w.rows.map((r) => r.id).sort()).toEqual(["cl:hn:1", "cl:hn:2"]);
    expect(wireHeader(CRAWL, w.rows)).toContain("quiet · newest 11h ago");
    expect(wireHeader(CRAWL, w.rows)).not.toContain("0 new");
  });
  test("3 · rows render a relative age: SSR shows absolute time, client swaps after hydration in a fixed slot", () => {
    const src = readFileSync(join(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(src).toMatch(/now == null \? istHHMM\(raw\) : compactAge\(raw, now\)/);
    expect(src).toMatch(/<AgeCell iso=\{firstAtIso\(r\)\} now=\{now\} \/>/);
    const css = readFileSync(join(import.meta.dir, "../../app/globals.css"), "utf8");
    expect(css).toMatch(/\.pulse-v5-age \{[^}]*min-width: 5ch/);
  });
});

describe("F2.1c — lead refresh within 12h", () => {
  expect(LEAD_REPICK_AFTER_H).toBe(12);
  expect(LEAD_FRESH_AGE_H).toBe(12);
  expect(LEAD_MAX_AGE_H).toBe(36);
  const lead = (pickedHAgo: number, firstHAgo: number): LeadHistory => ({
    schema: 1,
    entries: [
      {
        date: "2026-10-23",
        cluster_id: "cl:hn:old",
        headline: "Old lead",
        url: null,
        sources: 2,
        sig: null,
        reason: "picked",
        at: hAgo(pickedHAgo),
        crawl_at: hAgo(pickedHAgo),
        first_at: hAgo(firstHAgo),
      } as LeadEntry,
    ],
  });
  const fresh = cl("cl:hn:new", { at: hAgo(4), member_ids: ["hn:new", "rss:openai:new"], sources: ["hn-algolia", "rss-lab"] });
  const opts = { crawlAt: CRAWL, at: CRAWL, memberAt: { "hn:new": hAgo(4), "rss:openai:new": hAgo(4) } };
  test("4 · picked 13h ago + a 4h candidate with 2 publishers: repicked, log 'repicked'", () => {
    const d = decideLeadRefresh(lead(13, 14), [fresh], opts);
    expect(d.action).toBe("picked");
    expect(d.action === "picked" && d.entry.cluster_id).toBe("cl:hn:new");
    expect(d.action === "picked" && d.entry.supersedes).toBe("cl:hn:old");
    expect(leadRefreshLine(d.refresh!)).toBe("lead: repicked age_h=14 since_pick_h=13");
  });
  test("5 · picked 13h ago with only analyst-only / GNews-only candidates: kept", () => {
    const gn = cl("cl:gnews:a", { lead_id: "gnews:a", lead_source: "gnews-rss", member_ids: ["gnews:a", "gnews:b"], at: hAgo(3) });
    const anl = cl("cl:anl:simonw:x", { lead_id: "anl:simonw:x", lead_source: "rss-analyst", member_ids: ["anl:simonw:x", "gnews:c"], at: hAgo(3) });
    const d = decideLeadRefresh(lead(13, 14), [gn, anl], { ...opts, publishers: { "gnews:a": "Reuters", "gnews:b": "Verge", "gnews:c": "Wired" } });
    expect(d.action).toBe("none");
    expect(d.refresh?.kind).toBe("kept");
  });
  test("6 · picked 6h ago with a better candidate: kept (under 12h since pick)", () => {
    const d = decideLeadRefresh(lead(6, 8), [fresh], opts);
    expect(d.action).toBe("none");
    expect(leadRefreshLine(d.refresh!)).toBe("lead: kept age_h=8 since_pick_h=6");
  });
  test("7 · no candidate and lead over 36h: HELD notice, never invented", () => {
    const d = decideLeadRefresh(lead(20, 40), [], opts);
    expect(d.action).toBe("held");
    expect(d.action === "held" && d.entry.note).toBe("no qualifying story");
    expect(d.action === "held" && d.entry.headline).toBe("Old lead");
    expect(d.refresh?.kind).toBe("held");
  });
});

describe("F2.1 fix — Digest/Voice never freeze from the backfill", () => {
  test("rank-snapshot freezes the unlock from a backfillH:0 Wire, and re-freezes an empty same-lead snapshot", () => {
    const src = readFileSync(join(import.meta.dir, "../../../scripts/rank-snapshot.ts"), "utf8");
    expect(src).toMatch(/backfillH: 0 \}\);\n\s*const snap = buildLiveSnapshot\(\{ lead: leadNow, wire: ranked\.rows/);
    expect(src).toMatch(/unlockPrev\.leadId === leadNow\.cluster_id && unlockPrev\.rows\.length === 0/);
  });
});
