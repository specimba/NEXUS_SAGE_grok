import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GnewsRssRow } from "@/data/gnews-rss";
import type { HnPulseRow } from "@/data/hn-pulse";
import type { PulseClusterRow } from "@/data/pulse-clusters";
import fx from "./fixtures/enzyme-2026-09-24T2213Z.json";
import { corroborationMultiplier, countSources } from "@/lib/corroboration";
import { groupFirstAt } from "@/lib/lead-pick";
import { buildRows, compactAge, independentPublishers, publisherKey, type PulseMemberInfo } from "@/lib/pulse-v5";
import { scoreContribution } from "@/lib/story-drawer";

// Frozen real crawl (22:13Z) — live 4h crawls rotate GNews members out, so tests pin a snapshot.
const enzyme = fx.cluster as unknown as PulseClusterRow;
const HN_PULSE = fx.hn as unknown as HnPulseRow[];
const GNEWS_RSS = fx.gnews as unknown as GnewsRssRow[];
const PULSE_CLUSTERS_AT = fx.crawl_at;
const pubOf = (id: string) => GNEWS_RSS.find((g) => g.id === id)?.publisher ?? null;

describe("N SRC = distinct independent publishers", () => {
  test("publisher keys: HN one publisher, labs by lab, GNews by publisher (case-insensitive), X per handle", () => {
    expect(publisherKey("hn:1")).toBe("hn");
    expect(publisherKey("hn:2", "hn/someone")).toBe("hn");
    expect(publisherKey("rss:deepmind:abc")).toBe("lab:deepmind");
    expect(publisherKey("rss-sec:ncc:abc")).toBe("lab:ncc");
    expect(publisherKey("gnews:a", "Reuters")).toBe("pub:reuters");
    expect(publisherKey("gnews:b", " reuters ")).toBe("pub:reuters");
    expect(publisherKey("gnews:c")).toBe("gnews:c");
    expect(publisherKey("x:1", "@Amir")).toBe("x:@amir");
  });

  test("real Claude enzyme group = 3 SRC (HN + Al Jazeera + Digital Watch; Anthropic self-repost 0) ⇒ ×1.30", () => {
    const pubs = independentPublishers(enzyme, pubOf);
    expect([...pubs].sort()).toEqual(["hn", "pub:al jazeera", "pub:digital watch observatory"]);
    const members: Record<string, PulseMemberInfo> = {};
    for (const h of HN_PULSE) members[h.id] = { badge: "HN", publisher: `hn/${h.author}` };
    for (const g of GNEWS_RSS) members[g.id] = { badge: "GNW", publisher: g.publisher };
    const row = buildRows([enzyme], members).rows[0]!;
    expect(row.sourceCount).toBe(3);
    expect(corroborationMultiplier(row.sourceCount)).toBeCloseTo(1.3, 5);
    expect(scoreContribution(row.sourceCount)).toBe("score contribution ×1.30 (3 SRC)");
  });

  test("same publisher twice counts once; self-repost counts 0", () => {
    const c = {
      id: "cl:t",
      title: "t",
      url: "u",
      lead_id: "gnews:1",
      lead_source: "gnews-rss",
      sources: ["gnews-rss"],
      member_ids: ["gnews:1", "gnews:2", "gnews:3"],
      members: [
        { id: "gnews:1", source: "gnews-rss", publisher: "Reuters" },
        { id: "gnews:2", source: "gnews-rss", publisher: "REUTERS" },
        { id: "gnews:3", source: "gnews-rss", publisher: "OpenAI", self_repost: true as const },
      ],
      size: 3,
      at: "2026-09-24T10:00:00Z",
      first_seen: null,
      is_new: false,
    };
    expect(independentPublishers(c).size).toBe(1);
    expect(buildRows([c], {}).rows[0]!.multiSource).toBe(false);
  });

  test("generated Wire uses publisher counts (enzyme 3 SRC, frozen 2016b72 wire row)", () => {
    expect(fx.wire_row?.sources).toBe(3);
  });

  test("corroboration crawl hits count per publisher when publishers are given", () => {
    const item = { id: "hf-swarm", kind: "rest" as const, refs: [{ href: "https://x.com/someone/status/1" }] };
    const cl = [{ id: "c", title: "Hugging Face incident widens", sources: ["hn-algolia", "gnews-rss"], publishers: ["hn", "pub:reuters", "pub:the verge"] }];
    const r = countSources(item, cl);
    expect(r.keys).toEqual(["crawl:hn", "crawl:pub:reuters", "crawl:pub:the verge", "x:@someone"]);
    expect(r.n).toBe(4);
    const legacy = countSources(item, [{ ...cl[0]!, publishers: undefined }]);
    expect(legacy.n).toBe(3);
  });
});

describe("story age = earliest member item", () => {
  test("enzyme group shows its first-item age (>24h at crawl time), not the hours of its freshest repost", () => {
    const memberAt: Record<string, string> = {};
    for (const h of HN_PULSE) memberAt[h.id] = h.at;
    for (const g of GNEWS_RSS) memberAt[g.id] = g.published;
    const now = Date.parse(PULSE_CLUSTERS_AT);
    const first = groupFirstAt(enzyme, memberAt);
    // crawl-stamp independent (the 4h routine moves PULSE_CLUSTERS_AT): first item 2026-09-23T18:06:47Z
    expect(new Date(first).toISOString()).toBe("2026-09-23T18:06:47.000Z");
    const ageH = (now - first) / 3_600_000;
    expect(ageH).toBeGreaterThan(24);
    expect(compactAge(enzyme.at, now)).not.toBe(compactAge(new Date(first).toISOString(), now));
  });

  test("Pulse AGE, drawer kicker and Wire age use firstAtIso; status bar shows the lead headline, id only in title", () => {
    const tsx = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(tsx).toContain("firstAtIso(clusterById.get(r.id)!)");
    expect(tsx).toContain("compactAge(firstAtIso(cluster), now)");
    expect(tsx).toContain("<AgeCell iso={firstAtIso(r)} now={now} />"); // Wire: absolute until mount, then relative
    expect(tsx).not.toContain("lead {LEAD_TODAY?.cluster_id");
    // Both spots (INGEST line + status-bar ticker) render through LeadInline: headline, id only in title (HELD → muted HELD text).
    expect(tsx.match(/className="desk-lead-headline" title=\{`lead \$\{view\.id/g)?.length).toBe(1);
    expect(tsx.match(/<LeadInline view=\{leadV\} \/>/g)?.length).toBe(2);
  });
});
