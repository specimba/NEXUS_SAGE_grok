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

export const GMAIL_NEWS_AT = "2026-10-30T12:45:16Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18cccca0cfdbfa", title: "Critical Linux Flaw (CVSS 9.8), $6.3 Billion Binance Hack & Claude Code Extension Backdoored", link: "", published: "2026-10-30T12:04:30Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18cb49e87b3d21", title: "Monitor changes detected: Agentic and AI Security News", link: "https://www.linkedin.com/pulse/agentic", published: "2026-10-30T12:06:49Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 22, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c854c9707867", title: "Binance Investigates Potential Hack After $2 Billion-Plus in Tokens Left Exchange Wallets", link: "", published: "2026-10-30T11:15:07Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18cc1bdaa05060", title: "New AI model: mage-vl-cowork, microsoft/mage-vl-cowork", link: "", published: "2026-10-30T12:21:08Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18cafe67bd3c28", title: "Oct. 30 - MSPs drop the ball on advisory | Sandler Partners deploys sales engineer bot", link: "", published: "2026-10-30T12:01:39Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18ca9227006ae0", title: "#1129 How to Prompt Symmetrical Editorial Portraits in AI", link: "", published: "2026-10-30T11:53:33Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18ca437b38cba9", title: "$120K-$145K/year: AI Engineer- Remote at Ladders", link: "", published: "2026-10-30T11:48:54Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c77a8e91f28c", title: "OpenAI says AI disproved a 27-year-old hypothesis, Google gates Gemini 4 Carbon, Anthropic files for IPO", link: "", published: "2026-10-30T11:00:07Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c63b9805edf6", title: "Takara TLDR: October 30, 2026", link: "", published: "2026-10-30T10:38:27Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c5f5d14fa9d4", title: "Building a Self-Driving Software Factory with AI", link: "", published: "2026-10-30T10:33:41Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c458ab255ce4", title: "Five Repos: Game Studios Gives Claude Code 49 Agents", link: "", published: "2026-10-30T10:02:52Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18c40ed2798dd0", title: "Mistral cut Large 4's cost per benchmark task 63%. DeepSeek is still cheaper", link: "", published: "2026-10-30T10:00:26Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
