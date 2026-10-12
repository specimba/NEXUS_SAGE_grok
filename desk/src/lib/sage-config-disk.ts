/**
 * PASS-C2 crawl-start config loader (Node/Bun only — never imported by the browser desk).
 * Valid committed config → used, and mirrored to artifacts/sage/config-last-good.json (committed with the crawl).
 * Invalid / missing / bad JSON → last good config, status "invalid" (soft meter `config invalid`), never a crash,
 * never silent. No last good either → code defaults, still "invalid".
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { configureAiTerms } from "./ai-relevance";
import { configureGmail } from "./gmail-news";
import { configureHnSweepTerms } from "./hn-pulse";
import { configurePoliticsTerms } from "./lead-pick";
import {
  canonicalJson,
  defaultSageConfig,
  SAGE_CONFIG_LAST_GOOD_PATH,
  SAGE_CONFIG_PATH,
  validateSageConfig,
  type SageConfig,
} from "./sage-config";

export type LoadedSageConfig = {
  config: SageConfig;
  config_hash: string;
  status: "ok" | "invalid";
  used: "committed" | "last-good" | "defaults";
  errors: string[];
  warnings: string[];
  /** Commit at which the active config hash first ran (from last-good). */
  since_commit: string | null;
  since_at: string | null;
};

type LastGood = { schema: 1; config_hash: string; since_commit: string | null; since_at: string | null; config: SageConfig };

export function configHash(c: SageConfig): string {
  return createHash("sha256").update(canonicalJson(c)).digest("hex").slice(0, 12);
}

function headSha(root: string): string | null {
  const r = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() || null : null;
}

export function readLastGood(root: string): LastGood | null {
  const p = resolve(root, SAGE_CONFIG_LAST_GOOD_PATH);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as LastGood;
    const v = validateSageConfig(raw?.config);
    if (!v.ok) return null;
    return { ...raw, config: v.config, config_hash: configHash(v.config) };
  } catch {
    return null;
  }
}

export function loadSageConfig(
  root: string,
  opts: { write?: boolean; at?: string; configPath?: string; head?: string | null } = {},
): LoadedSageConfig {
  const path = resolve(root, opts.configPath ?? SAGE_CONFIG_PATH);
  let parsed: unknown;
  const errors: string[] = [];
  if (!existsSync(path)) errors.push(`${SAGE_CONFIG_PATH} missing`);
  else {
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      errors.push(`bad JSON: ${String((e as Error).message ?? e)}`);
    }
  }
  const v = errors.length ? null : validateSageConfig(parsed);
  const last = readLastGood(root);
  if (v?.ok) {
    const hash = configHash(v.config);
    let since_commit = last?.config_hash === hash ? last.since_commit : null;
    let since_at = last?.config_hash === hash ? last.since_at : null;
    if (last?.config_hash !== hash) {
      since_commit = opts.head !== undefined ? opts.head : headSha(root);
      since_at = opts.at ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      if (opts.write) {
        const out: LastGood = { schema: 1, config_hash: hash, since_commit, since_at, config: v.config };
        const p = resolve(root, SAGE_CONFIG_LAST_GOOD_PATH);
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, `${JSON.stringify(out, null, 2)}\n`);
      }
    }
    return { config: v.config, config_hash: hash, status: "ok", used: "committed", errors: [], warnings: v.warnings, since_commit, since_at };
  }
  if (v && !v.ok) errors.push(...v.errors);
  if (last) {
    return { config: last.config, config_hash: last.config_hash, status: "invalid", used: "last-good", errors, warnings: [], since_commit: last.since_commit, since_at: last.since_at };
  }
  const d = defaultSageConfig();
  return { config: d, config_hash: configHash(d), status: "invalid", used: "defaults", errors, warnings: [], since_commit: null, since_at: null };
}

/** Push the keyword lists + gmail caps into the code modules (crawl/rank processes only). */
export function applySageConfig(c: SageConfig): void {
  configureAiTerms(c.keywords.ai_terms);
  configureHnSweepTerms(c.keywords.hn_sweep);
  configurePoliticsTerms(c.keywords.politics_deny);
  configureGmail({
    fetchCap: c.sources.gmail.fetch_cap,
    emitCap: c.sources.gmail.emit_cap,
    windowDays: c.sources.gmail.window_days,
    seed: c.keywords.gmail_seed,
  });
}
