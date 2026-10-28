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

export const GMAIL_NEWS_AT = "2026-10-28T02:45:35Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18006480a56760", title: "Daily papers of 27 Oct 2026", link: "https://mail.google.com/mail/#all/1a18006480a56760", published: "2026-10-28T01:00:57Z", summary: "via huggingface.co", publisher: "huggingface.co", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ffd157fdf43b", title: "Exclusive: OpenAI, a Longtime Nvidia Customer, Plans to Buy Google’s AI Chips", link: "https://mail.google.com/mail/#all/1a17ffd157fdf43b", published: "2026-10-28T00:50:54Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17f2ac5beeb9a1", title: "AI agents used stolen app credentials to target more than 2,250 Microsoft 365 tenants", link: "https://mail.google.com/mail/#all/1a17f2ac5beeb9a1", published: "2026-10-27T21:01:09Z", summary: "via venturebeat.com", publisher: "venturebeat.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1802805d3af20c", title: "Exclusive: Onsemi in Talks to Buy Startup Ferric for About $1 Billion", link: "https://mail.google.com/mail/#all/1a1802805d3af20c", published: "2026-10-28T01:37:47Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fe3de498b684", title: "New AI model: metatron-v1, nvidia/metatron-v1", link: "https://mail.google.com/mail/#all/1a17fe3de498b684", published: "2026-10-28T00:23:22Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fe3bf1719ff8", title: "New AI model: liquidai/d1-2b, liquidai/d1-omni-2b", link: "https://mail.google.com/mail/#all/1a17fe3bf1719ff8", published: "2026-10-28T00:23:14Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fe36f6fdee8d", title: "New AI model: liquidai/lfm3-1.7b-base", link: "https://mail.google.com/mail/#all/1a17fe36f6fdee8d", published: "2026-10-28T00:22:53Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fe34be6851d4", title: "New AI model: lfm3, lfm3-1.7b +2", link: "https://mail.google.com/mail/#all/1a17fe34be6851d4", published: "2026-10-28T00:22:44Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fe330c553598", title: "The Briefing: It’s TPU Time at Google", link: "https://mail.google.com/mail/#all/1a17fe330c553598", published: "2026-10-28T00:22:37Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17fd7e94cc04e8", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-28T00:10:18Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17f372519a9d76", title: "Building a Speaker Arena With Kilo, Jev, and Enkrypt", link: "https://mail.google.com/mail/#all/1a17f372519a9d76", published: "2026-10-27T21:14:23Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ed3aa324aaa3", title: "Drop your pin: Where does your invoice lifecycle stand on AI?", link: "https://mail.google.com/mail/#all/1a17ed3aa324aaa3", published: "2026-10-27T19:26:02Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1802a523d5de17", title: "New device signed in to your Higgsfield AI account", link: "https://mail.google.com/mail/#all/1a1802a523d5de17", published: "2026-10-28T01:40:19Z", summary: "via higgsfield.ai", publisher: "higgsfield.ai", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
