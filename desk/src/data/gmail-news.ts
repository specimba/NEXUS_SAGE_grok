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

export const GMAIL_NEWS_AT = "2026-10-29T07:47:34Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1852cbf61ef56e", title: "Daily papers of 28 Oct 2026", link: "", published: "2026-10-29T01:01:04Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18645407537257", title: "Monitor changes detected: Agentic and AI Security News", link: "https://www.linkedin.com/pulse/third-", published: "2026-10-29T06:07:27Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 22, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1864a9ac84f4d8", title: "[GitHub] Your Dependabot alerts for today Oct 29", link: "", published: "2026-10-29T06:13:18Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1862611734f6ce", title: "AI Agents Are Changing Software Supply Chain Security", link: "", published: "2026-10-29T05:33:22Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a185e2e51c239b4", title: "I Compared a $2,499 Mac Studio to a $200/Month AI Plan. The Math Surprised Me | Loengnavy", link: "", published: "2026-10-29T04:20:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a185bb67f4cf6e2", title: "Everyone’s Using AI But Divisions Are Growing:  WTF Highlights", link: "", published: "2026-10-29T03:36:53Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1855b5901d3f40", title: "Exclusive: OpenAI’s Astra Model Becomes Top Distillation Target for China’s AI Labs", link: "", published: "2026-10-29T01:51:58Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184c2c26c13064", title: "From I. J. Good to Flint: The Long, Strange Quest for Self-Improving AI", link: "", published: "2026-10-28T23:05:18Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a185d9d5b7ac0c6", title: "💬 New thread from AI Engineering Insider", link: "", published: "2026-10-29T04:10:04Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a185029b9b09fd7", title: "Save 10% on your first Poyo.ai top-up", link: "", published: "2026-10-29T00:15:02Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184fff830c97ae", title: "The Briefing: Google Cloud Closes In", link: "", published: "2026-10-29T00:12:08Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184dbb13fb0ee4", title: "ChatGPT can now run deep searches with Consensus", link: "", published: "2026-10-28T23:32:32Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184d8d633501fe", title: "Top Posts Today from The Information Subscribers", link: "", published: "2026-10-28T23:29:25Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184a38ba6858f3", title: "Anaconda and Kilo Join the Open Secure AI Alliance", link: "", published: "2026-10-28T22:30:42Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
