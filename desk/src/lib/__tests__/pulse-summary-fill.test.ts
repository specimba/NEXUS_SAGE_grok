/** Desk bug B: HN / GNews / release leads get a real summary (cluster mate, else the article's own og:description). */
import { describe, expect, test } from "bun:test";
import { canLendSummary, fetchOgSummaries, ogEligibleUrl, parseMetaDescription, OG_SUMMARY_CHARS } from "@/lib/og-summary";
import { buildDeskView } from "@/lib/desk-view";
import { rawDeskViewInputs } from "@/lib/desk-view-inputs";

describe("og:description", () => {
  test("og first, then name=description; decoded, collapsed, ≤280", () => {
    expect(parseMetaDescription(`<meta name="description" content="Plain desc that is long enough"><meta content="OG &amp; friends   say hello world" property="og:description">`)).toBe(
      "OG & friends say hello world",
    );
    expect(parseMetaDescription(`<meta name='description' content='Only the plain meta description here'>`)).toBe("Only the plain meta description here");
    expect(parseMetaDescription(`<meta property="og:description" content="${"x".repeat(600)}">`)!.length).toBe(OG_SUMMARY_CHARS);
    expect(parseMetaDescription("<title>none</title>")).toBeNull();
    expect(parseMetaDescription(`<meta name="description" content="short">`)).toBeNull();
  });
  test("top N by score, HN discussion pages and PDFs skipped, soft-fail per URL", async () => {
    expect(ogEligibleUrl("https://news.ycombinator.com/item?id=1")).toBe(false);
    expect(ogEligibleUrl("https://a.org/p.pdf")).toBe(false);
    const seen: string[] = [];
    const fake = (async (u: string) => {
      seen.push(u);
      if (u.includes("boom")) throw new Error("x");
      return new Response(`<meta property="og:description" content="Article ${u} says something real">`, { headers: { "content-type": "text/html" } });
    }) as unknown as typeof fetch;
    const m = await fetchOgSummaries(
      [
        { id: "hn:1", url: "https://a.org/1", score: 50 },
        { id: "hn:2", url: "https://boom.org/2", score: 40 },
        { id: "hn:3", url: "https://a.org/3", score: 1 },
        { id: "hn:4", url: "https://news.ycombinator.com/item?id=4", score: 99 },
      ],
      { n: 2, fetchImpl: fake },
    );
    expect(seen.sort()).toEqual(["https://a.org/1", "https://boom.org/2"]);
    expect([...m.keys()]).toEqual(["hn:1"]);
  });
});

describe("cluster-mate summary", () => {
  test("a lead with no summary borrows a mate's; Gmail / X never lend", () => {
    expect(canLendSummary("gmail:abc")).toBe(false);
    expect(canLendSummary("x:1")).toBe(false);
    expect(canLendSummary("rss:openai:1")).toBe(true);
    const i = rawDeskViewInputs().input;
    const base = buildDeskView(i);
    const kept = new Set(Object.keys(base.memberRows));
    const c = i.clusters.find((c) => kept.has(c.lead_id) && !i.members[c.lead_id]?.summary && c.member_ids.some((id) => id !== c.lead_id && canLendSummary(id) && i.members[id]));
    expect(c).toBeDefined();
    const mate = c!.member_ids.find((id) => id !== c!.lead_id && canLendSummary(id) && i.members[id])!;
    const members = { ...i.members, [mate]: { ...i.members[mate]!, summary: "Mate publisher summary text." } };
    const v = buildDeskView({ ...i, members });
    expect(v.memberRows[c!.lead_id]?.m).toBe("Mate publisher summary text.");
  });
});
