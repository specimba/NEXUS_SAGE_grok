import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  clampHitsPerPage,
  fetchHnPulse,
  HN_WATCHLIST_QUERIES,
  hnQueriesSafe,
  hnStandingQueries,
  isHnBriefEligible,
  parseHnHits,
  queryHash,
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
    const rows = await fetchHnPulse({ fixtureJson: FIXTURE });
    expect(rows.some((r) => r.id === "hn:49458161")).toBe(true);
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

  test("standing queries are watchlist nouns — no incident nouns", () => {
    expect(HN_WATCHLIST_QUERIES).toEqual([
      "OpenAI",
      "Anthropic",
      "Hugging Face",
      "agents",
      "eval",
    ]);
    expect(hnQueriesSafe()).toBe(true);
    const qs = hnStandingQueries();
    for (const q of qs) {
      const lower = q.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        expect(lower.includes(n.toLowerCase())).toBe(false);
      }
    }
    expect(() => hnStandingQueries(["Persistent-Sol artifactory"])).toThrow();
  });
});
