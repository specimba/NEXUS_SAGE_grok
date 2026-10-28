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

export const RSS_ANALYST_AT: string | null = "2026-10-28T08:20:41Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:latent-space:9de126e482b03ac1", feed: "latent-space" as const, title: "How Anthropic ships Claude with Claude: Separating the Brain from the Hands", link: "https://latent.space/p/opus55/", published: "2026-10-27T18:53:10Z", summary: "Katelyn Lesse and Angela Jiang on Opus 5.5, the Claude Platform, and the engineering behind AI agents.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T23:33:38Z", is_new: false, cluster_id: "cl:anl:latent-space:9de126e482b03ac1" },
  { id: "anl:latent-space:642e6889bbe9adba", feed: "latent-space" as const, title: "How Anthropic ships the #1 LLM in the World safely: Separating the Brain from the Hands", link: "https://latent.space/p/how_anthropic_ships_the_1_llm_in_the_world_safely_separating_the_brain_from_the_hands/", published: "2026-10-27T18:40:19Z", summary: "Katelyn Lesse and Angela Jiang join Latent Space to explain the engineering behind the Claude Platform: launching Opus 5.5, separating the model’s “brain” from the agent’s “hands,” scaling APIs, and building reliable managed agents. A new introduction ...", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T23:33:38Z", is_new: false, cluster_id: "cl:anl:latent-space:9de126e482b03ac1" },
  { id: "anl:latent-space:849b0c3c30ee33f9", feed: "latent-space" as const, title: "Coding From the Himalayas With an Offline AI Agent", link: "https://latent.space/p/offline-coding/", published: "2026-10-27T14:41:25Z", summary: "How to set up and run an offline coding agent using OpenCode, Ollama and Qwen.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T18:20:49Z", is_new: false, cluster_id: "cl:anl:latent-space:849b0c3c30ee33f9" },
  { id: "anl:latent-space:86ca23e5c3db9605", feed: "latent-space" as const, title: "[AINews] Anthropic files for $2T IPO in 2 weeks: 1400% growth rate, 48% of revenue through cloud partners, 85% margin, $1B op profit in Q2, $134B cash in bank and $10B lifetime burn", link: "https://latent.space/p/ainews-anthropic-s1/", published: "2026-10-27T07:24:59Z", summary: "The S-1, the numbers, and the reactions.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-27T18:20:49Z", is_new: false, cluster_id: "cl:anl:latent-space:86ca23e5c3db9605" },
  { id: "anl:simonw:c15b1e3c66d84564", feed: "simonw" as const, title: "GPT-6.1 Terra", link: "https://simonwillison.net/2026/Oct/26/gpt-61-terra/", published: "2026-10-26T23:53:07Z", summary: "GPT-6.1 Terra It's always interesting to note which aspects of a new model are emphasized in the release announcement. In the case of GPT-6.1 Terra, OpenAI went with visual reasoning and computer use: We’re introducing GPT-6.1 Terra , a fast, efficient model that combines detailed visual reasoning and precise computer use alongside clearer, more natural writing. A significant step up from GPT‑5.6…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-27T18:20:49Z", is_new: false, cluster_id: "cl:rss:testingcatalog:8684eb48fa1590f3" },
  { id: "anl:latent-space:a3c9d59a888e90f8", feed: "latent-space" as const, title: "[AINews] Kimi 3.1 Pro 104BA-2.8T: Fable-5.1-Class Open Weights narrows Closed-AI lead to 1 month... and Pro Highspeed API with 2-3× speed", link: "https://latent.space/p/ainews-kimi-31/", published: "2026-10-24T07:18:29Z", summary: "We have Fable at home... or so we are being told by paid shills", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-24T08:20:26Z", is_new: false, cluster_id: "cl:anl:latent-space:a3c9d59a888e90f8" },
  { id: "anl:latent-space:d5a942e6d14cf1e0", feed: "latent-space" as const, title: "AI Is Getting Good at Math. Here’s Why.", link: "https://latent.space/p/ai-is-getting-good-at-math/", published: "2026-10-23T15:19:48Z", summary: "AI models are solving more mathematical problems. A pattern is emerging in their successes that could help us predict which problems they’ll solve next.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-23T18:20:31Z", is_new: false, cluster_id: "cl:anl:latent-space:d5a942e6d14cf1e0" },
];
