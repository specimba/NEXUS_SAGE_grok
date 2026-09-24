import { describe, expect, test, beforeEach } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildGnewsSearchUrl,
  capGnewsDisplay,
  fetchGnewsRss,
  GNEWS_DISPLAY_CAP,
  GNEWS_LAB_QUERIES,
  GNEWS_LAB_QUERIES_PER_TICK,
  GNEWS_POOL_CAP,
  GNEWS_RECENT_DAYS,
  gnewsLiveQuery,
  publisherFromTitle,
  GNEWS_QUERIES_PER_TICK,
  GNEWS_STANDING_BAN,
  GNEWS_WATCHLIST_MAX,
  GNEWS_WATCHLIST_QUERIES,
  gnewsQueriesSafe,
  gnewsStandingQueries,
  isGnewsBriefEligible,
  isGnewsPulseLeadEligible,
  looksLikeRss,
  parseGnewsRss,
  pickGnewsQueriesForTick,
  queryHash,
  resetGnewsTickState,
  setGnewsQueryRotateOffset,
  toGnewsItems,
} from "@/lib/gnews-rss";
import { looksLikeHtml } from "@/lib/rss-labs";
import { classifyPost } from "@/lib/x-hygiene";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const SAMPLE = FIX("gnews-openai-sample.xml");
const EMPTY = FIX("gnews-empty-channel.xml");
const HTML_BREAK = FIX("gnews-html-break.html");

function wipe(dir: string) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

beforeEach(() => {
  resetGnewsTickState();
});

describe("Google News RSS parse → Pulse spice schema", () => {
  test(
    "sample maps briefEligible + pulseLeadEligible false",
    () => {
      const { entries, publishers } = parseGnewsRss(SAMPLE);
      expect(entries.length).toBeGreaterThanOrEqual(2);
      expect(looksLikeRss(SAMPLE)).toBe(true);
      const items = toGnewsItems(entries, "OpenAI", publishers);
      // Astra incident item dropped by classifyPost flatten
      expect(items.every((i) => i.briefEligible === false)).toBe(true);
      expect(items.every((i) => i.pulseLeadEligible === false)).toBe(true);
      expect(items.every((i) => i.source === "gnews-rss")).toBe(true);
      const gpt = items.find((i) => /GPT-6/i.test(i.title));
      expect(gpt).toBeTruthy();
      expect(gpt!.link).toContain("news.google.com/rss/articles/");
      expect(gpt!.publisher).toBe("TechCrunch");
      expect(isGnewsBriefEligible(gpt)).toBe(false);
      expect(isGnewsPulseLeadEligible(gpt)).toBe(false);
    },
    { timeout: 30_000 },
  );

  test("Astra / incident headline dropped (never Brief noise)", () => {
    const { entries, publishers } = parseGnewsRss(SAMPLE);
    const items = toGnewsItems(entries, "OpenAI", publishers);
    expect(items.some((i) => /Astra agents compromised/i.test(i.title))).toBe(false);
    const r = classifyPost({ text: "Astra agents compromised Hugging Face" });
    expect(r.flatten).toBe(true);
  });

  test("fetchGnewsRss fixtureXml offline", async () => {
    const r = await fetchGnewsRss({ fixtureXml: SAMPLE });
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.briefEligible).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.pulseLeadEligible).toBe(false);
    expect(r.never_sole_lead).toBe(true);
    expect(r.items.length).toBeGreaterThanOrEqual(1);
    expect(r.items.length).toBeLessThanOrEqual(GNEWS_DISPLAY_CAP);
    expect(r.format).toBe("rss2");
    expect(r.items.every((i) => i.briefEligible === false)).toBe(true);
  }, { timeout: 30_000 });

  test("queryHash stable", () => {
    expect(queryHash("Hugging Face")).toBe(queryHash("hugging face"));
    expect(queryHash("OpenAI")).not.toBe(queryHash("Anthropic"));
  });

  test("buildGnewsSearchUrl always emits hl gl ceid", () => {
    const url = buildGnewsSearchUrl("Hugging Face");
    expect(url).toContain("news.google.com/rss/search?");
    expect(url).toContain("q=Hugging+Face");
    expect(url).toContain("hl=en-US");
    expect(url).toContain("gl=US");
    expect(url).toContain("ceid=US:en");
    expect(() => buildGnewsSearchUrl("")).toThrow();
  });
});

describe("rotate ≤2/tick · standing ≤6 · ban Sol/Astra", () => {
  test("watchlist ≤6 and safe", () => {
    expect(GNEWS_WATCHLIST_QUERIES.length).toBeLessThanOrEqual(GNEWS_WATCHLIST_MAX);
    expect(GNEWS_WATCHLIST_QUERIES.length).toBe(6);
    expect(gnewsQueriesSafe()).toBe(true);
    expect(gnewsStandingQueries().length).toBe(6);
  });

  test("pickGnewsQueriesForTick rotates ≤2", () => {
    expect(GNEWS_QUERIES_PER_TICK).toBe(2);
    const a = pickGnewsQueriesForTick(Date.UTC(2026, 8, 11), 2);
    expect(a.length).toBe(2);
    const b = pickGnewsQueriesForTick(Date.UTC(2026, 8, 11), 99);
    expect(b.length).toBe(2);
    setGnewsQueryRotateOffset(2);
    const c = pickGnewsQueriesForTick(Date.UTC(2026, 8, 11), 2);
    expect(c.length).toBe(2);
    expect(c.join("|")).not.toBe(a.join("|"));
  });

  test("Sol / Astra / jailbreak / Bluesky blocked as standing", () => {
    for (const ban of ["Sol", "Astra", "jailbreak", "Bluesky", "Persistent Sol"]) {
      expect(() => gnewsStandingQueries([ban])).toThrow();
      expect(gnewsQueriesSafe([ban])).toBe(false);
    }
    for (const ban of GNEWS_STANDING_BAN) {
      expect(gnewsQueriesSafe([ban])).toBe(false);
    }
  });

  test("locks cycle 003 / hf-incident untouched", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
  });
});

describe("soft_fail honesty · format-break / empty / 403/429", () => {
  test("HTML body → soft_fail html_body", async () => {
    const r = await fetchGnewsRss({ fixtureXml: HTML_BREAK });
    expect(r.ok).toBe(false);
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toContain("html_body");
    expect(r.items).toHaveLength(0);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(looksLikeHtml(HTML_BREAK)).toBe(true);
  }, { timeout: 30_000 });

  test("empty channel → soft_fail empty_channel", async () => {
    const r = await fetchGnewsRss({ fixtureXml: EMPTY });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toContain("empty_channel");
    expect(r.items).toHaveLength(0);
    expect(r.format).toBe("empty");
  }, { timeout: 30_000 });

  test("HTTP 429 force soft_fail merge · ingest continues shape", async () => {
    const cacheDir = resolve(import.meta.dir, "../../../artifacts/sage/gnews-cache-test-429");
    wipe(cacheDir);
    const r = await fetchGnewsRss({
      cacheDir,
      forceSoftFail: 429,
      now: Date.UTC(2026, 8, 11, 12),
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toMatch(/429/);
    expect(r.queries_attempted).toBeLessThanOrEqual(2);
    expect(r.queries_attempted).toBe(2);
    expect(r.items).toHaveLength(0);
    expect(r.briefEligible).toBe(false);
    expect(r.pulseLeadEligible).toBe(false);
    wipe(cacheDir);
  }, { timeout: 30_000 });

  test("HTTP 403 soft_fail", async () => {
    const cacheDir = resolve(import.meta.dir, "../../../artifacts/sage/gnews-cache-test-403");
    wipe(cacheDir);
    const r = await fetchGnewsRss({
      cacheDir,
      forceSoftFail: 403,
      maxQueries: 2,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toMatch(/403/);
    expect(r.ok).toBe(false);
    wipe(cacheDir);
  }, { timeout: 30_000 });

  test("one query HTML soft_fail · other fixture ok → merge", async () => {
    const r = await fetchGnewsRss({
      runAllQueries: false,
      maxQueries: 2,
      now: Date.UTC(2026, 8, 11),
      fixtures: {
        "Hugging Face": HTML_BREAK,
        OpenAI: SAMPLE,
      },
      queries: ["Hugging Face", "OpenAI"],
    });
    // rotate may pick other pair depending on day — force via fixtures keys matching run
    // Ensure soft_fail if any fixture broke
    if (r.queries_run.includes("Hugging Face") && r.queries_run.includes("OpenAI")) {
      expect(r.soft_fail).toBe(true);
      expect(r.items.length).toBeGreaterThanOrEqual(1);
      expect(r.queries_ok).toBeGreaterThanOrEqual(1);
    } else {
      // day rotate might pick Anthropic pair — still must soft_fail empty fixtures
      expect(r.brief).toBe(false);
    }
  }, { timeout: 30_000 });

  test("explicit fixtures for both tick queries soft_fail merge", async () => {
    resetGnewsTickState();
    setGnewsQueryRotateOffset(0);
    // day bucket for fixed now — compute standing order
    const standing = gnewsStandingQueries();
    const picked = pickGnewsQueriesForTick(Date.UTC(2026, 8, 11), 2, standing);
    expect(picked.length).toBe(2);
    const fixtures: Record<string, string> = {
      [picked[0]!]: HTML_BREAK,
      [picked[1]!]: SAMPLE,
    };
    const r = await fetchGnewsRss({
      now: Date.UTC(2026, 8, 11),
      maxQueries: 2,
      fixtures,
      queries: standing,
    });
    expect(r.queries_attempted).toBe(2);
    expect(r.soft_fail).toBe(true);
    expect(r.queries_ok).toBe(1);
    expect(r.items.length).toBeGreaterThanOrEqual(1);
    expect(r.items.length).toBeLessThanOrEqual(8);
    expect(r.never_sole_lead).toBe(true);
  }, { timeout: 30_000 });
});

describe("display cap 6–8 · de-dupe", () => {
  test("capGnewsDisplay ≤8", async () => {
    const r = await fetchGnewsRss({ fixtureXml: SAMPLE, displayCap: 8 });
    expect(r.items.length).toBeLessThanOrEqual(8);
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...r.items[0]!,
      id: `gnews:extra${i}`,
      guid: `guid-${i}`,
      title: `Headline ${i}`,
      published: `2026-09-${String(11 - (i % 10)).padStart(2, "0")}T12:00:00Z`,
    }));
    expect(capGnewsDisplay(many, 8)).toHaveLength(8);
    expect(capGnewsDisplay(many, 6)).toHaveLength(6);
  }, { timeout: 30_000 });
});

describe("Beat 5 — publisher, lab queries, pool cap, backoff", () => {
  test("publisher comes from <source> and the ' — Publisher' suffix strips before matching", async () => {
    const { stripPublisherSuffix, normalizeTitle } = await import("@/lib/dedupe");
    const r = await fetchGnewsRss({ fixtureXml: SAMPLE });
    const it = r.items.find((i) => i.title.startsWith("OpenAI ships GPT-6"))!;
    expect(it.publisher).toBe("TechCrunch");
    expect(stripPublisherSuffix(it.title, it.publisher)).toBe("OpenAI ships GPT-6 preview for labs");
    expect(normalizeTitle(it.title, it.publisher)).not.toContain("techcrunch");
  });
  test("publisherFromTitle fallback when <source> missing", () => {
    expect(publisherFromTitle("Akamai Strikes $11.6 Billion Deal With Anthropic - Barron's")).toBe("Barron's");
    expect(publisherFromTitle("No suffix here")).toBe("");
    const items = toGnewsItems(
      [{ title: "Akamai, Anthropic sign $11.6 billion cloud services deal - Reuters", link: "https://news.google.com/rss/articles/X", guid: "X", published: "2026-09-24T20:11:23Z", summary: "" } as never],
      "Anthropic",
      new Map(),
    );
    expect(items[0]!.publisher).toBe("Reuters");
  });
  test("lab queries: ≤6 allowlist, safe, rotate ≤2 extra per tick with when:2d + distinct cache keys", async () => {
    expect(GNEWS_LAB_QUERIES.length).toBeLessThanOrEqual(6);
    expect(gnewsQueriesSafe(GNEWS_LAB_QUERIES)).toBe(true);
    expect(gnewsLiveQuery("Gemini", GNEWS_RECENT_DAYS)).toBe("Gemini when:2d");
    const cacheDir = resolve(import.meta.dir, `../../../artifacts/sage/gnews-cache-test-lab-${Date.now()}`);
    wipe(cacheDir);
    const urls: string[] = [];
    const r = await fetchGnewsRss({
      cacheDir,
      now: Date.UTC(2026, 8, 24),
      labQueries: true,
      recentDays: GNEWS_RECENT_DAYS,
      displayCap: GNEWS_POOL_CAP,
      fetchImpl: (async (input: RequestInfo | URL) => {
        urls.push(String(input));
        return new Response(SAMPLE, { status: 200, headers: { "Content-Type": "application/xml" } });
      }) as unknown as typeof fetch,
    });
    expect(r.queries_run.length).toBe(GNEWS_QUERIES_PER_TICK + GNEWS_LAB_QUERIES_PER_TICK);
    expect(r.queries_run.filter((q) => (GNEWS_LAB_QUERIES as readonly string[]).includes(q)).length).toBe(2);
    expect(urls.length).toBe(4);
    expect(urls.every((u) => u.includes("when%3A2d"))).toBe(true);
    expect(r.never_sole_lead).toBe(true);
    expect(r.items.every((i) => i.pulseLeadEligible === false && i.briefEligible === false)).toBe(true);
    wipe(cacheDir);
  }, { timeout: 30_000 });
  test("429 stops further live requests this tick (polite backoff)", async () => {
    const cacheDir = resolve(import.meta.dir, `../../../artifacts/sage/gnews-cache-test-429-${Date.now()}`);
    wipe(cacheDir);
    let n = 0;
    const r = await fetchGnewsRss({
      cacheDir,
      now: Date.UTC(2026, 8, 24),
      labQueries: true,
      recentDays: 2,
      fetchImpl: (async () => {
        n += 1;
        return new Response("slow down", { status: 429 });
      }) as unknown as typeof fetch,
    });
    expect(n).toBe(1);
    expect(r.queries_soft_fail.filter((f) => f.reason === "skipped_after_429").length).toBe(3);
    expect(r.soft_fail).toBe(true);
    wipe(cacheDir);
  }, { timeout: 30_000 });
  test("pool cap ≤ GNEWS_POOL_CAP, round-robin across queries", async () => {
    const r = await fetchGnewsRss({ fixtureXml: SAMPLE });
    const base = r.items[0]!;
    const mk = (q: string, i: number) => ({
      ...base,
      id: `gnews:${q}${i}`,
      guid: `${q}-${i}`,
      title: `${q} headline ${i}`,
      query: q,
      published: `2026-09-24T${String(20 - i).padStart(2, "0")}:00:00Z`,
    });
    const busy = Array.from({ length: 40 }, (_, i) => mk("busy", i % 20)).map((x, i) => ({ ...x, guid: `b${i}`, published: `2026-09-24T20:${String(59 - i).padStart(2, "0")}:00Z` }));
    const quiet = Array.from({ length: 3 }, (_, i) => mk("quiet", i));
    const out = capGnewsDisplay([...busy, ...quiet], 999);
    expect(out.length).toBe(GNEWS_POOL_CAP);
    expect(out.filter((x) => x.query === "quiet").length).toBe(3);
    expect(capGnewsDisplay([...busy, ...quiet], 8)).toHaveLength(8);
  });
});
