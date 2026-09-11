/** Google News RSS Pulse spice — generated/refreshed by bun run ingest. Quiet shelf only; never Brief · never sole lead. */
export type GnewsRssRow = {
  id: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  publisher: string;
  query: string;
  source: "gnews-rss";
  tag: "rest" | "rumor" | "companion" | "incident";
};

export const GNEWS_RSS_AT = "";

/** Empty until ingest lands spice cards. Soft-fail empty OK. */
export const GNEWS_RSS: GnewsRssRow[] = [];
