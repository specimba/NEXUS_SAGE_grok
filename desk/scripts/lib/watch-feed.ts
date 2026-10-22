/**
 * PASS-W — watch feed `public/watch.xml` (refs/PASS-W-WATCH-FEED.md). Pure helpers, no IO; scripts/atom-feed.ts does the IO
 * in the same step / same soft fail as feed.xml. Crawl tooling under desk/scripts/lib, never page code.
 * W2: candidates = this crawl's Wire + papers + releases rows only (never Gmail, never X — isPrivateItem guards anyway).
 *     Match on title (+ summary when present), plain case-insensitive substring, any term.
 *     Dedupe key = canonical URL (dedupe.ts canonicalizeUrl; row id when the row has no URL). A key already in
 *     artifacts/sage/watch-seen.json is skipped; seen keys older than 14 days (vs the crawl time) are pruned on write.
 *     Cap 10 new entries per crawl, newest first; overflow is dropped (not queued, not marked seen) and counted.
 * W3: one entry per matched row; `published` = row first-seen time (releases' own first_seen, else this crawl's time);
 *     `<category>` per matched term; last 50 entries, ≤ 64 KB; stable `<id>` = tag URI from the dedupe key.
 *     The XML is a pure function of the store ⇒ byte-identical on a no-op rerun.
 */
import { canonicalizeUrl } from "@/lib/dedupe";
import { ATOM_NS, FEED_AUTHOR, FEED_SITE_URL, escapeXml, isPrivateItem, rfc3339, safeHttpsUrl } from "./atom-feed";

export const WATCH_URL = `${FEED_SITE_URL}watch.xml`;
export const WATCH_ID = WATCH_URL;
export const WATCH_TITLE = "NEXUS SAGE · Watch";
export const WATCH_CAP_PER_CRAWL = 10;
export const WATCH_MAX_ENTRIES = 50;
export const WATCH_MAX_BYTES = 65_536;
export const WATCH_SEEN_DAYS = 14;

export const watchEntryId = (key: string) => `tag:specimba.github.io,2026:nexus-sage/watch/${encodeURIComponent(key)}`;

type Row = Record<string, unknown>;
export type WatchCrawl = { crawlAt: string; wire: Row[]; papers: Row[]; releases: Row[] };
export type WatchEntry = { key: string; title: string; url: string | null; published: string; terms: string[]; lane: "wire" | "papers" | "releases" };
export type WatchStore = { schema: 1; seen: Record<string, string>; entries: WatchEntry[] };
export const emptyWatchStore = (): WatchStore => ({ schema: 1, seen: {}, entries: [] });

const str = (v: unknown) => (typeof v === "string" ? v : "");

type Cand = { key: string; title: string; text: string; url: string | null; first_seen: string; lane: WatchEntry["lane"] };

function candidates(c: WatchCrawl): Cand[] {
  const out: Cand[] = [];
  const add = (lane: Cand["lane"], r: Row, url: unknown, summary: unknown, firstSeen: unknown) => {
    if (!r || typeof r !== "object" || isPrivateItem(r as never)) return;
    const title = str(r.title).trim();
    if (!title) return;
    const u = str(url);
    const key = u ? canonicalizeUrl(u) : str(r.id);
    if (!key) return;
    out.push({ key, title, text: `${title}\n${str(summary)}`.toLowerCase(), url: safeHttpsUrl(u), first_seen: rfc3339(firstSeen) ?? rfc3339(c.crawlAt)!, lane });
  };
  for (const r of c.wire) add("wire", r, r.url, r.summary, r.first_seen);
  for (const r of c.papers) add("papers", r, r.href, r.abstract ?? r.summary, r.first_seen);
  for (const r of c.releases) add("releases", r, r.link, r.summary, r.first_seen);
  return out;
}

export type WatchStep = { store: WatchStore; added: number; dropped: number };

/** One crawl → next store. terms = [] is "off": the caller writes nothing. Pure (time = crawlAt). */
export function watchStep(store: WatchStore, terms: string[], crawl: WatchCrawl): WatchStep {
  const now = Date.parse(crawl.crawlAt);
  const seen: Record<string, string> = {};
  for (const [k, at] of Object.entries(store.seen || {})) if (now - Date.parse(at) <= WATCH_SEEN_DAYS * 86_400_000) seen[k] = at;
  const lower = terms.map((t) => t.toLowerCase());
  const matched = new Map<string, Cand & { terms: string[] }>();
  for (const c of candidates(crawl)) {
    if (seen[c.key] || matched.has(c.key)) continue;
    const hit = terms.filter((_, i) => c.text.includes(lower[i]!));
    if (hit.length) matched.set(c.key, { ...c, terms: hit });
  }
  const fresh = [...matched.values()].sort((a, b) => b.first_seen.localeCompare(a.first_seen) || a.key.localeCompare(b.key));
  const take = fresh.slice(0, WATCH_CAP_PER_CRAWL);
  const at = rfc3339(crawl.crawlAt)!;
  for (const m of take) seen[m.key] = at;
  const entries = [
    ...take.map((m): WatchEntry => ({ key: m.key, title: m.title, url: m.url, published: m.first_seen, terms: m.terms, lane: m.lane })),
    ...(store.entries || []),
  ]
    .sort((a, b) => b.published.localeCompare(a.published) || a.key.localeCompare(b.key))
    .slice(0, WATCH_MAX_ENTRIES);
  return { store: { schema: 1, seen: Object.fromEntries(Object.entries(seen).sort(([a], [b]) => a.localeCompare(b))), entries }, added: take.length, dropped: fresh.length - take.length };
}

function entryXml(e: WatchEntry): string {
  return [
    `  <entry>`,
    `    <id>${escapeXml(watchEntryId(e.key))}</id>`,
    `    <title type="text">${escapeXml(e.title)}</title>`,
    `    <updated>${escapeXml(e.published)}</updated>`,
    `    <published>${escapeXml(e.published)}</published>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(e.url || FEED_SITE_URL)}"/>`,
    ...e.terms.map((t) => `    <category term="${escapeXml(t)}"/>`),
    `  </entry>`,
  ].join("\n");
}

/** Store → watch.xml (newest 50, ≤ 64 KB by dropping the oldest). null when there are no entries. */
export function renderWatchFeed(store: WatchStore): string | null {
  let es = [...store.entries].sort((a, b) => b.published.localeCompare(a.published) || a.key.localeCompare(b.key)).slice(0, WATCH_MAX_ENTRIES);
  while (es.length) {
    const xml = [
      `<?xml version="1.0" encoding="utf-8"?>`,
      `<feed xmlns="${ATOM_NS}">`,
      `  <id>${escapeXml(WATCH_ID)}</id>`,
      `  <title type="text">${escapeXml(WATCH_TITLE)}</title>`,
      `  <updated>${escapeXml(es[0]!.published)}</updated>`,
      `  <link rel="self" type="application/atom+xml" href="${escapeXml(WATCH_URL)}"/>`,
      `  <link rel="alternate" type="text/html" href="${escapeXml(FEED_SITE_URL)}"/>`,
      `  <author><name>${escapeXml(FEED_AUTHOR)}</name></author>`,
      ...es.map(entryXml),
      `</feed>`,
      ``,
    ].join("\n");
    if (Buffer.byteLength(xml, "utf8") <= WATCH_MAX_BYTES) return xml;
    es = es.slice(0, -1);
  }
  return null;
}
