/**
 * Crossref Papers DOI enrich — free/public only.
 * Prefer filter=doi: / query.bibliographic — NOT direct /works/{arxiv-doi} (404).
 * Soft-fail 429/5xx/404 · ≤1 call per ingest tick · 24h cache.
 * Never Brief · never Pulse lead · never displace HF agent keeps · cycle stays 003.
 * Spec: refs/WIRE-CROSSREF.md · Scout: refs/SCOUT-CROSSREF-DEEPEN.md
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAgentPaper, type Paper } from "./ingest/papers";
import {
  arxivIdFromDoiOrUrl,
  fuzzyTitleMatch,
  normalizeDoi,
} from "./openalex-enrich";

export const CROSSREF_API = "https://api.crossref.org/works";
export const CROSSREF_UA =
  "NEXUS-SAGE-desk/0.2 (free-ingest; crossref; mailto:local@nexus-sage.invalid)";
export const CROSSREF_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CROSSREF_ROWS = 2;

/** Bibliographic fallback titles when no registered DOI is available. */
export const CROSSREF_FALLBACK_TITLES = [
  "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
  "A survey on large language model based autonomous agents",
] as const;

export type CrossrefEnrichment = {
  doi: string;
  title: string;
  issued: string | null;
  type: string | null;
  url: string | null;
  source: "crossref";
  papersEnrichOnly: true;
  briefEligible: false;
  pulseLeadEligible: false;
  displaceHfKeep: false;
};

export type CrossrefWorkRaw = {
  DOI?: string | null;
  title?: string[] | string | null;
  type?: string | null;
  issued?: { "date-parts"?: number[][] | null } | null;
  URL?: string | null;
  score?: number | null;
};

export type CrossrefSearchResponse = {
  status?: string;
  "message-type"?: string;
  message?: {
    items?: CrossrefWorkRaw[];
    "total-results"?: number;
    "items-per-page"?: number;
    query?: Record<string, unknown>;
  } | null;
};

export type FetchCrossrefResult = {
  enrichments: CrossrefEnrichment[];
  query: string;
  mode: "filter" | "bibliographic" | "fixture" | "soft_fail";
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  from_cache: boolean;
  brief: false;
  pulse_lead: false;
  searches: number;
  /** Non-destructive merge notes (DOI collisions with OpenAlex, etc.). */
  merge_notes: string[];
};

export type CrossrefMergeResult = {
  papers: Paper[];
  notes: string[];
  enriched: number;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/crossref-cache",
);

/** Enforce ≤1 network call per ingest tick. */
let searchesThisTick = 0;

export function resetCrossrefTickState() {
  searchesThisTick = 0;
}

export function getCrossrefSearchesThisTick(): number {
  return searchesThisTick;
}

export function queryHash(query: string): string {
  return createHash("sha256")
    .update(query.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

export function resolveCrossrefCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/crossref-cache");
  return DEFAULT_CACHE_DIR;
}

/** True when DOI is an arXiv-assigned Crossref handle (often 404 on direct GET). */
export function isArxivDoi(raw: string | null | undefined): boolean {
  const doi = normalizeDoi(raw);
  if (!doi) return false;
  return doi.startsWith("10.48550/arxiv.");
}

/**
 * Data-repo DOIs (Zenodo/Figshare/Dryad/…) often miss Crossref filter rows.
 * Prefer journal/proceedings DOIs for the single ≤1 call/tick slot.
 */
export function isDataRepoDoi(raw: string | null | undefined): boolean {
  const doi = normalizeDoi(raw);
  if (!doi) return false;
  return (
    doi.startsWith("10.5281/") || // zenodo
    doi.startsWith("10.6084/") || // figshare
    doi.startsWith("10.5061/") || // dryad
    doi.startsWith("10.17632/") // mendeley data
  );
}

/** Rank registered DOIs: scholarly > data-repo; skip arXiv. Lower = better. */
export function doiPickRank(doi: string): number {
  if (isArxivDoi(doi)) return 99;
  if (isDataRepoDoi(doi)) return 50;
  return 0;
}

/** Format Crossref issued date-parts → ISO-ish string. */
export function formatIssuedDateParts(
  parts: number[] | null | undefined,
): string | null {
  if (!parts || !parts.length) return null;
  const y = parts[0];
  if (y == null || !Number.isFinite(y)) return null;
  if (parts.length === 1) return String(y);
  const m = parts[1];
  if (m == null || !Number.isFinite(m)) return String(y);
  if (parts.length === 2) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  const d = parts[2];
  if (d == null || !Number.isFinite(d)) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function workTitle(raw: CrossrefWorkRaw): string {
  const t = raw?.title;
  if (Array.isArray(t)) return String(t[0] ?? "").trim();
  if (typeof t === "string") return t.trim();
  return "";
}

function cachePath(cacheDir: string, key: string): string {
  return resolve(cacheDir, `${queryHash(key)}.json`);
}

function readCache(
  cacheDir: string,
  key: string,
  now = Date.now(),
): CrossrefSearchResponse | null {
  const p = cachePath(cacheDir, key);
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      cached_at?: string;
      body?: CrossrefSearchResponse;
    };
    const t = raw.cached_at ? Date.parse(raw.cached_at) : NaN;
    if (!Number.isFinite(t) || now - t > CROSSREF_CACHE_TTL_MS) return null;
    return raw.body ?? null;
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  key: string,
  body: CrossrefSearchResponse,
  now = Date.now(),
) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(
    cachePath(cacheDir, key),
    `${JSON.stringify({ cached_at: iso, key, body }, null, 2)}\n`,
  );
}

/** Map Crossref works → locked CrossrefEnrichment schema. */
export function parseCrossrefWorks(
  payload: CrossrefSearchResponse | CrossrefWorkRaw[] | null | undefined,
): CrossrefEnrichment[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.message?.items)
      ? payload!.message!.items!
      : [];
  const out: CrossrefEnrichment[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const doiNorm = normalizeDoi(it?.DOI ?? null);
    if (!doiNorm || seen.has(doiNorm)) continue;
    const title = workTitle(it);
    if (!title) continue;
    seen.add(doiNorm);
    const parts = it?.issued?.["date-parts"]?.[0] ?? null;
    const issued = formatIssuedDateParts(parts ?? undefined);
    const type = it?.type ? String(it.type) : null;
    const url = it?.URL
      ? String(it.URL)
      : `https://doi.org/${doiNorm}`;
    out.push({
      doi: doiNorm,
      title,
      issued,
      type,
      url,
      source: "crossref",
      papersEnrichOnly: true,
      briefEligible: false,
      pulseLeadEligible: false,
      displaceHfKeep: false,
    });
  }
  return out;
}

/** Hard gate — Crossref never Brief. */
export function isCrossrefBriefEligible(_item?: CrossrefEnrichment): false {
  void _item;
  return false;
}

/** Hard gate — never Pulse lead. */
export function isCrossrefPulseLeadEligible(_item?: CrossrefEnrichment): false {
  void _item;
  return false;
}

export function matchCrossrefToPaper(
  paper: Pick<
    Paper,
    "id" | "title" | "href" | "doi" | "openalexId" | "crossrefDoi"
  >,
  e: CrossrefEnrichment,
): boolean {
  const paperCross = normalizeDoi(paper.crossrefDoi ?? null);
  if (paperCross && paperCross === e.doi) return true;

  const paperDoi = normalizeDoi(paper.doi ?? null);
  if (paperDoi && paperDoi === e.doi) return true;

  // Title match — Scout: HuggingGPT may carry different registered DOI vs arXiv DOI
  if (fuzzyTitleMatch(paper.title, e.title)) return true;
  return false;
}

/**
 * Attach Crossref DOI/issued/type onto Papers by DOI/title match.
 * Non-destructive vs OpenAlex: never clobber openalexId; keep existing doi when
 * present (set crossrefDoi for the Crossref-registered value). Never displace HF keeps.
 */
export function mergeOntoPapers(
  papers: Paper[],
  enrichments: CrossrefEnrichment[],
  opts: { limit?: number; allowSecondary?: boolean } = {},
): CrossrefMergeResult {
  const limit = Math.max(1, opts.limit ?? Math.max(papers.length, 8));
  const allowSecondary = opts.allowSecondary === true;
  const notes: string[] = [];
  const used = new Set<string>();

  const out: Paper[] = papers.map((p) => {
    const e = enrichments.find(
      (x) => !used.has(x.doi) && matchCrossrefToPaper(p, x),
    );
    if (!e) return p;
    used.add(e.doi);

    const existingDoi = normalizeDoi(p.doi ?? null);
    const enrichDoi = e.doi;
    let nextDoi = p.doi;
    const crossrefDoi = `https://doi.org/${enrichDoi}`;

    if (!existingDoi) {
      nextDoi = crossrefDoi;
    } else if (existingDoi === enrichDoi) {
      // same DOI — fine
      nextDoi = p.doi;
    } else {
      // Collision: keep OpenAlex/existing doi; stash Crossref DOI separately
      notes.push(
        `doi_collision keep=${existingDoi} crossref=${enrichDoi} paper=${p.id} (non-destructive; openalexId preserved)`,
      );
      nextDoi = p.doi;
    }

    // Never touch openalexId / openalexEnrichOnly
    const yearFromIssued =
      e.issued && /^\d{4}/.test(e.issued)
        ? Number(e.issued.slice(0, 4))
        : null;

    return {
      ...p,
      title: p.title || e.title,
      doi: nextDoi,
      // fill year only if missing — don't clobber OpenAlex year
      year: p.year ?? yearFromIssued ?? null,
      openalexId: p.openalexId,
      openalexEnrichOnly: p.openalexEnrichOnly,
      crossrefDoi,
      crossrefIssued: e.issued,
      crossrefType: e.type,
      crossrefUrl: e.url,
      crossrefEnrichOnly: p.crossrefEnrichOnly ?? false,
    };
  });

  if (!allowSecondary) {
    return {
      papers: out,
      notes,
      enriched: out.filter((p) => p.crossrefDoi).length,
    };
  }

  const agentIds = new Set(
    out.filter((p) => isAgentPaper(p)).map((p) => p.id),
  );

  for (const e of enrichments) {
    if (used.has(e.doi)) continue;
    if (!e.papersEnrichOnly) continue;
    if (e.displaceHfKeep !== false) continue;
    if (e.briefEligible !== false || e.pulseLeadEligible !== false) continue;

    const shortId = e.doi;
    if (
      out.some(
        (p) =>
          p.id === shortId ||
          normalizeDoi(p.crossrefDoi ?? null) === e.doi ||
          normalizeDoi(p.doi ?? null) === e.doi,
      )
    ) {
      continue;
    }

    const yearFromIssued =
      e.issued && /^\d{4}/.test(e.issued)
        ? Number(e.issued.slice(0, 4))
        : null;

    const secondary: Paper = {
      id: shortId,
      title: e.title,
      up: 0,
      href: e.url || `https://doi.org/${e.doi}`,
      doi: `https://doi.org/${e.doi}`,
      year: yearFromIssued,
      crossrefDoi: `https://doi.org/${e.doi}`,
      crossrefIssued: e.issued,
      crossrefType: e.type,
      crossrefUrl: e.url,
      crossrefEnrichOnly: true,
    };

    if (out.length < limit) {
      out.push(secondary);
      used.add(e.doi);
      notes.push(`secondary_append doi=${e.doi}`);
      continue;
    }
    // At capacity: never displace HF keeps
    notes.push(`skip_secondary_at_capacity doi=${e.doi}`);
  }

  if (out.length <= limit) {
    return {
      papers: out,
      notes,
      enriched: out.filter((p) => p.crossrefDoi).length,
    };
  }
  const agents = out.filter((p) => agentIds.has(p.id) || isAgentPaper(p));
  const rest = out.filter((p) => !agentIds.has(p.id) && !isAgentPaper(p));
  const keptAgents = [...agents];
  const room = Math.max(limit - keptAgents.length, 0);
  const sliced = [...keptAgents, ...rest.slice(0, room)].slice(
    0,
    Math.max(limit, keptAgents.length),
  );
  return {
    papers: sliced,
    notes,
    enriched: sliced.filter((p) => p.crossrefDoi).length,
  };
}

export type FetchCrossrefOpts = {
  cacheDir?: string;
  papers?: Paper[];
  /** Explicit bibliographic query (tests / override). */
  query?: string;
  /** Explicit filter DOI (bare or URL). */
  filterDoi?: string;
  rows?: number;
  now?: number;
  fixtureJson?: CrossrefSearchResponse | string;
  forceSoftFail?: 429 | 500 | 503 | 404;
  fetchImpl?: typeof fetch;
  allowMultiSearch?: boolean;
};

function softFailResult(
  query: string,
  reason: string,
  mode: FetchCrossrefResult["mode"] = "soft_fail",
): FetchCrossrefResult {
  return {
    enrichments: [],
    query,
    mode,
    ok: false,
    soft_fail: true,
    soft_fail_reason: reason,
    from_cache: false,
    brief: false,
    pulse_lead: false,
    searches: searchesThisTick,
    merge_notes: [],
  };
}

function okResult(
  enrichments: CrossrefEnrichment[],
  query: string,
  mode: FetchCrossrefResult["mode"],
  from_cache: boolean,
): FetchCrossrefResult {
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
    merge_notes: [],
  };
}

/**
 * Prefer filter=doi:{registered} when Papers carry a non-arXiv DOI;
 * else query.bibliographic={title}. Never builds direct /works/{arxiv-doi}.
 */
export function buildCrossrefRequest(
  opts: {
    papers?: Paper[];
    query?: string;
    filterDoi?: string;
    rows?: number;
    now?: number;
  } = {},
): {
  cacheKey: string;
  url: string;
  mode: "filter" | "bibliographic";
  query: string;
} {
  const rows = Math.min(
    CROSSREF_ROWS,
    Math.max(1, opts.rows ?? CROSSREF_ROWS),
  );

  if (opts.filterDoi) {
    const doi = normalizeDoi(opts.filterDoi);
    if (!doi) {
      throw new Error(`invalid filterDoi: ${opts.filterDoi}`);
    }
    // Scout: do not use arXiv DOI for direct path; filter= is still preferred
    // over GET /works/{doi}, but arXiv DOIs often miss — prefer bibliographic.
    if (isArxivDoi(doi)) {
      const title =
        opts.papers?.find((p) => {
          const d = normalizeDoi(p.doi ?? null);
          return d === doi || arxivIdFromDoiOrUrl(p.doi) != null;
        })?.title ??
        CROSSREF_FALLBACK_TITLES[0]!;
      return {
        cacheKey: `biblio:${title}`,
        url: `${CROSSREF_API}?query.bibliographic=${encodeURIComponent(title)}&rows=${rows}`,
        mode: "bibliographic",
        query: title,
      };
    }
    return {
      cacheKey: `filter:doi:${doi}`,
      url: `${CROSSREF_API}?filter=${encodeURIComponent(`doi:${doi}`)}&rows=${rows}`,
      mode: "filter",
      query: `doi:${doi}`,
    };
  }

  if (opts.query) {
    const q = opts.query.trim();
    return {
      cacheKey: `biblio:${q}`,
      url: `${CROSSREF_API}?query.bibliographic=${encodeURIComponent(q)}&rows=${rows}`,
      mode: "bibliographic",
      query: q,
    };
  }

  const papers = opts.papers ?? [];

  // Prefer a registered scholarly DOI (skip arXiv; demote Zenodo/data-repo — often 0 hits)
  type Cand = { doi: string; rank: number };
  const cands: Cand[] = [];
  const seen = new Set<string>();
  for (const p of papers) {
    for (const raw of [p.doi, p.crossrefDoi]) {
      const doi = normalizeDoi(raw ?? null);
      if (!doi || isArxivDoi(doi) || seen.has(doi)) continue;
      seen.add(doi);
      cands.push({ doi, rank: doiPickRank(doi) });
    }
  }
  cands.sort((a, b) => a.rank - b.rank || a.doi.localeCompare(b.doi));
  const best = cands[0];
  if (best && best.rank < 99) {
    const doi = best.doi;
    return {
      cacheKey: `filter:doi:${doi}`,
      url: `${CROSSREF_API}?filter=${encodeURIComponent(`doi:${doi}`)}&rows=${rows}`,
      mode: "filter",
      query: `doi:${doi}`,
    };
  }

  // Else bibliographic from a known title (prefer HuggingGPT / survey / first paper)
  const preferred = papers.find((p) =>
    /hugginggpt|autonomous agents|large language model based/i.test(p.title),
  );
  const title =
    preferred?.title?.trim() ||
    papers.find((p) => p.title?.trim())?.title?.trim() ||
    CROSSREF_FALLBACK_TITLES[
      Math.floor((opts.now ?? Date.now()) / 86_400_000) %
        CROSSREF_FALLBACK_TITLES.length
    ]!;

  return {
    cacheKey: `biblio:${title}`,
    url: `${CROSSREF_API}?query.bibliographic=${encodeURIComponent(title)}&rows=${rows}`,
    mode: "bibliographic",
    query: title,
  };
}

async function getWorksJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<
  | { ok: true; body: CrossrefSearchResponse }
  | { ok: false; status: number; parse_error?: boolean }
> {
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": CROSSREF_UA,
    },
  });
  // Soft-fail 429 / 5xx / 404
  if (res.status === 429 || res.status === 404 || res.status >= 500) {
    return { ok: false, status: res.status };
  }
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  try {
    const body = (await res.json()) as CrossrefSearchResponse;
    return { ok: true, body };
  } catch {
    return { ok: false, status: res.status, parse_error: true };
  }
}

/**
 * Fetch Crossref enrichments — ≤1 network call per tick; 24h disk cache;
 * soft-fail 429/5xx/404/parse (continue ingest). Zero credentials.
 * Never uses GET /works/{arxiv-doi}.
 */
export async function fetchCrossrefEnrich(
  opts: FetchCrossrefOpts = {},
): Promise<FetchCrossrefResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (opts.forceSoftFail) {
    return softFailResult(
      opts.query ?? opts.filterDoi ?? "(forced)",
      `HTTP ${opts.forceSoftFail}`,
    );
  }

  if (opts.fixtureJson) {
    const payload =
      typeof opts.fixtureJson === "string"
        ? (JSON.parse(opts.fixtureJson) as CrossrefSearchResponse)
        : opts.fixtureJson;
    let enrichments: CrossrefEnrichment[] = [];
    try {
      enrichments = parseCrossrefWorks(payload);
    } catch (err) {
      return softFailResult("(fixture)", `parse_error:${String(err)}`);
    }
    return okResult(enrichments, "(fixture)", "fixture", false);
  }

  const built = buildCrossrefRequest({
    papers: opts.papers,
    query: opts.query,
    filterDoi: opts.filterDoi,
    rows: opts.rows,
    now,
  });

  // Guard: never emit direct /works/{doi} URLs (arXiv DOI 404 path)
  if (/\/works\/10\./i.test(built.url) && !built.url.includes("?")) {
    return softFailResult(
      built.query,
      "refused_direct_works_doi_get",
      built.mode,
    );
  }

  const cached = readCache(cacheDir, built.cacheKey, now);
  if (cached) {
    try {
      const enrichments = parseCrossrefWorks(cached);
      return okResult(enrichments, built.query, built.mode, true);
    } catch {
      // fall through to network
    }
  }

  if (searchesThisTick >= 1 && !opts.allowMultiSearch) {
    return softFailResult(built.query, "search_budget_exhausted", built.mode);
  }

  searchesThisTick += 1;

  try {
    const res = await getWorksJson(built.url, fetchImpl);
    if (!res.ok) {
      const reason = res.parse_error
        ? "parse_error"
        : `HTTP ${res.status}`;
      console.log(`Crossref: soft-fail ${reason} — skip enrich`);
      return softFailResult(built.query, reason, built.mode);
    }
    let enrichments: CrossrefEnrichment[] = [];
    try {
      enrichments = parseCrossrefWorks(res.body);
    } catch (err) {
      console.log(`Crossref: parse failed — ${String(err)}`);
      return softFailResult(
        built.query,
        `parse_error:${String(err)}`,
        built.mode,
      );
    }
    writeCache(cacheDir, built.cacheKey, res.body, now);
    return okResult(enrichments, built.query, built.mode, false);
  } catch (err) {
    console.log(`Crossref: fetch failed — ${String(err)}`);
    return softFailResult(built.query, String(err), built.mode);
  }
}
