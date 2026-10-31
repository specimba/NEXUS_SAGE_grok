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

export const GMAIL_NEWS_AT = "2026-10-31T07:46:17Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1909f3296093a1", title: "AI exposes internet flaws, boosts cyber jobs | Fake AI apps distribute cryptominers | Microsoft retires Azure Dev Environments", link: "", published: "2026-10-31T04:35:44Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1909763c52ed3e", title: "[GitHub] Your Dependabot alerts for today Oct 31", link: "", published: "2026-10-31T06:13:22Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1909095adab93e", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-31T06:05:56Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1902f9b3dbe7d1", title: "20 Open-Source Projects for AI Agents In Production | Caspar - AI Engineer in The AI Brief", link: "", published: "2026-10-31T04:20:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a19026c1a24cab9", title: "New AI model: gourd-6.66-ultra", link: "", published: "2026-10-31T04:10:20Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18fbd0088d93c3", title: "What Is an ML Threat Model and Why Does Every AI Team Need One?", link: "", published: "2026-10-31T02:14:43Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18f79774129983", title: "Daily papers of 30 Oct 2026", link: "", published: "2026-10-31T01:01:04Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a190e2a2919fe2e", title: "10 new citations to articles by Canfer Akbulut", link: "", published: "2026-10-31T07:35:33Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1908cdb1f3bd9f", title: "Top Headlines: Oct. 26–30, 2026", link: "", published: "2026-10-31T06:01:46Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a190551b318f2ad", title: "The daily pin: OpenAI, Google, Microsoft and Anthropic back one robots.txt opt-out for AI training", link: "", published: "2026-10-31T05:00:58Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18fb8e9e0b38a1", title: "Welcome to MindStudio", link: "", published: "2026-10-31T02:10:21Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18f5f6a4cbe30f", title: "We're IFTTT.ai", link: "", published: "2026-10-31T00:32:36Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
