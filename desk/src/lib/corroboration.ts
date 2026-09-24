/**
 * Beat 4 — corroboration rank below the lead (AUTONOMY-4H-PROGRAM.md).
 * Pure: caller does IO.
 *
 * score = base × min(1.45, 1 + 0.15 × (sources − 1))
 *  · lead (hf-incident / hf-swarm) is pinned at rank 1 and never scored
 *  · only curated Brief/Digest items are ranked; items with briefEligible:false are
 *    dropped before ranking (Taste, Pulse, shelf never enter Brief/Digest)
 *  · crawl clusters may *corroborate* a curated item (add their source classes to its
 *    count) via a strict per-item signature — they are never ranked or shown themselves
 */

import { companyOfUrl, type Company } from "./publisher-company";

export const CORROBORATION_STEP = 0.15;
export const CORROBORATION_CAP = 1.45;
export const LEAD_IDS = ["hf-incident", "hf-swarm"] as const;

export function corroborationMultiplier(sources: number): number {
  const n = Math.max(1, Math.floor(sources));
  return Math.min(CORROBORATION_CAP, 1 + CORROBORATION_STEP * (n - 1));
}

export type RankRef = { href: string; label?: string; role?: string };

export type RankableItem = {
  id: string;
  kind: "lead" | "companion" | "rest" | "drop";
  confidence?: "high" | "medium" | "low";
  refs?: RankRef[];
  briefEligible?: boolean;
};

export type CorroboratingCluster = {
  id: string;
  title: string;
  /** Independent source classes (dedupe already drops GNews self-reposts). */
  sources: string[];
  url?: string;
  lead_source?: string;
  /** Distinct independent publisher keys (pulse-v5 independentPublishers). When present, crawl hits count per publisher. */
  publishers?: string[];
  /** Publisher key of the cluster lead (self-repost check). */
  lead_publisher?: string;
};

/**
 * Strict per-item crawl signatures. Case-sensitive where the word is also an
 * ordinary noun (AISLE vs aisle). Google "Project Astra" is a false friend of
 * OpenAI Astra and is excluded.
 */
export const CRAWL_SIGNATURES: Record<string, { include: RegExp; exclude?: RegExp }> = {
  "astra-depth": {
    include: /\bGPT[-‑ ]?6[ ‑-]Astra\b|\bOpenAI\b[^.]*\bAstra\b|\bAstra\b[^.]*\bOpenAI\b/,
    exclude: /\bProject Astra\b|\bGemini\b|\bDeepMind\b/i,
  },
  "aisle-curl": { include: /\bAISLE\b|\bcurl\b[^.]*\bCVEs?\b/ },
  "harness-papers": { include: /Harness-of-Harness|\bskill[- ]retrieval\b/i },
  "hf-swarm": { include: /\bHugging Face\b[^.]*\b(incident|breach|swarm)\b|\bHF (incident|swarm|breach)\b/i },
};

const CRAWL_CLASS: Record<string, string> = {
  "hn-algolia": "crawl:hn",
  "rss-lab": "crawl:lab",
  "rss-security": "crawl:sec",
  "gnews-rss": "crawl:gnews",
};

/**
 * One key per independent source. Known companies collapse to `co:<company>` (the company's
 * blog, lab feed, official/founder X handle and Google News reposts are one source); otherwise
 * host, except x.com/<handle> counts per handle.
 */
export function sourceKey(href: string): string | null {
  const co = companyOfUrl(href);
  if (co) return `co:${co}`;
  return rawSourceKey(href);
}

/** Pre-company key: host, or x:@handle. */
export function rawSourceKey(href: string): string | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "x.com" || host === "twitter.com") {
    const handle = u.pathname.split("/").filter(Boolean)[0];
    return handle ? `x:@${handle.toLowerCase()}` : "x";
  }
  return host;
}

export function crawlHits(itemId: string, clusters: CorroboratingCluster[]): CorroboratingCluster[] {
  const sig = CRAWL_SIGNATURES[itemId];
  if (!sig) return [];
  return clusters.filter((c) => sig.include.test(c.title) && !(sig.exclude && sig.exclude.test(c.title)));
}

export function countSources(
  item: RankableItem,
  clusters: CorroboratingCluster[] = [],
): { n: number; keys: string[]; hits: string[] } {
  const keys = new Set<string>();
  const refCompanies = new Set<Company>();
  for (const r of item.refs ?? []) {
    const k = sourceKey(r.href);
    if (k) keys.add(k);
    const co = companyOfUrl(r.href);
    if (co) refCompanies.add(co);
  }
  const hits = crawlHits(item.id, clusters);
  for (const c of hits) {
    // A crawl cluster led by the item's own company (its blog / lab feed) is a self-repost: 0 sources.
    const leadCo = c.url ? companyOfUrl(c.url) : null;
    if (c.publishers) {
      // N SRC = distinct independent publishers (same rule as Pulse / Wire / lead pick).
      for (const p of c.publishers) {
        if (leadCo && refCompanies.has(leadCo) && (!c.lead_publisher || p === c.lead_publisher)) continue;
        keys.add(`crawl:${p}`);
      }
      continue;
    }
    for (const s of c.sources) {
      if (leadCo && refCompanies.has(leadCo) && (!c.lead_source || s === c.lead_source)) continue;
      keys.add(CRAWL_CLASS[s] ?? `crawl:${s}`);
    }
  }
  return { n: Math.max(1, keys.size), keys: [...keys].sort(), hits: hits.map((h) => h.id) };
}

const CONFIDENCE_BASE: Record<string, number> = { high: 1, medium: 0.8, low: 0.6 };

export type RankRow = {
  id: string;
  kind: RankableItem["kind"];
  rank: number;
  /** Rank without corroboration (base only, baseline tie-break). */
  base_rank: number;
  sources: number;
  source_keys: string[];
  crawl_hits: string[];
  base: number;
  mult: number;
  score: number;
  lead: boolean;
};

export function isLead(item: Pick<RankableItem, "id" | "kind">, leadId = "hf-incident"): boolean {
  return item.id === leadId || (LEAD_IDS as readonly string[]).includes(item.id) || item.kind === "lead";
}

/** Drop anything flagged briefEligible:false and every drop-kind row. */
export function eligibleForBriefDigest<T extends RankableItem>(items: T[]): T[] {
  return items.filter((i) => i.briefEligible !== false && i.kind !== "drop");
}

export function rankBelowLead(
  items: RankableItem[],
  opts: { leadId?: string; clusters?: CorroboratingCluster[] } = {},
): RankRow[] {
  const leadId = opts.leadId ?? "hf-incident";
  const usable = eligibleForBriefDigest(items);
  const lead = usable.find((i) => isLead(i, leadId));
  const rows = usable
    .filter((i) => i !== lead)
    .map((i, idx) => {
      const src = countSources(i, opts.clusters);
      const base = CONFIDENCE_BASE[i.confidence ?? "high"] ?? 1;
      const mult = corroborationMultiplier(src.n);
      return { i, idx, src, base, mult, score: Math.round(base * mult * 1000) / 1000 };
    });
  const byBase = [...rows].sort((a, b) => b.base - a.base || a.idx - b.idx);
  const off = lead ? 2 : 1;
  const baseRank = new Map(byBase.map((r, k) => [r.i.id, k + off]));
  rows.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const out: RankRow[] = [];
  if (lead) {
    const src = countSources(lead, opts.clusters);
    out.push({
      id: lead.id,
      kind: "lead",
      rank: 1,
      base_rank: 1,
      sources: src.n,
      source_keys: src.keys,
      crawl_hits: src.hits,
      base: 1,
      mult: 1,
      score: Infinity,
      lead: true,
    });
  }
  rows.forEach((r, k) =>
    out.push({
      id: r.i.id,
      kind: r.i.kind,
      rank: k + off,
      base_rank: baseRank.get(r.i.id) ?? k + off,
      sources: r.src.n,
      source_keys: r.src.keys,
      crawl_hits: r.src.hits,
      base: r.base,
      mult: r.mult,
      score: r.score,
      lead: false,
    }),
  );
  return out;
}

export type RankSnapshot = {
  schema: 1;
  at: string;
  crawl_at: string;
  lead_id: string;
  rows: Array<Pick<RankRow, "id" | "rank" | "base_rank" | "sources" | "source_keys" | "crawl_hits" | "mult" | "lead">>;
};

export type MovedRow = {
  id: string;
  status: "new" | "up" | "down" | "same" | "gone";
  prev_rank: number | null;
  rank: number | null;
  prev_sources: number | null;
  sources: number | null;
  /** Move attributable to corroboration this crawl (rank differs from base rank). */
  by_corroboration: boolean;
};

export function diffSnapshots(prev: RankSnapshot | null, cur: RankSnapshot): MovedRow[] {
  const prevById = new Map((prev?.rows ?? []).map((r) => [r.id, r]));
  const out: MovedRow[] = cur.rows.map((r) => {
    const p = prevById.get(r.id);
    const status: MovedRow["status"] = !p ? "new" : r.rank < p.rank ? "up" : r.rank > p.rank ? "down" : "same";
    return {
      id: r.id,
      status,
      prev_rank: p?.rank ?? null,
      rank: r.rank,
      prev_sources: p?.sources ?? null,
      sources: r.sources,
      by_corroboration: r.rank !== r.base_rank,
    };
  });
  for (const p of prev?.rows ?? []) {
    if (!cur.rows.some((r) => r.id === p.id)) {
      out.push({ id: p.id, status: "gone", prev_rank: p.rank, rank: null, prev_sources: p.sources, sources: null, by_corroboration: false });
    }
  }
  return out;
}

export function toSnapshot(rows: RankRow[], at: string, crawlAt: string, leadId = "hf-incident"): RankSnapshot {
  return {
    schema: 1,
    at,
    crawl_at: crawlAt,
    lead_id: rows.some((r) => r.lead && /hf/.test(r.id)) ? leadId : rows.find((r) => r.lead)?.id ?? "(none)",
    rows: rows.map(({ id, rank, base_rank, sources, source_keys, crawl_hits, mult, lead }) => ({
      id,
      rank,
      base_rank,
      sources,
      source_keys,
      crawl_hits,
      mult,
      lead,
    })),
  };
}
