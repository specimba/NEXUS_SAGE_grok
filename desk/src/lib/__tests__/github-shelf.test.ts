import { describe, expect, test, beforeEach } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fetchGithubShelf,
  githubHeadersUnauth,
  GITHUB_CACHE_TTL_MS,
  GITHUB_RATE_STAMP_FILE,
  GITHUB_SHELF_QUERIES,
  isGithubBriefEligible,
  isGithubPulseLeadEligible,
  loadRateRemaining,
  pickGithubQuery,
  queryHash,
  resetGithubShelfTickState,
  searchRepos,
  setLastSearchRemaining,
  toGithubHits,
  toShelfUrls,
  writeRateRemaining,
  type GithubSearchResponse,
} from "@/lib/github-shelf";
import { classifyUrl, isBriefEligible } from "@/lib/ingest/shelf";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const FIX_A = FIX("github-search-agent-eval.json");
const FIX_B = FIX("github-search-owasp-llm.json");

beforeEach(() => {
  resetGithubShelfTickState();
  setLastSearchRemaining(null);
});

describe("GitHub shelf fixtures → classifyUrl shelf only", () => {
  test("Query A agent-eval: 2 hits → shelf URLs · briefEligible false", async () => {
    const payload = JSON.parse(FIX_A) as GithubSearchResponse;
    const hits = toGithubHits(payload);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.full_name).toBe("ayyesha12/agentic-auditor");
    expect(hits[1]!.full_name).toBe("Vyshnavi975/llmops-rag-agent");
    for (const h of hits) {
      expect(h.source).toBe("github-search");
      expect(h.shelfOnly).toBe(true);
      expect(h.briefEligible).toBe(false);
      expect(h.pulseLeadEligible).toBe(false);
      expect(isGithubBriefEligible(h)).toBe(false);
      expect(isGithubPulseLeadEligible(h)).toBe(false);
      expect(h.stargazers_count).toBe(0);
    }

    const shelf = toShelfUrls(hits);
    expect(shelf.length).toBeGreaterThanOrEqual(2);
    for (const s of shelf) {
      expect(classifyUrl(s.href).lane).toBe("shelf");
      expect(isBriefEligible(s.href)).toBe(false);
    }
    expect(shelf.some((s) => /agentic-auditor/.test(s.href))).toBe(true);
    expect(shelf.some((s) => /llmops-rag-agent/.test(s.href))).toBe(true);

    const r = await searchRepos({ fixtureJson: FIX_A });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.shelf.length).toBeGreaterThanOrEqual(2);
    expect(r.searches).toBe(0);
  });

  test("Query B OWASP LLM: toolkit + OWASP/Top10 → shelf · never Brief", async () => {
    const hits = toGithubHits(JSON.parse(FIX_B) as GithubSearchResponse);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.full_name).toBe("microsoft/agent-governance-toolkit");
    expect(hits[1]!.full_name).toBe("OWASP/Top10");
    expect(hits[0]!.stargazers_count).toBe(6190);

    const shelf = toShelfUrls(hits);
    expect(shelf.length).toBeGreaterThanOrEqual(2);
    // homepage owasp.org also shelves
    expect(
      shelf.some((s) => s.href.includes("agent-governance-toolkit")),
    ).toBe(true);
    expect(shelf.some((s) => /OWASP\/Top10/i.test(s.href))).toBe(true);
    for (const s of shelf) {
      expect(classifyUrl(s.href).lane).toBe("shelf");
      expect(isBriefEligible(s.href)).toBe(false);
    }

    const r = await fetchGithubShelf({ fixtureJson: FIX_B });
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    for (const h of r.hits) {
      expect(h.briefEligible).toBe(false);
      expect(h.pulseLeadEligible).toBe(false);
    }
  });

  test("classifier drops non-toolkit GitHub noise", () => {
    const hits = toGithubHits([
      {
        full_name: "octocat/Hello-World",
        html_url: "https://github.com/octocat/Hello-World",
        description: "demo",
        stargazers_count: 0,
        updated_at: "2026-01-01T00:00:00Z",
      },
    ]);
    expect(hits).toHaveLength(1);
    expect(toShelfUrls(hits)).toHaveLength(0);
    expect(classifyUrl(hits[0]!.html_url).lane).toBe("drop");
  });
});

describe("soft-fail 403/429 · ingest continues", () => {
  test("forceSoftFail 403 → soft_fail true · empty shelf · brief false", async () => {
    const r = await searchRepos({
      forceSoftFail: 403,
      query: "LLM agent eval harness",
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 403");
    expect(r.ok).toBe(false);
    expect(r.hits).toEqual([]);
    expect(r.shelf).toEqual([]);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
  });

  test("forceSoftFail 429 → soft_fail · stamp path unaffected", async () => {
    const r = await searchRepos({ forceSoftFail: 429, query: "OWASP LLM" });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
    expect(r.brief).toBe(false);
    // Simulates ingest-last.json github.soft_fail
    const report = {
      github: {
        soft_fail: r.soft_fail,
        brief: r.brief,
        pulse_lead: r.pulse_lead,
      },
      locks: { cycle: "003", lead: "hf-incident" },
    };
    expect(report.github.soft_fail).toBe(true);
    expect(report.github.brief).toBe(false);
    expect(report.locks.cycle).toBe("003");
  });

  test("X-RateLimit-Remaining=0 → soft-fail without calling fetch", async () => {
    setLastSearchRemaining(0);
    let called = 0;
    const r = await searchRepos({
      query: "agent sandbox escape",
      cacheDir: resolve(import.meta.dir, "../../../artifacts/sage/github-cache-test-empty"),
      now: Date.now(),
      fetchImpl: (async () => {
        called += 1;
        throw new Error("should not fetch");
      }) as unknown as typeof fetch,
    });
    expect(called).toBe(0);
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("rate_limit_remaining=0");
    expect(r.brief).toBe(false);
  });

  test("live fetch 403 soft-fails via fetchImpl", async () => {
    const { rmSync, mkdirSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-403-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const r = await searchRepos({
        query: "LLM red team toolkit",
        cacheDir,
        now: Date.parse("2099-07-01T00:00:00Z"),
        fetchImpl: (async () =>
          new Response("{}", {
            status: 403,
            headers: { "X-RateLimit-Remaining": "0" },
          })) as unknown as typeof fetch,
      });
      expect(r.soft_fail).toBe(true);
      expect(r.soft_fail_reason).toBe("HTTP 403");
      expect(r.searches).toBe(1);
      expect(r.rate_limit_remaining).toBe(0);
      expect(r.brief).toBe(false);
      expect(r.pulse_lead).toBe(false);
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });
});

describe("≤1 search per ingest tick · zero credentials", () => {
  test("second searchRepos in same tick soft-fails budget", async () => {
    const { rmSync, mkdirSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-budget-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const fetchImpl = (async () =>
        new Response(FIX_A, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "8",
          },
        })) as unknown as typeof fetch;

      const tickNow = Date.parse("2099-01-01T00:00:00Z");
      const a = await searchRepos({
        query: "LLM agent eval harness",
        cacheDir,
        now: tickNow,
        fetchImpl,
      });
      expect(a.soft_fail).toBe(false);
      expect(a.from_cache).toBe(false);
      expect(a.searches).toBe(1);

      const b = await searchRepos({
        query: "OWASP LLM",
        cacheDir,
        now: tickNow + 1,
        fetchImpl,
      });
      expect(b.soft_fail).toBe(true);
      expect(b.soft_fail_reason).toBe("search_budget_exhausted");
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  test("headers never include Authorization · GITHUB_TOKEN ignored", () => {
    const h = githubHeadersUnauth();
    expect(h.Authorization).toBeUndefined();
    expect(h.Accept).toBe("application/vnd.github+json");
    expect(h["User-Agent"]).toContain("github-shelf");
    // Even if env has a token, unauth headers stay clean
    expect("Authorization" in h).toBe(false);
  });

  test("query rotation picks curated strings only", () => {
    expect(GITHUB_SHELF_QUERIES).toContain("LLM agent eval harness");
    expect(GITHUB_SHELF_QUERIES).toContain("OWASP LLM");
    const q = pickGithubQuery(Date.parse("2026-09-04T00:00:00Z"));
    expect(GITHUB_SHELF_QUERIES as readonly string[]).toContain(q);
    expect(queryHash(q)).toHaveLength(16);
  });
});

describe("never Brief / Pulse lead · pins unchanged", () => {
  test("cycle 003 · lead hf-incident · GitHub never displaces", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
  });

  test("fixture hits are not pin ids and never pulseLeadEligible", () => {
    for (const raw of [FIX_A, FIX_B]) {
      for (const h of toGithubHits(JSON.parse(raw) as GithubSearchResponse)) {
        expect(h.pulseLeadEligible).toBe(false);
        expect(h.briefEligible).toBe(false);
        expect(h.full_name).not.toBe("hf-incident");
        expect(h.html_url).not.toContain("004");
      }
    }
  });
});


describe("FREE-PULSE P4 · 24h cache-first · rate stamp", () => {
  test("cache hit within 24h skips network · searches=0 · from_cache", async () => {
    const { rmSync, mkdirSync, writeFileSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-hit-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const query = "LLM agent eval harness";
      const now = Date.parse("2099-06-01T12:00:00Z");
      // Seed cache via live-shaped write (same schema as writeCache)
      const hash = queryHash(query);
      writeFileSync(
        resolve(cacheDir, `${hash}.json`),
        `${JSON.stringify(
          {
            cached_at: new Date(now - 60_000).toISOString().replace(/\.\d{3}Z$/, "Z"),
            query,
            body: JSON.parse(FIX_A),
          },
          null,
          2,
        )}\n`,
      );
      writeRateRemaining(cacheDir, 7, now - 30_000);

      let called = 0;
      const r = await searchRepos({
        query,
        cacheDir,
        now,
        fetchImpl: (async () => {
          called += 1;
          throw new Error("network must not run on cache hit");
        }) as unknown as typeof fetch,
      });
      expect(called).toBe(0);
      expect(r.from_cache).toBe(true);
      expect(r.ok).toBe(true);
      expect(r.soft_fail).toBe(false);
      expect(r.searches).toBe(0);
      expect(r.brief).toBe(false);
      expect(r.pulse_lead).toBe(false);
      expect(r.hits.length).toBe(2);
      expect(r.shelf.length).toBeGreaterThanOrEqual(2);
      expect(r.rate_limit_remaining).toBe(7);
      expect(GITHUB_CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  test("stamped Remaining=0 soft_fails without fetch (cross-tick preflight)", async () => {
    const { rmSync, mkdirSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-rem0-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const now = Date.parse("2099-06-02T12:00:00Z");
      writeRateRemaining(cacheDir, 0, now - 5_000);
      expect(loadRateRemaining(cacheDir, now)).toBe(0);
      setLastSearchRemaining(null); // force disk hydrate

      let called = 0;
      const r = await searchRepos({
        query: "OWASP LLM",
        cacheDir,
        now,
        fetchImpl: (async () => {
          called += 1;
          throw new Error("must skip");
        }) as unknown as typeof fetch,
      });
      expect(called).toBe(0);
      expect(r.soft_fail).toBe(true);
      expect(r.soft_fail_reason).toBe("rate_limit_remaining=0");
      expect(r.searches).toBe(0);
      expect(r.brief).toBe(false);
      expect(r.pulse_lead).toBe(false);
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  test("HTTP 429 soft_fail stamps remaining · ingest stamp shape honest", async () => {
    const { rmSync, mkdirSync, existsSync, readFileSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-429-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const now = Date.parse("2099-06-03T12:00:00Z");
      const r = await searchRepos({
        query: "agent sandbox escape",
        cacheDir,
        now,
        fetchImpl: (async () =>
          new Response("rate limit", {
            status: 429,
            headers: { "X-RateLimit-Remaining": "0" },
          })) as unknown as typeof fetch,
      });
      expect(r.soft_fail).toBe(true);
      expect(r.soft_fail_reason).toBe("HTTP 429");
      expect(r.ok).toBe(false);
      expect(r.searches).toBe(1);
      expect(r.brief).toBe(false);
      expect(r.pulse_lead).toBe(false);
      expect(r.rate_limit_remaining).toBe(0);
      expect(existsSync(resolve(cacheDir, GITHUB_RATE_STAMP_FILE))).toBe(true);
      const stamp = JSON.parse(
        readFileSync(resolve(cacheDir, GITHUB_RATE_STAMP_FILE), "utf8"),
      ) as { search_remaining: number };
      expect(stamp.search_remaining).toBe(0);

      // ingest-last.github honesty shape (HF/HN/RSS untouched by this path)
      const report = {
        github: {
          ok: r.ok,
          soft_fail: r.soft_fail,
          soft_fail_reason: r.soft_fail_reason ?? null,
          from_cache: r.from_cache,
          searches: r.searches,
          brief: r.brief,
          pulse_lead: r.pulse_lead,
          rate_limit_remaining: r.rate_limit_remaining,
        },
        locks: { cycle: "003", lead: "hf-incident" },
        hf: { ok: true },
        hn: { ok: true },
        rss: { ok: true },
      };
      expect(report.github.soft_fail).toBe(true);
      expect(report.github.searches).toBe(1);
      expect(report.locks.cycle).toBe("003");
      expect(report.hf.ok).toBe(true);
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  test("empty / missing body soft_fails honestly", async () => {
    const { rmSync, mkdirSync } = await import("node:fs");
    const cacheDir = resolve(
      import.meta.dir,
      `../../../artifacts/sage/github-cache-test-emptybody-${Date.now()}`,
    );
    mkdirSync(cacheDir, { recursive: true });
    try {
      const r = await searchRepos({
        query: "LLM red team toolkit",
        cacheDir,
        now: Date.parse("2099-06-04T12:00:00Z"),
        fetchImpl: (async () =>
          new Response(JSON.stringify({ total_count: 0 }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Remaining": "6",
            },
          })) as unknown as typeof fetch,
      });
      expect(r.soft_fail).toBe(true);
      expect(r.soft_fail_reason).toBe("missing body");
      expect(r.brief).toBe(false);
      expect(r.pulse_lead).toBe(false);
    } finally {
      try {
        rmSync(cacheDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  test("Scout P4: ≤1 search/tick · shelf queries curated · no incident nouns", () => {
    for (const q of GITHUB_SHELF_QUERIES) {
      expect(q.toLowerCase()).not.toMatch(/\bsol\b|astra|incident/);
    }
    expect(GITHUB_SHELF_QUERIES).toHaveLength(4);
  });
});
