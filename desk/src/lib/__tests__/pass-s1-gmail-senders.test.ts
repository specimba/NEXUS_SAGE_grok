/**
 * PASS-S1.5 — Gmail sender trust list (refs/PASS-S1-SCOUT-SOURCES.md §S1.5, acceptance test 7 + the S1.5 part of 1).
 * Pure: no Gmail credentials, no network (Gmail stays box-only).
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  buildGmailQuery,
  configureGmail,
  GMAIL_QUERY,
  GMAIL_SEED_KEYWORDS,
  GMAIL_SENDERS_DEFAULT,
  isNoise,
  senderTrust,
  toHit,
} from "@/lib/gmail-news";
import { defaultSageConfig, validateSageConfig } from "@/lib/sage-config";
import { applySageConfig } from "@/lib/sage-config-disk";

afterEach(() => configureGmail());
const NOW = Date.parse("2026-10-16T09:00:00Z");

describe("S1.7 #7 — Gmail sender trust list", () => {
  test("VentureBeat mail gets trust 2 (was 1.5 by the built-in hello@ rule)", () => {
    configureGmail({ senders: [] });
    expect(senderTrust("VentureBeat <hello@newsletters.venturebeat.com>")).toBe(1.5);
    configureGmail();
    expect(senderTrust("VentureBeat <hello@newsletters.venturebeat.com>")).toBe(2);
    expect(senderTrust("hello@newsletters.venturebeat.com")).toBe(2);
    expect(senderTrust("Takara TLDR <takaramono@tldr.takara.ai>")).toBe(2);
  });

  test("a 'Learn how…' subject is dropped (any sender, listed ones too)", () => {
    const vb = { id: "m1", subject: "Learn how agentic AI cuts inference cost", sender: "VentureBeat <hello@newsletters.venturebeat.com>", snippet: "AI https://venturebeat.com/x", date: new Date(NOW).toUTCString() };
    expect(isNoise(vb)).toBe(true);
    expect(toHit(vb, NOW)).toBeNull();
    for (const s of ["Join our webinar on LLM security", "Sponsored: the AI stack", "Partner content: GPUs for AI"]) expect(isNoise({ ...vb, subject: s })).toBe(true);
    // ordinary AI subject from the same sender still lands
    const ok = toHit({ ...vb, subject: "OpenAI ships GPT-6 agent SDK" }, NOW);
    expect(ok).not.toBeNull();
    expect(ok!.briefEligible).toBe(false);
  });

  test("a TLDR mail from a non-listed sender keeps its old trust", () => {
    configureGmail({ senders: [] });
    const before = senderTrust("TLDR AI <dan@tldrnewsletter.com>");
    configureGmail();
    expect(senderTrust("TLDR AI <dan@tldrnewsletter.com>")).toBe(before);
  });

  test("the list can never lower a built-in trust", () => {
    configureGmail({ senders: ["someone@substack.com"] });
    expect(senderTrust("someone@substack.com")).toBe(2);
    configureGmail({ senders: [] });
    expect(senderTrust("Writer <writer@substack.com>")).toBe(2);
    expect(senderTrust("noreply@example.com")).toBe(0.5);
  });

  test("query contains both from: addresses; no TLDR seed term", () => {
    const q = buildGmailQuery();
    expect(q).toBe(GMAIL_QUERY);
    expect(q).toContain("from:(hello@newsletters.venturebeat.com OR takaramono@tldr.takara.ai)");
    for (const a of GMAIL_SENDERS_DEFAULT) expect(q).toContain(a);
    expect(q).not.toMatch(/subject:\([^)]*\bTLDR\b/i);
    expect((GMAIL_SEED_KEYWORDS as readonly string[]).some((k) => /tldr/i.test(k))).toBe(false);
    expect(q).toContain("newer_than:14d");
  });

  test("config drives the from: clause (applySageConfig)", () => {
    const c = defaultSageConfig();
    c.keywords.gmail_senders = ["news@example.org"];
    applySageConfig(c);
    expect(buildGmailQuery()).toContain("from:(news@example.org)");
    expect(buildGmailQuery()).not.toContain("venturebeat");
    applySageConfig(defaultSageConfig());
    expect(buildGmailQuery()).toBe(GMAIL_QUERY);
  });
});

describe("S1.7 #1 (S1.5 part) — gmail_senders validator", () => {
  const withSenders = (v: unknown) => {
    const c = defaultSageConfig() as unknown as { keywords: Record<string, unknown> };
    c.keywords.gmail_senders = v;
    return c;
  };
  test("defaults validate", () => {
    expect(defaultSageConfig().keywords.gmail_senders).toEqual(["hello@newsletters.venturebeat.com", "takaramono@tldr.takara.ai"]);
    expect(validateSageConfig(withSenders([...GMAIL_SENDERS_DEFAULT])).ok).toBe(true);
  });
  test("S1.8: empty list is accepted and means off — no from: clause, no trust raise (built-in trust only)", () => {
    expect(validateSageConfig(withSenders([])).ok).toBe(true);
    const c = defaultSageConfig();
    c.keywords.gmail_senders = [];
    applySageConfig(c);
    expect(buildGmailQuery()).not.toContain("from:");
    expect(senderTrust("VentureBeat <hello@newsletters.venturebeat.com>")).toBe(1.5);
    applySageConfig(defaultSageConfig());
    expect(buildGmailQuery()).toBe(GMAIL_QUERY);
  });
  test("malformed addresses rejected", () => {
    for (const bad of ["venturebeat.com", "*@venturebeat.com", "VentureBeat <hello@newsletters.venturebeat.com>", "hello@localhost", "@x.com", "a b@x.com", " hello@x.com"])
      expect(validateSageConfig(withSenders([bad])).ok).toBe(false);
  });
  test("≤ 20, no duplicates", () => {
    const many = Array.from({ length: 21 }, (_, i) => `n${i}@example.com`);
    expect(validateSageConfig(withSenders(many.slice(0, 20))).ok).toBe(true);
    expect(validateSageConfig(withSenders(many)).ok).toBe(false);
    expect(validateSageConfig(withSenders(["a@x.com", "A@x.com"])).ok).toBe(false);
  });
});
