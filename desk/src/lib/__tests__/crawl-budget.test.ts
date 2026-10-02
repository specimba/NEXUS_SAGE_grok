import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  ARXIV_BUDGET_MS,
  boundFetch,
  budgetFor,
  runConcurrent,
  runWithBudget,
  SOURCE_BUDGET_MS,
  type BudgetTimer,
  type SourceRun,
} from "@/lib/crawl-budget";
import { fetchArxivByIds, fetchArxivSearch } from "@/lib/arxiv-enrich";
import { fetchOpenAlexEnrich, resetOpenAlexTickState } from "@/lib/openalex-enrich";
import { readSourceState } from "@/lib/source-state";
import { crawlSourceRow } from "@/lib/crawl-timings";
import { crawlTableRows } from "@/lib/crawl-table";
import { clusterItems, type PulseInput } from "@/lib/dedupe";

const ATOM = readFileSync(resolve(import.meta.dir, "fixtures/arxiv-atom-sample.xml"), "utf8");
const SOURCES = ["hf", "arxiv", "openalex", "crossref", "hn", "rss_labs", "rss_security", "gnews", "github", "wikidata"];

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crawl-budget-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** fetch that never answers unless its signal aborts (the arXiv 102–164 s failure mode). */
function hangingFetch(seen: { calls: number; aborted: number; onCall?: () => void }) {
  return ((_url: string | URL | Request, init?: RequestInit) => {
    seen.calls += 1;
    seen.onCall?.();
    return new Promise<Response>((_resolve, reject) => {
      const s = init?.signal;
      if (!s) return; // never settles
      s.addEventListener("abort", () => {
        seen.aborted += 1;
        reject(s.reason);
      });
    });
  }) as unknown as typeof fetch;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("per-source time budgets", () => {
  test("arXiv budget is 20 s; every crawl source has a 20–30 s budget", () => {
    expect(ARXIV_BUDGET_MS).toBe(20_000);
    expect(budgetFor("arxiv")).toBe(20_000);
    for (const id of SOURCES) {
      expect(SOURCE_BUDGET_MS[id]).toBeGreaterThanOrEqual(20_000);
      expect(SOURCE_BUDGET_MS[id]).toBeLessThanOrEqual(30_000);
    }
  });

  test("hung arXiv fetch soft-fails at its 20 s budget: request aborted, status timeout", async () => {
    const seen = { calls: 0, aborted: 0, onCall: undefined as undefined | (() => void) };
    const requested: number[] = [];
    // Fake clock: "time passes" to the budget as soon as arXiv is stuck inside fetch.
    const timer: BudgetTimer = (ms, cb) => {
      requested.push(ms);
      seen.onCall = () => setTimeout(cb, 0);
      return () => {
        seen.onCall = undefined;
      };
    };
    const run = await runWithBudget(
      "arxiv",
      async (c) => {
        const enrichments = await fetchArxivByIds(["2609.02749"], { cacheDir: dir, fetchImpl: c.fetch, signal: c.signal });
        const hits = await fetchArxivSearch({ maxResults: 5, fetchImpl: c.fetch, signal: c.signal });
        return { enrichments, hits };
      },
      { timer, baseFetch: hangingFetch(seen) },
    );
    expect(requested).toEqual([20_000]);
    expect(run.status).toBe("timeout");
    expect(run.budget_ms).toBe(20_000);
    expect(run.error).toBe("timeout after 20000ms budget");
    expect(run.value).toBeUndefined();
    expect(seen.calls).toBe(1);
    await sleep(5);
    expect(seen.aborted).toBe(1); // in-flight request really cancelled
    const row = crawlSourceRow({ id: "arxiv", label: "arXiv", ok: false, rows: 0, duration_ms: run.duration_ms, timed_out: true, reason: run.error });
    expect(row.status).toBe("timeout");
    expect(row.reason).toContain("20000ms");
    expect(crawlTableRows({ crawl_sources: [row] }).rows[0]!.flag).toBe("TIMEOUT");
  });

  test("real clock: a hung source resolves at its budget (not later), even while sleeping in its throttle", async () => {
    const seen = { calls: 0, aborted: 0 };
    const t0 = performance.now();
    const run = await runWithBudget(
      "arxiv",
      (c) => fetchArxivByIds(["2609.02749", "2609.01591"], { cacheDir: dir, fetchImpl: c.fetch, signal: c.signal }),
      { budgetMs: 150, baseFetch: hangingFetch(seen) },
    );
    const took = performance.now() - t0;
    expect(run.status).toBe("timeout");
    expect(took).toBeGreaterThanOrEqual(140);
    expect(took).toBeLessThan(1_500);
    // A source that ignores the signal entirely is still cut off at the budget.
    const t1 = performance.now();
    const deaf = await runWithBudget("hn", () => new Promise<never>(() => {}), { budgetMs: 100 });
    expect(deaf.status).toBe("timeout");
    expect(performance.now() - t1).toBeLessThan(1_000);
  });

  test("timeout → last good data: arXiv cache-only enrich still returns cached rows, no network", async () => {
    writeFileSync(join(dir, "2609.02749.atom.xml"), `<!-- cached_at:${new Date().toISOString()} -->\n${ATOM}`);
    let netCalls = 0;
    const net = (async () => {
      netCalls += 1;
      return new Response("", { status: 500 });
    }) as unknown as typeof fetch;
    const cached = await fetchArxivByIds(["2609.02749", "2609.99999"], { cacheDir: dir, cacheOnly: true, fetchImpl: net });
    expect(netCalls).toBe(0);
    expect(cached.map((e) => e.id)).toEqual(["2609.02749"]);
  });

  test("source error is status error (not timeout); success carries the value and duration", async () => {
    const bad = await runWithBudget("github", async () => {
      throw new Error("HTTP 403");
    });
    expect(bad.status).toBe("error");
    expect(bad.error).toBe("Error: HTTP 403");
    const ok = await runWithBudget("wikidata", async () => 7, { budgetMs: 1_000 });
    expect(ok.status).toBe("done");
    expect(ok.value).toBe(7);
    expect(ok.duration_ms).toBeGreaterThanOrEqual(0);
  });

  test("boundFetch fails fast once the budget signal aborted", async () => {
    const ctrl = new AbortController();
    let calls = 0;
    const f = boundFetch(ctrl.signal, (async () => {
      calls += 1;
      return new Response("ok");
    }) as unknown as typeof fetch);
    expect(await (await f("https://x.test")).text()).toBe("ok");
    ctrl.abort(new Error("budget"));
    await expect(f("https://x.test")).rejects.toThrow("budget");
    expect(calls).toBe(1);
  });
});

type Row = { id: string; title: string; url: string; at: string };
const SRC_ROWS: Record<string, Row[]> = {
  hn: [
    { id: "hn-1", title: "OpenAI ships agent sandbox for coding models", url: "https://openai.com/index/agent-sandbox", at: "2026-10-02T01:00:00Z" },
    { id: "hn-2", title: "Show HN: tiny eval harness for LLM agents", url: "https://github.com/x/evalh", at: "2026-10-02T00:30:00Z" },
  ],
  rss_lab: [
    { id: "lab-1", title: "Introducing the agent sandbox", url: "https://openai.com/index/agent-sandbox/", at: "2026-10-01T23:00:00Z" },
    { id: "lab-2", title: "Gemini robotics update", url: "https://deepmind.google/blog/gemini-robotics", at: "2026-10-01T20:00:00Z" },
  ],
  rss_security: [
    { id: "sec-1", title: "Prompt injection in agent sandboxes", url: "https://blog.trailofbits.com/2026/10/01/pi", at: "2026-10-01T18:00:00Z" },
  ],
  gnews: [
    { id: "gn-1", title: "OpenAI launches agent sandbox - The Verge", url: "https://news.google.com/rss/articles/abc", at: "2026-10-02T02:00:00Z" },
  ],
};
const SOURCE_OF: Record<string, PulseInput["source"]> = { hn: "hn-algolia", rss_lab: "rss-lab", rss_security: "rss-security", gnews: "gnews-rss" };

/** The ingest consumption pattern: results by task index → merged PulseInputs → clusters (same sort as ingest). */
async function miniCrawl(delays: Record<string, number>, hang?: string) {
  const ids = Object.keys(SRC_ROWS);
  const finished: string[] = [];
  const settled = await runConcurrent(
    ids.map((id) => () =>
      runWithBudget(
        id,
        async (c) => {
          if (id === hang) await new Promise((_r, rej) => c.signal.addEventListener("abort", () => rej(c.signal.reason)));
          await sleep(delays[id] ?? 0);
          finished.push(id);
          return SRC_ROWS[id]!;
        },
        { budgetMs: id === hang ? 120 : 2_000 },
      ),
    ),
  );
  const runs = settled.map((s) => (s.status === "fulfilled" ? s.value : null)) as (SourceRun<Row[]> | null)[];
  const inputs: PulseInput[] = runs.flatMap((r, i) =>
    r?.status === "done" ? r.value!.map((row) => ({ ...row, source: SOURCE_OF[ids[i]!]! })) : [],
  );
  const stamp = "2026-10-02T03:00:00Z";
  const clusters = clusterItems(inputs, { stamp }).sort(
    (a, b) => b.sources.length - a.sources.length || (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0),
  );
  return { finished, runs, inputs, clusters };
}

describe("concurrent crawl", () => {
  test("output is identical whatever order the sources finish in", async () => {
    const orders: Record<string, number>[] = [
      { hn: 5, rss_lab: 25, rss_security: 45, gnews: 65 },
      { hn: 65, rss_lab: 45, rss_security: 25, gnews: 5 },
      { hn: 45, rss_lab: 5, rss_security: 65, gnews: 25 },
      { hn: 25, rss_lab: 65, rss_security: 5, gnews: 45 },
    ];
    const results = await Promise.all(orders.map((d) => miniCrawl(d)));
    // Arrival order really differed…
    expect(new Set(results.map((r) => r.finished.join(","))).size).toBe(orders.length);
    // …but results come back in task order and merged/clustered output is byte-identical.
    for (const r of results) expect(r.runs.map((x) => x?.id)).toEqual(["hn", "rss_lab", "rss_security", "gnews"]);
    const ref = JSON.stringify({ inputs: results[0]!.inputs, clusters: results[0]!.clusters });
    for (const r of results) expect(JSON.stringify({ inputs: r.inputs, clusters: r.clusters })).toBe(ref);
    expect(results[0]!.clusters.some((c) => c.sources.length > 1)).toBe(true);
  });

  test("a hung source times out at its budget and the crawl completes with the others", async () => {
    const t0 = performance.now();
    const r = await miniCrawl({ hn: 10, rss_lab: 20, rss_security: 30, gnews: 40 }, "rss_lab");
    const took = performance.now() - t0;
    expect(took).toBeLessThan(1_500);
    expect(r.runs.map((x) => x?.status)).toEqual(["done", "timeout", "done", "done"]);
    expect(r.runs[1]!.error).toBe("timeout after 120ms budget");
    expect(r.inputs.map((i) => i.id)).toEqual(["hn-1", "hn-2", "sec-1", "gn-1"]);
    expect(r.finished).not.toContain("rss_lab");
  });

  test("sources overlap (wall ≈ slowest, not the sum); a cap of 1 runs them serially, same result order", async () => {
    const mk = (id: string, ms: number) => () => runWithBudget(id, async () => (await sleep(ms), id), { budgetMs: 5_000 });
    let t0 = performance.now();
    const par = await runConcurrent([mk("a", 120), mk("b", 120), mk("c", 120)] as const);
    const parMs = performance.now() - t0;
    t0 = performance.now();
    const ser = await runConcurrent([mk("a", 60), mk("b", 60), mk("c", 60)] as const, { concurrency: 1 });
    const serMs = performance.now() - t0;
    expect(parMs).toBeLessThan(300);
    expect(serMs).toBeGreaterThanOrEqual(170);
    for (const res of [par, ser]) {
      expect(res.map((s) => (s.status === "fulfilled" ? s.value.value : null))).toEqual(["a", "b", "c"]);
    }
  });
});

describe("OpenAlex pause still holds under the concurrent, budgeted crawl", () => {
  beforeEach(() => resetOpenAlexTickState());

  test("paused OpenAlex: 0 requests, status paused (not timeout) while other sources run alongside", async () => {
    const statePath = join(dir, "source-state.json");
    writeFileSync(
      statePath,
      JSON.stringify({ schema: 1, sources: { openalex: { consecutive_failures: 2, paused_until: "2099-01-01T00:00:00Z", pause_reason: "HTTP 429 Retry-After 40965", paused_auth: "anon" } } }),
    );
    let calls = 0;
    const counting = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const [oaS, otherS] = await runConcurrent([
      () => runWithBudget("openalex", (c) => fetchOpenAlexEnrich({ query: "LLM agent", cacheDir: join(dir, "oa"), statePath, fetchImpl: c.fetch }), { baseFetch: counting }),
      () => runWithBudget("hn", async () => (await sleep(20), "hn"), { budgetMs: 1_000 }),
    ] as const);
    const oa = oaS.status === "fulfilled" ? oaS.value : null;
    expect(oa?.status).toBe("done");
    expect(oa?.value?.status).toBe("paused");
    expect(oa?.value?.requests).toBe(0);
    expect(calls).toBe(0);
    expect(otherS.status === "fulfilled" && otherS.value.value).toBe("hn");
    const row = crawlSourceRow({ id: "openalex", ok: false, rows: 0, duration_ms: oa!.duration_ms, skipped_paused: true, timed_out: false, paused_until: oa!.value!.paused_until });
    expect(row.status).toBe("paused");
    const st = readSourceState(statePath);
    expect(st.sources.openalex!.paused_until).toBe("2099-01-01T00:00:00Z");
    expect(st.sources.openalex!.consecutive_failures).toBe(2);
  });

  test("429 + Retry-After through the budget-bound fetch still persists the pause (1 request, no retry)", async () => {
    const statePath = join(dir, "source-state.json");
    const now = Date.parse("2026-09-25T12:37:00Z");
    let calls = 0;
    let sawSignal = false;
    const r429 = (async (_u: unknown, init?: RequestInit) => {
      calls += 1;
      sawSignal = init?.signal instanceof AbortSignal;
      return new Response("{\"error\":\"budget\"}", { status: 429, headers: { "Retry-After": "40965" } });
    }) as unknown as typeof fetch;
    const run = await runWithBudget(
      "openalex",
      (c) => fetchOpenAlexEnrich({ query: "LLM agent", now, cacheDir: join(dir, "oa"), statePath, fetchImpl: c.fetch }),
      { baseFetch: r429 },
    );
    expect(run.status).toBe("done");
    expect(calls).toBe(1);
    expect(sawSignal).toBe(true);
    expect(run.value?.paused_until).toBe("2026-09-25T23:59:45Z");
    expect(readSourceState(statePath).sources.openalex!.paused_until).toBe("2026-09-25T23:59:45Z");
  });
});
