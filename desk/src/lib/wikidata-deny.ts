/**
 * Wikidata DENY grounding — wbsearchentities search, filter, toDenyHints.
 * Spec: refs/WIRE-WIKIDATA-DENY.md
 * UA free-ingest · ≤1 call/2s · ≤3 seeds/tick · 24h cache · soft-fail 429/5xx
 * Never Brief · never Pulse lead · never invent pins · cycle 003 / hf-incident
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findSeed,
  seedSlug,
  WIKIDATA_DENY_SEEDS,
  type WikidataDenySeed,
} from "../data/wikidata-deny-seeds";

export const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
export const WIKIDATA_UA =
  "NEXUS-SAGE-desk/0.2 (free-ingest; wikidata; mailto:local@nexus-sage.invalid)";
export const WIKIDATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const WIKIDATA_MIN_INTERVAL_MS = 2000;
export const WIKIDATA_MAX_SEEDS_PER_TICK = 3;
export const WIKIDATA_SEARCH_LIMIT = 5;

export type WikidataSearchHit = {
  id?: string;
  label?: string;
  description?: string;
  aliases?: string[];
  match?: { type?: string; language?: string; text?: string };
};

export type WikidataSearchResponse = {
  searchinfo?: { search?: string };
  search?: WikidataSearchHit[];
  success?: number;
  error?: { code?: string; info?: string };
};

export type WikidataDenyHint = {
  seed: string;
  qid: string | null;
  label: string | null;
  description: string | null;
  status: "matched" | "rejected_false_friend" | "unresolved" | "soft_fail";
  source: "wikidata";
  briefEligible: false;
  pulseLeadEligible: false;
  denyGroundingOnly: true;
};

export type FetchWikidataDenyResult = {
  hints: WikidataDenyHint[];
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  from_cache: boolean;
  searches: number;
  seeds_tried: string[];
  brief: false;
  pulse_lead: false;
  deny_grounding_only: true;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/wikidata-cache",
);

let lastCallAt = 0;
let searchesThisTick = 0;
let seedRotateOffset = 0;

export function resetWikidataDenyTickState() {
  searchesThisTick = 0;
}

export function getWikidataSearchesThisTick(): number {
  return searchesThisTick;
}

/** Test helper — advance rotate cursor. */
export function setWikidataSeedRotateOffset(n: number) {
  seedRotateOffset = Math.max(0, Math.floor(n));
}

export function resolveWikidataCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/wikidata-cache");
  return DEFAULT_CACHE_DIR;
}

export function buildWbSearchUrl(query: string, limit = WIKIDATA_SEARCH_LIMIT): string {
  const u = new URL(WIKIDATA_API);
  u.searchParams.set("action", "wbsearchentities");
  u.searchParams.set("search", query);
  u.searchParams.set("language", "en");
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", String(limit));
  return u.toString();
}

export function buildWbGetEntitiesUrl(ids: string[]): string {
  const u = new URL(WIKIDATA_API);
  u.searchParams.set("action", "wbgetentities");
  u.searchParams.set("ids", ids.join("|"));
  u.searchParams.set("props", "labels|descriptions|aliases");
  u.searchParams.set("languages", "en");
  u.searchParams.set("format", "json");
  return u.toString();
}

/** ≤3 seeds per tick, rotate across curated list. */
export function pickSeedsForTick(
  now = Date.now(),
  max = WIKIDATA_MAX_SEEDS_PER_TICK,
  seeds: readonly WikidataDenySeed[] = WIKIDATA_DENY_SEEDS,
): WikidataDenySeed[] {
  const list = seeds.length ? [...seeds] : [...WIKIDATA_DENY_SEEDS];
  if (!list.length) return [];
  const n = Math.min(max, list.length);
  const day = Math.floor(now / 86_400_000);
  const start = (day + seedRotateOffset) % list.length;
  const out: WikidataDenySeed[] = [];
  for (let i = 0; i < n; i++) {
    out.push(list[(start + i) % list.length]!);
  }
  return out;
}

/** One query per seed — rotate by day within seed.queries. */
export function pickQueryForSeed(seed: WikidataDenySeed, now = Date.now()): string {
  const qs = seed.queries.length ? seed.queries : [seed.seed];
  const day = Math.floor(now / 86_400_000);
  return qs[day % qs.length]!;
}

function cachePath(cacheDir: string, seed: string): string {
  return resolve(cacheDir, `${seedSlug(seed)}.json`);
}

function readCache(
  cacheDir: string,
  seed: string,
  now = Date.now(),
): { body: WikidataSearchResponse; query: string } | null {
  const p = cachePath(cacheDir, seed);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      cached_at?: string;
      query?: string;
      body?: WikidataSearchResponse;
    };
    const t = raw.cached_at ? Date.parse(raw.cached_at) : NaN;
    if (!Number.isFinite(t) || now - t > WIKIDATA_CACHE_TTL_MS) return null;
    if (!raw.body) return null;
    return { body: raw.body, query: raw.query ?? seed };
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  seed: string,
  query: string,
  body: WikidataSearchResponse,
  now = Date.now(),
) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    cachePath(cacheDir, seed),
    `${JSON.stringify({ cached_at: iso, seed, query, body }, null, 2)}\n`,
  );
}

function hitText(h: WikidataSearchHit): string {
  return `${h.label ?? ""} ${h.description ?? ""} ${(h.aliases ?? []).join(" ")}`;
}

/** Scout SoT: rejectQids before allowlist; also rejectLabelRe on label/desc/aliases. */
function isRejectedFalseFriend(seed: WikidataDenySeed, h: WikidataSearchHit): boolean {
  const id = String(h.id ?? "").trim();
  if (id && (seed.rejectQids ?? []).includes(id)) return true;
  const re = seed.rejectLabelRe;
  if (re && re.test(hitText(h))) return true;
  return false;
}

function isAllowlisted(seed: WikidataDenySeed, h: WikidataSearchHit): boolean {
  const id = String(h.id ?? "").trim();
  if (!id) return false;
  const allowed = seed.allowedQids ?? [];
  if (!allowed.length) return false;
  return allowed.includes(id);
}

/**
 * Rank allowlisted hit: exact alias > exact label > other allowlisted.
 * Multi-word seeds may use contains on label only when already allowlisted.
 * Never invent — rank 0 if not in allowedQids.
 */
function allowlistRank(seed: WikidataDenySeed, h: WikidataSearchHit): number {
  if (!isAllowlisted(seed, h)) return 0;
  const token = seed.seed.trim().toLowerCase();
  const label = (h.label ?? "").trim().toLowerCase();
  const aliases = (h.aliases ?? []).map((a) => a.trim().toLowerCase());
  if (aliases.some((a) => a === token)) return 3;
  if (label === token) return 2;
  if (token.includes(" ") && (label.includes(token) || aliases.some((a) => a.includes(token)))) {
    return 1;
  }
  return 1; // other allowlisted Q-id
}

/**
 * Filter search hits → one WikidataDenyHint per seed.
 * Scout match order: rejectQids/rejectLabelRe → skip allow; else exact allowlist only.
 * matched > rejected_false_friend > unresolved. Never invent Q-ids.
 */
export function filterSearchHits(
  seed: WikidataDenySeed | string,
  payload: WikidataSearchResponse | WikidataSearchHit[] | null | undefined,
): WikidataDenyHint {
  const seedDef =
    typeof seed === "string" ? findSeed(seed) : seed;
  const seedName = seedDef?.seed ?? (typeof seed === "string" ? seed : "unknown");
  const hits: WikidataSearchHit[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.search)
      ? payload!.search!
      : [];

  const base = {
    seed: seedName,
    source: "wikidata" as const,
    briefEligible: false as const,
    pulseLeadEligible: false as const,
    denyGroundingOnly: true as const,
  };

  if (!seedDef) {
    return {
      ...base,
      qid: null,
      label: null,
      description: null,
      status: "unresolved",
    };
  }

  let bestMatch: { hit: WikidataSearchHit; rank: number } | null = null;
  let falseFriend: WikidataSearchHit | null = null;

  for (const h of hits) {
    // 1) reject before allowlist
    if (isRejectedFalseFriend(seedDef, h)) {
      if (!falseFriend) falseFriend = h;
      continue;
    }
    // 2) exact allowlist only — never heuristic-accept
    const rank = allowlistRank(seedDef, h);
    if (rank > 0 && (!bestMatch || rank > bestMatch.rank)) {
      bestMatch = { hit: h, rank };
    }
  }

  if (bestMatch) {
    const h = bestMatch.hit;
    return {
      ...base,
      qid: String(h.id ?? "").trim() || null,
      label: h.label ?? null,
      description: h.description ?? null,
      status: "matched",
    };
  }

  if (falseFriend) {
    return {
      ...base,
      qid: String(falseFriend.id ?? "").trim() || null,
      label: falseFriend.label ?? null,
      description: falseFriend.description ?? null,
      status: "rejected_false_friend",
    };
  }

  return {
    ...base,
    qid: null,
    label: null,
    description: null,
    status: "unresolved",
  };
}

export function toDenyHints(
  results: Array<{ seed: WikidataDenySeed | string; payload: WikidataSearchResponse | WikidataSearchHit[] | null }>,
): WikidataDenyHint[] {
  return results.map((r) => filterSearchHits(r.seed, r.payload));
}

export function isWikidataBriefEligible(_h?: WikidataDenyHint): false {
  void _h;
  return false;
}

export function isWikidataPulseLeadEligible(_h?: WikidataDenyHint): false {
  void _h;
  return false;
}

export type FetchWikidataDenyOpts = {
  cacheDir?: string;
  seeds?: readonly WikidataDenySeed[];
  maxSeeds?: number;
  now?: number;
  /** Inject per-seed search JSON (tests). Skips network for those seeds. */
  fixturesBySeed?: Record<string, WikidataSearchResponse | string>;
  /** Force soft-fail without network. */
  forceSoftFail?: 429 | 500 | 502 | 503;
  fetchImpl?: typeof fetch;
  /** Sleep between calls (ms). Tests may set 0. */
  minIntervalMs?: number;
};

function softHint(seed: string, reason: string): WikidataDenyHint {
  return {
    seed,
    qid: null,
    label: null,
    description: null,
    status: "soft_fail",
    source: "wikidata",
    briefEligible: false,
    pulseLeadEligible: false,
    denyGroundingOnly: true,
  };
}

async function sleep(ms: number) {
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

async function rateWait(minIntervalMs: number, now: number) {
  const wait = lastCallAt + minIntervalMs - now;
  if (wait > 0) await sleep(wait);
}

async function getSearchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<
  | { ok: true; body: WikidataSearchResponse; status: number }
  | { ok: false; status: number }
> {
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": WIKIDATA_UA,
    },
  });
  lastCallAt = Date.now();
  searchesThisTick += 1;

  if (res.status === 429 || res.status >= 500) {
    try {
      await res.text();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status };
  }
  if (!res.ok) {
    try {
      await res.text();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status };
  }
  let body: WikidataSearchResponse;
  try {
    body = (await res.json()) as WikidataSearchResponse;
  } catch {
    return { ok: false, status: res.status || -1 };
  }
  return { ok: true, body, status: res.status };
}

/**
 * Rotate ≤3 seeds → search/filter → deny hints.
 * Prefer 24h cache · soft-fail 429/5xx · never Brief / Pulse lead.
 */
export async function fetchWikidataDeny(
  opts: FetchWikidataDenyOpts = {},
): Promise<FetchWikidataDenyResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const now = opts.now ?? Date.now();
  const minInterval = opts.minIntervalMs ?? WIKIDATA_MIN_INTERVAL_MS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxSeeds = opts.maxSeeds ?? WIKIDATA_MAX_SEEDS_PER_TICK;
  const seedList = opts.seeds ?? WIKIDATA_DENY_SEEDS;
  const picked = pickSeedsForTick(now, maxSeeds, seedList);

  if (opts.forceSoftFail) {
    const hints = picked.map((s) => softHint(s.seed, `HTTP ${opts.forceSoftFail}`));
    return {
      hints,
      ok: false,
      soft_fail: true,
      soft_fail_reason: `HTTP ${opts.forceSoftFail}`,
      from_cache: false,
      searches: 0,
      seeds_tried: picked.map((s) => s.seed),
      brief: false,
      pulse_lead: false,
      deny_grounding_only: true,
    };
  }

  const hints: WikidataDenyHint[] = [];
  let anyCache = false;
  let anyLive = false;
  let soft = false;
  let softReason: string | undefined;
  const seedsTried: string[] = [];

  for (const seed of picked) {
    seedsTried.push(seed.seed);
    const query = pickQueryForSeed(seed, now);

    // Fixture path (tests)
    const fix = opts.fixturesBySeed?.[seed.seed] ?? opts.fixturesBySeed?.[seedSlug(seed.seed)];
    if (fix != null) {
      const body =
        typeof fix === "string"
          ? (JSON.parse(fix) as WikidataSearchResponse)
          : fix;
      hints.push(filterSearchHits(seed, body));
      continue;
    }

    const cached = readCache(cacheDir, seed.seed, now);
    if (cached) {
      anyCache = true;
      hints.push(filterSearchHits(seed, cached.body));
      continue;
    }

    await rateWait(minInterval, Date.now());
    const url = buildWbSearchUrl(query);
    let got: Awaited<ReturnType<typeof getSearchJson>>;
    try {
      got = await getSearchJson(url, fetchImpl);
    } catch (err) {
      soft = true;
      softReason = String(err);
      hints.push(softHint(seed.seed, softReason));
      continue;
    }

    if (!got.ok) {
      soft = true;
      softReason = `HTTP ${got.status}`;
      hints.push(softHint(seed.seed, softReason));
      continue;
    }

    anyLive = true;
    writeCache(cacheDir, seed.seed, query, got.body, now);
    hints.push(filterSearchHits(seed, got.body));
  }

  const allSoft = hints.length > 0 && hints.every((h) => h.status === "soft_fail");
  return {
    hints,
    ok: !allSoft && hints.length > 0,
    soft_fail: soft || allSoft,
    soft_fail_reason: softReason,
    from_cache: anyCache && !anyLive,
    searches: searchesThisTick,
    seeds_tried: seedsTried,
    brief: false,
    pulse_lead: false,
    deny_grounding_only: true,
  };
}
