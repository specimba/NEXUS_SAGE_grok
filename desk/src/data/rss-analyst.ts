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
  /** Beat 2: first seen in the current crawl. */
  is_new?: boolean;
  /** Beat 2 cross-source dedupe cluster id (see pulse-clusters.ts). */
  cluster_id?: string;
};

export const RSS_ANALYST_AT: string | null = "2026-10-30T19:51:04Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:latent-space:0eb61608480b19cd", feed: "latent-space" as const, title: "[AINews] Building AIE CODE: The top Coding Agent Conference", link: "https://latent.space/p/ainews-building-aie-code-the-top-coding-agent-conference/", published: "2026-10-30T08:24:29Z", summary: "Mistral’s open-weight release, frontier monitoring, and the day’s AI Twitter and Reddit recaps.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-30T13:20:51Z", is_new: false, cluster_id: "cl:anl:latent-space:0eb61608480b19cd" },
  { id: "anl:simonw:49d99f09e516b736", feed: "simonw" as const, title: "API credits benefit for eligible ChatGPT subscriptions", link: "https://simonwillison.net/2026/Oct/29/api-credits/", published: "2026-10-29T22:48:29Z", summary: "API credits benefit for eligible ChatGPT subscriptions Earlier this month Anthropic announced a generous new benefit for their Max and Team subscriptions: $100, $200, and $500 per month subscribers would get the equivalent quantity of (expiring) credits to use with the Anthropic API. OpenAI have now launched pretty much exactly the same deal: if you have a $100, $200, or $500 subscription plan wi…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-30T03:20:34Z", is_new: false, cluster_id: "cl:anl:simonw:49d99f09e516b736" },
  { id: "anl:latent-space:ecd2bf04730917de", feed: "latent-space" as const, title: "Can Frontier Models See Past a Decoy? Elorian Tests Visual Reasoning", link: "https://latent.space/p/elorian/", published: "2026-10-29T16:00:00Z", summary: "A new decoy counting benchmark exposes a gap between seeing and reasoning. Elorian’s Glimpse tries to bridge it by thinking with images.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-29T18:20:43Z", is_new: false, cluster_id: "cl:anl:latent-space:ecd2bf04730917de" },
  { id: "anl:latent-space:ca1531157f04f09e", feed: "latent-space" as const, title: "[AINews] Gemini 4 Carbon tops leaderboards, launches for cyber defenders", link: "https://latent.space/p/ainews-gemini-4-carbon/", published: "2026-10-29T05:55:19Z", summary: "Google’s new frontier model leads independent evals, with access initially limited to trusted defenders.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-29T08:20:41Z", is_new: false, cluster_id: "cl:rss:testingcatalog:90bb3e441c768369" },
  { id: "anl:latent-space:a62e18f0a18a0286", feed: "latent-space" as const, title: "Why Agents Love Supabase", link: "https://latent.space/p/supabase/", published: "2026-10-28T19:48:05Z", summary: "Paul Copplestone and Ant Wilson on building the backend for AI agents", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-29T08:20:41Z", is_new: false, cluster_id: "cl:anl:latent-space:a62e18f0a18a0286" },
  { id: "anl:latent-space:121708d3c295fb2d", feed: "latent-space" as const, title: "[AINews] Anthropic ends Coding Interviews: \"Hunger beats tenure\"", link: "https://latent.space/p/ainews-anthropic-ends-coding-interviews-hunger-beats-tenure/", published: "2026-10-28T08:50:30Z", summary: "Since coding is solved, why code for the job?", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-28T13:21:05Z", is_new: false, cluster_id: "cl:anl:latent-space:121708d3c295fb2d" },
  { id: "anl:latent-space:9de126e482b03ac1", feed: "latent-space" as const, title: "How Anthropic ships Claude with Claude: Separating the Brain from the Hands", link: "https://latent.space/p/opus55/", published: "2026-10-27T18:53:10Z", summary: "Katelyn Lesse and Angela Jiang on Opus 5.5, the Claude Platform, and the engineering behind AI agents.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T23:33:38Z", is_new: false, cluster_id: "cl:anl:latent-space:9de126e482b03ac1" },
];
