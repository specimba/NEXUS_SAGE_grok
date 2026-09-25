import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchOpenAlexEnrich, redactOpenAlexKey, resetOpenAlexTickState } from "@/lib/openalex-enrich";
import {
  activePause,
  FAIL_PAUSE_MS,
  nextMidnightUtc,
  readSourceState,
  recordSourceOutcome,
  retryAfterUntil,
  emptySourceState,
} from "@/lib/source-state";
import { crawlSourceRow, renderCrawlSourceTable, stopwatch } from "@/lib/crawl-timings";
import { summarizeLedger, updateLedger } from "@/lib/source-health";

const FAKE_KEY = "oa_test_key_7f3c9d1e2b4a";
const NOW = Date.parse("2026-09-25T12:37:00Z");
const OK_BODY = JSON.stringify({
  results: [{ id: "https://openalex.org/W1", display_name: "A paper", publication_year: 2026, doi: null }],
});

let dir: string;
let statePath: string;
let cacheDir: string;
let savedKey: string | undefined;

type Call = { url: string; headers: Record<string, string> };
function mockFetch(responses: (() => Response)[], calls: Call[]) {
  let i = 0;
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), headers: { ...((init?.headers as Record<string, string>) ?? {}) } });
    const make = responses[Math.min(i, responses.length - 1)]!;
    i += 1;
    return make();
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  resetOpenAlexTickState();
  dir = mkdtempSync(join(tmpdir(), "oa-pause-"));
  statePath = join(dir, "source-state.json");
  cacheDir = join(dir, "cache");
  savedKey = process.env.OPENALEX_API_KEY;
  delete process.env.OPENALEX_API_KEY;
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  if (savedKey === undefined) delete process.env.OPENALEX_API_KEY;
  else process.env.OPENALEX_API_KEY = savedKey;
});

describe("OpenAlex Retry-After pause", () => {
  test("429 with Retry-After seconds → paused_until = now + seconds, persisted, 1 request, no retry", async () => {
    const calls: Call[] = [];
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent",
      now: NOW,
      cacheDir,
      statePath,
      fetchImpl: mockFetch([() => new Response("{\"error\":\"budget exhausted\"}", { status: 429, headers: { "Retry-After": "40965" } })], calls),
    });
    expect(calls).toHaveLength(1);
    expect(r.status).toBe("fail");
    expect(r.paused_until).toBe("2026-09-25T23:59:45Z"); // 12:37:00 + 40965 s
    expect(r.pause_reason).toContain("Retry-After 40965");
    const st = readSourceState(statePath);
    expect(st.sources.openalex!.paused_until).toBe("2026-09-25T23:59:45Z");
    expect(st.sources.openalex!.consecutive_failures).toBe(1);
    expect(st.sources.openalex!.paused_auth).toBe("anon");
  });

  test("429 with Retry-After HTTP-date → that instant", () => {
    const until = retryAfterUntil("Sat, 26 Sep 2026 00:00:00 GMT", NOW);
    expect(new Date(until!).toISOString()).toBe("2026-09-26T00:00:00.000Z");
  });

  test("429 without Retry-After → next midnight UTC", async () => {
    const calls: Call[] = [];
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent",
      now: NOW,
      cacheDir,
      statePath,
      fetchImpl: mockFetch([() => new Response("rate limit", { status: 429 })], calls),
    });
    expect(calls).toHaveLength(1);
    expect(r.paused_until).toBe("2026-09-26T00:00:00Z");
    expect(new Date(nextMidnightUtc(Date.parse("2026-09-25T23:59:59Z"))).toISOString()).toBe("2026-09-26T00:00:00.000Z");
    expect(new Date(nextMidnightUtc(Date.parse("2026-09-26T00:00:00Z"))).toISOString()).toBe("2026-09-27T00:00:00.000Z");
  });

  test("3 consecutive failures (5xx) → 24h pause; 1–2 failures do not pause", async () => {
    let t = NOW;
    for (let i = 1; i <= 3; i++) {
      resetOpenAlexTickState();
      const calls: Call[] = [];
      const r = await fetchOpenAlexEnrich({
        query: "LLM agent",
        now: t,
        cacheDir,
        statePath,
        fetchImpl: mockFetch([() => new Response("boom", { status: 503 })], calls),
      });
      expect(calls).toHaveLength(1);
      if (i < 3) expect(r.paused_until).toBeNull();
      else expect(r.paused_until).toBe(new Date(t + FAIL_PAUSE_MS).toISOString().replace(/\.\d{3}Z$/, "Z"));
      t += 4 * 3600_000; // next 4h crawl
    }
    const e = readSourceState(statePath).sources.openalex!;
    expect(e.consecutive_failures).toBe(3);
    expect(e.pause_reason).toContain("3 consecutive failures");
  });

  test("3rd failure being a 429: the later of Retry-After and 24h wins", () => {
    let st = emptySourceState();
    st = recordSourceOutcome(st, "openalex", { ok: false, status: 503, reason: "HTTP 503" }, NOW);
    st = recordSourceOutcome(st, "openalex", { ok: false, status: 503, reason: "HTTP 503" }, NOW);
    st = recordSourceOutcome(st, "openalex", { ok: false, status: 429, reason: "HTTP 429", retryAfter: "60" }, NOW);
    expect(Date.parse(st.sources.openalex!.paused_until!)).toBe(NOW + FAIL_PAUSE_MS);
  });

  test("paused source makes NO request (no retry, no cache read) and reports status paused", async () => {
    writeFileSync(
      statePath,
      JSON.stringify({ schema: 1, sources: { openalex: { consecutive_failures: 17, paused_until: "2026-09-26T00:59:45Z", pause_reason: "HTTP 429 Retry-After 40965", paused_auth: "anon" } } }),
    );
    const calls: Call[] = [];
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent",
      now: NOW,
      cacheDir,
      statePath,
      fetchImpl: mockFetch([() => new Response(OK_BODY, { status: 200 })], calls),
    });
    expect(calls).toHaveLength(0);
    expect(r.status).toBe("paused");
    expect(r.requests).toBe(0);
    expect(r.paused_until).toBe("2026-09-26T00:59:45Z");
    expect(r.soft_fail).toBe(true);
    expect(r.enrichments).toEqual([]);
    // state untouched by a skipped run
    expect(readSourceState(statePath).sources.openalex!.consecutive_failures).toBe(17);
  });

  test("pause expires → request again; success clears the pause and the streak", async () => {
    let st = recordSourceOutcome(emptySourceState(), "openalex", { ok: false, status: 429, reason: "HTTP 429", retryAfter: "10" }, NOW);
    writeFileSync(statePath, JSON.stringify(st));
    const calls: Call[] = [];
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent",
      now: NOW + 11_000,
      cacheDir,
      statePath,
      fetchImpl: mockFetch([() => new Response(OK_BODY, { status: 200, headers: { "Content-Type": "application/json" } })], calls),
    });
    expect(calls).toHaveLength(1);
    expect(r.status).toBe("ok");
    st = readSourceState(statePath);
    expect(st.sources.openalex!.paused_until).toBeNull();
    expect(st.sources.openalex!.consecutive_failures).toBe(0);
  });

  test("an anonymous-IP pause does not bind a keyed run (key has its own budget)", () => {
    const st = recordSourceOutcome(emptySourceState(), "openalex", { ok: false, status: 429, reason: "HTTP 429" }, NOW, "anon");
    expect(activePause(st, "openalex", NOW, "anon")).not.toBeNull();
    expect(activePause(st, "openalex", NOW, "key")).toBeNull();
  });
});

describe("optional OPENALEX_API_KEY", () => {
  test("no env var → no Authorization header (behaves as today)", async () => {
    const calls: Call[] = [];
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent",
      now: NOW,
      cacheDir,
      fetchImpl: mockFetch([() => new Response(OK_BODY, { status: 200 })], calls),
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.headers.Authorization).toBeUndefined();
    expect(Object.keys(calls[0]!.headers).map((h) => h.toLowerCase())).not.toContain("authorization");
    expect(calls[0]!.url).not.toContain("api_key");
    expect(r.auth).toBe("anon");
  });

  test("env var set → Authorization: Bearer <key>; key not in URL, result, logs or state file", async () => {
    process.env.OPENALEX_API_KEY = FAKE_KEY;
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    try {
      const calls: Call[] = [];
      const ok = await fetchOpenAlexEnrich({
        query: "LLM agent",
        now: NOW,
        cacheDir,
        statePath,
        fetchImpl: mockFetch([() => new Response(OK_BODY, { status: 200 })], calls),
      });
      expect(calls[0]!.headers.Authorization).toBe(`Bearer ${FAKE_KEY}`);
      expect(calls[0]!.url).not.toContain(FAKE_KEY);
      expect(ok.auth).toBe("key");
      expect(JSON.stringify(ok)).not.toContain(FAKE_KEY);

      // failure paths that could echo the key: 429 and a thrown error containing it
      resetOpenAlexTickState();
      const r429 = await fetchOpenAlexEnrich({
        query: "LLM agent sandbox",
        now: NOW,
        cacheDir,
        statePath,
        fetchImpl: mockFetch([() => new Response("nope", { status: 429, headers: { "Retry-After": "5" } })], []),
      });
      expect(r429.paused_until).toBe("2026-09-25T12:37:05Z");
      expect(readFileSync(statePath, "utf8")).toContain('"paused_auth": "key"');
      resetOpenAlexTickState();
      const thrown = await fetchOpenAlexEnrich({
        query: "Hugging Face agent",
        now: NOW + 10_000,
        cacheDir,
        statePath,
        fetchImpl: (async () => {
          throw new Error(`socket closed; sent Authorization: Bearer ${FAKE_KEY}`);
        }) as typeof fetch,
      });
      expect(thrown.soft_fail_reason).toContain("[redacted]");
      for (const x of [JSON.stringify(r429), JSON.stringify(thrown)]) expect(x).not.toContain(FAKE_KEY);
      expect(existsSync(statePath)).toBe(true);
      expect(readFileSync(statePath, "utf8")).not.toContain(FAKE_KEY);
    } finally {
      console.log = orig;
    }
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.join("\n")).not.toContain(FAKE_KEY);
    expect(redactOpenAlexKey(`x ${FAKE_KEY} y`, FAKE_KEY)).toBe("x [redacted] y");
  });
});

describe("per-source crawl log + health status", () => {
  test("crawlSourceRow status ok / fail / paused and table render", () => {
    const rows = [
      crawlSourceRow({ id: "hn", label: "HN", ok: true, rows: 61, duration_ms: 1234.4 }),
      crawlSourceRow({ id: "openalex", label: "OpenAlex", ok: false, rows: 0, duration_ms: 1, skipped_paused: true, paused_until: "2026-09-26T00:59:45Z", reason: "paused" }),
      crawlSourceRow({ id: "github", label: "GitHub", ok: false, rows: 0, duration_ms: 300, reason: "HTTP 403" }),
    ];
    expect(rows.map((r) => r.status)).toEqual(["ok", "paused", "fail"]);
    expect(rows[0]!.duration_ms).toBe(1234);
    expect(rows[0]!.reason).toBeNull();
    const t = renderCrawlSourceTable(rows, 2000);
    expect(t).toContain("PAUSED".toLowerCase());
    expect(t).toContain("until 2026-09-26T00:59:45Z");
    expect(t).toContain("wall 2000 ms");
    let clock = 100;
    const sw = stopwatch(() => clock);
    clock = 350.6;
    expect(sw.lap()).toBe(251);
  });

  test("health ledger: paused skip leaves streaks/history alone; row status paused + paused_until", () => {
    const at1 = "2026-09-25T11:16:08Z";
    const at2 = "2026-09-25T15:16:08Z";
    let l = updateLedger(null, [{ id: "openalex", ok: false, items: 0, reason: "HTTP 429", paused_until: "2026-09-26T00:00:00Z" }], at1);
    expect(summarizeLedger(l)[0]).toMatchObject({ id: "openalex", status: "paused", paused_until: "2026-09-26T00:00:00Z", streak_fail: 1 });
    l = updateLedger(l, [{ id: "openalex", ok: false, items: 0, skipped_paused: true, paused_until: "2026-09-26T00:00:00Z" }], at2);
    const row = summarizeLedger(l)[0]!;
    expect(row.status).toBe("paused");
    expect(row.streak_fail).toBe(1);
    expect(row.runs_7d).toBe(1);
    l = updateLedger(l, [{ id: "openalex", ok: true, items: 4 }], "2026-09-26T02:16:08Z");
    expect(summarizeLedger(l)[0]).toMatchObject({ status: "ok", paused_until: null });
  });
});
