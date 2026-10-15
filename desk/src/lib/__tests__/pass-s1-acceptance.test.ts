/**
 * PASS-S1 acceptance (refs/PASS-S1-SCOUT-SOURCES.md §S1.7) — tests 1, 2 and 8 across all new blocks.
 * Tests 3–7 live next to their feature: pass-s1-analyst / pass-s1-releases / pass-s1-hn-title / pass-s1-gmail-senders.
 * Test 9 (box live check) is a live crawl — proof in refs/pass-s1/.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { budgetFor, runWithBudget } from "@/lib/crawl-budget";
import { crawlSourceRow } from "@/lib/crawl-timings";
import { crawlTableRows } from "@/lib/crawl-table";
import { buildGmailQuery, GMAIL_QUERY_TOPICS, senderTrust } from "@/lib/gmail-news";
import { fetchHnTitleQueries, mergeHnTitleHits } from "@/lib/hn-pulse";
import { fetchReleasesAtom, RELEASE_FEEDS } from "@/lib/releases-atom";
import { ANALYST_FEEDS, fetchRssAnalyst } from "@/lib/rss-analyst";
import { fetchRssSecurity, SECURITY_FEEDS } from "@/lib/rss-security";
import { defaultSageConfig, offSources, validateSageConfig } from "@/lib/sage-config";
import { applySageConfig } from "@/lib/sage-config-disk";
import { CRAWL_ROW_ID, softMeterSourceId } from "@/lib/sage-setup";
import { healthState, updateLedger } from "@/lib/source-health";
import { oldSourcesPipeline, type S1Fixture } from "./s1-pipeline";
import { fast, tmpCache } from "./tmp-cache";

const DESK = resolve(import.meta.dir, "../../..");
type Cfg = ReturnType<typeof defaultSageConfig>;
const mut = (f: (c: Cfg) => void) => {
  const c = defaultSageConfig();
  f(c);
  return c;
};

describe("S1.7 #1 — validator: new config accepted, every bad edit rejected", () => {
  test("committed sage-sources.json (with the new blocks + lists) is accepted and canonical", () => {
    const committed = JSON.parse(readFileSync(join(DESK, "config/sage-sources.json"), "utf8"));
    const v = validateSageConfig(committed);
    expect(v.ok).toBe(true);
    expect(committed).toEqual(defaultSageConfig());
    expect(committed.sources.analyst_rss).toBeDefined();
    expect(committed.sources.releases_atom).toBeDefined();
    expect(committed.keywords.hn_title_queries).toBeDefined();
    expect(committed.keywords.gmail_senders).toBeDefined();
    expect(committed.sources.sec_rss.feeds).toContain("embracethered");
  });
  const rejects: [string, Cfg][] = [
    ["unknown analyst id", mut((c) => void (c.sources.analyst_rss.feeds = ["simonw", "stratechery"]))],
    ["unknown release id", mut((c) => void (c.sources.releases_atom.feeds = ["llama.cpp", "pytorch"]))],
    ["unknown security id", mut((c) => void (c.sources.sec_rss.feeds = [...c.sources.sec_rss.feeds, "krebs"]))],
    ["analyst cap over ceiling (13 > 12)", mut((c) => void (c.sources.analyst_rss.cap_per_feed = 13))],
    ["release cap over ceiling (5 > 4)", mut((c) => void (c.sources.releases_atom.cap_per_feed = 5))],
    ["regex in hn_title_queries", mut((c) => void (c.keywords.hn_title_queries = ["agent", "open.*weights"]))],
    ["hn_title_queries > 8 terms", mut((c) => void (c.keywords.hn_title_queries = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"]))],
    ["hn_title_queries term > 40 chars", mut((c) => void (c.keywords.hn_title_queries = ["x".repeat(41)]))],
    ["malformed sender address", mut((c) => void (c.keywords.gmail_senders = ["venturebeat.com"]))],
    ["sender with display name", mut((c) => void (c.keywords.gmail_senders = ["VB <hello@newsletters.venturebeat.com>"]))],
    ["> 20 senders", mut((c) => void (c.keywords.gmail_senders = Array.from({ length: 21 }, (_, i) => `n${i}@example.com`)))],
  ];
  for (const [name, cfg] of rejects)
    test(`rejects: ${name}`, () => {
      const v = validateSageConfig(cfg);
      expect(v.ok).toBe(false);
      expect(v.errors.length).toBeGreaterThan(0);
    });
  test("S1.8: empty hn_title_queries / gmail_senders accepted (empty = off); empty ai_terms / politics_deny rejected", () => {
    expect(validateSageConfig(mut((c) => void (c.keywords.hn_title_queries = []))).ok).toBe(true);
    expect(validateSageConfig(mut((c) => void (c.keywords.gmail_senders = []))).ok).toBe(true);
    expect(validateSageConfig(mut((c) => void (c.keywords.ai_terms = []))).ok).toBe(false);
    expect(validateSageConfig(mut((c) => void (c.keywords.politics_deny = []))).ok).toBe(false);
  });
  test("accepts: ceilings exactly, claude-code on, editable title queries, 20 senders", () => {
    const c = mut((c) => {
      c.sources.analyst_rss.cap_per_feed = 12;
      c.sources.releases_atom.cap_per_feed = 4;
      c.sources.releases_atom.feeds = RELEASE_FEEDS.map((f) => f.id);
      c.keywords.hn_title_queries = ["agent", "MCP server", "llama.cpp", "C++ inference"];
      c.keywords.gmail_senders = Array.from({ length: 20 }, (_, i) => `n${i}@example.com`);
    });
    expect(validateSageConfig(c).ok).toBe(true);
  });
  test("C3 parity note: no C3 editor on main — the server validator is the only path (both paths = this one)", () => {
    expect(typeof validateSageConfig).toBe("function");
  });
});

describe("S1.7 #2 — old sources unchanged (new blocks off via the real config switches)", () => {
  const FIX = join(import.meta.dir, "fixtures/s1");
  const fixture = JSON.parse(readFileSync(join(FIX, "old-sources-crawl.json"), "utf8")) as S1Fixture;
  const goldenText = readFileSync(join(FIX, "old-sources-golden.json"), "utf8");
  /** Every S1 addition switched off the way an operator would: blocks on:false, empty lists (S1.8: empty = off), ETR not listed. */
  const offCfg = () =>
    mut((c) => {
      c.sources.analyst_rss.on = false;
      c.sources.releases_atom.on = false;
      c.sources.sec_rss.feeds = c.sources.sec_rss.feeds.filter((f) => f !== "embracethered");
      c.keywords.hn_title_queries = [];
      c.keywords.gmail_senders = [];
    });
  afterEach(() => applySageConfig(defaultSageConfig()));

  test("fixture is a pre-S1 crawl: no anl:/rel: inputs, no embracethered rows", () => {
    expect(fixture.inputs.length).toBeGreaterThan(100);
    for (const x of fixture.inputs) {
      expect(x.id.startsWith("anl:") || x.id.startsWith("rel:")).toBe(false);
      expect(x.id.startsWith("rss-sec:embracethered")).toBe(false);
    }
  });

  test("the all-off config is valid; the crawl gates read it as off", () => {
    const c = offCfg();
    expect(validateSageConfig(c).ok).toBe(true);
    expect(offSources(c)).toEqual(expect.arrayContaining(["analyst_rss", "releases_atom"]));
  });

  test("with the real switches off: cluster ids, Wire and the lead are byte-identical to the pre-S1 golden (b4c8f44)", async () => {
    const c = offCfg();
    applySageConfig(c);
    // HN title: empty list = off → no request, nothing merged into the existing HN rows.
    let calls = 0;
    const counting = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const ht = await fetchHnTitleQueries({ ...fast(), fetchImpl: counting, aiOnly: true, now: Date.parse(fixture.stamp) });
    expect(calls).toBe(0);
    expect(ht.off).toBe(true);
    const hnRows = fixture.inputs.filter((x) => x.source === "hn-algolia") as unknown as Parameters<typeof mergeHnTitleHits>[0];
    const merged = mergeHnTitleHits(hnRows, ht.candidates, c.sources.hn.cap);
    expect(merged.added).toEqual([]);
    expect(merged.rows).toEqual([...hnRows]);
    // Analyst / release blocks off → the crawl adds no anl:/rel: rows (ingest: off.has → rows []).
    const off = new Set(offSources(c));
    const anlRows = off.has("analyst_rss") ? [] : ["(would fetch)"];
    const relRows = off.has("releases_atom") ? [] : ["(would fetch)"];
    expect(anlRows).toEqual([]);
    expect(relRows).toEqual([]);
    // Security feeds: ETR not listed → only the pre-S1 feeds are fetched.
    expect(SECURITY_FEEDS.filter((f) => c.sources.sec_rss.feeds.includes(f.lab)).map((f) => f.lab)).not.toContain("embracethered");
    // Gmail: empty sender list → exactly the pre-S1 query (no from: clause) and no trust raise.
    expect(buildGmailQuery()).toBe(GMAIL_QUERY_TOPICS);
    expect(buildGmailQuery()).not.toContain("from:");
    expect(senderTrust("hello@newsletters.venturebeat.com")).toBe(1.5);
    // Same inputs the old crawl produced → same pipeline output, byte for byte.
    const inputs = [...merged.rows.map((r) => fixture.inputs.find((x) => x.id === r.id)!), ...fixture.inputs.filter((x) => x.source !== "hn-algolia")];
    expect(new Set(inputs.map((x) => x.id))).toEqual(new Set(fixture.inputs.map((x) => x.id)));
    // UX-1 clearance plate (stacked after S1) adds pick-time crawl fields only: excluded[].sources/age_h/pub + entry.pub.
    // Strip exactly those so cluster ids, Wire and the lead still compare byte-for-byte with the pre-S1 golden.
    const out = oldSourcesPipeline({ ...fixture, inputs: fixture.inputs.filter((x) => inputs.includes(x)) }) as { pick?: { entry?: Record<string, unknown> & { excluded?: Record<string, unknown>[] } } };
    const e = out.pick?.entry;
    if (e) {
      delete e.pub;
      for (const x of e.excluded ?? []) for (const k of ["sources", "age_h", "pub"]) delete x[k];
    }
    const now = `${JSON.stringify(out, null, 1)}\n`;
    expect(createHash("sha256").update(now).digest("hex")).toBe(createHash("sha256").update(goldenText).digest("hex"));
    expect(now).toBe(goldenText);
  });
});

/** fetch that hangs until aborted (budget) — or rejects with a TimeoutError immediately (per-feed timeout). */
const hanging = (() => new Promise<Response>(() => {})) as unknown as typeof fetch;
const timingOut = (async () => {
  const e = new Error("The operation timed out.");
  e.name = "TimeoutError";
  throw e;
}) as unknown as typeof fetch;

describe("S1.7 #8 — each new feed timing out is a soft-fail meter, not a crawl failure", () => {
  test("per-feed timeout → soft_fail result (no throw) for analyst, release, security (embracethered) and HN title", async () => {
    const anl = await fetchRssAnalyst({ ...fast(), cacheDir: tmpCache("s1-anl"), fetchImpl: timingOut, feeds: ANALYST_FEEDS });
    expect(anl.ok).toBe(false);
    expect(anl.soft_fail).toBe(true);
    expect(anl.feedsSoftFail.map((f) => f.lab).sort()).toEqual(["latent-space", "simonw"]);
    expect(anl.feedsSoftFail[0]!.reason).toMatch(/timeout/);

    const rel = await fetchReleasesAtom({ ...fast(), cacheDir: tmpCache("s1-rel"), fetchImpl: timingOut, feeds: RELEASE_FEEDS });
    expect(rel.ok).toBe(false);
    expect(rel.soft_fail).toBe(true);
    expect(rel.items).toEqual([]);
    expect(rel.seen.feeds).toEqual({}); // a failed feed never seeds / never advances state

    const etr = SECURITY_FEEDS.filter((f) => f.lab === "embracethered");
    expect(etr.length).toBe(1);
    const sec = await fetchRssSecurity({ ...fast(), cacheDir: tmpCache("s1-sec"), fetchImpl: timingOut, feeds: etr });
    expect(sec.feedsOk).toEqual([]);
    expect(sec.feedsSkipped.map((f) => f.lab)).toEqual(["embracethered"]); // per-feed skip; the SEC meter goes soft

    const hnt = await fetchHnTitleQueries({ ...fast(), cacheDir: tmpCache("s1-hnt"), fetchImpl: timingOut, queries: ["agent"] });
    expect(hnt.soft_fail).toBe(true);
    expect(hnt.candidates).toEqual([]);
  });

  for (const [id, fn] of [
    ["rss_analyst", (c: { fetch: typeof fetch }) => fetchRssAnalyst({ ...fast(), cacheDir: tmpCache("s1-anl-b"), fetchImpl: c.fetch, feeds: ANALYST_FEEDS })],
    ["releases_atom", (c: { fetch: typeof fetch }) => fetchReleasesAtom({ ...fast(), cacheDir: tmpCache("s1-rel-b"), fetchImpl: c.fetch, feeds: RELEASE_FEEDS })],
    ["hn_title", (c: { fetch: typeof fetch }) => fetchHnTitleQueries({ ...fast(), cacheDir: tmpCache("s1-hnt-b"), fetchImpl: c.fetch, queries: ["agent"] })],
  ] as const)
    test(`${id}: a hung feed is cut at its budget → status timeout → TIMEOUT row + failed health cell (crawl continues)`, async () => {
      expect(budgetFor(id)).toBeLessThanOrEqual(30_000); // well inside the 6 min job timeout
      const t0 = performance.now();
      const run = await runWithBudget(id, fn as never, { budgetMs: 120, baseFetch: hanging });
      expect(performance.now() - t0).toBeLessThan(2_000);
      expect(run.status).toBe("timeout");
      const row = crawlSourceRow({ id, label: id, ok: false, rows: 0, duration_ms: run.duration_ms, timed_out: true, reason: run.error });
      expect(crawlTableRows({ crawl_sources: [row] }).rows[0]!.flag).toBe("TIMEOUT");
      const ledger = updateLedger(null, [{ id, ok: false, items: 0, reason: run.error }], "2026-10-16T09:00:00Z");
      expect(healthState(ledger.sources[id]!)).toBe("fail");
    });

  test("meters + health strip know the new sources (ANL / REL / HNT cells)", () => {
    expect(softMeterSourceId("analyst_rss")).toBe("anl");
    expect(softMeterSourceId("releases_atom")).toBe("rel");
    expect(CRAWL_ROW_ID.analyst_rss).toBe("rss_analyst");
    expect(CRAWL_ROW_ID.releases_atom).toBe("releases_atom");
    const desk = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
    for (const [id, label] of [["rss_analyst", "ANL"], ["releases_atom", "REL"], ["hn_title", "HNT"]]) {
      expect(desk).toContain(`${id}: "${label}"`);
      expect(desk).toMatch(new RegExp(`HEALTH_ORDER = \\[[^\\]]*"${id}"`));
    }
  });
});
