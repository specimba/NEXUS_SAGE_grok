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

export const GMAIL_NEWS_AT = "2026-10-27T12:44:30Z";

export const GMAIL_NEWS: GmailNewsRow[] = [
  { id: "gmail:1a17d4b7607995dc", title: "Unpatched Tailscale SSH Flaws, Gheist GitHub Attacks, Critical Wasmtime Flaws, and More", link: "https://mail.google.com/mail/#all/1a17d4b7607995dc", published: "2026-10-27T12:04:11Z", summary: "via nl00.net", publisher: "nl00.net", source: "gmail-news" as const, qi: 51, priority: "P1" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d1249e9e0573", title: "Nvidia Invests $3 Billion in Meta in Deeper AI Partnership", link: "https://mail.google.com/mail/#all/1a17d1249e9e0573", published: "2026-10-27T11:15:09Z", summary: "via theinformation.com", publisher: "theinformation.com", source: "gmail-news" as const, qi: 34, priority: "P2" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d45dc4ab48d6", title: "New AI model: qwen-audio-3.1-realtime-flash", link: "https://mail.google.com/mail/#all/1a17d45dc4ab48d6", published: "2026-10-27T12:11:32Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d414b6206c44", title: "Monitor changes detected: Agentic and AI Security News", link: "https://mail.google.com/mail/#all/1a15d121869e2a68", published: "2026-10-27T12:06:33Z", summary: "via firecrawl.dev", publisher: "firecrawl.dev", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "incident" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d3d5ee87ba33", title: "Oct. 27 - Cisco updates partner program | The FCC’s channel inquisition", link: "https://mail.google.com/mail/#all/1a17d3d5ee87ba33", published: "2026-10-27T12:01:48Z", summary: "via divenewsletter.com", publisher: "divenewsletter.com", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d33ca16eac6d", title: "New AI model: zwz2-4b, inclusionai/zwz2-4b", link: "https://mail.google.com/mail/#all/1a17d33ca16eac6d", published: "2026-10-27T11:51:48Z", summary: "via ssh.codes", publisher: "ssh.codes", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17cb09455fbbc4", title: "Takara TLDR: October 27, 2026", link: "https://mail.google.com/mail/#all/1a17cb09455fbbc4", published: "2026-10-27T09:28:29Z", summary: "via takara.ai", publisher: "takara.ai", source: "gmail-news" as const, qi: 17, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d55b53f38087", title: "NEW BLOG | Design Tenets for Agent Identity Management Systems", link: "https://mail.google.com/mail/#all/1a17d55b53f38087", published: "2026-10-27T12:28:50Z", summary: "via nist.gov", publisher: "nist.gov", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d311ff550376", title: "AI/ML Engineer at TalentHop", link: "https://mail.google.com/mail/#all/1a17d311ff550376", published: "2026-10-27T11:48:53Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17d153700e5811", title: "Ling-3.1-flash-1019 is out", link: "https://mail.google.com/mail/#all/1a17d153700e5811", published: "2026-10-27T11:18:23Z", summary: "via lunarwerx.com", publisher: "lunarwerx.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17cb6210573a9b", title: "Building Governed AI Workflows with BMC Control-M and AWS", link: "https://mail.google.com/mail/#all/1a17cb6210573a9b", published: "2026-10-27T09:34:32Z", summary: "via devops.com", publisher: "devops.com", source: "gmail-news" as const, qi: 8.5, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
  { id: "gmail:1a17cc345525c820", title: "Lumos Software Engineer, AI Agent Governance", link: "https://mail.google.com/mail/#all/1a17cc345525c820", published: "2026-10-27T09:48:54Z", summary: "via linkedin.com", publisher: "linkedin.com", source: "gmail-news" as const, qi: 4.3, priority: "P3" as const, tag: "rest" as const, briefEligible: false as const, pulse_only: true as const },
];
