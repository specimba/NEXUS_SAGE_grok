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

export const GMAIL_NEWS_AT = "2026-10-31T12:52:23Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1909f3296093a1", title: "AI exposes internet flaws, boosts cyber jobs | Fake AI apps distribute cryptominers | Microsoft retires Azure Dev Environments", link: "", published: "2026-10-31T04:35:44Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 38.3, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a191e5485baf8fd", title: "TeamViewer Remote Hijack, ChatGPT Shared-Link Flaw, Ivanti Root Exploit, and More", link: "", published: "2026-10-31T12:04:13Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a190fabe65188cb", title: "New AI model: gpt-6-astra-law", link: "", published: "2026-10-31T08:01:53Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a191daf82648a10", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-31T12:06:49Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1909095adab93e", title: "Monitor changes detected: Agentic and AI Security News", link: "", published: "2026-10-31T06:05:56Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1908cdb1f3bd9f", title: "Top Headlines: Oct. 26–30, 2026", link: "", published: "2026-10-31T06:01:46Z", summary: "via simplelogin.co", publisher: "simplelogin.co", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1914c55bfd936f", title: "😺 You asked how other readers are using AI. Here’s a look.", link: "", published: "2026-10-31T09:30:46Z", summary: "via theneurondaily.com", publisher: "theneurondaily.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1909763c52ed3e", title: "[GitHub] Your Dependabot alerts for today Oct 31", link: "", published: "2026-10-31T06:13:22Z", summary: "via github.com", publisher: "github.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a191ca932ed9ed4", title: "ServiceTitan AI Engineer and 39 other jobs you may be interested in", link: "", published: "2026-10-31T11:48:54Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1915cb0eadf89d", title: "Machine Learning Engineer, Growth Platform job at Stripe - Actively recruiting", link: "", published: "2026-10-31T09:48:52Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a190e2a2919fe2e", title: "10 new citations to articles by Canfer Akbulut", link: "", published: "2026-10-31T07:35:33Z", summary: "via google.com", publisher: "google.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
