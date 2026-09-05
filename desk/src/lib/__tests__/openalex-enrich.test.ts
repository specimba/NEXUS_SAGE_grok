import { describe, expect, test, beforeEach } from "bun:test";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  arxivIdFromDoiOrUrl,
  buildOpenAlexRequest,
  fetchOpenAlexEnrich,
  fuzzyTitleMatch,
  isOpenAlexBriefEligible,
  isOpenAlexPulseLeadEligible,
  matchEnrichmentToPaper,
  mergeOntoPapers,
  normalizeDoi,
  normalizeOpenAlexId,
  parseOpenAlexWorks,
  pickOpenAlexFallbackQuery,
  resetOpenAlexTickState,
  type OpenAlexSearchResponse,
} from "@/lib/openalex-enrich";
import { mergeDailyPapers, type Paper } from "@/lib/ingest";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const FIX_DOI = FIX("openalex-hugginggpt.json");
const FIX_SEARCH = FIX("openalex-agent-sandbox.json");
const FIX_LEGACY = FIX("openalex-hf-agent.json");

beforeEach(() => {
  resetOpenAlexTickState();
});

describe("parseOpenAlexWorks → schema (display_name → title)", () => {
  test("DOI filter HuggingGPT W4361866031 maps display_name → title · briefEligible false", () => {
    const payload = JSON.parse(FIX_DOI) as OpenAlexSearchResponse;
    // Fixture intentionally omits title — only display_name (Scout API note)
    expect(payload.results?.[0]?.title).toBeUndefined();
    expect(payload.results?.[0]?.display_name).toContain("HuggingGPT");

    const rows = parseOpenAlexWorks(payload);
    expect(rows).toHaveLength(1);
    const hugging = rows[0]!;
    expect(hugging.id).toBe("https://openalex.org/W4361866031");
    expect(hugging.title).toContain("HuggingGPT");
    expect(hugging.year).toBe(2023);
    expect(hugging.doi).toContain("10.48550/arxiv.2303.17580");
    expect(hugging.arxivId).toBe("2303.17580");
    expect(hugging.source).toBe("openalex");
    expect(hugging.papersEnrichOnly).toBe(true);
    expect(hugging.shelfOnly).toBe(false);
    expect(hugging.briefEligible).toBe(false);
    expect(hugging.pulseLeadEligible).toBe(false);
    expect(hugging.displaceHfKeep).toBe(false);
    expect(isOpenAlexBriefEligible(hugging)).toBe(false);
    expect(isOpenAlexPulseLeadEligible(hugging)).toBe(false);
  });

  test("fallback search LLM agent sandbox maps display_name → enrichment", () => {
    const rows = parseOpenAlexWorks(JSON.parse(FIX_SEARCH) as OpenAlexSearchResponse);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0]!.id).toBe("https://openalex.org/W4304195432");
    expect(rows[0]!.title.length).toBeGreaterThan(10);
    expect(rows[0]!.year).toBe(2022);
    expect(rows[1]!.id).toBe("https://openalex.org/W4393065402");
    for (const e of rows) {
      expect(e.briefEligible).toBe(false);
      expect(e.papersEnrichOnly).toBe(true);
      expect(e.displaceHfKeep).toBe(false);
    }
  });

  test("legacy ExpeL fixture still maps", () => {
    const rows = parseOpenAlexWorks(JSON.parse(FIX_LEGACY) as OpenAlexSearchResponse);
    const expel = rows.find((r) => r.id.includes("W4393160747"))!;
    expect(expel).toBeTruthy();
    expect(expel.title).toMatch(/ExpeL/i);
    expect(expel.briefEligible).toBe(false);
  });

  test("normalize helpers + DOI filter request builder", () => {
    expect(normalizeDoi("https://doi.org/10.48550/arxiv.2303.17580")).toBe(
      "10.48550/arxiv.2303.17580",
    );
    expect(arxivIdFromDoiOrUrl("https://doi.org/10.48550/arxiv.2303.17580v1")).toBe(
      "2303.17580",
    );
    expect(normalizeOpenAlexId("W4361866031")).toBe(
      "https://openalex.org/W4361866031",
    );
    const req = buildOpenAlexRequest({
      filterKey: "doi:10.48550/arxiv.2303.17580",
    });
    expect(req.mode).toBe("filter");
    expect(req.url).toContain("filter=");
    expect(req.url).toContain("doi");
    expect(req.url).toContain("display_name");

    // Multi-DOI OR must be doi:A|B (not doi:A|doi:B — OpenAlex 400)
    const multi = buildOpenAlexRequest({
      papers: [
        {
          id: "2303.17580",
          title: "HuggingGPT",
          up: 1,
          href: "https://arxiv.org/abs/2303.17580",
          doi: "https://doi.org/10.48550/arxiv.2303.17580",
        },
        {
          id: "2210.03629",
          title: "Other",
          up: 1,
          href: "https://arxiv.org/abs/2210.03629",
          doi: "https://doi.org/10.48550/arxiv.2210.03629",
        },
      ],
    });
    expect(multi.mode).toBe("filter");
    expect(multi.query.startsWith("doi:")).toBe(true);
    expect(multi.query.includes("|doi:")).toBe(false);
    expect(multi.query).toContain("10.48550/arxiv.2303.17580");
    expect(multi.query).toContain("10.48550/arxiv.2210.03629");

    // arXiv-only HF rows (no explicit doi) → fallback search, not empty filter
    const search = buildOpenAlexRequest({
      papers: [
        {
          id: "2609.02749",
          title: "Repo-To-Skill",
          up: 1,
          href: "https://arxiv.org/abs/2609.02749",
        },
      ],
    });
    expect(search.mode).toBe("search");
  });

  test("malformed / empty results skipped", () => {
    expect(parseOpenAlexWorks({ results: [{ id: "bad", display_name: "x" }] })).toEqual(
      [],
    );
    expect(parseOpenAlexWorks(null)).toEqual([]);
  });
});

describe("mergeOntoPapers · never displace HF agent keeps", () => {
  test("DOI/arXiv match attaches HuggingGPT id/year/doi onto existing row", () => {
    const papers: Paper[] = [
      {
        id: "2303.17580",
        title: "HuggingGPT stub",
        up: 100,
        href: "https://arxiv.org/abs/2303.17580",
        doi: "https://doi.org/10.48550/arxiv.2303.17580",
      },
      {
        id: "2609.02749",
        title: "Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills",
        up: 508,
        href: "https://arxiv.org/abs/2609.02749",
      },
    ];
    const enrichments = parseOpenAlexWorks(
      JSON.parse(FIX_DOI) as OpenAlexSearchResponse,
    );
    const merged = mergeOntoPapers(papers, enrichments, {
      limit: 2,
      allowSecondary: false,
    });
    expect(merged.map((p) => p.id)).toEqual(["2303.17580", "2609.02749"]);
    expect(merged[0]!.openalexId).toBe("https://openalex.org/W4361866031");
    expect(merged[0]!.year).toBe(2023);
    expect(merged[0]!.doi).toContain("10.48550/arxiv.2303.17580");
    expect(merged[0]!.title).toContain("HuggingGPT"); // filled from display_name map when stub empty? stub has title — keep or upgrade
    expect(merged[1]!.id).toBe("2609.02749");
    expect(merged[1]!.openalexId).toBeUndefined();
  });

  test("secondary enrich-only never kicks gen/sim-protected agent keeps", () => {
    const agent: Paper = {
      id: "2609.02749",
      title: "Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills",
      up: 50,
      href: "https://arxiv.org/abs/2609.02749",
    };
    const student: Paper = {
      id: "2609.01591",
      title: "StudentSim: Training LLM-based Student Simulators",
      up: 473,
      href: "https://arxiv.org/abs/2609.01591",
    };
    const mergedHf = mergeDailyPapers([student, agent], {
      keptAgent: [agent],
      limit: 2,
    });
    expect(mergedHf.some((p) => p.id === agent.id)).toBe(true);

    const enrichments = parseOpenAlexWorks(
      JSON.parse(FIX_SEARCH) as OpenAlexSearchResponse,
    );
    const after = mergeOntoPapers(mergedHf, enrichments, { limit: 2 });
    expect(after.some((p) => p.id === agent.id)).toBe(true);
    expect(after.find((p) => p.id === agent.id)?.title).toContain("Repo-To-Skill");
    const agentStill = after.find((p) => p.id === agent.id)!;
    expect(agentStill.openalexEnrichOnly).toBeFalsy();
    for (const e of enrichments) {
      expect(e.briefEligible).toBe(false);
      expect(e.displaceHfKeep).toBe(false);
    }
  });

  test("secondary rows append when under limit · tagged enrich-only", () => {
    const papers: Paper[] = [
      {
        id: "2609.02749",
        title: "Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills",
        up: 508,
        href: "https://arxiv.org/abs/2609.02749",
      },
    ];
    const enrichments = parseOpenAlexWorks(
      JSON.parse(FIX_SEARCH) as OpenAlexSearchResponse,
    );
    const after = mergeOntoPapers(papers, enrichments, { limit: 8 });
    expect(after.some((p) => p.id === "2609.02749")).toBe(true);
    const secondaries = after.filter((p) => p.openalexEnrichOnly);
    expect(secondaries.length).toBeGreaterThanOrEqual(1);
    for (const s of secondaries) {
      expect(s.openalexId).toMatch(/openalex\.org\/W/);
      expect(s.up).toBe(0);
    }
  });

  test("fuzzy title match", () => {
    expect(
      fuzzyTitleMatch(
        "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
        "HuggingGPT Solving AI Tasks with ChatGPT",
      ),
    ).toBe(true);
    const e = parseOpenAlexWorks(JSON.parse(FIX_DOI) as OpenAlexSearchResponse)[0]!;
    expect(
      matchEnrichmentToPaper(
        {
          id: "2303.17580",
          title: "HuggingGPT stub",
          href: "https://arxiv.org/abs/2303.17580",
          doi: "https://doi.org/10.48550/arxiv.2303.17580",
        },
        e,
      ),
    ).toBe(true);
  });
});

describe("soft-fail 429 · ingest continues", () => {
  test("forceSoftFail 429 → soft_fail · empty enrichments · brief false", async () => {
    const r = await fetchOpenAlexEnrich({
      forceSoftFail: 429,
      query: "Hugging Face agent",
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
    expect(r.ok).toBe(false);
    expect(r.enrichments).toEqual([]);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);

    const report = {
      openalex: {
        ok: r.ok,
        soft_fail: r.soft_fail,
        soft_fail_reason: r.soft_fail_reason,
        brief: r.brief,
        pulse_lead: r.pulse_lead,
      },
      locks: { cycle: "003", lead: "hf-incident" },
    };
    expect(report.openalex.soft_fail).toBe(true);
    expect(report.openalex.brief).toBe(false);
    expect(report.locks).toEqual({ cycle: "003", lead: "hf-incident" });
  });

  test("live fetch 429 soft-fails via fetchImpl", async () => {
    const r = await fetchOpenAlexEnrich({
      query: "LLM agent sandbox",
      fetchImpl: (async () =>
        new Response("rate limit", { status: 429 })) as typeof fetch,
      allowMultiSearch: true,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
    expect(r.brief).toBe(false);
  });

  test("fixture DOI path ok · brief false", async () => {
    const r = await fetchOpenAlexEnrich({ fixtureJson: FIX_DOI });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.enrichments[0]!.id).toBe("https://openalex.org/W4361866031");
  });

  test("second fetch in same tick soft-fails budget", async () => {
    resetOpenAlexTickState();
    const fetchImpl = (async () =>
      new Response(FIX_DOI, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    const cacheDir = resolve(
      import.meta.dir,
      "../../../artifacts/sage/openalex-cache-test-budget",
    );
    rmSync(cacheDir, { recursive: true, force: true });
    mkdirSync(cacheDir, { recursive: true });
    const now = Date.now();
    const first = await fetchOpenAlexEnrich({
      query: "Hugging Face agent",
      fetchImpl,
      cacheDir,
      now,
    });
    expect(first.soft_fail).toBe(false);
    expect(first.from_cache).toBe(false);
    expect(first.searches).toBe(1);
    const second = await fetchOpenAlexEnrich({
      query: "LLM agent sandbox",
      fetchImpl,
      cacheDir,
      now,
    });
    expect(second.soft_fail).toBe(true);
    expect(second.soft_fail_reason).toBe("search_budget_exhausted");
  });
});

describe("never Brief / never Pulse lead · cycle locks", () => {
  test("Brief pin set unchanged (hf-incident lead, cycle 003)", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
    const rows = parseOpenAlexWorks(JSON.parse(FIX_DOI) as OpenAlexSearchResponse);
    expect(rows.some((e) => e.id === "hf-incident")).toBe(false);
    expect(rows.every((e) => e.briefEligible === false)).toBe(true);
  });

  test("fallback query rotates across day buckets", () => {
    const a = pickOpenAlexFallbackQuery(0);
    const b = pickOpenAlexFallbackQuery(86_400_000);
    expect(OPENALEX_SET.has(a)).toBe(true);
    expect(OPENALEX_SET.has(b)).toBe(true);
    expect(a).not.toBe(b);
  });
});

const OPENALEX_SET = new Set([
  "Hugging Face agent",
  "LLM agent",
  "LLM agent sandbox",
]);
