/**
 * PASS-D Beat 13 — the morning Atom feed (refs/PASS-D-ATOM-FEED.md). Pure helpers, no IO; scripts/atom-feed.ts does the IO.
 * Lives under desk/scripts/lib (not src/lib): crawl tooling, never page code, so pages-publish §2h counts it as non-rendered.
 * One edition per Istanbul date, keyed by lead-history.json's entry for that date and frozen at pick time (PASS-L L2):
 *   picked → lead + up to 5 Wire rows + top 5 Papers of the crawl that made the pick;
 *   HELD   → a plain HELD notice (never the carried lead), Wire + Papers still listed.
 * The only rewrite: a HELD date that later picks (11:11 / 16:11 recovery) — same id, newer `updated`, once.
 * Escaping (D3 amend): content is type="html" ⇒ HTML-escape each value while building the HTML, then XML-escape the
 * whole HTML string (R&D → R&amp;amp;D); titles are type="text", escaped once. No CDATA.
 * `published` is stored at first write (= the lead-history entry `at`, never Date.now()); HELD→pick keeps it.
 * The XML is a pure function of the snapshot store: no now(), no crawl time, no counters ⇒ byte-identical on no-op crawls.
 * Gmail-news (briefEligible:false) and X session taste never appear. Not page code: nothing here is imported by the app.
 */
import { LEAD_HELD_TEXT } from "@/lib/lead-view";

export const FEED_SITE_URL = "https://specimba.github.io/NEXUS_SAGE_grok/"; // PAGES=1 basePath /NEXUS_SAGE_grok/
export const FEED_URL = `${FEED_SITE_URL}feed.xml`;
export const FEED_ID = "tag:specimba.github.io,2026:nexus-sage/feed";
export const FEED_TITLE = "NEXUS SAGE · Morning edition";
export const FEED_AUTHOR = "NEXUS SAGE";
export const ATOM_NS = "http://www.w3.org/2005/Atom";
export const FEED_MAX_ENTRIES = 14;
export const FEED_MAX_BYTES = 65_536;
export const EDITION_WIRE_MAX = 5;
export const EDITION_PAPERS_MAX = 5;
/** HELD notice body (spec D2). The kicker reuses the Phase 2 reason text (lead-view LEAD_HELD_TEXT). */
export const HELD_NOTICE = "No lead today: nothing cleared the 2-publisher bar";
const URL_MAX = 2048;

export const entryId = (date: string) => `tag:specimba.github.io,2026:nexus-sage/morning/${date}`;

// ── inputs (subsets of LeadEntry / WireRow / PAPERS rows; extra fields ignored) ──
type Excluded = { cluster_id?: string; headline?: string; reason?: string };
export type FeedLeadEntry = {
  date: string;
  at: string;
  crawl_at?: string;
  reason: string;
  cluster_id?: string | null;
  headline?: string | null;
  url?: string | null;
  sources?: number | null;
  sig?: number | null;
  age_band?: string;
  pick_slot?: string;
  note?: string;
  excluded?: Excluded[];
  attempts?: { at: string; crawl_at?: string; excluded?: Excluded[] }[];
  briefEligible?: boolean;
};
export type FeedWireInput = {
  id?: string;
  title?: string;
  url?: string | null;
  sources?: number | null;
  member_ids?: string[];
  briefEligible?: boolean;
  kind?: string;
  source?: string;
};
export type FeedPaperInput = { id?: string; title?: string; href?: string | null; up?: number | null };
export type CrawlInput = { crawlAt: string; wire: FeedWireInput[]; papers: FeedPaperInput[] };

// ── store (desk/artifacts/sage/morning-editions.json) ──
export type EditionLead = {
  headline: string;
  url: string | null;
  sources: number;
  sig: number | null;
  age_band: string | null;
  pick_slot: string | null;
};
export type Edition = {
  date: string;
  id: string;
  state: "picked" | "held";
  /** First snapshot = the lead-history entry `at` that first landed the date (RFC 3339 UTC). */
  published: string;
  /** Pick or HELD entry `at`. */
  updated: string;
  crawl_at: string;
  lead: EditionLead | null;
  held_note: string | null;
  wire: { headline: string; url: string | null; sources: number }[];
  papers: { title: string; href: string | null; up: number | null }[];
  /** HELD days: Wire rows left out because they were this date's ruled-out lead candidates (excluded[]). */
  wire_ruled_out?: number;
  /** true once a HELD date was rewritten by its recovery pick (the only allowed rewrite). */
  rewritten?: true;
};
export type EditionStore = { schema: 1; editions: Edition[] };
export const emptyStore = (): EditionStore => ({ schema: 1, editions: [] });

/** Absolute https:// URL or null (invalid / javascript: / http: / over-long links are dropped, never emitted raw). */
export function safeHttpsUrl(u: unknown): string | null {
  if (typeof u !== "string" || !u || u.length > URL_MAX) return null;
  try {
    const p = new URL(u);
    if (p.protocol !== "https:" || !p.hostname) return null;
    return p.href;
  } catch {
    return null;
  }
}

/** XML / HTML text escape: & < > " ' */
export function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
// HTML 4 has no &apos; — inside the html content use the numeric form.
const escapeHtml = (s: string) => escapeXml(s).replace(/&apos;/g, "&#39;");

/** RFC 3339 UTC, whole seconds. null if unparseable. */
export function rfc3339(iso: unknown): string | null {
  const t = Date.parse(String(iso ?? ""));
  return Number.isFinite(t) ? new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") : null;
}

/** Private lanes: Gmail-news, X session taste / any briefEligible:false item. Never in the feed. */
const PRIVATE_ID = /^(cl:)?(gmail|x|xt|x_taste|x-taste|taste)[:_-]/i;
export function isPrivateItem(i: { id?: string | null; cluster_id?: string | null; member_ids?: string[]; briefEligible?: boolean; kind?: string; source?: string }): boolean {
  if (i.briefEligible === false) return true;
  if (/^(gmail|x|x_taste|taste)$/i.test(String(i.source ?? "")) || /^taste$/i.test(String(i.kind ?? ""))) return true;
  const ids = [i.id, i.cluster_id].filter((x): x is string => typeof x === "string" && x.length > 0);
  if (ids.some((x) => PRIVATE_ID.test(x))) return true;
  const m = (i.member_ids ?? []).filter((x) => typeof x === "string");
  return m.length > 0 && m.every((x) => PRIVATE_ID.test(x));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-15" → "Oct 15" (the date key is already the Istanbul date). */
export function monDay(date: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  return `${MONTHS[Number(m[1]) - 1] ?? m[1]} ${Number(m[2])}`;
}

/** The entry that decides a date: its LAST lead-history entry (same rule as entryFor / buildLeadLog). Seeds don't count. */
export function decidingEntries(history: unknown): Map<string, FeedLeadEntry> {
  const h = history as { schema?: number; entries?: FeedLeadEntry[] } | null;
  if (!h || h.schema !== 1 || !Array.isArray(h.entries)) throw new Error("lead-history.json: not schema 1 with entries[]");
  const out = new Map<string, FeedLeadEntry>();
  for (const e of h.entries) {
    if (!e || typeof e.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) continue;
    out.set(e.date, e);
  }
  for (const [d, e] of [...out]) if (e.reason !== "picked" && e.reason !== "held") out.delete(d);
  return out;
}

function excludedOf(e: FeedLeadEntry): { ids: Set<string>; heads: Set<string> } {
  const all = [...(e.excluded ?? []), ...(e.attempts ?? []).flatMap((a) => a.excluded ?? [])];
  return {
    ids: new Set(all.map((x) => String(x.cluster_id ?? "")).filter(Boolean)),
    heads: new Set(all.map((x) => String(x.headline ?? "").trim()).filter(Boolean)),
  };
}

/** A picked entry the feed may show as a lead: ≥2 publishers, not a private lane, has a headline. */
function leadOk(e: FeedLeadEntry): boolean {
  return e.reason === "picked" && !!String(e.headline ?? "").trim() && (Number(e.sources) || 0) >= 2 && !isPrivateItem(e);
}

/** Build one edition from the deciding entry + the crawl that made it. */
export function buildEdition(e: FeedLeadEntry, crawl: CrawlInput, published?: string): Edition {
  const at = rfc3339(e.at);
  if (!at) throw new Error(`lead-history ${e.date}: unparseable at`);
  const picked = leadOk(e);
  const ex = picked ? null : excludedOf(e);
  const publicWire = (crawl.wire ?? []).filter((w) => w && String(w.title ?? "").trim() && !isPrivateItem(w));
  const keptWire = publicWire.filter((w) => !ex || (!ex.ids.has(String(w.id ?? "")) && !ex.heads.has(String(w.title ?? "").trim())));
  const ruledOut = publicWire.slice(0, EDITION_WIRE_MAX).length - keptWire.slice(0, EDITION_WIRE_MAX).length;
  const wire = keptWire
    .slice(0, EDITION_WIRE_MAX)
    .map((w) => ({ headline: String(w.title).trim(), url: safeHttpsUrl(w.url), sources: Number(w.sources) || 0 }));
  const papers = (crawl.papers ?? [])
    .filter((p) => p && String(p.title ?? "").trim())
    .slice(0, EDITION_PAPERS_MAX)
    .map((p) => ({ title: String(p.title).trim(), href: safeHttpsUrl(p.href), up: Number.isFinite(Number(p.up)) && p.up != null ? Number(p.up) : null }));
  return {
    date: e.date,
    id: entryId(e.date),
    state: picked ? "picked" : "held",
    published: published ?? at,
    updated: at,
    crawl_at: String(e.crawl_at ?? crawl.crawlAt),
    lead: picked
      ? {
          headline: String(e.headline).trim(),
          url: safeHttpsUrl(e.url),
          sources: Number(e.sources) || 0,
          sig: e.sig ?? null,
          age_band: e.age_band ?? null,
          pick_slot: e.pick_slot ?? null,
        }
      : null,
    held_note: picked ? null : HELD_NOTICE,
    wire,
    papers,
    ...(ruledOut > 0 ? { wire_ruled_out: ruledOut } : {}),
  };
}

/**
 * Snapshot step for one crawl. A date is touched only when its deciding entry was made by THIS crawl
 * (entry.crawl_at === crawl.crawlAt): new date ⇒ append; HELD edition whose date now picked ⇒ rewrite once
 * (same id + published, newer updated). Everything else is a no-op (frozen past). Returns a new store.
 */
export function snapshotEditions(store: EditionStore, history: unknown, crawl: CrawlInput): { store: EditionStore; changed: string[] } {
  const deciding = decidingEntries(history);
  const byDate = new Map(store.editions.map((x) => [x.date, x]));
  const changed: string[] = [];
  for (const [date, e] of deciding) {
    if (!crawl.crawlAt || e.crawl_at !== crawl.crawlAt) continue;
    const prev = byDate.get(date);
    if (!prev) {
      byDate.set(date, buildEdition(e, crawl));
      changed.push(`${date} new ${leadOk(e) ? "picked" : "held"}`);
    } else if (prev.state === "held" && !prev.rewritten && leadOk(e)) {
      const next = buildEdition(e, crawl, prev.published);
      if (Date.parse(next.updated) > Date.parse(prev.updated)) {
        byDate.set(date, { ...next, rewritten: true });
        changed.push(`${date} held→picked`);
      }
    }
  }
  const editions = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  return { store: { schema: 1, editions }, changed };
}

function entryContent(ed: Edition): string {
  const h: string[] = [];
  const link = (text: string, url: string | null) => (url ? `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>` : escapeHtml(text));
  if (ed.state === "picked" && ed.lead) {
    const l = ed.lead;
    h.push(`<p><strong>Lead</strong>: ${link(l.headline, l.url)}</p>`);
    const meta = [`${l.sources} SRC`, l.sig != null ? `SIG ${l.sig}` : null, l.age_band ? `age ${l.age_band}` : null, l.pick_slot ? `pick ${l.pick_slot} UTC+3` : null]
      .filter(Boolean)
      .join(" · ");
    h.push(`<p>${escapeHtml(meta)}</p>`);
  } else {
    h.push(`<p><strong>${escapeHtml(LEAD_HELD_TEXT)}</strong></p>`);
    h.push(`<p>${escapeHtml(ed.held_note ?? HELD_NOTICE)}</p>`);
  }
  h.push(`<h3>Wire</h3>`);
  const ro = ed.wire_ruled_out ?? 0;
  if (ed.wire.length) h.push(`<ol>${ed.wire.map((w) => `<li>${link(w.headline, w.url)} · ${w.sources} SRC</li>`).join("")}</ol>`);
  if (ro > 0) h.push(`<p>${ro} Wire row${ro === 1 ? "" : "s"} not listed: ruled out as lead today.</p>`);
  else if (!ed.wire.length) h.push(`<p>No Wire rows in this crawl.</p>`);
  h.push(`<h3>Papers</h3>`);
  h.push(
    ed.papers.length
      ? `<ol>${ed.papers.map((p) => `<li>${link(p.title, p.href)}${p.up != null ? ` · UP ${p.up}` : ""}</li>`).join("")}</ol>`
      : `<p>No papers in this crawl.</p>`,
  );
  return h.join("");
}

function entryXml(ed: Edition): string {
  const title = `${monDay(ed.date)} · ${ed.state === "picked" && ed.lead ? ed.lead.headline : "HELD"}`;
  const alt = (ed.state === "picked" && ed.lead?.url) || FEED_SITE_URL;
  return [
    `  <entry>`,
    `    <id>${escapeXml(ed.id)}</id>`,
    `    <title type="text">${escapeXml(title)}</title>`,
    `    <updated>${escapeXml(ed.updated)}</updated>`,
    `    <published>${escapeXml(ed.published)}</published>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(alt)}"/>`,
    `    <content type="html">${escapeXml(entryContent(ed))}</content>`,
    `  </entry>`,
  ].join("\n");
}

function feedXml(eds: Edition[], tldr: TldrFeedEntry | null = null): string {
  const all = [...(tldr ? [tldr.updated] : []), ...eds.map((e) => e.updated)];
  const updated = all.reduce((m, u) => (Date.parse(u) > Date.parse(m) ? u : m), all[0]!);
  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="${ATOM_NS}">`,
    `  <id>${FEED_ID}</id>`,
    `  <title type="text">${escapeXml(FEED_TITLE)}</title>`,
    `  <updated>${escapeXml(updated)}</updated>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(FEED_URL)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(FEED_SITE_URL)}"/>`,
    `  <author><name>${escapeXml(FEED_AUTHOR)}</name></author>`,
    ...(tldr ? [tldrXml(tldr)] : []),
    ...eds.map(entryXml),
    `</feed>`,
    ``,
  ].join("\n");
}

// ── PASS-F2.2c — Past-24h TL;DR entry (the deliberate PASS-D exception: rewritten in place, first in the feed) ──
export const tldrEntryId = (date: string) => `tag:specimba.github.io,2026:nexus-sage/tldr:${date}`;
export type TldrInput = { date: string; crawl_at: string; quiet: boolean; bullets: { id?: string; title?: string; url?: string | null; sources?: number | null; member_ids?: string[] }[] };
export type TldrFeedEntry = {
  schema: 1;
  date: string;
  id: string;
  published: string;
  updated: string;
  quiet: boolean;
  bullets: { headline: string; url: string | null; sources: number }[];
};

/**
 * One crawl. Only this crawl's TL;DR counts (crawl_at === CRAWL_AT). Same date + same bullets ⇒ the stored entry, untouched
 * (byte-identical feed on a no-op crawl). Otherwise: same id for the date, `updated` = this crawl, content rewritten in
 * place; a new date gets a new id (one TL;DR entry per day). Private lanes never appear.
 */
export function tldrStep(prev: TldrFeedEntry | null, t: TldrInput, crawlAt: string): { entry: TldrFeedEntry | null; changed: boolean } {
  if (!t || t.crawl_at !== crawlAt || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return { entry: prev, changed: false };
  const at = rfc3339(crawlAt);
  if (!at) return { entry: prev, changed: false };
  const bullets = (t.bullets ?? [])
    .filter((b) => b && String(b.title ?? "").trim() && !isPrivateItem(b))
    .map((b) => ({ headline: String(b.title).trim(), url: safeHttpsUrl(b.url), sources: Number(b.sources) || 0 }));
  if (prev && prev.date === t.date && prev.quiet === !!t.quiet && JSON.stringify(prev.bullets) === JSON.stringify(bullets)) return { entry: prev, changed: false };
  const sameDay = prev?.date === t.date;
  return {
    entry: { schema: 1, date: t.date, id: tldrEntryId(t.date), published: sameDay ? prev!.published : at, updated: at, quiet: !!t.quiet, bullets },
    changed: true,
  };
}

function tldrXml(t: TldrFeedEntry): string {
  const link = (text: string, url: string | null) => (url ? `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>` : escapeHtml(text));
  const html = [
    t.bullets.length ? `<ol>${t.bullets.map((b) => `<li>${link(b.headline, b.url)} · ${b.sources} SRC</li>`).join("")}</ol>` : "",
    t.quiet ? `<p>quiet day</p>` : "",
  ].join("");
  return [
    `  <entry>`,
    `    <id>${escapeXml(t.id)}</id>`,
    `    <title type="text">${escapeXml(`${monDay(t.date)} · Past 24 hours`)}</title>`,
    `    <updated>${escapeXml(t.updated)}</updated>`,
    `    <published>${escapeXml(t.published)}</published>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(FEED_SITE_URL)}"/>`,
    `    <content type="html">${escapeXml(html)}</content>`,
    `  </entry>`,
  ].join("\n");
}

/**
 * Store → feed.xml (newest 14, ≤64 KB by dropping the oldest edition). null when there is no edition / TL;DR yet. Pure.
 * PASS-F2.2c: the TL;DR (when given) is entry 1 and counts toward both caps; frozen editions follow, unchanged.
 */
export function renderAtomFeed(store: EditionStore, tldr: TldrFeedEntry | null = null): string | null {
  let eds = [...store.editions]
    .filter((e) => e && rfc3339(e.updated) && rfc3339(e.published))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FEED_MAX_ENTRIES - (tldr ? 1 : 0));
  if (!eds.length && !tldr) return null;
  while (true) {
    const xml = feedXml(eds, tldr);
    if (Buffer.byteLength(xml, "utf8") <= FEED_MAX_BYTES) return xml;
    if (!eds.length) return null;
    eds = eds.slice(0, -1);
  }
}
