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

export const GMAIL_NEWS_AT = "2026-10-30T17:51:39Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18dcca888b2b86", title: "Know Your AI Toolchain: Lessons from the Cursor Marketplace Incident", link: "", published: "2026-10-30T17:10:07Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18db9158f90f08", title: "🟡 Dartmouth’s bad call", link: "", published: "2026-10-30T16:51:17Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18da23d309bd43", title: "Oct. 30 - Chained PHP attacks hit federal servers | Binance targeted in $6.3B hack", link: "", published: "2026-10-30T16:26:14Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d93e009f2e6b", title: "Halloween 2026: Face Your Darkest AI Fears (If You Dare)", link: "", published: "2026-10-30T16:10:41Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d8ddbab2aa20", title: "$6 Billion Binance Hack Bears Hallmarks of North Korea’s TraderTraitor", link: "", published: "2026-10-30T16:04:01Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d8abfc5e6cb3", title: "Anthropic Follow-Up for Security Data Engineer | Canberk", link: "", published: "2026-10-30T16:00:41Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d872fafffcc5", title: "This newsletter was 'lovingly handcrafted'", link: "", published: "2026-10-30T15:56:28Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d7e90d98ba51", title: "How to Create WEIRD 3D Cartoon Characters with AI", link: "", published: "2026-10-30T15:45:59Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18d5440ced1a1f", title: "Why Does the Western Mind Keep Looking for One Truth?", link: "", published: "2026-10-30T15:00:18Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
