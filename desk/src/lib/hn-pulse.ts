/**
 * HN Algolia Pulse chatter — free/public only.
 * GET https://hn.algolia.com/api/v1/search?query=...&tags=story[&numericFilters=created_at_i>now-48h]
 * Pulse candidates only · never Brief pins · cycle stays 003 · lead hf-incident.
 * FREE-PULSE P3: watchlist ≤12 · rotate ≤3/tick · soft_fail merge · no Sol/Astra standing.
 */

import { isAiRelevant } from "./ai-relevance";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPost, type PostClass } from "./x-hygiene";
import { classifyUrl } from "./ingest/shelf";
import { assertNoIncidentNouns, INCIDENT_NOUNS } from "./ingest/queries";
import { paceWait, type Pace } from "./pace";

export const HN_ALGOLIA_API = "https://hn.algolia.com/api/v1/search";
export const HN_UA = "NEXUS-SAGE-desk/0.2 (free-ingest; contact: local)";
export const HN_MIN_INTERVAL_MS = 2_000;
export const HN_CACHE_TTL_MS = 30 * 60 * 1000;
export const HN_HITS_PER_PAGE_MAX = 20;
/** Cap standing list (Scout SCOUT-HN-P3-QUERIES). */
export const HN_WATCHLIST_MAX = 12;
/** Rotate ≤3 queries per ingest tick — not all 12 every tick. */
export const HN_QUERIES_PER_TICK = 3;
/**
 * Dedupe v2 freshness: live ingest restricts Algolia hits to the last N hours
 * (`numericFilters=created_at_i>…`). Relevance-only search returned months/years-old
 * stories, so HN could never overlap same-day lab/GNews items.
 */
export const HN_RECENT_WINDOW_HOURS = 48;
/**
 * One extra recency sweep per tick (same free Algolia endpoint, not a standing noun query):
 * OR-match over the lab/company entities our other Pulse sources cover, last 48h, points ≥ 3.
 */
export const HN_RECENT_SWEEP_TERMS = [
  "OpenAI",
  "Anthropic",
  "Claude",
  "Gemini",
  "Google",
  "DeepMind",
  "Nvidia",
  "Mistral",
  "Hugging Face",
  "GPT",
] as const;
/** PASS-C2: `keywords.hn_sweep` override (validated at crawl start). Default = HN_RECENT_SWEEP_TERMS. */
let hnSweepTerms: readonly string[] = HN_RECENT_SWEEP_TERMS;
export function configureHnSweepTerms(terms: readonly string[] = HN_RECENT_SWEEP_TERMS): void {
  hnSweepTerms = terms;
}
export const HN_RECENT_SWEEP_MIN_POINTS = 3;

/**
 * PASS-S1.4 — HN title-scoped queries (`keywords.hn_title_queries`). Plain terms, one Algolia request per term
 * per crawl, `restrictSearchableAttributes=title` + last 48h + points ≥ 10. Hits merge into the existing `hn`
 * cap (deduped by objectID against the watchlist + sweep); no new cap, no new SRC chip, not a lead list.
 */
export const HN_TITLE_QUERIES = ["agent", "open weights", "prompt injection", "Qwen", "local model"] as const;
export const HN_TITLE_QUERIES_MAX = 8;
export const HN_TITLE_QUERY_LEN_MAX = 40;
export const HN_TITLE_WINDOW_HOURS = 48;
export const HN_TITLE_MIN_POINTS = 10;
/** Regex metacharacters — a title query is a plain search term, never a pattern. */
export const HN_TITLE_QUERY_BAD_CHARS = /[\\^$*?()[\]{}|]/;
let hnTitleQueries: readonly string[] = HN_TITLE_QUERIES;
export function configureHnTitleQueries(terms: readonly string[] = HN_TITLE_QUERIES): void {
  hnTitleQueries = terms;
}
export function currentHnTitleQueries(): readonly string[] {
  return hnTitleQueries;
}
/** Why a title query is not allowed (null = ok): plain text ≤ 40 chars, no regex, no banned/incident nouns. */
export function hnTitleQueryProblem(q: unknown): string | null {
  if (typeof q !== "string" || !q.trim()) return "must be a non-empty string";
  if (q.length > HN_TITLE_QUERY_LEN_MAX) return `longer than ${HN_TITLE_QUERY_LEN_MAX} chars`;
  if (HN_TITLE_QUERY_BAD_CHARS.test(q)) return "plain text only (no regex)";
  try {
    assertHnStandingSafe(q.trim());
  } catch (e) {
    return String((e as Error).message ?? e);
  }
  return null;
}
/** Sweep pages (each ≤ HN_HITS_PER_PAGE_MAX hits, throttled ≤1 req/2s). */
export const HN_RECENT_SWEEP_PAGES = 2;

/**
 * Watchlist nouns only — Scout P3 deepen (baseline + deepen).
 * No incident-noun / Sol / Astra standing search (flatten lock).
 * Prefer `agent tooling` over bare `jailbreak`.
 */
export const HN_WATCHLIST_QUERIES = [
  "OpenAI",
  "Anthropic",
  "Hugging Face",
  "agents",
  "eval",
  "LLM",
  "METR",
  "ML security",
  "open weights",
  "inference",
  "benchmark",
  "agent tooling",
] as const;

/**
 * Banned as standing Algolia queries (Scout EXCLUDE).
 * Checked as whole-query (case-insensitive) — not substring of other nouns.
 */
export const HN_STANDING_BAN = [
  "sol",
  "astra",
  "persistent sol",
  "hf breach",
  "jailbreak",
  "bluesky",
] as const;

/**
 * Beat 5 AI-relevance gate for HN Pulse rows. The OR-entity sweep matches generic company
 * names (Google/Apple/Nvidia/Meta), letting non-AI stories through (e.g. a Steve Jobs iPhone 4
 * Antennagate Q&A). A row must carry an AI/ML term or a lab/model name in its title, or come
 * from an AI lab domain. Generic company names alone never qualify.
 */
export function isHnAiRelevant(title: string, url?: string | null): boolean {
  return isAiRelevant(title, url);
}

export type HnAlgoliaHit = {
  objectID: string;
  title?: string | null;
  url?: string | null;
  story_url?: string | null;
  author?: string | null;
  points?: number | null;
  num_comments?: number | null;
  created_at?: string | null;
  _tags?: string[];
};

export type HnAlgoliaResponse = {
  hits?: HnAlgoliaHit[];
  nbHits?: number;
  hitsPerPage?: number;
  query?: string;
};

export type HnPulseCandidate = {
  id: string;
  text: string;
  url: string;
  source: "hn-algolia";
  score: number;
  at: string;
  author: string;
  class: PostClass;
  tag: "rest" | "rumor" | "companion" | "incident";
  reasons: string[];
  pulseOnly: true;
  briefEligible: false;
};

export type HnQuerySoftFail = {
  query: string;
  reason: string;
  soft_fail: true;
};

export type FetchHnResult = {
  candidates: HnPulseCandidate[];
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  queries_run: string[];
  queries_ok: string[];
  queries_soft_fail: HnQuerySoftFail[];
  /** Recency sweep outcome (null when not requested). */
  recent_sweep?: { ok: boolean; hits: number; reason?: string } | null;
  recent_hours?: number | null;
  /** Beat 5: hits dropped by the AI-relevance gate (null when gate off). */
  ai_dropped?: number | null;
  ai_dropped_titles?: string[];
  brief: false;
  pulse_only: true;
  from_cache: boolean;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/hn-cache",
);

let lastRequestAt = 0;
let queryRotateOffset = 0;

/** Test helper — advance rotate cursor. */
export function setHnQueryRotateOffset(n: number) {
  queryRotateOffset = Math.max(0, Math.floor(n));
}

export function resetHnPulseTickState() {
  lastRequestAt = 0;
  queryRotateOffset = 0;
}

export function queryHash(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function resolveHnCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/hn-cache");
  return DEFAULT_CACHE_DIR;
}

function cachePath(cacheDir: string, query: string): string {
  return resolve(cacheDir, `${queryHash(query)}.json`);
}

function readCache(
  cacheDir: string,
  query: string,
  now = Date.now(),
): HnAlgoliaResponse | null {
  const p = cachePath(cacheDir, query);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      cached_at?: string;
      body?: HnAlgoliaResponse;
    };
    const t = raw.cached_at ? Date.parse(raw.cached_at) : NaN;
    if (!Number.isFinite(t) || now - t > HN_CACHE_TTL_MS) return null;
    return raw.body ?? null;
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  query: string,
  body: HnAlgoliaResponse,
  now = Date.now(),
) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    cachePath(cacheDir, query),
    `${JSON.stringify({ cached_at: iso, query, body }, null, 2)}\n`,
  );
}

function throttle(pace?: Pace): Promise<void> {
  return paceWait(lastRequestAt, HN_MIN_INTERVAL_MS, pace);
}

/** Cap hitsPerPage hard at 20. */
export function clampHitsPerPage(n?: number): number {
  const v = Number.isFinite(n) ? Number(n) : 10;
  return Math.min(HN_HITS_PER_PAGE_MAX, Math.max(1, Math.floor(v)));
}

/** Reject Sol/Astra/jailbreak/etc as standing Algolia queries. */
export function assertHnStandingSafe(query: string): void {
  assertNoIncidentNouns(query);
  const lower = String(query ?? "").trim().toLowerCase();
  for (const ban of HN_STANDING_BAN) {
    if (lower === ban || lower === ban.replace(/\s+/g, "-")) {
      throw new Error(`HN standing search must not include banned noun: ${ban}`);
    }
  }
}

/** Standing queries: watchlist nouns only; throw if incident/ban nouns sneak in. */
export function hnStandingQueries(
  queries: readonly string[] = HN_WATCHLIST_QUERIES,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const trimmed = String(q ?? "").trim();
    if (!trimmed) continue;
    assertHnStandingSafe(trimmed);
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  if (out.length > HN_WATCHLIST_MAX) {
    return out.slice(0, HN_WATCHLIST_MAX);
  }
  return out;
}

/**
 * Rotate ≤3 queries / ingest tick across the standing watchlist.
 * Day-bucket + optional test offset (Wikidata-style).
 */
export function pickHnQueriesForTick(
  now = Date.now(),
  max = HN_QUERIES_PER_TICK,
  queries: readonly string[] = HN_WATCHLIST_QUERIES,
): string[] {
  const list = hnStandingQueries(queries);
  if (!list.length) return [];
  const n = Math.min(Math.max(1, max), HN_QUERIES_PER_TICK, list.length);
  const day = Math.floor(now / 86_400_000);
  const start = (day + queryRotateOffset) % list.length;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(list[(start + i) % list.length]!);
  }
  return out;
}

export function parseHnHits(payload: HnAlgoliaResponse | HnAlgoliaHit[]): HnAlgoliaHit[] {
  if (Array.isArray(payload)) return payload.filter((h) => h && h.objectID);
  const hits = payload?.hits;
  if (!Array.isArray(hits)) return [];
  return hits.filter((h) => h && typeof h.objectID === "string" && h.objectID);
}

function hitUrl(hit: HnAlgoliaHit): string {
  const u = (hit.url || hit.story_url || "").trim();
  if (u) return u;
  return `https://news.ycombinator.com/item?id=${hit.objectID}`;
}

function toIso(created: string | null | undefined): string {
  if (!created) return new Date(0).toISOString().replace(/\.\d{3}Z$/, "Z");
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return String(created);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Map Algolia hits → Pulse candidates.
 * Must pass classifyPost: flatten/DENY → drop; rumor → tag; toolkit URL → drop from Pulse.
 * Never Brief-eligible.
 */
export function toPulseCandidates(hits: HnAlgoliaHit[]): HnPulseCandidate[] {
  const out: HnPulseCandidate[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const title = String(hit.title ?? "").trim();
    if (!title || !hit.objectID) continue;
    const id = `hn:${hit.objectID}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const url = hitUrl(hit);
    const urlLane = classifyUrl(url);
    if (urlLane.lane === "shelf") {
      // Toolkit / arXiv shelf links — off Pulse Brief path (never toolkit Brief pins)
      continue;
    }

    const classified = classifyPost({
      text: title,
      handle: hit.author ?? "hn",
    });

    // DENY / flatten → drop
    if (classified.flatten || classified.class === "flatten") continue;
    if (classified.class === "drop") continue;

    let tag: HnPulseCandidate["tag"] = "rest";
    if (classified.class === "rumor" || classified.rumor) tag = "rumor";
    else if (classified.class === "companion") tag = "companion";
    else if (classified.class === "incident") tag = "incident";
    else tag = "rest";

    // Rumor: tag (keep as chatter) — never Brief
    out.push({
      id,
      text: title,
      url,
      source: "hn-algolia",
      score: Math.max(0, Number(hit.points) || 0),
      at: toIso(hit.created_at),
      author: String(hit.author ?? "hn"),
      class: classified.class,
      tag,
      reasons: classified.reasons,
      pulseOnly: true,
      briefEligible: false,
    });
  }

  return out.sort((a, b) => b.score - a.score || b.at.localeCompare(a.at));
}

/** Hard gate: HN alone never Brief lead/companion. */
export function isHnBriefEligible(_item?: HnPulseCandidate): false {
  void _item;
  return false;
}

export type FetchHnOpts = {
  cacheDir?: string;
  hitsPerPage?: number;
  queries?: readonly string[];
  /** Inject Algolia JSON (tests / offline). Skips network. */
  fixtureJson?: HnAlgoliaResponse | string;
  now?: number;
  /** Cap queries this tick (default HN_QUERIES_PER_TICK). */
  maxQueries?: number;
  /** Skip rotate — run full standing set (tests only). */
  runAllQueries?: boolean;
  /** Test: force every live query to soft-fail with this status. */
  forceSoftFail?: 429 | 500 | 503;
  /** Optional fetch override (tests). */
  fetchImpl?: typeof fetch;
  /** Restrict live hits to the last N hours (ingest passes HN_RECENT_WINDOW_HOURS). */
  recentHours?: number;
  /** Also run one OR-entity recency sweep (requires recentHours). */
  recentSweep?: boolean;
  /** Beat 5: drop rows failing isHnAiRelevant (ingest passes true). */
  aiOnly?: boolean;
  /** Request pacing override (tests pass `minIntervalMs: 0`); default = the source's *_MIN_INTERVAL_MS. */
  minIntervalMs?: number;
  sleep?: Pace["sleep"];
};

/** Algolia numericFilters value for "created in the last `hours`". */
export function hnRecentFilter(now: number, hours: number): string {
  return `created_at_i>${Math.floor(now / 1000) - Math.round(hours * 3600)}`;
}

export function hnSearchUrl(
  query: string,
  hitsPerPage: number,
  opts: { now?: number; recentHours?: number; optionalWords?: boolean; minPoints?: number; titleOnly?: boolean } = {},
): string {
  let url =
    `${HN_ALGOLIA_API}?query=${encodeURIComponent(query)}` +
    `&tags=story&hitsPerPage=${clampHitsPerPage(hitsPerPage)}`;
  if (opts.optionalWords) url += `&optionalWords=${encodeURIComponent(query)}`;
  // PASS-S1.4: title-scoped search — match the headline only, last 48h, points ≥ 10 (fixed, not configurable).
  if (opts.titleOnly) url += "&restrictSearchableAttributes=title";
  const recentHours = opts.titleOnly ? HN_TITLE_WINDOW_HOURS : opts.recentHours;
  const minPoints = opts.titleOnly ? HN_TITLE_MIN_POINTS : opts.minPoints;
  const filters: string[] = [];
  if (recentHours && recentHours > 0) {
    filters.push(hnRecentFilter(opts.now ?? Date.now(), recentHours));
  }
  if (minPoints && minPoints > 0) filters.push(`points>=${minPoints}`);
  if (filters.length) url += `&numericFilters=${encodeURIComponent(filters.join(","))}`;
  return url;
}

/** Drop hits older than the window (defensive; Algolia already filters). Missing created_at → keep. */
export function filterRecentHits(hits: HnAlgoliaHit[], now: number, hours: number): HnAlgoliaHit[] {
  const floor = now - hours * 3_600_000;
  return hits.filter((h) => {
    const t = h.created_at ? Date.parse(h.created_at) : NaN;
    return !Number.isFinite(t) || t >= floor;
  });
}

async function getJson(
  url: string,
  fetchImpl: typeof fetch = fetch,
  pace?: Pace,
): Promise<{ ok: true; body: HnAlgoliaResponse } | { ok: false; status: number }> {
  await throttle(pace);
  lastRequestAt = Date.now();
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": HN_UA,
    },
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const body = (await res.json()) as HnAlgoliaResponse;
  return { ok: true, body };
}

function softFailReasonFromQueries(fails: HnQuerySoftFail[]): string | undefined {
  if (!fails.length) return undefined;
  return fails.map((f) => `${f.query}:${f.reason}`).join("; ");
}

/**
 * Fetch Pulse chatter for watchlist noun queries.
 * ≤1 req/2s · cache 30m by query hash · hitsPerPage≤20 · rotate ≤3/tick ·
 * one query 5xx ≠ kill HN (soft_fail merge) · zero credentials · never Brief.
 */
export async function fetchHnPulse(
  opts: FetchHnOpts = {},
): Promise<FetchHnResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const hitsPerPage = clampHitsPerPage(opts.hitsPerPage ?? 10);
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const pace: Pace = { minIntervalMs: opts.minIntervalMs, sleep: opts.sleep };
  const recentHours = opts.recentHours && opts.recentHours > 0 ? opts.recentHours : 0;

  if (opts.fixtureJson) {
    const payload =
      typeof opts.fixtureJson === "string"
        ? (JSON.parse(opts.fixtureJson) as HnAlgoliaResponse)
        : opts.fixtureJson;
    const candidates = toPulseCandidates(parseHnHits(payload));
    return {
      candidates,
      ok: candidates.length > 0,
      soft_fail: false,
      queries_run: ["(fixture)"],
      queries_ok: ["(fixture)"],
      queries_soft_fail: [],
      brief: false,
      pulse_only: true,
      from_cache: false,
    };
  }

  const standing = hnStandingQueries(opts.queries ?? HN_WATCHLIST_QUERIES);
  const queries = opts.runAllQueries
    ? standing.slice(0, HN_WATCHLIST_MAX)
    : pickHnQueriesForTick(now, opts.maxQueries ?? HN_QUERIES_PER_TICK, standing);

  const allHits: HnAlgoliaHit[] = [];
  const seenIds = new Set<string>();
  const queries_ok: string[] = [];
  const queries_soft_fail: HnQuerySoftFail[] = [];
  let from_cache = false;

  for (const query of queries) {
    if (opts.forceSoftFail) {
      const reason = `HTTP ${opts.forceSoftFail}`;
      console.log(`HN: soft_fail query="${query}" — ${reason}`);
      queries_soft_fail.push({ query, reason, soft_fail: true });
      continue;
    }

    const cacheKey = recentHours ? `${query}|recent${recentHours}h` : query;
    let payload = readCache(cacheDir, cacheKey, now);
    if (payload) {
      from_cache = true;
      queries_ok.push(query);
    } else {
      const url = hnSearchUrl(query, hitsPerPage, { now, recentHours });
      try {
        const res = await getJson(url, fetchImpl, pace);
        if (!res.ok) {
          const reason = `HTTP ${res.status}`;
          console.log(`HN: soft_fail query="${query}" — ${reason} (continue merge)`);
          queries_soft_fail.push({ query, reason, soft_fail: true });
          continue;
        }
        payload = res.body;
        writeCache(cacheDir, cacheKey, payload, now);
        queries_ok.push(query);
      } catch (err) {
        const reason = `network: ${String(err)}`;
        console.log(`HN: soft_fail query="${query}" — ${reason}`);
        queries_soft_fail.push({ query, reason, soft_fail: true });
        continue;
      }
    }

    for (const h of parseHnHits(payload)) {
      if (seenIds.has(h.objectID)) continue;
      seenIds.add(h.objectID);
      allHits.push(h);
    }
  }

  let recent_sweep: FetchHnResult["recent_sweep"] = null;
  if (opts.recentSweep && recentHours && !opts.forceSoftFail) {
    const q = hnSweepTerms.join(" ");
    let hitsTotal = 0;
    let failReason: string | undefined;
    for (let page = 0; page < HN_RECENT_SWEEP_PAGES; page++) {
      const cacheKey = `sweep|${q}|recent${recentHours}h|p${page}`;
      let payload = readCache(cacheDir, cacheKey, now);
      try {
        if (!payload) {
          const res = await getJson(
            `${hnSearchUrl(q, HN_HITS_PER_PAGE_MAX, {
              now,
              recentHours,
              optionalWords: true,
              minPoints: HN_RECENT_SWEEP_MIN_POINTS,
            })}&page=${page}`,
            fetchImpl,
            pace,
          );
          if (res.ok) {
            payload = res.body;
            writeCache(cacheDir, cacheKey, payload, now);
          } else {
            failReason = `HTTP ${res.status}`;
          }
        } else {
          from_cache = true;
        }
      } catch (err) {
        failReason = `network: ${String(err)}`;
      }
      if (!payload) break;
      const hits = parseHnHits(payload);
      hitsTotal += hits.length;
      for (const h of hits) {
        if (seenIds.has(h.objectID)) continue;
        seenIds.add(h.objectID);
        allHits.push(h);
      }
      if (hits.length < HN_HITS_PER_PAGE_MAX) break;
    }
    recent_sweep = failReason && hitsTotal === 0
      ? { ok: false, hits: 0, reason: failReason }
      : { ok: true, hits: hitsTotal, ...(failReason ? { reason: failReason } : {}) };
  }

  const freshHits = recentHours ? filterRecentHits(allHits, now, recentHours) : allHits;
  const relevantHits = opts.aiOnly
    ? freshHits.filter((h) => isHnAiRelevant(String(h.title ?? ""), h.url || h.story_url))
    : freshHits;
  const ai_dropped = freshHits.length - relevantHits.length;
  const ai_dropped_titles = opts.aiOnly
    ? freshHits.filter((h) => !relevantHits.includes(h)).map((h) => String(h.title ?? ""))
    : [];
  const candidates = toPulseCandidates(relevantHits);
  const soft_fail = queries_soft_fail.length > 0;
  const soft_fail_reason = softFailReasonFromQueries(queries_soft_fail);

  return {
    candidates,
    ok: candidates.length > 0 || (queries_ok.length > 0 && !soft_fail),
    soft_fail,
    soft_fail_reason,
    queries_run: queries,
    queries_ok,
    queries_soft_fail,
    recent_sweep,
    recent_hours: recentHours || null,
    ai_dropped: opts.aiOnly ? ai_dropped : null,
    ai_dropped_titles,
    brief: false,
    pulse_only: true,
    from_cache,
  };
}

/** Confirm standing query set never includes incident / ban nouns (lock). */
export function hnQueriesSafe(queries: readonly string[] = HN_WATCHLIST_QUERIES): boolean {
  try {
    if (queries.length > HN_WATCHLIST_MAX) return false;
    hnStandingQueries(queries);
    for (const q of queries) {
      const lower = q.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        if (lower.includes(n.toLowerCase())) return false;
      }
      for (const ban of HN_STANDING_BAN) {
        if (lower === ban || lower === ban.replace(/\s+/g, "-")) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export type FetchHnTitleOpts = {
  cacheDir?: string;
  /** hitsPerPage per term = the `hn` cap (clamped ≤ 20). */
  hitsPerPage?: number;
  queries?: readonly string[];
  now?: number;
  fetchImpl?: typeof fetch;
  /** Inject Algolia JSON per term (tests / offline). Terms without a fixture are not fetched. */
  fixtures?: Record<string, HnAlgoliaResponse>;
  /** Beat 5 AI-relevance gate (ingest passes true, same as the watchlist rows). */
  aiOnly?: boolean;
  minIntervalMs?: number;
  sleep?: Pace["sleep"];
};

export type FetchHnTitleResult = {
  candidates: HnPulseCandidate[];
  queries_run: string[];
  queries_ok: string[];
  queries_soft_fail: HnQuerySoftFail[];
  hits: number;
  ai_dropped: number;
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  from_cache: boolean;
  /** PASS-S1.8: true when `keywords.hn_title_queries` is empty — empty means off (no request, no meter). */
  off?: boolean;
};

/**
 * PASS-S1.4 — one title-scoped Algolia request per `keywords.hn_title_queries` term (≤ 8). Cache 30m per term.
 * Same politeness / classifyPost / AI gate as the watchlist. A failed term soft-fails alone; never Brief.
 */
export async function fetchHnTitleQueries(opts: FetchHnTitleOpts = {}): Promise<FetchHnTitleResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const hitsPerPage = clampHitsPerPage(opts.hitsPerPage ?? HN_HITS_PER_PAGE_MAX);
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const pace: Pace = { minIntervalMs: opts.minIntervalMs, sleep: opts.sleep };
  const queries = [...new Set((opts.queries ?? hnTitleQueries).map((q) => q.trim()).filter((q) => q && !hnTitleQueryProblem(q)))].slice(0, HN_TITLE_QUERIES_MAX);
  // PASS-S1.8: an empty list means off — no request, nothing merged, not a soft-fail.
  if (!queries.length) {
    return { candidates: [], queries_run: [], queries_ok: [], queries_soft_fail: [], hits: 0, ai_dropped: 0, ok: true, soft_fail: false, from_cache: false, off: true };
  }
  const allHits: HnAlgoliaHit[] = [];
  const seen = new Set<string>();
  const queries_ok: string[] = [];
  const queries_soft_fail: HnQuerySoftFail[] = [];
  let from_cache = false;
  for (const query of queries) {
    let payload: HnAlgoliaResponse | null = null;
    if (opts.fixtures) {
      payload = opts.fixtures[query] ?? null;
      if (!payload) {
        queries_soft_fail.push({ query, reason: "no fixture", soft_fail: true });
        continue;
      }
    } else {
      const cacheKey = `title|${query}|recent${HN_TITLE_WINDOW_HOURS}h|p${HN_TITLE_MIN_POINTS}`;
      payload = readCache(cacheDir, cacheKey, now);
      if (payload) from_cache = true;
      else {
        try {
          const res = await getJson(hnSearchUrl(query, hitsPerPage, { now, titleOnly: true }), fetchImpl, pace);
          if (!res.ok) {
            queries_soft_fail.push({ query, reason: `HTTP ${res.status}`, soft_fail: true });
            continue;
          }
          payload = res.body;
          writeCache(cacheDir, cacheKey, payload, now);
        } catch (err) {
          const name = (err as Error)?.name;
          const reason = name === "TimeoutError" || name === "AbortError" ? "timeout" : `network: ${String(err)}`;
          queries_soft_fail.push({ query, reason, soft_fail: true });
          continue;
        }
      }
    }
    queries_ok.push(query);
    for (const h of parseHnHits(payload)) {
      if (seen.has(h.objectID)) continue;
      seen.add(h.objectID);
      allHits.push(h);
    }
  }
  const fresh = filterRecentHits(allHits, now, HN_TITLE_WINDOW_HOURS).filter((h) => (h.points ?? 0) >= HN_TITLE_MIN_POINTS);
  const relevant = opts.aiOnly ? fresh.filter((h) => isHnAiRelevant(String(h.title ?? ""), h.url || h.story_url)) : fresh;
  const soft_fail = queries_soft_fail.length > 0;
  return {
    candidates: toPulseCandidates(relevant),
    queries_run: queries,
    queries_ok,
    queries_soft_fail,
    hits: allHits.length,
    ai_dropped: fresh.length - relevant.length,
    ok: queries_ok.length > 0,
    soft_fail,
    soft_fail_reason: softFailReasonFromQueries(queries_soft_fail),
    from_cache,
  };
}

/**
 * PASS-S1.4 merge: title hits join the live HN rows deduped by objectID (= the `hn:<objectID>` id) against the
 * watchlist + sweep, and only up to the `hn` cap of new rows (the existing cap — no new one). Order: existing rows
 * first (unchanged), then title hits by points desc, then id.
 */
export function mergeHnTitleHits(
  rows: readonly HnPulseCandidate[],
  title: readonly HnPulseCandidate[],
  cap: number,
): { rows: HnPulseCandidate[]; added: HnPulseCandidate[]; duplicates: number } {
  const have = new Set(rows.map((r) => r.id));
  const fresh = title.filter((t) => !have.has(t.id));
  const added = [...fresh].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, Math.max(0, cap));
  return { rows: [...rows, ...added], added, duplicates: title.length - fresh.length };
}
