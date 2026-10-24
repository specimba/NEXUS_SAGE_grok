import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { AI_TERMS, buildAiTerms, aiTermsDefault, configureAiTerms, isAiRelevantTitle } from "../ai-relevance";
import { buildGmailQuery, configureGmail, GMAIL_QUERY, gmailCaps } from "../gmail-news";
import { configurePoliticsTerms, politicsLeadReason } from "../lead-pick";
import {
  defaultSageConfig,
  offSources,
  sageCeilings,
  SAGE_CONFIG_PATH,
  validateSageConfig,
  type SageConfig,
} from "../sage-config";
import { applySageConfig, configHash, loadSageConfig } from "../sage-config-disk";
import { buildSetupView, deskConfigOf, renderSageDeskConfigTs } from "../sage-setup";
import { orderTasteShelf, tasteSoftMeter } from "../x-taste-meter";
import { isCiEnv, refreshTaste, TASTE_REFRESH_STAMP } from "../x-taste-refresh";
import { readXTasteLast } from "../x-taste-disk";
import { SAGE_SETUP } from "@/data/sage-setup";
import { SAGE_DESK_CONFIG } from "@/data/sage-desk-config";

const desk = resolve(import.meta.dir, "../../..");
const committed = () => JSON.parse(readFileSync(resolve(desk, SAGE_CONFIG_PATH), "utf8"));
/** The exact pre-C2 AI_TERMS regex source (a02863c) — the config list must rebuild it byte-for-byte. */
const PRE_C2_AI_TERMS =
  "(?<!\\w)a\\.i\\.(?!\\w)|\\b\\d+(\\.\\d+)?b[- ]param\\w*|\\b(ai|ais|agi|small models?|vector (db|database)s?|artificial intelligence|machine learning|deep learning|ml|neural|transformers?|agents?|agentic|inference|embeddings?|fine-?tun\\w*|rag|diffusion|multimodal|text-to-speech|tts|speech-to-text|stt|prompts?|evals?|alignment|reasoning models?|quantiz\\w*|quants?|gguf|llama\\.cpp|open[- ]weights?|foundation models?|frontier models?|language models?|chatbots?|copilot|vibe cod\\w*|mcp|generative|(video|image|text|code|music|speech|3d) generation|computer vision|reinforcement learning|robot(ics|s)?|humanoids?|(transfer|federated|contrastive|representation|few-shot|zero-shot|in-context|self-supervised|multi-task) learning|tool[- ]use|graphrag|swe-\\w+|earth-2)\\b|(llm|vlm|gpt)s?\\b|gpt-";

function tmpDesk(config?: unknown): string {
  const d = mkdtempSync(join(tmpdir(), "sage-c2-"));
  mkdirSync(join(d, "config"), { recursive: true });
  mkdirSync(join(d, "artifacts/sage"), { recursive: true });
  if (config !== undefined) writeFileSync(join(d, SAGE_CONFIG_PATH), typeof config === "string" ? config : JSON.stringify(config));
  return d;
}
const withCfg = (patch: (c: SageConfig) => void) => {
  const c = defaultSageConfig() as SageConfig;
  patch(c);
  return c;
};

/** watch-on: keywords.watch_terms is freely editable data (PASS-W W1), so the committed file = code defaults EXCEPT that list. */
const sansWatch = <T,>(c: T): T => {
  const o = JSON.parse(JSON.stringify(c));
  if (o?.keywords) delete o.keywords.watch_terms;
  // Intel plan 2 (Oct 24): the Gmail block + gmail_senders / gmail_seed are config data on top of the code
  // defaults; their exact committed values are pinned in intel-gmail.test.ts.
  if (o?.keywords) { delete o.keywords.gmail_senders; delete o.keywords.gmail_seed; }
  if (o?.sources) delete o.sources.gmail;
  return o;
};

describe("PASS-C2 seed — first land = no behaviour change", () => {
  test("committed desk/config/sage-sources.json validates and equals today's code values", () => {
    const v = validateSageConfig(committed());
    expect(v.ok).toBe(true);
    expect(v.ok && sansWatch(v.config)).toEqual(sansWatch(defaultSageConfig()));
  });
  test("AI_TERMS rebuilt from the default list is the exact pre-C2 regex", () => {
    expect(AI_TERMS.source).toBe(PRE_C2_AI_TERMS);
    expect(AI_TERMS.flags).toBe("i");
    expect(buildAiTerms(committed().keywords.ai_terms).source).toBe(PRE_C2_AI_TERMS);
  });
  test("applying the seeded config leaves query / caps / regexes exactly as before", () => {
    applySageConfig(defaultSageConfig());
    expect(AI_TERMS.source).toBe(PRE_C2_AI_TERMS);
    expect(buildGmailQuery()).toBe(GMAIL_QUERY);
    expect(gmailCaps()).toEqual({ fetchCap: 24, emitCap: 12, windowDays: 14 });
    expect(politicsLeadReason("Trump signs AI order")).toBe("politics:trump");
    expect(politicsLeadReason("Senate passes AI safety bill")).toBeNull();
  });
  test("setup + desk-knob modules match the committed config and its hash", () => {
    const l = loadSageConfig(desk, { write: false });
    expect(l.status).toBe("ok");
    expect(SAGE_SETUP.config_hash).toBe(l.config_hash);
    expect(SAGE_SETUP.config_hash).toBe(configHash({ ...defaultSageConfig(), sources: { ...defaultSageConfig().sources, gmail: l.config.sources.gmail }, keywords: { ...defaultSageConfig().keywords, watch_terms: l.config.keywords.watch_terms, gmail_senders: l.config.keywords.gmail_senders, gmail_seed: l.config.keywords.gmail_seed } }));
    expect(SAGE_SETUP.sources.map((s) => s.id)).toEqual(Object.keys(l.config.sources));
    expect(SAGE_SETUP.keywords.find((k) => k.id === "ai_terms")?.terms).toEqual(l.config.keywords.ai_terms);
    expect(SAGE_DESK_CONFIG).toEqual({ taste_on: true, taste_visible_cap: 6, taste_weight: 0, taste_idx: null });
    expect(readFileSync(resolve(desk, "src/data/sage-desk-config.ts"), "utf8")).toBe(renderSageDeskConfigTs(l, { items: [], pulseTitles: [] }));
  });
});

describe("PASS-C2 code-enforced ceilings + rejects", () => {
  test("ceilings are today × 2 and lab RSS timeout ≤ 15 s", () => {
    const c = sageCeilings();
    expect(c.hn!.cap).toBe(40);
    expect(c.gnews!.cap).toBe(64);
    expect(c.lab_rss!.cap_per_feed).toBe(24);
    expect(c.lab_rss!.timeout_s).toBe(15);
    expect(c.gmail!.fetch_cap).toBe(48);
  });
  const bad: [string, unknown][] = [
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
  ];
  for (const [name, cfg] of bad) {
    test(`rejects: ${name}`, () => {
      const v = validateSageConfig(cfg);
      expect(v.ok).toBe(false);
    });
  }
  test("allowed: off, lower caps, feed subset, keyword edits; taste.weight is clamped (not a reject)", () => {
    const v = validateSageConfig(
      withCfg((c) => {
        c.sources.hn.on = false;
        c.sources.gnews.cap = 8;
        c.sources.lab_rss.feeds = ["openai", "deepmind"];
        c.keywords.hn_sweep = ["OpenAI"];
        c.taste.weight = 0.9;
      }),
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(offSources(v.config)).toEqual(["hn"]);
    expect(v.config.taste.weight).toBe(0.3);
    expect(v.warnings.join(" ")).toContain("clamped");
  });
});

describe("PASS-C2 last-good fallback (never crashes, never silent)", () => {
  test("valid config is used and mirrored to config-last-good.json", () => {
    const d = tmpDesk(withCfg((c) => (c.sources.github.on = false)));
    const l = loadSageConfig(d, { write: true, head: "abc1234", at: "2026-10-12T06:11:00Z" });
    expect(l.status).toBe("ok");
    const lg = JSON.parse(readFileSync(join(d, "artifacts/sage/config-last-good.json"), "utf8"));
    expect(lg.config_hash).toBe(l.config_hash);
    expect(lg.since_commit).toBe("abc1234");
  });
  for (const [name, body] of [
    ["bad JSON", "{ nope"],
    ["unknown feed", JSON.stringify(withCfg((c) => c.sources.sec_rss.feeds.push("ncc")))],
    ["cap over ceiling", JSON.stringify(withCfg((c) => (c.sources.hn.cap = 41)))],
  ] as const) {
    test(`${name} → last good used, status invalid`, () => {
      const d = tmpDesk(withCfg((c) => (c.sources.github.on = false)));
      const good = loadSageConfig(d, { write: true, head: "abc1234" });
      writeFileSync(join(d, SAGE_CONFIG_PATH), body);
      const l = loadSageConfig(d, { write: true });
      expect(l.status).toBe("invalid");
      expect(l.used).toBe("last-good");
      expect(l.config_hash).toBe(good.config_hash);
      expect(l.config.sources.github.on).toBe(false);
      expect(l.errors.length).toBeGreaterThan(0);
    });
  }
  test("missing config and no last good → code defaults, still invalid", () => {
    const l = loadSageConfig(tmpDesk(), { write: true });
    expect(l.status).toBe("invalid");
    expect(l.used).toBe("defaults");
    expect(l.config).toEqual(defaultSageConfig());
  });
  test("ingest wires it: crawl-start load, off sources skipped, config_hash stamped, `config invalid` meter", () => {
    const src = readFileSync(resolve(desk, "scripts/ingest.ts"), "utf8");
    expect(src).toContain("loadSageConfig(root, { write: true, at: stamp })");
    expect(src).toContain("config_hash: sageCfg.config_hash");
    expect(src).toContain('"config invalid"');
    expect(src).toContain('off.has(cfgId)');
    expect(src).not.toMatch(/runWithBudget\("(hn|rss_labs|gnews|rss_security|github|wikidata|hf|arxiv|openalex|crossref)"/);
  });
});

describe("PASS-C2 keyword lists + taste weight scope", () => {
  test("ai_terms / politics / gmail seed edits take effect, then reset", () => {
    configureAiTerms(["zebra models?"]);
    expect(isAiRelevantTitle("New zebra model ships")).toBe(true);
    configureAiTerms();
    expect(buildAiTerms(aiTermsDefault()).source).toBe(PRE_C2_AI_TERMS);
    expect(isAiRelevantTitle("New zebra model ships")).toBe(false);
    configurePoliticsTerms(["senate"]);
    expect(politicsLeadReason("Senate AI bill")).toBe("politics:senate");
    configurePoliticsTerms();
    configureGmail({ seed: ["AI", "robotics weekly"], windowDays: 7 });
    expect(buildGmailQuery()).toContain('OR subject:("robotics weekly"))');
    expect(buildGmailQuery()).toContain("newer_than:7d");
    configureGmail();
    expect(buildGmailQuery()).toBe(GMAIL_QUERY);
  });
  test("taste.weight 0 keeps snapshot order; 0.3 lifts Pulse-overlapping taste items", () => {
    const items = [{ text: "cooking video" }, { text: "Gemini agent benchmark" }, { text: "weather" }];
    expect(orderTasteShelf(items, 0, ["Gemini agent tops benchmark"])).toEqual(items);
    expect(orderTasteShelf(items, 0.3, ["Gemini agent tops benchmark"])[0]).toBe(items[1]!);
    expect(orderTasteShelf(items, 5, [])).toEqual(items);
  });
  test("taste.weight never reaches Pulse UP, Wire, the lead pick or Brief (only the desk taste shelf reads it)", () => {
    for (const f of ["src/lib/pulse-v5.ts", "src/lib/wire.ts", "src/lib/lead-pick.ts", "src/lib/corroboration.ts", "scripts/rank-snapshot.ts", "src/lib/digest-unlock.ts"]) {
      const s = readFileSync(resolve(desk, f), "utf8");
      expect(s).not.toContain("taste_weight");
      expect(s).not.toContain("orderTasteShelf");
    }
    const deskSrc = readFileSync(resolve(desk, "src/components/sage/desk.tsx"), "utf8");
    expect(deskSrc.match(/taste_idx/g)?.length).toBe(1);
    // weight 0 vs 0.3 differ only in the desk knob's taste_order (taste shelf), nothing else
    const items = [{ id: "a", text: "cooking" }, { id: "b", text: "Gemini agent benchmark" }];
    const d0 = deskConfigOf(defaultSageConfig(), { items, pulseTitles: ["Gemini agent tops benchmark"] });
    const d3 = deskConfigOf(withCfg((c) => (c.taste.weight = 0.3)), { items, pulseTitles: ["Gemini agent tops benchmark"] });
    expect(d0.taste_idx).toBeNull();
    expect(d3.taste_idx).toEqual([1, 0]);
    expect({ ...d0, taste_idx: null, taste_weight: 0 }).toEqual({ ...d3, taste_idx: null, taste_weight: 0 });
    expect(deskConfigOf(withCfg((c) => (c.sources.x_taste.on = false)), { items, pulseTitles: [] }).taste_idx).toEqual([]);
  });
});

describe("PASS-C2 Setup view — lazy, read-only", () => {
  test("desk loads setup-view only via dynamic import (0 First Load)", () => {
    const s = readFileSync(resolve(desk, "src/components/sage/desk.tsx"), "utf8");
    expect(s).toContain('import("@/components/sage/setup-view")');
    expect(s).not.toMatch(/^import [^;]*setup-view/m);
    expect(s).not.toMatch(/^import [^;]*@\/data\/sage-setup/m);
    expect(s).toContain('href="?view=setup"');
  });
  test("view has no edit controls and the muted commit line", () => {
    const v = readFileSync(resolve(desk, "src/components/sage/setup-view.tsx"), "utf8");
    expect(v).toContain("edit desk/config/sage-sources.json by commit");
    expect(v).not.toMatch(/<input|<select|<textarea|contentEditable|fetch\(/);
  });
  test("off source shows state off (not soft-fail) with no row count", () => {
    const c = withCfg((x) => (x.sources.hn.on = false));
    const v = buildSetupView(
      { config: c, config_hash: configHash(c), status: "ok", used: "committed", errors: [], since_commit: null, since_at: null },
      { stamp: "2026-10-12T06:11:00Z", rows: [{ id: "hn", rows: 0, status: "fail", reason: "off (config)" }] },
    );
    const hn = v.sources.find((s) => s.id === "hn")!;
    expect(hn.state).toBe("off");
    expect(hn.last_rows).toBeNull();
  });
});

describe("PASS-C2 weekly X taste refresh — box only", () => {
  const fixtureDesk = () => {
    const d = tmpDesk(defaultSageConfig());
    mkdirSync(join(d, "src/data"), { recursive: true });
    cpSync(resolve(desk, "artifacts/sage/x-taste-last.json"), join(d, "artifacts/sage/x-taste-last.json"));
    return d;
  };
  const items = [
    { url: "https://x.com/a/status/1", author: "@a", text: "New open-weights LLM beats GPT on evals", surface: "bookmark" as const },
    { url: "https://x.com/b/status/2", author: "@b", text: "My lunch today", surface: "like" as const },
    { url: "https://x.com/c/status/3", author: "@c", text: "CVE-2026-1234 exploit in agent framework", surface: "feed" as const },
  ];
  test("CI never runs it", () => {
    expect(isCiEnv({ GITLAB_CI: "true" })).toBe(true);
    const r = refreshTaste(fixtureDesk(), { kind: "capture", items }, { env: { CI: "true" } });
    expect(r.status).toBe("refused");
  });
  test("fresh capture → new captured_at, allowlist applied, stale meter clears", () => {
    const d = fixtureDesk();
    const now = Date.parse("2026-10-12T06:17:00Z");
    const r = refreshTaste(d, { kind: "capture", items, seen: 3 }, { now, env: {} });
    expect(r.status).toBe("wrote");
    const disk = readXTasteLast(d)!;
    expect(disk.captured_at).toBe("2026-10-12T06:17:00Z");
    expect(disk.items.map((i) => i.url)).toEqual(["https://x.com/a/status/1", "https://x.com/c/status/3"]);
    const mod = readFileSync(join(d, "src/data/x-taste.ts"), "utf8");
    expect(mod).toContain('"captured_at": "2026-10-12T06:17:00Z"');
    const meter = tasteSoftMeter({ captured_at: disk.captured_at, skipped: false, soft_fail: false, soft_fail_reason: null, items: [{ id: "1", text: "x", surface: "bookmark" }] }, now);
    expect(meter.state).toBe("ok");
    expect(tasteSoftMeter({ captured_at: "2026-09-11T09:32:00Z", skipped: false, soft_fail: false, soft_fail_reason: null, items: [{ id: "1", text: "x", surface: "bookmark" }] }, now).detail).toBe("taste stale");
  });
  test("login wall → honest skip, last shelf kept, one notify line, stamp written", () => {
    const d = fixtureDesk();
    const before = readFileSync(join(d, "artifacts/sage/x-taste-last.json"), "utf8");
    const r = refreshTaste(d, { kind: "skip", reason: "login_wall" }, { env: {} });
    expect(r.status).toBe("skipped");
    expect(r.status === "skipped" && r.notify).toBe("X session needs login on the box");
    expect(readFileSync(join(d, "artifacts/sage/x-taste-last.json"), "utf8")).toBe(before);
    expect(existsSync(join(d, TASTE_REFRESH_STAMP))).toBe(true);
  });
  test("no X creds / refresh in CI config or repo config", () => {
    const ci = readFileSync(resolve(desk, "../ci/gitlab-ci.yml"), "utf8");
    expect(ci).not.toMatch(/x-taste-refresh|X_SESSION|X_COOKIE|auth_token|ct0/i);
    const cfg = readFileSync(resolve(desk, SAGE_CONFIG_PATH), "utf8");
    expect(cfg).not.toMatch(/token|cookie|secret|password|bearer/i);
  });
});
