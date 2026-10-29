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

export const GMAIL_NEWS_AT = "2026-10-29T12:46:38Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1877dd77f0b203", title: "Machine Learning Infrastructure Engineer - LLM & Agentic AI job at Stellar Cyber", link: "", published: "2026-10-29T11:48:53Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18799694c14f34", title: "Telegram RCE, Alpine Linux Attack, Cisco Zero-Days, China Exploits VMware and More", link: "", published: "2026-10-29T12:04:10Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1870ff9f20569f", title: "Machine Learning Infrastructure Engineer - LLM & Agentic AI role paying up to $215K/year", link: "", published: "2026-10-29T09:48:53Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1878e0714bb755", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-29T12:06:34Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a187519c9cd3a0b", title: "Your coding agent's harness can triple costs without improving accuracy", link: "", published: "2026-10-29T11:00:24Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1872bc4439617f", title: "GSA, General Services Administration (External) Daily Digest Bulletin", link: "", published: "2026-10-29T10:19:14Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1877ced5e7ff3a", title: "#1128 Christmas Card Illustration Prompts for AI", link: "", published: "2026-10-29T11:46:32Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a187637372a09b3", title: "Know Your Agent(KYA)", link: "", published: "2026-10-29T11:18:38Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1875ef81a22871", title: "Google Launches Gemini 4 Carbon, Its Second Major AI Model in a Month", link: "", published: "2026-10-29T11:15:08Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a187464d7a3ea24", title: "😸 Google's cloud doubled. Stock fell.", link: "", published: "2026-10-29T10:48:10Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1873c08a530f45", title: "Takara TLDR: October 29, 2026", link: "", published: "2026-10-29T10:37:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a186f32752a4d5f", title: "xtools-at is now following you on Hugging Face", link: "", published: "2026-10-29T09:17:24Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
