/**
 * Staleness guard (AUTONOMY-4H Beat 2). Crawl runs every 4h; > 6h ⇒ a fire was
 * missed ⇒ desk shows STALE (amber chip) instead of FRESH.
 */
export const STALE_GUARD_HOURS = 6;

export type CrawlFreshness = {
  hours: number;
  stale: boolean;
  label: "FRESH" | "STALE";
};

export function crawlFreshness(
  crawledAt: string,
  now: number = Date.now(),
  thresholdHours: number = STALE_GUARD_HOURS,
): CrawlFreshness {
  const t = Date.parse(crawledAt);
  const hours = Number.isFinite(t) ? Math.max(0, (now - t) / 3_600_000) : Infinity;
  const stale = hours > thresholdHours;
  return { hours, stale, label: stale ? "STALE" : "FRESH" };
}
