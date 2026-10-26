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

export const GMAIL_NEWS_AT = "2026-10-26T12:45:39Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a178270f2947fc8", title: "Unpatched Tailscale SSH Flaws, Gheist GitHub Attacks, Critical Wasmtime Flaws, and More", link: "https://mail.google.com/mail/#all/1a178270f2947fc8", published: "2026-10-26T12:04:13Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176ae1ab7d68a9", title: "AI-discovered PHP flaw triggers global web security warnings | AI agent breaches 2,250 cloud tenants | India to consult on AI law", link: "https://mail.google.com/mail/#all/1a176ae1ab7d68a9", published: "2026-10-26T04:30:31Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 38.3, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1781720f9c913d", title: "Oct. 26 - LLMs offer MSP rankings | Arms Cyber plays the midmarket", link: "https://mail.google.com/mail/#all/1a1781720f9c913d", published: "2026-10-26T12:02:11Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a175891ada4d578", title: "AI vs ML vs Deep Learning vs LLMs", link: "https://mail.google.com/mail/#all/1a175891ada4d578", published: "2026-10-26T00:03:51Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1781bb6572c745", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T12:07:24Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1780e055151de3", title: "#1125 Drain the Colour, Keep the Gold", link: "https://mail.google.com/mail/#all/1a1780e055151de3", published: "2026-10-26T11:50:38Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a177f191e8a6015", title: "New AI model: lbs-27b, inclusionai/lbs-27b", link: "https://mail.google.com/mail/#all/1a177f191e8a6015", published: "2026-10-26T11:21:22Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1778dba384579c", title: "Takara TLDR: October 26, 2026", link: "https://mail.google.com/mail/#all/1a1778dba384579c", published: "2026-10-26T09:32:18Z", summary: "via takara.ai", publisher: "takara.ai", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17778c9d4f4a5c", title: "Build Your Own AI Second Brain", link: "https://mail.google.com/mail/#all/1a17778c9d4f4a5c", published: "2026-10-26T09:05:58Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17759a03b65562", title: "Google's Elephant-Goldfish Model Reviews Specs First", link: "https://mail.google.com/mail/#all/1a17759a03b65562", published: "2026-10-26T08:35:10Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176d391bee1a35", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T06:08:58Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176cc0a5281e69", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a176cc0a5281e69", published: "2026-10-26T06:00:43Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a176b59e969953a", title: "The 100 Questions That Haunt AI Engineering Interviews 2026", link: "https://mail.google.com/mail/#all/1a176b59e969953a", published: "2026-10-26T05:36:00Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17694cc2150158", title: "Strengthen Cloud Resilience, Accelerate Delivery and Scale AI Modernization", link: "https://mail.google.com/mail/#all/1a17694cc2150158", published: "2026-10-26T05:00:24Z", summary: "via devops.com", publisher: "devops.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1758e022960159", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-26T00:13:23Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a177eda12a6a1c0", title: "😺 Anthropic's unexpected paywall breach", link: "https://mail.google.com/mail/#all/1a177eda12a6a1c0", published: "2026-10-26T11:16:51Z", summary: "via theneurondaily.com", publisher: "theneurondaily.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
