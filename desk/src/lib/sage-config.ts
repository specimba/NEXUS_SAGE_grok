/**
 * PASS-C2 — feed/taste setup config by commit (desk/config/sage-sources.json).
 *
 * Code owns the defaults (the pre-C2 constants) and the hard ceilings. The JSON can only turn a wired
 * source off, set caps inside the ceiling (≤ today × 2, lab RSS timeout ≤ 15 s), restrict feed lists to
 * feed ids already wired in code, and edit the four keyword lists. Unknown sources, unknown fields, unknown
 * feed ids, caps over the ceiling, secrets-looking keys → the whole file is rejected (caller falls back to the
 * last good committed config). Lead / Brief rules never live here (they stay in code + pass marks).
 *
 * Pure (no node:fs) — the crawl-start loader lives in sage-config-disk.ts.
 */
import { aiTermsDefault } from "./ai-relevance";
import { GITHUB_PER_PAGE } from "./github-shelf";
import { GMAIL_EMIT_CAP, GMAIL_FETCH_CAP, GMAIL_SEED_KEYWORDS, GMAIL_SENDER_RE, GMAIL_SENDERS_DEFAULT, GMAIL_SENDERS_MAX } from "./gmail-news";
import { GNEWS_POOL_CAP } from "./gnews-rss";
import { HN_RECENT_SWEEP_TERMS, HN_TITLE_QUERIES, HN_TITLE_QUERIES_MAX, hnTitleQueryProblem } from "./hn-pulse";
import { POLITICS_LEAD_TERMS } from "./lead-pick";
import { LAB_FEEDS, RSS_MAX_ITEMS_PER_FEED } from "./rss-labs";
import { SECURITY_FEEDS } from "./rss-security";
import { RSS_FEED_TIMEOUT_MS } from "./rss-timeout";
import { ANALYST_FEEDS, ANALYST_RSS_CAP } from "./rss-analyst";
import { RELEASE_FEEDS, RELEASES_CAP, RELEASES_CAP_MAX } from "./releases-atom";
import { TASTE_VISIBLE_CAP, TASTE_WEIGHT_MAX } from "./x-taste-meter";
export { orderTasteShelf, TASTE_WEIGHT_MAX } from "./x-taste-meter";

export const SAGE_CONFIG_PATH = "config/sage-sources.json";
export const SAGE_CONFIG_LAST_GOOD_PATH = "artifacts/sage/config-last-good.json";
export const SAGE_CONFIG_SCHEMA = 1;

/** Pre-C2 HF daily-papers keep (scripts/ingest.ts PAPERS_KEEP). */
export const HF_PAPERS_KEEP = 24;
/** Pre-C2 HN Algolia hitsPerPage passed by ingest (also hard-clamped to HN_HITS_PER_PAGE_MAX in hn-pulse). */
export const HN_HITS_PER_PAGE = 20;
export const GMAIL_WINDOW_DAYS = 14;
/** Lab RSS per-feed timeout hard ceiling (spec: ≤ 15 s). */
export const LAB_RSS_TIMEOUT_MAX_S = 15;
/** Keyword lists the JSON may edit (no new lists by JSON). */
export const KEYWORD_LIST_IDS = ["ai_terms", "hn_sweep", "gmail_seed", "politics_deny", "hn_title_queries", "gmail_senders"] as const;
/**
 * PASS-S1.8: lists where EMPTY MEANS OFF (allowed). Every other list (ai_terms, politics_deny, hn_sweep, gmail_seed)
 * must stay non-empty.
 */
export const KEYWORD_EMPTY_MEANS_OFF: readonly string[] = ["hn_title_queries", "gmail_senders"];
/** Keyword list guard rails (not spec numbers — keep regexes and the HN sweep query small). */
export const KEYWORD_LIST_MAX = 200;
export const KEYWORD_LEN_MAX = 120;

import type { SageConfig, SourceId } from "./sage-config-types";
export type { SageConfig, SourceId } from "./sage-config-types";

export const SOURCE_IDS: readonly SourceId[] = [
  "hn", "hf_papers", "lab_rss", "sec_rss", "gnews", "github",
  "openalex", "crossref", "arxiv", "wikidata", "gmail", "x_taste",
  "analyst_rss", "releases_atom",
] as const;

export const LAB_FEED_IDS: readonly string[] = LAB_FEEDS.map((f) => f.lab);
export const SEC_FEED_IDS: readonly string[] = SECURITY_FEEDS.map((f) => f.lab);
export const ANALYST_FEED_IDS: readonly string[] = ANALYST_FEEDS.map((f) => f.id);
export const RELEASE_FEED_IDS: readonly string[] = RELEASE_FEEDS.map((f) => f.id);

/** Today's code values = the seed. `config/sage-sources.json` committed at C2 land is exactly this. */
export function defaultSageConfig(): SageConfig {
  return {
    schema: 1,
    sources: {
      hn: { on: true, cap: HN_HITS_PER_PAGE },
      hf_papers: { on: true, cap: HF_PAPERS_KEEP },
      lab_rss: { on: true, cap_per_feed: RSS_MAX_ITEMS_PER_FEED, timeout_s: RSS_FEED_TIMEOUT_MS / 1000, feeds: [...LAB_FEED_IDS] },
      sec_rss: { on: true, cap_per_feed: RSS_MAX_ITEMS_PER_FEED, feeds: [...SEC_FEED_IDS] },
      gnews: { on: true, cap: GNEWS_POOL_CAP },
      github: { on: true, cap: GITHUB_PER_PAGE },
      openalex: { on: true },
      crossref: { on: true },
      arxiv: { on: true },
      wikidata: { on: true },
      gmail: { on: true, fetch_cap: GMAIL_FETCH_CAP, emit_cap: GMAIL_EMIT_CAP, window_days: GMAIL_WINDOW_DAYS },
      x_taste: { on: true, visible_cap: TASTE_VISIBLE_CAP },
      analyst_rss: { on: true, cap_per_feed: ANALYST_RSS_CAP, timeout_s: RSS_FEED_TIMEOUT_MS / 1000, feeds: [...ANALYST_FEED_IDS] },
      // PASS-S1.3: claude-code is in the registry but off by default (patch churn).
      releases_atom: { on: true, cap_per_feed: RELEASES_CAP, feeds: RELEASE_FEEDS.filter((f) => f.defaultOn).map((f) => f.id) },
    },
    keywords: {
      ai_terms: aiTermsDefault(),
      hn_sweep: [...HN_RECENT_SWEEP_TERMS],
      gmail_seed: [...GMAIL_SEED_KEYWORDS],
      politics_deny: [...POLITICS_LEAD_TERMS],
      hn_title_queries: [...HN_TITLE_QUERIES],
      gmail_senders: [...GMAIL_SENDERS_DEFAULT],
    },
    taste: { weight: 0, max: TASTE_WEIGHT_MAX },
  };
}

/** Numeric fields per source → hard ceiling (code). Every cap ceiling = today's value × 2. */
export function sageCeilings(): Record<string, Record<string, number>> {
  const d = defaultSageConfig().sources;
  return {
    hn: { cap: d.hn.cap * 2 },
    hf_papers: { cap: d.hf_papers.cap * 2 },
    lab_rss: { cap_per_feed: d.lab_rss.cap_per_feed * 2, timeout_s: LAB_RSS_TIMEOUT_MAX_S },
    sec_rss: { cap_per_feed: d.sec_rss.cap_per_feed * 2 },
    gnews: { cap: d.gnews.cap * 2 },
    github: { cap: d.github.cap * 2 },
    openalex: {},
    crossref: {},
    arxiv: {},
    wikidata: {},
    gmail: { fetch_cap: d.gmail.fetch_cap * 2, emit_cap: d.gmail.emit_cap * 2, window_days: d.gmail.window_days * 2 },
    x_taste: { visible_cap: d.x_taste.visible_cap * 2 },
    // PASS-S1.1: cap 6 → ceiling 12; timeout follows the lab ceiling (≤ 15 s).
    analyst_rss: { cap_per_feed: d.analyst_rss.cap_per_feed * 2, timeout_s: LAB_RSS_TIMEOUT_MAX_S },
    // PASS-S1.3: cap 2 → ceiling 4.
    releases_atom: { cap_per_feed: RELEASES_CAP_MAX },
  };
}

const FEED_FIELDS: Record<string, readonly string[]> = { lab_rss: LAB_FEED_IDS, sec_rss: SEC_FEED_IDS, analyst_rss: ANALYST_FEED_IDS, releases_atom: RELEASE_FEED_IDS };
const SECRET_KEY = /token|secret|cookie|passw|bearer|auth|api[_-]?key|session/i;
const SECRET_VALUE = /\b(ghp_|gho_|github_pat_|glpat-|xox[abp]-|sk-[a-z0-9]{8}|AKIA[0-9A-Z]{8})/i;

export type ValidateResult = { ok: true; config: SageConfig; warnings: string[] } | { ok: false; errors: string[] };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function scanSecrets(v: unknown, path: string, errors: string[]) {
  if (typeof v === "string") {
    if (SECRET_VALUE.test(v)) errors.push(`${path}: looks like a secret value`);
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => scanSecrets(x, `${path}[${i}]`, errors));
  } else if (isObj(v)) {
    for (const [k, x] of Object.entries(v)) {
      if (SECRET_KEY.test(k)) errors.push(`${path}.${k}: secret-like key not allowed in config`);
      scanSecrets(x, `${path}.${k}`, errors);
    }
  }
}

/**
 * Validate a parsed config. Missing optional fields inherit the code default (so a short file is fine);
 * anything unknown or out of bounds rejects the whole file. `taste.weight` outside 0–0.3 is clamped (spec:
 * "clamped"), with a warning — it is not a reject.
 */
export function validateSageConfig(raw: unknown): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const out = defaultSageConfig();
  if (!isObj(raw)) return { ok: false, errors: ["config is not a JSON object"] };
  scanSecrets(raw, "$", errors);
  for (const k of Object.keys(raw)) {
    if (!["schema", "sources", "keywords", "taste", "$comment"].includes(k)) errors.push(`unknown top-level key "${k}"`);
  }
  if (raw.schema !== SAGE_CONFIG_SCHEMA) errors.push(`schema must be ${SAGE_CONFIG_SCHEMA}`);

  const ceil = sageCeilings();
  if (raw.sources !== undefined) {
    if (!isObj(raw.sources)) errors.push("sources must be an object");
    else {
      for (const [id, v] of Object.entries(raw.sources)) {
        if (!(SOURCE_IDS as readonly string[]).includes(id)) {
          errors.push(`unknown source "${id}" (no new providers by JSON)`);
          continue;
        }
        if (!isObj(v)) {
          errors.push(`sources.${id} must be an object`);
          continue;
        }
        const target = out.sources[id as SourceId] as Record<string, unknown>;
        for (const [field, val] of Object.entries(v)) {
          const where = `sources.${id}.${field}`;
          if (field === "on") {
            if (typeof val !== "boolean") errors.push(`${where} must be true/false`);
            else target.on = val;
          } else if (field === "feeds" && FEED_FIELDS[id]) {
            if (!Array.isArray(val) || val.length === 0) {
              errors.push(`${where} must be a non-empty list (use "on": false to drop the source)`);
              continue;
            }
            const wired = FEED_FIELDS[id]!;
            const bad = val.filter((f) => typeof f !== "string" || !wired.includes(f));
            if (bad.length) errors.push(`${where}: feed id(s) not wired in code: ${bad.map(String).join(", ")}`);
            else if (new Set(val).size !== val.length) errors.push(`${where}: duplicate feed id`);
            else target.feeds = [...val];
          } else if (field in (ceil[id] ?? {})) {
            const max = ceil[id]![field]!;
            if (typeof val !== "number" || !Number.isInteger(val)) errors.push(`${where} must be an integer`);
            else if (val < 1) errors.push(`${where} must be ≥ 1 (use "on": false to drop the source)`);
            else if (val > max) errors.push(`${where}=${val} over the code ceiling ${max}`);
            else target[field] = val;
          } else {
            errors.push(`unknown field ${where}`);
          }
        }
      }
    }
  }

  if (raw.keywords !== undefined) {
    if (!isObj(raw.keywords)) errors.push("keywords must be an object");
    else {
      for (const [k, v] of Object.entries(raw.keywords)) {
        if (!(KEYWORD_LIST_IDS as readonly string[]).includes(k)) {
          errors.push(`unknown keyword list "${k}"`);
          continue;
        }
        if (!Array.isArray(v) || (v.length === 0 && !KEYWORD_EMPTY_MEANS_OFF.includes(k))) {
          errors.push(`keywords.${k} must be a non-empty list`);
          continue;
        }
        if (v.length > KEYWORD_LIST_MAX) errors.push(`keywords.${k}: more than ${KEYWORD_LIST_MAX} entries`);
        const bad = v.filter((t) => typeof t !== "string" || !t.trim() || t.length > KEYWORD_LEN_MAX);
        if (bad.length) {
          errors.push(`keywords.${k}: entries must be non-empty strings ≤ ${KEYWORD_LEN_MAX} chars`);
          continue;
        }
        if (k === "hn_title_queries") {
          // PASS-S1.4: ≤ 8 plain terms (≤ 40 chars, no regex, no banned/incident nouns), no duplicates.
          if (v.length > HN_TITLE_QUERIES_MAX) {
            errors.push(`keywords.hn_title_queries: more than ${HN_TITLE_QUERIES_MAX} terms`);
            continue;
          }
          const probs = (v as string[]).map((t) => [t, hnTitleQueryProblem(t)] as const).filter(([, p]) => p);
          if (probs.length) {
            errors.push(`keywords.hn_title_queries: ${probs.map(([t, p]) => `${JSON.stringify(t)} ${p}`).join("; ")}`);
            continue;
          }
          if (new Set((v as string[]).map((t) => t.trim().toLowerCase())).size !== v.length) {
            errors.push("keywords.hn_title_queries: duplicate term");
            continue;
          }
        }
        if (k === "gmail_senders") {
          // PASS-S1.5: exact addresses only (local@domain), ≤ 20, no duplicates.
          if (v.length > GMAIL_SENDERS_MAX) {
            errors.push(`keywords.gmail_senders: more than ${GMAIL_SENDERS_MAX} addresses`);
            continue;
          }
          const badAddr = (v as string[]).filter((t) => !GMAIL_SENDER_RE.test(t.trim()) || t.trim() !== t);
          if (badAddr.length) {
            errors.push(`keywords.gmail_senders: not an exact local@domain address: ${badAddr.map((t) => JSON.stringify(t)).join(", ")}`);
            continue;
          }
          if (new Set((v as string[]).map((t) => t.toLowerCase())).size !== v.length) {
            errors.push("keywords.gmail_senders: duplicate address");
            continue;
          }
        }
        if (k === "ai_terms" || k === "politics_deny") {
          // Regex fragments (same as the code lists): each must compile on its own.
          for (const t of v as string[]) {
            try {
              new RegExp(`(?:${t})`, "i");
            } catch {
              errors.push(`keywords.${k}: invalid regex fragment ${JSON.stringify(t)}`);
            }
          }
        }
        out.keywords[k as keyof SageConfig["keywords"]] = [...(v as string[])];
      }
    }
  }

  if (raw.taste !== undefined) {
    if (!isObj(raw.taste)) errors.push("taste must be an object");
    else {
      for (const [k, v] of Object.entries(raw.taste)) {
        if (k === "weight") {
          if (typeof v !== "number" || !Number.isFinite(v)) errors.push("taste.weight must be a number");
          else {
            const w = Math.min(TASTE_WEIGHT_MAX, Math.max(0, v));
            if (w !== v) warnings.push(`taste.weight ${v} clamped to ${w}`);
            out.taste.weight = w;
          }
        } else if (k === "max") {
          if (v !== TASTE_WEIGHT_MAX) errors.push(`taste.max is fixed in code at ${TASTE_WEIGHT_MAX}`);
        } else errors.push(`unknown field taste.${k}`);
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, config: out, warnings };
}

/** Stable JSON (sorted keys) — the input to config_hash. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (isObj(v)) {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** Sources that are switched off in a (validated) config. */
export function offSources(c: SageConfig): SourceId[] {
  return SOURCE_IDS.filter((id) => !c.sources[id].on);
}
