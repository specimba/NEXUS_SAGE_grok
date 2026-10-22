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

export const RSS_ANALYST_AT: string | null = "2026-10-22T18:20:39Z";

export const RSS_ANALYST: RssAnalystRow[] = [
  { id: "anl:simonw:2f38489938aada9c", feed: "simonw" as const, title: "Donating Agent Skills to the Agentic AI Foundation", link: "https://simonwillison.net/2026/Oct/22/donating-agent-skills/", published: "2026-10-22T18:09:56Z", summary: "Donating Agent Skills to the Agentic AI Foundation News today from Anthropic: We’re committed to keeping Agent Skills open, community-driven, and vendor-neutral. Today, we are donating the standard to the Agentic AI Foundation (AAIF) under the Linux Foundation, which we co-founded with Block and OpenAI last year, and to which we donated the Model Context Protocol (MCP). I'm pleased to note I call…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-22T18:20:39Z", is_new: true, cluster_id: "cl:anl:simonw:2f38489938aada9c" },
  { id: "anl:latent-space:c5258c7ef6406bc0", feed: "latent-space" as const, title: "Why AI Compute Comes in Rectangles — Erik Bernhardsson, Modal CEO", link: "https://www.latent.space/p/modal-d", published: "2026-10-22T17:40:57Z", summary: "Elastic GPUs, sandbox growth, and the economics of the agent cloud", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-22T18:20:39Z", is_new: true, cluster_id: "cl:anl:latent-space:c5258c7ef6406bc0" },
  { id: "anl:latent-space:4c49390f8994fee2", feed: "latent-space" as const, title: "[AINews] OpenAI’s Patch the Planet program is 1 of 2 parties to discover PHP2Shell vulnerabilities in core PHP affecting 70% of the web, using GPT-5.6 Sol; coordinated response over 2 months", link: "https://www.latent.space/p/ainews-openais-patch-the-planet-program", published: "2026-10-22T07:42:44Z", summary: "The Big Hardening begins", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-22T08:20:36Z", is_new: false, cluster_id: "cl:anl:latent-space:4c49390f8994fee2" },
  { id: "anl:latent-space:1cd487805b8193f0", feed: "latent-space" as const, title: "Claude Mods: Flipping the Harness Inside Out", link: "https://www.latent.space/p/claude-mods", published: "2026-10-21T13:04:19Z", summary: "Claude Mods is an early form of the Attention Interface. It flips the agent harness paradigm from the harness facing the machine, to the harness facing the human.", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-21T13:21:09Z", is_new: false, cluster_id: "cl:anl:latent-space:1cd487805b8193f0" },
  { id: "anl:latent-space:9c99dc597b92594a", feed: "latent-space" as const, title: "[AINews] DeepSeek DeepInfer: Open Source SOTA Inference running 155T toks/day/cluster making $22m/day at ~80% margin for a 81 day payback", link: "https://www.latent.space/p/ainews-deepseek-deepinfer-open-source", published: "2026-10-21T06:54:09Z", summary: "An open source “bomb” drops from China", source: "rss-analyst" as const, recap: true, tag: "rest" as const, first_seen: "2026-10-21T08:20:57Z", is_new: false, cluster_id: "cl:anl:latent-space:9c99dc597b92594a" },
  { id: "anl:latent-space:db3c2eda6e56a446", feed: "latent-space" as const, title: "AI for the Fortune 2000: How Tenex Builds an AI-Native SDLC — Alex Lieberman & CJ Hess", link: "https://www.latent.space/p/tenex", published: "2026-10-21T05:01:26Z", summary: "Listen now (44 mins) | Paying for outcomes, building with agents, and the last mile of enterprise AI adoption", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-21T08:20:57Z", is_new: false, cluster_id: "cl:anl:latent-space:db3c2eda6e56a446" },
  { id: "anl:simonw:7fa30abfca2c7ff1", feed: "simonw" as const, title: "Battle Drones - a vibe coded RTS with audio-based multiplayer", link: "https://simonwillison.net/2026/Oct/20/battledrones/", published: "2026-10-20T19:34:19Z", summary: "My latest vibe coded game experiment is a Command &amp; Conquer style RTS (Real Time Strategy) game called Battle Drones ( play it here ). Unlike my previous experiments , this one is actually fun to play . I'm somewhat embarrassed to admit that I got there by telling Claude to \"Make it a LOT more fun\". It also supports multiplayer between nearby devices using audio to synchronize game state! Her…", source: "rss-analyst" as const, recap: false, tag: "rest" as const, first_seen: "2026-10-20T22:37:32Z", is_new: false, cluster_id: "cl:anl:simonw:7fa30abfca2c7ff1" },
];
