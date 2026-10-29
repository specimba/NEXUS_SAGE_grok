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

export const GMAIL_NEWS_AT = "2026-10-29T17:46:15Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a188b72538777f1", title: "Latest Updates: OpenAI turns to Google AI chips, what if AI model development stopped now, Aera maps a path to scale decision intelligence", link: "", published: "2026-10-29T17:31:05Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1886ef593f2e8b", title: "Oct. 29 - AI model infrastructure at risk | Big banks tout AI security plans", link: "", published: "2026-10-29T16:10:51Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18857b5970a7cf", title: "⚖️ Anthropic Claude for Legal: 6 ready-to-run workflows ship", link: "", published: "2026-10-29T15:46:51Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1882d297367c0a", title: "Oct. 29 - How AI Could Kill Off Cybersecurity Pros’ Skills | In-the-Wild Attack Abuses Agents’ Trust in Markdown", link: "", published: "2026-10-29T15:00:20Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a188599574b891c", title: "👤 Canberk, add Süha Kağan Köse", link: "", published: "2026-10-29T15:48:54Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18853c66fac8e1", title: "NIST Privacy-Preserving Federated Learning (PPFL) Testbed Enables Hands-On Privacy Experimentation", link: "", published: "2026-10-29T15:42:34Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18888280dd15ee", title: "Promptus Weekly — AI horror film, 3D generation & local LoRA training", link: "", published: "2026-10-29T15:39:19Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18850439e59c55", title: "Built to Secure Data Before AI Knew to Ask", link: "", published: "2026-10-29T15:38:39Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1884f14975ccbf", title: "Today's Signal: Anthropic buys into drug discovery, GitHub scales agents, OpenAI brings Dot to texts", link: "", published: "2026-10-29T15:37:17Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1884022ac7c31c", title: "Top 100 Real FDE Interview Questions and Answers from Big Tech (2026)", link: "", published: "2026-10-29T15:20:33Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1882f7ccdb2147", title: "⚡🔋New York just made it illegal for AI chatbots to pretend they love your children. The punishment could include shutting them down entirely.", link: "", published: "2026-10-29T15:02:55Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18822d002cc69f", title: "New AI model: mistral-large-4-0-8, mistral-large-4-0-8-fp4", link: "", published: "2026-10-29T14:49:04Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18820f0288b560", title: "Attack-Test Your Infrastructure Before Someone Else Does", link: "", published: "2026-10-29T14:46:51Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a1881f17947c29a", title: "Why Most Finance AI Pilots Stall Out", link: "", published: "2026-10-29T14:45:00Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a18813c64c733f4", title: "Mistral Large 4 1t A52b is out", link: "", published: "2026-10-29T14:32:38Z", summary: "via gmail", publisher: "gmail", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
