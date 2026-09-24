import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildWire,
  istanbulHHMM,
  prevRankOf,
  wireCandidates,
  wireCounts,
  wireExcludeReason,
  wireHeader,
  wireMark,
  wireStatus,
  WIRE_MAX,
  type WireCluster,
} from "@/lib/wire";

function cl(id: string, over: Partial<WireCluster> = {}): WireCluster {
  const lead = id.replace(/^cl:/, "");
  return {
    id,
    title: `Anthropic model news ${id}`,
    url: `https://example.com/${lead}`,
    lead_id: lead,
    lead_source: "hn-algolia",
    sources: ["hn-algolia", "gnews-rss"],
    member_ids: [lead, `gnews:${lead.replace(/\W/g, "")}`],
    size: 2,
    at: "2026-09-24T12:00:00Z",
    first_seen: null,
    is_new: false,
    ...over,
  };
}

describe("Beat 7 wire — row builder", () => {
  test("keeps only ≥2 independent sources; self-repost counts 0", () => {
    const solo = cl("cl:hn:1", { sources: ["hn-algolia"], member_ids: ["hn:1"], size: 1 });
    const selfOnly = cl("cl:hn:2", {
      member_ids: ["hn:2", "gnews:self"],
      members: [
        { id: "hn:2", source: "hn-algolia" },
        { id: "gnews:self", source: "gnews-rss", self_repost: true },
      ],
    });
    const multi = cl("cl:hn:3");
    const ids = wireCandidates([solo, selfOnly, multi]).map((c) => c.id);
    expect(ids).toEqual(["cl:hn:3"]);
  });

  test("never includes briefEligible:false, X, Taste, or non-AI HN/GNews rows", () => {
    const bad = cl("cl:hn:4", { briefEligible: false });
    const x = cl("cl:x:5", { lead_id: "x:5", lead_source: "x", member_ids: ["x:5", "gnews:5"] });
    const taste = cl("cl:hn:6", { member_ids: ["hn:6", "gnews:taste6"] });
    const offTopic = cl("cl:hn:7", { title: "Steve Jobs iPhone 4 antenna Q&A", url: "https://example.com/j" });
    const good = cl("cl:hn:8");
    expect(wireExcludeReason(bad)).toBe("briefEligible:false");
    expect(wireExcludeReason(x)).toBe("x");
    expect(wireExcludeReason(taste, new Set(["taste6"]))).toBe("taste");
    expect(wireExcludeReason(offTopic)).toBe("not-ai");
    const w = buildWire([bad, x, taste, offTopic, good], null, { at: "t", crawlAt: "c", tasteIds: ["taste6"] });
    expect(w.rows.map((r) => r.id)).toEqual(["cl:hn:8"]);
    expect(w.order.some((o) => o.id === "cl:hn:4")).toBe(false);
  });

  test("lab-led clusters skip the title gate (already category-filtered at ingest)", () => {
    const lab = cl("cl:rss:nvidia-dev:1", {
      title: "What's New for Game Developers: DLSS 5",
      lead_id: "rss:nvidia-dev:1",
      lead_source: "rss-lab",
      member_ids: ["rss:nvidia-dev:1", "hn:99"],
    });
    expect(wireExcludeReason(lab)).toBeNull();
  });

  test("order: more sources → fresher → higher signal; capped at WIRE_MAX", () => {
    const three = cl("cl:hn:10", { at: "2026-09-24T01:00:00Z", member_ids: ["hn:10", "gnews:10", "rss:openai:10"] });
    const older = cl("cl:hn:11", { at: "2026-09-24T02:00:00Z" });
    const fresh = cl("cl:hn:12", { at: "2026-09-24T09:00:00Z" });
    const tieLo = cl("cl:hn:13", { at: "2026-09-24T05:00:00Z" });
    const tieHi = cl("cl:hn:14", { at: "2026-09-24T05:00:00Z" });
    const ids = wireCandidates([older, tieLo, fresh, three, tieHi], { scores: { "hn:13": 5, "hn:14": 50 } }).map((c) => c.id);
    expect(ids).toEqual(["cl:hn:10", "cl:hn:12", "cl:hn:14", "cl:hn:13", "cl:hn:11"]);
    const many = Array.from({ length: 9 }, (_, k) => cl(`cl:hn:2${k}`));
    expect(buildWire(many, null, { at: "t", crawlAt: "c" }).rows.length).toBe(WIRE_MAX);
    expect(buildWire(many, null, { at: "t", crawlAt: "c" }).order.length).toBe(9);
  });
});

describe("Beat 7 wire — prev-snapshot diff", () => {
  const a = cl("cl:hn:1", { at: "2026-09-24T09:00:00Z" });
  const b = cl("cl:hn:2", { at: "2026-09-24T08:00:00Z" });
  const c = cl("cl:hn:3", { at: "2026-09-24T07:00:00Z" });

  test("NEW / ▲ / ▼ against the previous crawl", () => {
    const prev = buildWire([a, b, c], null, { at: "t0", crawlAt: "c0" });
    // next crawl: b got fresher (now #1), a slips to #2, d is new
    const b2 = { ...b, at: "2026-09-24T10:00:00Z" };
    const d = cl("cl:hn:4", { at: "2026-09-24T06:00:00Z" });
    const cur = buildWire([a, b2, c, d], prev, { at: "t1", crawlAt: "c1" });
    const by = Object.fromEntries(cur.rows.map((r) => [r.id, r]));
    expect(by["cl:hn:2"].status).toBe("up");
    expect(wireMark(by["cl:hn:2"])).toBe("▲1");
    expect(by["cl:hn:1"].status).toBe("down");
    expect(wireMark(by["cl:hn:1"])).toBe("▼1");
    expect(by["cl:hn:3"].status).toBe("same");
    expect(by["cl:hn:4"].status).toBe("new");
    expect(wireCounts(cur.rows)).toEqual({ fresh: 1, moved: 2 });
  });

  test("cluster re-keyed (lead changed) still matches prev by shared member", () => {
    const prev = buildWire([a], null, { at: "t0", crawlAt: "c0" });
    const rekeyed = { ...a, id: "cl:gnews:x", member_ids: [...a.member_ids] };
    expect(prevRankOf(prev, rekeyed)).toBe(1);
  });

  test("no prev snapshot: falls back to seen-index is_new, nothing moves", () => {
    expect(wireStatus(1, null, false, true)).toBe("new");
    expect(wireStatus(1, null, false, false)).toBe("same");
    const w = buildWire([a, { ...b, is_new: true }], null, { at: "t", crawlAt: "c" });
    expect(wireCounts(w.rows)).toEqual({ fresh: 1, moved: 0 });
  });

  test("header: crawl HH:MM in Istanbul (UTC+3) · N new · M moved", () => {
    expect(istanbulHHMM("2026-09-24T22:00:34Z")).toBe("01:00");
    expect(wireHeader("2026-09-24T22:00:34Z", [{ status: "new" }, { status: "up" }, { status: "same" }])).toBe(
      "WIRE · crawl 01:00 UTC+3 · 1 new · 1 moved",
    );
  }, 30_000); // first tz-aware Intl formatter can be slow under load
});

describe("Beat 7 wire — daily lead exclusion", () => {
  test("current daily lead is never on the Wire; backfills to 5; no fake ▲ from its removal", () => {
    const six = Array.from({ length: 6 }, (_, k) => cl(`cl:hn:${k + 1}`, { at: `2026-09-24T1${k}:00:00Z` }));
    const prev = buildWire(six, null, { at: "t0", crawlAt: "c0" });
    expect(prev.rows.map((r) => r.id)).toEqual(["cl:hn:6", "cl:hn:5", "cl:hn:4", "cl:hn:3", "cl:hn:2"]);
    const cur = buildWire(six, prev, { at: "t1", crawlAt: "c1", excludeIds: ["cl:hn:4"] });
    expect(cur.rows.map((r) => r.id)).toEqual(["cl:hn:6", "cl:hn:5", "cl:hn:3", "cl:hn:2", "cl:hn:1"]);
    expect(cur.rows.length).toBe(WIRE_MAX);
    expect(cur.order.some((o) => o.id === "cl:hn:4")).toBe(false);
    // hn:1 was #6 in prev order → #5 once the lead is dropped from both sides ⇒ same, not ▲
    expect(cur.rows.map((r) => r.status)).toEqual(["same", "same", "same", "same", "same"]);
  });

  test("generated WIRE_ROWS never contain today's daily lead", async () => {
    const { WIRE_ROWS } = await import("@/data/wire");
    const { LEAD_TODAY } = await import("@/data/lead-pick");
    if (LEAD_TODAY?.cluster_id) expect(WIRE_ROWS.some((r) => r.id === LEAD_TODAY.cluster_id)).toBe(false);
  });
});

describe("Beat 7 wire — generated data + placement", () => {
  test("generated WIRE_ROWS: 1–5 rows, all ≥2 SRC, no X / taste ids", async () => {
    const { WIRE_ROWS } = await import("@/data/wire");
    expect(WIRE_ROWS.length).toBeGreaterThan(0);
    expect(WIRE_ROWS.length).toBeLessThanOrEqual(WIRE_MAX);
    for (const r of WIRE_ROWS) {
      expect(r.sources).toBeGreaterThanOrEqual(2);
      expect(r.member_ids.some((m) => m.startsWith("x:"))).toBe(false);
    }
  });

  test("Brief renders the Wire under the Take, daily lead in the Take; CSS has no hex", () => {
    const tsx = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    const brief = tsx.slice(tsx.indexOf("function Brief()"));
    const take = brief.indexOf("sage-take-inverse");
    const wire = brief.indexOf("<BriefWire />");
    const pins = brief.indexOf("byCorroboration(CYCLE.pins)");
    expect(take).toBeGreaterThan(0);
    expect(wire).toBeGreaterThan(take);
    expect(pins).toBeGreaterThan(wire);
    expect(brief).toContain("LEAD_TODAY");
    expect(brief).toContain("LEAD_YESTERDAY");
    // right rail: old hf-incident pin demoted to "cycle 003 context", listed after companion/rest, no lead frame
    expect(brief).toContain("cycle 003 context");
    expect(brief).not.toContain("cycle pin");
    expect(brief).toContain("rail · cyc/003 board");
    expect(brief).toContain("CYC/003 board · three waves");
    expect(brief.slice(0, brief.indexOf("function Pulse") > 0 ? brief.indexOf("function Pulse") : undefined)).not.toContain("sage-lead-frame");
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* Beat 7 — Brief Wire strip"));
    expect(block.length).toBeGreaterThan(100);
    expect(/#[0-9a-f]{3,8}\b/i.test(block)).toBe(false);
  });
});
