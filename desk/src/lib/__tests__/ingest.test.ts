import { describe, expect, test } from "bun:test";
import { crawlAgeHours, STALE_HOURS } from "@/lib/x-pulse";
import {
  buildHandleQueries,
  buildSemanticQueries,
  classifyUrl,
  INCIDENT_NOUNS,
  isAgentPaper,
  isBriefEligible,
  isGenSimPaper,
  mergeDailyPapers,
  scoreUrlList,
  SEMANTIC_CLASSES,
  xIngestEnv,
  type Paper,
} from "@/lib/ingest";
import { ingestHandles } from "@/data/x-watchlist";
import { SHELF } from "@/data/shelf";

describe("HF paper displacement", () => {
  const agent: Paper = {
    id: "2609.02749",
    title: "Repo-To-Skill: Distilling GitHub Repositories Into AI4AI Skills",
    up: 105,
    href: "https://arxiv.org/abs/2609.02749",
  };
  const student: Paper = {
    id: "2609.01591",
    title: "StudentSim: Training LLM-based Student Simulators",
    up: 473,
    href: "https://arxiv.org/abs/2609.01591",
  };
  const dream: Paper = {
    id: "2609.09999",
    title: "DreamX: World Model Rollouts",
    up: 500,
    href: "https://arxiv.org/abs/2609.09999",
  };
  const filler = (n: number, up: number): Paper => ({
    id: `2609.0${1000 + n}`,
    title: `Unrelated Vision Paper ${n}`,
    up,
    href: `https://arxiv.org/abs/2609.0${1000 + n}`,
  });

  test("isGenSimPaper detects StudentSim and DreamX", () => {
    expect(isGenSimPaper(student)).toBe(true);
    expect(isGenSimPaper(dream)).toBe(true);
    expect(isGenSimPaper(agent)).toBe(false);
  });

  test("isAgentPaper detects Repo-To-Skill", () => {
    expect(isAgentPaper(agent)).toBe(true);
    expect(isAgentPaper(student)).toBe(false);
  });

  test("gen/sim top does NOT displace kept agent papers", () => {
    const live = [
      student,
      filler(1, 400),
      filler(2, 350),
      filler(3, 300),
      { ...agent, up: 50 }, // would fall off top-4 by upvotes alone
    ];
    const merged = mergeDailyPapers(live, {
      keptAgent: [agent],
      limit: 4,
    });
    expect(merged[0]?.id).toBe(student.id);
    expect(merged.some((p) => p.id === agent.id)).toBe(true);
    expect(merged.length).toBeGreaterThanOrEqual(4);
  });

  test("DreamX top still keeps agent paper", () => {
    const live = [dream, filler(1, 450), filler(2, 440), filler(3, 430), agent];
    const merged = mergeDailyPapers(live, { keptAgent: [agent], limit: 4 });
    expect(isGenSimPaper(merged[0]!)).toBe(true);
    expect(merged.some((p) => p.id === agent.id)).toBe(true);
  });

  test("without gen/sim top, plain upvote cut applies", () => {
    const live = [filler(1, 500), filler(2, 400), filler(3, 300), filler(4, 200), agent];
    const merged = mergeDailyPapers(live, { keptAgent: [agent], limit: 3 });
    expect(merged).toHaveLength(3);
    expect(merged.some((p) => p.id === agent.id)).toBe(false);
  });
});

describe("STALE banner logic", () => {
  test("age > 18h is STALE (Pulse .sage-stale gate)", () => {
    const crawledAt = "2026-09-03T05:40:00Z";
    const now = Date.parse(crawledAt) + (STALE_HOURS + 0.5) * 3_600_000;
    const r = crawlAgeHours(crawledAt, now);
    expect(r.stale).toBe(true);
    expect(r.hours).toBeGreaterThan(18);
  });

  test("fresh crawl under 18h is not STALE", () => {
    const crawledAt = "2026-09-04T04:00:00Z";
    const now = Date.parse(crawledAt) + 2 * 3_600_000;
    expect(crawlAgeHours(crawledAt, now).stale).toBe(false);
  });
});

describe("toolkit shelf — off Brief", () => {
  test("OWASP / scanner URLs classify as shelf", () => {
    expect(classifyUrl("https://owasp.org/www-project-modsecurity/").lane).toBe("shelf");
    expect(classifyUrl("https://github.com/owasp-modsecurity/ModSecurity").lane).toBe("shelf");
    expect(classifyUrl("https://github.com/rcbarnett/caido-scanner").lane).toBe("shelf");
  });

  test("toolkit links are not Brief-eligible", () => {
    for (const item of SHELF) {
      const scored = classifyUrl(item.href);
      expect(scored.lane).toBe("shelf");
      expect(isBriefEligible(item.href)).toBe(false);
      if (item.reason === "arxiv-shelf") {
        expect(scored.reason).toBe("arxiv-shelf");
      }
    }
  });

  test("scoreUrlList shelves toolkit and pulses X", () => {
    const scored = scoreUrlList([
      "https://github.com/albinowax/ActiveScanPlusPlus",
      "https://x.com/stanislavfort/status/2095107971433017510",
      "https://aisle.com/blog/aisle-discovered-six-curl-cves-after-openai-and-anthropic-found-zero",
    ]);
    expect(scored.shelf).toHaveLength(1);
    expect(scored.pulse).toHaveLength(1);
    expect(scored.rest).toHaveLength(1);
  });
});

describe("X query builders", () => {
  test("six semantic classes, no incident nouns", () => {
    expect(SEMANTIC_CLASSES).toHaveLength(6);
    const qs = buildSemanticQueries("2026-09-03");
    expect(qs).toHaveLength(6);
    for (const q of qs) {
      const lower = q.query.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        expect(lower.includes(n.toLowerCase())).toBe(false);
      }
    }
  });

  test("per-handle queries for weight ≥ 3", () => {
    const handles = ingestHandles(3);
    expect(handles.every((h) => h.weight >= 3)).toBe(true);
    const qs = buildHandleQueries(3, "2026-09-03");
    expect(qs.length).toBe(handles.length);
    expect(qs[0]?.query).toContain("from:");
    expect(qs[0]?.query).toContain("since:2026-09-03");
    expect(qs[0]?.query).toContain("-filter:replies");
  });
});

describe("free providers lock", () => {
  test("xIngestEnv never enables live paid X", () => {
    const env = xIngestEnv();
    expect(env.ready).toBe(false);
    expect(env.bearer).toBeNull();
    expect(env.docs.toLowerCase()).toContain("free");
    expect(env.docs).toContain("api.x.com");
  });
});
