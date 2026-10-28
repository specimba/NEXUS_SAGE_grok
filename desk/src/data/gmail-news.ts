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

export const GMAIL_NEWS_AT = "2026-10-28T12:43:38Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18273234ef63df", title: "Critical UEFI Flaw, Oracle's Triple Threat, GMO's $1M Hacker Hunt, Tailscale SSH Fixes and More", link: "https://mail.google.com/mail/#all/1a18273234ef63df", published: "2026-10-28T12:04:09Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 68, priority: "P1" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18262e16b05072", title: "Oct. 28 - Tech advisors test outcome-based pricing | GoTo expands MSP platform", link: "https://mail.google.com/mail/#all/1a18262e16b05072", published: "2026-10-28T12:01:18Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181f2ba59ce051", title: "Confirm: your daily AI Pin", link: "https://theaipin.com/newsletter/confirm?token=", published: "2026-10-28T09:58:50Z", summary: "via theaipin.com", publisher: "theaipin.com", source: "gmail-news" as const, qi: 22, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a182678d324eca7", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-28T12:06:26Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18238a10345b94", title: "OpenAI, Anthropic Claim Cryptography Breakthrough on Same Day", link: "https://mail.google.com/mail/#all/1a18238a10345b94", published: "2026-10-28T11:15:09Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181ff9d79e0a92", title: "Takara TLDR: October 28, 2026", link: "https://mail.google.com/mail/#all/1a181ff9d79e0a92", published: "2026-10-28T10:12:54Z", summary: "via takara.ai", publisher: "takara.ai", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18287a8ec12339", title: "How We Built a Custom AI SOC in 23 Minutes, And How You Can Too", link: "https://mail.google.com/mail/#all/1a18287a8ec12339", published: "2026-10-28T12:41:02Z", summary: "via thehackernews.com", publisher: "thehackernews.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181e99b909b5da", title: "Applied Research - Scientific AI job at Prime Intellect", link: "https://mail.google.com/mail/#all/1a181e99b909b5da", published: "2026-10-28T09:48:52Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181d9643488cfa", title: "😺 Google launches Genie 4 with sound", link: "https://mail.google.com/mail/#all/1a181d9643488cfa", published: "2026-10-28T09:31:08Z", summary: "via theneurondaily.com", publisher: "theneurondaily.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181fd1418cadd3", title: "💬New Blog Post 👉  HTTP2Shell Expansion (CVE-2026-111497): Where the Brotli Decoder Bug Went After Node.js and Python - 10/28/2026", link: "https://phoenix.security/resources/blogs/", published: "2026-10-28T10:10:04Z", summary: "via phoenix.security", publisher: "phoenix.security", source: "gmail-news" as const, qi: 11, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1827af3655407e", title: "Building Trust in Autonomous AI Agents", link: "https://mail.google.com/mail/#all/1a1827af3655407e", published: "2026-10-28T12:27:38Z", summary: "via devops.com", publisher: "devops.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181edee9b060c9", title: "10 new citations to articles by Canfer Akbulut", link: "https://mail.google.com/mail/#all/1a181edee9b060c9", published: "2026-10-28T09:53:36Z", summary: "via google.com", publisher: "google.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1818ad2b3d3881", title: "Fireside chat with Omdia on why AI coding speed stalls at the MR", link: "https://mail.google.com/mail/#all/1a1818ad2b3d3881", published: "2026-10-28T08:05:20Z", summary: "via gitlab.com", publisher: "gitlab.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1825780adff41b", title: "ML Engineer II (Remote) at Torentify", link: "https://mail.google.com/mail/#all/1a1825780adff41b", published: "2026-10-28T11:48:55Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181fe09c2157ba", title: "Register Now: Data Streaming World Tour Istanbul | 18 Nov", link: "https://mail.google.com/mail/#all/1a181fe09c2157ba", published: "2026-10-28T10:11:08Z", summary: "via confluent.io", publisher: "confluent.io", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
