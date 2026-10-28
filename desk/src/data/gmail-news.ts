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

export const GMAIL_NEWS_AT = "2026-10-28T07:46:13Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a1815261ac20464", title: "QwenWork Enterprise Premium: security and control, built in", link: "https://mail.google.com/mail/#all/1a1815261ac20464", published: "2026-10-28T07:03:41Z", summary: "via mozmail.com", publisher: "mozmail.com", source: "gmail-news" as const, qi: 25.5, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1812942aa955a2", title: "Bumble Founder Whitney Wolfe Herd Explains Decision to Take Company Private", link: "https://mail.google.com/mail/#all/1a1812942aa955a2", published: "2026-10-28T06:18:46Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1811e7cabff481", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-28T06:07:01Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1809e795bfb18a", title: "💬 New thread from AI Engineering Insider", link: "https://mail.google.com/mail/#all/1a1809e795bfb18a", published: "2026-10-28T03:47:08Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1809a7f32dfdd0", title: "New papers from Samuel Schmidgall", link: "https://mail.google.com/mail/#all/1a1809a7f32dfdd0", published: "2026-10-28T03:42:50Z", summary: "via alphaxiv.org", publisher: "alphaxiv.org", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1809a7c185f628", title: "Cracking the Generative AI Engineering Interview 2026 (Version II)", link: "https://mail.google.com/mail/#all/1a1809a7c185f628", published: "2026-10-28T03:42:32Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1810eac7ddb7c7", title: "US warns of active PHP web bug exploitation | OpenAI halves agent price, flags bypass | E2E Networks plans NVIDIA Blackwell expansion", link: "https://mail.google.com/mail/#all/1a1810eac7ddb7c7", published: "2026-10-28T04:46:58Z", summary: "via techgig.com", publisher: "techgig.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a180bc858e6dc41", title: "10 Modern CLI Tools You Should Try in 2027 | RUMESH PRASANGA — AI | ML | AI Agents", link: "https://mail.google.com/mail/#all/1a180bc858e6dc41", published: "2026-10-28T04:20:00Z", summary: "via medium.com", publisher: "medium.com", source: "gmail-news" as const, qi: 12.8, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a181357ca0a5d6a", title: "[GitHub] Your Dependabot alerts for today Oct 28", link: "https://mail.google.com/mail/#all/1a181357ca0a5d6a", published: "2026-10-28T06:32:08Z", summary: "via github.com", publisher: "github.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a180e2e3b68a0f5", title: "New Jobs at Anthropic", link: "https://mail.google.com/mail/#all/1a180e2e3b68a0f5", published: "2026-10-28T05:01:54Z", summary: "via greenhouse-jobs.com", publisher: "greenhouse-jobs.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18075de8495321", title: "Re: [specimba/ARTEXeng] Add a compact GROSS / PLAN B audit register (PR #2)", link: "https://mail.google.com/mail/#all/1a180737516e89bd", published: "2026-10-28T03:02:50Z", summary: "via github.com", publisher: "github.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a180737516e89bd", title: "Re: [specimba/ARTEXeng] Add a compact GROSS / PLAN B audit register (PR #2)", link: "https://mail.google.com/mail/#all/1a180737516e89bd", published: "2026-10-28T03:00:12Z", summary: "via github.com", publisher: "github.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
