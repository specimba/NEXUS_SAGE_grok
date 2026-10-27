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

export const GMAIL_NEWS_AT = "2026-10-27T07:44:54Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a17bd9776c9547d", title: "Google AI, ML, RAG and Agentic-AI Interview Questions (2026)", link: "https://mail.google.com/mail/#all/1a17bd9776c9547d", published: "2026-10-27T05:33:07Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ae00acf1c97c", title: "Daily papers of 26 Oct 2026", link: "https://mail.google.com/mail/#all/1a17ae00acf1c97c", published: "2026-10-27T01:01:05Z", summary: "via huggingface.co", publisher: "huggingface.co", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17c1430a0bba64", title: "AI coding agents vulnerable to Downloads folder hijack | Oracle, Azul issue Java critical patches | India GCCs to add 1.4 million jobs by 2031", link: "https://mail.google.com/mail/#all/1a17c1430a0bba64", published: "2026-10-27T04:34:57Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17c15e24fab53c", title: "AI Model Routing", link: "https://mail.google.com/mail/#all/1a17c15e24fab53c", published: "2026-10-27T06:38:26Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17bf7213c2b27b", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-27T06:05:55Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17b46629bb0aab", title: "VECTR-CAST | 14-Day Cyber Threat Forecast for U.S. Organizations", link: "https://mail.google.com/mail/#all/1a17b46629bb0aab", published: "2026-10-27T02:52:44Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab58070b7291", title: "The 50 Most Influential People in Tech Run Companies Worth a Year of U.S. GDP", link: "https://mail.google.com/mail/#all/1a17ab58070b7291", published: "2026-10-27T00:14:37Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab2fa6760b60", title: "The Briefing: Sucking Up the Air", link: "https://mail.google.com/mail/#all/1a17ab2fa6760b60", published: "2026-10-27T00:11:50Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab148bddc4f9", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-27T00:10:01Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17aae3de16e3d2", title: "New AI model: baidu/unlimited-ocr-2", link: "https://mail.google.com/mail/#all/1a17aae3de16e3d2", published: "2026-10-27T00:06:41Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17c4965b15e24d", title: "Plug and Play Türkiye October: Applied AI, SV Summit & Istanbul Expo", link: "https://mail.google.com/mail/#all/1a17c4965b15e24d", published: "2026-10-27T07:35:09Z", summary: "via pnptc.com", publisher: "pnptc.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17c3c8f79d8a95", title: "[GitHub] Your Dependabot alerts for today Oct 27", link: "https://mail.google.com/mail/#all/1a17c3c8f79d8a95", published: "2026-10-27T07:21:45Z", summary: "via github.com", publisher: "github.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17b962d546b76e", title: "The American DeepSeek Is Here, and It Just Beat Opus 5 on a Viral Test | Pranit naik in The Ai Studio", link: "https://mail.google.com/mail/#all/1a17b962d546b76e", published: "2026-10-27T04:20:00Z", summary: "via medium.com", publisher: "medium.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17b272081dccb3", title: "Model available: gpt-6.1-terra", link: "https://mail.google.com/mail/#all/1a17b272081dccb3", published: "2026-10-27T02:13:31Z", summary: "via aihubmix.com", publisher: "aihubmix.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17ab5935e4eba5", title: "Explore discounted AI models on Poyo.ai", link: "https://mail.google.com/mail/#all/1a17ab5935e4eba5", published: "2026-10-27T00:14:41Z", summary: "via poyo.ai", publisher: "poyo.ai", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17acb38337f5c6", title: "Important advisory on recent industry security disclosures", link: "https://mail.google.com/mail/#all/1a17acb38337f5c6", published: "2026-10-27T00:38:11Z", summary: "via render.com", publisher: "render.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
];
