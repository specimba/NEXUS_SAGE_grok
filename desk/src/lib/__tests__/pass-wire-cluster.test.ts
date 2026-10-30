import { describe, expect, test } from "bun:test";
import { clusterItems, isSloganTitle, storyKey, type PulseInput } from "@/lib/dedupe";
import { isExcludedStory, wireCandidates } from "@/lib/wire";
import { buildTldr } from "@/lib/tldr-24h";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Real titles from crawl 2026-10-30T19:51:04Z (PASS-WIRE-CLUSTER live FAIL).
const MISTRAL: PulseInput[] = [
  { id: "rss:mistral:bd03", source: "rss-lab", title: "Le Chonk: Built for Coders, Trusted by Defenders.", url: "https://mistral.ai/news/mistral-large-4-oss/?utm_source=x", at: "2026-10-30T02:47:04Z", publisher: "Mistral" },
  { id: "rss:testingcatalog:37bb", source: "rss-lab", title: "Mistral opens Large 4 weights for coding and security", url: "https://www.testingcatalog.com/mistral-opens-large-4-weights-for-coding-and-security/", at: "2026-10-29T15:48:13Z", publisher: "TestingCatalog" },
  { id: "rss:huggingface:b6b3", source: "rss-lab", title: "Welcome Le Chonk: Mistral Large 4 on Hugging Face", url: "https://huggingface.co/blog/mistral-large4", at: "2026-10-29T15:18:51Z", publisher: "Hugging Face" },
  { id: "gnews:ceed", source: "gnews-rss", title: "Mistral releases the weights of Le Chonk, its trillion-parameter open model built for coders and cyber defenders - Dealroom", url: "https://news.google.com/rss/articles/CBMi3gFBVV95cUxPS2NLQkY3WXNvRTJ0ZG5oN0Jfb1ROVUFIUURmc?oc=5", at: "2026-10-30T19:17:05Z", publisher: "Dealroom" },
  { id: "gnews:2233", source: "gnews-rss", title: "Mistral Releases 1-Trillion-Parameter AI Model for Cybersecurity - SecurityWeek", url: "https://news.google.com/rss/articles/CBMikgFBVV95cUxNTGpzMXpHR1d5RE1oQ2c0NWRYWlVlTk9HM2due?oc=5", at: "2026-10-30T16:20:41Z", publisher: "SecurityWeek" },
  { id: "gnews:dcd5", source: "gnews-rss", title: "Mistral Releases Large 4 Model to Help Organizations Find Cyber Vulnerabilities - WSJ", url: "https://news.google.com/rss/articles/CBMiugFBVV95cUxNalpFakYzLXpwYmhJMlN5TXhDdGJGbFk3X1BWT?oc=5", at: "2026-10-30T19:48:52Z", publisher: "WSJ" },
  { id: "hn:50289418", source: "hn-algolia", title: "Mistral Large 4 open weights", url: "https://mistral.ai/news/mistral-large-4-oss", at: "2026-10-30T03:00:00Z" },
];

describe("PASS-WIRE-CLUSTER", () => {
  test("fixture: mistral.ai URL + GNews blob + Le Chonk alias → one cluster, news-form title", () => {
    const cl = clusterItems(MISTRAL);
    expect(cl.length).toBe(1);
    expect(cl[0].size).toBe(MISTRAL.length);
    expect(cl[0].lead_id).toBe("rss:mistral:bd03");
    expect(cl[0].url).toContain("mistral.ai");
    expect(isSloganTitle(cl[0].title)).toBe(false);
    expect(cl[0].title).toBe("Mistral opens Large 4 weights for coding and security");
    expect(cl[0].sources).toEqual(["rss-lab", "hn-algolia", "gnews-rss"]);
  });

  test("lab-release alias is narrow: 48h window, roundups and other Mistral posts stay apart", () => {
    const cl = clusterItems([
      ...MISTRAL,
      { id: "rss:mistral:old", source: "rss-lab", title: "Introducing Mistral Large 4", url: "https://mistral.ai/news/mistral-large-4/", at: "2026-10-06T12:00:27Z" },
      { id: "gnews:radar", source: "gnews-rss", title: "Daily AI Launch Radar: Mistral Large 4 weights, Copilot Fusion and Replit Cloud Agents - X", url: "https://news.google.com/rss/articles/CBMiXkFV?oc=5", at: "2026-10-30T15:47:05Z", publisher: "X" },
      { id: "rss:mistral:vox", source: "rss-lab", title: "Voxtral 3", url: "https://mistral.ai/news/voxtral-3/", at: "2026-10-30T12:00:00Z" },
    ]);
    expect(cl.length).toBe(4);
    expect(storyKey("Introducing Mistral Large 4")).toBe("mistral-large-4");
    expect(storyKey("Daily AI Launch Radar: Mistral Large 4 weights")).toBeNull();
  });

  test("Blackstone/Anthropic rating twins → one cluster", () => {
    const cl = clusterItems([
      { id: "hn:50307219", source: "hn-algolia", title: "Anthropic may not secure investment-grade rating after IPO, Blackstone says", url: "https://www.ft.com/content/59383c7f", at: "2026-10-30T17:27:25Z" },
      { id: "rss:huggingnews:a074", source: "rss-lab", title: "Blackstone Forecasts Junk Credit Rating for Anthropic Following IPO", url: "https://huggingnews.com/ai/blackstone-forecasts-junk", at: "2026-10-30T17:08:45Z" },
      { id: "gnews:other", source: "gnews-rss", title: "Anthropic hacked to deliver remote access trojan - X", url: "https://news.google.com/rss/articles/CBMiZZZ?oc=5", at: "2026-10-30T17:00:00Z" },
    ]);
    expect(cl.length).toBe(2);
    const twin = cl.find((c) => c.member_ids.includes("hn:50307219"))!;
    expect(twin.member_ids).toContain("rss:huggingnews:a074");
    // Lead id from history still hides the re-headed cluster from the Wire.
    expect(isExcludedStory(twin, new Set(["cl:hn:50307219"]))).toBe(true);
  });

  test("canonical key: alt_urls (guid / landing) merge an opaque GNews blob", () => {
    const cl = clusterItems([
      { id: "rss:a", source: "rss-lab", title: "Short", url: "https://example.com/story?utm_source=rss", at: "2026-10-30T10:00:00Z" },
      { id: "gnews:b", source: "gnews-rss", title: "Unrelated words here entirely", url: "https://news.google.com/rss/articles/CBMiAU_opaque?oc=5", at: "2026-10-30T11:00:00Z", alt_urls: ["https://www.example.com/story/"] },
    ]);
    expect(cl.length).toBe(1);
  });

  test("Wire rank: ≥24h-stale cluster does not outrank fresher news within 1 SRC", () => {
    const mk = (id: string, at: string, pubs: string[]) => ({
      id, title: `AI model story ${id} release`, url: `https://x.test/${id}`, canonical_url: `https://x.test/${id}`,
      lead_id: `${id}-0`, lead_source: "rss-lab" as const, sources: ["rss-lab", "gnews-rss"] as const, member_ids: pubs.map((_, i) => `${id}-${i}`),
      size: pubs.length, at, is_new: false,
    });
    const pubs: Record<string, string> = {};
    for (const [id, n] of [["old", 3], ["fresh", 2]] as const) for (let i = 0; i < n; i++) pubs[`${id}-${i}`] = `${id}pub${i}`;
    const out = wireCandidates([mk("old", "2026-10-29T08:00:00Z", ["a", "b", "c"]), mk("fresh", "2026-10-30T19:00:00Z", ["a", "b"])] as never, { publishers: pubs });
    expect(out.map((o) => o.id)).toEqual(["fresh", "old"]);
  });

  test("Claude Code compromised-extension variants (Brief + Wire titles) → one; other Claude Code stories stay apart", () => {
    const cl = clusterItems([
      { id: "rss:the-decoder:c2e9", source: "rss-lab", title: "Malicious Claude Code extension in Cursor's marketplace attempted remote access and data theft", url: "https://the-decoder.com/malicious-claude-code-extension", at: "2026-10-30T05:20:20Z" },
      { id: "gnews:95e1", source: "gnews-rss", title: "Cursor Confirms Anthropic Claude Code Extension Compromised - BankInfoSecurity", url: "https://news.google.com/rss/articles/CBMiogFBVV95?oc=5", at: "2026-10-30T19:11:09Z", publisher: "BankInfoSecurity" },
      { id: "hn:50286306", source: "hn-algolia", title: "Tell HN: Claude Code adds your email to the prompt, the LLM sends it to websites", url: "https://news.ycombinator.com/item?id=50286306", at: "2026-10-29T09:06:12Z" },
      { id: "hn:50284255", source: "hn-algolia", title: "Claude Code regularly sends each background agent's transcript to its model", url: "https://x.test/transcript", at: "2026-10-29T03:33:42Z" },
    ]);
    expect(cl.length).toBe(3);
    expect(cl.find((c) => c.member_ids.includes("gnews:95e1"))!.member_ids).toContain("rss:the-decoder:c2e9");
  });

  test("cross-lane: Brief list excludes the lead story (by member id after a re-head)", () => {
    const mk = (id: string, title: string, members: string[]) => ({
      id, title, url: `https://x.test/${id}`, canonical_url: `https://x.test/${id}`, lead_id: members[0], lead_source: "rss-lab" as const,
      sources: ["rss-lab", "hn-algolia"] as const, member_ids: members, size: members.length, at: "2026-10-30T18:00:00Z", is_new: false,
    });
    const clusters = [
      mk("cl:rss:huggingnews:a074", "Blackstone Forecasts Junk Credit Rating for Anthropic Following IPO", ["rss:huggingnews:a074", "hn:50307219"]),
      mk("cl:rss:x:1", "Mistral opens Large 4 weights for coding and security", ["rss:x:1", "hn:2"]),
    ];
    const publishers = { "rss:huggingnews:a074": "HuggingNews", "hn:50307219": "HN", "rss:x:1": "TC", "hn:2": "HN" };
    const t = buildTldr(clusters as never, { crawlAt: "2026-10-30T19:51:04Z", date: "2026-10-30", publishers, excludeIds: ["cl:hn:50307219"] });
    expect(t.bullets.map((b) => b.id)).toEqual(["cl:rss:x:1"]);
  });

  test("rank-snapshot: Wire excludes lead + Brief bullet ids (one row per story across Brief + Wire)", () => {
    const src = readFileSync(resolve(import.meta.dir, "../../../scripts/rank-snapshot.ts"), "utf8");
    expect(src).toContain("excludeIds: [...leadIds, ...briefIds]");
    expect(src).toContain("writeTldr(desk, leadIds)");
  });
});
