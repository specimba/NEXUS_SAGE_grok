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

export const GMAIL_NEWS_AT = "2026-10-29T02:47:53Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1852cbf61ef56e", title: "Daily papers of 28 Oct 2026", link: "https://mail.google.com/mail/#all/1a1852cbf61ef56e", published: "2026-10-29T01:01:04Z", summary: "via huggingface.co", publisher: "huggingface.co", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1855b5901d3f40", title: "Exclusive: OpenAI’s Astra Model Becomes Top Distillation Target for China’s AI Labs", link: "https://mail.google.com/mail/#all/1a1855b5901d3f40", published: "2026-10-29T01:51:58Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184c2c26c13064", title: "From I. J. Good to Flint: The Long, Strange Quest for Self-Improving AI", link: "https://mail.google.com/mail/#all/1a184c2c26c13064", published: "2026-10-28T23:05:18Z", summary: "via beehiiv.com", publisher: "beehiiv.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184fff830c97ae", title: "The Briefing: Google Cloud Closes In", link: "https://mail.google.com/mail/#all/1a184fff830c97ae", published: "2026-10-29T00:12:08Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184fe17a451972", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-29T00:10:06Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184d8d633501fe", title: "Top Posts Today from The Information Subscribers", link: "https://mail.google.com/mail/#all/1a184d8d633501fe", published: "2026-10-28T23:29:25Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184a38ba6858f3", title: "Anaconda and Kilo Join the Open Secure AI Alliance", link: "https://mail.google.com/mail/#all/1a184a38ba6858f3", published: "2026-10-28T22:30:42Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1844b635238030", title: "CBS’ Bari Weiss Tells Critics to ‘Judge Us by the Journalism’", link: "https://mail.google.com/mail/#all/1a1844b635238030", published: "2026-10-28T20:54:54Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1842dc274e1522", title: "How to Find Clients Using AI", link: "https://mail.google.com/mail/#all/1a1842dc274e1522", published: "2026-10-28T20:21:56Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1844e4a3283e93", title: "OpenAI sued over ChatGPT’s medical advice 🧑‍⚖️", link: "https://mail.google.com/mail/#all/1a1844e4a3283e93", published: "2026-10-28T20:58:06Z", summary: "via beehiiv.com", publisher: "beehiiv.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a185029b9b09fd7", title: "Save 10% on your first Poyo.ai top-up", link: "https://mail.google.com/mail/#all/1a185029b9b09fd7", published: "2026-10-29T00:15:02Z", summary: "via poyo.ai", publisher: "poyo.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a184dbb13fb0ee4", title: "ChatGPT can now run deep searches with Consensus", link: "https://mail.google.com/mail/#all/1a184dbb13fb0ee4", published: "2026-10-28T23:32:32Z", summary: "via consensus.app", publisher: "consensus.app", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18481b6d550c54", title: "🛡️ Google’s new #1 AI model has a velvet rope", link: "https://mail.google.com/mail/#all/1a18481b6d550c54", published: "2026-10-28T21:54:15Z", summary: "via beehiiv.com", publisher: "beehiiv.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
