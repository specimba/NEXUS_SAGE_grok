/**
 * HN Algolia Pulse chatter — free/public only.
 * GET https://hn.algolia.com/api/v1/search?query=...&tags=story[&numericFilters=created_at_i>now-48h]
 * Pulse candidates only · never Brief pins · cycle stays 003 · lead hf-incident.
 * FREE-PULSE P3: watchlist ≤12 · rotate ≤3/tick · soft_fail merge · no Sol/Astra standing.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPost, type PostClass } from "./x-hygiene";
import { classifyUrl } from "./ingest/shelf";
import { assertNoIncidentNouns, INCIDENT_NOUNS } from "./ingest/queries";

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
export const HN_RECENT_SWEEP_MIN_POINTS = 3;
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
const HN_AI_TERMS =
  /(?<!\w)a\.i\.(?!\w)|\b\d+(\.\d+)?b[- ]param\w*|\b(ai|ais|agi|small models?|vector (db|database)s?|artificial intelligence|machine learning|deep learning|ml|neural|transformers?|agents?|agentic|inference|embeddings?|fine-?tun\w*|rag|diffusion|multimodal|text-to-speech|tts|speech-to-text|stt|prompts?|evals?|alignment|reasoning model|quantiz\w*|quants?|gguf|llama\.cpp|open[- ]weights?|foundation models?|frontier models?|language models?|chatbots?|copilot|vibe cod\w*|mcp)\b|(llm|vlm|gpt)s?\b|gpt-/i;
const HN_AI_NAMES =
  /\b(openai|anthropic|deepmind|hugging ?face|mistral|deepseek|qwen|claude|gemini|gemma|llama|grok|xai|chatgpt|codex|sora|nemotron|glm|kimi|opus|sonnet|haiku|perplexity|cohere|metr|midjourney|stability ai|whisper|jev|cursor|ollama|vllm|pytorch|tensorflow|jax|nano banana)\b/i;
const HN_AI_DOMAINS = [
  "openai.com",
  "anthropic.com",
  "claude.dev",
  "claude.ai",
  "deepmind.google",
  "deepmind.com",
  "huggingface.co",
  "mistral.ai",
  "x.ai",
  "ai.meta.com",
  "ai.google",
  "ai.google.dev",
  "research.google",
  "artificialanalysis.ai",
  "developer.nvidia.com",
  "research.nvidia.com",
];

export function isHnAiRelevant(title: string, url?: string | null): boolean {
  const t = String(title ?? "");
  if (HN_AI_TERMS.test(t) || HN_AI_NAMES.test(t)) return true;
  try {
    const u = new URL(String(url ?? ""));
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (HN_AI_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true;
    if (host === "blog.google" && /innovation-and-ai|\/ai\/|models-and-research/i.test(u.pathname)) return true;
  } catch {
    /* no url */
  }
  return false;
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function throttle(): Promise<void> {
  const gap = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && gap < HN_MIN_INTERVAL_MS) {
    await sleep(HN_MIN_INTERVAL_MS - gap);
  }
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
};

/** Algolia numericFilters value for "created in the last `hours`". */
export function hnRecentFilter(now: number, hours: number): string {
  return `created_at_i>${Math.floor(now / 1000) - Math.round(hours * 3600)}`;
}

export function hnSearchUrl(
  query: string,
  hitsPerPage: number,
  opts: { now?: number; recentHours?: number; optionalWords?: boolean; minPoints?: number } = {},
): string {
  let url =
    `${HN_ALGOLIA_API}?query=${encodeURIComponent(query)}` +
    `&tags=story&hitsPerPage=${clampHitsPerPage(hitsPerPage)}`;
  if (opts.optionalWords) url += `&optionalWords=${encodeURIComponent(query)}`;
  const filters: string[] = [];
  if (opts.recentHours && opts.recentHours > 0) {
    filters.push(hnRecentFilter(opts.now ?? Date.now(), opts.recentHours));
  }
  if (opts.minPoints && opts.minPoints > 0) filters.push(`points>=${opts.minPoints}`);
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
): Promise<{ ok: true; body: HnAlgoliaResponse } | { ok: false; status: number }> {
  await throttle();
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
        const res = await getJson(url, fetchImpl);
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
    const q = HN_RECENT_SWEEP_TERMS.join(" ");
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
