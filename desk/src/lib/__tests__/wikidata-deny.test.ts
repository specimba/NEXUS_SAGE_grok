import { describe, expect, test, beforeEach } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildWbSearchUrl,
  fetchWikidataDeny,
  filterSearchHits,
  isWikidataBriefEligible,
  isWikidataPulseLeadEligible,
  pickSeedsForTick,
  resetWikidataDenyTickState,
  toDenyHints,
  WIKIDATA_MAX_SEEDS_PER_TICK,
  WIKIDATA_UA,
  type WikidataSearchResponse,
} from "@/lib/wikidata-deny";
import { WIKIDATA_DENY_SEEDS, findSeed } from "@/data/wikidata-deny-seeds";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const FIX_SOL = FIX("wikidata-sol.json");
const FIX_PSOL = FIX("wikidata-persistent-sol.json");
const FIX_ASTRA = FIX("wikidata-astra.json");
const FIX_HF = FIX("wikidata-hugging-face.json");
const FIX_METR = FIX("wikidata-metr.json");
const FIX_METR_SHORT = FIX("wikidata-metr-short.json");

beforeEach(() => {
  resetWikidataDenyTickState();
});

describe("Wikidata DENY fixtures — false-friend reject", () => {
  test("Persistent Sol → reject solar-physics Q34104679 · Brief=false", () => {
    const seed = findSeed("Sol")!;
    const hint = filterSearchHits(seed, JSON.parse(FIX_PSOL) as WikidataSearchResponse);
    expect(hint.status).toBe("rejected_false_friend");
    expect(hint.qid).toBe("Q34104679");
    expect(hint.label).toMatch(/Persistent solar/i);
    expect(hint.description).toMatch(/scientific article/i);
    expect(hint.briefEligible).toBe(false);
    expect(hint.pulseLeadEligible).toBe(false);
    expect(hint.denyGroundingOnly).toBe(true);
    expect(hint.source).toBe("wikidata");
    expect(isWikidataBriefEligible(hint)).toBe(false);
    expect(isWikidataPulseLeadEligible(hint)).toBe(false);
  });

  test("Sol short query → reject solar/given-name false friends · Brief=false", () => {
    const hint = filterSearchHits("Sol", JSON.parse(FIX_SOL) as WikidataSearchResponse);
    expect(hint.status).toBe("rejected_false_friend");
    expect(hint.qid).toBe("Q10673071"); // rejectQids given-name
    expect(hint.briefEligible).toBe(false);
    expect(hint.pulseLeadEligible).toBe(false);
  });

  test("Astra → reject AstraZeneca Q731938 · Brief=false", () => {
    const hint = filterSearchHits("Astra", JSON.parse(FIX_ASTRA) as WikidataSearchResponse);
    expect(hint.status).toBe("rejected_false_friend");
    expect(hint.qid).toBe("Q731938");
    expect(hint.label).toBe("AstraZeneca");
    expect(hint.description).toMatch(/pharmaceutical/i);
    expect(hint.briefEligible).toBe(false);
    expect(hint.pulseLeadEligible).toBe(false);
    expect(hint.denyGroundingOnly).toBe(true);
  });

  test("METR short → metre/museum rejectQids · Brief=false", () => {
    const hint = filterSearchHits(
      "METR",
      JSON.parse(FIX_METR_SHORT) as WikidataSearchResponse,
    );
    expect(hint.status).toBe("rejected_false_friend");
    expect(hint.qid).toBe("Q11573");
    expect(hint.briefEligible).toBe(false);
  });
});

describe("Wikidata DENY fixtures — allowlist match", () => {
  test("Hugging Face → Q108943604 matched · never Brief", () => {
    const hint = filterSearchHits(
      "Hugging Face",
      JSON.parse(FIX_HF) as WikidataSearchResponse,
    );
    expect(hint.status).toBe("matched");
    expect(hint.qid).toBe("Q108943604");
    expect(hint.label).toBe("Hugging Face");
    expect(hint.briefEligible).toBe(false);
    expect(hint.pulseLeadEligible).toBe(false);
  });

  test("METR deepen → Q135185153 eval nonprofit · never Brief", () => {
    const hint = filterSearchHits("METR", JSON.parse(FIX_METR) as WikidataSearchResponse);
    expect(hint.status).toBe("matched");
    expect(hint.qid).toBe("Q135185153");
    expect(hint.label).toMatch(/Model Evaluation and Threat Research/i);
    expect(hint.briefEligible).toBe(false);
  });

  test("HF SAS Q118182434 not allowlisted · Hub Q131939003 is", () => {
    const hf = findSeed("Hugging Face")!;
    expect(hf.allowedQids).toEqual(["Q108943604", "Q131939003"]);
    expect(hf.allowedQids).not.toContain("Q118182434");
    const metr = findSeed("METR")!;
    expect(metr.allowedQids).toEqual(["Q135185153"]);
    expect(metr.allowedQids).not.toContain("Q131899485");
  });
});

describe("toDenyHints + soft-fail + Brief=false", () => {
  test("toDenyHints maps Sol+Astra rejects", () => {
    const hints = toDenyHints([
      { seed: "Sol", payload: JSON.parse(FIX_PSOL) },
      { seed: "Astra", payload: JSON.parse(FIX_ASTRA) },
    ]);
    expect(hints).toHaveLength(2);
    expect(hints[0]!.status).toBe("rejected_false_friend");
    expect(hints[1]!.status).toBe("rejected_false_friend");
    for (const h of hints) {
      expect(h.briefEligible).toBe(false);
      expect(h.pulseLeadEligible).toBe(false);
      expect(h.denyGroundingOnly).toBe(true);
    }
  });

  test("forceSoftFail 429 → soft_fail · Brief=false · ingest continues", async () => {
    const r = await fetchWikidataDeny({ forceSoftFail: 429 });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 429");
    expect(r.ok).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.deny_grounding_only).toBe(true);
    expect(r.searches).toBe(0);
    expect(r.hints.length).toBeGreaterThan(0);
    for (const h of r.hints) {
      expect(h.status).toBe("soft_fail");
      expect(h.briefEligible).toBe(false);
    }
  });

  test("forceSoftFail 503 → soft_fail path", async () => {
    const r = await fetchWikidataDeny({ forceSoftFail: 503, maxSeeds: 1 });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 503");
    expect(r.brief).toBe(false);
  });

  test("HTTP 403 fetch → soft_fail · briefEligible false", async () => {
    const r = await fetchWikidataDeny({
      cacheDir: "/tmp/wikidata-deny-test-cache-403",
      maxSeeds: 1,
      now: 0,
      minIntervalMs: 0,
      fetchImpl: (async () =>
        new Response("forbidden", { status: 403 })) as unknown as typeof fetch,
    });
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toBe("HTTP 403");
    expect(r.brief).toBe(false);
    expect(r.hints[0]!.status).toBe("soft_fail");
    expect(r.hints[0]!.briefEligible).toBe(false);
  });

  test("fixturesBySeed offline path · Sol rejected · HF matched · brief false", async () => {
    const r = await fetchWikidataDeny({
      fixturesBySeed: {
        Sol: FIX_PSOL,
        Astra: FIX_ASTRA,
        "Hugging Face": FIX_HF,
        METR: FIX_METR,
      },
      maxSeeds: 4,
      now: 0, // day 0 → start at Sol
    });
    expect(r.brief).toBe(false);
    expect(r.pulse_lead).toBe(false);
    expect(r.soft_fail).toBe(false);
    expect(r.searches).toBe(0);
    const bySeed = Object.fromEntries(r.hints.map((h) => [h.seed, h]));
    expect(bySeed["Sol"]?.status).toBe("rejected_false_friend");
    expect(bySeed["Sol"]?.qid).toBe("Q34104679");
    expect(bySeed["Astra"]?.status).toBe("rejected_false_friend");
    expect(bySeed["Astra"]?.qid).toBe("Q731938");
    expect(bySeed["Hugging Face"]?.status).toBe("matched");
    expect(bySeed["Hugging Face"]?.qid).toBe("Q108943604");
    expect(bySeed["METR"]?.status).toBe("matched");
  });
});

describe("rate / rotate / locks / Scout SoT", () => {
  test("≤3 seeds per tick rotate · core four first", () => {
    const a = pickSeedsForTick(0, WIKIDATA_MAX_SEEDS_PER_TICK);
    expect(a.length).toBeLessThanOrEqual(3);
    expect(a.length).toBe(3);
    expect(WIKIDATA_DENY_SEEDS.length).toBeGreaterThanOrEqual(4);
    expect(WIKIDATA_DENY_SEEDS.slice(0, 4).map((s) => s.seed)).toEqual([
      "Sol",
      "Astra",
      "Hugging Face",
      "METR",
    ]);
    // day 0 → Sol, Astra, HF
    expect(a.map((s) => s.seed)).toEqual(["Sol", "Astra", "Hugging Face"]);
  });

  test("rejectQids present on core seeds (Scout REJECT table)", () => {
    expect(findSeed("Sol")!.rejectQids).toContain("Q34104679");
    expect(findSeed("Astra")!.rejectQids).toContain("Q731938");
    expect(findSeed("Hugging Face")!.rejectQids).toContain("Q87583026");
    expect(findSeed("METR")!.rejectQids).toContain("Q11573");
  });

  test("reject before allowlist — allowlisted Q-id still rejected if in rejectQids", () => {
    const seed = findSeed("Hugging Face")!;
    const hint = filterSearchHits(seed, {
      search: [
        {
          id: "Q87583026",
          label: "🤗",
          description: "Unicode character",
          aliases: ["HUGGING FACE"],
        },
        {
          id: "Q108943604",
          label: "Hugging Face",
          description: "American company",
        },
      ],
    });
    // emoji rejected first; next allowlisted → matched
    expect(hint.status).toBe("matched");
    expect(hint.qid).toBe("Q108943604");
  });

  test("exact allowlist only — never invent non-allowlisted org", () => {
    const seed = findSeed("Hugging Face")!;
    const hint = filterSearchHits(seed, {
      search: [
        {
          id: "Q118182434",
          label: "Hugging Face SAS",
          description: "French company",
        },
      ],
    });
    expect(hint.status).toBe("unresolved");
    expect(hint.qid).toBeNull();
    expect(hint.briefEligible).toBe(false);
  });

  test("wbsearchentities URL + UA contract", () => {
    const url = buildWbSearchUrl("Persistent Sol");
    expect(url).toContain("action=wbsearchentities");
    expect(url).toContain("search=Persistent");
    expect(url).toContain("language=en");
    expect(url).toContain("format=json");
    expect(WIKIDATA_UA).toContain("NEXUS-SAGE-desk/0.2");
    expect(WIKIDATA_UA).toContain("wikidata");
    expect(WIKIDATA_UA).toContain("mailto:local@nexus-sage.invalid");
  });

  test("pins unchanged — cycle 003 / lead hf-incident", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]!.id).toBe("hf-incident");
    expect(CYCLE.pins[0]!.kind).toBe("lead");
  });

  test("unresolved when empty search — never invent", () => {
    const hint = filterSearchHits("Sol", { search: [] });
    expect(hint.status).toBe("unresolved");
    expect(hint.qid).toBeNull();
    expect(hint.briefEligible).toBe(false);
  });
});
