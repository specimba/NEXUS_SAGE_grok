/**
 * Fixed Digest/Voice unlock fixtures — both lead states, independent of the live crawl.
 * not-HELD: today's pick is good → titles follow LEAD_TODAY, no kicker.
 * HELD: build flag held → last good snapshot titles + HELD kicker.
 */
import { buildLiveSnapshot } from "@/lib/digest-unlock";
import type { LeadEntry } from "@/lib/lead-pick";
import type { WireRow } from "@/lib/wire";

export const FX_LAST_GOOD_LEAD: LeadEntry = {
  date: "2026-10-09",
  cluster_id: "cl:hn:900001",
  headline: "Fixture lab ships a reasoning model",
  url: "https://example.com/last-good",
  sources: 3,
  sig: 42,
  reason: "picked",
  at: "2026-10-09T03:11:00.000Z",
  crawl_at: "2026-10-09T03:11:00.000Z",
  first_at: "2026-10-09T02:30:00.000Z",
};

export const FX_TODAY_LEAD: LeadEntry = {
  ...FX_LAST_GOOD_LEAD,
  date: "2026-10-10",
  cluster_id: "cl:hn:900002",
  headline: "Fixture open-weights release tops the Wire",
  url: "https://example.com/today",
  at: "2026-10-10T03:11:00.000Z",
  crawl_at: "2026-10-10T03:11:00.000Z",
  first_at: "2026-10-10T02:40:00.000Z",
};

const wire = (id: string, title: string): WireRow[] => [
  {
    id, title, url: `https://example.com/${id}`, at: "2026-10-10T02:00:00.000Z", sources: 3, score: 10,
    member_ids: [id.replace(/^cl:/, ""), "gnews:fx"], is_new: false, rank: 2, prev_rank: null, status: "same",
  },
];

export const FX_LAST_GOOD_SNAP = buildLiveSnapshot({
  lead: FX_LAST_GOOD_LEAD, wire: wire("cl:hn:900010", "Fixture companion (last good)"), frozenAt: FX_LAST_GOOD_LEAD.at,
});
export const FX_TODAY_SNAP = buildLiveSnapshot({
  lead: FX_TODAY_LEAD, wire: wire("cl:hn:900020", "Fixture companion (today)"), frozenAt: FX_TODAY_LEAD.at,
});

/** Both states the desk can be in. `lastGood` is what the generated DIGEST_UNLOCK module would hold. */
export const FX_STATES = {
  live: { held: false, today: FX_TODAY_LEAD, lastGood: FX_TODAY_SNAP },
  held: { held: true, today: FX_TODAY_LEAD, lastGood: FX_LAST_GOOD_SNAP },
} as const;
