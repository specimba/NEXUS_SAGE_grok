/**
 * Google News RSS spice — FREE-PULSE P5.
 * GET https://news.google.com/rss/search?q=…&hl=en-US&gl=US&ceid=US:en
 * Pulse quiet shelf only · never Brief · never sole Pulse lead · cycle stays 003 · lead hf-incident.
 * Standing ≤6 · rotate ≤2/tick · soft_fail on format-break/empty/403/429 · free only.
 * DENY: paid X · Bluesky · Reddit · scrape farms · Sol/Astra/incident standing · topic-ID invent.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPost, type PostClass } from "./x-hygiene";
import { assertNoIncidentNouns, INCIDENT_NOUNS } from "./ingest/queries";
import { looksLikeHtml, parseRssOrAtom, type ParsedFeedEntry } from "./rss-labs";

export const GNEWS_SEARCH_TEMPLATE =
  "https://news.google.com/rss/search?q={QUERY}&hl=en-US&gl=US&ceid=US:en";
export const GNEWS_UA = "NEXUS-SAGE-desk/0.2 (free-ingest; gnews-rss; compatible; NexusSageScout/1.0)";
export const GNEWS_MIN_INTERVAL_MS = 2_000;
export const GNEWS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** Cap standing allowlist (Scout SCOUT-P5-GOOGLE-NEWS-RSS). */
export const GNEWS_WATCHLIST_MAX = 6;
/** Rotate ≤2 queries per ingest tick. */
export const GNEWS_QUERIES_PER_TICK = 2;
/** Display / keep cap on Pulse quiet shelf. */
export const GNEWS_DISPLAY_CAP = 8;
export const GNEWS_DISPLAY_CAP_MIN = 6;

/**
 * Scout allowlist — URL-decoded standing forms (encode at fetch).
 * No Sol/Astra/incident nouns · no Bluesky · no crypto spam.
 */
export const GNEWS_WATCHLIST_QUERIES = [
  "Hugging Face",
  "OpenAI",
  "Anthropic",
  "large language model",
  "AI agent",
  "open weights",
] as const;

/** Banned as standing Google News queries (Scout EXCLUDE). */
export const GNEWS_STANDING_BAN = [
  "sol",
  "astra",
  "persistent sol",
  "hf breach",
  "jailbreak",
  "bluesky",
] as const;

export type GnewsRssItem = {
  id: string;
  title: string;
  link: string;
  guid: string;
  published: string;
  summary: string;
  publisher: string;
  query: string;
  source: "gnews-rss";
  shelfOnly: true;
  pulseEligible: true;
  briefEligible: false;
  pulseLeadEligible: false;
  class: PostClass;
  tag: "rest" | "rumor" | "companion" | "incident";
  reasons: string[];
};

export type GnewsQuerySoftFail = {
  query: string;
  reason: string;
  soft_fail: true;
  http_status?: number | null;
  content_type?: string | null;
  format?: string | null;
};

export type FetchGnewsResult = {
  items: GnewsRssItem[];
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  queries_attempted: number;
  queries_ok: number;
  queries_run: string[];
  queries_ok_list: string[];
  queries_soft_fail: GnewsQuerySoftFail[];
  items_kept: number;
  http_status: number | null;
  content_type: string | null;
  format: string | null;
  brief: false;
  briefEligible: false;
  pulse_lead: false;
  pulseLeadEligible: false;
  pulse_only: true;
  never_sole_lead: true;
  url_template: string;
  from_cache: boolean;
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/gnews-cache",
);

let lastRequestAt = 0;
let queryRotateOffset = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Test helper — advance rotate cursor. */
export function setGnewsQueryRotateOffset(n: number) {
  queryRotateOffset = Math.max(0, Math.floor(n));
}

export function resetGnewsTickState() {
  lastRequestAt = 0;
  queryRotateOffset = 0;
}

export function queryHash(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function itemId(linkOrGuid: string): string {
  return createHash("sha256").update(linkOrGuid.trim()).digest("hex").slice(0, 16);
}

export function resolveGnewsCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/gnews-cache");
  return DEFAULT_CACHE_DIR;
}

/** Build canonical search URL — always emit hl · gl · ceid. */
export function buildGnewsSearchUrl(query: string): string {
  const q = String(query ?? "").trim();
  if (!q) throw new Error("gnews query empty");
  // Prefer + for spaces (Scout verified); encodeURIComponent then restore +
  const encoded = encodeURIComponent(q).replace(/%20/g, "+");
  return GNEWS_SEARCH_TEMPLATE.replace("{QUERY}", encoded);
}

function cachePath(cacheDir: string, query: string): string {
  return resolve(cacheDir, `${queryHash(query)}.xml`);
}

function readCache(
  cacheDir: string,
  query: string,
  now = Date.now(),
): string | null {
  const p = cachePath(cacheDir, query);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf8");
    const stamp = raw.match(/^<!--\s*cached_at:([^\s]+)\s*-->/);
    if (stamp) {
      const t = Date.parse(stamp[1]!);
      if (Number.isFinite(t) && now - t > GNEWS_CACHE_TTL_MS) return null;
      return raw.replace(/^<!--[\s\S]*?-->\s*/, "");
    }
    return raw;
  } catch {
    return null;
  }
}

function writeCache(cacheDir: string, query: string, xml: string, now = Date.now()) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(cachePath(cacheDir, query), `<!-- cached_at:${iso} -->\n${xml}`);
}

async function throttle(): Promise<void> {
  const gap = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && gap < GNEWS_MIN_INTERVAL_MS) {
    await sleep(GNEWS_MIN_INTERVAL_MS - gap);
  }
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
    .replace(/&amp;/g, "&");
}

function stripHtml(text: string): string {
  return decodeXmlEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTagRaw(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]!).trim() : "";
}

function publisherFromItem(block: string): string {
  // <source url="...">Publisher</source>
  const m = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);
  if (m?.[1]) return stripHtml(m[1]);
  return "";
}

function clipSummary(s: string, max = 280): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

function toIso(published: string): string {
  if (!published) return new Date(0).toISOString().replace(/\.\d{3}Z$/, "Z");
  const d = new Date(published);
  if (Number.isNaN(d.getTime())) return published;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Reject Sol/Astra/jailbreak/etc as standing Google News queries. */
export function assertGnewsStandingSafe(query: string): void {
  assertNoIncidentNouns(query);
  const lower = String(query ?? "").trim().toLowerCase();
  for (const ban of GNEWS_STANDING_BAN) {
    if (lower === ban || lower === ban.replace(/\s+/g, "-") || lower === ban.replace(/\s+/g, "+")) {
      throw new Error(`GNews standing search must not include banned noun: ${ban}`);
    }
  }
}

/** Standing queries: allowlist only; throw if incident/ban nouns sneak in. Cap ≤6. */
export function gnewsStandingQueries(
  queries: readonly string[] = GNEWS_WATCHLIST_QUERIES,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const trimmed = String(q ?? "").trim();
    if (!trimmed) continue;
    assertGnewsStandingSafe(trimmed);
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  if (out.length > GNEWS_WATCHLIST_MAX) {
    return out.slice(0, GNEWS_WATCHLIST_MAX);
  }
  return out;
}

/**
 * Rotate ≤2 queries / ingest tick across the standing allowlist.
 * Day-bucket + optional test offset (HN/Wikidata-style).
 */
export function pickGnewsQueriesForTick(
  now = Date.now(),
  max = GNEWS_QUERIES_PER_TICK,
  queries: readonly string[] = GNEWS_WATCHLIST_QUERIES,
): string[] {
  const list = gnewsStandingQueries(queries);
  if (!list.length) return [];
  const n = Math.min(Math.max(1, max), GNEWS_QUERIES_PER_TICK, list.length);
  const day = Math.floor(now / 86_400_000);
  const start = (day + queryRotateOffset) % list.length;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(list[(start + i) % list.length]!);
  }
  return out;
}

/** Confirm standing query set never includes incident / ban nouns (lock). */
export function gnewsQueriesSafe(
  queries: readonly string[] = GNEWS_WATCHLIST_QUERIES,
): boolean {
  try {
    if (queries.length > GNEWS_WATCHLIST_MAX) return false;
    gnewsStandingQueries(queries);
    for (const q of queries) {
      const lower = q.toLowerCase();
      for (const n of INCIDENT_NOUNS) {
        if (lower.includes(n.toLowerCase())) return false;
      }
      for (const ban of GNEWS_STANDING_BAN) {
        if (
          lower === ban ||
          lower === ban.replace(/\s+/g, "-") ||
          lower === ban.replace(/\s+/g, "+")
        ) {
          return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Sniff RSS 2.0 — CT alone is not enough (P2 lesson). */
export function looksLikeRss(body: string): boolean {
  if (!body || typeof body !== "string") return false;
  const head = body.slice(0, 1200).toLowerCase();
  return head.includes("<rss") || (head.includes("<channel") && head.includes("<item"));
}

/**
 * Map parsed entries → GnewsRssItem.
 * classifyPost / DENY / Sol≠Astra → drop.
 * briefEligible + pulseLeadEligible always false.
 * Links may be Google redirect URLs — store as-is (no publisher unwrap).
 */
export function toGnewsItems(
  entries: ParsedFeedEntry[],
  query: string,
  publishers?: Map<string, string>,
): GnewsRssItem[] {
  const out: GnewsRssItem[] = [];
  const seen = new Set<string>();

  for (const e of entries) {
    const title = String(e.title ?? "").trim();
    const link = String(e.link ?? "").trim();
    if (!title || !link) continue;
    const guid = String(e.guid || link).trim();
    const idKey = guid || `${title}|${link}`;
    const id = `gnews:${itemId(idKey)}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const classified = classifyPost({
      text: `${title} ${e.summary ?? ""}`,
      handle: "gnews",
    });

    if (classified.flatten || classified.class === "flatten") continue;
    if (classified.class === "drop") continue;

    let tag: GnewsRssItem["tag"] = "rest";
    if (classified.class === "rumor" || classified.rumor) tag = "rumor";
    else if (classified.class === "companion") tag = "companion";
    else if (classified.class === "incident") tag = "incident";

    const publisher = publishers?.get(guid) || publishers?.get(link) || "";

    out.push({
      id,
      title,
      link,
      guid,
      published: e.published || toIso(""),
      summary: clipSummary(e.summary ?? ""),
      publisher,
      query,
      source: "gnews-rss",
      shelfOnly: true,
      pulseEligible: true,
      briefEligible: false,
      pulseLeadEligible: false,
      class: classified.class,
      tag,
      reasons: classified.reasons,
    });
  }

  return out.sort((a, b) => b.published.localeCompare(a.published));
}

/** Parse Google News RSS and extract publisher from `<source>`. */
export function parseGnewsRss(xml: string): {
  entries: ParsedFeedEntry[];
  publishers: Map<string, string>;
} {
  const publishers = new Map<string, string>();
  if (!xml || typeof xml !== "string") return { entries: [], publishers };
  if (looksLikeHtml(xml) && !looksLikeRss(xml)) {
    return { entries: [], publishers };
  }

  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1]!;
    const guid = firstTagRaw(block, "guid") || firstTagRaw(block, "link");
    const link = firstTagRaw(block, "link") || guid;
    const pub = publisherFromItem(block);
    if (pub && guid) publishers.set(guid, pub);
    if (pub && link) publishers.set(link, pub);
  }

  const entries = parseRssOrAtom(xml);
  return { entries, publishers };
}

/** Hard gate: Google News never Brief lead/companion pin. */
export function isGnewsBriefEligible(_item?: GnewsRssItem): false {
  void _item;
  return false;
}

/** Hard gate: Google News never sole Pulse lead. */
export function isGnewsPulseLeadEligible(_item?: GnewsRssItem): false {
  void _item;
  return false;
}

/** Cap display 6–8 (newest first, already sorted). De-dupe by guid / title+publisher. */
export function capGnewsDisplay(
  items: GnewsRssItem[],
  cap = GNEWS_DISPLAY_CAP,
): GnewsRssItem[] {
  const n = Math.min(Math.max(GNEWS_DISPLAY_CAP_MIN, 1), Math.max(1, Math.min(cap, GNEWS_DISPLAY_CAP)));
  // Allow caller to pass 6–8; clamp into [1, 8] with preferred max 8
  const limit = Math.min(8, Math.max(1, cap));
  void n;
  const seen = new Set<string>();
  const out: GnewsRssItem[] = [];
  for (const it of items) {
    const dedupeKey = `${it.guid || it.link}|${it.title.toLowerCase()}|${it.publisher.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(it);
    if (out.length >= limit) break;
  }
  return out;
}

export type FetchGnewsOpts = {
  cacheDir?: string;
  queries?: readonly string[];
  /** Inject XML by query (tests / offline). Skips network for that query. */
  fixtures?: Record<string, string>;
  /** Single fixture XML applied to first query (tests). */
  fixtureXml?: string;
  now?: number;
  /** Cap queries this tick (default GNEWS_QUERIES_PER_TICK). */
  maxQueries?: number;
  /** Skip rotate — run full standing set (tests only). */
  runAllQueries?: boolean;
  /** Test: force every live query to soft-fail with this status. */
  forceSoftFail?: 403 | 404 | 429 | 500;
  /** Optional fetch override (tests). */
  fetchImpl?: typeof fetch;
  /** Display cap (default 8). */
  displayCap?: number;
};

async function getXml(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<
  | { ok: true; body: string; status: number; contentType: string | null }
  | { ok: false; status: number; reason: string; contentType: string | null; body?: string }
> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent": GNEWS_UA,
    },
  });
  const contentType = res.headers.get("content-type");
  const body = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      reason: `HTTP ${res.status}`,
      contentType,
      body,
    };
  }
  if (looksLikeHtml(body) && !looksLikeRss(body)) {
    return {
      ok: false,
      status: res.status,
      reason: "html_body",
      contentType,
      body,
    };
  }
  if (!looksLikeRss(body)) {
    return {
      ok: false,
      status: res.status,
      reason: "parse_error",
      contentType,
      body,
    };
  }
  return { ok: true, body, status: res.status, contentType };
}

function softFailReasonFromQueries(fails: GnewsQuerySoftFail[]): string | undefined {
  if (!fails.length) return undefined;
  return fails.map((f) => `${f.query}:${f.reason}`).join("; ");
}

/**
 * Fetch Google News RSS spice for allowlisted queries.
 * ≤1 req/2s · cache 6h by query hash · rotate ≤2/tick ·
 * format-break/empty/403/429 → soft_fail · never Brief · never sole lead.
 */
export async function fetchGnewsRss(
  opts: FetchGnewsOpts = {},
): Promise<FetchGnewsResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const displayCap = opts.displayCap ?? GNEWS_DISPLAY_CAP;
  const url_template = GNEWS_SEARCH_TEMPLATE;

  const emptyResult = (
    partial: Partial<FetchGnewsResult> & {
      soft_fail: boolean;
      soft_fail_reason?: string;
      queries_run?: string[];
      queries_soft_fail?: GnewsQuerySoftFail[];
    },
  ): FetchGnewsResult => ({
    items: [],
    ok: false,
    soft_fail: partial.soft_fail,
    soft_fail_reason: partial.soft_fail_reason,
    queries_attempted: partial.queries_attempted ?? (partial.queries_run?.length ?? 0),
    queries_ok: partial.queries_ok ?? 0,
    queries_run: partial.queries_run ?? [],
    queries_ok_list: partial.queries_ok_list ?? [],
    queries_soft_fail: partial.queries_soft_fail ?? [],
    items_kept: 0,
    http_status: partial.http_status ?? null,
    content_type: partial.content_type ?? null,
    format: partial.format ?? null,
    brief: false,
    briefEligible: false,
    pulse_lead: false,
    pulseLeadEligible: false,
    pulse_only: true,
    never_sole_lead: true,
    url_template,
    from_cache: partial.from_cache ?? false,
  });

  if (opts.fixtureXml) {
    if (looksLikeHtml(opts.fixtureXml) && !looksLikeRss(opts.fixtureXml)) {
      return emptyResult({
        soft_fail: true,
        soft_fail_reason: "html_body",
        queries_run: ["(fixture)"],
        queries_soft_fail: [
          { query: "(fixture)", reason: "html_body", soft_fail: true, format: "html" },
        ],
        format: "html",
        http_status: 200,
      });
    }
    let parsed: { entries: ParsedFeedEntry[]; publishers: Map<string, string> };
    try {
      parsed = parseGnewsRss(opts.fixtureXml);
    } catch {
      return emptyResult({
        soft_fail: true,
        soft_fail_reason: "parse_error",
        queries_run: ["(fixture)"],
        queries_soft_fail: [
          { query: "(fixture)", reason: "parse_error", soft_fail: true, format: "unknown" },
        ],
        format: "unknown",
      });
    }
    if (!parsed.entries.length) {
      return emptyResult({
        soft_fail: true,
        soft_fail_reason: "empty_channel",
        queries_run: ["(fixture)"],
        queries_ok: 0,
        queries_soft_fail: [
          {
            query: "(fixture)",
            reason: "empty_channel",
            soft_fail: true,
            format: "empty",
          },
        ],
        format: "empty",
        http_status: 200,
      });
    }
    const mapped = toGnewsItems(parsed.entries, "(fixture)", parsed.publishers);
    const items = capGnewsDisplay(mapped, displayCap);
    return {
      items,
      ok: items.length > 0,
      soft_fail: false,
      queries_attempted: 1,
      queries_ok: 1,
      queries_run: ["(fixture)"],
      queries_ok_list: ["(fixture)"],
      queries_soft_fail: [],
      items_kept: items.length,
      http_status: 200,
      content_type: "application/xml",
      format: "rss2",
      brief: false,
      briefEligible: false,
      pulse_lead: false,
      pulseLeadEligible: false,
      pulse_only: true,
      never_sole_lead: true,
      url_template,
      from_cache: false,
    };
  }

  const standing = gnewsStandingQueries(opts.queries ?? GNEWS_WATCHLIST_QUERIES);
  const queries = opts.runAllQueries
    ? standing.slice(0, GNEWS_WATCHLIST_MAX)
    : pickGnewsQueriesForTick(now, opts.maxQueries ?? GNEWS_QUERIES_PER_TICK, standing);

  const all: GnewsRssItem[] = [];
  const seenIds = new Set<string>();
  const queries_ok_list: string[] = [];
  const queries_soft_fail: GnewsQuerySoftFail[] = [];
  let from_cache = false;
  let lastHttp: number | null = null;
  let lastCt: string | null = null;
  let lastFormat: string | null = null;

  for (const query of queries) {
    if (opts.forceSoftFail) {
      const reason = `HTTP ${opts.forceSoftFail}`;
      console.log(`GNews: soft_fail query="${query}" — ${reason}`);
      queries_soft_fail.push({
        query,
        reason,
        soft_fail: true,
        http_status: opts.forceSoftFail,
        format: "unknown",
      });
      lastHttp = opts.forceSoftFail;
      continue;
    }

    if (opts.fixtures && Object.prototype.hasOwnProperty.call(opts.fixtures, query)) {
      const raw = opts.fixtures[query];
      if (raw == null || raw === "") {
        queries_soft_fail.push({
          query,
          reason: "empty_channel",
          soft_fail: true,
          format: "empty",
        });
        lastFormat = "empty";
        continue;
      }
      if (looksLikeHtml(raw) && !looksLikeRss(raw)) {
        queries_soft_fail.push({
          query,
          reason: "html_body",
          soft_fail: true,
          format: "html",
        });
        lastFormat = "html";
        continue;
      }
      let parsed: { entries: ParsedFeedEntry[]; publishers: Map<string, string> };
      try {
        parsed = parseGnewsRss(raw);
      } catch {
        queries_soft_fail.push({
          query,
          reason: "parse_error",
          soft_fail: true,
          format: "unknown",
        });
        lastFormat = "unknown";
        continue;
      }
      if (!parsed.entries.length) {
        queries_soft_fail.push({
          query,
          reason: "empty_channel",
          soft_fail: true,
          format: "empty",
        });
        lastFormat = "empty";
        continue;
      }
      const mapped = toGnewsItems(parsed.entries, query, parsed.publishers);
      for (const it of mapped) {
        if (seenIds.has(it.id)) continue;
        seenIds.add(it.id);
        all.push(it);
      }
      queries_ok_list.push(query);
      lastFormat = "rss2";
      lastHttp = 200;
      continue;
    }

    let xml = readCache(cacheDir, query, now);
    if (xml) {
      from_cache = true;
      queries_ok_list.push(query);
      lastFormat = "rss2";
      lastHttp = 200;
    } else {
      let url: string;
      try {
        url = buildGnewsSearchUrl(query);
      } catch (err) {
        queries_soft_fail.push({
          query,
          reason: `url_build: ${String(err)}`,
          soft_fail: true,
          format: "unknown",
        });
        continue;
      }
      try {
        const res = await getXml(url, fetchImpl);
        lastHttp = res.status;
        lastCt = res.contentType;
        if (!res.ok) {
          console.log(`GNews: soft_fail query="${query}" — ${res.reason}`);
          queries_soft_fail.push({
            query,
            reason: res.reason,
            soft_fail: true,
            http_status: res.status,
            content_type: res.contentType,
            format: res.reason === "html_body" ? "html" : "unknown",
          });
          lastFormat = res.reason === "html_body" ? "html" : "unknown";
          continue;
        }
        xml = res.body;
        writeCache(cacheDir, query, xml, now);
        queries_ok_list.push(query);
        lastFormat = "rss2";
      } catch (err) {
        const reason = `network: ${String(err)}`;
        console.log(`GNews: soft_fail query="${query}" — ${reason}`);
        queries_soft_fail.push({
          query,
          reason,
          soft_fail: true,
          format: "unknown",
        });
        continue;
      }
    }

    if (looksLikeHtml(xml) && !looksLikeRss(xml)) {
      queries_soft_fail.push({
        query,
        reason: "html_body",
        soft_fail: true,
        format: "html",
      });
      // Remove from ok if we just added from cache
      const idx = queries_ok_list.lastIndexOf(query);
      if (idx >= 0) queries_ok_list.splice(idx, 1);
      lastFormat = "html";
      continue;
    }

    let parsed: { entries: ParsedFeedEntry[]; publishers: Map<string, string> };
    try {
      parsed = parseGnewsRss(xml);
    } catch {
      queries_soft_fail.push({
        query,
        reason: "parse_error",
        soft_fail: true,
        format: "unknown",
      });
      const idx = queries_ok_list.lastIndexOf(query);
      if (idx >= 0) queries_ok_list.splice(idx, 1);
      lastFormat = "unknown";
      continue;
    }

    if (!parsed.entries.length) {
      queries_soft_fail.push({
        query,
        reason: "empty_channel",
        soft_fail: true,
        format: "empty",
      });
      const idx = queries_ok_list.lastIndexOf(query);
      if (idx >= 0) queries_ok_list.splice(idx, 1);
      lastFormat = "empty";
      continue;
    }

    const mapped = toGnewsItems(parsed.entries, query, parsed.publishers);
    for (const it of mapped) {
      if (seenIds.has(it.id)) continue;
      seenIds.add(it.id);
      all.push(it);
    }
  }

  all.sort((a, b) => b.published.localeCompare(a.published));
  const items = capGnewsDisplay(all, displayCap);
  const soft_fail = queries_soft_fail.length > 0;
  const soft_fail_reason = softFailReasonFromQueries(queries_soft_fail);
  const queries_ok = queries_ok_list.length;

  return {
    items,
    ok: items.length > 0 || (queries_ok > 0 && !soft_fail),
    soft_fail,
    soft_fail_reason,
    queries_attempted: queries.length,
    queries_ok,
    queries_run: queries,
    queries_ok_list,
    queries_soft_fail,
    items_kept: items.length,
    http_status: lastHttp,
    content_type: lastCt,
    format: lastFormat ?? (items.length ? "rss2" : soft_fail ? "unknown" : null),
    brief: false,
    briefEligible: false,
    pulse_lead: false,
    pulseLeadEligible: false,
    pulse_only: true,
    never_sole_lead: true,
    url_template,
    from_cache,
  };
}
