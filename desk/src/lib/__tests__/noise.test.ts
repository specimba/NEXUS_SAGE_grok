import { describe, expect, test } from "bun:test";
import { decidePick, leadCandidates, leadExcludeReason } from "@/lib/lead-pick";
import { buildWire, INVESTING_NOISE, investingNoiseReason, wireCandidates, wireExcludeReason, type WireCluster } from "@/lib/wire";
import { WIRE_ROWS } from "@/data/wire";

function cl(id: string, title: string, over: Partial<WireCluster> = {}): WireCluster {
  const lead = id.replace(/^cl:/, "");
  return {
    id,
    title,
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
const PICK = "2026-09-25T03:11:00Z";

describe("investing / listicle noise", () => {
  test("listicle and stock-tip headlines are noise", () => {
    for (const t of [
      "5 AI Semiconductor Stocks to Buy and Hold Through 2031",
      "3 AI Stocks to Watch in October",
      "Nvidia price target raised to $300 by analysts",
      "OpenAI partner shares soar after AI deal",
      "10 AI stocks for the next decade",
      "Should You Buy Nvidia Before Earnings? (Motley Fool)",
      "Is This AI Stock a Buy and Hold Forever Pick?",
      "Jefferies says Meta's AI agent is not a threat to Life Time (LTH:NYSE)", // real 11:16Z crawl headline
      "Analyst lifts view on chipmaker (NASDAQ: NVDA)",
    ])
      expect(investingNoiseReason(t)).toBe("noise:investing");
    expect(INVESTING_NOISE.length).toBe(8);
  });

  test("ticker rule does not catch ordinary headlines with colons or acronyms", () => {
    for (const t of [
      "BNP Paribas inks new Google Cloud deal to advance agentic AI",
      "NYSE tests AI surveillance for market abuse",
      "Show HN: PlaceCall (YC W26) – agentic API to call businesses",
      "GPT-5: what changed (AI:ML primer)",
    ])
      expect(investingNoiseReason(t)).toBeNull();
  });

  test("real business news stays eligible: valuations, funding, IPO, deals", () => {
    for (const t of [
      "Alphabet Reportedly Values Its Anthropic Stake at $124 Billion. A $2 Trillion IPO Could Double It -- on Paper.",
      "Anthropic raises $13B Series F at $183B valuation",
      "Mistral files for IPO in Paris",
      "Anthropic to Pay Akamai Technologies $11.6 Billion Over Seven Years for Cloud Services",
      "Claude discovers a novel enzyme system with CRISPR-like repeats",
    ])
      expect(investingNoiseReason(t)).toBeNull();
  });

  test("noise rows stay out of the Wire (backfilled) and never lead; Alphabet stake story stays eligible", () => {
    const noise = cl("cl:gnews:stocks", "5 AI Semiconductor Stocks to Buy and Hold Through 2031", { at: "2026-09-25T02:30:00Z" });
    const biz = cl("cl:gnews:alphabet", "Alphabet Reportedly Values Its Anthropic Stake at $124 Billion", { at: "2026-09-25T02:00:00Z" });
    expect(wireExcludeReason(noise)).toBe("noise:investing");
    expect(wireExcludeReason(biz)).toBeNull();
    expect(buildWire([noise, biz], null, { at: "t", crawlAt: "c" }).rows.map((r) => r.id)).toEqual(["cl:gnews:alphabet"]);
    const now = Date.parse(PICK);
    expect(leadExcludeReason(noise, now)).toBe("noise:investing");
    expect(leadCandidates([noise, biz], now).map((c) => c.id)).toEqual(["cl:gnews:alphabet"]);
    // keepNoise exists only so the pick can record the exclusion
    expect(wireCandidates([noise], { keepNoise: true }).length).toBe(1);
  });

  test("pick records noise:investing for excluded candidates", () => {
    const noise = cl("cl:gnews:stocks", "3 AI Stocks to Watch", { at: "2026-09-25T02:30:00Z" });
    const biz = cl("cl:gnews:alphabet", "Alphabet values Anthropic stake", { at: "2026-09-25T02:00:00Z" });
    const d = decidePick({ schema: 1, entries: [] }, [noise, biz], { crawlAt: PICK, at: PICK });
    expect(d.action).toBe("picked");
    if (d.action !== "picked") return;
    expect(d.entry.cluster_id).toBe("cl:gnews:alphabet");
    expect(d.entry.excluded).toEqual([{ cluster_id: "cl:gnews:stocks", headline: "3 AI Stocks to Watch", reason: "noise:investing" }]);
  });

  test("generated Wire has no investing noise", () => {
    for (const r of WIRE_ROWS) expect(investingNoiseReason(r.title)).toBeNull();
  });
});
