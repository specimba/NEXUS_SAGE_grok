import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalizeUrl,
  DEDUPE_WINDOW_HOURS,
  idfWeights,
  scorePair,
  scoreTokens,
  topCrossSourcePairs,
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
    expect(normalizeTitle("The NEW Claude Opus 5.5: lower costs!")).toEqual(["claude", "opus", "5.5", "lower", "cost"]);
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

describe("dedupe v2 — normalization", () => {
  test("strips known outlet suffixes even without publisher field", () => {
    expect(stripPublisherSuffix("OpenAI ships GPT-6 Sol - The Verge")).toBe("OpenAI ships GPT-6 Sol");
    expect(stripPublisherSuffix("Anthropic raises again | TechCrunch")).toBe("Anthropic raises again");
    expect(stripPublisherSuffix("Gemini 3.8 Live - Extended Thinking")).toBe("Gemini 3.8 Live - Extended Thinking");
  });
  test("money + versions kept; tickers/aliases fold to entities; light stem + synonyms", () => {
    expect(normalizeTitle("Akamai Strikes $11.6 Billion Deal With Anthropic")).toEqual([
      "akamai", "sign", "11.6b", "deal", "anthropic",
    ]);
    expect(normalizeTitle("Anthropic, Akamai ink $11.6B agreement")).toEqual(["anthropic", "akamai", "sign", "11.6b", "deal"]);
    expect(normalizeTitle("GOOGL, Alphabet and Google’s models")).toEqual(["google", "model"]);
    expect(normalizeTitle("GPT‑6 Astra (non-breaking hyphen)")).toContain("6");
    expect(normalizeTitle("Hugging Face open-weights text-to-speech")).toEqual(["huggingface", "openweight", "texttospeech"]);
  });
});

describe("dedupe v2 — URL canonicalization", () => {
  test("strips utm_*, ref, fbclid, gclid, mc_*, ncid, _hsenc; keeps real params", () => {
    expect(
      canonicalizeUrl("https://www.theverge.com/ai/123?utm_source=tw&gclid=1&fbclid=2&mc_cid=3&ncid=4&_hsenc=5&ref=hn&page=2"),
    ).toBe("https://theverge.com/ai/123?page=2");
  });
  test("Google News: legacy blob decodes to publisher URL; encrypted blob stays unique (title-only match)", () => {
    const legacy = "https://news.google.com/rss/articles/CBMiK2h0dHBzOi8vd3d3LmV4YW1wbGUuY29tL25ld3Mvc3RvcnktMT91dG1fc291cmNlPWdu0gEA?oc=5";
    const cl = clusterItems([
      { id: "g", source: "gnews-rss", title: "Short", url: legacy, at: "2026-09-24T10:00:00Z" },
      { id: "h", source: "hn-algolia", title: "Other", url: "https://example.com/news/story-1/?utm_medium=x", at: "2026-09-24T10:00:00Z" },
    ]);
    expect(cl).toHaveLength(1);
    expect(cl[0].score).toBe(1);
  });
});

type Fx = { why: string; a: PulseInput; b: PulseInput };
const REAL = JSON.parse(
  readFileSync(resolve(import.meta.dir, "fixtures/dedupe-real-pairs.json"), "utf8"),
) as { positives: Fx[]; negatives: Fx[] };
const ALL_REAL = [...REAL.positives, ...REAL.negatives].flatMap((p) => [p.a, p.b]);
const REAL_IDF = idfWeights(ALL_REAL.map((it) => normalizeTitle(it.title, it.publisher)));

describe("dedupe v2 — real pair fixtures (2026-09-24 crawl)", () => {
  for (const p of REAL.positives) {
    test(`merges: ${p.why}`, () => {
      const uni = scorePair(p.a, p.b);
      const idf = scorePair(p.a, p.b, { weights: REAL_IDF });
      expect(uni.match).toBe(true);
      expect(idf.match).toBe(true);
      expect(uni.score).toBeGreaterThanOrEqual(DEDUPE_THRESHOLD);
    });
  }
  for (const p of REAL.negatives) {
    test(`stays apart: ${p.why}`, () => {
      expect(scorePair(p.a, p.b).match).toBe(false);
      expect(scorePair(p.a, p.b, { weights: REAL_IDF }).match).toBe(false);
    });
  }
  test("Gemini 3.8 Live Avatar ≠ Gemini 3.8 Live Extended Thinking (explicit guard)", () => {
    const s = scoreTokens(
      normalizeTitle("Gemini 3.8 Live Avatar"),
      normalizeTitle("Gemini 3.8 Live Extended Thinking"),
    );
    expect(s.blocked).toBe("thin-overlap");
    const cl = clusterItems([
      { id: "a", source: "rss-lab", title: "Gemini 3.8 Live Avatar", url: "https://x.test/a", at: "2026-09-24T10:00:00Z" },
      { id: "b", source: "hn-algolia", title: "Gemini 3.8 Live Extended Thinking", url: "https://x.test/b", at: "2026-09-24T10:30:00Z" },
    ]);
    expect(cl).toHaveLength(2);
  });
  test("conflicting versions block (GPT-6 vs GPT-5.6)", () => {
    const neg = REAL.negatives.find((n) => n.a.id === "t:gpt6")!;
    expect(scorePair(neg.a, neg.b).blocked).toBe("version-conflict");
  });
  test("whole real batch clusters: positives joined, negatives split", () => {
    const cl = clusterItems(ALL_REAL.filter((it, i, arr) => arr.findIndex((x) => x.id === it.id) === i));
    const clusterOf = (id: string) => cl.find((c) => c.member_ids.includes(id))!.id;
    for (const p of REAL.positives) expect(clusterOf(p.a.id)).toBe(clusterOf(p.b.id));
    const avatar = clusterOf("rss:deepmind:34692efacd3b982a");
    expect(clusterOf("hn:x-extended")).not.toBe(avatar);
    expect(clusterOf("rss:openai:73461b3e97af0d93")).not.toBe(clusterOf("hn:sw-price-war"));
    expect(clusterOf("gnews:bad62dbea749b94b")).not.toBe(clusterOf("hn:49835056"));
  });
});

describe("dedupe v2 — time window", () => {
  const base: PulseInput = { id: "a", source: "hn-algolia", title: "Mistral raises 3B euros for sovereign open AI models", url: "https://a.test/1", at: "2026-09-24T12:00:00Z" };
  const other = (at: string, title = "Mistral raises 3B euros to build sovereign open AI models"): PulseInput => ({
    id: "b", source: "rss-lab", title, url: "https://b.test/2", at,
  });
  test("inside window merges; outside window blocks", () => {
    expect(scorePair(base, other("2026-09-25T06:00:00Z")).match).toBe(true);
    const far = scorePair(base, other("2026-09-26T13:00:00Z"));
    expect(far.blocked).toBe("time-window");
    expect(far.hours_apart).toBeGreaterThan(DEDUPE_WINDOW_HOURS);
  });
  test("near-identical headline gets 2× window, not more", () => {
    const same = base.title;
    expect(scorePair(base, other("2026-09-26T00:00:00Z", same)).match).toBe(true);
    expect(scorePair(base, other("2026-09-26T13:00:00Z", same)).blocked).toBe("time-window");
  });
  test("missing/garbage published time falls back gracefully (stricter threshold, no crash)", () => {
    const s = scorePair(base, other(""));
    expect(s.hours_apart).toBeNull();
    expect(s.need).toBeGreaterThan(DEDUPE_THRESHOLD);
    expect(s.match).toBe(true);
    const weak = scorePair(
      { ...base, title: "Mistral raises money for open models in Europe" },
      other("not-a-date", "Mistral raises money for new data centers"),
    );
    expect(weak.match).toBe(false);
  });
});

describe("dedupe v2 — diagnostics", () => {
  test("topCrossSourcePairs skips same-source pairs and sorts by score", () => {
    const pairs = topCrossSourcePairs(ALL_REAL, { limit: 50 });
    expect(pairs.every((p) => p.a.source !== p.b.source)).toBe(true);
    for (let i = 1; i < pairs.length; i++) expect(pairs[i - 1].score).toBeGreaterThanOrEqual(pairs[i].score);
    expect(pairs.some((p) => p.match)).toBe(true);
  });
});
