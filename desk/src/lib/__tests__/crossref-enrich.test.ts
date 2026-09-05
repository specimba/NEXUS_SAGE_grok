import { describe, expect, test, beforeEach } from "bun:test";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCrossrefRequest,
  fetchCrossrefEnrich,
  formatIssuedDateParts,
  isArxivDoi,
  isDataRepoDoi,
  isCrossrefBriefEligible,
  isCrossrefPulseLeadEligible,
  matchCrossrefToPaper,
  mergeOntoPapers,
  parseCrossrefWorks,
  resetCrossrefTickState,
  type CrossrefSearchResponse,
} from "@/lib/crossref-enrich";
import { normalizeDoi } from "@/lib/openalex-enrich";
import { mergeDailyPapers, type Paper } from "@/lib/ingest";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const FIX_HUGGING = FIX("crossref-hugginggpt.json");
const FIX_SURVEY = FIX("crossref-agent-survey.json");

beforeEach(() => {
  resetCrossrefTickState();
});

describe("parseCrossrefWorks → schema (HuggingGPT + agent survey)", () => {
  test("bibliographic HuggingGPT maps DOI/issued/type · briefEligible false", () => {
    const payload = JSON.parse(FIX_HUGGING) as CrossrefSearchResponse;
    const rows = parseCrossrefWorks(payload);
    expect(rows).toHaveLength(1);
    const hugging = rows[0]!;
    expect(hugging.doi).toBe("10.52202/075280-1657");
    expect(hugging.title).toContain("HuggingGPT");
    expect(hugging.issued).toBe("2023");
    expect(hugging.type).toBe("proceedings-article");
    expect(hugging.url).toContain("10.52202/075280-1657");
    expect(hugging.source).toBe("crossref");
    expect(hugging.papersEnrichOnly).toBe(true);
    expect(hugging.briefEligible).toBe(false);
    expect(hugging.pulseLeadEligible).toBe(false);
    expect(hugging.displaceHfKeep).toBe(false);
    expect(isCrossrefBriefEligible(hugging)).toBe(false);
    expect(isCrossrefPulseLeadEligible(hugging)).toBe(false);
  });

  test("filter DOI agent survey maps issued date-parts · briefEligible false", () => {
    const rows = parseCrossrefWorks(
      JSON.parse(FIX_SURVEY) as CrossrefSearchResponse,
    );
    expect(rows).toHaveLength(1);
    const survey = rows[0]!;
    expect(survey.doi).toBe("10.1007/s11704-024-40231-1");
    expect(survey.title).toMatch(/survey on large language model/i);
    expect(survey.issued).toBe("2024-03-22");
    expect(survey.type).toBe("journal-article");
    expect(survey.briefEligible).toBe(false);
    expect(survey.papersEnrichOnly).toBe(true);
    expect(survey.displaceHfKeep).toBe(false);
  });

  test("formatIssuedDateParts + isArxivDoi helpers", () => {
    expect(formatIssuedDateParts([2023])).toBe("2023");
    expect(formatIssuedDateParts([2024, 3])).toBe("2024-03");
    expect(formatIssuedDateParts([2024, 3, 22])).toBe("2024-03-22");
    expect(formatIssuedDateParts(null)).toBeNull();
    expect(isArxivDoi("10.48550/arxiv.2303.17580")).toBe(true);
    expect(isArxivDoi("https://doi.org/10.1007/s11704-024-40231-1")).toBe(
      false,
    );
  });

  test("malformed / empty results skipped", () => {
    expect(parseCrossrefWorks({ message: { items: [{ DOI: "bad" }] } })).toEqual(
      [],
    );
    expect(parseCrossrefWorks(null)).toEqual([]);
  });
});

describe("buildCrossrefRequest · prefer filter=doi: / bibliographic · never direct arXiv GET", () => {
  test("registered DOI → filter=doi:", () => {
    const req = buildCrossrefRequest({
      filterDoi: "10.1007/s11704-024-40231-1",
    });
    expect(req.mode).toBe("filter");
    expect(req.url).toContain("filter=");
    expect(req.url).toContain(encodeURIComponent("doi:10.1007/s11704-024-40231-1"));
    expect(req.url).not.toMatch(/\/works\/10\./);
    expect(req.query).toBe("doi:10.1007/s11704-024-40231-1");
  });

  test("arXiv DOI filter redirects to bibliographic (Scout 404 tip)", () => {
    const req = buildCrossrefRequest({
      filterDoi: "10.48550/arxiv.2303.17580",
      papers: [
        {
          id: "2303.17580",
          title:
            "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
          up: 1,
          href: "https://arxiv.org/abs/2303.17580",
          doi: "https://doi.org/10.48550/arxiv.2303.17580",
        },
      ],
    });
    expect(req.mode).toBe("bibliographic");
    expect(req.url).toContain("query.bibliographic=");
    expect(req.url).not.toMatch(/\/works\/10\.48550/);
    expect(req.query).toContain("HuggingGPT");
  });

  test("papers with registered DOI prefer filter", () => {
    const req = buildCrossrefRequest({
      papers: [
        {
          id: "W4393065402",
          title: "A survey on large language model based autonomous agents",
          up: 0,
          href: "https://doi.org/10.1007/s11704-024-40231-1",
          doi: "https://doi.org/10.1007/s11704-024-40231-1",
          openalexId: "https://openalex.org/W4393065402",
        },
      ],
    });
    expect(req.mode).toBe("filter");
    expect(req.query).toContain("10.1007/s11704-024-40231-1");
  });

  test("arXiv-only papers → bibliographic title", () => {
    const req = buildCrossrefRequest({
      papers: [
        {
          id: "2303.17580",
          title:
            "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
          up: 1,
          href: "https://arxiv.org/abs/2303.17580",
          doi: "https://doi.org/10.48550/arxiv.2303.17580",
        },
      ],
    });
    expect(req.mode).toBe("bibliographic");
    expect(req.url).toContain("query.bibliographic=");
  });

  test("prefers journal DOI over Zenodo data-repo DOI", () => {
    expect(isDataRepoDoi("10.5281/zenodo.21686547")).toBe(true);
    const req = buildCrossrefRequest({
      papers: [
        {
          id: "W7171717460",
          title: "Zenodo thing",
          up: 0,
          href: "https://doi.org/10.5281/zenodo.21686547",
          doi: "https://doi.org/10.5281/zenodo.21686547",
        },
        {
          id: "W4393065402",
          title: "A survey on large language model based autonomous agents",
          up: 0,
          href: "https://doi.org/10.1007/s11704-024-40231-1",
          doi: "https://doi.org/10.1007/s11704-024-40231-1",
        },
      ],
    });
    expect(req.mode).toBe("filter");
    expect(req.query).toBe("doi:10.1007/s11704-024-40231-1");
  });
});

describe("mergeOntoPapers · non-destructive vs OpenAlex · never displace HF keeps", () => {
  test("title match attaches Crossref DOI without clobbering OpenAlex arXiv doi/id", () => {
    const papers: Paper[] = [
      {
        id: "2303.17580",
        title:
          "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
        up: 100,
        href: "https://arxiv.org/abs/2303.17580",
        doi: "https://doi.org/10.48550/arxiv.2303.17580",
        year: 2023,
        openalexId: "https://openalex.org/W4361866031",
      },
    ];
    const enrichments = parseCrossrefWorks(
      JSON.parse(FIX_HUGGING) as CrossrefSearchResponse,
    );
    const { papers: merged, notes } = mergeOntoPapers(papers, enrichments, {
      allowSecondary: false,
    });
    expect(merged).toHaveLength(1);
    expect(merged[0]!.openalexId).toBe("https://openalex.org/W4361866031");
    // keep OpenAlex/arXiv doi — Crossref registered DOI lives on crossrefDoi
    expect(normalizeDoi(merged[0]!.doi)).toBe("10.48550/arxiv.2303.17580");
    expect(normalizeDoi(merged[0]!.crossrefDoi)).toBe("10.52202/075280-1657");
    expect(merged[0]!.crossrefIssued).toBe("2023");
    expect(merged[0]!.crossrefType).toBe("proceedings-article");
    expect(notes.some((n) => n.includes("doi_collision"))).toBe(true);
  });

  test("filter DOI survey attaches onto OpenAlex secondary without clobbering id", () => {
    const papers: Paper[] = [
      {
        id: "W4393065402",
        title: "A survey on large language model based autonomous agents",
        up: 0,
        href: "https://doi.org/10.1007/s11704-024-40231-1",
        doi: "https://doi.org/10.1007/s11704-024-40231-1",
        year: 2024,
        openalexId: "https://openalex.org/W4393065402",
        openalexEnrichOnly: true,
      },
    ];
    const enrichments = parseCrossrefWorks(
      JSON.parse(FIX_SURVEY) as CrossrefSearchResponse,
    );
    const { papers: merged } = mergeOntoPapers(papers, enrichments);
    expect(merged[0]!.openalexId).toBe("https://openalex.org/W4393065402");
    expect(merged[0]!.openalexEnrichOnly).toBe(true);
    expect(normalizeDoi(merged[0]!.crossrefDoi)).toBe(
      "10.1007/s11704-024-40231-1",
    );
    expect(merged[0]!.crossrefIssued).toBe("2024-03-22");
    expect(merged[0]!.crossrefType).toBe("journal-article");
  });

  test("never displaces HF agent keeps at capacity", () => {
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

    const enrichments = parseCrossrefWorks(
      JSON.parse(FIX_SURVEY) as CrossrefSearchResponse,
    );
    const after = mergeOntoPapers(mergedHf, enrichments, {
      limit: 2,
      allowSecondary: true,
    });
    expect(after.papers.some((p) => p.id === agent.id)).toBe(true);
    expect(after.papers.find((p) => p.id === agent.id)?.title).toContain(
      "Repo-To-Skill",
    );
    for (const e of enrichments) {
      expect(e.briefEligible).toBe(false);
      expect(e.displaceHfKeep).toBe(false);
    }
  });

  test("fuzzy title match HuggingGPT", () => {
    const e = parseCrossrefWorks(
      JSON.parse(FIX_HUGGING) as CrossrefSearchResponse,
    )[0]!;
    expect(
      matchCrossrefToPaper(
        {
          id: "2303.17580",
          title: "HuggingGPT stub Solving AI Tasks ChatGPT Hugging Face",
          href: "https://arxiv.org/abs/2303.17580",
          doi: "https://doi.org/10.48550/arxiv.2303.17580",
        },
        e,
      ),
    ).toBe(true);
  });
});

describe("soft-fail 429/5xx/404 · ingest continues · brief=false", () => {
  test("forceSoftFail 429 → soft_fail · empty · brief false", async () => {
    const r = await fetchCrossrefEnrich({
      forceSoftFail: 429,
      query: "HuggingGPT",
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
    expect(r.ok).toBe(false);
    expect(r.enrichments).toEqual([]);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);

    const report = {
      crossref: {
        ok: r.ok,
        soft_fail: r.soft_fail,
        soft_fail_reason: r.soft_fail_reason,
        brief: r.brief,
        pulse_lead: r.pulse_lead,
      },
      locks: { cycle: "003", lead: "hf-incident" },
    };
    expect(report.crossref.brief).toBe(false);
    expect(report.locks).toEqual({ cycle: "003", lead: "hf-incident" });
  });

  test("live fetch 404 soft-fails via fetchImpl", async () => {
    const cacheDir = resolve(
      import.meta.dir,
      "../../../artifacts/sage/crossref-cache-test-404",
    );
    rmSync(cacheDir, { recursive: true, force: true });
    const r = await fetchCrossrefEnrich({
      query: "HuggingGPT-softfail-404-unique",
      cacheDir,
      fetchImpl: (async () =>
        new Response("not found", { status: 404 })) as typeof fetch,
      allowMultiSearch: true,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 404");
    expect(r.brief).toBe(false);
  });

  test("live fetch 429 soft-fails via fetchImpl", async () => {
    const cacheDir = resolve(
      import.meta.dir,
      "../../../artifacts/sage/crossref-cache-test-429",
    );
    rmSync(cacheDir, { recursive: true, force: true });
    const r = await fetchCrossrefEnrich({
      filterDoi: "10.1007/s11704-024-40231-1",
      cacheDir,
      fetchImpl: (async () =>
        new Response("rate limit", { status: 429 })) as typeof fetch,
      allowMultiSearch: true,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
  });

  test("fixture path ok · brief false", async () => {
    const r = await fetchCrossrefEnrich({ fixtureJson: FIX_HUGGING });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.enrichments[0]!.doi).toBe("10.52202/075280-1657");
  });

  test("second fetch in same tick soft-fails budget", async () => {
    resetCrossrefTickState();
    const fetchImpl = (async () =>
      new Response(FIX_HUGGING, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    const cacheDir = resolve(
      import.meta.dir,
      "../../../artifacts/sage/crossref-cache-test-budget",
    );
    rmSync(cacheDir, { recursive: true, force: true });
    mkdirSync(cacheDir, { recursive: true });
    const now = Date.now();
    const first = await fetchCrossrefEnrich({
      query: "HuggingGPT",
      fetchImpl,
      cacheDir,
      now,
    });
    expect(first.soft_fail).toBe(false);
    expect(first.from_cache).toBe(false);
    expect(first.searches).toBe(1);
    const second = await fetchCrossrefEnrich({
      query: "autonomous agents survey",
      fetchImpl,
      cacheDir,
      now,
    });
    expect(second.soft_fail).toBe(true);
    expect(second.soft_fail_reason).toBe("search_budget_exhausted");
  });
});

describe("never Brief / never Pulse lead · cycle locks · HF HTML not wired", () => {
  test("Brief pin set unchanged (hf-incident lead, cycle 003)", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
    const rows = parseCrossrefWorks(
      JSON.parse(FIX_HUGGING) as CrossrefSearchResponse,
    );
    expect(rows.some((e) => e.doi === "hf-incident")).toBe(false);
    expect(rows.every((e) => e.briefEligible === false)).toBe(true);
  });

  test("ingest-last shape stamps crossref.brief=false", async () => {
    const r = await fetchCrossrefEnrich({ fixtureJson: FIX_SURVEY });
    const stamp = {
      cycle: "003",
      lead_id: "hf-incident",
      crossref: {
        ok: r.ok,
        brief: r.brief,
        pulse_lead: r.pulse_lead,
        papers_enrich_only: true,
      },
      hf_html_fallback_wired: false,
    };
    expect(stamp.crossref.brief).toBe(false);
    expect(stamp.cycle).toBe("003");
    expect(stamp.lead_id).toBe("hf-incident");
    expect(stamp.hf_html_fallback_wired).toBe(false);
  });
});
