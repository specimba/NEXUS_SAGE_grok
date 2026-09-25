/**
 * Pulse V5 (AUTONOMY-4H Beat 3) — pure view-model helpers for the cluster
 * table + source health strip. No IO, no HTTP. Pulse only; never Brief.
 * Spec: refs/UX-PULSE-V5.md (incl. 2026-09-25 addendum).
 */

/** NEW noise guard: above this share of NEW rows ⇒ BASELINE, no NEW plates. */
export const NEW_BASELINE_RATIO = 0.4;
export const PULSE_V5_MAX_ROWS = 24;
export const HEALTH_TICKS = 5;

export type PulseMemberInfo = {
  /** 2–3 letter mono badge, e.g. HN · GNW · OAI · SEC. */
  badge: string;
  /** Publisher / lab / author label for the "also covered by" line. */
  publisher: string;
  score?: number;
  summary?: string;
  url?: string;
  security?: boolean;
  /** The member's own headline + publish time (WIRE-copy dedupe between news outlets). */
  title?: string;
  at?: string;
};

export type ClusterInput = {
  id: string;
  title: string;
  url: string;
  lead_id: string;
  lead_source: string;
  sources: string[];
  member_ids: string[];
  size: number;
  at: string;
  first_seen: string | null;
  is_new: boolean;
  /** Optional per-member detail; `self_repost: true` = a company's own post re-carried (e.g. via GNews) ⇒ 0 sources. */
  members?: Array<{ id: string; source?: string; publisher?: string | null; self_repost?: boolean }>;
  self_repost_ids?: string[];
};

export type PulseV5Row = {
  id: string;
  leadId: string;
  title: string;
  url: string;
  at: string;
  /** Raw is_new from Beat 2 seen-index. */
  isNew: boolean;
  /** is_new after the baseline guard — this is what renders the NEW plate. */
  showNew: boolean;
  multiSource: boolean;
  leadBadge: string;
  alsoBadges: string[];
  alsoPublishers: string[];
  /** Badges of self-repost members — rendered dim/struck `SELF`, never counted. */
  selfBadges: string[];
  /** Independent sources (self reposts excluded; WIRE copies between outlets count once). */
  sourceCount: number;
  /** One chip per source type, ×n = independent sources of that type; Σ n === sourceCount (SELF excluded). */
  chips: SrcChip[];
  /** Outlet members folded together as press-release / wire copies (drawer marks them WIRE). */
  wireCopyIds: string[];
  size: number;
  score: number | null;
  security: boolean;
  summary?: string;
};

const SOURCE_BADGE: Record<string, string> = {
  "hn-algolia": "HN",
  "gnews-rss": "GNW",
  "rss-lab": "LAB",
  "rss-security": "SEC",
  x: "X",
};

const LAB_BADGE: Record<string, string> = {
  openai: "OAI",
  anthropic: "ANT",
  deepmind: "DMD",
  "google-ai": "GAI",
  "google-research": "GRS",
  huggingface: "HF",
  mistral: "MIS",
  nvidia: "NV",
  "nvidia-dev": "NVD",
  "ms-research": "MSR",
};

export function labBadge(lab: string): string {
  return LAB_BADGE[lab] ?? lab.slice(0, 3).toUpperCase();
}

/** Pulse source class from a member id prefix (hn:/gnews:/rss:/rss-sec:/x:). */
export function memberSource(id: string): string | null {
  if (id.startsWith("hn:")) return "hn-algolia";
  if (id.startsWith("gnews:")) return "gnews-rss";
  if (id.startsWith("rss-sec:")) return "rss-security";
  if (id.startsWith("rss:")) return "rss-lab";
  if (id.startsWith("x:")) return "x";
  return null;
}

export function selfRepostIds(c: Pick<ClusterInput, "members" | "self_repost_ids">): Set<string> {
  const out = new Set<string>(c.self_repost_ids ?? []);
  for (const m of c.members ?? []) if (m && m.self_repost === true) out.add(m.id);
  return out;
}

/**
 * Independent-publisher key for one member (N SRC = distinct keys; self-reposts excluded upstream).
 * HN counts as one publisher; lab / security feeds by lab (from the id `rss:<lab>:…`); GNews by its
 * publisher name (deduped case-insensitively); X per handle. Unknown publisher ⇒ the id itself.
 */
export function publisherKey(id: string, publisher?: string | null): string {
  if (id.startsWith("hn:")) return "hn";
  const pub = (publisher ?? "").trim().toLowerCase();
  if (id.startsWith("x:")) return `x:${pub || id.slice(2)}`;
  if (id.startsWith("rss-sec:") || id.startsWith("rss:")) {
    const lab = id.split(":")[1];
    return lab ? `lab:${lab}` : pub || id;
  }
  if (id.startsWith("gnews:")) return pub ? `pub:${pub}` : id;
  return pub || id;
}

export type SrcChip = { badge: string; n: number };
export type MemberMeta = { title?: string | null; at?: string | null };

/**
 * WIRE copies (Scout): two NEWS OUTLETS carrying the same press release / wire story — near-identical
 * headline (token Dice ≥ WIRE_COPY_SIM) published within WIRE_COPY_WINDOW_MS — count as ONE source.
 * Outlets only: Google News publishers and security/news RSS. NEVER HN (it copies the original headline
 * within minutes by design), lab / first-party feeds, papers or X.
 */
export const WIRE_COPY_SIM = 0.8;
export const WIRE_COPY_WINDOW_MS = 2 * 60 * 60 * 1000;

export function isOutletMember(id: string): boolean {
  return id.startsWith("gnews:") || id.startsWith("rss-sec:");
}

const HEADLINE_STOP = new Set(["a", "an", "the", "to", "of", "in", "on", "for", "and", "with", "as", "at", "by", "is", "its"]);

/** Normalized headline tokens: publisher suffix (" - Reuters") dropped, lowercase, accents folded, stopwords out. */
export function headlineTokens(title: string): Set<string> {
  const t = String(title ?? "")
    .replace(/\s+[-–—|]\s+[^-–—|]{2,60}$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return new Set(t.split(/[^a-z0-9]+/).filter((w) => w && !HEADLINE_STOP.has(w)));
}

/** Dice coefficient of the two token sets (0…1). */
export function headlineSimilarity(a: string, b: string): number {
  const A = headlineTokens(a);
  const B = headlineTokens(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return (2 * both) / (A.size + B.size);
}

export function isWireCopy(a: MemberMeta | undefined, b: MemberMeta | undefined): boolean {
  const ta = Date.parse(a?.at ?? "");
  const tb = Date.parse(b?.at ?? "");
  if (!a?.title || !b?.title || !Number.isFinite(ta) || !Number.isFinite(tb)) return false;
  return Math.abs(ta - tb) <= WIRE_COPY_WINDOW_MS && headlineSimilarity(a.title, b.title) >= WIRE_COPY_SIM;
}

export type SourceUnit = { key: string; ids: string[]; wireCopyIds: string[] };

/**
 * Independent source units of a cluster: distinct publisher keys (self-reposts count 0), then outlet-only
 * keys joined when any of their members are WIRE copies of each other. N SRC = units.length.
 */
export function sourceUnits(
  c: Pick<ClusterInput, "lead_id" | "member_ids" | "members" | "self_repost_ids">,
  publisherOf: (id: string) => string | null | undefined = () => null,
  metaOf: (id: string) => MemberMeta | undefined = () => undefined,
): SourceUnit[] {
  const selfIds = selfRepostIds(c);
  selfIds.delete(c.lead_id);
  const memberPub = new Map((c.members ?? []).map((m) => [m.id, (m as { publisher?: string | null }).publisher ?? null]));
  const byKey = new Map<string, string[]>();
  for (const id of [c.lead_id, ...c.member_ids]) {
    if (selfIds.has(id)) continue;
    const k = publisherKey(id, publisherOf(id) ?? memberPub.get(id));
    const ids = byKey.get(k) ?? [];
    if (!ids.includes(id)) ids.push(id);
    byKey.set(k, ids);
  }
  const keys = [...byKey.keys()];
  const parent = keys.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const copies = new Set<string>();
  for (let i = 0; i < keys.length; i++) {
    const a = byKey.get(keys[i]!)!;
    if (!a.every(isOutletMember)) continue;
    for (let j = i + 1; j < keys.length; j++) {
      const b = byKey.get(keys[j]!)!;
      if (!b.every(isOutletMember)) continue;
      for (const x of a)
        for (const y of b)
          if (isWireCopy(metaOf(x), metaOf(y))) {
            parent[find(j)] = find(i);
            copies.add(x).add(y);
          }
    }
  }
  const groups = new Map<number, SourceUnit>();
  keys.forEach((k, i) => {
    const r = find(i);
    const u = groups.get(r) ?? { key: keys[r]!, ids: [], wireCopyIds: [] };
    for (const id of byKey.get(k)!) {
      u.ids.push(id);
      if (copies.has(id)) u.wireCopyIds.push(id);
    }
    groups.set(r, u);
  });
  return [...groups.values()];
}

/** Distinct independent publishers in a cluster (lead always counts; self-reposts count 0; WIRE copies once). */
export function independentPublishers(
  c: Pick<ClusterInput, "lead_id" | "member_ids" | "members" | "self_repost_ids">,
  publisherOf: (id: string) => string | null | undefined = () => null,
  metaOf: (id: string) => MemberMeta | undefined = () => undefined,
): Set<string> {
  return new Set(sourceUnits(c, publisherOf, metaOf).map((u) => u.key));
}

/** Chips from units: one per source type (badge of the unit's first member), lead's type first. */
export function chipsFromUnits(units: SourceUnit[], badgeOf: (id: string) => string): SrcChip[] {
  const out: SrcChip[] = [];
  for (const u of units) {
    const b = badgeOf(u.ids[0]!);
    const hit = out.find((x) => x.badge === b);
    if (hit) hit.n++;
    else out.push({ badge: b, n: 1 });
  }
  return out;
}

export function chipLabel(ch: SrcChip): string {
  return ch.n > 1 ? `${ch.badge}×${ch.n}` : ch.badge;
}

export function sourceBadge(source: string): string {
  return SOURCE_BADGE[source] ?? source.slice(0, 3).toUpperCase();
}

/** Baseline when > 40% of rows are NEW (first crawl / reset seen-index). */
export function isBaseline(flags: boolean[], ratio: number = NEW_BASELINE_RATIO): boolean {
  if (flags.length === 0) return false;
  const n = flags.filter(Boolean).length;
  return n / flags.length > ratio;
}

/** HN-style compact age: 41m · 2h · 3d · 8y. */
export function compactAge(at: string, now: number): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "—";
  const m = Math.max(0, Math.floor((now - t) / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d`;
  return `${Math.floor(d / 365)}y`;
}

export function buildRows(
  clusters: ClusterInput[],
  members: Record<string, PulseMemberInfo>,
): { rows: PulseV5Row[]; baseline: boolean; newCount: number } {
  const baseline = isBaseline(clusters.map((c) => c.is_new));
  const rows = clusters.map((c): PulseV5Row => {
    const lead = members[c.lead_id];
    const leadBadge = lead?.badge ?? sourceBadge(c.lead_source);
    const selfIds = selfRepostIds(c);
    selfIds.delete(c.lead_id);
    const memberSrc = new Map((c.members ?? []).map((m) => [m.id, m.source]));
    // N SRC = distinct independent publishers (not source classes); self-reposts count 0; WIRE copies once.
    const units = sourceUnits(c, (id) => members[id]?.publisher, (id) => members[id]);
    const badgeOf = (id: string) => members[id]?.badge ?? sourceBadge(memberSrc.get(id) ?? memberSource(id) ?? c.lead_source);
    const indep = new Set(units.map((u) => u.key));
    let chips = chipsFromUnits(units, badgeOf);
    // Unrecognised ids with no per-member info ⇒ fall back to cluster-level sources[].
    if (!c.members && c.member_ids.every((id) => !memberSource(id)) && c.sources.length > indep.size) {
      indep.clear();
      for (const s of c.sources) indep.add(s);
      chips = chipsFromUnits(c.sources.map((s) => ({ key: s, ids: [s], wireCopyIds: [] })), (s) => sourceBadge(s));
    }
    const multiSource = indep.size > 1;
    const selfBadges: string[] = [];
    const alsoBadges: string[] = [];
    const alsoPublishers: string[] = [];
    let score: number | null = lead?.score ?? null;
    let security = lead?.security ?? c.lead_source === "rss-security";
    for (const id of c.member_ids) {
      if (id === c.lead_id) continue;
      const m = members[id];
      if (selfIds.has(id)) {
        const b = m?.badge ?? sourceBadge(memberSrc.get(id) ?? memberSource(id) ?? "");
        if (!selfBadges.includes(b)) selfBadges.push(b);
        continue;
      }
      if (!m) continue;
      if (m.score != null) score = Math.max(score ?? 0, m.score);
      if (m.security) security = true;
      if (multiSource && m.badge !== leadBadge && !alsoBadges.includes(m.badge)) alsoBadges.push(m.badge);
      if (m.publisher && !alsoPublishers.includes(m.publisher)) alsoPublishers.push(m.publisher);
    }
    return {
      id: c.id,
      leadId: c.lead_id,
      title: c.title,
      url: c.url,
      at: c.at,
      isNew: c.is_new,
      showNew: c.is_new && !baseline,
      multiSource,
      leadBadge,
      alsoBadges: multiSource ? alsoBadges : [],
      alsoPublishers: multiSource ? alsoPublishers : [],
      selfBadges,
      sourceCount: indep.size,
      chips,
      wireCopyIds: units.flatMap((u) => u.wireCopyIds),
      size: c.size,
      score,
      security,
      summary: lead?.summary,
    };
  });
  // Lead = most sources × most members × freshest (spec §2).
  rows.sort((a, b) => {
    const sa = new Set(a.alsoBadges).size + (a.multiSource ? 1 : 0);
    const sb = new Set(b.alsoBadges).size + (b.multiSource ? 1 : 0);
    if (sb !== sa) return sb - sa;
    if (b.size !== a.size) return b.size - a.size;
    return Date.parse(b.at) - Date.parse(a.at);
  });
  return { rows, baseline, newCount: clusters.filter((c) => c.is_new).length };
}

export type SigCell = { text: string; dim: boolean };

/**
 * SIG column (UX fix): plain integers only. HN points / X likes → `247`;
 * rows whose source carries no score → dim `—`. No `p`, `×N`, `·` mixing.
 */
export function sigCell(row: Pick<PulseV5Row, "score">): SigCell {
  if (row.score == null || !Number.isFinite(row.score)) return { text: "—", dim: true };
  return { text: String(Math.round(row.score)), dim: false };
}

export type HealthCellState = "ok" | "soft" | "fail";

export function healthCellState(state: string): HealthCellState {
  if (state === "ok") return "ok";
  if (state === "flaky" || state === "soft") return "soft";
  return "fail";
}

/** Filled ticks of 5 = consecutive ok runs (7d ledger), capped. */
export function healthTicks(streakOk: number, max: number = HEALTH_TICKS): number {
  return Math.max(0, Math.min(max, Math.floor(streakOk)));
}

/* ---------------- Beat 6 · Papers table (same instrument family as Pulse V5) ---------------- */

export type PaperInput = {
  id: string;
  title: string;
  up: number;
  href: string;
  abstract?: string;
  pdfUrl?: string;
  authors?: string[];
  primaryCategory?: string;
  doi?: string;
  year?: number;
  openalexId?: string;
  crossrefDoi?: string;
};

export type PaperBadge = { label: "HF" | "ARX" | "OAX" | "XREF"; lit: boolean };

export type PaperRow = {
  id: string;
  title: string;
  up: number;
  year: number | null;
  badges: PaperBadge[];
  abs: string;
  pdf: string | null;
  doi: string | null;
  abstract: string | null;
  category: string | null;
};

/** arXiv ids encode YYMM — `2609.25804` ⇒ 2026. Null when not an arXiv-style id. */
export function arxivYear(id: string): number | null {
  const m = /^(\d{2})(\d{2})\.\d{4,5}(v\d+)?$/.exec(id);
  if (!m) return null;
  const mm = Number(m[2]);
  return mm >= 1 && mm <= 12 ? 2000 + Number(m[1]) : null;
}

export function buildPaperRows(papers: PaperInput[]): PaperRow[] {
  return papers.map((p) => {
    const doi = p.crossrefDoi ?? p.doi ?? null;
    return {
      id: p.id,
      title: p.title,
      up: Number.isFinite(p.up) ? p.up : 0,
      year: p.year ?? arxivYear(p.id),
      badges: [
        { label: "HF", lit: true },
        { label: "ARX", lit: Boolean(p.abstract || p.pdfUrl || p.primaryCategory) },
        { label: "OAX", lit: Boolean(p.openalexId) },
        { label: "XREF", lit: Boolean(p.crossrefDoi) },
      ],
      abs: p.href,
      pdf: p.pdfUrl ?? null,
      doi: doi ? doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null,
      abstract: p.abstract ?? null,
      category: p.primaryCategory ?? null,
    };
  });
}
