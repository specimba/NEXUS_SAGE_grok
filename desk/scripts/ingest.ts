#!/usr/bin/env bun
/**
 * P3 live ingest — HF daily_papers + arXiv Atom enrich + OpenAlex Papers enrich + Crossref DOI enrich + HN Algolia Pulse + lab RSS + security RSS + GitHub shelf + Wikidata DENY grounding + watchlist plan + toolkit shelf.
 * Cycle stays 003 / hf-incident. No Zapier. No paid X / api.x.com. arXiv/HN/RSS never Brief pins.
 *
 * Usage:
 *   bun run ingest
 *   bun run ingest -- --dry-run
 *
 * Offline / missing keys:
 *   - HF public API attempted when network allows
 *   - Watchlist queries logged as curation plan only (no live X)
 *   - Crawl stamp always updates when the job completes (clears STALE)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  buildHandleQueries,
  buildSemanticQueries,
  HF_DAILY_PAPERS_URL,
  isAgentPaper,
  mergeDailyPapers,
  normalizeHfRow,
  scoreUrlList,
  xIngestEnv,
  type Paper,
} from "../src/lib/ingest/index";
import {
  applyArxivEnrichment,
  fetchArxivByIds,
  fetchArxivSearch,
  resolveArxivCacheDir,
  toShelfItems,
} from "../src/lib/arxiv-enrich";
import {
  fetchOpenAlexEnrich,
  mergeOntoPapers,
  OPENALEX_API,
  resetOpenAlexTickState,
  resolveOpenAlexCacheDir,
} from "../src/lib/openalex-enrich";
import {
  fetchCrossrefEnrich,
  mergeOntoPapers as mergeCrossrefOntoPapers,
  CROSSREF_API,
  resetCrossrefTickState,
  resolveCrossrefCacheDir,
} from "../src/lib/crossref-enrich";
import {
  fetchHnPulse,
  HN_RECENT_WINDOW_HOURS,
  resolveHnCacheDir,
  type HnPulseCandidate,
} from "../src/lib/hn-pulse";
import {
  fetchRssLabs,
  resolveRssCacheDir,
  toShelfItems as rssToShelfItems,
  type LabRssItem,
} from "../src/lib/rss-labs";
import {
  fetchRssSecurity,
  resolveSecRssCacheDir,
  toSecShelfItems,
  type SecurityRssItem,
} from "../src/lib/rss-security";
import {
  fetchGithubShelf,
  resolveGithubCacheDir,
  resetGithubShelfTickState,
  toGithubShelfItems,
} from "../src/lib/github-shelf";
import {
  fetchGnewsRss,
  GNEWS_CORROBORATORS_PER_ITEM,
  GNEWS_POOL_CAP,
  GNEWS_RECENT_DAYS,
  resolveGnewsCacheDir,
  resetGnewsTickState,
  type GnewsRssItem,
} from "../src/lib/gnews-rss";
import {
  fetchWikidataDeny,
  resetWikidataDenyTickState,
  resolveWikidataCacheDir,
  WIKIDATA_API,
  type WikidataDenyHint,
} from "../src/lib/wikidata-deny";
import { PAPERS as KEPT_PAPERS } from "../src/data/papers";
import { SHELF as KEPT_SHELF } from "../src/data/shelf";
import { crawlAgeHours, STALE_HOURS } from "../src/lib/x-pulse";
import { HN_PULSE } from "../src/data/hn-pulse";
import { RSS_LABS } from "../src/data/rss-labs";
import { isAiRelevantTitle, isLabItemRelevant, labItemDropReason, partitionAiRelevant } from "../src/lib/ai-relevance";
import { RSS_SECURITY } from "../src/data/rss-security";
import { GNEWS_RSS } from "../src/data/gnews-rss";
import {
  canonicalizeUrl,
  clusterItems,
  clusterStats,
  DEDUPE_THRESHOLD,
  DEDUPE_WINDOW_HOURS,
  pickCorroborators,
  topCrossSourcePairs,
  type PulseCluster,
  type PulseInput,
} from "../src/lib/dedupe";
import {
  parseLedger,
  summarizeLedger,
  updateLedger,
  type SourceHealthRow,
  type SourceOutcome,
} from "../src/lib/source-health";
import { markSeen, parseSeenIndex } from "../src/lib/seen-index";
import { STALE_GUARD_HOURS } from "../src/lib/crawl-staleness";

const root = resolve(import.meta.dir, "..");
const dryRun = process.argv.includes("--dry-run");

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function writeText(path: string, body: string) {
  mkdirSync(dirname(path), { recursive: true });
  if (dryRun) {
    console.log(`[dry-run] would write ${path} (${body.length} bytes)`);
    return;
  }
  writeFileSync(path, body);
  console.log(`wrote ${path}`);
}

type RowMeta = { first_seen?: string; is_new?: boolean; cluster_id?: string };
type MetaMap = Map<string, RowMeta>;

function metaTail(meta: MetaMap | undefined, id: string): string {
  const m = meta?.get(id);
  if (!m) return "";
  const parts: string[] = [];
  if (m.first_seen) parts.push(`first_seen: ${JSON.stringify(m.first_seen)}`);
  if (m.is_new != null) parts.push(`is_new: ${m.is_new}`);
  if (m.cluster_id) parts.push(`cluster_id: ${JSON.stringify(m.cluster_id)}`);
  return parts.length ? `, ${parts.join(", ")}` : "";
}

const META_TYPE_FIELDS = `  /** Beat 2 seen-index: first crawl stamp this canonical URL appeared. */
  first_seen?: string;
  /** Beat 2: first seen in the current crawl. */
  is_new?: boolean;
  /** Beat 2 cross-source dedupe cluster id (see pulse-clusters.ts). */
  cluster_id?: string;
`;

function readJson(path: string): unknown {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  } catch {
    return null;
  }
}

function renderPapersTs(papers: Paper[]): string {
  const rows = papers
    .map((p) => {
      const extras: string[] = [];
      if (p.abstract) extras.push(`,\n    abstract: ${JSON.stringify(p.abstract.slice(0, 800))}`);
      if (p.pdfUrl) extras.push(`,\n    pdfUrl: ${JSON.stringify(p.pdfUrl)}`);
      if (p.primaryCategory) extras.push(`,\n    primaryCategory: ${JSON.stringify(p.primaryCategory)}`);
      if (p.authors?.length) extras.push(`,\n    authors: ${JSON.stringify(p.authors)}`);
      if (p.doi) extras.push(`,\n    doi: ${JSON.stringify(p.doi)}`);
      if (p.year != null) extras.push(`,\n    year: ${p.year}`);
      if (p.openalexId) extras.push(`,\n    openalexId: ${JSON.stringify(p.openalexId)}`);
      if (p.openalexEnrichOnly) extras.push(`,\n    openalexEnrichOnly: true`);
      if (p.crossrefDoi) extras.push(`,\n    crossrefDoi: ${JSON.stringify(p.crossrefDoi)}`);
      if (p.crossrefIssued) extras.push(`,\n    crossrefIssued: ${JSON.stringify(p.crossrefIssued)}`);
      if (p.crossrefType) extras.push(`,\n    crossrefType: ${JSON.stringify(p.crossrefType)}`);
      if (p.crossrefUrl) extras.push(`,\n    crossrefUrl: ${JSON.stringify(p.crossrefUrl)}`);
      if (p.crossrefEnrichOnly) extras.push(`,\n    crossrefEnrichOnly: true`);
      return `  { id: ${JSON.stringify(p.id)}, title: ${JSON.stringify(p.title)}, up: ${p.up}, href: ${JSON.stringify(p.href)}${extras.join("")} }`;
    })
    .join(",\n");
  return `/** Generated by bun run ingest — HF daily_papers + arXiv enrich + OpenAlex Papers enrich + Crossref DOI enrich (gen/sim displacement rule applied). */\nexport const PAPERS = [\n${rows},\n];\n`;
}

function renderShelfTs(
  items: { href: string; label: string; reason: string }[],
): string {
  const rows = items
    .map(
      (i) =>
        `  { href: ${JSON.stringify(i.href)}, label: ${JSON.stringify(i.label)}, reason: ${JSON.stringify(i.reason)} as const }`,
    )
    .join(",\n");
  return `/** Operator toolkit + arXiv/RSS shelf — off Brief. Refresh via bun run ingest. */\nexport type ShelfItem = {\n  href: string;\n  label: string;\n  reason: "toolkit" | "toolkit-github" | "arxiv-shelf" | "rss-lab-shelf" | "rss-security-shelf" | "github-search-shelf";\n};\n\nexport const SHELF: ShelfItem[] = [\n${rows},\n];\n`;
}

function renderHnPulseTs(rows: HnPulseCandidate[], stamp: string, meta?: MetaMap): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, text: ${JSON.stringify(r.text)}, url: ${JSON.stringify(r.url)}, source: "hn-algolia" as const, score: ${r.score}, at: ${JSON.stringify(r.at)}, author: ${JSON.stringify(r.author)}, tag: ${JSON.stringify(r.tag)} as const${metaTail(meta, r.id)} }`;
    })
    .join(",\n");
  return `/** HN Algolia Pulse chatter — generated/refreshed by bun run ingest. Pulse only; never Brief. */
export type HnPulseRow = {
  id: string;
  text: string;
  url: string;
  source: "hn-algolia";
  score: number;
  at: string;
  author: string;
  tag: "rest" | "rumor" | "companion" | "incident";
${META_TYPE_FIELDS}};

export const HN_PULSE_AT = ${JSON.stringify(stamp)};

export const HN_PULSE: HnPulseRow[] = [
${body},
];
`;
}

function renderRssLabsTs(rows: LabRssItem[], stamp: string, meta?: MetaMap): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, lab: ${JSON.stringify(r.lab)} as const, title: ${JSON.stringify(r.title)}, link: ${JSON.stringify(r.link)}, published: ${JSON.stringify(r.published)}, summary: ${JSON.stringify(r.summary)}, source: "rss-lab" as const, tag: ${JSON.stringify(r.tag)} as const${metaTail(meta, r.id)} }`;
    })
    .join(",\n");
  return `/** Lab blog RSS Pulse — generated/refreshed by bun run ingest. Pulse/shelf only; never Brief. */
export type RssLabRow = {
  id: string;
  lab: "openai" | "deepmind" | "google-ai" | "huggingface" | "mistral" | "nvidia" | "nvidia-dev" | "ms-research" | "google-research";
  title: string;
  link: string;
  published: string;
  summary: string;
  source: "rss-lab";
  tag: "rest" | "rumor" | "companion" | "incident";
${META_TYPE_FIELDS}};

export const RSS_LABS_AT = ${JSON.stringify(stamp)};

export const RSS_LABS: RssLabRow[] = [
${body},
];
`;
}

function renderRssSecurityTs(rows: SecurityRssItem[], stamp: string, meta?: MetaMap): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, lab: ${JSON.stringify(r.lab)} as const, title: ${JSON.stringify(r.title)}, link: ${JSON.stringify(r.link)}, published: ${JSON.stringify(r.published)}, summary: ${JSON.stringify(r.summary)}, source: "rss-security" as const, tag: ${JSON.stringify(r.tag)} as const${metaTail(meta, r.id)} }`;
    })
    .join(",\n");
  return `/** Security lab RSS Pulse — generated/refreshed by bun run ingest. Pulse/shelf/Digest-ref only; never Brief. */
export type RssSecurityRow = {
  id: string;
  lab: "trailofbits" | "fox-it" | "ncc" | "projectzero" | "google-sec";
  title: string;
  link: string;
  published: string;
  summary: string;
  source: "rss-security";
  tag: "rest" | "rumor" | "companion" | "incident";
${META_TYPE_FIELDS}};

export const RSS_SECURITY_AT = ${JSON.stringify(stamp)};

export const RSS_SECURITY: RssSecurityRow[] = [
${body},
];
`;
}


function renderGnewsRssTs(rows: GnewsRssItem[], stamp: string, meta?: MetaMap): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, title: ${JSON.stringify(r.title)}, link: ${JSON.stringify(r.link)}, published: ${JSON.stringify(r.published)}, summary: ${JSON.stringify(r.summary)}, publisher: ${JSON.stringify(r.publisher)}, query: ${JSON.stringify(r.query)}, source: "gnews-rss" as const, tag: ${JSON.stringify(r.tag)} as const${metaTail(meta, r.id)} }`;
    })
    .join(",\n");
  return `/** Google News RSS Pulse spice — generated/refreshed by bun run ingest. Quiet shelf only; never Brief · never sole lead. */
export type GnewsRssRow = {
  id: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  publisher: string;
  query: string;
  source: "gnews-rss";
  tag: "rest" | "rumor" | "companion" | "incident";
${META_TYPE_FIELDS}};

export const GNEWS_RSS_AT = ${JSON.stringify(stamp)};

export const GNEWS_RSS: GnewsRssRow[] = [
${body},
];
`;
}

function renderPulseClustersTs(
  clusters: PulseCluster[],
  stats: ReturnType<typeof clusterStats>,
  stamp: string,
): string {
  const body = clusters
    .map((c) => {
      const row = {
        id: c.id,
        title: c.title,
        url: c.url,
        canonical_url: c.canonical_url,
        lead_id: c.lead_id,
        lead_source: c.lead_source,
        sources: c.sources,
        ...(c.all_sources.length !== c.sources.length ? { all_sources: c.all_sources } : {}),
        member_ids: c.member_ids,
        ...(c.members.some((m) => m.self_repost)
          ? { members: c.members.map((m) => ({ id: m.id, source: m.source, publisher: m.publisher ?? null, ...(m.self_repost ? { self_repost: true } : {}) })) }
          : {}),
        size: c.size,
        at: c.at,
        first_seen: c.first_seen ?? null,
        is_new: Boolean(c.is_new),
        score: c.score,
      };
      return `  ${JSON.stringify(row)}`;
    })
    .join(",\n");
  return `/** Cross-source Pulse clusters (Beat 2 dedupe) — generated by bun run ingest. Pulse only; never Brief. */
import type { PulseSource } from "@/lib/dedupe";

export type PulseClusterRow = {
  id: string;
  title: string;
  url: string;
  canonical_url: string;
  lead_id: string;
  lead_source: PulseSource;
  /** Independent source classes — GNews self-reposts (same company as the original post) excluded. */
  sources: PulseSource[];
  /** Every source class incl. self-reposts (only present when it differs from sources). */
  all_sources?: PulseSource[];
  member_ids: string[];
  /** Per-member detail, present only when a member is a self-repost. self_repost:true counts 0 sources. */
  members?: { id: string; source: PulseSource; publisher: string | null; self_repost?: true }[];
  size: number;
  at: string;
  first_seen: string | null;
  is_new: boolean;
  /** Dedupe v2: strongest linking pair score (1 = same canonical URL, 0 = singleton). */
  score?: number;
};

export const PULSE_CLUSTERS_AT = ${JSON.stringify(stamp)};

export const PULSE_CLUSTER_STATS = ${JSON.stringify({ ...stats, threshold: DEDUPE_THRESHOLD, window_hours: DEDUPE_WINDOW_HOURS })} as const;

export const PULSE_CLUSTERS: PulseClusterRow[] = [
${body},
];
`;
}

function renderSourceHealthTs(rows: SourceHealthRow[], stamp: string): string {
  const body = rows.map((r) => `  ${JSON.stringify(r)}`).join(",\n");
  return `/** Source health ledger snapshot (Beat 2) — generated by bun run ingest from artifacts/sage/source-health.json. Rail/UI only; never Brief. */
import type { SourceHealthRow } from "@/lib/source-health";

export const SOURCE_HEALTH_AT = ${JSON.stringify(stamp)};

export const SOURCE_HEALTH: SourceHealthRow[] = [
${body},
];
`;
}

function patchCrawlAt(src: string, stamp: string): string {
  if (/export const CRAWL_AT = "[^"]+"/.test(src)) {
    return src.replace(/export const CRAWL_AT = "[^"]+"/, `export const CRAWL_AT = "${stamp}"`);
  }
  throw new Error("x-crawl.ts missing CRAWL_AT export");
}

function patchCurrentJson(path: string, stamp: string) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  if (data.id !== "003") {
    throw new Error(`refuse ingest: cycle id is ${data.id}, expected 003`);
  }
  data.crawled_at = stamp;
  data.compiled_at = data.compiled_at ?? stamp;
  data.ingest_note =
    "P3 ingest stamp + FREE-PULSE P5 Google News RSS spice. Lead remains hf-incident. Free providers only (HF daily_papers + arXiv Atom + OpenAlex Papers enrich + Crossref DOI enrich + HN Algolia Pulse + lab RSS + Google News RSS spice + security RSS ToB/Fox-IT/PZ + GitHub unauth shelf + Wikidata DENY grounding + shelf). No paid X. arXiv/OpenAlex/Crossref/HN/RSS/GNews/GitHub/Wikidata never Brief pins. GNews never sole Pulse lead. HF HTML fallback not wired. NCC RSS skip. S2 deferred.";
  writeText(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Beat 6: Papers table shows ≥14 rows — keep top 24 of the same single HF daily_papers response (no new requests). */
const PAPERS_KEEP = 24;

async function fetchHfPapers(): Promise<Paper[]> {
  const res = await fetch(HF_DAILY_PAPERS_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HF daily_papers HTTP ${res.status}`);
  const raw = (await res.json()) as unknown[];
  const papers: Paper[] = [];
  for (const row of raw) {
    const p = normalizeHfRow(row);
    if (p) papers.push(p);
  }
  return papers;
}

function loadUrlList(): string[] {
  const candidates = [
    resolve(root, "../sage-handoff/attachments/fancyTWEETScuration0209.txt"),
    resolve(root, "../../attachments/fancyTWEETScuration0209.txt"),
    resolve("/workspace/attachments/fancyTWEETScuration0209.txt"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      console.log(`URL list: ${p}`);
      return readFileSync(p, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }
  }
  console.log("URL list: not found — shelf kept as-is / empty score");
  return [];
}

async function main() {
  const stamp = isoNow();
  console.log(`SAGE ingest P3 · stamp ${stamp} · STALE_HOURS=${STALE_HOURS}`);

  const since = buildHandleQueries()[0]?.query.match(/since:(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  const handleQs = buildHandleQueries(3);
  const semanticQs = buildSemanticQueries();
  console.log(
    `Watchlist plan (curation only, no live X): ${handleQs.length} handles (weight≥3) + ${semanticQs.length} semantic classes since ${since || "yesterday"}`,
  );
  for (const h of handleQs.slice(0, 3)) console.log(`  handle ${h.handle} w=${h.weight} :: ${h.query}`);
  for (const s of semanticQs) console.log(`  class ${s.class} :: ${s.query}`);

  const xEnv = xIngestEnv();
  console.log(`X: disabled (${xEnv.docs})`);

  let papers: Paper[] = KEPT_PAPERS.map((p) => {
    const row = p as Paper;
    return {
      id: row.id,
      title: row.title,
      up: row.up,
      href: row.href,
      abstract: row.abstract,
      pdfUrl: row.pdfUrl,
      authors: row.authors,
      primaryCategory: row.primaryCategory,
      doi: row.doi,
      year: row.year,
      openalexId: row.openalexId,
      openalexEnrichOnly: row.openalexEnrichOnly,
      crossrefDoi: row.crossrefDoi,
      crossrefIssued: row.crossrefIssued,
      crossrefType: row.crossrefType,
      crossrefUrl: row.crossrefUrl,
      crossrefEnrichOnly: row.crossrefEnrichOnly,
    };
  });
  let hfOk = false;
  let hfLiveCount = 0;
  let hfFailReason: string | undefined;
  try {
    const live = await fetchHfPapers();
    hfLiveCount = live.length;
    const keptAgent = papers.filter(isAgentPaper);
    papers = mergeDailyPapers(live, { keptAgent, limit: PAPERS_KEEP });
    hfOk = true;
    console.log(`HF: ${live.length} live → ${papers.length} kept (displacement rule applied)`);
  } catch (err) {
    hfFailReason = String(err);
    console.log(`HF: fetch failed — keeping existing papers (${String(err)})`);
  }

  // arXiv Atom enrich AFTER HF merge — Papers abstracts/links only; never Brief pins / never cycle 004
  let arxivOk = false;
  let arxivCount = 0;
  let arxivShelf: { href: string; label: string; reason: "arxiv-shelf" }[] = [];
  let arxivFailReason: string | undefined;
  try {
    const enrichments = await fetchArxivByIds(
      papers.map((p) => p.id),
      { cacheDir: resolveArxivCacheDir(root), maxResults: 25 },
    );
    if (enrichments.length) {
      papers = applyArxivEnrichment(papers, enrichments);
      arxivOk = true;
      arxivCount = enrichments.length;
      console.log(`arXiv: enriched ${arxivCount}/${papers.length} paper ids (cache+live)`);
    } else {
      console.log("arXiv: no enrichments (skip / empty)");
    }
    // Optional shelf-only search hits (not already HF keeps)
    const searchHits = await fetchArxivSearch({ maxResults: 5 });
    arxivShelf = toShelfItems(
      searchHits,
      papers.map((p) => p.id),
    ).map((s) => ({ href: s.href, label: s.label, reason: "arxiv-shelf" as const }));
    if (arxivShelf.length) {
      console.log(`arXiv shelf: ${arxivShelf.length} search hits (shelfOnly, off Brief)`);
    }
  } catch (err) {
    arxivFailReason = String(err);
    console.log(`arXiv: enrich failed — continuing (${String(err)})`);
  }

  // OpenAlex Papers enrich AFTER arXiv — id/year/DOI metadata only; never Brief / never Pulse lead / never displace HF keeps
  resetOpenAlexTickState();
  let openalexOk = false;
  let openalexSoftFail = false;
  let openalexSoftFailReason: string | undefined;
  let openalexCount = 0;
  let openalexSecondary = 0;
  let openalexQuery = "";
  let openalexFromCache = false;
  let openalexSearches = 0;
  let openalexRetries = 0;
  let openalexMode: string = "search";
  try {
    const oa = await fetchOpenAlexEnrich({
      papers,
      cacheDir: resolveOpenAlexCacheDir(root),
    });
    openalexQuery = oa.query;
    openalexFromCache = oa.from_cache;
    openalexSearches = oa.searches;
    openalexRetries = oa.retries;
    openalexSoftFail = oa.soft_fail;
    openalexSoftFailReason = oa.soft_fail_reason;
    openalexMode = oa.mode;
    if (oa.soft_fail) {
      console.log(
        `OpenAlex: soft-fail (${oa.soft_fail_reason ?? "unknown"}) retries=${oa.retries} enriched=0 — continuing stamp (brief=false)`,
      );
    } else if (oa.enrichments.length) {
      const beforeIds = new Set(papers.map((p) => p.id));
      const agentBefore = papers.filter(isAgentPaper).map((p) => p.id);
      papers = mergeOntoPapers(papers, oa.enrichments, {
        // Room for a few enrich-only secondaries without displacing HF keeps
        limit: Math.max(8, papers.length) + 3,
      });
      // Displacement guard: every prior agent keep must remain
      for (const id of agentBefore) {
        if (!papers.some((p) => p.id === id)) {
          throw new Error(`OpenAlex displaced HF agent keep ${id}`);
        }
      }
      openalexOk = true;
      openalexCount = papers.filter((p) => p.openalexId).length;
      openalexSecondary = papers.filter((p) => p.openalexEnrichOnly).length;
      console.log(
        `OpenAlex: enriched=${openalexCount} secondary=${openalexSecondary} mode=${oa.mode} cache=${oa.from_cache} retries=${oa.retries} brief=false pulse_lead=false`,
      );
      void beforeIds;
    } else {
      console.log("OpenAlex: no enrichments (skip / empty)");
    }
  } catch (err) {
    openalexSoftFail = true;
    openalexSoftFailReason = String(err);
    console.log(`OpenAlex: soft-fail exception — continuing (${String(err)})`);
  }

  // Crossref Papers DOI enrich AFTER OpenAlex — filter=doi:/bibliographic only; never Brief / never Pulse lead / never displace HF keeps
  resetCrossrefTickState();
  let crossrefOk = false;
  let crossrefSoftFail = false;
  let crossrefSoftFailReason: string | undefined;
  let crossrefCount = 0;
  let crossrefQuery = "";
  let crossrefFromCache = false;
  let crossrefSearches = 0;
  let crossrefMode: string = "bibliographic";
  let crossrefMergeNotes: string[] = [];
  try {
    const cr = await fetchCrossrefEnrich({
      papers,
      cacheDir: resolveCrossrefCacheDir(root),
    });
    crossrefQuery = cr.query;
    crossrefFromCache = cr.from_cache;
    crossrefSearches = cr.searches;
    crossrefSoftFail = cr.soft_fail;
    crossrefSoftFailReason = cr.soft_fail_reason;
    crossrefMode = cr.mode;
    if (cr.soft_fail) {
      console.log(
        `Crossref: soft-fail (${cr.soft_fail_reason ?? "unknown"}) — continuing stamp (brief=false)`,
      );
    } else if (cr.enrichments.length) {
      const agentBefore = papers.filter(isAgentPaper).map((p) => p.id);
      const merged = mergeCrossrefOntoPapers(papers, cr.enrichments, {
        limit: Math.max(8, papers.length) + 3,
        allowSecondary: false,
      });
      papers = merged.papers;
      crossrefMergeNotes = merged.notes;
      for (const id of agentBefore) {
        if (!papers.some((p) => p.id === id)) {
          throw new Error(`Crossref displaced HF agent keep ${id}`);
        }
      }
      // openalexId must survive non-destructive merge
      crossrefOk = true;
      crossrefCount = papers.filter((p) => p.crossrefDoi).length;
      console.log(
        `Crossref: enriched=${crossrefCount} mode=${cr.mode} cache=${cr.from_cache} brief=false pulse_lead=false notes=${crossrefMergeNotes.length}`,
      );
      for (const n of crossrefMergeNotes.slice(0, 3)) {
        console.log(`  crossref note: ${n}`);
      }
    } else {
      console.log("Crossref: no enrichments (skip / empty)");
    }
  } catch (err) {
    crossrefSoftFail = true;
    crossrefSoftFailReason = String(err);
    console.log(`Crossref: soft-fail exception — continuing (${String(err)})`);
  }

  // HN Algolia AFTER Crossref — Pulse chatter only; never Brief lead/companion / never toolkit Brief pins
  // FREE-PULSE P3: rotate ≤3 queries/tick · soft_fail merge · never Brief · never displace HF
  let hnOk = false;
  let hnSoftFail = false;
  let hnSoftFailReason: string | undefined;
  let hnRows: HnPulseCandidate[] = [];
  let hnQueriesRun: string[] = [];
  let hnQueriesOk: string[] = [];
  let hnQueriesSoftFail: { query: string; reason: string; soft_fail: true }[] = [];
  let hnAiDropped: number | null = null;
  try {
    // Dedupe v2 freshness: last-48h window + one OR-entity recency sweep (free Algolia only).
    const hn = await fetchHnPulse({
      cacheDir: resolveHnCacheDir(root),
      hitsPerPage: 20,
      recentHours: HN_RECENT_WINDOW_HOURS,
      recentSweep: true,
      aiOnly: true,
    });
    hnRows = hn.candidates;
    hnOk = hn.ok || hnRows.length > 0;
    hnSoftFail = hn.soft_fail;
    hnSoftFailReason = hn.soft_fail_reason;
    hnQueriesRun = hn.queries_run;
    hnQueriesOk = hn.queries_ok;
    hnQueriesSoftFail = hn.queries_soft_fail;
    console.log(
      `HN: ${hnRows.length} Pulse candidates queries=${hnQueriesRun.length} soft_fail=${hn.soft_fail} (classifyPost filtered; brief=false; rotate≤3)`,
    );
    hnAiDropped = hn.ai_dropped ?? null;
    console.log(`  hn ai_relevance dropped=${hn.ai_dropped ?? "off"}${hn.ai_dropped_titles?.length ? ` :: ${hn.ai_dropped_titles.slice(0, 12).map((t) => t.slice(0, 48)).join(" | ")}` : ""}`);
    console.log(
      `  hn recent_hours=${hn.recent_hours ?? "off"} sweep=${hn.recent_sweep ? `${hn.recent_sweep.ok ? "ok" : "fail"}(hits=${hn.recent_sweep.hits}${hn.recent_sweep.reason ? ` ${hn.recent_sweep.reason}` : ""})` : "off"}`,
    );
    if (hnQueriesRun.length) {
      console.log(`  hn queries_run: ${hnQueriesRun.join(" · ")}`);
    }
    for (const s of hnQueriesSoftFail) {
      console.log(`  hn soft_fail ${s.query}: ${s.reason}`);
    }
    for (const h of hnRows.slice(0, 3)) {
      console.log(`  hn ${h.id} [${h.tag}] score=${h.score} :: ${h.text.slice(0, 72)}`);
    }
  } catch (err) {
    hnSoftFail = true;
    hnSoftFailReason = `exception: ${String(err)}`;
    console.log(`HN: soft_fail — continuing (${String(err)})`);
  }

  // Lab RSS AFTER HN — Pulse/shelf only; never Brief lead / never cycle 004 / never displace HF
  let rssOk = false;
  let rssSoftFail = false;
  let rssSoftFailReason: string | undefined;
  let rssPulse: LabRssItem[] = [];
  let rssAiDropped: { lab: string; title: string; reason: string }[] = [];
  let rssShelf: { href: string; label: string; reason: "rss-lab-shelf" }[] = [];
  let rssFeedsOk: { lab: string; url: string; count: number }[] = [];
  let rssFeedsSoftFail: { lab: string; reason: string; soft_fail: true }[] = [];
  try {
    const rss = await fetchRssLabs({
      cacheDir: resolveRssCacheDir(root),
      maxPerFeed: 12,
    });
    // Lab relevance: research-lab feeds are AI by default. NVIDIA blog/dev drop consumer posts
    // (GeForce NOW / gaming) by <category> + link path — never by title.
    const rssGate = partitionAiRelevant(rss.pulse, (it) => isLabItemRelevant(it));
    rssPulse = rssGate.kept;
    rssAiDropped = rssGate.dropped.map((it) => ({ lab: it.lab, title: it.title, reason: labItemDropReason(it) ?? "" }));
    console.log(
      `  rss lab_relevance dropped=${rssAiDropped.length}${rssAiDropped.length ? ` :: ${rssAiDropped.slice(0, 12).map((d) => `${d.lab}[${d.reason}]: ${d.title.slice(0, 48)}`).join(" | ")}` : ""}`,
    );
    rssShelf = rssToShelfItems(rss.shelf);
    rssFeedsOk = rss.feedsOk;
    rssFeedsSoftFail = rss.feedsSoftFail;
    rssSoftFail = rss.soft_fail;
    rssSoftFailReason = rss.soft_fail_reason;
    rssOk = rss.ok;
    console.log(
      `RSS labs: ${rssPulse.length} Pulse (of ${rss.pulse.length}, ${rssAiDropped.length} consumer drops) + ${rss.shelf.length} shelf from ${rss.feedsOk.length} feeds soft_fail=${rss.soft_fail} (brief=false · never HF displace)`,
    );
    for (const f of rss.feedsOk) {
      console.log(`  rss ${f.lab} @ ${f.url} → ${f.count} items`);
    }
    for (const s of rss.feedsSoftFail) {
      console.log(`  rss soft_fail ${s.lab}: ${s.reason}`);
    }
    for (const it of rss.pulse.slice(0, 3)) {
      console.log(`  rss ${it.lab} [${it.tag}] :: ${it.title.slice(0, 72)}`);
    }
  } catch (err) {
    rssSoftFail = true;
    rssSoftFailReason = `exception: ${String(err)}`;
    console.log(`RSS labs: soft_fail — continuing (${String(err)})`);
  }


  // Google News RSS AFTER lab RSS — Pulse quiet spice only; never Brief · never sole lead · rotate ≤2/tick
  // FREE-PULSE P5: soft_fail format-break/empty/403/429 · locks 003/hf-incident · no 004 · paid X/Bluesky DENY
  resetGnewsTickState();
  let gnewsOk = false;
  let gnewsSoftFail = false;
  let gnewsSoftFailReason: string | undefined;
  let gnewsRows: GnewsRssItem[] = [];
  let gnewsPool: GnewsRssItem[] = [];
  let gnewsAiDropped: { publisher: string; title: string }[] = [];
  let gnewsPoolAiDropped = 0;
  let gnewsCorroborators: { id: string; anchor_id: string; score: number; title: string; publisher: string; self_repost: boolean }[] = [];
  let gnewsQueriesRun: string[] = [];
  let gnewsQueriesOk: string[] = [];
  let gnewsQueriesSoftFail: { query: string; reason: string; soft_fail: true }[] = [];
  let gnewsQueriesAttempted = 0;
  let gnewsQueriesOkCount = 0;
  let gnewsHttpStatus: number | null = null;
  let gnewsContentType: string | null = null;
  let gnewsFormat: string | null = null;
  let gnewsFromCache = false;
  try {
    // Beat 5: standing (≤2) + lab-name (≤2) queries, last 2 days, pool ≤32 (round-robin per query).
    const gn = await fetchGnewsRss({
      cacheDir: resolveGnewsCacheDir(root),
      displayCap: GNEWS_POOL_CAP,
      labQueries: true,
      recentDays: GNEWS_RECENT_DAYS,
    });
    // AI-relevance gate (title-only — GNews links are news.google.com redirects).
    const gnGate = partitionAiRelevant(gn.items, (it) => isAiRelevantTitle(it.title));
    gnewsRows = gnGate.kept;
    // Pool is NOT title-gated: pool items only enter as corroborators of an accepted HN/lab/security
    // anchor (direct v2 match), so they inherit its relevance — and NVIDIA's own GNews copies of
    // kept lab posts attach and show as self_repost (0 sources) instead of silently vanishing.
    gnewsPool = gn.pool ?? [];
    gnewsAiDropped = gnGate.dropped.map((it) => ({ publisher: it.publisher, title: it.title }));
    gnewsPoolAiDropped = 0;
    console.log(
      `  gnews ai_relevance dropped=${gnewsAiDropped.length} shown (pool ungated: corroborators inherit anchor relevance)${gnewsAiDropped.length ? ` :: ${gnewsAiDropped.slice(0, 12).map((d) => d.title.slice(0, 48)).join(" | ")}` : ""}`,
    );
    gnewsOk = gn.ok || gnewsRows.length > 0;
    gnewsSoftFail = gn.soft_fail;
    gnewsSoftFailReason = gn.soft_fail_reason;
    gnewsQueriesRun = gn.queries_run;
    gnewsQueriesOk = gn.queries_ok_list;
    gnewsQueriesSoftFail = gn.queries_soft_fail;
    gnewsQueriesAttempted = gn.queries_attempted;
    gnewsQueriesOkCount = gn.queries_ok;
    gnewsHttpStatus = gn.http_status;
    gnewsContentType = gn.content_type;
    gnewsFormat = gn.format;
    gnewsFromCache = gn.from_cache;
    console.log(
      `GNews: ${gnewsRows.length} spice cards queries=${gnewsQueriesAttempted} ok=${gnewsQueriesOkCount} soft_fail=${gn.soft_fail} (brief=false · pulse_lead=false · rotate≤2)`,
    );
    if (gnewsQueriesRun.length) {
      console.log(`  gnews queries_run: ${gnewsQueriesRun.join(" · ")}`);
    }
    for (const s of gnewsQueriesSoftFail) {
      console.log(`  gnews soft_fail ${s.query}: ${s.reason}`);
    }
    for (const it of gnewsRows.slice(0, 3)) {
      console.log(`  gnews [${it.tag}] ${it.publisher || "?"} :: ${it.title.slice(0, 72)}`);
    }
  } catch (err) {
    gnewsSoftFail = true;
    gnewsSoftFailReason = `exception: ${String(err)}`;
    console.log(`GNews: soft_fail — continuing (${String(err)})`);
  }

  // Security lab RSS AFTER lab RSS — Pulse/shelf/Digest-ref; never Brief lead / never cycle 004
  let secOk = false;
  let secPulse: SecurityRssItem[] = [];
  let secShelf: { href: string; label: string; reason: "rss-security-shelf" }[] = [];
  let secFeedsOk: { lab: string; url: string; count: number }[] = [];
  let secFailReason: string | undefined;
  try {
    const sec = await fetchRssSecurity({
      cacheDir: resolveSecRssCacheDir(root),
      maxPerFeed: 12,
    });
    secPulse = sec.pulse;
    secShelf = toSecShelfItems(sec.shelf);
    secFeedsOk = sec.feedsOk;
    secOk = sec.feedsOk.length >= 1;
    if (!secOk) secFailReason = `no feeds ok (${sec.feedsSkipped.map((s) => `${s.lab}: ${s.reason}`).join("; ") || "empty"})`;
    console.log(
      `RSS security: ${sec.pulse.length} Pulse + ${sec.shelf.length} shelf from ${sec.feedsOk.length} feeds (brief=false)`,
    );
    for (const f of sec.feedsOk) {
      console.log(`  rss-sec ${f.lab} @ ${f.url} → ${f.count} items`);
    }
    for (const s of sec.feedsSkipped) {
      console.log(`  rss-sec skip ${s.lab}: ${s.reason}`);
    }
    for (const it of sec.pulse.slice(0, 3)) {
      console.log(`  rss-sec ${it.lab} [${it.tag}] :: ${it.title.slice(0, 72)}`);
    }
  } catch (err) {
    secFailReason = String(err);
    console.log(`RSS security: fetch failed — continuing (${String(err)})`);
  }

  // GitHub unauth AFTER security RSS — FREE-PULSE P4: ≤1 search/tick · 24h cache-first · Remaining-0 skip · shelf only
  resetGithubShelfTickState();
  let githubOk = false;
  let githubSoftFail = false;
  let githubSoftFailReason: string | undefined;
  let githubShelf: { href: string; label: string; reason: "github-search-shelf" }[] = [];
  let githubQuery = "";
  let githubFromCache = false;
  let githubSearches = 0;
  let githubRateRemaining: number | null = null;
  try {
    const gh = await fetchGithubShelf({
      cacheDir: resolveGithubCacheDir(root),
    });
    githubQuery = gh.query;
    githubFromCache = gh.from_cache;
    githubSearches = gh.searches;
    githubSoftFail = gh.soft_fail;
    githubSoftFailReason = gh.soft_fail_reason;
    githubRateRemaining = gh.rate_limit_remaining;
    if (gh.soft_fail) {
      console.log(
        `GitHub shelf: soft-fail (${gh.soft_fail_reason ?? "unknown"}) searches=${gh.searches} cache=${gh.from_cache} — continuing stamp (shelf only · brief=false)`,
      );
    } else {
      githubShelf = toGithubShelfItems(gh.shelf);
      githubOk = gh.ok && githubShelf.length >= 0;
      console.log(
        `GitHub shelf: query="${gh.query}" hits=${gh.hits.length} shelf=${githubShelf.length} cache=${gh.from_cache} searches=${gh.searches} brief=false`,
      );
      for (const s of githubShelf.slice(0, 3)) {
        console.log(`  gh-shelf ${s.label} :: ${s.href}`);
      }
    }
  } catch (err) {
    githubSoftFail = true;
    githubSoftFailReason = String(err);
    console.log(`GitHub shelf: soft-fail exception — continuing (${String(err)})`);
  }


  // Wikidata DENY grounding AFTER GitHub — hygiene only; never Brief / never Pulse lead / never invent pins
  resetWikidataDenyTickState();
  let wikidataOk = false;
  let wikidataSoftFail = false;
  let wikidataSoftFailReason: string | undefined;
  let wikidataHints: WikidataDenyHint[] = [];
  let wikidataFromCache = false;
  let wikidataSearches = 0;
  let wikidataSeedsTried: string[] = [];
  try {
    const wd = await fetchWikidataDeny({
      cacheDir: resolveWikidataCacheDir(root),
    });
    wikidataHints = wd.hints;
    wikidataFromCache = wd.from_cache;
    wikidataSearches = wd.searches;
    wikidataSeedsTried = wd.seeds_tried;
    wikidataSoftFail = wd.soft_fail;
    wikidataSoftFailReason = wd.soft_fail_reason;
    wikidataOk = wd.ok;
    if (wd.soft_fail) {
      console.log(
        `Wikidata DENY: soft-fail (${wd.soft_fail_reason ?? "unknown"}) — continuing stamp (brief=false)`,
      );
    } else {
      console.log(
        `Wikidata DENY: seeds=${wd.seeds_tried.join(",")} hints=${wd.hints.length} cache=${wd.from_cache} searches=${wd.searches} brief=false`,
      );
      for (const h of wd.hints.slice(0, 4)) {
        console.log(
          `  wd ${h.seed} [${h.status}] qid=${h.qid ?? "null"} :: ${(h.label ?? "").slice(0, 56)}`,
        );
      }
    }
  } catch (err) {
    wikidataSoftFail = true;
    wikidataSoftFailReason = String(err);
    console.log(`Wikidata DENY: soft-fail exception — continuing (${String(err)})`);
  }

  const urls = loadUrlList();
  const scored = scoreUrlList(urls);
  const toolkitShelf = scored.shelf.length
    ? scored.shelf.map((s) => ({
        href: s.href,
        label: s.href.replace(/^https?:\/\//, "").slice(0, 72),
        reason:
          s.reason === "toolkit-github"
            ? ("toolkit-github" as const)
            : ("toolkit" as const),
      }))
    : KEPT_SHELF.filter(
          (s) =>
            s.reason !== "arxiv-shelf" &&
            s.reason !== "rss-lab-shelf" &&
            s.reason !== "rss-security-shelf" &&
            s.reason !== "github-search-shelf",
        ).map((s) => ({
        href: s.href,
        label: s.label,
        reason: s.reason as "toolkit" | "toolkit-github",
      }));
  const shelfItems = [
    ...toolkitShelf,
    ...arxivShelf,
    ...rssShelf,
    ...secShelf,
    ...githubShelf,
  ];
  const shelfDirty =
    scored.shelf.length > 0 ||
    arxivShelf.length > 0 ||
    rssShelf.length > 0 ||
    secShelf.length > 0 ||
    githubShelf.length > 0;
  console.log(
    `URL score: shelf=${scored.shelf.length} pulse=${scored.pulse.length} rest=${scored.rest.length} drop=${scored.dropped.length} arxivShelf=${arxivShelf.length} rssShelf=${rssShelf.length} secShelf=${secShelf.length} githubShelf=${githubShelf.length}`,
  );

  // ── Beat 2 crawl reliability: cross-source dedupe + seen-index + source health ledger ──
  const toIso = (v: string) => {
    const t = Date.parse(v);
    return Number.isFinite(t) ? new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") : v;
  };
  const pulseInputs: PulseInput[] = [
    ...(hnOk ? hnRows : HN_PULSE).map((r) => ({
      id: r.id,
      source: "hn-algolia" as const,
      title: r.text,
      url: r.url,
      at: toIso(r.at),
      score: r.score,
    })),
    ...(rssOk ? rssPulse : RSS_LABS.filter((r) => isLabItemRelevant({ lab: r.lab, link: r.link }))).map((r) => ({
      id: r.id,
      source: "rss-lab" as const,
      title: r.title,
      url: r.link,
      at: toIso(r.published),
      publisher: r.lab,
    })),
    ...(secOk ? secPulse : RSS_SECURITY).map((r) => ({
      id: r.id,
      source: "rss-security" as const,
      title: r.title,
      url: r.link,
      at: toIso(r.published),
      publisher: r.lab,
    })),
    ...(gnewsOk || gnewsSoftFail ? gnewsRows : GNEWS_RSS.filter((r) => isAiRelevantTitle(r.title))).map((r) => ({
      id: r.id,
      source: "gnews-rss" as const,
      title: r.title,
      url: r.link,
      at: toIso(r.published),
      publisher: r.publisher,
    })),
  ];
  // Beat 5: GNews corroborators — pool items (beyond the display cap) whose headline directly
  // matches an HN/lab/security item under the same v2 rules. ≤3 per anchor. Never Brief · GNews-last lead.
  if (gnewsPool.length) {
    const toInput = (r: GnewsRssItem): PulseInput => ({
      id: r.id,
      source: "gnews-rss",
      title: r.title,
      url: r.link,
      at: toIso(r.published),
      publisher: r.publisher,
    });
    const shown = new Set(gnewsRows.map((r) => r.id));
    const picks = pickCorroborators(pulseInputs, gnewsPool.map(toInput), {
      perAnchor: GNEWS_CORROBORATORS_PER_ITEM,
      exclude: shown,
    });
    const byId = new Map(gnewsPool.map((r) => [r.id, r]));
    for (const p of picks) {
      const row = byId.get(p.item.id);
      if (!row) continue;
      gnewsRows.push(row);
      pulseInputs.push(toInput(row));
      gnewsCorroborators.push({ id: row.id, anchor_id: p.anchor_id, score: p.score, title: row.title, publisher: row.publisher, self_repost: p.self_repost });
    }
    console.log(
      `GNews corroborators: pool=${gnewsPool.length} picked=${picks.length} (≤${GNEWS_CORROBORATORS_PER_ITEM}/anchor, direct v2 match only)`,
    );
    for (const c of gnewsCorroborators.slice(0, 12)) {
      console.log(`  corroborates ${c.anchor_id} score=${c.score}${c.self_repost ? " SELF(0 src)" : ""} :: ${c.title.slice(0, 80)}`);
    }
  }
  const seenPath = resolve(root, "artifacts/sage/seen-index.json");
  const seenKey = (it: PulseInput) => canonicalizeUrl(it.url) || `id:${it.id}`;
  const seenIndex = markSeen(
    parseSeenIndex(readJson(seenPath)),
    pulseInputs.map((it) => ({ key: seenKey(it), title: it.title })),
    stamp,
  );
  for (const it of pulseInputs) it.first_seen = seenIndex.entries[seenKey(it)]?.first_seen;
  const clusters = clusterItems(pulseInputs, { stamp }).sort(
    (a, b) => b.sources.length - a.sources.length || (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0),
  );
  const cStats = clusterStats(pulseInputs.length, clusters);
  const rowMeta: MetaMap = new Map();
  for (const c of clusters) {
    for (const m of c.members) {
      rowMeta.set(m.id, {
        first_seen: m.first_seen,
        is_new: m.first_seen === stamp,
        cluster_id: c.id,
      });
    }
  }
  const newItems = pulseInputs.filter((it) => it.first_seen === stamp).length;
  console.log(
    `Dedupe: items_in=${cStats.items_in} clusters_out=${cStats.clusters_out} collapsed=${cStats.collapsed} multi_source=${cStats.multi_source} (independent; raw=${cStats.multi_source_raw} self_reposts=${cStats.self_reposts}) multi_member=${cStats.multi_member} threshold=${DEDUPE_THRESHOLD}`,
  );
  const multiSource = clusters.filter((c) => c.sources.length > 1);
  for (const c of multiSource) {
    console.log(`  multi [${c.sources.join("+")}] x${c.size} score=${c.score} :: ${c.title.slice(0, 80)}`);
  }
  for (const c of clusters.filter((c) => c.all_sources.length > c.sources.length)) {
    console.log(`  self-repost only [${c.all_sources.join("+")}→${c.sources.join("+")}] x${c.size} :: ${c.title.slice(0, 80)}`);
  }
  for (const c of clusters.filter((c) => c.size > 1 && c.sources.length === 1).slice(0, 5)) {
    console.log(`  same-source [${c.sources.join("+")}] x${c.size} score=${c.score} :: ${c.title.slice(0, 72)}`);
  }
  const topPairs = topCrossSourcePairs(pulseInputs, { limit: 400 });
  const nearMisses = topPairs.filter((p) => !p.match).slice(0, 8);
  const gnewsNearMisses = topPairs
    .filter((p) => !p.match && (p.a.source === "gnews-rss" || p.b.source === "gnews-rss"))
    .slice(0, 8);
  for (const p of gnewsNearMisses) {
    console.log(
      `  gnews near-miss ${p.score.toFixed(3)} ${p.blocked ?? "below"} h=${p.hours_apart ?? "?"} [${p.a.source}] ${p.a.title.slice(0, 56)} ‖ [${p.b.source}] ${p.b.title.slice(0, 56)}`,
    );
  }
  for (const p of nearMisses) {
    console.log(
      `  near-miss ${p.score.toFixed(3)} ${p.blocked ?? "below"} h=${p.hours_apart ?? "?"} [${p.a.source}] ${p.a.title.slice(0, 56)} ‖ [${p.b.source}] ${p.b.title.slice(0, 56)}`,
    );
  }
  console.log(`Seen-index: ${Object.keys(seenIndex.entries).length} keys · new this crawl=${newItems}`);

  const outcomes: SourceOutcome[] = [
    { id: "hf", ok: hfOk, items: hfLiveCount, reason: hfFailReason },
    { id: "arxiv", ok: !arxivFailReason, items: arxivCount + arxivShelf.length, reason: arxivFailReason },
    { id: "openalex", ok: !openalexSoftFail, items: openalexCount, reason: openalexSoftFailReason },
    { id: "crossref", ok: !crossrefSoftFail, items: crossrefCount, reason: crossrefSoftFailReason },
    { id: "hn", ok: hnOk, items: hnRows.length, reason: hnSoftFailReason ?? "no candidates" },
    { id: "rss_labs", ok: rssOk, items: rssPulse.length + rssShelf.length, reason: rssSoftFailReason ?? "no feeds ok" },
    { id: "rss_security", ok: secOk, items: secPulse.length + secShelf.length, reason: secFailReason },
    { id: "gnews", ok: gnewsOk, items: gnewsRows.length, reason: gnewsSoftFailReason ?? "empty" },
    { id: "github", ok: !githubSoftFail, items: githubShelf.length, reason: githubSoftFailReason },
    { id: "wikidata", ok: wikidataOk && !wikidataSoftFail, items: wikidataHints.length, reason: wikidataSoftFailReason ?? "not ok" },
  ];
  const healthPath = resolve(root, "artifacts/sage/source-health.json");
  const ledger = updateLedger(parseLedger(readJson(healthPath)), outcomes, stamp);
  const healthRows = summarizeLedger(ledger);
  console.log(
    `Source health: ${healthRows.map((r) => `${r.id}=${r.state}(ok${r.streak_ok}/fail${r.streak_fail},n=${r.items_last})`).join(" ")}`,
  );

  // Stamp pulse — job ran
  const crawlPath = resolve(root, "src/data/x-crawl.ts");
  const crawlSrc = readFileSync(crawlPath, "utf8");
  writeText(crawlPath, patchCrawlAt(crawlSrc, stamp));
  patchCurrentJson(resolve(root, "artifacts/sage/CURRENT.json"), stamp);

  if (hfOk || arxivOk || openalexOk || crossrefOk) {
    writeText(resolve(root, "src/data/papers.ts"), renderPapersTs(papers));
  }
  if (shelfDirty) {
    writeText(resolve(root, "src/data/shelf.ts"), renderShelfTs(shelfItems));
  }
  if (hnOk) {
    writeText(resolve(root, "src/data/hn-pulse.ts"), renderHnPulseTs(hnRows, stamp, rowMeta));
  }
  if (rssOk) {
    writeText(resolve(root, "src/data/rss-labs.ts"), renderRssLabsTs(rssPulse, stamp, rowMeta));
  }
  if (secOk) {
    writeText(
      resolve(root, "src/data/rss-security.ts"),
      renderRssSecurityTs(secPulse, stamp, rowMeta),
    );
  }
  if (gnewsOk || gnewsSoftFail) {
    writeText(resolve(root, "src/data/gnews-rss.ts"), renderGnewsRssTs(gnewsRows, stamp, rowMeta));
  }
  writeText(seenPath, `${JSON.stringify(seenIndex, null, 2)}\n`);
  writeText(healthPath, `${JSON.stringify(ledger, null, 2)}\n`);
  writeText(resolve(root, "src/data/source-health.ts"), renderSourceHealthTs(healthRows, stamp));
  writeText(resolve(root, "src/data/pulse-clusters.ts"), renderPulseClustersTs(clusters, cStats, stamp));

  const report = {
    schema: 1,
    cycle: "003",
    lead_id: "hf-incident",
    stamped_at: stamp,
    /** Headline: Pulse clusters with ≥2 INDEPENDENT sources (company self-reposts count 0). */
    multi_source_independent: cStats.multi_source_independent,
    stale_hours: STALE_HOURS,
    stale_guard_hours: STALE_GUARD_HOURS,
    dedupe: {
      ...cStats,
      version: 2,
      threshold: DEDUPE_THRESHOLD,
      window_hours: DEDUPE_WINDOW_HOURS,
      new_items: newItems,
      per_source: pulseInputs.reduce<Record<string, number>>((acc, it) => {
        acc[it.source] = (acc[it.source] ?? 0) + 1;
        return acc;
      }, {}),
      multi_source_clusters: multiSource.map((c) => ({
        title: c.title,
        sources: c.sources,
        size: c.size,
        score: c.score,
        members: c.members.map((m) => ({ id: m.id, source: m.source, title: m.title, at: m.at, publisher: m.publisher ?? null, ...(m.self_repost ? { self_repost: true } : {}) })),
      })),
      self_repost_clusters: clusters
        .filter((c) => c.members.some((m) => m.self_repost))
        .map((c) => ({
          title: c.title,
          sources: c.sources,
          all_sources: c.all_sources,
          self_reposts: c.members.filter((m) => m.self_repost).map((m) => ({ id: m.id, publisher: m.publisher ?? null, title: m.title })),
        })),
      ai_relevance: {
        rss_lab_dropped: rssAiDropped,
        gnews_shown_dropped: gnewsAiDropped,
        gnews_pool_dropped: gnewsPoolAiDropped,
        hn_dropped: hnAiDropped,
      },
      gnews_near_misses: gnewsNearMisses.map((p) => ({
        score: p.score,
        blocked: p.blocked ?? "below-threshold",
        hours_apart: p.hours_apart,
        a: p.a,
        b: p.b,
        shared: p.shared,
      })),
      near_misses: nearMisses.map((p) => ({
        score: p.score,
        blocked: p.blocked ?? "below-threshold",
        hours_apart: p.hours_apart,
        a: p.a,
        b: p.b,
        shared: p.shared,
      })),
    },
    source_health: healthRows.map((r) => ({ id: r.id, state: r.state, streak_ok: r.streak_ok, streak_fail: r.streak_fail, items_last: r.items_last })),
    age_check: crawlAgeHours(stamp),
    hf: { ok: hfOk, count: papers.length, url: HF_DAILY_PAPERS_URL },
    arxiv: {
      ok: arxivOk,
      enriched: arxivCount,
      shelf: arxivShelf.length,
      brief: false,
      url: "https://export.arxiv.org/api/query",
    },
    openalex: {
      ok: openalexOk,
      soft_fail: openalexSoftFail,
      soft_fail_reason: openalexSoftFailReason ?? null,
      enriched: openalexCount,
      secondary: openalexSecondary,
      query: openalexQuery,
      mode: openalexMode,
      from_cache: openalexFromCache,
      searches: openalexSearches,
      retries: openalexRetries,
      brief: false,
      pulse_lead: false,
      papers_enrich_only: true,
      url: OPENALEX_API,
      sample: papers
        .filter((p) => p.openalexId)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          openalexId: p.openalexId,
          year: p.year ?? null,
          doi: p.doi ?? null,
          enrichOnly: Boolean(p.openalexEnrichOnly),
        })),
    },
    crossref: {
      ok: crossrefOk,
      soft_fail: crossrefSoftFail,
      soft_fail_reason: crossrefSoftFailReason ?? null,
      enriched: crossrefCount,
      query: crossrefQuery,
      mode: crossrefMode,
      from_cache: crossrefFromCache,
      searches: crossrefSearches,
      brief: false,
      pulse_lead: false,
      papers_enrich_only: true,
      url: CROSSREF_API,
      merge_notes: crossrefMergeNotes,
      sample: papers
        .filter((p) => p.crossrefDoi)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          crossrefDoi: p.crossrefDoi,
          issued: p.crossrefIssued ?? null,
          type: p.crossrefType ?? null,
          openalexId: p.openalexId ?? null,
          doi: p.doi ?? null,
          enrichOnly: Boolean(p.crossrefEnrichOnly),
        })),
    },
    hn: {
      ok: hnOk,
      soft_fail: hnSoftFail,
      soft_fail_reason: hnSoftFailReason ?? null,
      count: hnRows.length,
      brief: false,
      pulse_only: true,
      never_displace_hf: true,
      queries_run: hnQueriesRun,
      queries_ok: hnQueriesOk,
      queries_soft_fail: hnQueriesSoftFail,
      recent_hours: HN_RECENT_WINDOW_HOURS,
      ai_only: true,
      ai_dropped: hnAiDropped,
      url: "https://hn.algolia.com/api/v1/search",
      sample: hnRows.slice(0, 3).map((h) => ({ id: h.id, tag: h.tag, score: h.score, text: h.text })),
    },
    rss: {
      ok: rssOk,
      soft_fail: rssSoftFail,
      soft_fail_reason: rssSoftFailReason ?? null,
      count: rssPulse.length,
      shelf: rssShelf.length,
      brief: false,
      pulse_only: true,
      never_displace_hf: true,
      feeds: rssFeedsOk,
      feeds_soft_fail: rssFeedsSoftFail,
      sample: rssPulse.slice(0, 4).map((r) => ({
        id: r.id,
        lab: r.lab,
        tag: r.tag,
        title: r.title,
        link: r.link,
      })),
    },
    rss_security: {
      ok: secOk,
      count: secPulse.length,
      shelf: secShelf.length,
      brief: false,
      pulse_only: true,
      digest_ref_ok: true,
      feeds: secFeedsOk,
      sample: secPulse.slice(0, 4).map((r) => ({
        id: r.id,
        lab: r.lab,
        tag: r.tag,
        title: r.title,
        link: r.link,
      })),
    },
    google_news: {
      ok: gnewsOk,
      soft_fail: gnewsSoftFail,
      soft_fail_reason: gnewsSoftFailReason ?? null,
      queries_attempted: gnewsQueriesAttempted,
      queries_ok: gnewsQueriesOkCount,
      items: gnewsRows.length,
      pool: gnewsPool.length,
      corroborators: gnewsCorroborators,
      http_status: gnewsHttpStatus,
      content_type: gnewsContentType,
      format: gnewsFormat,
      from_cache: gnewsFromCache,
      brief: false,
      pulse_lead: false,
      briefEligible: false,
      pulseLeadEligible: false,
      never_sole_lead: true,
      pulse_only: true,
      url_template: "https://news.google.com/rss/search?q={QUERY}&hl=en-US&gl=US&ceid=US:en",
      queried: gnewsQueriesRun,
      queries_ok_list: gnewsQueriesOk,
      queries_soft_fail: gnewsQueriesSoftFail,
      sample: gnewsRows.slice(0, 3).map((r) => ({
        id: r.id,
        title: r.title,
        publisher: r.publisher,
        link: r.link,
        tag: r.tag,
      })),
    },
    x: {
      fetched: 0,
      skipped: true as const,
      disabled: true as const,
      handles: handleQs.length,
      semantic: semanticQs.length,
      plug_in: xEnv.docs,
    },
    github: {
      ok: githubOk,
      soft_fail: githubSoftFail,
      soft_fail_reason: githubSoftFailReason ?? null,
      query: githubQuery,
      shelf: githubShelf.length,
      from_cache: githubFromCache,
      searches: githubSearches,
      rate_limit_remaining: githubRateRemaining,
      brief: false,
      pulse_lead: false,
      shelf_only: true,
      url: "https://api.github.com/search/repositories",
      sample: githubShelf.slice(0, 3).map((s) => ({
        label: s.label,
        href: s.href,
      })),
    },
    shelf: { count: shelfItems.length, brief: false },
    wikidata: {
      ok: wikidataOk,
      soft_fail: wikidataSoftFail,
      soft_fail_reason: wikidataSoftFailReason ?? null,
      seeds: wikidataSeedsTried,
      searches: wikidataSearches,
      from_cache: wikidataFromCache,
      brief: false,
      pulse_lead: false,
      deny_grounding_only: true,
      url: WIKIDATA_API,
      hints: wikidataHints.map((h) => ({
        seed: h.seed,
        qid: h.qid,
        label: h.label,
        description: h.description,
        status: h.status,
        source: h.source,
        briefEligible: false as const,
        pulseLeadEligible: false as const,
        denyGroundingOnly: true as const,
      })),
    },
    locks: {
      cycle: "003",
      lead: "hf-incident",
      no_zapier: true,
      no_paid_x: true,
      green_token: "--phosphor",
      stale_class: ".sage-stale",
    },
  };
  writeText(
    resolve(root, "artifacts/sage/ingest-last.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  const proof = crawlAgeHours(stamp);
  console.log(
    proof.stale
      ? `STALE proof: age ${proof.hours.toFixed(2)}h > ${STALE_HOURS}h → .sage-stale`
      : `STALE proof: fresh stamp age ${proof.hours.toFixed(2)}h ≤ ${STALE_HOURS}h (banner clear)`,
  );
  console.log("Done. Pulse reads CRAWL_AT; banner uses crawlAgeHours + .sage-stale.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
