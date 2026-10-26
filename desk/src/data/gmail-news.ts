/** Pass F Gmail news Pulse — generated/refreshed by bun run ingest. Pulse-only; never Brief. */
export type GmailNewsRow = {
  id: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  publisher: string;
  source: "gmail-news";
  qi: number;
  priority: "P1" | "P2" | "P3";
  tag: "rest" | "rumor" | "companion" | "incident";
  briefEligible: false;
  pulse_only: true;
};

export const GMAIL_NEWS_AT = "2026-10-26T02:53:27Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a173983a77b8484", title: "Carbon X, Kimi K3.1, Minimax M3.1, Deep Infer, Claude Duet, Dessa: AI NEWS", link: "https://mail.google.com/mail/#all/1a173983a77b8484", published: "2026-10-25T15:02:29Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a175891ada4d578", title: "AI vs ML vs Deep Learning vs LLMs", link: "https://mail.google.com/mail/#all/1a175891ada4d578", published: "2026-10-26T00:03:51Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1732c4070429b8", title: "ByteDance Seed publishes Recycler research", link: "https://mail.google.com/mail/#all/1a1732c4070429b8", published: "2026-10-25T13:07:22Z", summary: "via benchlm.ai", publisher: "benchlm.ai", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173280bc15b916", title: "Confirm your Subscription", link: "https://mail.google.com/mail/#all/1a173280bc15b916", published: "2026-10-25T13:02:46Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17241dd7a6fff3", title: "Takara TLDR: October 25, 2026", link: "https://mail.google.com/mail/#all/1a17241dd7a6fff3", published: "2026-10-25T08:51:21Z", summary: "via takara.ai", publisher: "takara.ai", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a16fe1008be51bf", title: "Jev + Opus 5.5: The 20x AI Workflow Setup", link: "https://mail.google.com/mail/#all/1a16fe1008be51bf", published: "2026-10-24T21:40:26Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 23.8, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1758e022960159", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T00:13:23Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a175185952d7bfb", title: "The Briefing: Anthropic’s Big Reveal", link: "https://mail.google.com/mail/#all/1a175185952d7bfb", published: "2026-10-25T22:04:51Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1743cd93ac8882", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-25T18:05:07Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173dc7e47d2563", title: "🥇Top AI Papers of the Week", link: "https://mail.google.com/mail/#all/1a173dc7e47d2563", published: "2026-10-25T16:14:31Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173ca633adfb1e", title: "🚨 Black October and NVIDIA event recap", link: "https://mail.google.com/mail/#all/1a173ca633adfb1e", published: "2026-10-25T16:00:04Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17351db488d640", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a17351db488d640", published: "2026-10-25T13:48:24Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1730ac79f5c488", title: "Day 8/10: Teach AI Your Voice", link: "https://mail.google.com/mail/#all/1a1730ac79f5c488", published: "2026-10-25T12:25:40Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172f4c529a067a", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-25T12:06:46Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172d348d2adf95", title: "Claude Code Extensions", link: "https://mail.google.com/mail/#all/1a172d348d2adf95", published: "2026-10-25T11:28:36Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172821e9cdddd0", title: "‘Reverse-Engineer Anything’ Is the Next Wave of AI Slop", link: "https://mail.google.com/mail/#all/1a172821e9cdddd0", published: "2026-10-25T10:01:07Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
