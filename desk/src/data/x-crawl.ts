export type CrawlPost = {
  id: string;
  handle: string;
  name: string;
  text: string;
  take: string;
  href: string;
  at: string;
  likes: number;
  views: number;
  media?: string;
  tag: "lead-bond" | "companion" | "rest" | "rumor";
};

export const CRAWL_AT = "2026-09-05T18:41:56Z";

export const CRAWL: CrawlPost[] = [
  {
    id: "2095107971433017510",
    handle: "stanislavfort",
    name: "Stanislav Fort",
    text: "Codex Security and Mythos reported 0 remaining issues in curl. AISLE found 6 CVEs.",
    take: "6-to-0 on a hardened codebase. Agent scanners are not interchangeable.",
    href: "https://x.com/stanislavfort/status/2095107971433017510",
    at: "2026-09-02T11:14:00Z",
    likes: 261,
    views: 23182,
    media: "https://pbs.twimg.com/media/HRMrQGrW8AEsQnF.jpg",
    tag: "rest",
  },
  {
    id: "2095172426925801608",
    handle: "dair_ai",
    name: "DAIR.AI",
    text: "Harness-of-Harness: coding agents that keep building for days. +52% relative over standalone harnesses.",
    take: "Paper, not a production incident. File as research rest.",
    href: "https://x.com/dair_ai/status/2095172426925801608",
    at: "2026-09-02T15:30:07Z",
    likes: 342,
    views: 36614,
    media: "https://pbs.twimg.com/media/HROMN9EasAAMEyn.jpg",
    tag: "rest",
  },
  {
    id: "2095257682865532970",
    handle: "AndrewCurran_",
    name: "Andrew Curran",
    text: "Gemini 3.8 Flash and Muse Spark 1.3 today. Looks like Astra tomorrow morning.",
    take: "Wire calendar. 'Tomorrow morning' is rumor until OpenAI posts.",
    href: "https://x.com/AndrewCurran_/status/2095257682865532970",
    at: "2026-09-02T21:08:54Z",
    likes: 481,
    views: 28180,
    tag: "rumor",
  },
  {
    id: "2094958903167680875",
    handle: "AndrewCurran_",
    name: "Andrew Curran",
    text: "So this is how they did it. Astra recurrent depth.",
    take: "Quotes Palazzolo. Companion file, already bonded.",
    href: "https://x.com/AndrewCurran_/status/2094958903167680875",
    at: "2026-09-02T01:21:39Z",
    likes: 484,
    views: 42434,
    media: "https://pbs.twimg.com/media/HRLKBRvawAAjJv5.jpg",
    tag: "companion",
  },
  {
    id: "2094577944056430865",
    handle: "AnthropicAI",
    name: "Anthropic",
    text: "Training a Misaligned Reward Seeker. Opus-sized model on 80 hackable envs.",
    take: "Official lab paper. Same class as eval-swarm reward-hacking. Not HF.",
    href: "https://x.com/AnthropicAI/status/2094577944056430865",
    at: "2026-09-01T00:07:51Z",
    likes: 2813,
    views: 573165,
    tag: "rest",
  },
  {
    id: "2095305021000983027",
    handle: "AndrewCurran_",
    name: "Andrew Curran",
    text: "Grok Bot app live on Pixel / Play Store.",
    take: "Product ship. DENY as news lead.",
    href: "https://x.com/AndrewCurran_/status/2095305021000983027",
    at: "2026-09-03T00:17:00Z",
    likes: 119,
    views: 6490,
    tag: "rest",
  },
  {
    id: "2095330956823629995",
    handle: "dair_ai",
    name: "DAIR.AI",
    text: "Retrieved skills can lift the aggregate score and hurt the tasks they touch.",
    take: "Measurement paper. Useful for this desk's own skill directory.",
    href: "https://x.com/dair_ai/status/2095330956823629995",
    at: "2026-09-03T02:00:04Z",
    likes: 21,
    views: 3137,
    tag: "rest",
  },
];
