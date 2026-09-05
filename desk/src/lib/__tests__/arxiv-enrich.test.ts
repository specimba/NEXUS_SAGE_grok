import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyArxivEnrichment,
  fetchArxivByIds,
  isArxivBriefEligible,
  normalizeArxivId,
  parseAtomEntries,
  toShelfItems,
} from "@/lib/arxiv-enrich";
import { mergeDailyPapers, type Paper } from "@/lib/ingest";
import { CYCLE } from "@/data/cycle";

const FIXTURE = readFileSync(
  resolve(import.meta.dir, "fixtures/arxiv-atom-sample.xml"),
  "utf8",
);

describe("parseAtomEntries → schema", () => {
  test("fixture Atom maps to ArxivEnrichment schema", () => {
    const rows = parseAtomEntries(FIXTURE);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const e = rows.find((r) => r.id === "2609.02749") ?? rows[0]!;
    expect(e.id).toBe("2609.02749");
    expect(e.title.toLowerCase()).toContain("repo-to-skill");
    expect(e.summary.length).toBeGreaterThan(40);
    expect(e.published).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.authors.length).toBeGreaterThan(0);
    expect(e.authors.length).toBeLessThanOrEqual(8);
    expect(e.primaryCategory).toMatch(/^cs\./);
    expect(e.absUrl).toContain("arxiv.org/abs/2609.02749");
    expect(e.pdfUrl).toContain("arxiv.org/pdf/2609.02749");
    expect(e.source).toBe("arxiv-api");
    expect(e.shelfOnly).toBe(true);
  });

  test("normalizeArxivId strips version and URL", () => {
    expect(normalizeArxivId("http://arxiv.org/abs/2609.02749v1")).toBe("2609.02749");
    expect(normalizeArxivId("2609.02749v2")).toBe("2609.02749");
    expect(normalizeArxivId("not-an-id")).toBeNull();
  });

  test("malformed entry id is skipped", () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
      <entry><id>http://arxiv.org/abs/not-real</id><title>x</title><summary>y</summary></entry>
      <entry><id>http://arxiv.org/abs/1706.03762v1</id><title>Attention</title><summary>Is all you need</summary>
        <published>2017-06-12T00:00:00Z</published>
        <link href="https://arxiv.org/abs/1706.03762v1" rel="alternate" type="text/html"/>
        <link href="https://arxiv.org/pdf/1706.03762v1" rel="related" type="application/pdf"/>
        <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.CL"/>
        <author><name>Ashish Vaswani</name></author>
      </entry>
    </feed>`;
    const rows = parseAtomEntries(xml);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("1706.03762");
  });
});

describe("id merge onto Papers", () => {
  test("applyArxivEnrichment fills abstract + pdf without displacing ids", () => {
    const papers: Paper[] = [
      {
        id: "2609.02749",
        title: "Repo-To-Skill stub",
        up: 100,
        href: "https://arxiv.org/abs/2609.02749",
      },
      {
        id: "2609.09999",
        title: "Unrelated kept",
        up: 50,
        href: "https://arxiv.org/abs/2609.09999",
      },
    ];
    const enrichments = parseAtomEntries(FIXTURE);
    const merged = applyArxivEnrichment(papers, enrichments);
    expect(merged.map((p) => p.id)).toEqual(["2609.02749", "2609.09999"]);
    expect(merged[0]!.abstract).toBeTruthy();
    expect(merged[0]!.abstract!.toLowerCase()).toContain("autonomous agents");
    expect(merged[0]!.pdfUrl).toContain("/pdf/2609.02749");
    expect(merged[0]!.href).toContain("/abs/2609.02749");
    expect(merged[1]!.abstract).toBeUndefined();
  });

  test("fetchArxivByIds with fixtureAtom enriches known HF id", async () => {
    const rows = await fetchArxivByIds(["2609.02749"], { fixtureAtom: FIXTURE });
    expect(rows.some((r) => r.id === "2609.02749")).toBe(true);
    const papers = applyArxivEnrichment(
      [
        {
          id: "2609.02749",
          title: "Repo-To-Skill",
          up: 504,
          href: "https://arxiv.org/abs/2609.02749",
        },
      ],
      rows,
    );
    expect(papers[0]!.abstract!.length).toBeGreaterThan(40);
  });

  test("gen/sim merge still keeps agent paper after enrich", () => {
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
    const merged = mergeDailyPapers([student, agent], {
      keptAgent: [agent],
      limit: 2,
    });
    const enriched = applyArxivEnrichment(merged, parseAtomEntries(FIXTURE));
    expect(enriched.some((p) => p.id === agent.id)).toBe(true);
    expect(enriched.find((p) => p.id === agent.id)?.abstract).toBeTruthy();
  });
});

describe("never Brief pin", () => {
  test("enrichments are shelfOnly and not Brief-eligible", () => {
    const rows = parseAtomEntries(FIXTURE);
    for (const e of rows) {
      expect(e.shelfOnly).toBe(true);
      expect(isArxivBriefEligible(e)).toBe(false);
    }
  });

  test("toShelfItems never emits Brief pin ids / lead", () => {
    const rows = parseAtomEntries(FIXTURE);
    const shelf = toShelfItems(rows, ["2609.02749"]);
    expect(shelf.every((s) => s.shelfOnly === true)).toBe(true);
    expect(shelf.every((s) => s.reason === "arxiv-shelf")).toBe(true);
    expect(shelf.every((s) => isArxivBriefEligible(s) === false)).toBe(true);
    const pinIds = new Set(CYCLE.pins.map((p) => p.id));
    for (const s of shelf) {
      expect(pinIds.has(s.id)).toBe(false);
      expect(s.id).not.toBe("hf-incident");
    }
    expect(shelf.some((s) => s.id === "2609.02749")).toBe(false);
  });

  test("Brief pin set unchanged (hf-incident lead, cycle 003)", () => {
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    const rows = parseAtomEntries(FIXTURE);
    expect(rows.every((e) => e.shelfOnly)).toBe(true);
    expect(rows.some((e) => e.id === "hf-incident")).toBe(false);
  });
});
