import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GMAIL_NEWS } from "@/data/gmail-news";
import { gmailPublicSummary, renderGmailNewsTs } from "@/lib/gmail-news-render";

const DESK = join(import.meta.dir, "../../..");
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i;

describe("Intel plan 3 — published Gmail snapshot is publisher + link + short summary only", () => {
  test("committed snapshot: no email address, no from/snippet/body field anywhere", () => {
    const src = readFileSync(join(DESK, "src/data/gmail-news.ts"), "utf8");
    expect(src).not.toMatch(EMAIL);
    expect(src).not.toMatch(/\b(from|snippet|sender|body)\s*:/);
    for (const r of GMAIL_NEWS) {
      expect(Object.keys(r).sort()).toEqual(["briefEligible", "id", "link", "priority", "published", "publisher", "pulse_only", "qi", "source", "summary", "tag", "title"]);
      expect(r.summary).toBe(gmailPublicSummary(r.publisher));
      expect(r.summary.length).toBeLessThanOrEqual(64);
    }
  });
  test("renderer drops the From address and the mail snippet even when a hit carries them", () => {
    const hit = { id: "gmail:x", title: "Qwen ships", link: "https://example.com/a", published: "2026-10-24T10:00:00Z", publisher: "axios.com", qi: 5, priority: "P2" as const, tag: "rest" as const,
      from: "secret_alias@simplelogin.co", snippet: "private body text", summary: "private body text https://example.com/a" };
    const out = renderGmailNewsTs([hit], "2026-10-24T10:00:00Z");
    expect(out).not.toMatch(EMAIL);
    expect(out).not.toContain("private body text");
    expect(out).toContain('summary: "via axios.com"');
  });
});
