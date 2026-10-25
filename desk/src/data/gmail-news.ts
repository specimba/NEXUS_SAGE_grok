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

export const GMAIL_NEWS_AT = "2026-10-25T17:54:07Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a173983a77b8484", title: "Carbon X, Kimi K3.1, Minimax M3.1, Deep Infer, Claude Duet, Dessa: AI NEWS", link: "https://mail.google.com/mail/#all/1a173983a77b8484", published: "2026-10-25T15:02:29Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1732c4070429b8", title: "ByteDance Seed publishes Recycler research", link: "https://mail.google.com/mail/#all/1a1732c4070429b8", published: "2026-10-25T13:07:22Z", summary: "via benchlm.ai", publisher: "benchlm.ai", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173280bc15b916", title: "Confirm your Subscription", link: "https://mail.google.com/mail/#all/1a173280bc15b916", published: "2026-10-25T13:02:46Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17241dd7a6fff3", title: "Takara TLDR: October 25, 2026", link: "https://mail.google.com/mail/#all/1a17241dd7a6fff3", published: "2026-10-25T08:51:21Z", summary: "via takara.ai", publisher: "takara.ai", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173dc7e47d2563", title: "🥇Top AI Papers of the Week", link: "https://mail.google.com/mail/#all/1a173dc7e47d2563", published: "2026-10-25T16:14:31Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173ca633adfb1e", title: "🚨 Black October and NVIDIA event recap", link: "https://mail.google.com/mail/#all/1a173ca633adfb1e", published: "2026-10-25T16:00:04Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17351db488d640", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a17351db488d640", published: "2026-10-25T13:48:24Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1730ac79f5c488", title: "Day 8/10: Teach AI Your Voice", link: "https://mail.google.com/mail/#all/1a1730ac79f5c488", published: "2026-10-25T12:25:40Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172f4c529a067a", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-25T12:06:46Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172d348d2adf95", title: "Claude Code Extensions", link: "https://mail.google.com/mail/#all/1a172d348d2adf95", published: "2026-10-25T11:28:36Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a172821e9cdddd0", title: "‘Reverse-Engineer Anything’ Is the Next Wave of AI Slop", link: "https://mail.google.com/mail/#all/1a172821e9cdddd0", published: "2026-10-25T10:01:07Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17248c3e1747bd", title: "650+ tools. 36 layers. One map. We stopped guessing which AI agent tool to use. Here’s how.", link: "https://mail.google.com/mail/#all/1a17248c3e1747bd", published: "2026-10-25T08:57:16Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17399c64f73ef2", title: "Turn Your PC Agent-Ready", link: "https://mail.google.com/mail/#all/1a17399c64f73ef2", published: "2026-10-25T15:03:19Z", summary: "via first-backer.com", publisher: "first-backer.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1738de4805173c", title: "🤖 AI Weekly Recap (Week 44)", link: "https://mail.google.com/mail/#all/1a1738de4805173c", published: "2026-10-25T14:53:59Z", summary: "via alvarocintas.com", publisher: "alvarocintas.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1738aa90b9f288", title: "🛠️ Stop Overengineering AI Agent Memory, New Study Suggests", link: "https://mail.google.com/mail/#all/1a1738aa90b9f288", published: "2026-10-25T14:50:29Z", summary: "via alphasignal.ai", publisher: "alphasignal.ai", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1732c8f17c8943", title: "Welcome to TechGig Community", link: "https://mail.google.com/mail/#all/1a1732c8f17c8943", published: "2026-10-25T13:07:42Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
