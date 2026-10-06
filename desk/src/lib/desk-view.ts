/**
 * OPT win 3 — one slim client view of a crawl (src/data/desk-view.ts).
 *
 * The desk is a client component, so every data module it imports ships to the browser. The raw crawl modules
 * (pulse-clusters / hn-pulse / gnews-rss / rss-labs / rss-security / papers …) repeat each story's id, URL and
 * title across files and carry fields the desk never renders. scripts/desk-view.ts (run by rank-snapshot, i.e.
 * every postingest) calls buildDeskView() on the raw modules and writes ONE file holding only what the desk renders:
 *   - MEMBER_ROWS: one record per crawl item / X post with the values memberInfo() builds (so N SRC, chips and the
 *     drawer are unchanged): title, time and URL once; summary only for row leads, cut to the 280 chars the Pulse
 *     row shows; badge / publisher left out when the id implies them. A cluster rides on its lead member's record
 *     (`c`), with every field that equals its default left out — most clusters are one item and ship as
 *     { first_seen }. Records are ordered clusters-first, so cluster order survives;
 *   - PAPERS: the PaperInput fields buildPaperRows reads (abstract cut to the 600 chars the row shows);
 *   - the small crawl-written modules (wire, rank, lead pick minus audit fields, topic heat, source health, shelf).
 * Raw modules stay for scripts and tests. Non-crawl modules (cycle, digest-pack/-cadence, x-taste, soft-fail
 * meters, wikidata deny) are written by other jobs (digest:tick, a2) and stay direct imports.
 *
 * FIXED SIZE (DESK_VIEW_CAPS below): the view's size is set by the caps, not by the crawl — row caps per source
 * (oldest story dropped first, ties by id; a story = a Pulse cluster, dropped whole with all its members, so no id
 * ever dangles; stories the Wire / rank / lead point at are pinned), field caps per row, and a hard gzip budget on
 * the generated module (src/lib/desk-view-module.ts trims the oldest unpinned stories until it fits).
 */
import { labBadge, memberSource, type ClusterInput, type PaperInput, type PulseMemberInfo } from "@/lib/pulse-v5";
import type { LeadEntry } from "@/lib/lead-pick";
import type { MemberItem } from "@/lib/story-drawer";

/** Pulse row shows `summary.slice(0, 280)`; Papers row shows `abstract.slice(0, 600)`. */
export const SUMMARY_CHARS = 280;
export const ABSTRACT_CHARS = 600;

/**
 * The ONE place the desk-view size is fixed. Budget math (next build, 2026-10-03; numbers pinned in desk-view-caps.test.ts):
 *   First Load JS for `/` = shared 102.6 kB + page ≈ 8.3 kB of other page JS + page chunk (≈ 29.1 kB gz of desk code
 *   + the desk-view data, which costs ≈ 1 byte of chunk gz per byte of `gzip -9 src/data/desk-view.ts`). Gate 185 kB.
 *   Row and field caps bound every row, but every lane at its row cap with every field at max (synthetic worst case,
 *   331 crawl items) is far over any budget, so the generator also enforces `gzBytes`: it drops the oldest unpinned
 *   stories until `gzip -9(desk-view.ts) ≤ gzBytes` (and, only if pins + fixed lanes alone overflow, the oldest papers,
 *   then X posts). 2026-10-06, every story link at LINK_MAX 2048 random chars: worst seed 41 892 B → First Load 181.6 kB. Worst case built at 41 385 B → 181 kB; at the
 *   full 41 900 B ≈ 181.8 kB — ≥ 3 kB under the gate on ANY crawl. Real 07:12:59Z crawl: 43 035 B uncapped → 6 oldest
 *   stories (fox-it security posts, 2023-11 … 2024-04) dropped → 41 802 B → 181 kB.
 *   Row caps ≈ 1.5× that crawl (hn 59 · gnews 30 · rss-labs 104 · rss-security 27 · X 7 · papers 24); field caps sit
 *   above every value seen (title ≤144 · publisher ≤19 · link ≤502 · X take ≤70 · X link ≤54 · paper title ≤112 · paper
 *   link ≤32), so no kept row's text changes. Raising gzBytes needs a new worst-case build (bun scripts/desk-view-worst.ts).
 */
/** Longest story link kept (chars). Longer = broken data → story dropped (pinned stories survive). No redirect resolving. */
export const LINK_MAX = 2048;

export const DESK_VIEW_CAPS = {
  /** Crawl items kept per source (counted over kept stories; a story is dropped whole, oldest first). */
  items: { hn: 90, gnews: 45, rss: 156, "rss-sec": 40 } as Record<string, number>,
  /** Operator X posts (newest kept). */
  xPosts: 12,
  /** Papers (lowest arXiv id = oldest dropped first; feed order kept). */
  papers: 36,
  /**
   * Per-field characters. Over-long text is cut with "…". Links are never cut: story links (GNews redirects included)
   * ship whole up to `url` = LINK_MAX (2048) — past that the link is broken data and the story is dropped (unless
   * pinned). X / arXiv links have fixed shapes (x.com/<user>/status/<id>, arxiv.org/abs/<id>); xUrl / paperUrl stay
   * shape checks, since 36 papers × 2 links at 2048 could not fit gzBytes (papers are not budget-dropped).
   */
  chars: { title: 200, drawerTitle: 200, publisher: 40, take: 280, paperTitle: 240, url: LINK_MAX, xUrl: 128, paperUrl: 64 },
  /** Hard budget: gzip -9 bytes of the generated src/data/desk-view.ts. */
  gzBytes: 41_900,
} as const;

/** Cut to `n` chars with an ellipsis (only past the cap — never touches text under it). */
export function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

type Widen<T> = { [K in keyof T]: T[K] extends number ? number : Widen<T[K]> };
/** DESK_VIEW_CAPS with plain number fields (the budget fallback in desk-view-module.ts lowers papers / xPosts). */
export type DeskViewCaps = Widen<typeof DESK_VIEW_CAPS>;

/** GNews titles end in " - Publisher"; the drawer / Pulse headline drop that tail. */
export function stripPublisher(title: string, publisher: string): string {
  const tail = ` - ${publisher}`;
  return publisher && title.endsWith(tail) ? title.slice(0, -tail.length) : title;
}

/**
 * A cluster minus its lead_id (the record key) and minus every field equal to its default:
 * id = cl:<lead_id> · lead_source = memberSource(lead_id) · sources = [lead_source] · member_ids = [lead_id] ·
 * size = member_ids.length · at / url = the lead member's · title = the lead's drawer headline · is_new = false.
 */
export type SlimCluster = Partial<Omit<ClusterInput, "lead_id">> & Pick<ClusterInput, "first_seen">;

/** One crawl item / X post. Short keys: there are ~230 of them. Absent ⇒ undefined in PulseMemberInfo. */
export type MemberRow = {
  /** badge (default: from the id — HN · GNW · SEC · X · labBadge(lab)) */ b?: string;
  /** publisher (default for rss:/rss-sec: ids: the lab segment of the id) */ p?: string;
  /** own headline */ t?: string;
  /** own publish time (ISO) */ a?: string;
  /** url */ u?: string;
  /** signal: HN points (Pulse UP) or X likes (stored; Pulse UP ignores X — Pass D). */ s?: number;
  /** summary (row leads only, ≤ SUMMARY_CHARS) */ m?: string;
  /** security feed */ sec?: true;
  /** drawer headline, only when it differs from drawerTitle()'s default */ dt?: string;
  /** the cluster this item leads */ c?: SlimCluster;
};

/** Clusters whose lead is not a crawl item (normally none): explicit lead_id + original position. */
export type OrphanCluster = SlimCluster & { lead_id: string; i: number };

export function defaultPublisher(id: string): string | undefined {
  return id.startsWith("rss:") || id.startsWith("rss-sec:") ? id.split(":")[1] : undefined;
}
export function defaultBadge(id: string, publisher: string): string | undefined {
  if (id.startsWith("hn:")) return "HN";
  if (id.startsWith("gnews:")) return "GNW";
  if (id.startsWith("rss-sec:")) return "SEC";
  if (id.startsWith("rss:")) return labBadge(publisher);
  if (id.startsWith("x:")) return "X";
  return undefined;
}
const pubOf = (id: string, r: MemberRow) => r.p ?? defaultPublisher(id)!;
const badgeOf = (id: string, r: MemberRow) => r.b ?? defaultBadge(id, pubOf(id, r))!;

/** Drawer coverage headline for one member (GNews drops its " - Publisher" tail). */
export function drawerTitle(id: string, r: MemberRow): string {
  return r.dt ?? (id.startsWith("gnews:") ? stripPublisher(r.t!, pubOf(id, r)) : r.t!);
}

/** Crawl items = every member that is not an operator X post. */
export function crawlItemIds(rows: Record<string, MemberRow>): string[] {
  return Object.keys(rows).filter((id) => !id.startsWith("x:"));
}

/** Lead pick entry minus the audit fields the Brief never renders (excluded / attempts / crawl stamps …). */
export type SlimLead = Omit<LeadEntry, "crawl_at" | "crawl_started_at" | "excluded" | "attempts" | "supersedes" | "first_at" | "catch_up">;
export function slimLead(e: LeadEntry | null): SlimLead | null {
  if (!e) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { crawl_at, crawl_started_at, excluded, attempts, supersedes, first_at, catch_up, ...rest } = e;
  return rest;
}

export type XPost = { id: string; take: string; href: string; at: string };
/**
 * Stored X post: the take is the head of its member's summary (`take — text`) and the link is the member's url, so
 * only the length `n` is kept (`t` only if the take is not that head, e.g. cut past the cap). No duplicated text.
 */
export type XRef = { id: string; at: string; n?: number; t?: string };

type RawCluster = ClusterInput & { canonical_url?: string; all_sources?: string[]; score?: number };
type RawPaper = PaperInput & Record<string, unknown>;

export type DeskViewInput = {
  clusters: readonly RawCluster[];
  /** Cluster ids other crawl modules point at (Wire rows, rank crawl_hits, lead pick) — never dropped. */
  pins?: readonly string[];
  /** memberInfo() over the raw modules (scripts only). */
  members: Record<string, PulseMemberInfo>;
  /** GNews raw title + publisher by id (drawer headline strip). */
  gnews: readonly { id: string; title: string; publisher: string }[];
  xPosts: readonly { id: string; take: string; href: string; at: string }[];
  papers: readonly RawPaper[];
};

export type DeskView = {
  memberRows: Record<string, MemberRow>;
  orphanClusters: OrphanCluster[];
  xPosts: XRef[];
  papers: PaperInput[];
  /** What the caps left out (counts only; never rendered). */
  trimmed: DeskViewTrim;
};
export type DeskViewTrim = { stories: number; items: number; xPosts: number; papers: number };

export type DeskViewOpts = {
  /** Extra oldest unpinned stories to drop (the gzip-budget loop in desk-view-module.ts raises this). */
  drop?: number;
  caps?: DeskViewCaps;
};

const ts = (iso: string | undefined | null) => Date.parse(iso ?? "") || 0;
/** Oldest first, ties by id — the one drop order every cap uses. */
const oldestFirst = <T extends { id: string; t: number }>(a: T, b: T) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export const sourceOf = (id: string) => id.slice(0, Math.max(0, id.indexOf(":")));

/**
 * Which stories (raw cluster indexes) survive the caps: over-long links out; then, oldest first, drop unpinned
 * stories carrying an item of an over-cap source; then the `drop` oldest unpinned survivors. Pure + deterministic.
 */
export function keptStories(i: DeskViewInput, opts: DeskViewOpts = {}): Set<number> {
  const caps = opts.caps ?? DESK_VIEW_CAPS;
  const pins = new Set(i.pins ?? []);
  const units = i.clusters.map((c, idx) => ({ idx, id: c.id, t: ts(c.at), pinned: pins.has(c.id), ids: [...new Set([c.lead_id, ...c.member_ids])] }));
  const urlOk = (idx: number) => {
    const c = i.clusters[idx]!;
    if (c.url.length > caps.chars.url) return false;
    return units[idx]!.ids.every((id) => (i.members[id]?.url ?? "").length <= caps.chars.url);
  };
  const kept = new Set(units.filter((u) => u.pinned || urlOk(u.idx)).map((u) => u.idx));
  const count: Record<string, number> = {};
  for (const idx of kept) for (const id of units[idx]!.ids) count[sourceOf(id)] = (count[sourceOf(id)] ?? 0) + 1;
  const over = (src: string) => (count[src] ?? 0) > (caps.items[src] ?? Infinity);
  const order = [...units].sort(oldestFirst);
  for (const u of order) {
    if (u.pinned || !kept.has(u.idx) || !u.ids.some((id) => over(sourceOf(id)))) continue;
    kept.delete(u.idx);
    for (const id of u.ids) count[sourceOf(id)]!--;
  }
  let drop = opts.drop ?? 0;
  for (const u of order) {
    if (drop <= 0) break;
    if (u.pinned || !kept.has(u.idx)) continue;
    kept.delete(u.idx);
    drop--;
  }
  return kept;
}

/** Unpinned stories still droppable after the row caps (upper bound for the budget loop). */
export function droppableStories(i: DeskViewInput, opts: DeskViewOpts = {}): number {
  const pins = new Set(i.pins ?? []);
  return [...keptStories(i, { ...opts, drop: 0 })].filter((idx) => !pins.has(i.clusters[idx]!.id)).length;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function slimCluster(c: RawCluster, lead: MemberRow | undefined): SlimCluster {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { canonical_url, all_sources, score, id, title, url, lead_id, lead_source, sources, member_ids, size, at, first_seen, is_new, ...rest } = c;
  return {
    first_seen,
    ...(id === `cl:${lead_id}` ? {} : { id }),
    ...(lead && drawerTitle(lead_id, lead) === title ? {} : { title }),
    ...(lead?.u === url ? {} : { url }),
    ...(lead_source === memberSource(lead_id) ? {} : { lead_source }),
    ...(same(sources, [lead_source]) ? {} : { sources }),
    ...(same(member_ids, [lead_id]) ? {} : { member_ids }),
    ...(size === member_ids.length ? {} : { size }),
    ...(lead?.a === at ? {} : { at }),
    ...(is_new ? { is_new } : {}),
    ...rest,
  };
}

export function buildDeskView(i: DeskViewInput, opts: DeskViewOpts = {}): DeskView {
  const caps = opts.caps ?? DESK_VIEW_CAPS;
  const C = caps.chars;
  const keep = keptStories(i, opts);
  const clusters = i.clusters
    .map((c, idx) => ({ c, idx }))
    .filter(({ idx }) => keep.has(idx))
    .map(({ c, idx }) => ({ c: { ...c, title: clip(c.title, C.title) }, idx }));
  // Operator X posts: newest `xPosts` kept (feed order kept), take cut to `take`, over-long links out.
  const xOk = i.xPosts.filter((p) => p.href.length <= C.xUrl);
  const xKeep = new Set([...xOk.map((p) => ({ id: p.id, t: ts(p.at) }))].sort(oldestFirst).slice(Math.max(0, xOk.length - caps.xPosts)).map((p) => p.id));
  const xPosts = xOk.filter((p) => xKeep.has(p.id));
  // Members: exactly the items of kept stories (+ kept X posts) — a dropped story takes its members with it.
  const live = new Set<string>([...clusters.flatMap(({ c }) => [c.lead_id, ...c.member_ids]), ...xPosts.map((p) => `x:${p.id}`)]);
  const leads = new Set<string>([...clusters.map(({ c }) => c.lead_id), ...xPosts.map((p) => `x:${p.id}`)]);
  const gnews = new Map(i.gnews.map((g) => [g.id, g]));
  const rows = new Map<string, MemberRow>();
  for (const [id, m0] of Object.entries(i.members)) {
    if (!live.has(id)) continue;
    const m = { ...m0, publisher: clip(m0.publisher, C.publisher), ...(m0.title !== undefined ? { title: clip(m0.title, id.startsWith("x:") ? C.take : C.title) } : {}) };
    const r: MemberRow = {};
    if (m.publisher !== defaultPublisher(id)) r.p = m.publisher;
    if (m.badge !== defaultBadge(id, m.publisher)) r.b = m.badge;
    if (m.title !== undefined) r.t = m.title;
    if (m.at !== undefined) r.a = m.at;
    if (m.url !== undefined) r.u = m.url;
    if (m.score != null) r.s = m.score;
    if (m.summary && leads.has(id)) r.m = m.summary.slice(0, SUMMARY_CHARS);
    if (m.security) r.sec = true;
    const g = gnews.get(id);
    const dt = g ? clip(stripPublisher(g.title, g.publisher), C.drawerTitle) : null;
    if (dt !== null && dt !== drawerTitle(id, r)) r.dt = dt;
    rows.set(id, r);
  }
  // Cluster leads first, in cluster order (buildRows' stable sort keeps it); then every other member.
  const memberRows: Record<string, MemberRow> = {};
  const orphanClusters: OrphanCluster[] = [];
  clusters.forEach(({ c }, pos) => {
    const lead = rows.get(c.lead_id);
    if (lead && !lead.c && !(c.lead_id in memberRows)) memberRows[c.lead_id] = { ...lead, c: slimCluster(c, lead) };
    else orphanClusters.push({ ...slimCluster(c, lead), lead_id: c.lead_id, i: pos });
  });
  for (const [id, r] of rows) if (!(id in memberRows)) memberRows[id] = r;
  // Papers: over-long links out; the `papers` newest by arXiv id kept, feed order kept.
  const pOk = i.papers.filter((p) => p.href.length <= C.paperUrl && (p.pdfUrl ?? "").length <= C.paperUrl);
  const pKeep = new Set([...pOk].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(Math.max(0, pOk.length - caps.papers)).map((p) => p.id));
  const papers = pOk.filter((p) => pKeep.has(p.id)).map((p): PaperInput => {
    const o: PaperInput = { id: p.id, title: clip(p.title, C.paperTitle), up: p.up, href: p.href };
    if (p.abstract !== undefined) o.abstract = p.abstract.slice(0, ABSTRACT_CHARS);
    if (p.pdfUrl !== undefined) o.pdfUrl = p.pdfUrl;
    if (p.primaryCategory !== undefined) o.primaryCategory = p.primaryCategory;
    if (p.crossrefDoi !== undefined) o.crossrefDoi = p.crossrefDoi;
    else if (p.doi !== undefined) o.doi = p.doi;
    if (p.year !== undefined) o.year = p.year;
    if (p.openalexId !== undefined) o.openalexId = p.openalexId;
    return o;
  });
  const itemsIn = Object.keys(i.members).filter((id) => !id.startsWith("x:")).length;
  return {
    memberRows,
    orphanClusters,
    xPosts: xPosts.map((p): XRef => {
      const take = clip(p.take, C.take);
      const head = memberRows[`x:${p.id}`]?.m?.slice(0, take.length);
      return head === take ? { id: p.id, at: p.at, n: take.length } : { id: p.id, at: p.at, t: take };
    }),
    papers,
    trimmed: {
      stories: i.clusters.length - clusters.length,
      items: itemsIn - crawlItemIds(memberRows).length,
      xPosts: i.xPosts.length - xPosts.length,
      papers: i.papers.length - papers.length,
    },
  };
}

/** MEMBER_ROWS → the memberInfo() map buildRows / Wire chips read. */
export function inflateMembers(rows: Record<string, MemberRow>): Record<string, PulseMemberInfo> {
  const out: Record<string, PulseMemberInfo> = {};
  for (const [id, r] of Object.entries(rows)) {
    const m: PulseMemberInfo = { badge: badgeOf(id, r), publisher: pubOf(id, r) };
    if (r.s !== undefined) m.score = r.s;
    if (r.m !== undefined) m.summary = r.m;
    if (r.u !== undefined) m.url = r.u;
    if (r.sec) m.security = true;
    if (r.t !== undefined) m.title = r.t;
    if (r.a !== undefined) m.at = r.a;
    out[id] = m;
  }
  return out;
}

/** Every non-X member's own time (story age = earliest member). */
export function memberAt(rows: Record<string, MemberRow>, itemIds: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of itemIds) out[id] = rows[id]!.a!;
  return out;
}

/** Drawer coverage list: every non-X member's own headline + time + link. */
export function memberItems(rows: Record<string, MemberRow>, itemIds: readonly string[]): Record<string, MemberItem> {
  const out: Record<string, MemberItem> = {};
  for (const id of itemIds) {
    const r = rows[id]!;
    out[id] = { title: drawerTitle(id, r), publisher: pubOf(id, r), badge: badgeOf(id, r), at: r.a!, url: r.u! };
  }
  return out;
}

function inflateCluster(leadId: string, c: SlimCluster, lead: MemberRow | undefined): ClusterInput {
  const leadSource = c.lead_source ?? memberSource(leadId)!;
  const memberIds = c.member_ids ?? [leadId];
  return {
    ...c,
    id: c.id ?? `cl:${leadId}`,
    title: c.title ?? drawerTitle(leadId, lead!),
    url: c.url ?? lead!.u!,
    lead_id: leadId,
    lead_source: leadSource,
    sources: c.sources ?? [leadSource],
    member_ids: memberIds,
    size: c.size ?? memberIds.length,
    at: c.at ?? lead!.a!,
    is_new: c.is_new ?? false,
  };
}

/** The Pulse clusters, in crawl order (records carrying `c`, with any orphan clusters spliced back in). */
export function inflateClusters(rows: Record<string, MemberRow>, orphans: readonly OrphanCluster[] = []): ClusterInput[] {
  const out: ClusterInput[] = [];
  for (const [id, r] of Object.entries(rows)) {
    if (!r.c) continue;
    const { c, ...lead } = r;
    out.push(inflateCluster(id, c, lead));
  }
  for (const o of orphans) {
    const { lead_id, i, ...c } = o;
    out.splice(i, 0, inflateCluster(lead_id, c, rows[lead_id]));
  }
  return out;
}

/** Stored X refs → the posts (take from the member summary head, link from the member url). */
export function xPosts(refs: readonly XRef[], rows: Record<string, MemberRow>): XPost[] {
  return refs.map((x) => {
    const r = rows[`x:${x.id}`];
    return { id: x.id, take: x.t ?? r?.m?.slice(0, x.n ?? 0) ?? "", href: r?.u ?? "", at: x.at };
  });
}

/** Pulse V5 operator X posts as single-source rows (same shape the desk built from CRAWL). */
export function xRows(refs: readonly XRef[], rows: Record<string, MemberRow>): ClusterInput[] {
  return xPosts(refs, rows).map((p) => ({
    id: `x:${p.id}`,
    title: p.take,
    url: p.href,
    lead_id: `x:${p.id}`,
    lead_source: "x",
    sources: ["x"],
    member_ids: [`x:${p.id}`],
    size: 1,
    at: p.at,
    first_seen: null,
    is_new: false,
  }));
}
