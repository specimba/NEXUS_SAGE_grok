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

export const GMAIL_NEWS_AT = "2026-10-27T17:49:36Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a17e47eb164e4d5", title: "I’m Selling My First AI Skill. It Builds Classroom Arcade Games.", link: "https://mail.google.com/mail/#all/1a17e47eb164e4d5", published: "2026-10-27T16:53:16Z", summary: "via substack.com", publisher: "substack.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17de35318bb662", title: "New AI model: mai-cyber-1-1-flash", link: "https://mail.google.com/mail/#all/1a17de35318bb662", published: "2026-10-27T15:03:31Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e66e21c4898e", title: "Nvidia says AI agents can understand your data without a migration", link: "https://mail.google.com/mail/#all/1a17e66e21c4898e", published: "2026-10-27T17:27:13Z", summary: "via venturebeat.com", publisher: "venturebeat.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e52a44a55aa5", title: "Transition to Post-Quantum Cryptography, Microchip Frequency Combs", link: "https://mail.google.com/mail/#all/1a17e52a44a55aa5", published: "2026-10-27T17:05:07Z", summary: "via nist.gov", publisher: "nist.gov", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e40f51826943", title: "Oct. 27 - PHP exploits break through | Rural hospitals get cyber assist", link: "https://mail.google.com/mail/#all/1a17e40f51826943", published: "2026-10-27T16:45:18Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e29c0a55b9f6", title: "New AI model: minicpm-ocr-jev, openbmb/minicpm-ocr-jev", link: "https://mail.google.com/mail/#all/1a17e29c0a55b9f6", published: "2026-10-27T16:20:27Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e294ac6467d9", title: "New AI model: minicpm-ocr-1.0, openbmb/minicpm-ocr-1.0", link: "https://mail.google.com/mail/#all/1a17e294ac6467d9", published: "2026-10-27T16:19:57Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e17e2e5d49a9", title: "Oct. 27 - AI safety worries infiltrate midterms | AI agents disrupt 77% of firms", link: "https://mail.google.com/mail/#all/1a17e17e2e5d49a9", published: "2026-10-27T16:00:41Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17dfe43a40906a", title: "Today's Signal: Oracle anchors AI trust, Gheist steals secrets, Akamai opens model access", link: "https://mail.google.com/mail/#all/1a17dfe43a40906a", published: "2026-10-27T15:32:55Z", summary: "via techstronggroup.com", publisher: "techstronggroup.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17dfd9a51bdbe7", title: "Your identity security was built for humans. Now what?", link: "https://mail.google.com/mail/#all/1a17dfd9a51bdbe7", published: "2026-10-27T15:32:12Z", summary: "via simplelogin.co", publisher: "simplelogin.co", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17de18101e6c39", title: "⚡🔋An AI accessed US election data without being told to. Nine days before the midterms, officials are arguing over whether it broke any rules.", link: "https://mail.google.com/mail/#all/1a17de18101e6c39", published: "2026-10-27T15:01:32Z", summary: "via beehiiv.com", publisher: "beehiiv.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e501e4d52c88", title: "Final call for submissions - Nebius x NVIDIA Global AI Hackathon", link: "https://mail.google.com/mail/#all/1a17e501e4d52c88", published: "2026-10-27T17:02:19Z", summary: "via devpost.com", publisher: "devpost.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17e196b6388bd0", title: "Final stretch — here's your submission checklist ⏰ - Nebius x NVIDIA Global AI Hackathon", link: "https://mail.google.com/mail/#all/1a17e196b6388bd0", published: "2026-10-27T16:02:36Z", summary: "via devpost.com", publisher: "devpost.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
];
