/**
 * WIRE-copy dedupe (outlets only), GNW×N chips (Σ = N SRC), customer-deal lead filter.
 */
import { describe, expect, test } from "bun:test";
import { PULSE_CLUSTERS } from "@/data/pulse-clusters";
import { WIRE_ROWS } from "@/data/wire";
import { memberInfo } from "@/lib/member-info";
import {
  buildRows,
  chipLabel,
  headlineSimilarity,
  independentPublishers,
  isWireCopy,
  sourceUnits,
  WIRE_COPY_SIM,
  type ClusterInput,
  type PulseMemberInfo,
} from "@/lib/pulse-v5";
import { CUSTOMER_DEAL, customerDealReason, leadCandidates, leadExcludeReason } from "@/lib/lead-pick";
import { wireCandidates } from "@/lib/wire";

const T0 = "2026-09-25T08:00:00Z";
const plus = (min: number) => new Date(Date.parse(T0) + min * 60_000).toISOString();

function cluster(ids: string[], over: Partial<ClusterInput> = {}): ClusterInput {
  return {
    id: `cl:${ids[0]}`,
    title: "OpenAI launches GPT-6 with native agents",
    url: "https://example.com",
    lead_id: ids[0]!,
    lead_source: "gnews-rss",
    sources: ["gnews-rss"],
    member_ids: ids,
    size: ids.length,
    at: T0,
    first_seen: null,
    is_new: false,
    ...over,
  };
}
const info = (entries: Record<string, Partial<PulseMemberInfo>>): Record<string, PulseMemberInfo> =>
  Object.fromEntries(Object.entries(entries).map(([id, v]) => [id, { badge: id.startsWith("hn:") ? "HN" : id.startsWith("rss:") ? "DMD" : "GNW", publisher: "", ...v }]));
const count = (c: ClusterInput, m: Record<string, PulseMemberInfo>) => buildRows([c], m).rows[0]!.sourceCount;

describe("WIRE copies — news outlets only", () => {
  const near = { a: "OpenAI launches GPT-6 with native agents - Reuters", b: "OpenAI launches GPT-6 with native agents, says CEO - Bloomberg" };

  test(`threshold: Dice ≥ ${WIRE_COPY_SIM} on normalized tokens (publisher suffix + stopwords dropped)`, () => {
    expect(headlineSimilarity(near.a, near.b)).toBeGreaterThanOrEqual(0.8); // 14/16 = 0.875
    expect(headlineSimilarity("OpenAI launches GPT-6", "OpenAI launches GPT-6 - Reuters")).toBe(1);
    expect(headlineSimilarity("OpenAI launches GPT-6 with agents", "Google launches Gemini 4 with agents")).toBeLessThan(0.8);
  });

  test("near-identical outlet pair within 2h counts ONE source; marked as WIRE copies", () => {
    const c = cluster(["gnews:a", "gnews:b"]);
    const m = info({ "gnews:a": { publisher: "Reuters", title: near.a, at: T0 }, "gnews:b": { publisher: "Bloomberg", title: near.b, at: plus(90) } });
    const r = buildRows([c], m).rows[0]!;
    expect(r.sourceCount).toBe(1);
    expect(r.wireCopyIds.sort()).toEqual(["gnews:a", "gnews:b"]);
    expect(r.chips).toEqual([{ badge: "GNW", n: 1 }]);
  });

  test("same pair 3h apart counts 2", () => {
    const c = cluster(["gnews:a", "gnews:b"]);
    const m = info({ "gnews:a": { publisher: "Reuters", title: near.a, at: T0 }, "gnews:b": { publisher: "Bloomberg", title: near.b, at: plus(180) } });
    expect(count(c, m)).toBe(2);
    expect(buildRows([c], m).rows[0]!.chips.map(chipLabel)).toEqual(["GNW×2"]);
  });

  test("different headlines count 2 (BNP pair: 'inks new Google Cloud deal' vs 'forges agentic AI partnership')", () => {
    const c = cluster(["gnews:x", "gnews:y"]);
    const m = info({
      "gnews:x": { publisher: "FinTech Futures", title: "BNP Paribas inks new Google Cloud deal to advance agentic AI deployment - FinTech Futures", at: "2026-09-25T10:31:52Z" },
      "gnews:y": { publisher: "Finextra Research", title: "BNP Paribas forges agentic AI partnership with Google Cloud - Finextra Research", at: "2026-09-25T09:01:00Z" },
    });
    expect(count(c, m)).toBe(2);
  });

  test("Gemini 3.8 TTS: HN 4 min after DeepMind's post, same headline → stays 2 SRC (never HN, never lab feeds)", () => {
    const c = cluster(["rss:deepmind:81481aa316e38773", "hn:49817615"], { lead_source: "rss-lab", title: "Gemini 3.8 text-to-speech says hello" });
    const m = info({
      "rss:deepmind:81481aa316e38773": { publisher: "deepmind", title: "Gemini 3.8 text-to-speech says hello", at: "2026-09-23T15:25:14Z" },
      "hn:49817615": { publisher: "hn/x", title: "Gemini 3.8 text-to-speech", at: "2026-09-23T15:29:23Z" },
    });
    expect(count(c, m)).toBe(2);
    // …and even an identical HN title / lab title vs an outlet copy is never folded
    expect(isWireCopy({ title: "A B C D", at: T0 }, { title: "A B C D", at: T0 })).toBe(true);
    const lab = cluster(["rss:openai:1", "gnews:1"], { lead_source: "rss-lab" });
    const lm = info({ "rss:openai:1": { publisher: "openai", title: near.a, at: T0 }, "gnews:1": { publisher: "Reuters", title: near.a, at: T0 } });
    expect(count(lab, lm)).toBe(2);
    // the real cluster on current data
    const real = PULSE_CLUSTERS.find((x) => x.id === "cl:rss:deepmind:81481aa316e38773");
    if (real) expect(count(real, memberInfo())).toBe(2);
  });

  test("dedupe reaches every N SRC consumer: Wire gate, corroboration keys, lead eligibility", () => {
    const c = { ...cluster(["gnews:a", "gnews:b"]), briefEligible: true };
    const m = info({ "gnews:a": { publisher: "Reuters", title: near.a, at: T0 }, "gnews:b": { publisher: "Bloomberg", title: near.b, at: plus(30) } });
    expect(independentPublishers(c, (id) => m[id]?.publisher, (id) => m[id]).size).toBe(1);
    expect(wireCandidates([c], { members: m })).toEqual([]); // 1 SRC < Wire minimum
    expect(leadCandidates([c], Date.parse(plus(60)), { members: m })).toEqual([]);
    expect(sourceUnits(c, (id) => m[id]?.publisher).length).toBe(2); // without titles/times: no dedupe
  });
});

describe("SRC chips — Σ chips = N SRC on current data", () => {
  const m = memberInfo();
  const { rows } = buildRows(PULSE_CLUSTERS, m);

  test("every Pulse row: chip counts add up to sourceCount; SELF never counted", () => {
    expect(rows.length).toBeGreaterThan(20);
    for (const r of rows) expect(r.chips.reduce((a, c) => a + c.n, 0)).toBe(r.sourceCount);
    expect(rows.some((r) => r.chips.some((c) => c.n > 1))).toBe(true); // a real GNW×N exists
  });

  test("every generated Wire row: N SRC equals the client chip sum (same unit logic both sides)", () => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const w of WIRE_ROWS) {
      const r = byId.get(w.id)!;
      expect(r.chips.reduce((a, c) => a + c.n, 0)).toBe(w.sources);
    }
  });

  test("label: HN GNW×2 for 3 SRC", () => {
    expect([{ badge: "HN", n: 1 }, { badge: "GNW", n: 2 }].map(chipLabel).join(" ")).toBe("HN GNW×2");
  });
});

describe("customer-deal announcements — LEAD only, subject must be a non-vendor", () => {
  test("BNP Paribas inks new Google Cloud deal → noise:customer-deal", () => {
    expect(customerDealReason("BNP Paribas inks new Google Cloud deal to advance agentic AI deployment")).toBe(CUSTOMER_DEAL);
    expect(customerDealReason("BNP Paribas forges agentic AI partnership with Google Cloud")).toBe(CUSTOMER_DEAL);
    expect(customerDealReason("Walmart selects OpenAI for store assistants")).toBe(CUSTOMER_DEAL);
    expect(customerDealReason("Siemens taps NVIDIA for factory AI")).toBe(CUSTOMER_DEAL);
    expect(customerDealReason("Accenture expands partnership with Anthropic")).toBe(CUSTOMER_DEAL);
  });

  test("vendor as subject stays eligible", () => {
    expect(customerDealReason("Anthropic signs compute deal with Google")).toBeNull();
    expect(customerDealReason("OpenAI partners with Microsoft")).toBeNull();
    expect(customerDealReason("Microsoft signs deal with G42")).toBeNull();
    expect(customerDealReason("Mistral strikes partnership with Airbus")).toBeNull();
  });

  test("no deal verb / real model or funding news stays eligible", () => {
    expect(customerDealReason("Google Cloud launches Gemini agents for banks")).toBeNull();
    expect(customerDealReason("Anthropic raises $13B at $183B valuation")).toBeNull();
    expect(customerDealReason("DeepSeek releases V4 with 1M context")).toBeNull();
    expect(customerDealReason("Signs of AI bubble grow, analysts say")).toBeNull(); // 'Signs' with no buyer before it
  });

  test("filter applies to the lead only — the same group stays on the Wire", () => {
    const c = {
      ...cluster(["hn:9", "gnews:9"], { lead_source: "hn-algolia", title: "BNP Paribas inks new Google Cloud deal to advance agentic AI deployment" }),
      briefEligible: true,
    };
    const now = Date.parse(plus(60));
    expect(wireCandidates([c]).map((x) => x.id)).toEqual([c.id]);
    expect(leadExcludeReason(c, now)).toBe(CUSTOMER_DEAL);
    expect(leadCandidates([c], now)).toEqual([]);
  });
});
