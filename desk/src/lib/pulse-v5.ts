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
    const multiSource = new Set(c.sources).size > 1;
    const alsoBadges: string[] = [];
    const alsoPublishers: string[] = [];
    let score: number | null = lead?.score ?? null;
    let security = lead?.security ?? c.lead_source === "rss-security";
    for (const id of c.member_ids) {
      if (id === c.lead_id) continue;
      const m = members[id];
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
