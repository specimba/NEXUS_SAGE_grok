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

export const GMAIL_NEWS_AT = "2026-10-30T07:46:18Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18b70afd46a2f8", title: "[GitHub] Your Dependabot alerts for today Oct 30", link: "", published: "2026-10-30T06:12:59Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18b6b530b2298f", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-30T06:07:08Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18b9521b961c68", title: "PHP2Shell exploits highlight identity security | CERT-In warns Apple users to update software | GitHub unveils Copilot app, Fusion", link: "", published: "2026-10-30T04:36:49Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18b093f3ee49be", title: "I Fused 3 Tiny Local LLMs on my Laptop and Matched the Reasoning of Anthropic Fable 5 | Nikhil Varma in Towards AI", link: "", published: "2026-10-30T04:20:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a9affbc05077", title: "NEXUS OS daily digest — 2026-10-29", link: "", published: "2026-10-30T02:19:35Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a5d828148292", title: "NEXUS OS daily digest — 2026-10-29", link: "", published: "2026-10-30T01:12:26Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a53205c26bf7", title: "Daily papers of 29 Oct 2026", link: "", published: "2026-10-30T01:01:05Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18baccc97d56b4", title: "How to Create Consistent 3D Cartoon Characters with AI", link: "", published: "2026-10-30T07:18:21Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18ba5dba154b73", title: "PHP2Shell: How it works and how to stop it", link: "", published: "2026-10-30T07:11:02Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18b73083b0d6bf", title: "💬 New thread from AI Engineering Insider", link: "", published: "2026-10-30T06:15:32Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a8a5db0ade30", title: "Behind DeepSeek’s $16 Billion Funding: Chinese Tech Titans and State Players", link: "", published: "2026-10-30T02:01:25Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a76a02f6ca9b", title: "New on OpenResearch: more agents, model rankings, and a redesigned desktop app", link: "", published: "2026-10-30T00:31:18Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
