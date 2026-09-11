/** Snapshot of artifacts/sage/x-taste-last.json — X-session taste shelf. Pulse only; never Brief lead. */
export type XTasteItem = {
  id: string;
  text: string;
  url?: string;
  handle?: string;
  surface: "bookmark" | "like" | "feed";
  at?: string;
  keyword?: string;
};

export type XTasteSnap = {
  captured_at: string;
  stamped_at?: string;
  briefEligible: false;
  pulseLeadEligible: false;
  paidApi: false;
  items: XTasteItem[];
  skipped: boolean;
  soft_fail: boolean;
  soft_fail_reason: string | null;
  land: string;
  counts: { seen: number; kept: number };
};

export const X_TASTE: XTasteSnap = {
  "captured_at": "2026-09-11T09:32:00Z",
  "briefEligible": false,
  "pulseLeadEligible": false,
  "paidApi": false,
  "items": [
    {
      "id": "2097935359384719537",
      "text": "Another brilliant paper from Meta. An autonomous agent runs the ML iteration cycle across a portfolio of production ads ranking models.",
      "surface": "bookmark",
      "url": "https://x.com/dair_ai/status/2097935359384719537",
      "handle": "dair_ai"
    },
    {
      "id": "2097755424007373270",
      "text": "A paper on memory for long-horizon agents, exploring knowledge graphs and implications for self-evolving agents.",
      "surface": "bookmark",
      "url": "https://x.com/omarsar0/status/2097755424007373270",
      "handle": "omarsar0"
    },
    {
      "id": "2097067454883328053",
      "text": "Benchmark paper on coding agents: Claude Opus 5 under Claude Code passes 23.9% of evaluations; an expert human reference scores 82.2%.",
      "surface": "bookmark",
      "url": "https://x.com/dair_ai/status/2097067454883328053",
      "handle": "dair_ai"
    },
    {
      "id": "2097930608790167907",
      "text": "Introducing DeepSeek-V4.1-Flash: a smaller model family with native visual understanding, higher throughput, and scaling to larger models.",
      "surface": "like",
      "url": "https://x.com/deepseek_ai/status/2097930608790167907",
      "handle": "deepseek_ai"
    },
    {
      "id": "2097726992565035341",
      "text": "BridgeBench test of DeepSeek V4.1 Flash: 344 toks/sec, 23.5M tokens, 99.7% cache hit rate, and $0.33 cost.",
      "surface": "like",
      "url": "https://x.com/bridgemindai/status/2097726992565035341",
      "handle": "bridgemindai"
    },
    {
      "id": "2098233826816205275",
      "text": "Fugu Max and Fugu Ultra v2: a multi-agent orchestration system focused on the capability/cost Pareto frontier.",
      "surface": "feed",
      "url": "https://x.com/SakanaAILabs/status/2098233826816205275",
      "handle": "SakanaAILabs"
    },
    {
      "id": "2097996926876795197",
      "text": "AuK, an open-source foundation model for unified speech generation and editing with zero-shot TTS and instruction-controlled generation.",
      "surface": "feed",
      "url": "https://x.com/TencentHunyuan/status/2097996926876795197",
      "handle": "TencentHunyuan"
    },
    {
      "id": "2097192907023458473",
      "text": "GPT-6 Astra has shown surprising capability but inconsistency; Fable 5.1 generally does what the user asks.",
      "surface": "feed",
      "url": "https://x.com/theo/status/2097192907023458473",
      "handle": "theo"
    }
  ],
  "skipped": false,
  "soft_fail": false,
  "soft_fail_reason": null,
  "land": "GO",
  "counts": {
    "seen": 51,
    "kept": 8
  },
  "stamped_at": "2026-09-11T09:32:00Z"
} as const;
