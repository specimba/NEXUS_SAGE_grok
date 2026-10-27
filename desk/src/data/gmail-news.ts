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

export const GMAIL_NEWS_AT = "2026-10-27T02:49:01Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a17ae00acf1c97c", title: "Daily papers of 26 Oct 2026", link: "https://mail.google.com/mail/#all/1a17ae00acf1c97c", published: "2026-10-27T01:01:05Z", summary: "via huggingface.co", publisher: "huggingface.co", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17a095524fa512", title: "FOD#173: What Anthropic’s IPO Tells Us About AI Safety", link: "https://mail.google.com/mail/#all/1a17a095524fa512", published: "2026-10-26T21:06:34Z", summary: "via beehiiv.com", publisher: "beehiiv.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab58070b7291", title: "The 50 Most Influential People in Tech Run Companies Worth a Year of U.S. GDP", link: "https://mail.google.com/mail/#all/1a17ab58070b7291", published: "2026-10-27T00:14:37Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab2fa6760b60", title: "The Briefing: Sucking Up the Air", link: "https://mail.google.com/mail/#all/1a17ab2fa6760b60", published: "2026-10-27T00:11:50Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab148bddc4f9", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-27T00:10:01Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17aae3de16e3d2", title: "New AI model: baidu/unlimited-ocr-2", link: "https://mail.google.com/mail/#all/1a17aae3de16e3d2", published: "2026-10-27T00:06:41Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17a8e64509283f", title: "PHP2Shell: Critical RCE, Real Risk — But Is Mass Exploitation Overhyped?", link: "https://mail.google.com/mail/#all/1a17a8e64509283f", published: "2026-10-26T23:30:20Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17a8c1e74827f8", title: "Top Posts Today from The Information Subscribers", link: "https://mail.google.com/mail/#all/1a17a8c1e74827f8", published: "2026-10-26T23:29:25Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17a36ff5336ab0", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a176cc0a5281e69", published: "2026-10-26T21:56:24Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17b272081dccb3", title: "Model available: gpt-6.1-terra", link: "https://mail.google.com/mail/#all/1a17b272081dccb3", published: "2026-10-27T02:13:31Z", summary: "via aihubmix.com", publisher: "aihubmix.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab5935e4eba5", title: "Explore discounted AI models on Poyo.ai", link: "https://mail.google.com/mail/#all/1a17ab5935e4eba5", published: "2026-10-27T00:14:41Z", summary: "via poyo.ai", publisher: "poyo.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a179d1988b637cf", title: "Cerebral Valley – Week of October 26", link: "https://mail.google.com/mail/#all/1a179d1988b637cf", published: "2026-10-26T20:05:40Z", summary: "via cerebralvalley.ai", publisher: "cerebralvalley.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17acb38337f5c6", title: "Important advisory on recent industry security disclosures", link: "https://mail.google.com/mail/#all/1a17acb38337f5c6", published: "2026-10-27T00:38:11Z", summary: "via render.com", publisher: "render.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a179e31710e9b14", title: "Security advisory: eMudhra CA compromise, action required", link: "https://mail.google.com/mail/#all/1a179e31710e9b14", published: "2026-10-26T20:24:47Z", summary: "via nebius.com", publisher: "nebius.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
];
