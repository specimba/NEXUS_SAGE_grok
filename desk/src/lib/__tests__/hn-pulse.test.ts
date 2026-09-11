import { describe, expect, test, beforeEach } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  clampHitsPerPage,
  fetchHnPulse,
  HN_QUERIES_PER_TICK,
  HN_STANDING_BAN,
  HN_WATCHLIST_MAX,
  HN_WATCHLIST_QUERIES,
  hnQueriesSafe,
  hnStandingQueries,
  isHnBriefEligible,
  parseHnHits,
  pickHnQueriesForTick,
  queryHash,
  resetHnPulseTickState,
  setHnQueryRotateOffset,
  toPulseCandidates,
  type HnAlgoliaResponse,
} from "@/lib/hn-pulse";
import { classifyPost } from "@/lib/x-hygiene";
import { classifyUrl } from "@/lib/ingest";
import { CYCLE } from "@/data/cycle";
import { INCIDENT_NOUNS } from "@/lib/ingest/queries";

const FIXTURE = JSON.parse(
  readFileSync(resolve(import.meta.dir, "fixtures/hn-hugging-face-hit.json"), "utf8"),
) as HnAlgoliaResponse;

function wipe(dir: string) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

beforeEach(() => {
  resetHnPulseTickState();
});

describe("HN Algolia parse → Pulse schema", () => {
  test("fixture hit maps to Pulse candidate", () => {
    const hits = parseHnHits(FIXTURE);
    expect(hits).toHaveLength(1);
    const cands = toPulseCandidates(hits);
    expect(cands).toHaveLength(1);
    const c = cands[0]!;
    expect(c.id).toBe("hn:49458161");
    expect(c.text).toContain("Hugging Face");
    expect(c.url).toContain("businessinsider.com");
    expect(c.source).toBe("hn-algolia");
    expect(c.score).toBe(1982);
    expect(c.at).toMatch(/^2026-08-27T/);
    expect(c.pulseOnly).toBe(true);
    expect(c.briefEligible).toBe(false);
  });

  test("fetchHnPulse with fixtureJson offline", async () => {
    const r = await fetchHnPulse({ fixtureJson: FIXTURE });
    expect(r.candidates.some((row) => row.id === "hn:49458161")).toBe(true);
    expect(r.brief).toBe(false);
    expect(r.pulse_only).toBe(true);
    expect(r.soft_fail).toBe(false);
  });

  test("hitsPerPage hard-capped at 20", () => {
    expect(clampHitsPerPage(50)).toBe(20);
    expect(clampHitsPerPage(0)).toBe(1);
    expect(clampHitsPerPage(10)).toBe(10);
  });

  test("queryHash is stable", () => {
    expect(queryHash("Hugging Face")).toBe(queryHash("hugging face"));
    expect(queryHash("OpenAI")).not.toBe(queryHash("Anthropic"));
  });
});

describe("classifyPost / DENY → tag or drop", () => {
  test("Nvidia HF acquire hit is Pulse OK chatter, not Brief", () => {
    const c = toPulseCandidates(parseHnHits(FIXTURE))[0]!;
    expect(isHnBriefEligible(c)).toBe(false);
    expect(c.tag === "rest" || c.tag === "rumor").toBe(true);
    const cls = classifyPost({ text: c.text });
    expect(cls.flatten).toBe(false);
    expect(cls.class).not.toBe("flatten");
  });

  test("Astra agents compromised Hugging Face → DENY / flatten drop", () => {
    const r = classifyPost({
      text: "Astra agents compromised Hugging Face",
    });
    expect(r.flatten).toBe(true);
    expect(r.class).toBe("flatten");
    const cands = toPulseCandidates([
      {
        objectID: "deny1",
        title: "Astra agents compromised Hugging Face",
        url: "https://example.com/x",
        author: "x",
        points: 10,
        created_at: "2026-09-01T00:00:00Z",
      },
    ]);
    expect(cands).toHaveLength(0);
  });

  test("Sol = Astra / Sol is Astra → DENY flatten drop", () => {
    expect(classifyPost({ text: "GPT-5.6 Sol = Astra" }).class).toBe("flatten");
    expect(classifyPost({ text: "Sol is Astra" }).class).toBe("flatten");
    const cands = toPulseCandidates([
      {
        objectID: "deny2",
        title: "GPT-5.6 Sol = Astra confirmed",
        url: "https://example.com/y",
        author: "y",
        points: 5,
        created_at: "2026-09-01T00:00:00Z",
      },
    ]);
    expect(cands).toHaveLength(0);
  });

  test("Bloomberg sources rumor → rumor tag, never Brief", () => {
    const r = classifyPost({
      text: "Bloomberg sources say OpenAI pausing training",
    });
    expect(r.rumor).toBe(true);
    expect(r.class).toBe("rumor");
    const cands = toPulseCandidates([
      {
        objectID: "rumor1",
        title: "Bloomberg sources say OpenAI pausing training",
        url: "https://example.com/z",
        author: "z",
        points: 50,
        created_at: "2026-09-01T00:00:00Z",
      },
    ]);
    expect(cands).toHaveLength(1);
    expect(cands[0]!.tag).toBe("rumor");
    expect(isHnBriefEligible(cands[0]!)).toBe(false);
  });

  test("toolkit GitHub URL in HN hit → drop from Pulse (off Brief)", () => {
    const href = "https://github.com/owasp-modsecurity/ModSecurity";
    expect(classifyUrl(href).lane).toBe("shelf");
    const cands = toPulseCandidates([
      {
        objectID: "toolkit1",
        title: "OWASP ModSecurity scanner release",
        url: href,
        author: "sec",
        points: 100,
        created_at: "2026-09-01T00:00:00Z",
      },
    ]);
    expect(cands).toHaveLength(0);
  });
});

describe("never Brief · cycle locks", () => {
  test("HN candidates never Brief-eligible; pin set unchanged", () => {
    const cands = toPulseCandidates(parseHnHits(FIXTURE));
    for (const c of cands) {
      expect(c.pulseOnly).toBe(true);
      expect(c.briefEligible).toBe(false);
      expect(isHnBriefEligible(c)).toBe(false);
      expect(c.id).not.toBe("hf-incident");
    }
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
  });

  test("standing queries are Scout P3 watchlist — no Sol/Astra/incident", () => {
    expect(HN_WATCHLIST_QUERIES.length).toBeLessThanOrEqual(HN_WATCHLIST_MAX);
    expect(HN_WATCHLIST_QUERIES.length).toBe(12);
    expect([...HN_WATCHLIST_QUERIES]).toEqual([
      "OpenAI",
      "Anthropic",
      "Hugging Face",
      "agents",
      "eval",
      "LLM",
      "METR",
      "ML security",
      "open weights",
      "inference",
      "benchmark",
      "agent tooling",
    ]);
    expect(hnQueriesSafe()).toBe(true);
    const qs = hnStandingQueries();
    for (const q of qs) {
      const lower = q.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        expect(lower.includes(n.toLowerCase())).toBe(false);
      }
      for (const ban of HN_STANDING_BAN) {
        expect(lower === ban).toBe(false);
      }
    }
    expect(() => hnStandingQueries(["Persistent-Sol artifactory"])).toThrow();
    expect(() => hnStandingQueries(["Sol"])).toThrow();
    expect(() => hnStandingQueries(["Astra"])).toThrow();
    expect(() => hnStandingQueries(["jailbreak"])).toThrow();
    expect(hnQueriesSafe(["Sol"])).toBe(false);
    expect(hnQueriesSafe(["Astra"])).toBe(false);
  });
});

describe("P3 rotate ≤3/tick · soft_fail merge", () => {
  test("pickHnQueriesForTick returns ≤3 and rotates", () => {
    expect(HN_QUERIES_PER_TICK).toBe(3);
    const day0 = 86_400_000 * 20_000;
    const a = pickHnQueriesForTick(day0);
    expect(a).toHaveLength(3);
    expect(a.length).toBeLessThanOrEqual(HN_QUERIES_PER_TICK);
    for (const q of a) {
      expect(HN_WATCHLIST_QUERIES.includes(q as (typeof HN_WATCHLIST_QUERIES)[number])).toBe(
        true,
      );
    }

    setHnQueryRotateOffset(3);
    const b = pickHnQueriesForTick(day0);
    expect(b).toHaveLength(3);
    expect(b.join("|")).not.toBe(a.join("|"));
    // offset 3 advances window by 3 within the standing list
    const standing = [...HN_WATCHLIST_QUERIES];
    const day = Math.floor(day0 / 86_400_000);
    const start = (day + 3) % standing.length;
    expect(b).toEqual([
      standing[start]!,
      standing[(start + 1) % standing.length]!,
      standing[(start + 2) % standing.length]!,
    ]);

    setHnQueryRotateOffset(0);
    const nextDay = pickHnQueriesForTick(day0 + 86_400_000);
    expect(nextDay).toHaveLength(3);
    expect(nextDay.join("|")).not.toBe(a.join("|"));
  });

  test("fetchHnPulse rotates ≤3 queries per tick (fetchImpl)", async () => {
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/hn-cache-test-rotate-${Date.now()}`,
    );
    wipe(cacheDir);
    const seen: string[] = [];
    const r = await fetchHnPulse({
      cacheDir,
      now: 86_400_000 * 20_000 + 1,
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = String(input);
        const m = url.match(/query=([^&]+)/);
        const q = m ? decodeURIComponent(m[1]!) : "?";
        seen.push(q);
        return new Response(
          JSON.stringify({
            hits: [
              {
                objectID: `rot-${seen.length}`,
                title: `OpenAI agents eval chatter ${seen.length}`,
                url: `https://example.com/hn-${seen.length}`,
                author: "t",
                points: 10,
                created_at: "2026-09-01T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as unknown as typeof fetch,
    });
    expect(seen.length).toBeLessThanOrEqual(HN_QUERIES_PER_TICK);
    expect(seen.length).toBe(3);
    expect(r.queries_run).toHaveLength(3);
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.candidates.every((c) => c.briefEligible === false)).toBe(true);
    wipe(cacheDir);
  });

  test("one query 5xx soft_fails that query only · merge continues · never Brief", async () => {
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/hn-cache-test-5xx-${Date.now()}`,
    );
    wipe(cacheDir);
    let n = 0;
    const r = await fetchHnPulse({
      cacheDir,
      now: Date.now() + 9_999_999_999,
      queries: ["OpenAI", "Anthropic", "Hugging Face"],
      maxQueries: 3,
      runAllQueries: true,
      fetchImpl: (async () => {
        n += 1;
        if (n === 2) {
          return new Response("nope", { status: 503 });
        }
        return new Response(
          JSON.stringify({
            hits: [
              {
                objectID: `ok-${n}`,
                title: `OpenAI research note ${n}`,
                url: `https://example.com/ok-${n}`,
                author: "t",
                points: 42,
                created_at: "2026-09-01T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as unknown as typeof fetch,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toMatch(/HTTP 503/);
    expect(r.queries_soft_fail.length).toBe(1);
    expect(r.queries_ok.length).toBe(2);
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.brief).toBe(false);
    expect(r.pulse_only).toBe(true);
    // ingest-last.hn shape honesty
    const stamp = {
      hn: {
        ok: r.ok || r.candidates.length > 0,
        soft_fail: r.soft_fail,
        soft_fail_reason: r.soft_fail_reason ?? null,
        brief: r.brief,
        pulse_only: r.pulse_only,
        never_displace_hf: true,
        queries_soft_fail: r.queries_soft_fail,
      },
      locks: { cycle: "003", lead: "hf-incident" },
    };
    expect(stamp.hn.soft_fail).toBe(true);
    expect(stamp.hn.brief).toBe(false);
    expect(stamp.locks.cycle).toBe("003");
    expect(stamp.locks.lead).toBe("hf-incident");
    wipe(cacheDir);
  });

  test("forceSoftFail all queries → soft_fail · empty candidates · exit-path ok", async () => {
    const r = await fetchHnPulse({
      forceSoftFail: 500,
      queries: ["OpenAI", "Anthropic", "LLM"],
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toMatch(/HTTP 500/);
    expect(r.candidates).toEqual([]);
    expect(r.brief).toBe(false);
    expect(r.queries_run).toHaveLength(3);
    expect(r.queries_soft_fail).toHaveLength(3);
  });

  test("paid X / Bluesky stay DENY · no standing Bluesky query", () => {
    expect(HN_WATCHLIST_QUERIES.some((q) => /bluesky|twitter|x\.com/i.test(q))).toBe(
      false,
    );
    expect(() => hnStandingQueries(["Bluesky"])).toThrow();
    expect(hnQueriesSafe(["Bluesky"])).toBe(false);
  });
});
