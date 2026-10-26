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

export const GMAIL_NEWS_AT = "2026-10-26T07:44:41Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a173983a77b8484", title: "Carbon X, Kimi K3.1, Minimax M3.1, Deep Infer, Claude Duet, Dessa: AI NEWS", link: "https://mail.google.com/mail/#all/1a173983a77b8484", published: "2026-10-25T15:02:29Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176ae1ab7d68a9", title: "AI-discovered PHP flaw triggers global web security warnings | AI agent breaches 2,250 cloud tenants | India to consult on AI law", link: "https://mail.google.com/mail/#all/1a176ae1ab7d68a9", published: "2026-10-26T04:30:31Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 38.3, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a175891ada4d578", title: "AI vs ML vs Deep Learning vs LLMs", link: "https://mail.google.com/mail/#all/1a175891ada4d578", published: "2026-10-26T00:03:51Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176d391bee1a35", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T06:08:58Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176cc0a5281e69", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a176cc0a5281e69", published: "2026-10-26T06:00:43Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176b59e969953a", title: "The 100 Questions That Haunt AI Engineering Interviews 2026", link: "https://mail.google.com/mail/#all/1a176b59e969953a", published: "2026-10-26T05:36:00Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17694cc2150158", title: "Strengthen Cloud Resilience, Accelerate Delivery and Scale AI Modernization", link: "https://mail.google.com/mail/#all/1a17694cc2150158", published: "2026-10-26T05:00:24Z", summary: "via devops.com", publisher: "devops.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1758e022960159", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T00:13:23Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a175185952d7bfb", title: "The Briefing: Anthropic’s Big Reveal", link: "https://mail.google.com/mail/#all/1a175185952d7bfb", published: "2026-10-25T22:04:51Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1743cd93ac8882", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-25T18:05:07Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173dc7e47d2563", title: "🥇Top AI Papers of the Week", link: "https://mail.google.com/mail/#all/1a173dc7e47d2563", published: "2026-10-25T16:14:31Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a173ca633adfb1e", title: "🚨 Black October and NVIDIA event recap", link: "https://mail.google.com/mail/#all/1a173ca633adfb1e", published: "2026-10-25T16:00:04Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17456eb9f08382", title: "😺 Walmart wants AI shoppers on an allowance", link: "https://mail.google.com/mail/#all/1a17456eb9f08382", published: "2026-10-25T18:33:34Z", summary: "via theneurondaily.com", publisher: "theneurondaily.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17399c64f73ef2", title: "Turn Your PC Agent-Ready", link: "https://mail.google.com/mail/#all/1a17399c64f73ef2", published: "2026-10-25T15:03:19Z", summary: "via first-backer.com", publisher: "first-backer.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1770988a3dda5d", title: "New Notification for Meta Global AI Developer Hackathon", link: "https://mail.google.com/mail/#all/1a1770988a3dda5d", published: "2026-10-26T07:07:55Z", summary: "via cerebralvalley.ai", publisher: "cerebralvalley.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1766fd194783d9", title: "Why Google’s New Harness² Open Source Release Changes How I Think About AI Agents | Nikhil in Neural Notions", link: "https://mail.google.com/mail/#all/1a1766fd194783d9", published: "2026-10-26T04:20:00Z", summary: "via medium.com", publisher: "medium.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
