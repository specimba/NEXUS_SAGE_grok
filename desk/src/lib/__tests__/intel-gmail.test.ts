import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applySageConfig } from "@/lib/sage-config-disk";
import { defaultSageConfig, validateSageConfig } from "@/lib/sage-config";
import { buildGmailQuery, gmailCaps, isNoise } from "@/lib/gmail-news";

const DESK = join(import.meta.dir, "../../..");
const committed = () => JSON.parse(readFileSync(join(DESK, "config/sage-sources.json"), "utf8"));
const SENDERS = [
  "daily_papers_digest@notifications.huggingface.co", "radar@emails.benchlm.ai", "takaramono@tldr.takara.ai",
  "hello@newsletters.venturebeat.com", "news@news.nl00.net", "news_at_securityweek_com_yxdqtunr@simplelogin.co",
  "testingcatalog@ghost.io", "hello@theinformation.com", "info@theinformation.com", "advisories@aikido.dev",
  "ai.plus@axios.com", "tracker@ssh.codes", "turingpost@mail.beehiiv.com", "nlpnews@substack.com",
];
const SEED = ["AI", "LLM", "model", "open weights", "agent", "MCP", "OpenAI", "Anthropic", "Claude", "Gemini", "Grok", "DeepSeek", "Qwen", "CVE", "RCE", "zero-day", "vulnerability", "prompt injection", "paper", "benchmark", "release", "API"];

afterAll(() => applySageConfig(defaultSageConfig()));

describe("Intel plan 2 — Gmail config", () => {
  test("committed config: 14 senders, 22 seed terms, caps 48/16, window 3 days; validator accepts it unclamped", () => {
    const c = committed();
    expect(c.keywords.gmail_senders).toEqual(SENDERS);
    expect(c.keywords.gmail_seed).toEqual(SEED);
    expect(c.sources.gmail).toEqual({ on: true, fetch_cap: 48, emit_cap: 16, window_days: 3 });
    const v = validateSageConfig(c);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.config.sources.gmail).toEqual(c.sources.gmail);
  });
  test("applied: query carries every sender + 3d window; caps follow config", () => {
    const v = validateSageConfig(committed());
    if (!v.ok) throw new Error("invalid");
    applySageConfig(v.config);
    const q = buildGmailQuery();
    for (const s of SENDERS) expect(q).toContain(s);
    expect(q).toContain("newer_than:3d");
    expect(q).toContain('"prompt injection"');
    expect(gmailCaps()).toEqual({ fetchCap: 48, emitCap: 16, windowDays: 3 });
  });
  test("isNoise applies politics_deny (config list), AI mail passes", () => {
    const v = validateSageConfig(committed());
    if (!v.ok) throw new Error("invalid");
    applySageConfig(v.config);
    const m = (subject: string) => ({ subject, sender: "ai.plus@axios.com", snippet: "" });
    expect(isNoise(m("Trump signs AI order"))).toBe(true);
    expect(isNoise(m("Republicans and the chip bill"))).toBe(true);
    expect(isNoise(m("Qwen ships open weights model"))).toBe(false);
    const c = structuredClone(v.config);
    c.keywords.politics_deny = [...c.keywords.politics_deny, "senate"];
    applySageConfig(c);
    expect(isNoise(m("Senate hearing on AI agents"))).toBe(true);
  });
});
