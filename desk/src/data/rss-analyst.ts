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

export const RSS_ANALYST_AT: string | null = "2026-10-29T18:20:43Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:latent-space:ecd2bf04730917de", feed: "latent-space" as const, title: "Can Frontier Models See Past a Decoy? Elorian Tests Visual Reasoning", link: "https://latent.space/p/elorian/", published: "2026-10-29T16:00:00Z", summary: "A new decoy counting benchmark exposes a gap between seeing and reasoning. Elorian’s Glimpse tries to bridge it by thinking with images.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-29T18:20:43Z", is_new: true, cluster_id: "cl:anl:latent-space:ecd2bf04730917de" },
  { id: "anl:latent-space:ca1531157f04f09e", feed: "latent-space" as const, title: "[AINews] Gemini 4 Carbon tops leaderboards, launches for cyber defenders", link: "https://latent.space/p/ainews-gemini-4-carbon/", published: "2026-10-29T05:55:19Z", summary: "Google’s new frontier model leads independent evals, with access initially limited to trusted defenders.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-29T08:20:41Z", is_new: false, cluster_id: "cl:rss:huggingnews:40a91b77aa206d6b" },
  { id: "anl:latent-space:a62e18f0a18a0286", feed: "latent-space" as const, title: "Why Agents Love Supabase", link: "https://latent.space/p/supabase/", published: "2026-10-28T19:48:05Z", summary: "Paul Copplestone and Ant Wilson on building the backend for AI agents", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-29T08:20:41Z", is_new: false, cluster_id: "cl:anl:latent-space:a62e18f0a18a0286" },
  { id: "anl:latent-space:121708d3c295fb2d", feed: "latent-space" as const, title: "[AINews] Anthropic ends Coding Interviews: \"Hunger beats tenure\"", link: "https://latent.space/p/ainews-anthropic-ends-coding-interviews-hunger-beats-tenure/", published: "2026-10-28T08:50:30Z", summary: "Since coding is solved, why code for the job?", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-28T13:21:05Z", is_new: false, cluster_id: "cl:anl:latent-space:121708d3c295fb2d" },
  { id: "anl:latent-space:9de126e482b03ac1", feed: "latent-space" as const, title: "How Anthropic ships Claude with Claude: Separating the Brain from the Hands", link: "https://latent.space/p/opus55/", published: "2026-10-27T18:53:10Z", summary: "Katelyn Lesse and Angela Jiang on Opus 5.5, the Claude Platform, and the engineering behind AI agents.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T23:33:38Z", is_new: false, cluster_id: "cl:anl:latent-space:9de126e482b03ac1" },
  { id: "anl:latent-space:642e6889bbe9adba", feed: "latent-space" as const, title: "How Anthropic ships the #1 LLM in the World safely: Separating the Brain from the Hands", link: "https://latent.space/p/how_anthropic_ships_the_1_llm_in_the_world_safely_separating_the_brain_from_the_hands/", published: "2026-10-27T18:40:19Z", summary: "Katelyn Lesse and Angela Jiang join Latent Space to explain the engineering behind the Claude Platform: launching Opus 5.5, separating the model’s “brain” from the agent’s “hands,” scaling APIs, and building reliable managed agents. A new introduction ...", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T23:33:38Z", is_new: false, cluster_id: "cl:anl:latent-space:9de126e482b03ac1" },
];
