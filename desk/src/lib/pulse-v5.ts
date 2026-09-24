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
  members?: Array<{ id: string; source?: string; self_repost?: boolean }>;
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
  /** Independent sources (self reposts excluded). */
  sourceCount: number;
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
    const indep = new Set<string>([c.lead_source]);
    for (const id of c.member_ids) {
      if (selfIds.has(id)) continue;
      const s = memberSrc.get(id) ?? memberSource(id);
      if (s) indep.add(s);
    }
    // No per-member info at all ⇒ trust cluster-level sources[].
    if (!c.members && c.member_ids.every((id) => !memberSource(id))) for (const s of c.sources) indep.add(s);
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
