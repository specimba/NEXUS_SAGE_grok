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

export const GMAIL_NEWS_AT = "2026-10-28T17:50:01Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a18370a4fc3a225", title: "‘Nobody’s Ready’: AI-Found Bugs Spark a Corporate Security Spending Spree", link: "https://mail.google.com/mail/#all/1a18370a4fc3a225", published: "2026-10-28T16:55:58Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18375f26bc1905", title: "QwenWork Enterprise Premium: security and control, built in", link: "https://mail.google.com/mail/#all/1a18375f26bc1905", published: "2026-10-28T17:00:22Z", summary: "via alibabacloud.com", publisher: "alibabacloud.com", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18344702353fb3", title: "Google Genie 4 🌐, Anthropic Claude Drug Discovery 🧬, IBM RAG 65x Less", link: "https://mail.google.com/mail/#all/1a18344702353fb3", published: "2026-10-28T16:07:42Z", summary: "via alphasignal.ai", publisher: "alphasignal.ai", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a183741c635e892", title: "Oct. 28 - Cyber insurers fear PHP fallout | Hackers target flawed IoT devices", link: "https://mail.google.com/mail/#all/1a183741c635e892", published: "2026-10-28T16:58:53Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1835b027459309", title: "The AI Friend Who Laughs at Every Joke", link: "https://mail.google.com/mail/#all/1a1835b027459309", published: "2026-10-28T16:31:00Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18331755af1a4c", title: "How Blue Castle Agency got 4x the sourcing with Claude and Zapier MCP", link: "https://mail.google.com/mail/#all/1a18331755af1a4c", published: "2026-10-28T15:46:58Z", summary: "via zapier.com", publisher: "zapier.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1839eb125b5b98", title: "See new AI control from ThreatLocker in action", link: "https://mail.google.com/mail/#all/1a1839eb125b5b98", published: "2026-10-28T17:46:14Z", summary: "via simplelogin.co", publisher: "simplelogin.co", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1839bcfb0d45ed", title: "Wicked Stardust Bundle, Probably Stolen - Cyberpunk Shopkeeper Sim & Stygian: Outer Gods are out!", link: "https://mail.google.com/mail/#all/1a1839bcfb0d45ed", published: "2026-10-28T17:32:04Z", summary: "via indiegala.com", publisher: "indiegala.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1836c59c34ed3d", title: "🟡 Pit stop", link: "https://mail.google.com/mail/#all/1a1836c59c34ed3d", published: "2026-10-28T16:51:16Z", summary: "via semafor.com", publisher: "semafor.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18369ba047a81b", title: "Get your listings ready for Cyber", link: "https://mail.google.com/mail/#all/1a18369ba047a81b", published: "2026-10-28T16:48:26Z", summary: "via etsy.com", publisher: "etsy.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
