/**
 * arXiv Atom enrichment — free/public only.
 * GET https://export.arxiv.org/api/query · never Brief pins · cycle stays 003.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Paper } from "./ingest/papers";

export const ARXIV_API = "https://export.arxiv.org/api/query";
export const ARXIV_UA = "NEXUS-SAGE-desk/0.2 (free-ingest; contact: local)";
export const ARXIV_MIN_INTERVAL_MS = 3_000;
export const ARXIV_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const ARXIV_MAX_RESULTS = 25;

export type ArxivEnrichment = {
  id: string;
  title: string;
  summary: string;
  published: string;
  authors: string[];
  primaryCategory: string;
  absUrl: string;
  pdfUrl: string;
  source: "arxiv-api";
  shelfOnly: true;
};

export type ArxivShelfItem = {
  href: string;
  label: string;
  reason: "arxiv-shelf";
  shelfOnly: true;
  id: string;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/arxiv-cache",
);

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Normalize arXiv id: strip version / URL → "2401.12345" or "hep-th/9901001". */
export function normalizeArxivId(raw: string): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const fromUrl = s.match(
    /arxiv\.org\/(?:abs|pdf)\/([a-zA-Z0-9.\-/]+?)(?:v\d+)?(?:\.pdf)?$/i,
  );
  let id = fromUrl ? fromUrl[1]! : s;
  id = id.replace(/^arxiv:/i, "").replace(/v\d+$/i, "").trim();
  // New-style YYYY.NNNNN or legacy archive/NNNNNNN
  if (!/^\d{4}\.\d{4,5}$/.test(id) && !/^[a-z-]+\/\d{7}$/i.test(id)) {
    return null;
  }
  return id;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]!) : "";
}

function allAuthorNames(block: string): string[] {
  const names: string[] = [];
  const re = /<author>([\s\S]*?)<\/author>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const name = firstTag(m[1]!, "name");
    if (name) names.push(name);
  }
  return names.slice(0, 8);
}

function linkHref(block: string, rel: string, typeHint?: string): string {
  const re = /<link\b([^>]*?)\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const attrs = m[1]!;
    const relM = attrs.match(/\brel="([^"]*)"/i);
    const hrefM = attrs.match(/\bhref="([^"]*)"/i);
    const typeM = attrs.match(/\btype="([^"]*)"/i);
    if (!hrefM) continue;
    if (relM && relM[1] === rel) {
      if (typeHint && typeM && !typeM[1]!.includes(typeHint)) continue;
      return hrefM[1]!;
    }
  }
  return "";
}

function primaryCategory(block: string): string {
  const m = block.match(
    /<arxiv:primary_category\b[^>]*\bterm="([^"]+)"/i,
  );
  if (m) return m[1]!;
  const cat = block.match(/<category\b[^>]*\bterm="([^"]+)"/i);
  return cat ? cat[1]! : "";
}

function toIso(published: string): string {
  if (!published) return new Date(0).toISOString().replace(/\.\d{3}Z$/, "Z");
  const d = new Date(published);
  if (Number.isNaN(d.getTime())) return published;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Parse Atom feed XML → ArxivEnrichment rows. Malformed ids skipped. */
export function parseAtomEntries(atomXml: string): ArxivEnrichment[] {
  if (!atomXml || typeof atomXml !== "string") return [];
  const out: ArxivEnrichment[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(atomXml))) {
    const block = m[1]!;
    const rawId = firstTag(block, "id");
    const id = normalizeArxivId(rawId);
    if (!id) continue;
    const title = firstTag(block, "title");
    const summary = firstTag(block, "summary");
    const published = toIso(firstTag(block, "published") || firstTag(block, "updated"));
    let absUrl = linkHref(block, "alternate", "html");
    let pdfUrl = linkHref(block, "related", "pdf");
    if (!absUrl) absUrl = `https://arxiv.org/abs/${id}`;
    if (!pdfUrl) pdfUrl = `https://arxiv.org/pdf/${id}`;
    // Prefer unversioned canonical URLs
    absUrl = absUrl.replace(/v\d+$/i, "").replace("http://", "https://");
    pdfUrl = pdfUrl.replace(/v\d+$/i, "").replace("http://", "https://");
    out.push({
      id,
      title,
      summary,
      published,
      authors: allAuthorNames(block),
      primaryCategory: primaryCategory(block),
      absUrl,
      pdfUrl,
      source: "arxiv-api",
      shelfOnly: true,
    });
  }
  return out;
}

function cachePath(cacheDir: string, id: string): string {
  const safe = id.replace(/[^\w.-]+/g, "_");
  return resolve(cacheDir, `${safe}.atom.xml`);
}

function readCache(
  cacheDir: string,
  id: string,
  now = Date.now(),
): string | null {
  const p = cachePath(cacheDir, id);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf8");
    // optional header: <!-- cached_at:ISO -->
    const stamp = raw.match(/^<!--\s*cached_at:([^\s]+)\s*-->/);
    if (stamp) {
      const t = Date.parse(stamp[1]!);
      if (Number.isFinite(t) && now - t > ARXIV_CACHE_TTL_MS) return null;
      return raw.replace(/^<!--[\s\S]*?-->\s*/, "");
    }
    return raw;
  } catch {
    return null;
  }
}

function writeCache(cacheDir: string, id: string, atom: string, now = Date.now()) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(cachePath(cacheDir, id), `<!-- cached_at:${iso} -->\n${atom}`);
}

async function throttle(): Promise<void> {
  const gap = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && gap < ARXIV_MIN_INTERVAL_MS) {
    await sleep(ARXIV_MIN_INTERVAL_MS - gap);
  }
}

async function getAtom(
  url: string,
  opts: { alreadyRetried429?: boolean } = {},
): Promise<{ ok: true; body: string } | { ok: false; status: number; skip: boolean }> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": ARXIV_UA,
    },
  });
  const body = await res.text();
  if (res.status === 429 || /Rate exceeded/i.test(body)) {
    if (!opts.alreadyRetried429) {
      await sleep(10_000);
      return getAtom(url, { alreadyRetried429: true });
    }
    return { ok: false, status: 429, skip: true };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, skip: true };
  }
  return { ok: true, body };
}

export type FetchArxivOpts = {
  cacheDir?: string;
  maxResults?: number;
  /** Inject Atom XML (tests / offline). Skips network. */
  fixtureAtom?: string;
  now?: number;
};

/**
 * Fetch enrichments for known arXiv ids (HF papers).
 * Batches id_list ≤25; disk cache 24h; ≤1 req / 3s; 429 → wait 10s once then skip.
 */
export async function fetchArxivByIds(
  ids: string[],
  opts: FetchArxivOpts = {},
): Promise<ArxivEnrichment[]> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const maxResults = Math.min(
    ARXIV_MAX_RESULTS,
    Math.max(1, opts.maxResults ?? ARXIV_MAX_RESULTS),
  );
  const now = opts.now ?? Date.now();

  if (opts.fixtureAtom) {
    return parseAtomEntries(opts.fixtureAtom);
  }

  const wanted: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = normalizeArxivId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    wanted.push(id);
  }
  if (!wanted.length) return [];

  const fromCache: ArxivEnrichment[] = [];
  const missing: string[] = [];
  for (const id of wanted.slice(0, maxResults)) {
    const cached = readCache(cacheDir, id, now);
    if (cached) {
      const parsed = parseAtomEntries(cached);
      const hit = parsed.find((e) => e.id === id) ?? parsed[0];
      if (hit) {
        fromCache.push({ ...hit, id, shelfOnly: true, source: "arxiv-api" });
        continue;
      }
    }
    missing.push(id);
  }

  if (!missing.length) return fromCache;

  const idList = missing.slice(0, maxResults).join(",");
  const url = `${ARXIV_API}?id_list=${encodeURIComponent(idList)}&start=0&max_results=${Math.min(maxResults, missing.length)}`;

  let live: ArxivEnrichment[] = [];
  try {
    const res = await getAtom(url);
    if (!res.ok) {
      console.log(`arXiv: HTTP ${res.status} — skip live enrich (cache hits=${fromCache.length})`);
      return fromCache;
    }
    live = parseAtomEntries(res.body);
    // Cache per-id slices for 24h
    for (const e of live) {
      const entryXml = extractEntryXml(res.body, e.id) ?? wrapAsFeed(res.body);
      writeCache(cacheDir, e.id, entryXml, now);
    }
  } catch (err) {
    console.log(`arXiv: fetch failed — ${String(err)}`);
    return fromCache;
  }

  const byId = new Map<string, ArxivEnrichment>();
  for (const e of fromCache) byId.set(e.id, e);
  for (const e of live) byId.set(e.id, e);
  return wanted.map((id) => byId.get(id)).filter(Boolean) as ArxivEnrichment[];
}

function extractEntryXml(feed: string, id: string): string | null {
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(feed))) {
    const block = m[0]!;
    const rawId = firstTag(m[1]!, "id");
    if (normalizeArxivId(rawId) === id) {
      return `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${block}</feed>`;
    }
  }
  return null;
}

function wrapAsFeed(body: string): string {
  return body;
}

/** Optional search fill — shelfOnly. Hard cap max_results≤25. */
export async function fetchArxivSearch(
  opts: FetchArxivOpts & {
    searchQuery?: string;
  } = {},
): Promise<ArxivEnrichment[]> {
  if (opts.fixtureAtom) return parseAtomEntries(opts.fixtureAtom);
  const maxResults = Math.min(
    ARXIV_MAX_RESULTS,
    Math.max(1, opts.maxResults ?? 10),
  );
  const q =
    opts.searchQuery ??
    "cat:cs.AI OR cat:cs.LG OR cat:cs.CL";
  const url =
    `${ARXIV_API}?search_query=${encodeURIComponent(q)}` +
    `&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${maxResults}`;
  try {
    const res = await getAtom(url);
    if (!res.ok) {
      console.log(`arXiv search: HTTP ${res.status} — skip`);
      return [];
    }
    return parseAtomEntries(res.body);
  } catch (err) {
    console.log(`arXiv search: failed — ${String(err)}`);
    return [];
  }
}

/**
 * Search hits not already in HF keeps → shelf scoring items.
 * Always shelfOnly; never Brief-eligible.
 */
export function toShelfItems(
  enrichments: ArxivEnrichment[],
  keepIds: Iterable<string> = [],
): ArxivShelfItem[] {
  const keep = new Set(
    [...keepIds].map((x) => normalizeArxivId(x) ?? x).filter(Boolean),
  );
  const out: ArxivShelfItem[] = [];
  const seen = new Set<string>();
  for (const e of enrichments) {
    if (!e.shelfOnly) continue; // locked path
    if (keep.has(e.id)) continue;
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push({
      href: e.absUrl,
      label: `arxiv.org/abs/${e.id}`,
      reason: "arxiv-shelf",
      shelfOnly: true,
      id: e.id,
    });
  }
  return out;
}

/** Merge arXiv abstracts / abs+pdf links onto existing Paper rows (order preserved). */
export function applyArxivEnrichment(
  papers: Paper[],
  enrichments: ArxivEnrichment[],
): Paper[] {
  const byId = new Map(enrichments.map((e) => [e.id, e]));
  return papers.map((p) => {
    const id = normalizeArxivId(p.id) ?? p.id;
    const e = byId.get(id);
    if (!e) return p;
    return {
      ...p,
      title: p.title || e.title,
      href: e.absUrl || p.href,
      abstract: e.summary
        ? e.summary.slice(0, 800)
        : p.abstract,
      pdfUrl: e.pdfUrl,
      authors: e.authors,
      primaryCategory: e.primaryCategory,
    };
  });
}

/** Hard gate: arXiv enrichments must never become Brief pins. */
export function isArxivBriefEligible(_item?: ArxivEnrichment | ArxivShelfItem): false {
  void _item;
  return false;
}

export function resolveArxivCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/arxiv-cache");
  return DEFAULT_CACHE_DIR;
}
