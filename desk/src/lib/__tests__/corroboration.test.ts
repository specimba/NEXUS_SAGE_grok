import { describe, expect, test } from "bun:test";
import {
  corroborationMultiplier,
  countSources,
  crawlHits,
  diffSnapshots,
  eligibleForBriefDigest,
  rankBelowLead,
  sourceKey,
  rawSourceKey,
  toSnapshot,
  type RankableItem,
} from "@/lib/corroboration";
import { CYCLE } from "@/data/cycle";
import { DIGEST_ITEMS } from "@/data/digest-pack";
import { X_TASTE } from "@/data/x-taste";
import { HN_PULSE } from "@/data/hn-pulse";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { RSS_LABS } from "@/data/rss-labs";
import { RSS_SECURITY } from "@/data/rss-security";
import { PULSE_CLUSTERS } from "@/data/pulse-clusters";
import { SHELF } from "@/data/shelf";
import { RANK_CURRENT } from "@/data/corroboration-rank";

const item = (id: string, over: Partial<RankableItem> = {}): RankableItem => ({
  id,
  kind: "rest",
  confidence: "high",
  refs: [],
  ...over,
});
const x = (h: string) => ({ href: `https://x.com/${h}/status/1` });

describe("corroboration multiplier", () => {
  test("1 + 0.15 × (n − 1), capped at ×1.45", () => {
    expect(corroborationMultiplier(1)).toBe(1);
    expect(corroborationMultiplier(2)).toBeCloseTo(1.15);
    expect(corroborationMultiplier(3)).toBeCloseTo(1.3);
    expect(corroborationMultiplier(4)).toBeCloseTo(1.45);
    expect(corroborationMultiplier(9)).toBe(1.45);
    expect(corroborationMultiplier(0)).toBe(1);
  });

  test("source keys: host, X per handle", () => {
    expect(sourceKey("https://x.com/Amir/status/1")).toBe("x:@amir");
    expect(sourceKey("https://www.aisle.com/blog/a")).toBe("co:aisle");
    expect(rawSourceKey("https://www.aisle.com/blog/a")).toBe("aisle.com");
    expect(sourceKey("https://techcrunch.com/2026/09/23/x")).toBe("techcrunch.com");
    expect(sourceKey("nope")).toBeNull();
    expect(countSources(item("a", { refs: [x("a"), x("a"), x("b")] })).n).toBe(2);
  });
});

describe("rank below lead", () => {
  test("more sources rank higher below the lead; lead never displaced", () => {
    const rows = rankBelowLead(
      [
        item("hf-incident", { kind: "lead", refs: [x("one")] }),
        item("solo", { refs: [x("a")] }),
        item("wide", { refs: [x("a"), x("b"), x("c"), { href: "https://aisle.com/x" }, { href: "https://e.org" }] }),
      ],
      { leadId: "hf-incident" },
    );
    expect(rows.map((r) => r.id)).toEqual(["hf-incident", "wide", "solo"]);
    expect(rows[0]).toMatchObject({ rank: 1, lead: true });
    const wide = rows.find((r) => r.id === "wide")!;
    expect(wide).toMatchObject({ rank: 2, base_rank: 3, sources: 5, mult: 1.45 });
  });

  test("lead stays rank 1 even when a lower item has max corroboration", () => {
    const many = [x("a"), x("b"), x("c"), x("d"), x("e")];
    const rows = rankBelowLead([item("big", { refs: many }), item("hf-swarm", { kind: "lead" })]);
    expect(rows[0].id).toBe("hf-swarm");
    expect(rows[1].id).toBe("big");
  });

  test("capped ×1.45 lets a medium item pass a 2-source high item by one slot only", () => {
    const many = Array.from({ length: 12 }, (_, i) => x(`h${i}`));
    const rows = rankBelowLead([
      item("hf-incident", { kind: "lead" }),
      item("high2", { refs: [x("a"), x("b")] }),
      item("med", { confidence: "medium", refs: many }),
    ]);
    // 0.8 × 1.45 = 1.16 > 1.0 × 1.15 → moves by exactly one slot
    expect(rows.map((r) => r.id)).toEqual(["hf-incident", "med", "high2"]);
    expect(rows[1].mult).toBe(1.45);
  });

  test("crawl signatures: GPT-6 Astra corroborates astra-depth; Google Project Astra does not", () => {
    const hits = crawlHits("astra-depth", [
      { id: "c1", title: "GPT-6 Astra has gained the ability to drive a car", sources: ["hn-algolia"] },
      { id: "c2", title: "Google shows Project Astra on Gemini glasses", sources: ["gnews-rss"] },
      { id: "c3", title: "the snack aisle is gone", sources: ["gnews-rss"] },
    ]);
    expect(hits.map((h) => h.id)).toEqual(["c1"]);
    expect(crawlHits("aisle-curl", [{ id: "c3", title: "the snack aisle is gone", sources: ["hn-algolia"] }])).toEqual([]);
  });
});

describe("eligibility — nothing briefEligible:false in Brief or Digest", () => {
  test("filter drops briefEligible:false and drop kinds", () => {
    const kept = eligibleForBriefDigest([
      item("ok"),
      item("taste", { briefEligible: false }),
      item("dropme", { kind: "drop" }),
    ]);
    expect(kept.map((k) => k.id)).toEqual(["ok"]);
    const rows = rankBelowLead([item("hf-incident", { kind: "lead" }), item("taste", { briefEligible: false })]);
    expect(rows.map((r) => r.id)).toEqual(["hf-incident"]);
  });

  test("Brief pins, Digest items and the rank snapshot contain no Taste/Pulse/shelf ids", () => {
    const ineligible = new Set<string>([
      ...X_TASTE.items.map((i) => i.id),
      ...HN_PULSE.map((i) => i.id),
      ...GNEWS_RSS.map((i) => i.id),
      ...RSS_LABS.map((i) => i.id),
      ...RSS_SECURITY.map((i) => i.id),
      ...PULSE_CLUSTERS.map((i) => i.id),
      ...SHELF.map((i) => (i as { id?: string; url?: string }).id ?? (i as { url?: string }).url ?? ""),
    ]);
    expect(X_TASTE.briefEligible).toBe(false);
    for (const p of CYCLE.pins) expect(ineligible.has(p.id)).toBe(false);
    for (const d of DIGEST_ITEMS) {
      expect(ineligible.has(d.id)).toBe(false);
      expect((d as { briefEligible?: boolean }).briefEligible).not.toBe(false);
    }
    for (const r of RANK_CURRENT.rows) {
      expect(ineligible.has(r.id)).toBe(false);
      expect(DIGEST_ITEMS.some((d) => d.id === r.id && d.kind !== "drop")).toBe(true);
    }
  });

  test("real data: lead pinned hf, lock holds", () => {
    const rows = rankBelowLead(DIGEST_ITEMS, { clusters: PULSE_CLUSTERS });
    expect(rows[0].lead).toBe(true);
    expect(rows[0].id).toMatch(/hf/);
    expect(RANK_CURRENT.lead_id).toBe("hf-incident");
    expect(RANK_CURRENT.rows[0]).toMatchObject({ rank: 1, lead: true });
  });
});

describe("moved since last crawl", () => {
  test("new / up / down / gone vs previous snapshot", () => {
    const prev = toSnapshot(
      rankBelowLead([item("hf-incident", { kind: "lead" }), item("a", { refs: [x("1"), x("2")] }), item("b"), item("c")]),
      "t0",
      "c0",
    );
    const cur = toSnapshot(
      rankBelowLead([item("hf-incident", { kind: "lead" }), item("a"), item("b", { refs: [x("1"), x("2"), x("3")] }), item("d")]),
      "t1",
      "c1",
    );
    const d = Object.fromEntries(diffSnapshots(prev, cur).map((m) => [m.id, m]));
    expect(d["hf-incident"].status).toBe("same");
    expect(d.b).toMatchObject({ status: "up", prev_rank: 3, rank: 2, prev_sources: 1, sources: 3, by_corroboration: true });
    expect(d.a).toMatchObject({ status: "down", prev_rank: 2, rank: 3 });
    expect(d.d.status).toBe("new");
    expect(d.c.status).toBe("gone");
    expect(diffSnapshots(null, cur).every((m) => m.status === "new")).toBe(true);
  });
});
