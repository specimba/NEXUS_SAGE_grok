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

export const HN_PULSE_AT = "2026-09-23T07:08:38Z";

export const HN_PULSE: HnPulseRow[] = [
  { id: "hn:48979269", text: "China’s open-weights AI strategy is winning", url: "https://werd.io/american-ai-is-locked-down-and-proprietary-its-losing/", source: "hn-algolia" as const, score: 1243, at: "2026-07-20T14:21:47Z", author: "benwerd", tag: "rest" as const },
  { id: "hn:48924912", text: "Inkling: Our Open-Weights Model", url: "https://thinkingmachines.ai/news/introducing-inkling/", source: "hn-algolia" as const, score: 1227, at: "2026-07-15T18:12:45Z", author: "vimarsh6739", tag: "rest" as const },
  { id: "hn:49076057", text: "Our position on open-weights models", url: "https://www.anthropic.com/news/position-open-weights-models", source: "hn-algolia" as const, score: 1180, at: "2026-07-27T22:03:49Z", author: "surprisetalk", tag: "rest" as const },
  { id: "hn:49023016", text: "Startup founders urge U.S. government not to shut off Chinese open weight AI", url: "https://www.politico.com/news/2026/07/22/startup-founders-urge-trump-not-to-shut-off-chinese-open-weight-ai-01008992", source: "hn-algolia" as const, score: 1069, at: "2026-07-23T15:18:40Z", author: "theanonymousone", tag: "rest" as const },
  { id: "hn:49201970", text: "AMD acquires Taalas to boost inference performance by etching models in silicon", url: "https://www.theregister.com/systems/2026/08/06/amd-acquires-ai-chip-startup-taalas-to-boost-inference-performance-by-etching-models-into-silicon/5284344", source: "hn-algolia" as const, score: 949, at: "2026-08-06T20:23:11Z", author: "itvision", tag: "rest" as const },
  { id: "hn:48567759", text: "GLM-5.2 is the new leading open weights model on Artificial Analysis", url: "https://artificialanalysis.ai/articles/glm-5-2-is-the-new-leading-open-weights-model-on-the-artificial-analysis-intelligence-index", source: "hn-algolia" as const, score: 916, at: "2026-06-17T09:12:00Z", author: "himata4113", tag: "rest" as const },
  { id: "hn:49479878", text: "GLM-5.3 is now open-weight", url: "https://huggingface.co/zai-org/GLM-5.3", source: "hn-algolia" as const, score: 806, at: "2026-08-28T15:20:13Z", author: "jeudesprits", tag: "rest" as const },
  { id: "hn:48696585", text: "DSpark: Speculative decoding accelerates LLM inference [pdf]", url: "https://github.com/deepseek-ai/DeepSpec/blob/main/DSpark_paper.pdf", source: "hn-algolia" as const, score: 797, at: "2026-06-27T09:18:52Z", author: "aurenvale", tag: "rest" as const },
  { id: "hn:36838051", text: "Llama2.c: Inference llama 2 in one file of pure C", url: "https://github.com/karpathy/llama2.c", source: "hn-algolia" as const, score: 707, at: "2023-07-23T18:13:54Z", author: "anjneymidha", tag: "rest" as const },
  { id: "hn:48024540", text: "Accelerating Gemma 4: faster inference with multi-token prediction drafters", url: "https://blog.google/innovation-and-ai/technology/developers-tools/multi-token-prediction-gemma-4/", source: "hn-algolia" as const, score: 687, at: "2026-05-05T16:14:17Z", author: "amrrs", tag: "rest" as const },
  { id: "hn:49035303", text: "Nvidia, Microsoft, Meta warn against overregulating open-weight models", url: "https://www.cnbc.com/2026/07/24/nvidia-microsoft-meta-open-weight-ai-models.html", source: "hn-algolia" as const, score: 659, at: "2026-07-24T13:32:30Z", author: "louiereederson", tag: "rest" as const },
  { id: "hn:43754124", text: "Show HN: Dia, an open-weights TTS model for generating realistic dialogue", url: "https://github.com/nari-labs/dia", source: "hn-algolia" as const, score: 652, at: "2025-04-21T17:07:07Z", author: "toebee", tag: "rest" as const },
  { id: "hn:35198998", text: "ViperGPT: Visual Inference via Python Execution for Reasoning", url: "https://viper.cs.columbia.edu/", source: "hn-algolia" as const, score: 565, at: "2023-03-17T16:10:32Z", author: "kordlessagain", tag: "rest" as const },
  { id: "hn:43682088", text: "The path to open-sourcing the DeepSeek inference engine", url: "https://github.com/deepseek-ai/open-infra-index/tree/main/OpenSourcing_DeepSeek_Inference_Engine", source: "hn-algolia" as const, score: 550, at: "2025-04-14T15:03:10Z", author: "Palmik", tag: "rest" as const },
  { id: "hn:43167373", text: "DeepSeek open source DeepEP – library for MoE training and Inference", url: "https://github.com/deepseek-ai/DeepEP", source: "hn-algolia" as const, score: 536, at: "2025-02-25T02:27:29Z", author: "helloericsf", tag: "rest" as const },
  { id: "hn:46713106", text: "Show HN: Sweep, Open-weights 1.5B model for next-edit autocomplete", url: "https://huggingface.co/sweepai/sweep-next-edit-1.5B", source: "hn-algolia" as const, score: 534, at: "2026-01-21T23:22:40Z", author: "williamzeng0", tag: "rest" as const },
  { id: "hn:45050415", text: "Are OpenAI and Anthropic losing money on inference?", url: "https://martinalderson.com/posts/are-openai-and-anthropic-really-losing-money-on-inference/", source: "hn-algolia" as const, score: 515, at: "2025-08-28T10:15:22Z", author: "martinald", tag: "rest" as const },
  { id: "hn:47788542", text: "Darkbloom – Private inference on idle Macs", url: "https://darkbloom.dev", source: "hn-algolia" as const, score: 501, at: "2026-04-16T04:06:39Z", author: "twapi", tag: "rest" as const },
  { id: "hn:48050751", text: "DeepSeek 4 Flash local inference engine for Metal", url: "https://github.com/antirez/ds4", source: "hn-algolia" as const, score: 499, at: "2026-05-07T15:40:24Z", author: "tamnd", tag: "rest" as const },
  { id: "hn:49026810", text: "Show HN: Echo – Fable-level results at 1/3 the cost using open-weight models", url: "https://news.ycombinator.com/item?id=49026810", source: "hn-algolia" as const, score: 484, at: "2026-07-23T19:26:01Z", author: "adam_rida", tag: "rest" as const },
  { id: "hn:22322293", text: "Ask HN: I want to join the war for online privacy", url: "https://news.ycombinator.com/item?id=22322293", source: "hn-algolia" as const, score: 7, at: "2020-02-13T23:07:05Z", author: "khnov", tag: "rest" as const },
  { id: "hn:47608224", text: "MetaLLM – Metasploit-inspired AI/ML security testing framework", url: "https://github.com/scthornton/MetaLLM", source: "hn-algolia" as const, score: 2, at: "2026-04-01T23:54:48Z", author: "perfecXion", tag: "rest" as const },
  { id: "hn:47416204", text: "Stop training your security ML on labeled attack data", url: "https://www.securesql.info/2025/04/03/energy-based-models-anomaly-detection/", source: "hn-algolia" as const, score: 2, at: "2026-03-17T18:12:37Z", author: "projectnexus", tag: "rest" as const },
  { id: "hn:24560271", text: "Microsoft ML security evasion competition – bypassing models by signing binaries", url: "https://embracethered.com/blog/posts/2020/microsoft-machine-learning-security-evasion-competition/", source: "hn-algolia" as const, score: 2, at: "2020-09-22T21:41:32Z", author: "wunderwuzzi23", tag: "rest" as const },
  { id: "hn:15478264", text: "IoT: Impacts of AI/ML, Security and Dominating Markets", url: "https://semiengineering.com/whats-next-for-the-iot/", source: "hn-algolia" as const, score: 2, at: "2017-10-15T18:07:12Z", author: "SemiTom", tag: "rest" as const },
  { id: "hn:46147666", text: "AI/ML Security Resources?", url: "https://news.ycombinator.com/item?id=46147666", source: "hn-algolia" as const, score: 1, at: "2025-12-04T13:54:30Z", author: "nidme25", tag: "rest" as const },
  { id: "hn:35843398", text: "Meetup: How Does Conductor Power ML and Security Infrastructure", url: "https://www.meetup.com/netflix-open-source-platform/events/292902450/", source: "hn-algolia" as const, score: 1, at: "2023-05-06T17:21:15Z", author: "opiniateddev", tag: "rest" as const },
  { id: "hn:26638458", text: "Arm Announces Armv9 Architecture with Performance, ML and Security Boosts", url: "https://hothardware.com/news/arm-announced-armv9-architecture-to-boost-performance-ml-and-security", source: "hn-algolia" as const, score: 1, at: "2021-03-30T18:33:08Z", author: "rbanffy", tag: "rest" as const },
  { id: "hn:23773401", text: "Reverse engineering 3D-printed parts by ML reveals security vulnerabilities", url: "https://engineering.nyu.edu/news/reverse-engineering-3d-printed-parts-machine-learning-reveals-security-vulnerabilities", source: "hn-algolia" as const, score: 1, at: "2020-07-08T19:31:12Z", author: "rbanffy", tag: "rest" as const },
  { id: "hn:4718820", text: "Bank Of Montreal Online Security (securitybasics ml)", url: "http://seclists.org/basics/2012/Oct/68", source: "hn-algolia" as const, score: 1, at: "2012-10-30T18:48:07Z", author: "ari_elle", tag: "rest" as const },
];
