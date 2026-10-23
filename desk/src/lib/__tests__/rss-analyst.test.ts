/** PASS-A2 — analyst AI-title gate: AI names pass alone; company words need an ai_terms match (refs/PASS-A2-ANALYST-NAMES.md A2.2). */
import { describe, expect, test } from "bun:test";
import { ANALYST_AI_NAMES, ANALYST_COMPANY_WORDS, ANALYST_AI_NAME_WORDS, ANALYST_COMPANY_WORD_LIST, analystAiTitle, analystDropReason } from "@/lib/rss-analyst";
import { HEAT_COMPANIES, OTHER_LABS } from "@/lib/topic-heat";

const reason = (t: string) => analystDropReason(t, "", "simonw");

describe("PASS-A2 analyst names vs company words", () => {
  const kept: [number, string][] = [
    [1, "Gemini 3 Flash pricing, tested"],
    [2, "Running Llama 4 on a laptop"],
    [3, "Nvidia's new inference chip for LLMs"],
    [4, "Google ships an AI agent for Sheets"],
    [5, "Anthropic's new usage limits"],
    [6, "Notes on DeepSeek V4.1-Flash"],
    [13, "NVIDIA GTC keynote: agents everywhere"],
  ];
  for (const [n, t] of kept) test(`${n} kept: ${t}`, () => {
    expect(analystAiTitle(t)).toBe(true);
    expect(reason(t)).toBeNull();
  });
  const dropped: [number, string][] = [
    [7, "Google Docs gets a new outline view"],
    [8, "GeForce driver 590 release notes"],
    [9, "Meta's Q3 earnings call"],
    [10, "Xiaomi 17 camera review"],
    [11, "Alibaba Singles' Day numbers"],
  ];
  for (const [n, t] of dropped) test(`${n} dropped company-only: ${t}`, () => {
    expect(analystAiTitle(t)).toBe(false);
    expect(ANALYST_COMPANY_WORDS.test(t)).toBe(true);
    expect(reason(t)).toBe("not-ai:company-only");
  });
  test("12 Metaprogramming in Rust → plain not-ai (word boundary)", () => {
    expect(ANALYST_COMPANY_WORDS.test("Metaprogramming in Rust")).toBe(false);
    expect(reason("Metaprogramming in Rust")).toBe("not-ai");
  });
  test("14 every heat entry word is in exactly one list", () => {
    const words = (re: RegExp) =>
      re.source.replace(/\(\?![^)]*\)/g, "").replace(/\\b/g, "").replace(/[()]/g, "").split("|").map((w) => w.toLowerCase()).filter(Boolean);
    const heat = [...HEAT_COMPANIES.filter((c) => c.id !== "other").flatMap((c) => words(c.re)), ...Object.values(OTHER_LABS).flatMap((l) => words(l.re))];
    const ai = new Set(ANALYST_AI_NAME_WORDS.map((w) => w.word));
    const co = new Set(ANALYST_COMPANY_WORD_LIST.map((w) => w.word));
    for (const w of heat) expect([w, Number(ai.has(w)) + Number(co.has(w))]).toEqual([w, 1]);
    for (const w of ai) expect(co.has(w)).toBe(false);
    expect(ai.has("google")).toBe(false);
    expect(co.has("google")).toBe(true);
    // A2.4 rulings: mimo + cuda are company words; hugging face stays an AI name.
    expect([co.has("mimo"), co.has("cuda"), ai.has("hugging ?face")]).toEqual([true, true, true]);
    expect(reason("MIMO antenna arrays for 6G")).toBe("not-ai:company-only");
    expect(reason("Xiaomi MiMo LLM release notes")).toBeNull();
    expect(ANALYST_AI_NAMES.test("Google AI blog: new release")).toBe(true); // google-ai lab id stays an AI name
    expect(Object.isFrozen(ANALYST_AI_NAMES) && Object.isFrozen(ANALYST_COMPANY_WORDS)).toBe(true);
  });
});

import { baseDeskUrl } from "../../../scripts/lib/desk-url";
describe("PASS-A2 (a) overflow-390 base url", () => {
  test("?view=setup[&edit=1] and #hash reduce to the base page; other params kept", () => {
    expect(baseDeskUrl("http://127.0.0.1:3000/NEXUS_SAGE_grok/?view=setup&edit=1#brief")).toBe("http://127.0.0.1:3000/NEXUS_SAGE_grok/");
    expect(baseDeskUrl("http://127.0.0.1:3000/?view=setup")).toBe("http://127.0.0.1:3000/");
    expect(baseDeskUrl("http://127.0.0.1:3000/?x=1&view=setup")).toBe("http://127.0.0.1:3000/?x=1");
    expect(baseDeskUrl("http://127.0.0.1:3000/")).toBe("http://127.0.0.1:3000/");
  });
});
