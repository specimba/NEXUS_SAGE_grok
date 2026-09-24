/**
 * Beat 7 — Brief Wire strip. Pure helpers, no IO.
 * Top 3–5 live Pulse clusters under the Take: ≥2 independent sources (self-reposts count 0),
 * AI-filtered, never briefEligible:false, never Taste / X. Rows carry NEW or ▲/▼ vs the
 * previous crawl's wire snapshot (artifacts/sage/wire-prev.json, rotated by scripts/rank-snapshot.ts).
 * The Wire never displaces the lead (hf-incident) or the Take — it renders under them.
 */
import { isAiRelevant } from "@/lib/ai-relevance";
import { buildRows, type ClusterInput } from "@/lib/pulse-v5";

export const WIRE_MIN = 3;
export const WIRE_MAX = 5;
export const WIRE_MIN_SOURCES = 2;

export type WireCluster = ClusterInput & {
  /** Cluster-level gate; false ⇒ never on the Wire. */
  briefEligible?: boolean;
};

export type WireCandidate = {
  id: string;
  title: string;
  url: string;
  at: string;
  sources: number;
  score: number | null;
  member_ids: string[];
  is_new: boolean;
};

export type WireStatus = "new" | "up" | "down" | "same";

export type WireRow = WireCandidate & {
  rank: number;
  prev_rank: number | null;
  status: WireStatus;
};

export type WireSnapshot = {
  schema: 1;
  at: string;
  crawl_at: string;
  /** Every eligible cluster, ranked (1-based by position) — so ▲/▼ is meaningful beyond the top 5. */
  order: { id: string; member_ids: string[] }[];
  rows: WireRow[];
};

export type WireOpts = {
  tasteIds?: Iterable<string>;
  /** member id → signal (HN points, X likes…). */
  scores?: Record<string, number>;
};

/** Why a cluster is kept off the Wire (null = eligible). Source count is checked separately. */
export function wireExcludeReason(c: WireCluster, tasteIds: Set<string> = new Set()): string | null {
  if (c.briefEligible === false) return "briefEligible:false";
  const ids = [c.id, c.lead_id, ...c.member_ids];
  if (c.lead_source === "x" || ids.some((id) => id.startsWith("x:"))) return "x";
  if (ids.some((id) => tasteIds.has(id) || tasteIds.has(id.replace(/^[a-z-]+:/, "")))) return "taste";
  // Lab feeds were already category/path-filtered at ingest (NVIDIA consumer out); HN/GNews/SEC need an AI title/domain.
  if (c.lead_source !== "rss-lab" && !isAiRelevant(c.title, c.url)) return "not-ai";
  return null;
}

/** Eligible candidates, ranked: most independent sources → freshest → highest signal → id. */
export function wireCandidates(clusters: WireCluster[], opts: WireOpts = {}): WireCandidate[] {
  const taste = new Set(opts.tasteIds ?? []);
  const kept = clusters.filter((c) => wireExcludeReason(c, taste) === null);
  const byId = new Map(kept.map((c) => [c.id, c]));
  const { rows } = buildRows(kept, {});
  const out: WireCandidate[] = [];
  for (const r of rows) {
    if (r.sourceCount < WIRE_MIN_SOURCES) continue;
    const c = byId.get(r.id)!;
    let score: number | null = null;
    for (const id of c.member_ids) {
      const s = opts.scores?.[id];
      if (s != null) score = Math.max(score ?? 0, s);
    }
    out.push({ id: c.id, title: c.title, url: c.url, at: c.at, sources: r.sourceCount, score, member_ids: [...c.member_ids], is_new: c.is_new });
  }
  out.sort(
    (a, b) =>
      b.sources - a.sources ||
      (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0) ||
      (b.score ?? -1) - (a.score ?? -1) ||
      a.id.localeCompare(b.id),
  );
  return out;
}

/** Previous-crawl position of a cluster: same id, else any shared member (lead can change between crawls). */
export function prevRankOf(prev: WireSnapshot | null, c: Pick<WireCandidate, "id" | "member_ids">): number | null {
  if (!prev) return null;
  let k = prev.order.findIndex((o) => o.id === c.id);
  if (k < 0) {
    const mine = new Set(c.member_ids);
    k = prev.order.findIndex((o) => o.member_ids.some((m) => mine.has(m)));
  }
  return k < 0 ? null : k + 1;
}

export function wireStatus(rank: number, prevRank: number | null, hasPrev: boolean, isNew: boolean): WireStatus {
  if (!hasPrev) return isNew ? "new" : "same";
  if (prevRank == null) return "new";
  if (rank < prevRank) return "up";
  if (rank > prevRank) return "down";
  return "same";
}

export function buildWire(
  clusters: WireCluster[],
  prev: WireSnapshot | null,
  opts: WireOpts & { at: string; crawlAt: string; max?: number },
): WireSnapshot {
  const cands = wireCandidates(clusters, opts);
  const rows = cands.slice(0, opts.max ?? WIRE_MAX).map((c, i): WireRow => {
    const rank = i + 1;
    const prev_rank = prevRankOf(prev, c);
    return { ...c, rank, prev_rank, status: wireStatus(rank, prev_rank, prev != null, c.is_new) };
  });
  return {
    schema: 1,
    at: opts.at,
    crawl_at: opts.crawlAt,
    order: cands.map((c) => ({ id: c.id, member_ids: c.member_ids })),
    rows,
  };
}

export function wireCounts(rows: Pick<WireRow, "status">[]): { fresh: number; moved: number } {
  return {
    fresh: rows.filter((r) => r.status === "new").length,
    moved: rows.filter((r) => r.status === "up" || r.status === "down").length,
  };
}

export function wireMark(r: Pick<WireRow, "status" | "rank" | "prev_rank">): string {
  if (r.status === "new") return "NEW";
  if (r.status === "up") return `▲${(r.prev_rank ?? r.rank) - r.rank}`;
  if (r.status === "down") return `▼${r.rank - (r.prev_rank ?? r.rank)}`;
  return "·";
}

/** "HH:MM" in Europe/Istanbul (UTC+3) — deterministic for SSR. */
export function istanbulHHMM(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "--:--";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(t);
}

export function wireHeader(crawlAt: string, rows: Pick<WireRow, "status">[]): string {
  const { fresh, moved } = wireCounts(rows);
  return `WIRE · crawl ${istanbulHHMM(crawlAt)} UTC+3 · ${fresh} new · ${moved} moved`;
}

export function readWireSnapshot(raw: unknown): WireSnapshot | null {
  const j = raw as WireSnapshot | null;
  return j && j.schema === 1 && Array.isArray(j.order) && Array.isArray(j.rows) ? j : null;
}
