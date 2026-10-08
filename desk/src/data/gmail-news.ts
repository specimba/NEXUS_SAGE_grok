/** Pass F Gmail news Pulse — generated/refreshed by bun run ingest. Pulse-only; never Brief. */
export type GmailNewsRow = {
  id: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  publisher: string;
  from: string;
  source: "gmail-news";
  qi: number;
  priority: "P1" | "P2" | "P3";
  tag: "rest" | "rumor" | "companion" | "incident";
  briefEligible: false;
  pulse_only: true;
};

export const GMAIL_NEWS_AT = "2026-10-08T11:20:23Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a11250b91591834", title: "AI systems could cover up misbehavior", link: "https://metr.org/blog/cover-up", published: "2026-10-06T17:42:45Z", summary: "Treating AI observability as security-critical https://metr.org/blog/cover-up", publisher: "substack.com", from: "metr@substack.com", source: "gmail-news" as const, qi: 30.8, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a111f35812d42ba", title: "Oct. 6 - Water hacks, rogue AI raise alarms | Java vulnerabilities disclosed", link: "https://www.cybersecuritydive.com/news/water", published: "2026-10-06T16:01:57Z", summary: "Cybersecurity Dive Daily https://www.cybersecuritydive.com/news/water", publisher: "divenewsletter.com", from: "newsletter@divenewsletter.com", source: "gmail-news" as const, qi: 30.8, priority: "P2" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1118c601f1cb6a", title: "OpenAI Starts Watermarking ChatGPT Text", link: "https://newsletter.alvarocintas.com/watermark", published: "2026-10-06T14:09:34Z", summary: "PLUS: Set up a free AI https://newsletter.alvarocintas.com/watermark", publisher: "alvarocintas.com", from: "simplifyingai@newsletter.alvarocintas.com", source: "gmail-news" as const, qi: 23.1, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a112914bb745ca0", title: "This AI that can't write", link: "https://www.crewai.com/blog/cant-write", published: "2026-10-06T18:54:34Z", summary: "Jev AI, smart companies https://www.crewai.com/blog/cant-write", publisher: "crewai.com", from: "growth@crewai.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1124990d6345ac", title: "Can Microsoft Help Customers Cut Back on Claude?", link: "https://www.theinformation.com/articles/claude", published: "2026-10-06T17:36:12Z", summary: "Anthropic mega-customers Microsoft and Meta https://www.theinformation.com/articles/claude", publisher: "theinformation.com", from: "hello@theinformation.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a111f73929284cc", title: "Today's Signal: AWS governs agents, AI governance faces scrutiny", link: "https://techstronggroup.com/brief/aws", published: "2026-10-06T16:06:17Z", summary: "Techstrong Brief https://techstronggroup.com/brief/aws", publisher: "techstronggroup.com", from: "newsletters@techstronggroup.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a111c040bbfe878", title: "30 Free AI Automation Tools in 2026", link: "https://opinionai.substack.com/p/30-free", published: "2026-10-06T15:01:46Z", summary: "A zero-subscription guide https://opinionai.substack.com/p/30-free", publisher: "substack.com", from: "opinionai@substack.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a111859eebe9bfd", title: "AI Adoption Accelerates While Risk Ownership Remains Unclear", link: "https://www.infosecurity-magazine.com/ai-adoption", published: "2026-10-06T14:01:02Z", summary: "Infosecurity Magazine https://www.infosecurity-magazine.com/ai-adoption", publisher: "infosecurity-magazine.com", from: "info@comms.infosecurity-magazine.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a11166b51bda922", title: "Trump's new playbook", link: "https://www.axios.com/2026/10/06/ai", published: "2026-10-06T13:28:19Z", summary: "Axios AI+ By Ina Fried https://www.axios.com/2026/10/06/ai", publisher: "axios.com", from: "ai.plus@axios.com", source: "gmail-news" as const, qi: 15.4, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a11157dfe2b2177", title: "ChatGPT's New Ads Appear Alongside AI-Generated Images", link: "https://www.beehiiv.com/supercharged", published: "2026-10-06T13:05:57Z", summary: "Reflection AI Unveils Beam https://www.beehiiv.com/supercharged", publisher: "beehiiv.com", from: "supercharged@mail.beehiiv.com", source: "gmail-news" as const, qi: 7.7, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
