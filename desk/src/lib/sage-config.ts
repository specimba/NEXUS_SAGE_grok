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
import { AI_TERMS_HEAD, AI_TERMS_TAIL, aiTermsDefault } from "./ai-relevance";
import { validateWithRules, type SageLimits, type ValidateResult } from "./sage-config-rules";
import { GITHUB_PER_PAGE } from "./github-shelf";
import { GMAIL_EMIT_CAP, GMAIL_FETCH_CAP, GMAIL_SEED_KEYWORDS, GMAIL_SENDER_RE, GMAIL_SENDERS_DEFAULT, GMAIL_SENDERS_MAX } from "./gmail-news";
import { GNEWS_POOL_CAP } from "./gnews-rss";
import { HN_RECENT_SWEEP_TERMS, HN_STANDING_BAN, HN_TITLE_QUERIES, HN_TITLE_QUERIES_MAX, HN_TITLE_QUERY_BAD_CHARS, HN_TITLE_QUERY_LEN_MAX } from "./hn-pulse";
import { INCIDENT_NOUNS } from "./ingest/queries";
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
export const KEYWORD_LIST_IDS = ["ai_terms", "hn_sweep", "gmail_seed", "politics_deny", "hn_title_queries", "gmail_senders", "watch_terms"] as const;
/**
 * PASS-S1.8: lists where EMPTY MEANS OFF (allowed). Every other list (ai_terms, politics_deny, hn_sweep, gmail_seed)
 * must stay non-empty.
 */
export const KEYWORD_EMPTY_MEANS_OFF: readonly string[] = ["hn_title_queries", "gmail_senders", "watch_terms"];
/** PASS-W W1: watch-feed terms ceiling (`[]` = feature off). Each term ≤ KEYWORD_LEN_MAX. */
export const WATCH_TERMS_MAX = 20;
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
      watch_terms: [],
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

/** PASS-C3.1: every rule input from code — the CI path. The browser gets the same object via SAGE_SETUP.limits. */
export function limitsFromCode(): SageLimits {
  return {
    schema: SAGE_CONFIG_SCHEMA,
    source_ids: [...SOURCE_IDS],
    defaults: defaultSageConfig(),
    ceilings: sageCeilings(),
    feeds: { lab_rss: [...LAB_FEED_IDS], sec_rss: [...SEC_FEED_IDS], analyst_rss: [...ANALYST_FEED_IDS], releases_atom: [...RELEASE_FEED_IDS] },
    keyword_lists: [...KEYWORD_LIST_IDS],
    regex_lists: {
      ai_terms: { head: AI_TERMS_HEAD, tail: AI_TERMS_TAIL },
      politics_deny: { head: "\\b(?:", tail: ")\\b" },
    },
    baseline: { ai_terms: aiTermsDefault(), politics_deny: [...POLITICS_LEAD_TERMS] },
    keyword_list_max: KEYWORD_LIST_MAX,
    keyword_len_max: KEYWORD_LEN_MAX,
    taste_max: TASTE_WEIGHT_MAX,
    box_only: ["gmail", "x_taste"],
    empty_means_off: [...KEYWORD_EMPTY_MEANS_OFF],
    list_rules: {
      hn_title_queries: {
        kind: "plain",
        max: HN_TITLE_QUERIES_MAX,
        len_max: HN_TITLE_QUERY_LEN_MAX,
        bad_chars: HN_TITLE_QUERY_BAD_CHARS.source,
        incident: [...INCIDENT_NOUNS],
        ban: [...HN_STANDING_BAN],
      },
      gmail_senders: { kind: "address", max: GMAIL_SENDERS_MAX, pattern: GMAIL_SENDER_RE.source },
      watch_terms: { kind: "watch", max: WATCH_TERMS_MAX },
    },
  };
}

export type { ValidateResult } from "./sage-config-rules";
export { canonicalJson, fileJson } from "./sage-config-rules";

/**
 * Validate a parsed config (CI / crawl start) = validateWithRules(raw, limitsFromCode()). Missing optional fields
 * inherit the code default; anything unknown or out of bounds rejects the whole file. `taste.weight` outside 0–0.3
 * is clamped with a warning. PASS-C3: ai_terms / politics_deny are additions-only against the code baseline.
 */
export function validateSageConfig(raw: unknown): ValidateResult {
  return validateWithRules(raw, limitsFromCode());
}

/** Sources that are switched off in a (validated) config. */
export function offSources(c: SageConfig): SourceId[] {
  return SOURCE_IDS.filter((id) => !c.sources[id].on);
}
