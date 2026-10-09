/** Per-feed RSS fetch cap — a hung feed soft-fails instead of eating the crawl budget (GitLab 400-min cap). */
export const RSS_FEED_TIMEOUT_MS = 10_000;

export function rssTimeoutSignal(ms: number = RSS_FEED_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}
