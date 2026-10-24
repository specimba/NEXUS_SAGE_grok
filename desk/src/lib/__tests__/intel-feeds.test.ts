import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LAB_FEEDS, labReference, parseRssOrAtom, toLabItems } from "@/lib/rss-labs";
import { ANALYST_AI_NAMES } from "@/lib/rss-analyst";
import { LAB_FEED_IDS } from "@/lib/sage-config";

const DESK = join(import.meta.dir, "../../..");
const cfg = JSON.parse(readFileSync(join(DESK, "config/sage-sources.json"), "utf8"));

const ATOM = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><id>https://huggingnews.com/ai/x-1</id><title>Lab ships open weights model</title><link rel="alternate" href="https://huggingnews.com/ai/x-1"/><category term="ai"/><published>2026-10-24T18:00:00Z</published><summary type="text">${"Long body sentence about the open weights model release. ".repeat(12)}</summary></entry></feed>`;

describe("Intel plan 1 — HuggingNews / TestingCatalog / Cursor feeds", () => {
  test("registry entries with the verified URLs; config lists them; ids come from the registry", () => {
    const url = (lab: string) => LAB_FEEDS.find((f) => f.lab === lab)?.urls[0];
    expect(url("huggingnews")).toBe("https://huggingnews.com/feed.xml");
    expect(url("testingcatalog")).toBe("https://www.testingcatalog.com/rss/");
    expect(url("cursor")).toBe("https://cursor.com/changelog/rss.xml");
    for (const id of ["huggingnews", "testingcatalog", "cursor"]) expect(cfg.sources.lab_rss.feeds).toContain(id);
    for (const id of cfg.sources.lab_rss.feeds) expect(LAB_FEED_IDS).toContain(id);
  });
  test("HuggingNews is reference-only: headline, ≤160-char excerpt, link back, credited via HuggingNews, nothing else", () => {
    expect(labReference("huggingnews")).toEqual({ via: "HuggingNews", excerptMax: 160 });
    expect(labReference("testingcatalog")).toBeNull();
    const [it] = toLabItems(parseRssOrAtom(ATOM), "huggingnews");
    expect(it!.title).toBe("Lab ships open weights model");
    expect(it!.link).toBe("https://huggingnews.com/ai/x-1");
    expect(it!.summary.endsWith(" · via HuggingNews")).toBe(true);
    expect(it!.summary.replace(/ · via HuggingNews$/, "").length).toBeLessThanOrEqual(160);
    expect(it!.categories).toBeUndefined();
  });
  test("outlet ids never become analyst AI names; generated data types stay the registry LabId", () => {
    expect(ANALYST_AI_NAMES.test("Cursor raises a new round")).toBe(false);
    expect(ANALYST_AI_NAMES.test("testingcatalog weekly")).toBe(false);
    expect(readFileSync(join(DESK, "src/data/rss-labs.ts"), "utf8")).toContain("  lab: LabId;");
  });
});
