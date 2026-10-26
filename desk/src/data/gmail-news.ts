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

export const GMAIL_NEWS_AT = "2026-10-26T17:47:08Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a179431e0fb9079", title: "Reminder - Please Confirm your Subscription for The Hacker News", link: "https://mail.google.com/mail/#all/1a179431e0fb9079", published: "2026-10-26T17:30:04Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a179232f8c478e5", title: "Stripe’s AI Shopping Lead Puts Card Giants on Edge", link: "https://mail.google.com/mail/#all/1a179232f8c478e5", published: "2026-10-26T16:55:08Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17910e6d416e98", title: "Latest Updates: ServiceNow and NVIDIA move to govern AI agents, Moonshot debuts Kimi K3.1 Pro, the UK funds an AI biosecurity lab", link: "https://mail.google.com/mail/#all/1a17910e6d416e98", published: "2026-10-26T16:35:13Z", summary: "via techstronggroup.com", publisher: "techstronggroup.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1791392d4a51e5", title: "Day 9/10: Count The Hours", link: "https://mail.google.com/mail/#all/1a1791392d4a51e5", published: "2026-10-26T16:36:38Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17909c74f8c9b1", title: "Oct. 26 - CISA’s new vision | PwC confirms third-party breach", link: "https://mail.google.com/mail/#all/1a17909c74f8c9b1", published: "2026-10-26T16:27:26Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178f92c0f0edec", title: "Philosophy & AI recommended Machine Pareidolia", link: "https://mail.google.com/mail/#all/1a178f92c0f0edec", published: "2026-10-26T16:09:15Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178f169a72017a", title: "ChatGPT Says 404 Media Is Tech Support for Huge Corporations", link: "https://mail.google.com/mail/#all/1a178f169a72017a", published: "2026-10-26T16:00:24Z", summary: "via ghost.io", publisher: "ghost.io", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178eea0941183f", title: "Model Inversion: Can Attackers Reconstruct Your Private Training Data?", link: "https://mail.google.com/mail/#all/1a178eea0941183f", published: "2026-10-26T15:56:36Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178cf0bd8c4457", title: "\"The Dot and the Swarm\" and 4 more", link: "https://mail.google.com/mail/#all/1a178cf0bd8c4457", published: "2026-10-26T15:23:17Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1791f467e666ad", title: "10 new citations to articles by Canfer Akbulut", link: "https://mail.google.com/mail/#all/1a1791f467e666ad", published: "2026-10-26T16:50:55Z", summary: "via google.com", publisher: "google.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178df5ac6c95db", title: "New Notification for Meta Global AI Developer Hackathon", link: "https://mail.google.com/mail/#all/1a1770988a3dda5d", published: "2026-10-26T15:41:05Z", summary: "via cerebralvalley.ai", publisher: "cerebralvalley.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a178c20067d2d93", title: "There’s Still Time to Comment! NIST’s Live Document on Secure Software Development Practices", link: "https://mail.google.com/mail/#all/1a178c20067d2d93", published: "2026-10-26T15:09:02Z", summary: "via nist.gov", publisher: "nist.gov", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
