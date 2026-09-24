import { describe, expect, test } from "bun:test";
import {
  buildRows,
  compactAge,
  healthCellState,
  healthTicks,
  isBaseline,
  sigCell,
  type ClusterInput,
  type PulseMemberInfo,
} from "@/lib/pulse-v5";
import { PULSE_CLUSTERS } from "@/data/pulse-clusters";

const NOW = Date.parse("2026-09-24T21:18:09Z");

function cl(id: string, over: Partial<ClusterInput> = {}): ClusterInput {
  return {
    id: `cl:${id}`,
    title: id,
    url: `https://x.test/${id}`,
    lead_id: id,
    lead_source: "rss-lab",
    sources: ["rss-lab"],
    member_ids: [id],
    size: 1,
    at: "2026-09-24T20:00:00Z",
    first_seen: "2026-09-24T21:18:09Z",
    is_new: false,
    ...over,
  };
}

const MEMBERS: Record<string, PulseMemberInfo> = {
  a: { badge: "OAI", publisher: "openai" },
  b: { badge: "HN", publisher: "hn/pg", score: 420 },
  c: { badge: "GNW", publisher: "Reuters" },
  d: { badge: "SEC", publisher: "trailofbits", security: true },
};

describe("pulse-v5 baseline guard", () => {
  test("> 40% NEW ⇒ baseline", () => {
    expect(isBaseline([true, true, false, false, false])).toBe(false); // 40% exactly
    expect(isBaseline([true, true, true, false, false])).toBe(true);
    expect(isBaseline([])).toBe(false);
  });

  test("rare NEW renders from is_new; baseline hides every plate", () => {
    const rare = buildRows(
      [cl("a", { is_new: true }), cl("b"), cl("c"), cl("d")],
      MEMBERS,
    );
    expect(rare.baseline).toBe(false);
    expect(rare.rows.filter((r) => r.showNew).map((r) => r.id)).toEqual(["cl:a"]);
    const first = buildRows([cl("a", { is_new: true }), cl("b", { is_new: true }), cl("c")], MEMBERS);
    expect(first.baseline).toBe(true);
    expect(first.newCount).toBe(2);
    expect(first.rows.some((r) => r.showNew)).toBe(false);
  });

  test("current Beat 2 snapshot (first crawl) is baseline", () => {
    const members: Record<string, PulseMemberInfo> = {};
    const { baseline } = buildRows(PULSE_CLUSTERS, members);
    const share = PULSE_CLUSTERS.filter((c) => c.is_new).length / Math.max(1, PULSE_CLUSTERS.length);
    expect(baseline).toBe(share > 0.4);
  });
});

describe("pulse-v5 badges", () => {
  test("single-source row (same publisher twice): one badge, no also line", () => {
    const { rows } = buildRows(
      [cl("c", { lead_source: "gnews-rss", sources: ["gnews-rss"], member_ids: ["c", "c2"], size: 2 })],
      { ...MEMBERS, c2: { badge: "GNW", publisher: "reuters" } },
    );
    expect(rows[0].multiSource).toBe(false);
    expect(rows[0].sourceCount).toBe(1);
    // N SRC counts publishers, not source classes: Reuters + AP via Google News = 2 SRC
    const two = buildRows(
      [cl("c", { lead_source: "gnews-rss", sources: ["gnews-rss"], member_ids: ["c", "c2"], size: 2 })],
      { ...MEMBERS, c2: { badge: "GNW", publisher: "AP" } },
    ).rows[0];
    expect(two.sourceCount).toBe(2);
    expect(two.multiSource).toBe(true);
    expect(rows[0].leadBadge).toBe("GNW");
    expect(rows[0].alsoBadges).toEqual([]);
    expect(rows[0].alsoPublishers).toEqual([]);
  });

  test("multi-source cluster leads, carries also badges, max score, SEC flag", () => {
    const multi = cl("a", {
      sources: ["rss-lab", "hn-algolia", "gnews-rss", "rss-security"],
      member_ids: ["a", "b", "c", "d"],
      size: 4,
      at: "2026-09-20T00:00:00Z",
    });
    const { rows } = buildRows([cl("x", { at: "2026-09-24T21:00:00Z" }), multi], MEMBERS);
    expect(rows[0].id).toBe("cl:a");
    expect(rows[0].leadBadge).toBe("OAI");
    expect(rows[0].alsoBadges).toEqual(["HN", "GNW", "SEC"]);
    expect(rows[0].alsoPublishers).toEqual(["hn/pg", "Reuters", "trailofbits"]);
    expect(rows[0].score).toBe(420);
    expect(rows[0].security).toBe(true);
  });
});

describe("pulse-v5 age + health", () => {
  test("compact HN-style age", () => {
    expect(compactAge("2026-09-24T20:37:09Z", NOW)).toBe("41m");
    expect(compactAge("2026-09-24T19:18:09Z", NOW)).toBe("2h");
    expect(compactAge("2026-09-21T21:18:09Z", NOW)).toBe("3d");
    expect(compactAge("2018-08-23T03:05:16Z", NOW)).toBe("8y");
    expect(compactAge("nope", NOW)).toBe("—");
  });

  test("ledger state → cell state; OpenAlex fail stays fail", () => {
    expect(healthCellState("ok")).toBe("ok");
    expect(healthCellState("flaky")).toBe("soft");
    expect(healthCellState("fail")).toBe("fail");
    expect(healthTicks(1)).toBe(1);
    expect(healthTicks(9)).toBe(5);
    expect(healthTicks(-1)).toBe(0);
  });
});

describe("pulse-v5 SIG column", () => {
  test("HN points and X likes render as plain integers; no-score is dim —", () => {
    expect(sigCell({ score: 247 })).toEqual({ text: "247", dim: false });
    expect(sigCell({ score: 3 })).toEqual({ text: "3", dim: false });
    expect(sigCell({ score: 0 })).toEqual({ text: "0", dim: false });
    expect(sigCell({ score: null })).toEqual({ text: "—", dim: true });
  });

  test("built rows: multi-member GNews and SEC rows without score show — (no ×N / SEC / ·)", () => {
    const { rows } = buildRows(
      [
        cl("c", { lead_source: "gnews-rss", sources: ["gnews-rss"], member_ids: ["c", "c2"], size: 2 }),
        cl("d", { lead_source: "rss-security", sources: ["rss-security"] }),
        cl("b", { lead_source: "hn-algolia", sources: ["hn-algolia"] }),
      ],
      { ...MEMBERS, c2: { badge: "GNW", publisher: "AP" } },
    );
    const byId = Object.fromEntries(rows.map((r) => [r.id, sigCell(r).text]));
    expect(byId).toEqual({ "cl:c": "—", "cl:d": "—", "cl:b": "420" });
    for (const r of rows) expect(sigCell(r).text).toMatch(/^(\d+|—)$/);
  });
});
