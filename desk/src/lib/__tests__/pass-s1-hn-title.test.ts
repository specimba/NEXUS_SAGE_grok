/**
 * PASS-S1.4 — HN title-scoped queries (refs/PASS-S1-SCOUT-SOURCES.md §S1.4, acceptance test 6 + the S1.4 part of 1).
 */
import { describe, expect, test } from "bun:test";
import {
  configureHnTitleQueries,
  currentHnTitleQueries,
  fetchHnTitleQueries,
  HN_TITLE_QUERIES,
  hnSearchUrl,
  mergeHnTitleHits,
  toPulseCandidates,
  type HnAlgoliaHit,
  type HnAlgoliaResponse,
} from "@/lib/hn-pulse";
import { defaultSageConfig, validateSageConfig } from "@/lib/sage-config";
import { applySageConfig } from "@/lib/sage-config-disk";
import { fast } from "./tmp-cache";

const NOW = Date.parse("2026-10-15T21:00:00Z");
const ago = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const hit = (id: string, title: string, points: number, h = 3): HnAlgoliaHit => ({
  objectID: id,
  title,
  url: `https://example.com/${id}`,
  author: "u",
  points,
  num_comments: 1,
  created_at: ago(h),
});
const resp = (...hits: HnAlgoliaHit[]): HnAlgoliaResponse => ({ hits, nbHits: hits.length, page: 0, hitsPerPage: 20, query: "" } as HnAlgoliaResponse);

describe("S1.7 #6 — HN title-scoped queries", () => {
  test("hnSearchUrl({ titleOnly }) restricts to the title, last 48h, points ≥ 10", () => {
    const url = hnSearchUrl("prompt injection", 20, { now: NOW, titleOnly: true });
    const d = decodeURIComponent(url);
    expect(url).toContain("restrictSearchableAttributes=title");
    expect(d).toContain("points>=10");
    expect(d).toContain(`created_at_i>${Math.floor(NOW / 1000) - 48 * 3600}`);
    expect(url).toContain("query=prompt%20injection");
    // The watchlist / sweep URLs are unchanged (no title restriction).
    const plain = hnSearchUrl("LLM", 20, { now: NOW, recentHours: 48 });
    expect(plain).not.toContain("restrictSearchableAttributes");
    expect(decodeURIComponent(plain)).not.toContain("points>=");
  });

  test("default list = Scout's 5; one request per term; < 10 points / older than 48h dropped", async () => {
    expect([...HN_TITLE_QUERIES]).toEqual(["agent", "open weights", "prompt injection", "Qwen", "local model"]);
    const urls: string[] = [];
    const fetchImpl = (async (u: string) => {
      urls.push(String(u));
      return new Response(JSON.stringify(resp(hit(`9${urls.length}`, `AI agent story ${urls.length}`, 50), hit(`8${urls.length}`, "LLM agent low points", 4), hit(`7${urls.length}`, "Old agent LLM", 99, 60))), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await fetchHnTitleQueries({ ...fast(), now: NOW, fetchImpl, aiOnly: true });
    expect(urls.length).toBe(5);
    for (const u of urls) expect(u).toContain("restrictSearchableAttributes=title");
    expect(r.queries_ok.length).toBe(5);
    expect(r.candidates.map((c) => c.id).sort()).toEqual(["hn:91", "hn:92", "hn:93", "hn:94", "hn:95"]);
    expect(r.candidates.every((c) => c.briefEligible === false && c.source === "hn-algolia")).toBe(true);
  });

  test("S1.8 #6: title queries ADD ≤ hn.cap (20) new rows after dedupe; existing HN volume is unchanged", () => {
    // Live-like volume: 56 watchlist/sweep rows already (well over the cap of 20) — none may be dropped or reordered.
    const watch = toPulseCandidates(Array.from({ length: 56 }, (_, i) => hit(String(100 + i), `LLM agent watch ${i}`, 20 + i)));
    const title = toPulseCandidates([
      hit("101", "LLM agent watch 1", 21), // already in the watchlist → deduped
      hit("150", "LLM agent watch 50", 70), // already in the watchlist → deduped
      ...Array.from({ length: 30 }, (_, i) => hit(String(300 + i), `Local model agent ${i}`, 10 + i)),
    ]);
    const cap = defaultSageConfig().sources.hn.cap;
    expect(cap).toBe(20);
    const m = mergeHnTitleHits(watch, title, cap);
    expect(m.duplicates).toBe(2);
    expect(m.added.length).toBe(20); // 30 fresh after dedupe → exactly the cap added
    expect(m.added.length).toBeLessThanOrEqual(cap);
    expect(m.rows.length).toBe(watch.length + m.added.length); // 56 + 20
    expect(m.rows.slice(0, watch.length)).toEqual(watch); // existing HN volume unchanged, first, same order
    expect(m.added.every((a) => !watch.some((w) => w.id === a.id))).toBe(true);
    expect(new Set(m.rows.map((r) => r.id)).size).toBe(m.rows.length);
    expect(m.added[0]!.score).toBe(39); // highest points first among added
    // Fewer fresh than the cap → all fresh added, still nothing removed.
    const five = title.slice(0, 5);
    const few = mergeHnTitleHits(watch, five, cap);
    expect(few.added.length).toBe(five.filter((t) => !watch.some((w) => w.id === t.id)).length);
    expect(few.added.length).toBeLessThan(5);
    expect(few.rows.slice(0, watch.length)).toEqual(watch);
  });

  test("a failing term soft-fails alone (others still merge)", async () => {
    const fx: Record<string, HnAlgoliaResponse> = { agent: resp(hit("300", "AI agent ships", 30)) };
    const r = await fetchHnTitleQueries({ ...fast(), now: NOW, queries: ["agent", "Qwen"], fixtures: fx });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.queries_soft_fail.map((q) => q.query)).toEqual(["Qwen"]);
    expect(r.candidates.map((c) => c.id)).toEqual(["hn:300"]);
  });
});

describe("S1.7 #1 (S1.4 part) — keywords.hn_title_queries validator", () => {
  const withList = (list: unknown) => ({ ...defaultSageConfig(), keywords: { ...defaultSageConfig().keywords, hn_title_queries: list } });
  test("seed list accepted and freely editable (not additions-only)", () => {
    expect(validateSageConfig(withList(["agent", "MCP server"])).ok).toBe(true);
    expect(validateSageConfig(withList(["C++ inference", "llama.cpp"])).ok).toBe(true);
  });
  test.each([
    ["regex", ["agents?"]],
    ["regex group", ["(open|closed) weights"]],
    ["over 40 chars", ["x".repeat(41)]],
    ["more than 8 terms", ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"]],
    ["banned noun", ["jailbreak"]],
    ["duplicate", ["agent", "Agent"]],
  ])("rejects %s", (_n, list) => {
    const v = validateSageConfig(withList(list));
    expect(v.ok).toBe(false);
  });
  test("S1.8: empty list is accepted and means off — no request, nothing merged, not a soft-fail", async () => {
    expect(validateSageConfig(withList([])).ok).toBe(true);
    const c = defaultSageConfig();
    c.keywords.hn_title_queries = [];
    applySageConfig(c);
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const r = await fetchHnTitleQueries({ ...fast(), now: NOW, fetchImpl, aiOnly: true });
    expect(calls).toBe(0);
    expect(r.off).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(false);
    expect(r.candidates).toEqual([]);
    configureHnTitleQueries();
  });
  test("S1.8: ai_terms / politics_deny stay non-empty", () => {
    for (const k of ["ai_terms", "politics_deny"]) {
      const c = defaultSageConfig() as unknown as { keywords: Record<string, string[]> };
      c.keywords[k] = [];
      expect(validateSageConfig(c).ok).toBe(false);
    }
  });
  test("applySageConfig pushes the list into the crawl (default restores)", () => {
    const c = defaultSageConfig();
    c.keywords.hn_title_queries = ["agent", "Qwen"];
    applySageConfig(c);
    expect([...currentHnTitleQueries()]).toEqual(["agent", "Qwen"]);
    configureHnTitleQueries();
    expect([...currentHnTitleQueries()]).toEqual([...HN_TITLE_QUERIES]);
  });
});
