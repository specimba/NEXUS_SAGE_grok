import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { aiTermsDefault } from "../ai-relevance";
import { POLITICS_LEAD_TERMS } from "../lead-pick";
import { defaultSageConfig, KEYWORD_LEN_MAX, KEYWORD_LIST_MAX, limitsFromCode, SAGE_CONFIG_PATH, validateSageConfig, type SageConfig } from "../sage-config";
import { canonicalJson, fieldMin, fileJson, TIMEOUT_MIN_S, validateWithRules, type SageLimits } from "../sage-config-rules";
import { GMAIL_SENDERS_MAX } from "../gmail-news";
import { HN_TITLE_QUERIES_MAX, HN_TITLE_QUERY_LEN_MAX, hnTitleQueryProblem } from "../hn-pulse";
import { capBounds, committedBase, srcVal, stepCap, TIMEOUT_MIN } from "../setup-draft";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { configHash, setupEditFields } from "../sage-config-disk";
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
  // PASS-S1 fields (S1.1/S1.3 feeds, S1.4 hn_title_queries, S1.5 gmail_senders, S1.8 empty = off) — same result both paths.
  ["S1.1 unknown analyst feed", withCfg((c) => c.sources.analyst_rss.feeds.push("stratechery"))],
  ["S1.1 analyst off", withCfg((c) => (c.sources.analyst_rss.on = false))],
  ["S1.3 unknown release feed", withCfg((c) => c.sources.releases_atom.feeds.push("pytorch"))],
  ["S1.4 hn title ok", withCfg((c) => (c.keywords.hn_title_queries = ["agent", "open weights"]))],
  ["S1.4 hn title over max", withCfg((c) => (c.keywords.hn_title_queries = Array.from({ length: HN_TITLE_QUERIES_MAX + 1 }, (_, i) => `q${i}`)))],
  ["S1.4 hn title regex", withCfg((c) => (c.keywords.hn_title_queries = ["agent|tool"]))],
  ["S1.4 hn title banned", withCfg((c) => (c.keywords.hn_title_queries = ["Jailbreak"]))],
  ["S1.4 hn title incident", withCfg((c) => (c.keywords.hn_title_queries = ["HF Swarm leak"]))],
  ["S1.4 hn title too long", withCfg((c) => (c.keywords.hn_title_queries = ["x".repeat(HN_TITLE_QUERY_LEN_MAX + 1)]))],
  ["S1.4 hn title duplicate", withCfg((c) => (c.keywords.hn_title_queries = ["Qwen", "qwen "]))],
  ["S1.8 hn title empty = off", withCfg((c) => (c.keywords.hn_title_queries = []))],
  ["S1.5 senders ok", withCfg((c) => (c.keywords.gmail_senders = ["hello@newsletters.venturebeat.com"]))],
  ["S1.5 senders over max", withCfg((c) => (c.keywords.gmail_senders = Array.from({ length: GMAIL_SENDERS_MAX + 1 }, (_, i) => `n${i}@x.com`)))],
  ["S1.5 sender not exact", withCfg((c) => (c.keywords.gmail_senders = ["venturebeat.com", " a@b.com"]))],
  ["S1.5 sender duplicate", withCfg((c) => (c.keywords.gmail_senders = ["A@b.com", "a@b.com"]))],
  ["S1.8 senders empty = off", withCfg((c) => (c.keywords.gmail_senders = []))],
  ["S1.8 hn_sweep empty still rejected", withCfg((c) => (c.keywords.hn_sweep = []))],
];

describe("PASS-S1 × C3: S1 checks live in validateWithRules (browser = CI = the S1 helpers)", () => {
  test("S1 fixtures: expected errors, identical in both paths", () => {
    const err = (raw: unknown) => {
      const r = validateWithRules(raw, BROWSER);
      expect(validateSageConfig(raw)).toEqual(r);
      return r.ok ? [] : r.errors;
    };
    expect(err(withCfg((c) => (c.keywords.hn_title_queries = ["agent|tool"])))).toEqual(['keywords.hn_title_queries: "agent|tool" plain text only (no regex)']);
    expect(err(withCfg((c) => (c.keywords.hn_title_queries = ["Jailbreak"])))).toEqual(['keywords.hn_title_queries: "Jailbreak" HN standing search must not include banned noun: jailbreak']);
    expect(err(withCfg((c) => (c.keywords.hn_title_queries = ["Qwen", "qwen "])))).toEqual(["keywords.hn_title_queries: duplicate term"]);
    expect(err(withCfg((c) => (c.keywords.gmail_senders = ["venturebeat.com", " a@b.com"])))).toEqual(['keywords.gmail_senders: not an exact local@domain address: "venturebeat.com", " a@b.com"']);
    expect(err(withCfg((c) => (c.keywords.gmail_senders = ["A@b.com", "a@b.com"])))).toEqual(["keywords.gmail_senders: duplicate address"]);
    expect(err(withCfg((c) => (c.keywords.gmail_senders = [])))).toEqual([]);
    expect(err(withCfg((c) => (c.keywords.hn_title_queries = [])))).toEqual([]);
    expect(err(withCfg((c) => (c.keywords.hn_sweep = [])))).toEqual(["keywords.hn_sweep must be a non-empty list"]);
  });
  test("plain-term rule (data in limits) = hn-pulse hnTitleQueryProblem, term by term", () => {
    const terms = ["agent", "open weights", "Qwen", "agent|tool", "a*", "Jailbreak", "persistent sol", "Sol", "hf breach", "hf-breach",
      "HF Swarm leak", "eval board news", "x".repeat(HN_TITLE_QUERY_LEN_MAX), "x".repeat(HN_TITLE_QUERY_LEN_MAX + 1), " bluesky "];
    for (const t of terms) {
      const p = hnTitleQueryProblem(t);
      const r = validateWithRules(withCfg((c) => (c.keywords.hn_title_queries = [t])), BROWSER);
      expect([t, r.ok ? null : r.errors]).toEqual([t, p ? [`keywords.hn_title_queries: ${JSON.stringify(t)} ${p}`] : null]);
    }
  });
  test("SAGE_SETUP.limits carries the S1 rules (feeds, lists, empty = off)", () => {
    expect(BROWSER.feeds.analyst_rss).toEqual(limitsFromCode().feeds.analyst_rss);
    expect(BROWSER.feeds.releases_atom).toEqual(limitsFromCode().feeds.releases_atom);
    expect(BROWSER.keyword_lists).toContain("hn_title_queries");
    expect(BROWSER.keyword_lists).toContain("gmail_senders");
    expect(BROWSER.empty_means_off).toEqual(["hn_title_queries", "gmail_senders"]);
    expect(Object.keys(BROWSER.list_rules).sort()).toEqual(["gmail_senders", "hn_title_queries"]);
  });
});

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
  test("8c canonical file: fileJson(parse(committed sage-sources.json)) is byte-equal to the committed file; config_hash stays on canonicalJson", () => {
    // The committed blob (git HEAD) and the working-tree file, as raw bytes — never a decoded/re-encoded compare.
    const head = spawnSync("git", ["-C", desk, "show", `HEAD:desk/${SAGE_CONFIG_PATH}`], { encoding: "buffer" });
    expect(head.status).toBe(0);
    const committed = head.stdout as Buffer;
    const disk = readFileSync(resolve(desk, SAGE_CONFIG_PATH));
    const round = Buffer.from(fileJson(JSON.parse(committed.toString("utf8"))), "utf8");
    expect(Buffer.compare(round, committed)).toBe(0);
    expect(round.length).toBe(committed.length);
    expect(Buffer.compare(Buffer.from(fileJson(JSON.parse(disk.toString("utf8"))), "utf8"), disk)).toBe(0);
    // config_hash stays the sha256 of canonicalJson (sorted compact) — not of the file bytes / fileJson.
    const cfg = JSON.parse(committed.toString("utf8")) as SageConfig;
    expect(configHash(cfg)).toBe(createHash("sha256").update(canonicalJson(cfg)).digest("hex").slice(0, 12));
    expect(canonicalJson({ b: 1, a: [2] })).toBe('{"a":[2],"b":1}');
  });
});

describe("PASS-C3 ruling (4): timeout_s floor 3 — CI validator and browser stepper agree (one shared constant)", () => {
  test("the floor is the shared rules' TIMEOUT_MIN_S = 3; the stepper re-exports it", () => {
    expect(TIMEOUT_MIN_S).toBe(3);
    expect(TIMEOUT_MIN).toBe(TIMEOUT_MIN_S);
    expect(fieldMin("timeout_s")).toBe(3);
    expect(fieldMin("cap")).toBe(1);
  });
  test("parity: for every timeout_s 0…ceiling+1, validateSageConfig (CI) ok ⇔ browser rules ok ⇔ inside the stepper's bounds", () => {
    for (const [id, fields] of Object.entries(BROWSER.ceilings)) {
      for (const field of Object.keys(fields)) {
        const [lo, hi] = capBounds(id, field, BROWSER);
        expect([id, field, lo]).toEqual([id, field, fieldMin(field)]);
        for (let v = 0; v <= hi + 1; v++) {
          const c = defaultSageConfig() as unknown as { sources: Record<string, Record<string, unknown>> };
          c.sources[id]![field] = v;
          const ci = validateSageConfig(c);
          const br = validateWithRules(c, BROWSER);
          const inBounds = v >= lo && v <= hi;
          expect([id, field, v, ci.ok]).toEqual([id, field, v, inBounds]);
          expect([id, field, v, br.ok]).toEqual([id, field, v, inBounds]);
          if (!ci.ok && !br.ok) expect(br.errors).toEqual(ci.errors);
        }
      }
    }
  });
  test("timeout_s 2 is rejected with the same error in both paths; the stepper never goes below 3", () => {
    const c = withCfg((x) => (x.sources.lab_rss.timeout_s = 2));
    const ci = validateSageConfig(c);
    const br = validateWithRules(c, BROWSER);
    expect(!ci.ok && ci.errors).toEqual(["sources.lab_rss.timeout_s must be ≥ 3"]);
    expect(!br.ok && br.errors).toEqual(!ci.ok && ci.errors);
    let d = committedBase(SAGE_SETUP.config, BROWSER);
    expect(srcVal(d, "lab_rss", "timeout_s", BROWSER)).toBe(10);
    for (let i = 0; i < 20; i++) d = stepCap(d, "lab_rss", "timeout_s", -1, BROWSER);
    expect(srcVal(d, "lab_rss", "timeout_s", BROWSER)).toBe(3);
  });
});
