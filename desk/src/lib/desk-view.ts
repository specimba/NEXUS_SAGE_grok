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
 */
import { labBadge, memberSource, type ClusterInput, type PaperInput, type PulseMemberInfo } from "@/lib/pulse-v5";
import type { LeadEntry } from "@/lib/lead-pick";
import type { MemberItem } from "@/lib/story-drawer";

/** Pulse row shows `summary.slice(0, 280)`; Papers row shows `abstract.slice(0, 600)`. */
export const SUMMARY_CHARS = 280;
export const ABSTRACT_CHARS = 600;

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
  /** signal (HN points / X likes) */ s?: number;
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

type RawCluster = ClusterInput & { canonical_url?: string; all_sources?: string[]; score?: number };
type RawPaper = PaperInput & Record<string, unknown>;

export type DeskViewInput = {
  clusters: readonly RawCluster[];
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
  xPosts: XPost[];
  papers: PaperInput[];
};

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

export function buildDeskView(i: DeskViewInput): DeskView {
  const leads = new Set<string>([...i.clusters.map((c) => c.lead_id), ...i.xPosts.map((p) => `x:${p.id}`)]);
  const gnews = new Map(i.gnews.map((g) => [g.id, g]));
  const rows = new Map<string, MemberRow>();
  for (const [id, m] of Object.entries(i.members)) {
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
    if (g && stripPublisher(g.title, g.publisher) !== drawerTitle(id, r)) r.dt = stripPublisher(g.title, g.publisher);
    rows.set(id, r);
  }
  // Cluster leads first, in cluster order (buildRows' stable sort keeps it); then every other member.
  const memberRows: Record<string, MemberRow> = {};
  const orphanClusters: OrphanCluster[] = [];
  i.clusters.forEach((c, idx) => {
    const lead = rows.get(c.lead_id);
    if (lead && !lead.c && !(c.lead_id in memberRows)) memberRows[c.lead_id] = { ...lead, c: slimCluster(c, lead) };
    else orphanClusters.push({ ...slimCluster(c, lead), lead_id: c.lead_id, i: idx });
  });
  for (const [id, r] of rows) if (!(id in memberRows)) memberRows[id] = r;
  const papers = i.papers.map((p): PaperInput => {
    const o: PaperInput = { id: p.id, title: p.title, up: p.up, href: p.href };
    if (p.abstract !== undefined) o.abstract = p.abstract.slice(0, ABSTRACT_CHARS);
    if (p.pdfUrl !== undefined) o.pdfUrl = p.pdfUrl;
    if (p.primaryCategory !== undefined) o.primaryCategory = p.primaryCategory;
    if (p.crossrefDoi !== undefined) o.crossrefDoi = p.crossrefDoi;
    else if (p.doi !== undefined) o.doi = p.doi;
    if (p.year !== undefined) o.year = p.year;
    if (p.openalexId !== undefined) o.openalexId = p.openalexId;
    return o;
  });
  return {
    memberRows,
    orphanClusters,
    xPosts: i.xPosts.map((p) => ({ id: p.id, take: p.take, href: p.href, at: p.at })),
    papers,
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

/** Pulse V5 operator X posts as single-source rows (same shape the desk built from CRAWL). */
export function xRows(posts: readonly XPost[]): ClusterInput[] {
  return posts.map((p) => ({
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
