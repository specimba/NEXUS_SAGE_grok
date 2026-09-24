import { describe, expect, test } from "bun:test";
import {
  canonicalizeUrl,
  clusterItems,
  clusterStats,
  DEDUPE_THRESHOLD,
  jaccard,
  normalizeTitle,
  resolveGoogleNewsUrl,
  stripPublisherSuffix,
  titleSimilarity,
  type PulseInput,
} from "@/lib/dedupe";

describe("canonicalizeUrl", () => {
  test("strips utm/ref/fbclid tracking, www, hash, trailing slash", () => {
    expect(
      canonicalizeUrl("http://www.Example.com/news/story/?utm_source=x&utm_medium=y&ref=hn&fbclid=abc#top"),
    ).toBe("https://example.com/news/story");
  });
  test("keeps meaningful query params (sorted)", () => {
    expect(canonicalizeUrl("https://news.ycombinator.com/item?id=123&utm_campaign=z")).toBe(
      "https://news.ycombinator.com/item?id=123",
    );
    expect(canonicalizeUrl("https://a.com/p?b=2&a=1")).toBe("https://a.com/p?a=1&b=2");
  });
  test("AMP variants collapse to canonical", () => {
    const want = "https://example.com/2026/09/story";
    expect(canonicalizeUrl("https://example.com/2026/09/story/amp/")).toBe(want);
    expect(canonicalizeUrl("https://amp.example.com/2026/09/story")).toBe(want);
    expect(canonicalizeUrl("https://example-com.cdn.ampproject.org/c/s/www.example.com/2026/09/story")).toBe(want);
    expect(canonicalizeUrl("https://example.com/2026/09/story?amp=1&outputType=amp")).toBe(want);
    expect(canonicalizeUrl("https://m.example.com/2026/09/story.amp")).toBe(want);
  });
  test("empty / garbage stays stable", () => {
    expect(canonicalizeUrl("")).toBe("");
    expect(canonicalizeUrl("not a url/")).toBe("not a url");
  });
  test("news.google legacy blob resolves offline to publisher URL", () => {
    const g = "https://news.google.com/rss/articles/CBMiK2h0dHBzOi8vd3d3LmV4YW1wbGUuY29tL25ld3Mvc3RvcnktMT91dG1fc291cmNlPWdu0gEA?oc=5";
    expect(resolveGoogleNewsUrl(g)).toBe("https://www.example.com/news/story-1?utm_source=gn");
    expect(canonicalizeUrl(g)).toBe("https://example.com/news/story-1");
  });
  test("news.google encrypted blob not resolvable → canonical google URL (oc stripped)", () => {
    const g = "https://news.google.com/rss/articles/CBMihAFBVV95cUxQY2JLWlhnaVAw?oc=5";
    expect(resolveGoogleNewsUrl(g)).toBeNull();
    expect(canonicalizeUrl(g)).toBe("https://news.google.com/rss/articles/CBMihAFBVV95cUxQY2JLWlhnaVAw");
  });
});

describe("title similarity", () => {
  test("strips Google News publisher suffix", () => {
    expect(stripPublisherSuffix("Anthropic launches Claude Opus 5.5 - IT Brief Asia", "IT Brief Asia")).toBe(
      "Anthropic launches Claude Opus 5.5",
    );
  });
  test("normalizes case, punctuation, stopwords, keeps version numbers", () => {
    expect(normalizeTitle("The NEW Claude Opus 5.5: lower costs!")).toEqual(["claude", "opus", "5.5", "lower", "costs"]);
  });
  test("jaccard basics", () => {
    expect(jaccard(["a", "b"], ["a", "b"])).toBe(1);
    expect(jaccard(["a", "b"], ["c"])).toBe(0);
    expect(jaccard([], [])).toBe(0);
    expect(jaccard(["a", "b", "c"], ["a", "b", "d"])).toBeCloseTo(0.5);
  });
  test("same story across HN and GNews scores ≥ threshold", () => {
    const s = titleSimilarity(
      "Anthropic launches Claude Opus 5.5 with lower costs",
      "Anthropic launches Claude Opus 5.5 with lower costs - IT Brief Asia",
      undefined,
      "IT Brief Asia",
    );
    expect(s).toBeGreaterThanOrEqual(DEDUPE_THRESHOLD);
  });
  test("different stories stay below threshold", () => {
    expect(
      titleSimilarity("Akamai signs cloud agreement with Anthropic", "Alphabet values its Anthropic stake at $124B"),
    ).toBeLessThan(DEDUPE_THRESHOLD);
  });
});

describe("clusterItems", () => {
  const items: PulseInput[] = [
    { id: "hn:1", source: "hn-algolia", title: "Introducing Inkling: our open-weights model", url: "https://thinkingmachines.ai/news/introducing-inkling/", at: "2026-09-24T10:00:00Z", score: 900 },
    { id: "rss:tm:1", source: "rss-lab", title: "Introducing Inkling", url: "https://www.thinkingmachines.ai/news/introducing-inkling?utm_source=rss", at: "2026-09-24T09:00:00Z", publisher: "tm" },
    { id: "gnews:1", source: "gnews-rss", title: "Introducing Inkling: Our Open-Weights Model - The Verge", url: "https://news.google.com/rss/articles/CBMiZZZ?oc=5", at: "2026-09-24T11:00:00Z", publisher: "The Verge" },
    { id: "gnews:2", source: "gnews-rss", title: "Akamai signs seven-year cloud deal with Anthropic - Benzinga", url: "https://news.google.com/rss/articles/CBMiYYY?oc=5", at: "2026-09-24T08:00:00Z", publisher: "Benzinga" },
    { id: "sec:1", source: "rss-security", title: "Fuzzing the kernel", url: "https://blog.trailofbits.com/fuzz", at: "2026-09-23T08:00:00Z", publisher: "trailofbits" },
  ];

  test("URL canon + title similarity merge HN + lab RSS + GNews into one cluster", () => {
    const cl = clusterItems(items);
    expect(cl.length).toBe(3);
    const ink = cl.find((c) => c.member_ids.includes("hn:1"))!;
    expect(ink.member_ids.sort()).toEqual(["gnews:1", "hn:1", "rss:tm:1"]);
    expect(ink.sources).toEqual(["rss-lab", "hn-algolia", "gnews-rss"]);
    expect(ink.size).toBe(3);
    expect(ink.at).toBe("2026-09-24T11:00:00Z");
  });

  test("lead prefers lab RSS; GNews never leads a multi-source cluster", () => {
    const ink = clusterItems(items).find((c) => c.size === 3)!;
    expect(ink.lead_source).toBe("rss-lab");
    const noLab = clusterItems(items.filter((i) => i.source !== "rss-lab")).find((c) => c.size === 2)!;
    expect(noLab.lead_source).toBe("hn-algolia");
    expect(noLab.id).toBe("cl:hn:1");
  });

  test("GNews-only cluster strips publisher suffix from title", () => {
    const ak = clusterItems(items).find((c) => c.member_ids.includes("gnews:2"))!;
    expect(ak.title).toBe("Akamai signs seven-year cloud deal with Anthropic");
    expect(ak.sources).toEqual(["gnews-rss"]);
  });

  test("short titles merge only on identical canonical URL", () => {
    const cl = clusterItems([
      { id: "a", source: "hn-algolia", title: "GPT-6", url: "https://a.com/x", at: "2026-09-24T00:00:00Z" },
      { id: "b", source: "rss-lab", title: "GPT-6", url: "https://b.com/y", at: "2026-09-24T00:00:00Z" },
      { id: "c", source: "gnews-rss", title: "Something else entirely", url: "https://www.a.com/x/?ref=z", at: "2026-09-24T00:00:00Z" },
    ]);
    expect(cl.length).toBe(2);
    expect(cl.find((c) => c.member_ids.includes("a"))!.member_ids.sort()).toEqual(["a", "c"]);
  });

  test("transitive merges and first_seen/is_new = earliest member", () => {
    const stamp = "2026-09-25T00:00:00Z";
    const cl = clusterItems(
      [
        { ...items[0], first_seen: "2026-09-24T12:00:00Z" },
        { ...items[1], first_seen: stamp },
      ],
      { stamp },
    );
    expect(cl.length).toBe(1);
    expect(cl[0].first_seen).toBe("2026-09-24T12:00:00Z");
    expect(cl[0].is_new).toBe(false);
    const fresh = clusterItems([{ ...items[4], first_seen: stamp }], { stamp });
    expect(fresh[0].is_new).toBe(true);
  });

  test("deterministic across runs + stats", () => {
    const a = clusterItems(items);
    const b = clusterItems(items);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    expect(clusterStats(items.length, a)).toEqual({
      items_in: 5,
      clusters_out: 3,
      collapsed: 2,
      multi_source: 1,
      multi_member: 1,
    });
  });
});
