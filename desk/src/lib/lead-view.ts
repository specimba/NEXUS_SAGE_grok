/**
 * One source of truth for "what is today's lead" — the Brief plate AND every other spot that shows the
 * lead (status-bar ticker, header INGEST line). HELD when the pick is HELD (no qualifying story), when
 * there is no pick, or — after mount, with the wall clock — when the lead's earliest item is ≥24h old.
 * Never show a carried headline as if it were today's lead.
 */
import { leadIsStale } from "@/lib/lead-pick";

export const LEAD_HELD_TEXT = "HELD · no qualifying story";

export type LeadPickData = { held: boolean; today: { headline: string; cluster_id?: string | null } | null; firstAt: string | null };

export type LeadView =
  | { held: false; reason: null; headline: string; id: string | null; carried: null }
  | { held: true; reason: "held" | "stale"; headline: null; id: null; carried: string | null };

/** `now` = null before mount (static HTML): only the build-time HELD flag applies then. */
export function leadView(pick: LeadPickData, now: number | null): LeadView {
  const headline = pick.today?.headline || null;
  if (pick.held || !headline) return { held: true, reason: "held", headline: null, id: null, carried: headline };
  if (now != null && leadIsStale(pick.firstAt, now)) return { held: true, reason: "stale", headline: null, id: null, carried: headline };
  return { held: false, reason: null, headline, id: pick.today?.cluster_id ?? null, carried: null };
}

/** Crawl slots (Istanbul): 02/06/10/14/18/22 at :11. */
export const CRAWL_SLOT_HOURS = [2, 6, 10, 14, 18, 22] as const;
export const CRAWL_SLOT_MINUTE = 11;
const IST_OFFSET_MS = 3 * 3_600_000; // Europe/Istanbul is fixed UTC+3 (no DST since 2016)

/** Next crawl slot strictly after `nowMs`, as Istanbul "HH:MM" (wraps to 02:11 after 22:11). */
export function nextCrawlSlotHHMM(nowMs: number): string {
  const d = new Date(nowMs + IST_OFFSET_MS);
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  const h = CRAWL_SLOT_HOURS.find((s) => s * 60 + CRAWL_SLOT_MINUTE > mins) ?? CRAWL_SLOT_HOURS[0];
  return `${String(h).padStart(2, "0")}:${String(CRAWL_SLOT_MINUTE).padStart(2, "0")}`;
}
