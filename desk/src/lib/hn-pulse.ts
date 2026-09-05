/**
 * HN Algolia Pulse chatter — free/public only.
 * GET https://hn.algolia.com/api/v1/search?query=...&tags=story
 * Pulse candidates only · never Brief pins · cycle stays 003 · lead hf-incident.
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

/** Watchlist nouns only — no incident-noun standing search (Sol/Astra flatten lock). */
export const HN_WATCHLIST_QUERIES = [
  "OpenAI",
  "Anthropic",
  "Hugging Face",
  "agents",
  "eval",
] as const;

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

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/hn-cache",
);

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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

/** Standing queries: watchlist nouns only; throw if incident nouns sneak in. */
export function hnStandingQueries(
  queries: readonly string[] = HN_WATCHLIST_QUERIES,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const trimmed = String(q ?? "").trim();
    if (!trimmed) continue;
    assertNoIncidentNouns(trimmed);
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
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
};

async function getJson(
  url: string,
): Promise<{ ok: true; body: HnAlgoliaResponse } | { ok: false; status: number }> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetch(url, {
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

/**
 * Fetch Pulse chatter for watchlist noun queries.
 * ≤1 req/2s · cache 30m by query hash · hitsPerPage≤20 · zero credentials.
 */
export async function fetchHnPulse(
  opts: FetchHnOpts = {},
): Promise<HnPulseCandidate[]> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const hitsPerPage = clampHitsPerPage(opts.hitsPerPage ?? 10);
  const now = opts.now ?? Date.now();

  if (opts.fixtureJson) {
    const payload =
      typeof opts.fixtureJson === "string"
        ? (JSON.parse(opts.fixtureJson) as HnAlgoliaResponse)
        : opts.fixtureJson;
    return toPulseCandidates(parseHnHits(payload));
  }

  const queries = hnStandingQueries(opts.queries ?? HN_WATCHLIST_QUERIES);
  const allHits: HnAlgoliaHit[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    let payload = readCache(cacheDir, query, now);
    if (!payload) {
      const url =
        `${HN_ALGOLIA_API}?query=${encodeURIComponent(query)}` +
        `&tags=story&hitsPerPage=${hitsPerPage}`;
      try {
        const res = await getJson(url);
        if (!res.ok) {
          console.log(`HN: HTTP ${res.status} for query="${query}" — skip`);
          continue;
        }
        payload = res.body;
        writeCache(cacheDir, query, payload, now);
      } catch (err) {
        console.log(`HN: fetch failed for query="${query}" — ${String(err)}`);
        continue;
      }
    }

    for (const h of parseHnHits(payload)) {
      if (seenIds.has(h.objectID)) continue;
      seenIds.add(h.objectID);
      allHits.push(h);
    }
  }

  return toPulseCandidates(allHits);
}

/** Confirm standing query set never includes incident nouns (lock). */
export function hnQueriesSafe(queries: readonly string[] = HN_WATCHLIST_QUERIES): boolean {
  try {
    hnStandingQueries(queries);
    for (const q of queries) {
      const lower = q.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        if (lower.includes(n.toLowerCase())) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
