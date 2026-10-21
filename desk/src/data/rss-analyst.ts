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

export const RSS_ANALYST_AT: string | null = "2026-10-21T03:20:27Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:simonw:7fa30abfca2c7ff1", feed: "simonw" as const, title: "Battle Drones - a vibe coded RTS with audio-based multiplayer", link: "https://simonwillison.net/2026/Oct/20/battledrones/", published: "2026-10-20T19:34:19Z", summary: "My latest vibe coded game experiment is a Command &amp; Conquer style RTS (Real Time Strategy) game called Battle Drones ( play it here ). Unlike my previous experiments , this one is actually fun to play . I'm somewhat embarrassed to admit that I got there by telling Claude to \"Make it a LOT more fun\". It also supports multiplayer between nearby devices using audio to synchronize game state! Her…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-20T22:37:32Z", is_new: false, cluster_id: "cl:anl:simonw:7fa30abfca2c7ff1" },
  { id: "anl:latent-space:996b48d3900b31c6", feed: "latent-space" as const, title: "[AINews] not much happened today", link: "https://www.latent.space/p/ainews-not-much-happened-today-f09", published: "2026-10-20T05:21:52Z", summary: "Congrats to DeepSeek V4.1 Flash 1017, MiniMax M3.1 Flash, and Mercury 3 (details below) but they’re not going to be in super wide use just yet.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:latent-space:996b48d3900b31c6" },
  { id: "anl:simonw:ae7b31dc246e2760", feed: "simonw" as const, title: "llm-tools-datasette 0.1.1", link: "https://simonwillison.net/2026/Oct/18/llm-tools-datasette/", published: "2026-10-18T23:43:09Z", summary: "Release: llm-tools-datasette 0.1.1 When I switched LLM over to httpx2 in LLM 0.33 I forget that this would break any plugins which used httpx without directly depending on it. llm-tools-datasette was one of those plugins, now fixed. Tags: datasette , llm", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:simonw:ae7b31dc246e2760" },
  { id: "anl:simonw:9d2417f40cde50f0", feed: "simonw" as const, title: "llm-echo 0.5", link: "https://simonwillison.net/2026/Oct/18/llm-echo/", published: "2026-10-18T23:16:16Z", summary: "Release: llm-echo 0.5 I'm working towards a new LLM release, and testing PRs caused me to revisit the llm-echo debug plugin. This plugin provides a \"model\" which doesn't involve an LLM at all - it just repeats back the prompts that have been fed to it. The new release now updates the simulated token usage counts to take tool calls, system prompts, and reasoning tokens into account. Example usage:…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:simonw:9d2417f40cde50f0" },
  { id: "anl:latent-space:66a8784860f53e77", feed: "latent-space" as const, title: "[AINews] High Taste Testers Ep. 1", link: "https://www.latent.space/p/ainews-high-taste-testers-ep-1", published: "2026-10-17T07:47:38Z", summary: "a quiet day lets us pilot a new show", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:latent-space:66a8784860f53e77" },
  { id: "anl:latent-space:fe88897c2a464af3", feed: "latent-space" as const, title: "[AINews] Agents disprove Polysemanticity; greatly improve Interpretability & Alignment", link: "https://www.latent.space/p/ainews-agents-disprove-polysemanticity", published: "2026-10-16T04:16:45Z", summary: "Nick Cammarata out of nowhere with some major claims!", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:latent-space:fe88897c2a464af3" },
  { id: "anl:latent-space:2a289299a4bd88c4", feed: "latent-space" as const, title: "[AINews] Modal’s $1B ARR, $16B Series D makes it NYC’s newest AI Infra Decacorn, 3x usage and 3x valuation in 5 months, 15x in 1 yr", link: "https://www.latent.space/p/ainews-modals-1b-arr-16b-series-d", published: "2026-10-15T10:08:08Z", summary: "Sandboxes are all you need.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:latent-space:2a289299a4bd88c4" },
  { id: "anl:latent-space:247153705736c57d", feed: "latent-space" as const, title: "Crossing the Threshold: How OpenAI and Anthropic Approach Autonomy and Safety in Financial Agents", link: "https://www.latent.space/p/crossing-the-threshold", published: "2026-10-14T21:40:52Z", summary: "At AI Engineer New York, frontier labs and financial firms explored how to give agents useful autonomy while keeping consequential decisions under control.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-20T07:13:37Z", is_new: false, cluster_id: "cl:anl:latent-space:247153705736c57d" },
];
