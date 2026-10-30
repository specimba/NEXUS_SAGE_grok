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

export const GMAIL_NEWS_AT = "2026-10-30T02:48:15Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18a9affbc05077", title: "NEXUS OS daily digest — 2026-10-29", link: "", published: "2026-10-30T02:19:35Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a5d828148292", title: "NEXUS OS daily digest — 2026-10-29", link: "", published: "2026-10-30T01:12:26Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a53205c26bf7", title: "Daily papers of 29 Oct 2026", link: "", published: "2026-10-30T01:01:05Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a247a4991c88", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-30T00:10:09Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a189e7f04fd68cf", title: "Exclusive: Legal AI Startup Bids for Assets of Fallen Law Firm Weil Gotshal", link: "", published: "2026-10-29T23:04:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a189d701c7bda43", title: "AI News: Claude auto mode, PHP2Shell and Mistral Voxtral 3", link: "", published: "2026-10-29T22:45:30Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a8a5db0ade30", title: "Behind DeepSeek’s $16 Billion Funding: Chinese Tech Titans and State Players", link: "", published: "2026-10-30T02:01:25Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a76a02f6ca9b", title: "New on OpenResearch: more agents, model rankings, and a redesigned desktop app", link: "", published: "2026-10-30T00:31:18Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18a36dfb731122", title: "Your Google Account was recovered successfully", link: "", published: "2026-10-30T00:30:13Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a189fb7a1722d7d", title: "Nvidia Moves to Backstop a Cloud Provider’s $45 Billion Anthropic Project", link: "", published: "2026-10-29T23:25:22Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a189d4bd5705d84", title: "CodeRabbit Secure: Find and fix vulnerabilities before attackers do", link: "", published: "2026-10-29T22:43:03Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a189bddbed6922d", title: "Are You Overprompting Claude? STOP. DON’T. PLEASE.", link: "", published: "2026-10-29T22:17:25Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
