/**
 * PASS-L fixed lead-pick fixtures — independent of the live crawl (same style as unlock-states.ts).
 * Day = 2026-10-12 Istanbul; GitLab slots 06:11 / 11:11 / 16:11 / 21:11 (UTC+3).
 */
import type { LeadEntry, LeadHistory } from "@/lib/lead-pick";
import type { WireCluster } from "@/lib/wire";

export const PL_SLOT = {
  s0611: "2026-10-12T03:11:00Z",
  s1111: "2026-10-12T08:11:00Z",
  s1611: "2026-10-12T13:11:00Z",
  s2111: "2026-10-12T18:11:00Z",
} as const;

const H = 3_600_000;
/** ISO time `h` hours before `slot`. */
export const hoursBefore = (slot: string, h: number) => new Date(Date.parse(slot) - h * H).toISOString();

/** A Wire-eligible AI story with `n` independent sources (HN lead + n-1 others), first item `ageH` old at `slot`. */
export function plCluster(n: number, id: string, ageH: number, slot: string = PL_SLOT.s0611): WireCluster {
  const lead = `hn:${id}`;
  const others = ["gnews:" + id, `rss:openai:${id}`, `rss:deepmind:${id}`, `rss:security:${id}`].slice(0, Math.max(0, n - 1));
  const at = hoursBefore(slot, ageH);
  return {
    id: `cl:${lead}`,
    title: `OpenAI model story ${id}`,
    url: `https://example.com/${id}`,
    lead_id: lead,
    lead_source: "hn-algolia",
    sources: ["hn-algolia", "gnews-rss", "rss-lab"].slice(0, Math.min(3, n)),
    member_ids: [lead, ...others],
    size: n,
    at,
    first_seen: null,
    is_new: false,
  };
}

/** Earlier day's real pick (what HELD carries). */
export const PL_PREV: LeadEntry = {
  date: "2026-10-11",
  cluster_id: "cl:hn:pl-prev",
  headline: "Fixture yesterday lead",
  url: "https://example.com/pl-prev",
  sources: 3,
  sig: 9,
  reason: "picked",
  at: "2026-10-11T03:11:30.000Z",
  crawl_at: "2026-10-11T03:11:00Z",
  first_at: "2026-10-10T20:00:00.000Z",
};
export const PL_HISTORY: LeadHistory = { schema: 1, entries: [PL_PREV] };
