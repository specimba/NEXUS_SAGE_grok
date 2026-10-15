import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { aiTermsDefault } from "../ai-relevance";
import { POLITICS_LEAD_TERMS } from "../lead-pick";
import { defaultSageConfig, KEYWORD_LEN_MAX, KEYWORD_LIST_MAX, limitsFromCode, SAGE_CONFIG_PATH, validateSageConfig, type SageConfig } from "../sage-config";
import { canonicalJson, fileJson, validateWithRules, type SageLimits } from "../sage-config-rules";
import { setupEditFields } from "../sage-config-disk";
import { renderSageSetupModule } from "../sage-setup";
import { SAGE_SETUP } from "@/data/sage-setup";

const desk = resolve(import.meta.dir, "../../..");
const fileText = () => readFileSync(resolve(desk, SAGE_CONFIG_PATH), "utf8");
const BROWSER = SAGE_SETUP.limits as SageLimits;
const withCfg = (patch: (c: SageConfig) => void) => {
  const c = defaultSageConfig() as SageConfig;
  patch(c);
  return c;
};

/** Every PASS-C2 fixture (sage-config.test.ts) + the C3 additions (8a, 8b). */
const FIXTURES: [string, unknown][] = [
  ["committed file", JSON.parse(fileText())],
  ["defaults", defaultSageConfig()],
  ["cap over ceiling", withCfg((c) => (c.sources.gnews.cap = 65))],
  ["timeout over 15 s", withCfg((c) => (c.sources.lab_rss.timeout_s = 16))],
  ["unknown feed id", withCfg((c) => c.sources.lab_rss.feeds.push("anthropic"))],
  ["unknown source", { ...defaultSageConfig(), sources: { ...defaultSageConfig().sources, bluesky: { on: true } } }],
  ["unknown field", { ...defaultSageConfig(), sources: { hn: { on: true, cap: 20, pages: 9 } } }],
  ["cap 0", withCfg((c) => (c.sources.hn.cap = 0))],
  ["non-integer cap", withCfg((c) => (c.sources.hn.cap = 2.5))],
  ["empty feeds", withCfg((c) => (c.sources.sec_rss.feeds = []))],
  ["bad regex term", withCfg((c) => c.keywords.ai_terms.push("(unclosed"))],
  ["secret key", { ...defaultSageConfig(), gh_token: "x" }],
  ["secret value", withCfg((c) => c.keywords.hn_sweep.push("ghp_abcdefghijklmnop"))],
  ["wrong schema", { ...defaultSageConfig(), schema: 2 }],
  ["taste.max raised", withCfg((c) => (c.taste.max = 0.9))],
  ["allowed edits + clamp", withCfg((c) => {
    c.sources.hn.on = false;
    c.sources.gnews.cap = 8;
    c.sources.lab_rss.feeds = ["openai", "deepmind"];
    c.keywords.hn_sweep = ["OpenAI"];
    c.taste.weight = 0.9;
  })],
  ["not an object", [1, 2]],
  ["8b ai{ (i ok, iu bad)", withCfg((c) => c.keywords.ai_terms.push("ai{"))],
  ["8a politics baseline removed", withCfg((c) => (c.keywords.politics_deny = c.keywords.politics_deny.filter((t) => t !== "maga")))],
  ["8a ai baseline removed", withCfg((c) => (c.keywords.ai_terms = c.keywords.ai_terms.filter((t) => t !== "rag")))],
  ["8a politics added", withCfg((c) => c.keywords.politics_deny.push("filibuster"))],
  ["too many terms", withCfg((c) => (c.keywords.hn_sweep = Array.from({ length: KEYWORD_LIST_MAX + 1 }, (_, i) => `t${i}`)))],
  ["term too long", withCfg((c) => c.keywords.hn_sweep.push("x".repeat(KEYWORD_LEN_MAX + 1)))],
];

describe("PASS-C3.1 shared rules — browser path = CI path", () => {
  test("SAGE_SETUP.limits is exactly limitsFromCode() (same numbers + both baseline lists)", () => {
    expect(BROWSER).toEqual(JSON.parse(JSON.stringify(limitsFromCode())));
    expect(BROWSER.baseline.politics_deny).toEqual([...POLITICS_LEAD_TERMS]);
    expect(BROWSER.baseline.ai_terms).toEqual(aiTermsDefault());
  });
  test("SAGE_SETUP.config / file_hash are the committed file (desk-view --check keeps them in sync)", () => {
    const f = setupEditFields(desk);
    expect(SAGE_SETUP.config).toEqual(f.config as object);
    expect(SAGE_SETUP.file_hash).toBe(f.file_hash);
    expect(readFileSync(resolve(desk, "src/data/sage-setup.ts"), "utf8")).toBe(renderSageSetupModule({ ...SAGE_SETUP, ...f }));
  });
  for (const [name, raw] of FIXTURES) {
    test(`1 parity: ${name}`, () => {
      const ci = validateSageConfig(raw);
      expect(validateWithRules(raw, BROWSER)).toEqual(ci);
      expect(validateWithRules(raw, limitsFromCode())).toEqual(ci);
    });
  }
  test("2 ceilings: pasted over-ceiling JSON → the CI error text", () => {
    const raw = withCfg((c) => (c.sources.gnews.cap = 65));
    const b = validateWithRules(raw, BROWSER);
    expect(b.ok).toBe(false);
    expect(!b.ok && b.errors).toEqual(["sources.gnews.cap=65 over the code ceiling 64"]);
  });
  test("3 unknown feed id / unknown field → error", () => {
    const f = validateWithRules(withCfg((c) => c.sources.lab_rss.feeds.push("anthropic")), BROWSER);
    expect(!f.ok && f.errors[0]).toContain("feed id(s) not wired in code: anthropic");
    const u = validateWithRules({ ...defaultSageConfig(), sources: { hn: { on: true, pages: 9 } } }, BROWSER);
    expect(!u.ok && u.errors).toEqual(["unknown field sources.hn.pages"]);
  });
  test("8a lead lists are additions-only — same string in both paths; adding ok; removing an added term ok", () => {
    for (const [list, term] of [["politics_deny", "maga"], ["ai_terms", "rag"]] as const) {
      const raw = withCfg((c) => (c.keywords[list] = c.keywords[list].filter((t) => t !== term)));
      const want = `keywords.${list}: removing "${term}" is a lead rule change — code PR + Reviewer only`;
      const ci = validateSageConfig(raw);
      const br = validateWithRules(raw, BROWSER);
      expect(!ci.ok && ci.errors).toEqual([want]);
      expect(!br.ok && br.errors).toEqual([want]);
      const added = withCfg((c) => c.keywords[list].push("zzadded"));
      expect(validateSageConfig(added).ok).toBe(true);
      expect(validateWithRules(added, BROWSER).ok).toBe(true);
      // "added later" = not in the code baseline: dropping it again is fine
      const dropped = JSON.parse(JSON.stringify(added));
      dropped.keywords[list] = dropped.keywords[list].filter((t: string) => t !== "zzadded");
      expect(validateWithRules(dropped, BROWSER).ok).toBe(true);
    }
  });
  test("8b regex flags: ai{ compiles with i, fails iu — rejected with the same error in both paths", () => {
    expect(() => new RegExp("(?:ai{)", "i")).not.toThrow();
    expect(() => new RegExp("(?:ai{)", "iu")).toThrow();
    const raw = withCfg((c) => c.keywords.ai_terms.push("ai{"));
    const want = ['keywords.ai_terms: invalid regex fragment "ai{" (fails the "iu" lint)'];
    const ci = validateSageConfig(raw);
    expect(!ci.ok && ci.errors).toEqual(want);
    const br = validateWithRules(raw, BROWSER);
    expect(!br.ok && br.errors).toEqual(want);
  });
  test("8c canonical file: the committed file is exactly its own 2-space JSON + newline (precondition for test 4)", () => {
    const t = fileText();
    expect(fileJson(JSON.parse(t))).toBe(t);
    // canonicalJson stays the sorted compact form — the config_hash input (unchanged from C2)
    expect(canonicalJson({ b: 1, a: [2] })).toBe('{"a":[2],"b":1}');
  });
});
