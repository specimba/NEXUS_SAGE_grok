/**
 * PASS-S1.1 — analyst feeds (refs/PASS-S1-SCOUT-SOURCES.md §S1.1, acceptance test 3 + the S1.1 part of 1).
 * Fixtures are trimmed copies of the live simonw / latent-space feeds fetched 2026-10-16.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ANALYST_ONLY, decidePick, leadExcludeReason, nonAnalystPublishers } from "@/lib/lead-pick";
import { clusterItems, type PulseInput } from "@/lib/dedupe";
import { defaultBadge, defaultPublisher } from "@/lib/desk-view";
import { publisherKey, type PulseMemberInfo } from "@/lib/pulse-v5";
import { AINEWS_RECAP_RE, ANALYST_FEEDS, ANALYST_KNOWN_NAMES, ANALYST_RSS_CAP, analystAiTitle, analystDropReason, fetchRssAnalyst } from "@/lib/rss-analyst";
import { applySageConfig } from "@/lib/sage-config-disk";
import { defaultSageConfig, validateSageConfig } from "@/lib/sage-config";
import { fast } from "./tmp-cache";

const FIX = join(import.meta.dir, "fixtures/s1");
const simonXml = readFileSync(join(FIX, "analyst-simonw.xml"), "utf8");
const latentXml = readFileSync(join(FIX, "analyst-latent-space.xml"), "utf8");
const NOW = "2026-10-16T09:00:00Z";
const ago = (h: number) => new Date(Date.parse(NOW) - h * 3_600_000).toISOString();

const STORY = "OpenAI releases GPT-6 with native agent tool use";
const inp = (id: string, source: PulseInput["source"], publisher: string, h = 3): PulseInput => ({
  id,
  source,
  title: STORY,
  url: `https://example.com/${id.replace(/:/g, "-")}`,
  at: ago(h),
  publisher,
});
const info = (id: string, badge: string, publisher: string): [string, PulseMemberInfo] => [id, { badge, publisher }];

function pick(inputs: PulseInput[], members: Record<string, PulseMemberInfo>) {
  const cl = clusterItems(inputs, { stamp: NOW }).map((c) => ({ ...c, first_seen: c.first_seen ?? null, is_new: c.is_new ?? false }));
  expect(cl.length).toBe(1);
  const memberAt = Object.fromEntries(inputs.map((x) => [x.id, x.at]));
  const opts = { memberAt, members };
  return {
    cluster: cl[0],
    reason: leadExcludeReason(cl[0], Date.parse(NOW), opts),
    decision: decidePick({ schema: 1, entries: [] }, cl, { ...opts, crawlAt: NOW, at: NOW, force: true }),
  };
}

describe("S1.7 #3 — analyst feeds confirm, never lead alone", () => {
  const a1 = inp("anl:simonw:aaa111", "rss-analyst", "simonw", 2);
  const a2 = inp("anl:latent-space:bbb222", "rss-analyst", "latent-space", 4);
  const members = Object.fromEntries([info(a1.id, "ANL", "simonw"), info(a2.id, "ANL", "latent-space")]);

  test("simonw + latent-space only → 2 SRC but excluded with reason analyst-only", () => {
    const r = pick([a1, a2], members);
    expect(r.cluster.member_ids.length).toBe(2);
    expect(new Set([publisherKey(a1.id), publisherKey(a2.id)]).size).toBe(2);
    expect(nonAnalystPublishers(r.cluster, {}, members)).toEqual([]);
    expect(r.reason).toBe(ANALYST_ONLY);
    expect(r.decision.action).not.toBe("picked");
    const ex = JSON.stringify(r.decision);
    expect(ex).toContain(ANALYST_ONLY);
  });

  test("the same pair plus one lab publisher → eligible (analysts count toward N SRC)", () => {
    const lab = inp("rss:openai:ccc333", "rss-lab", "openai", 5);
    const r = pick([a1, a2, lab], { ...members, ...Object.fromEntries([info(lab.id, "OAI", "OpenAI")]) });
    expect(r.reason).toBeNull();
    expect(r.decision.action).toBe("picked");
  });

  test("analyst + GNews only → still not eligible (GNW_ONLY/analyst-only, never a lead)", () => {
    const g = inp("gnews:xyz", "gnews-rss", "Reuters", 5);
    const r = pick([a1, g], { ...members, ...Object.fromEntries([info(g.id, "GNW", "Reuters")]) });
    expect(r.reason).toBe(ANALYST_ONLY);
  });
});

describe("S1.1 — registry, parse, AINews recap, chip", () => {
  test("registry = simonw + latent-space; cap 6", () => {
    expect(ANALYST_FEEDS.map((f) => f.id)).toEqual(["simonw", "latent-space"]);
    expect(ANALYST_RSS_CAP).toBe(6);
  });

  test("real-feed fixtures parse; AINews recap stays ONE item; non-AI posts dropped; cap applies", async () => {
    const res = await fetchRssAnalyst({ ...fast(), fixtures: { simonw: simonXml, "latent-space": latentXml }, now: Date.parse(NOW) });
    const recaps = res.items.filter((x) => x.recap);
    expect(recaps.length).toBe(2); // two [AINews] issues in the fixture → two rows, not one per sub-story
    for (const r of recaps) expect(AINEWS_RECAP_RE.test(r.title)).toBe(true);
    const lsRows = res.items.filter((x) => x.feed === "latent-space");
    expect(lsRows.length).toBeLessThanOrEqual(4);
    for (const x of res.items) {
      expect(x.id.startsWith(`anl:${x.feed}:`)).toBe(true);
      expect(x.briefEligible).toBe(false);
      expect(x.source).toBe("rss-analyst");
    }
    expect(res.items.filter((x) => x.feed === "simonw").length).toBeLessThanOrEqual(ANALYST_RSS_CAP);
    expect(res.items.some((x) => x.title === "Chirp Pong")).toBe(false);
    expect(analystDropReason("Tree Appreciator", "", "simonw")).toBe("not-ai");
    expect(analystDropReason("[AINews] a quiet day", "", "latent-space")).toBeNull();
  });

  test("ANL chip + publisher in the client view", () => {
    expect(defaultBadge("anl:simonw:abc", "simonw")).toBe("ANL");
    expect(String(defaultPublisher("anl:latent-space:abc")).toLowerCase()).toContain("latent");
  });
});

describe("S1.7 #1 (S1.1 part) — analyst_rss validator", () => {
  const withBlock = (patch: Record<string, unknown>) => {
    const c = defaultSageConfig() as unknown as { sources: Record<string, Record<string, unknown>> };
    c.sources.analyst_rss = { ...c.sources.analyst_rss, ...patch };
    return c;
  };
  test("defaults validate", () => expect(validateSageConfig(withBlock({})).ok).toBe(true));
  test("cap 12 ok, cap 13 rejected", () => {
    expect(validateSageConfig(withBlock({ cap_per_feed: 12 })).ok).toBe(true);
    expect(validateSageConfig(withBlock({ cap_per_feed: 13 })).ok).toBe(false);
  });
  test("unknown analyst feed rejected", () => {
    expect(validateSageConfig(withBlock({ feeds: ["simonw", "stratechery"] })).ok).toBe(false);
  });
  test("rss-labs stays first-party (no analyst id accepted in lab_rss)", () => {
    const c = defaultSageConfig() as unknown as { sources: { lab_rss: { feeds: string[] } } };
    c.sources.lab_rss.feeds = [...c.sources.lab_rss.feeds, "simonw"];
    expect(validateSageConfig(c).ok).toBe(false);
  });
});

describe("S1.8 — analyst AI title: ai_terms OR a fixed-code lab/model name (never config / free text)", () => {
  test("a known-lab title passes; a non-AI title fails", () => {
    // Real simonw titles (fixture): no AI term, but a lab name from the fixed code lists.
    expect(analystAiTitle("Anthropic tells investors quarterly revenue up nearly 50% to $16.8bn ahead of IPO")).toBe(true);
    expect(analystDropReason("Redesigning source control at Anthropic", "", "simonw")).toBeNull();
    expect(analystAiTitle("Mistral ships a new office in Paris")).toBe(true); // lab RSS id
    expect(analystAiTitle("DeepSeek posts quarterly update")).toBe(true); // topic-heat OTHER_LABS
    // Non-AI titles fail.
    expect(analystAiTitle("Tree Appreciator")).toBe(false);
    expect(analystDropReason("Chirp Pong", "", "simonw")).toBe("not-ai");
    // Names only in the broad AI_NAMES list (not lab ids / topic-heat) do not pass the analyst gate on their own.
    expect(analystAiTitle("Cursor raises a new round")).toBe(false);
  });
  test("the name list is fixed at load: built from LAB_FEEDS + topic-heat, frozen, untouched by config", () => {
    expect(Object.isFrozen(ANALYST_KNOWN_NAMES)).toBe(true);
    const before = ANALYST_KNOWN_NAMES.source;
    const c = defaultSageConfig();
    c.keywords.ai_terms = [...c.keywords.ai_terms, "treeappreciator"];
    c.keywords.politics_deny = [...c.keywords.politics_deny, "cursor"];
    applySageConfig(c);
    expect(ANALYST_KNOWN_NAMES.source).toBe(before);
    expect(ANALYST_KNOWN_NAMES.test("Cursor raises a new round")).toBe(false);
    // config ai_terms (the spec's "ai_terms match") is the only editable path
    expect(analystAiTitle("treeappreciator club")).toBe(true);
    applySageConfig(defaultSageConfig());
    expect(analystAiTitle("treeappreciator club")).toBe(false);
  });
});
