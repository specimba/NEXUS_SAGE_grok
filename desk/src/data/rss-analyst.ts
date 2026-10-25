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

export const RSS_ANALYST_AT: string | null = "2026-10-25T15:44:24Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:latent-space:a3c9d59a888e90f8", feed: "latent-space" as const, title: "[AINews] Kimi 3.1 Pro 104BA-2.8T: Fable-5.1-Class Open Weights narrows Closed-AI lead to 1 month... and Pro Highspeed API with 2-3× speed", link: "https://latent.space/p/ainews-kimi-31/", published: "2026-10-24T07:18:29Z", summary: "We have Fable at home... or so we are being told by paid shills", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-24T08:20:26Z", is_new: false, cluster_id: "cl:anl:latent-space:a3c9d59a888e90f8" },
  { id: "anl:latent-space:d5a942e6d14cf1e0", feed: "latent-space" as const, title: "AI Is Getting Good at Math. Here’s Why.", link: "https://latent.space/p/ai-is-getting-good-at-math/", published: "2026-10-23T15:19:48Z", summary: "AI models are solving more mathematical problems. A pattern is emerging in their successes that could help us predict which problems they’ll solve next.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-23T18:20:31Z", is_new: false, cluster_id: "cl:anl:latent-space:d5a942e6d14cf1e0" },
  { id: "anl:latent-space:9a6fbe4911070551", feed: "latent-space" as const, title: "[AINews] Black October", link: "https://latent.space/p/ainews-black-october/", published: "2026-10-23T10:09:29Z", summary: "the Cyber onslaught continues.", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-23T13:21:39Z", is_new: false, cluster_id: "cl:anl:latent-space:9a6fbe4911070551" },
  { id: "anl:simonw:2f38489938aada9c", feed: "simonw" as const, title: "Donating Agent Skills to the Agentic AI Foundation", link: "https://simonwillison.net/2026/Oct/22/donating-agent-skills/", published: "2026-10-22T18:09:56Z", summary: "Donating Agent Skills to the Agentic AI Foundation News today from Anthropic: We’re committed to keeping Agent Skills open, community-driven, and vendor-neutral. Today, we are donating the standard to the Agentic AI Foundation (AAIF) under the Linux Foundation, which we co-founded with Block and OpenAI last year, and to which we donated the Model Context Protocol (MCP). I'm pleased to note I call…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-22T18:20:39Z", is_new: false, cluster_id: "cl:anl:simonw:2f38489938aada9c" },
  { id: "anl:latent-space:c5258c7ef6406bc0", feed: "latent-space" as const, title: "Why AI Compute Comes in Rectangles — Erik Bernhardsson, Modal CEO", link: "https://latent.space/p/modal-d/", published: "2026-10-22T17:40:57Z", summary: "Elastic GPUs, sandbox growth, and the economics of the agent cloud", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-22T18:20:39Z", is_new: false, cluster_id: "cl:anl:latent-space:c5258c7ef6406bc0" },
  { id: "anl:latent-space:4c49390f8994fee2", feed: "latent-space" as const, title: "[AINews] OpenAI’s Patch the Planet program is 1 of 2 parties to discover PHP2Shell vulnerabilities in core PHP affecting 70% of the web, using GPT-5.6 Sol; coordinated response over 2 months", link: "https://latent.space/p/ainews-openais-patch-the-planet-program/", published: "2026-10-22T07:42:44Z", summary: "The Big Hardening begins", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-22T08:20:36Z", is_new: false, cluster_id: "cl:anl:latent-space:4c49390f8994fee2" },
];
