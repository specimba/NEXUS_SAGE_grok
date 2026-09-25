/**
 * OpenAlex Papers enrichment — free/public only.
 * GET https://api.openalex.org/works — Papers metadata (id/year/DOI) only.
 * Soft-fail 429/5xx/parse · ≤1 search/tick · 24h cache.
 * 429 = daily budget spent (unauth budget is per IP, resets 00:00 UTC; Retry-After was 40965s
 * on 2026-09-25) → NO retries: record paused_until (Retry-After, else next midnight UTC) in
 * artifacts/sage/source-state.json and skip OpenAlex entirely until then. 3 consecutive failures
 * → pause ≥24h. Optional OPENALEX_API_KEY → `Authorization: Bearer …` (never logged/written).
 * Never Brief · never Pulse lead · never displace HF agent keeps · cycle stays 003.
 * Spec: refs/WIRE-OPENALEX-BACKOFF.md · refs/WIRE-OPENALEX.md (Fox-IT deferred).
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAgentPaper, type Paper } from "./ingest/papers";
import {
  activePause,
  readSourceState,
  recordSourceOutcome,
  writeSourceState,
  type AuthMode,
  type SourceRunStatus,
} from "./source-state";

export const OPENALEX_API = "https://api.openalex.org/works";
export const OPENALEX_UA =
  "NEXUS-SAGE-desk/0.2 (free-ingest; openalex; mailto:local@nexus-sage.invalid)";
export const OPENALEX_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const OPENALEX_PER_PAGE = 5;
export const OPENALEX_SELECT =
  "id,display_name,title,publication_year,doi,primary_location,authorships";

/** Source id in artifacts/sage/source-state.json. */
export const OPENALEX_SOURCE_ID = "openalex";
/** Env var holding the optional free OpenAlex API key (10× the keyless budget). */
export const OPENALEX_API_KEY_ENV = "OPENALEX_API_KEY";
/** Cap for parseRetryAfterMs (display helper only — 429 never sleeps/retries now). */
export const OPENALEX_RETRY_AFTER_CAP_MS = 30_000;

/** Rotating fallback when no DOI/arXiv filter can be built. Cap 5 via per_page. */
export const OPENALEX_FALLBACK_QUERIES = [
  "Hugging Face agent",
  "LLM agent",
  "LLM agent sandbox",
] as const;

export type OpenAlexEnrichment = {
  id: string;
  title: string;
  year: number | null;
  doi: string | null;
  source: "openalex";
  papersEnrichOnly: true;
  shelfOnly: false;
  briefEligible: false;
  pulseLeadEligible: false;
  displaceHfKeep: false;
  /** Derived from DOI / landing page when present. */
  arxivId?: string | null;
  landingPageUrl?: string | null;
};

export type OpenAlexWorkRaw = {
  id?: string | null;
  /** OpenAlex returns display_name even when select asks for title. */
  display_name?: string | null;
  title?: string | null;
  publication_year?: number | null;
  doi?: string | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    is_oa?: boolean | null;
    source?: { display_name?: string | null } | null;
  } | null;
  authorships?: unknown;
};

export type OpenAlexSearchResponse = {
  meta?: Record<string, unknown>;
  results?: OpenAlexWorkRaw[];
  error?: string;
  message?: string;
};

export type FetchOpenAlexResult = {
  enrichments: OpenAlexEnrichment[];
  query: string;
  mode: "filter" | "search" | "fixture" | "soft_fail";
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  from_cache: boolean;
  brief: false;
  pulse_lead: false;
  searches: number;
  /** Always 0 — 429 pauses instead of retrying (kept for ingest-last.json schema). */
  retries: number;
  /** ok = data (network or cache) · fail = soft-fail · paused = skipped, no request made. */
  status: SourceRunStatus;
  /** ISO UTC — set while paused, or when this run's failure started a pause. */
  paused_until: string | null;
  pause_reason: string | null;
  /** Network requests made this call (0 when paused / cache / fixture). */
  requests: number;
  /** "key" when OPENALEX_API_KEY is set (the key itself is never exposed). */
  auth: AuthMode;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/openalex-cache",
);

/** Enforce ≤1 network search/filter per ingest tick. */
let searchesThisTick = 0;

export function resetOpenAlexTickState() {
  searchesThisTick = 0;
}

export function getOpenAlexSearchesThisTick(): number {
  return searchesThisTick;
}

export function queryHash(query: string): string {
  return createHash("sha256")
    .update(query.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

export function resolveOpenAlexCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/openalex-cache");
  return DEFAULT_CACHE_DIR;
}

/** Normalize DOI → bare lowercase `10.xxxx/...` or null. */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  s = s.replace(/^doi:\s*/i, "");
  s = s.trim().toLowerCase();
  if (!/^10\.\d{4,9}\/\S+$/i.test(s)) return null;
  return s;
}

/** Pull arXiv id from DOI (`10.48550/arxiv.YYMM.NNNNN`) or URL. */
export function arxivIdFromDoiOrUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const doi = normalizeDoi(s);
  if (doi) {
    const m = doi.match(/^10\.48550\/arxiv\.(.+)$/i);
    if (m) return m[1]!.replace(/v\d+$/i, "");
  }
  const fromUrl = s.match(
    /arxiv\.org\/(?:abs|pdf)\/([a-zA-Z0-9.\-/]+?)(?:v\d+)?(?:\.pdf)?$/i,
  );
  if (fromUrl) {
    const id = fromUrl[1]!.replace(/v\d+$/i, "");
    if (/^\d{4}\.\d{4,5}$/.test(id) || /^[a-z-]+\/\d{7}$/i.test(id)) return id;
  }
  // bare arXiv id
  const bare = s.replace(/^arxiv:/i, "").replace(/v\d+$/i, "").trim();
  if (/^\d{4}\.\d{4,5}$/.test(bare) || /^[a-z-]+\/\d{7}$/i.test(bare)) {
    return bare;
  }
  return null;
}

export function normalizeOpenAlexId(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const m = s.match(/(?:openalex\.org\/)?(W\d+)\s*$/i);
  if (m) return `https://openalex.org/${m[1]!.toUpperCase()}`;
  if (/^https:\/\/openalex\.org\/W\d+$/i.test(s)) return s;
  return null;
}

/** Rotate one fallback search per day-bucket. */
export function pickOpenAlexFallbackQuery(
  now = Date.now(),
  queries: readonly string[] = OPENALEX_FALLBACK_QUERIES,
): string {
  const list = queries.length ? queries : OPENALEX_FALLBACK_QUERIES;
  const day = Math.floor(now / 86_400_000);
  return list[day % list.length]!;
}

function cachePath(cacheDir: string, key: string): string {
  return resolve(cacheDir, `${queryHash(key)}.json`);
}

function readCache(
  cacheDir: string,
  key: string,
  now = Date.now(),
): OpenAlexSearchResponse | null {
  const p = cachePath(cacheDir, key);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      cached_at?: string;
      body?: OpenAlexSearchResponse;
    };
    const t = raw.cached_at ? Date.parse(raw.cached_at) : NaN;
    if (!Number.isFinite(t) || now - t > OPENALEX_CACHE_TTL_MS) return null;
    return raw.body ?? null;
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  key: string,
  body: OpenAlexSearchResponse,
  now = Date.now(),
) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    cachePath(cacheDir, key),
    `${JSON.stringify({ cached_at: iso, key, body }, null, 2)}\n`,
  );
}

/** Map API results → locked OpenAlexEnrichment schema. */
export function parseOpenAlexWorks(
  payload: OpenAlexSearchResponse | OpenAlexWorkRaw[] | null | undefined,
): OpenAlexEnrichment[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload!.results!
      : [];
  const out: OpenAlexEnrichment[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const id = normalizeOpenAlexId(it?.id ?? null);
    if (!id || seen.has(id)) continue;
    // Scout: API returns display_name (not title) even when select=title — map display_name → title
    const title = String(it?.display_name ?? it?.title ?? "").trim();
    if (!title) continue;
    seen.add(id);
    const doiRaw = it?.doi ? String(it.doi) : null;
    const doiNorm = normalizeDoi(doiRaw);
    const landing = it?.primary_location?.landing_page_url
      ? String(it.primary_location.landing_page_url)
      : null;
    const arxivId =
      arxivIdFromDoiOrUrl(doiRaw) ?? arxivIdFromDoiOrUrl(landing);
    const yearRaw = it?.publication_year;
    const year =
      typeof yearRaw === "number" && Number.isFinite(yearRaw)
        ? yearRaw
        : yearRaw != null && Number.isFinite(Number(yearRaw))
          ? Number(yearRaw)
          : null;
    out.push({
      id,
      title,
      year,
      doi: doiNorm ? `https://doi.org/${doiNorm}` : doiRaw,
      source: "openalex",
      papersEnrichOnly: true,
      shelfOnly: false,
      briefEligible: false,
      pulseLeadEligible: false,
      displaceHfKeep: false,
      arxivId: arxivId ?? null,
      landingPageUrl: landing,
    });
  }
  return out;
}

/** Hard gate — OpenAlex never Brief. */
export function isOpenAlexBriefEligible(
  _item?: OpenAlexEnrichment,
): false {
  void _item;
  return false;
}

/** Hard gate — never Pulse lead. */
export function isOpenAlexPulseLeadEligible(
  _item?: OpenAlexEnrichment,
): false {
  void _item;
  return false;
}

function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loose title overlap for fuzzy match (shared significant tokens). */
export function fuzzyTitleMatch(a: string, b: string): boolean {
  const ka = titleKey(a);
  const kb = titleKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.includes(kb) || kb.includes(ka)) return true;
  const stop = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "of",
    "in",
    "on",
    "for",
    "with",
    "to",
    "its",
    "are",
    "is",
    "by",
  ]);
  const ta = ka.split(" ").filter((t) => t.length > 2 && !stop.has(t));
  const tb = new Set(kb.split(" ").filter((t) => t.length > 2 && !stop.has(t)));
  if (ta.length < 2 || tb.size < 2) return false;
  const hit = ta.filter((t) => tb.has(t)).length;
  const need = Math.min(3, Math.ceil(Math.min(ta.length, tb.size) * 0.6));
  return hit >= need;
}

export function matchEnrichmentToPaper(
  paper: Pick<Paper, "id" | "title" | "href" | "doi" | "openalexId">,
  e: OpenAlexEnrichment,
): boolean {
  if (paper.openalexId && normalizeOpenAlexId(paper.openalexId) === e.id) {
    return true;
  }
  const paperDoi = normalizeDoi(paper.doi ?? null);
  const enrichDoi = normalizeDoi(e.doi);
  if (paperDoi && enrichDoi && paperDoi === enrichDoi) return true;

  const paperArxiv =
    arxivIdFromDoiOrUrl(paper.id) ??
    arxivIdFromDoiOrUrl(paper.href) ??
    arxivIdFromDoiOrUrl(paper.doi ?? null);
  if (paperArxiv && e.arxivId && paperArxiv === e.arxivId) return true;
  if (paperArxiv && paper.id === paperArxiv && e.arxivId === paperArxiv) {
    return true;
  }

  if (fuzzyTitleMatch(paper.title, e.title)) return true;
  return false;
}

/**
 * Attach OpenAlex id/year/doi onto existing Papers by DOI/arXiv/title match.
 * Unmatched enrichments may become secondary enrich-only rows — never displace
 * HF agent keeps (same gen/sim protection class as mergeDailyPapers).
 */
export function mergeOntoPapers(
  papers: Paper[],
  enrichments: OpenAlexEnrichment[],
  opts: { limit?: number; allowSecondary?: boolean } = {},
): Paper[] {
  const limit = Math.max(1, opts.limit ?? Math.max(papers.length, 8));
  const allowSecondary = opts.allowSecondary !== false;
  const used = new Set<string>();

  const out: Paper[] = papers.map((p) => {
    const e = enrichments.find(
      (x) => !used.has(x.id) && matchEnrichmentToPaper(p, x),
    );
    if (!e) return p;
    used.add(e.id);
    return {
      ...p,
      title: p.title || e.title,
      doi: e.doi ?? p.doi,
      year: e.year ?? p.year ?? null,
      openalexId: e.id,
      // existing HF / arXiv rows stay non-secondary
      openalexEnrichOnly: p.openalexEnrichOnly ?? false,
    };
  });

  if (!allowSecondary) return out;

  const agentIds = new Set(
    out.filter((p) => isAgentPaper(p)).map((p) => p.id),
  );

  for (const e of enrichments) {
    if (used.has(e.id)) continue;
    if (!e.papersEnrichOnly) continue;
    if (e.displaceHfKeep !== false) continue;
    if (e.briefEligible !== false || e.pulseLeadEligible !== false) continue;

    const shortId =
      normalizeOpenAlexId(e.id)?.replace(/^https:\/\/openalex\.org\//i, "") ??
      e.id;
    if (out.some((p) => p.id === shortId || p.openalexId === e.id)) continue;

    const secondary: Paper = {
      id: shortId,
      title: e.title,
      up: 0,
      href: e.doi || e.landingPageUrl || e.id,
      doi: e.doi,
      year: e.year,
      openalexId: e.id,
      openalexEnrichOnly: true,
    };

    if (out.length < limit) {
      out.push(secondary);
      used.add(e.id);
      continue;
    }

    // At capacity: never displace HF keeps or earlier (higher-ranked) enrich-only rows.
    // Skip remaining search hits — ≤limit preserved.
    continue;
  }

  // Final slice that never drops agent keeps
  if (out.length <= limit) return out;
  const agents = out.filter((p) => agentIds.has(p.id) || isAgentPaper(p));
  const rest = out.filter((p) => !agentIds.has(p.id) && !isAgentPaper(p));
  const keptAgents = [...agents];
  const room = Math.max(limit - keptAgents.length, 0);
  return [...keptAgents, ...rest.slice(0, room)].slice(0, Math.max(limit, keptAgents.length));
}

export type FetchOpenAlexOpts = {
  cacheDir?: string;
  /** Existing papers — preferred DOI/arXiv filter source. */
  papers?: Paper[];
  /** Explicit search string (tests / override). */
  query?: string;
  /** Force filter mode key (tests). */
  filterKey?: string;
  perPage?: number;
  now?: number;
  /** Inject search JSON (tests / offline). Skips network. */
  fixtureJson?: OpenAlexSearchResponse | string;
  /** Test: force soft-fail without network. */
  forceSoftFail?: 429 | 500 | 503;
  /** Optional fetch override (tests). Sends Bearer only when OPENALEX_API_KEY is set. */
  fetchImpl?: typeof fetch;
  /** Allow >1 search in tests only — production always 1. */
  allowMultiSearch?: boolean;
  /** Pause-state JSON (artifacts/sage/source-state.json). Omit → pause rule computed, not persisted. */
  statePath?: string;
};

/** Read the optional key at call time. Never log / return / persist it. */
function openAlexApiKey(): string | null {
  const k = process.env[OPENALEX_API_KEY_ENV];
  return typeof k === "string" && k.trim() ? k.trim() : null;
}

/** Scrub the key from any string that may reach logs or ingest-last.json. */
export function redactOpenAlexKey(text: string, key: string | null = openAlexApiKey()): string {
  if (!key) return text;
  return text.split(key).join("[redacted]");
}

type Extra = Partial<Pick<FetchOpenAlexResult, "status" | "paused_until" | "pause_reason" | "requests" | "auth">>;

function softFailResult(
  query: string,
  reason: string,
  mode: FetchOpenAlexResult["mode"] = "soft_fail",
  extra: Extra = {},
): FetchOpenAlexResult {
  return {
    enrichments: [],
    query,
    mode,
    ok: false,
    soft_fail: true,
    soft_fail_reason: redactOpenAlexKey(reason),
    from_cache: false,
    brief: false,
    pulse_lead: false,
    searches: searchesThisTick,
    retries: 0,
    status: "fail",
    paused_until: null,
    pause_reason: null,
    requests: 0,
    auth: openAlexApiKey() ? "key" : "anon",
    ...extra,
  };
}

function okResult(
  enrichments: OpenAlexEnrichment[],
  query: string,
  mode: FetchOpenAlexResult["mode"],
  from_cache: boolean,
  extra: Extra = {},
): FetchOpenAlexResult {
  return {
    enrichments,
    query,
    mode,
    ok: true,
    soft_fail: false,
    from_cache,
    brief: false,
    pulse_lead: false,
    searches: searchesThisTick,
    retries: 0,
    status: "ok",
    paused_until: null,
    pause_reason: null,
    requests: 0,
    auth: openAlexApiKey() ? "key" : "anon",
    ...extra,
  };
}

/** Parse Retry-After (delta-seconds or HTTP-date) → ms, capped. */
export function parseRetryAfterMs(
  header: string | null | undefined,
  now = Date.now(),
  capMs = OPENALEX_RETRY_AFTER_CAP_MS,
): number | null {
  if (header == null) return null;
  const raw = String(header).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const sec = Number(raw);
    if (!Number.isFinite(sec) || sec < 0) return null;
    return Math.min(Math.round(sec * 1000), capMs);
  }
  const when = Date.parse(raw);
  if (!Number.isFinite(when)) return null;
  const delta = when - now;
  if (delta <= 0) return 0;
  return Math.min(delta, capMs);
}

/**
 * Prefer filter by known arXiv/DOI ids on Papers; else one rotating search.
 * Returns cache key + URL builder mode.
 */
export function buildOpenAlexRequest(
  opts: {
    papers?: Paper[];
    query?: string;
    filterKey?: string;
    perPage?: number;
    now?: number;
  } = {},
): { cacheKey: string; url: string; mode: "filter" | "search"; query: string } {
  const perPage = Math.min(
    OPENALEX_PER_PAGE,
    Math.max(1, opts.perPage ?? OPENALEX_PER_PAGE),
  );
  const select = encodeURIComponent(OPENALEX_SELECT);

  if (opts.filterKey) {
    const filter = opts.filterKey;
    return {
      cacheKey: `filter:${filter}`,
      url: `${OPENALEX_API}?filter=${encodeURIComponent(filter)}&per_page=${perPage}&select=${select}`,
      mode: "filter",
      query: filter,
    };
  }

  if (opts.query) {
    const q = opts.query.trim();
    return {
      cacheKey: `search:${q}`,
      url: `${OPENALEX_API}?search=${encodeURIComponent(q)}&per_page=${perPage}&select=${select}`,
      mode: "search",
      query: q,
    };
  }

  // Preferred: DOI / arXiv ids already on Papers (Scout: filter=doi:10.48550/arxiv.… bare form)
  // OpenAlex OR is values on ONE attribute: doi:A|B|C — not doi:A|doi:B (400 otherwise).
  const papers = opts.papers ?? [];
  const explicitDois: string[] = [];
  const derivedDois: string[] = [];
  const seen = new Set<string>();
  for (const p of papers) {
    const doi = normalizeDoi(p.doi ?? null);
    if (doi && !seen.has(doi)) {
      seen.add(doi);
      explicitDois.push(doi);
    }
    const arxiv =
      arxivIdFromDoiOrUrl(p.id) ?? arxivIdFromDoiOrUrl(p.href) ?? null;
    if (arxiv) {
      const arxivDoi = `10.48550/arxiv.${arxiv}`.toLowerCase();
      if (!seen.has(arxivDoi)) {
        seen.add(arxivDoi);
        derivedDois.push(arxivDoi);
      }
    }
  }

  // Prefer explicit DOIs; include derived arxiv DOIs when we have at least one explicit
  // (brand-new arXiv-only HF rows often aren't in OpenAlex yet — use fallback search).
  const doiValues =
    explicitDois.length > 0
      ? [...explicitDois, ...derivedDois].slice(0, 5)
      : [];

  if (doiValues.length > 0) {
    const filter = `doi:${doiValues.join("|")}`;
    return {
      cacheKey: `filter:${filter}`,
      url: `${OPENALEX_API}?filter=${encodeURIComponent(filter)}&per_page=${perPage}&select=${select}`,
      mode: "filter",
      query: filter,
    };
  }

  const q = pickOpenAlexFallbackQuery(opts.now);
  return {
    cacheKey: `search:${q}`,
    url: `${OPENALEX_API}?search=${encodeURIComponent(q)}&per_page=${perPage}&select=${select}`,
    mode: "search",
    query: q,
  };
}

async function getWorksJson(
  url: string,
  fetchImpl: typeof fetch,
  apiKey: string | null,
): Promise<
  | { ok: true; body: OpenAlexSearchResponse }
  | { ok: false; status: number; parse_error?: boolean; retryAfter?: string | null }
> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": OPENALEX_UA,
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetchImpl(url, { method: "GET", headers });
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      retryAfter: res.status === 429 ? (res.headers?.get?.("Retry-After") ?? null) : null,
    };
  }
  try {
    const body = (await res.json()) as OpenAlexSearchResponse;
    return { ok: true, body };
  } catch {
    return { ok: false, status: res.status, parse_error: true };
  }
}

/**
 * Fetch OpenAlex enrichments — ≤1 network request per tick; 24h disk cache.
 * Paused (source-state.json) → return immediately: no request, no retry.
 * Any 429 → no retry; pause until Retry-After (else next 00:00 UTC). 3 consecutive failures →
 * pause ≥24h. Soft-fails honestly (ingest continues). Never Brief / never displace HF.
 */
export async function fetchOpenAlexEnrich(
  opts: FetchOpenAlexOpts = {},
): Promise<FetchOpenAlexResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const apiKey = openAlexApiKey();
  const auth: AuthMode = apiKey ? "key" : "anon";
  const log = (msg: string) => console.log(redactOpenAlexKey(msg, apiKey));

  if (opts.forceSoftFail) {
    return softFailResult(
      opts.query ?? "(forced)",
      `HTTP ${opts.forceSoftFail}`,
    );
  }

  if (opts.fixtureJson) {
    const payload =
      typeof opts.fixtureJson === "string"
        ? (JSON.parse(opts.fixtureJson) as OpenAlexSearchResponse)
        : opts.fixtureJson;
    let enrichments: OpenAlexEnrichment[] = [];
    try {
      enrichments = parseOpenAlexWorks(payload);
    } catch (err) {
      return softFailResult("(fixture)", `parse_error:${String(err)}`);
    }
    return okResult(enrichments, "(fixture)", "fixture", false);
  }

  const built = buildOpenAlexRequest({
    papers: opts.papers,
    query: opts.query,
    filterKey: opts.filterKey,
    perPage: opts.perPage,
    now,
  });

  // Pause gate FIRST — skip OpenAlex entirely (no cache read, no request, no retry).
  let state = opts.statePath ? readSourceState(opts.statePath) : null;
  const pause = state ? activePause(state, OPENALEX_SOURCE_ID, now, auth) : null;
  if (pause) {
    log(`OpenAlex: PAUSED until ${pause.until} (${pause.reason ?? "pause"}) — skipped, 0 requests`);
    return softFailResult(built.query, `paused_until ${pause.until}`, built.mode, {
      status: "paused",
      paused_until: pause.until,
      pause_reason: pause.reason,
    });
  }

  const cached = readCache(cacheDir, built.cacheKey, now);
  if (cached) {
    try {
      const enrichments = parseOpenAlexWorks(cached);
      return okResult(enrichments, built.query, built.mode, true);
    } catch {
      // fall through to network
    }
  }

  if (searchesThisTick >= 1 && !opts.allowMultiSearch) {
    return softFailResult(built.query, "search_budget_exhausted", built.mode);
  }

  // One request budget slot for this tick.
  searchesThisTick += 1;

  const persist = (o: Parameters<typeof recordSourceOutcome>[2]) => {
    const base = state ?? { schema: 1 as const, updated_at: null, note: "", sources: {} };
    state = recordSourceOutcome(base, OPENALEX_SOURCE_ID, o, now, auth);
    if (opts.statePath) writeSourceState(opts.statePath, state);
    return state.sources[OPENALEX_SOURCE_ID]!;
  };
  const failWith = (reason: string, status: number | null, retryAfter?: string | null) => {
    const safe = redactOpenAlexKey(reason, apiKey);
    const e = persist({ ok: false, status, reason: safe, retryAfter });
    if (e.paused_until) {
      log(
        `OpenAlex: soft-fail ${safe} — no retry · paused_until=${e.paused_until} (${e.pause_reason}) · streak=${e.consecutive_failures}`,
      );
    } else {
      log(`OpenAlex: soft-fail ${safe} — skip enrich · streak=${e.consecutive_failures}`);
    }
    return softFailResult(built.query, safe, built.mode, {
      requests: 1,
      paused_until: e.paused_until,
      pause_reason: e.pause_reason,
    });
  };

  try {
    const res = await getWorksJson(built.url, fetchImpl, apiKey);
    if (res.ok) {
      let enrichments: OpenAlexEnrichment[] = [];
      try {
        enrichments = parseOpenAlexWorks(res.body);
      } catch (err) {
        return failWith(`parse_error:${String(err)}`, 200);
      }
      writeCache(cacheDir, built.cacheKey, res.body, now);
      persist({ ok: true });
      return okResult(enrichments, built.query, built.mode, false, { requests: 1 });
    }
    const reason = res.parse_error ? "parse_error" : `HTTP ${res.status}`;
    return failWith(reason, res.status, res.retryAfter ?? null);
  } catch (err) {
    return failWith(`fetch failed: ${String(err)}`, null);
  }
}
