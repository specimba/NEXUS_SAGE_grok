/**
 * GitHub unauth search → toolkit shelf only (FREE-PULSE P4 tighten).
 * GET https://api.github.com/search/repositories — zero credentials.
 * Soft-fail 403/429 / remaining=0 · ≤1 search per ingest tick · 24h cache-first.
 * Rate remaining stamped under github-cache/_rate-limit.json (1h window).
 * Never Brief · never Pulse lead · cycle stays 003 · lead hf-incident · no 004.
 * Spec: refs/WIRE-GITHUB-TIGHTEN-P4.md · baseline refs/WIRE-GITHUB-SHELF.md.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyUrl, scoreUrlList, type ScoredUrl } from "./ingest/shelf";

export const GITHUB_SEARCH_API = "https://api.github.com/search/repositories";
export const GITHUB_UA =
  "NEXUS-SAGE-desk/0.2 (free-ingest; github-shelf)";
export const GITHUB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const GITHUB_PER_PAGE = 5;
/** Unauth search budget resets ~hourly — remaining=0 skip only within this window. */
export const GITHUB_RATE_WINDOW_MS = 60 * 60 * 1000;
/** Persisted last X-RateLimit-Remaining under cache dir (cross-tick preflight). */
export const GITHUB_RATE_STAMP_FILE = "_rate-limit.json";

/** Curated rotation — not incident-noun standing search. ≤1 pick per tick. */
export const GITHUB_SHELF_QUERIES = [
  "LLM agent eval harness",
  "OWASP LLM",
  "agent sandbox escape",
  "LLM red team toolkit",
] as const;

export type GithubRepoItem = {
  full_name?: string | null;
  html_url?: string | null;
  description?: string | null;
  stargazers_count?: number | null;
  updated_at?: string | null;
  homepage?: string | null;
};

export type GithubSearchResponse = {
  total_count?: number;
  incomplete_results?: boolean;
  items?: GithubRepoItem[];
  message?: string;
};

export type GithubShelfHit = {
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  updated_at: string;
  homepage?: string;
  source: "github-search";
  shelfOnly: true;
  briefEligible: false;
  pulseLeadEligible: false;
};

export type GithubShelfItem = {
  href: string;
  label: string;
  reason: "github-search-shelf" | "toolkit-github" | "toolkit";
};

export type FetchGithubResult = {
  hits: GithubShelfHit[];
  shelf: GithubShelfItem[];
  scored: ScoredUrl[];
  query: string;
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  from_cache: boolean;
  brief: false;
  pulse_lead: false;
  searches: number;
  /** Last known search remaining (scarce ≤10/h) — null if unknown. */
  rate_limit_remaining: number | null;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/github-cache",
);

/** Last known search remaining from response headers (scarce 10/hr). */
let lastSearchRemaining: number | null = null;
/** Enforce ≤1 network search per ingest tick / process run. */
let searchesThisTick = 0;

export function resetGithubShelfTickState() {
  searchesThisTick = 0;
}

export function getLastSearchRemaining(): number | null {
  return lastSearchRemaining;
}

export function setLastSearchRemaining(n: number | null) {
  lastSearchRemaining = n;
}

type GithubRateStamp = {
  stamped_at?: string;
  search_remaining?: number | null;
  resource?: string;
};

function rateStampPath(cacheDir: string): string {
  return resolve(cacheDir, GITHUB_RATE_STAMP_FILE);
}

/** Load remaining from last response stamp if still inside the 1h search window. */
export function loadRateRemaining(
  cacheDir: string,
  now = Date.now(),
): number | null {
  const p = rateStampPath(cacheDir);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as GithubRateStamp;
    const t = raw.stamped_at ? Date.parse(raw.stamped_at) : NaN;
    if (!Number.isFinite(t) || now - t > GITHUB_RATE_WINDOW_MS) return null;
    const n = raw.search_remaining;
    if (n == null || !Number.isFinite(Number(n))) return null;
    return Number(n);
  } catch {
    return null;
  }
}

/** Persist remaining so next ingest tick can preflight without a storm. */
export function writeRateRemaining(
  cacheDir: string,
  remaining: number | null,
  now = Date.now(),
) {
  if (remaining == null || !Number.isFinite(remaining)) return;
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    rateStampPath(cacheDir),
    `${JSON.stringify(
      {
        stamped_at: iso,
        search_remaining: remaining,
        resource: "search",
      },
      null,
      2,
    )}\n`,
  );
  lastSearchRemaining = remaining;
}

export function queryHash(query: string): string {
  return createHash("sha256")
    .update(query.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

export function resolveGithubCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/github-cache");
  return DEFAULT_CACHE_DIR;
}

/** Rotate one curated query per day-bucket (≤1 search intent per tick). */
export function pickGithubQuery(
  now = Date.now(),
  queries: readonly string[] = GITHUB_SHELF_QUERIES,
): string {
  const list = queries.length ? queries : GITHUB_SHELF_QUERIES;
  const day = Math.floor(now / 86_400_000);
  return list[day % list.length]!;
}

function cachePath(cacheDir: string, query: string): string {
  return resolve(cacheDir, `${queryHash(query)}.json`);
}

function readCache(
  cacheDir: string,
  query: string,
  now = Date.now(),
): GithubSearchResponse | null {
  const p = cachePath(cacheDir, query);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      cached_at?: string;
      body?: GithubSearchResponse;
    };
    const t = raw.cached_at ? Date.parse(raw.cached_at) : NaN;
    if (!Number.isFinite(t) || now - t > GITHUB_CACHE_TTL_MS) return null;
    return raw.body ?? null;
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  query: string,
  body: GithubSearchResponse,
  now = Date.now(),
) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    cachePath(cacheDir, query),
    `${JSON.stringify({ cached_at: iso, query, body }, null, 2)}\n`,
  );
}

/** Parse API items → locked GithubShelfHit (always shelfOnly / never Brief/Pulse lead). */
export function toGithubHits(
  payload: GithubSearchResponse | GithubRepoItem[] | null | undefined,
): GithubShelfHit[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload!.items!
      : [];
  const out: GithubShelfHit[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const full_name = String(it?.full_name ?? "").trim();
    const html_url = String(it?.html_url ?? "").trim();
    if (!full_name || !html_url) continue;
    if (!/^https:\/\/github\.com\//i.test(html_url)) continue;
    if (seen.has(html_url)) continue;
    seen.add(html_url);
    const homepage = String(it?.homepage ?? "").trim();
    out.push({
      full_name,
      html_url,
      description: String(it?.description ?? ""),
      stargazers_count: Math.max(0, Number(it?.stargazers_count) || 0),
      updated_at: String(it?.updated_at ?? ""),
      ...(homepage ? { homepage } : {}),
      source: "github-search",
      shelfOnly: true,
      briefEligible: false,
      pulseLeadEligible: false,
    });
  }
  return out;
}

/** Hard gate — GitHub search alone never Brief. */
export function isGithubBriefEligible(_hit?: GithubShelfHit): false {
  void _hit;
  return false;
}

/** Hard gate — never Pulse lead. */
export function isGithubPulseLeadEligible(_hit?: GithubShelfHit): false {
  void _hit;
  return false;
}

/**
 * Map hits → shelf via classifyUrl / scoreUrlList.
 * Only lane === "shelf" survives (classifier decides shelf vs drop).
 * Homepage URLs also scored when present.
 */
export function toShelfUrls(hits: GithubShelfHit[]): GithubShelfItem[] {
  const urls: string[] = [];
  const labelByHref = new Map<string, string>();
  for (const h of hits) {
    if (!h.shelfOnly || h.briefEligible !== false || h.pulseLeadEligible !== false) {
      continue;
    }
    urls.push(h.html_url);
    labelByHref.set(h.html_url, h.full_name.slice(0, 72));
    if (h.homepage && /^https?:\/\//i.test(h.homepage)) {
      urls.push(h.homepage);
      try {
        const host = new URL(h.homepage).hostname.replace(/^www\./, "");
        labelByHref.set(h.homepage, host.slice(0, 72));
      } catch {
        labelByHref.set(h.homepage, h.homepage.slice(0, 72));
      }
    }
  }

  const scored = scoreUrlList(urls);
  return scored.shelf.map((s) => {
    const reason: GithubShelfItem["reason"] =
      s.reason === "toolkit-github"
        ? "toolkit-github"
        : s.reason === "toolkit"
          ? "toolkit"
          : "github-search-shelf";
    return {
      href: s.href,
      label: labelByHref.get(s.href) ?? s.href.replace(/^https?:\/\//, "").slice(0, 72),
      reason,
    };
  });
}

/** Collect raw scored lanes for diagnostics (shelf only path uses toShelfUrls). */
export function scoreGithubHitUrls(hits: GithubShelfHit[]): ReturnType<typeof scoreUrlList> {
  const urls: string[] = [];
  for (const h of hits) {
    urls.push(h.html_url);
    if (h.homepage) urls.push(h.homepage);
  }
  return scoreUrlList(urls);
}

export type FetchGithubOpts = {
  cacheDir?: string;
  query?: string;
  /** Inject search JSON (tests / offline). Skips network. */
  fixtureJson?: GithubSearchResponse | string;
  now?: number;
  /** Test: force soft-fail without network. */
  forceSoftFail?: 403 | 429;
  /** Optional fetch override (tests). Never sends Authorization. */
  fetchImpl?: typeof fetch;
  /** Allow >1 search in tests only — production always 1. */
  allowMultiSearch?: boolean;
};

function softFailResult(
  query: string,
  reason: string,
  from_cache = false,
): FetchGithubResult {
  return {
    hits: [],
    shelf: [],
    scored: [],
    query,
    ok: false,
    soft_fail: true,
    soft_fail_reason: reason,
    from_cache,
    brief: false,
    pulse_lead: false,
    searches: searchesThisTick,
    rate_limit_remaining: lastSearchRemaining,
  };
}

async function getSearchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<
  | { ok: true; body: GithubSearchResponse; remaining: number | null }
  | { ok: false; status: number; remaining: number | null }
> {
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": GITHUB_UA,
      // Zero credentials — never Authorization (even if GITHUB_TOKEN present)
    },
  });
  const remRaw = res.headers.get("X-RateLimit-Remaining");
  const remaining =
    remRaw != null && remRaw !== "" && Number.isFinite(Number(remRaw))
      ? Number(remRaw)
      : null;
  if (remaining != null) lastSearchRemaining = remaining;

  if (res.status === 403 || res.status === 429) {
    try {
      await res.text();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, remaining };
  }
  if (!res.ok) {
    try {
      await res.text();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, remaining };
  }
  let body: GithubSearchResponse;
  try {
    body = (await res.json()) as GithubSearchResponse;
  } catch {
    return { ok: false, status: res.status || -1, remaining };
  }
  if (!body || typeof body !== "object") {
    return { ok: false, status: res.status || -1, remaining };
  }
  return { ok: true, body, remaining };
}

/**
 * One curated search → shelf URLs via classifyUrl (FREE-PULSE P4).
 * Cache-first (24h) · soft-fail 403/429/empty · remaining=0 preflight from stamp · ≤1 network search/tick.
 */
export async function searchRepos(
  opts: FetchGithubOpts = {},
): Promise<FetchGithubResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const now = opts.now ?? Date.now();
  const query = (opts.query ?? pickGithubQuery(now)).trim();
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (opts.forceSoftFail) {
    console.log(
      `GitHub shelf: soft-fail HTTP ${opts.forceSoftFail} (forced) — skip`,
    );
    return softFailResult(query, `HTTP ${opts.forceSoftFail}`);
  }

  if (opts.fixtureJson) {
    const payload =
      typeof opts.fixtureJson === "string"
        ? (JSON.parse(opts.fixtureJson) as GithubSearchResponse)
        : opts.fixtureJson;
    const hits = toGithubHits(payload);
    const shelf = toShelfUrls(hits);
    const scored = scoreGithubHitUrls(hits).shelf;
    return {
      hits,
      shelf,
      scored,
      query,
      ok: true,
      soft_fail: false,
      from_cache: false,
      brief: false,
      pulse_lead: false,
      searches: 0,
      rate_limit_remaining: lastSearchRemaining,
    };
  }

  // Prefer 24h cache over network (count as success · searches stay 0)
  const cached = readCache(cacheDir, query, now);
  if (cached) {
    const hits = toGithubHits(cached);
    const shelf = toShelfUrls(hits);
    // Hydrate in-memory remaining from stamp without requiring a call
    const stampedRem = loadRateRemaining(cacheDir, now);
    if (stampedRem != null) lastSearchRemaining = stampedRem;
    console.log(
      `GitHub shelf: cache hit query="${query}" → ${hits.length} hits / ${shelf.length} shelf`,
    );
    return {
      hits,
      shelf,
      scored: scoreGithubHitUrls(hits).shelf,
      query,
      ok: true,
      soft_fail: false,
      from_cache: true,
      brief: false,
      pulse_lead: false,
      searches: 0,
      rate_limit_remaining: lastSearchRemaining,
    };
  }

  // Preflight: last response stamp remaining=0 within 1h window → soft_fail, no call
  const stampedRem = loadRateRemaining(cacheDir, now);
  if (stampedRem != null) lastSearchRemaining = stampedRem;
  if (lastSearchRemaining === 0) {
    console.log(
      "GitHub shelf: X-RateLimit-Remaining=0 — soft-fail skip (no call)",
    );
    return softFailResult(query, "rate_limit_remaining=0");
  }

  if (!opts.allowMultiSearch && searchesThisTick >= 1) {
    console.log(
      "GitHub shelf: ≤1 search/ingest already used — soft-fail skip",
    );
    return softFailResult(query, "search_budget_exhausted");
  }

  const url =
    `${GITHUB_SEARCH_API}?q=${encodeURIComponent(query)}` +
    `&sort=updated&order=desc&per_page=${GITHUB_PER_PAGE}`;

  searchesThisTick += 1;
  try {
    const res = await getSearchJson(url, fetchImpl);
    if (res.remaining != null) {
      writeRateRemaining(cacheDir, res.remaining, now);
    }
    if (!res.ok) {
      const reason =
        res.status === 403 || res.status === 429
          ? `HTTP ${res.status}`
          : res.status
            ? `HTTP ${res.status}`
            : "missing body";
      console.log(`GitHub shelf: soft-fail ${reason} — skip`);
      return softFailResult(query, reason);
    }
    if (!res.body || !Array.isArray(res.body.items)) {
      console.log("GitHub shelf: soft-fail missing body — skip");
      return softFailResult(query, "missing body");
    }
    writeCache(cacheDir, query, res.body, now);
    const hits = toGithubHits(res.body);
    const shelf = toShelfUrls(hits);
    console.log(
      `GitHub shelf: live query="${query}" → ${hits.length} hits / ${shelf.length} shelf (remaining=${res.remaining ?? "?"})`,
    );
    return {
      hits,
      shelf,
      scored: scoreGithubHitUrls(hits).shelf,
      query,
      ok: true,
      soft_fail: false,
      from_cache: false,
      brief: false,
      pulse_lead: false,
      searches: searchesThisTick,
      rate_limit_remaining: lastSearchRemaining,
    };
  } catch (err) {
    console.log(`GitHub shelf: soft-fail network — ${String(err)}`);
    return softFailResult(query, `network: ${String(err)}`);
  }
}

/** Alias used by ingest — same as searchRepos. */
export const fetchGithubShelf = searchRepos;

/** Build shelf rows for data/shelf.ts merge. */
export function toGithubShelfItems(
  items: GithubShelfItem[],
): { href: string; label: string; reason: "github-search-shelf" }[] {
  return items.map((i) => ({
    href: i.href,
    label: i.label,
    reason: "github-search-shelf" as const,
  }));
}

/** Confirm no Authorization would be set (zero-cred lock). */
export function githubHeadersUnauth(): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_UA,
  };
}

/** Diagnostics: classify one URL the way ingest will. */
export function classifyGithubUrl(href: string): ScoredUrl {
  return classifyUrl(href);
}
