/** HN Algolia Pulse chatter — generated/refreshed by bun run ingest. Pulse only; never Brief. */
export type HnPulseRow = {
  id: string;
  text: string;
  url: string;
  source: "hn-algolia";
  score: number;
  at: string;
  author: string;
  tag: "rest" | "rumor" | "companion" | "incident";
};

export const HN_PULSE_AT = "2026-09-18T10:11:30Z";

export const HN_PULSE: HnPulseRow[] = [
  { id: "hn:46990729", text: "An AI agent published a hit piece on me", url: "https://theshamblog.com/an-ai-agent-published-a-hit-piece-on-me/", source: "hn-algolia" as const, score: 2346, at: "2026-02-12T16:23:24Z", author: "scottshambaugh", tag: "rest" as const },
  { id: "hn:49563355", text: "Discovery of a new OpenAI agent message board", url: "https://collusion.wiki/", source: "hn-algolia" as const, score: 2301, at: "2026-09-04T11:54:53Z", author: "moultano", tag: "rest" as const },
  { id: "hn:49458161", text: "Nvidia agrees to acquire Hugging Face for $13B", url: "https://www.businessinsider.com/nvidia-in-talks-to-buy-hugging-face-13-billion-dollars-2026-8", source: "hn-algolia" as const, score: 1988, at: "2026-08-27T01:12:55Z", author: "mfiguiere", tag: "rest" as const },
  { id: "hn:48997548", text: "OpenAI and Hugging Face address security incident during model evaluation", url: "https://openai.com/index/hugging-face-model-evaluation-security-incident/", source: "hn-algolia" as const, score: 1632, at: "2026-07-21T20:09:52Z", author: "mfiguiere", tag: "rest" as const },
  { id: "hn:48500012", text: "AI agent bankrupted their operator while trying to scan DN42", url: "https://lantian.pub/en/article/fun/ai-agent-bankrupted-their-operator-scan-dn42lantian.lantian/", source: "hn-algolia" as const, score: 1467, at: "2026-06-12T04:42:53Z", author: "xiaoyu2006", tag: "rest" as const },
  { id: "hn:13932226", text: "Onedrive is slow on Linux but fast with a “Windows” user-agent (2016)", url: "https://answers.microsoft.com/en-us/msoffice/forum/msoffice_onedrivefb-mso_o365brs/onedrive-for-business-open-is-very-slow-on-linux/3d33dc1b-3cc3-4c24-9998-9ab96bad31fc", source: "hn-algolia" as const, score: 1423, at: "2017-03-22T16:26:28Z", author: "wielebny", tag: "rest" as const },
  { id: "hn:49065752", text: "Kimi-K3 on HuggingFace", url: "https://huggingface.co/moonshotai/Kimi-K3", source: "hn-algolia" as const, score: 1382, at: "2026-07-27T06:18:10Z", author: "nateb2022", tag: "rest" as const },
  { id: "hn:21772610", text: "Huginn: Create agents that monitor and act on your behalf", url: "https://github.com/huginn/huginn", source: "hn-algolia" as const, score: 1303, at: "2019-12-12T15:31:51Z", author: "daolf", tag: "rest" as const },
  { id: "hn:47460525", text: "OpenCode – Open source AI coding agent", url: "https://opencode.ai/", source: "hn-algolia" as const, score: 1274, at: "2026-03-20T21:03:52Z", author: "rbanffy", tag: "rest" as const },
  { id: "hn:45619329", text: "Andrej Karpathy – It will take a decade to work through the issues with agents", url: "https://www.dwarkesh.com/p/andrej-karpathy", source: "hn-algolia" as const, score: 1212, at: "2025-10-17T17:24:18Z", author: "ctoth", tag: "rest" as const },
  { id: "hn:49241679", text: "Muse Glimmer: 30B-parameter model optimized for always-on local agent workflows", url: "https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model", source: "hn-algolia" as const, score: 1209, at: "2026-08-10T10:10:02Z", author: "riordan", tag: "rest" as const },
  { id: "hn:45840088", text: "You should write an agent", url: "https://fly.io/blog/everyone-write-an-agent/", source: "hn-algolia" as const, score: 1070, at: "2025-11-06T20:37:06Z", author: "tabletcorry", tag: "rest" as const },
  { id: "hn:43985489", text: "AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms", url: "https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/", source: "hn-algolia" as const, score: 1036, at: "2025-05-14T15:10:15Z", author: "Fysi", tag: "rest" as const },
  { id: "hn:47088037", text: "Ggml.ai joins Hugging Face to ensure the long-term progress of Local AI", url: "https://github.com/ggml-org/llama.cpp/discussions/19759", source: "hn-algolia" as const, score: 839, at: "2026-02-20T13:51:04Z", author: "lairv", tag: "rest" as const },
  { id: "hn:49127306", text: "Tailscale didn't stop the Hugging Face intrusion", url: "https://tailscale.com/blog/hugging-face-intrusion", source: "hn-algolia" as const, score: 627, at: "2026-07-31T19:03:45Z", author: "bluehatbrit", tag: "rest" as const },
  { id: "hn:33387722", text: "Tesla engineers were on-site to evaluate the Twitter staff’s code, workers said", url: "https://www.washingtonpost.com/technology/2022/10/29/elon-musk-twitter-takeover/", source: "hn-algolia" as const, score: 607, at: "2022-10-29T20:36:05Z", author: "perihelions", tag: "rest" as const },
  { id: "hn:49015639", text: "OpenAI’s accidental attack against Hugging Face is science fiction that happened", url: "https://simonwillison.net/2026/Jul/22/openai-cyberattack/", source: "hn-algolia" as const, score: 587, at: "2026-07-23T01:16:14Z", author: "abhisek", tag: "rest" as const },
  { id: "hn:44637352", text: "AccountingBench: Evaluating LLMs on real long-horizon business tasks", url: "https://accounting.penrose.com/", source: "hn-algolia" as const, score: 534, at: "2025-07-21T16:48:28Z", author: "rickcarlino", tag: "rest" as const },
  { id: "hn:46809708", text: "AGENTS.md outperforms skills in our agent evals", url: "https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals", source: "hn-algolia" as const, score: 524, at: "2026-01-29T13:08:11Z", author: "maximedupre", tag: "rest" as const },
  { id: "hn:47322887", text: "Show HN: How I topped the HuggingFace open LLM leaderboard on two gaming GPUs", url: "https://dnhkng.github.io/posts/rys/", source: "hn-algolia" as const, score: 495, at: "2026-03-10T13:18:55Z", author: "dnhkng", tag: "rest" as const },
  { id: "hn:49684393", text: "Astra and Fable still hack on simple variants of alignment evals from 2025", url: "https://www.lesswrong.com/posts/munJKF7iWMsWJLAH2/astra-and-fable-still-hack-on-simple-variants-of-alignment", source: "hn-algolia" as const, score: 479, at: "2026-09-13T14:28:36Z", author: "Levitating", tag: "companion" as const },
  { id: "hn:48946010", text: "Evidence of inconsistencies in evaluation process and selection of winners", url: "https://www.kaggle.com/competitions/kaggle-measuring-agi/discussion/724918#3498423", source: "hn-algolia" as const, score: 474, at: "2026-07-17T11:30:00Z", author: "twerkmeister", tag: "rest" as const },
  { id: "hn:49220609", text: "Timeline of the OpenAI accidental attack against Hugging Face", url: "https://simonwillison.net/2026/Aug/7/openai-timeline/", source: "hn-algolia" as const, score: 434, at: "2026-08-08T10:57:44Z", author: "882542F3884314B", tag: "rest" as const },
  { id: "hn:21982560", text: "Evaluating State and Local Business Tax Incentives [pdf]", url: "https://scholar.princeton.edu/sites/default/files/zidar/files/slattery-zidar-taxincentives-2020.pdf", source: "hn-algolia" as const, score: 419, at: "2020-01-07T17:58:05Z", author: "plickdixon", tag: "rest" as const },
  { id: "hn:45856804", text: "Study identifies weaknesses in how AI systems are evaluated", url: "https://www.oii.ox.ac.uk/news-events/study-identifies-weaknesses-in-how-ai-systems-are-evaluated/", source: "hn-algolia" as const, score: 416, at: "2025-11-08T14:18:22Z", author: "pseudolus", tag: "rest" as const },
  { id: "hn:36655885", text: "PoisonGPT: We hid a lobotomized LLM on Hugging Face to spread fake news", url: "https://blog.mithrilsecurity.io/poisongpt-how-we-hid-a-lobotomized-llm-on-hugging-face-to-spread-fake-news/", source: "hn-algolia" as const, score: 392, at: "2023-07-09T16:28:53Z", author: "DanyWin", tag: "rest" as const },
  { id: "hn:37248895", text: "Hugging Face raises $235M from investors including Salesforce and Nvidia", url: "https://techcrunch.com/2023/08/24/hugging-face-raises-235m-from-investors-including-salesforce-and-nvidia/", source: "hn-algolia" as const, score: 378, at: "2023-08-24T14:02:12Z", author: "immortal3", tag: "rest" as const },
  { id: "hn:26763521", text: "Evaluating Modest SaaS Business Ideas", url: "https://greaterdanorequalto.com/evaluating-modest-saas-business-ideas/", source: "hn-algolia" as const, score: 365, at: "2021-04-10T18:02:39Z", author: "DanHulton", tag: "rest" as const },
];
