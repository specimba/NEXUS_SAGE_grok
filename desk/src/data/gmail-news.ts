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

export const GMAIL_NEWS_AT = "2026-10-31T02:50:27Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18ec121e925109", title: "Nation-State Cyber Threat Intelligence Report", link: "", published: "2026-10-30T21:39:21Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18fbd0088d93c3", title: "What Is an ML Threat Model and Why Does Every AI Team Need One?", link: "", published: "2026-10-31T02:14:43Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18f79774129983", title: "Daily papers of 30 Oct 2026", link: "", published: "2026-10-31T01:01:04Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18fb8e9e0b38a1", title: "Welcome to MindStudio", link: "", published: "2026-10-31T02:10:21Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18f5f6a4cbe30f", title: "We're IFTTT.ai", link: "", published: "2026-10-31T00:32:36Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18e8df7576200a", title: "\"✨Remix for QI-21✨private version\" and 2 more", link: "", published: "2026-10-30T20:43:50Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18e81c79d047ef", title: "This Week's Most Popular Stories", link: "", published: "2026-10-30T20:30:31Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18e8135520699f", title: "Reverse Engineer Any Successful Model For Free", link: "", published: "2026-10-30T20:28:49Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
