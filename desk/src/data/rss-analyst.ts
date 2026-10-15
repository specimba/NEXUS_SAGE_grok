/** PASS-S1.1 analyst RSS Pulse (Simon Willison · Latent Space/AINews) — generated/refreshed by bun run ingest. Pulse only (ANL); never Brief; never a lead on its own. */
export type RssAnalystRow = {
  id: string;
  feed: "simonw" | "latent-space";
  title: string;
  link: string;
  published: string;
  summary: string;
  source: "rss-analyst";
  recap: boolean;
  tag: "rest" | "rumor" | "companion" | "incident";
  /** Beat 2 seen-index: first crawl stamp this canonical URL appeared. */
  first_seen?: string;
  /** True when first_seen equals this crawl's stamp. */
  is_new?: boolean;
  /** Beat 2 dedupe: the Pulse cluster this row belongs to. */
  cluster_id?: string;
};

export const RSS_ANALYST_AT: string | null = null;

export const RSS_ANALYST: RssAnalystRow[] = [];
