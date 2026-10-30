/**
 * PASS-F2.2 — "Past 24 hours" TL;DR (refs/PASS-F2-FRESH-TLDR-PLAIN.md). Pure, deterministic, extractive only:
 * every bullet is one gated Wire candidate (same gate as the Wire: AI filter, DENY, analyst/release rules) whose
 * story time is within 24 h of the crawl. Order: most independent publishers → newest. Dedupe by story cluster
 * (one bullet per cluster), ≤ 2 bullets per lab/company. 5–7 bullets; fewer than 3 ⇒ `quiet` (never padded).
 * PASS-WIRE-CLUSTER (4): `excludeIds` (the daily lead) applies here too, so the lead's story never twins in the Brief list.
 * Written by scripts/rank-snapshot.ts into src/data/tldr-24h.ts; no generated text, no LLM.
 */
import { wireCandidates, type WireCluster, type WireOpts } from "@/lib/wire";
import { clusterCompanies, clusterOtherLabs } from "@/lib/topic-heat";
import { groupFirstAt } from "@/lib/lead-pick";
import { publicHref } from "@/lib/truth";

export const TLDR_WINDOW_H = 24;
export const TLDR_MAX = 7;
export const TLDR_MIN = 3;
export const TLDR_PER_COMPANY = 2;

export type TldrBullet = { id: string; title: string; url: string; at: string; sources: number };
export type Tldr = { schema: 1; crawl_at: string; date: string; bullets: TldrBullet[]; quiet: boolean };

/** Primary company of a story (first heat company, else first other lab); null = uncapped. */
export function storyCompany(c: Pick<WireCluster, "title" | "member_ids">): string | null {
  const co = [...clusterCompanies(c)].find((x) => x !== "other");
  return co ?? clusterOtherLabs(c)[0] ?? null;
}

export function buildTldr(
  clusters: WireCluster[],
  opts: WireOpts & { crawlAt: string; date: string; memberAt?: Record<string, string> },
): Tldr {
  const now = Date.parse(opts.crawlAt);
  const byId = new Map(clusters.map((c) => [c.id, c]));
  // PASS-U U3: story time = its EARLIEST member (publisher time, else first_seen) — the same clock Wire / Pulse ages
  // use (groupFirstAt). A late repost never makes a ~30h-old story read "14m" or slip into Past 24 hours.
  const firstIso = (c: { at: string; member_ids: readonly string[] }) => {
    const t = groupFirstAt({ at: c.at, member_ids: [...c.member_ids] }, opts.memberAt ?? {});
    return Number.isFinite(t) ? new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") : c.at;
  };
  const recent = wireCandidates(clusters, opts)
    .map((c) => ({ ...c, at: firstIso(c) }))
    .filter((c) => {
      const t = Date.parse(c.at);
      return Number.isFinite(t) && t <= now && now - t <= TLDR_WINDOW_H * 3_600_000;
    })
    .sort((a, b) => b.sources - a.sources || Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id));
  const perCo = new Map<string, number>();
  const bullets: TldrBullet[] = [];
  for (const c of recent) {
    if (bullets.length >= TLDR_MAX) break;
    const co = storyCompany(byId.get(c.id)!);
    if (co && (perCo.get(co) ?? 0) >= TLDR_PER_COMPANY) continue;
    if (co) perCo.set(co, (perCo.get(co) ?? 0) + 1);
    bullets.push({ id: c.id, title: c.title, url: publicHref(c.url) ?? "", at: c.at, sources: c.sources });
  }
  return { schema: 1, crawl_at: opts.crawlAt, date: opts.date, bullets, quiet: bullets.length < TLDR_MIN };
}
