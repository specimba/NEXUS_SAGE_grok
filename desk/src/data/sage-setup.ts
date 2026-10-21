/** PASS-C2/C3 ?view=setup payload — written by ingest + scripts/desk-view.ts. LAZY chunk only (dynamic import); never First Load. */
import type { SageSetupView } from "@/lib/sage-setup";

/** Code defaults — referenced below wherever the same values repeat. */
const D: NonNullable<SageSetupView["limits"]>["defaults"] = {
  "schema": 1,
  "sources": {
    "hn": {
      "on": true,
      "cap": 20
    },
    "hf_papers": {
      "on": true,
      "cap": 24
    },
    "lab_rss": {
      "on": true,
      "cap_per_feed": 12,
      "timeout_s": 10,
      "feeds": [
        "openai",
        "deepmind",
        "google-ai",
        "huggingface",
        "mistral",
        "nvidia",
        "nvidia-dev",
        "ms-research",
        "google-research"
      ]
    },
    "sec_rss": {
      "on": true,
      "cap_per_feed": 12,
      "feeds": [
        "trailofbits",
        "fox-it",
        "projectzero",
        "embracethered"
      ]
    },
    "gnews": {
      "on": true,
      "cap": 32
    },
    "github": {
      "on": true,
      "cap": 5
    },
    "openalex": {
      "on": true
    },
    "crossref": {
      "on": true
    },
    "arxiv": {
      "on": true
    },
    "wikidata": {
      "on": true
    },
    "gmail": {
      "on": true,
      "fetch_cap": 24,
      "emit_cap": 12,
      "window_days": 14
    },
    "x_taste": {
      "on": true,
      "visible_cap": 6
    },
    "analyst_rss": {
      "on": true,
      "cap_per_feed": 6,
      "timeout_s": 10,
      "feeds": [
        "simonw",
        "latent-space"
      ]
    },
    "releases_atom": {
      "on": true,
      "cap_per_feed": 2,
      "feeds": [
        "llama.cpp",
        "ollama",
        "vllm"
      ]
    }
  },
  "keywords": {
    "ai_terms": [
      "ai",
      "ais",
      "agi",
      "small models?",
      "vector (db|database)s?",
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "ml",
      "neural",
      "transformers?",
      "agents?",
      "agentic",
      "inference",
      "embeddings?",
      "fine-?tun\\w*",
      "rag",
      "diffusion",
      "multimodal",
      "text-to-speech",
      "tts",
      "speech-to-text",
      "stt",
      "prompts?",
      "evals?",
      "alignment",
      "reasoning models?",
      "quantiz\\w*",
      "quants?",
      "gguf",
      "llama\\.cpp",
      "open[- ]weights?",
      "foundation models?",
      "frontier models?",
      "language models?",
      "chatbots?",
      "copilot",
      "vibe cod\\w*",
      "mcp",
      "generative",
      "(video|image|text|code|music|speech|3d) generation",
      "computer vision",
      "reinforcement learning",
      "robot(ics|s)?",
      "humanoids?",
      "(transfer|federated|contrastive|representation|few-shot|zero-shot|in-context|self-supervised|multi-task) learning",
      "tool[- ]use",
      "graphrag",
      "swe-\\w+",
      "earth-2"
    ],
    "hn_sweep": [
      "OpenAI",
      "Anthropic",
      "Claude",
      "Gemini",
      "Google",
      "DeepMind",
      "Nvidia",
      "Mistral",
      "Hugging Face",
      "GPT"
    ],
    "gmail_seed": [
      "AI",
      "newsletter",
      "tech",
      "LLM",
      "intelligence",
      "hack",
      "security",
      "paper"
    ],
    "politics_deny": [
      "trump",
      "maga",
      "biden",
      "harris",
      "vance",
      "democrat(?:s|ic)?",
      "republicans?",
      "gop",
      "dnc",
      "rnc",
      "partisan"
    ],
    "hn_title_queries": [
      "agent",
      "open weights",
      "prompt injection",
      "Qwen",
      "local model"
    ],
    "gmail_senders": [
      "hello@newsletters.venturebeat.com",
      "takaramono@tldr.takara.ai"
    ]
  },
  "taste": {
    "weight": 0,
    "max": 0.3
  }
};

export const SAGE_SETUP: SageSetupView = {
  "stamped_at": "2026-10-21T13:21:09Z",
  "config_path": "desk/config/sage-sources.json",
  "config_hash": "e3e9003a7d92",
  "status": "ok",
  "used": "committed",
  "errors": [],
  "since_commit": "8dbb554",
  "since_at": "2026-10-20T07:13:37Z",
  "sources": [
    {
      "id": "hn",
      "on": true,
      "caps": "cap 20",
      "last_rows": 63,
      "state": "ok"
    },
    {
      "id": "hf_papers",
      "on": true,
      "caps": "cap 24",
      "last_rows": 50,
      "state": "ok"
    },
    {
      "id": "lab_rss",
      "on": true,
      "caps": "cap_per_feed 12 · timeout_s 10 · feeds 9",
      "last_rows": 106,
      "state": "ok"
    },
    {
      "id": "sec_rss",
      "on": true,
      "caps": "cap_per_feed 12 · feeds 4",
      "last_rows": 40,
      "state": "ok"
    },
    {
      "id": "gnews",
      "on": true,
      "caps": "cap 32",
      "last_rows": 30,
      "state": "ok"
    },
    {
      "id": "github",
      "on": true,
      "caps": "cap 5",
      "last_rows": 3,
      "state": "ok"
    },
    {
      "id": "openalex",
      "on": true,
      "caps": "—",
      "last_rows": 4,
      "state": "ok"
    },
    {
      "id": "crossref",
      "on": true,
      "caps": "—",
      "last_rows": 1,
      "state": "ok"
    },
    {
      "id": "arxiv",
      "on": true,
      "caps": "—",
      "last_rows": 29,
      "state": "ok"
    },
    {
      "id": "wikidata",
      "on": true,
      "caps": "—",
      "last_rows": 3,
      "state": "ok"
    },
    {
      "id": "gmail",
      "on": true,
      "caps": "fetch_cap 24 · emit_cap 12 · window_days 14",
      "last_rows": null,
      "state": "box-only"
    },
    {
      "id": "x_taste",
      "on": true,
      "caps": "visible_cap 6",
      "last_rows": null,
      "state": "box-only"
    },
    {
      "id": "analyst_rss",
      "on": true,
      "caps": "cap_per_feed 6 · timeout_s 10 · feeds 2",
      "last_rows": 8,
      "state": "ok"
    },
    {
      "id": "releases_atom",
      "on": true,
      "caps": "cap_per_feed 2 · feeds 3",
      "last_rows": 0,
      "state": "ok"
    }
  ],
  "keywords": [
    {
      "id": "ai_terms",
      "terms": D.keywords.ai_terms
    },
    {
      "id": "hn_sweep",
      "terms": D.keywords.hn_sweep
    },
    {
      "id": "gmail_seed",
      "terms": D.keywords.gmail_seed
    },
    {
      "id": "politics_deny",
      "terms": D.keywords.politics_deny
    },
    {
      "id": "hn_title_queries",
      "terms": D.keywords.hn_title_queries
    },
    {
      "id": "gmail_senders",
      "terms": D.keywords.gmail_senders
    }
  ],
  "taste": {
    "weight": 0,
    "max": 0.3
  },
  "limits": {
    "schema": 1,
    "source_ids": [
      "hn",
      "hf_papers",
      "lab_rss",
      "sec_rss",
      "gnews",
      "github",
      "openalex",
      "crossref",
      "arxiv",
      "wikidata",
      "gmail",
      "x_taste",
      "analyst_rss",
      "releases_atom"
    ],
    "defaults": D,
    "ceilings": {
      "hn": {
        "cap": 40
      },
      "hf_papers": {
        "cap": 48
      },
      "lab_rss": {
        "cap_per_feed": 24,
        "timeout_s": 15
      },
      "sec_rss": {
        "cap_per_feed": 24
      },
      "gnews": {
        "cap": 64
      },
      "github": {
        "cap": 10
      },
      "openalex": {},
      "crossref": {},
      "arxiv": {},
      "wikidata": {},
      "gmail": {
        "fetch_cap": 48,
        "emit_cap": 24,
        "window_days": 28
      },
      "x_taste": {
        "visible_cap": 12
      },
      "analyst_rss": {
        "cap_per_feed": 12,
        "timeout_s": 15
      },
      "releases_atom": {
        "cap_per_feed": 4
      }
    },
    "feeds": {
      "lab_rss": D.sources.lab_rss.feeds,
      "sec_rss": D.sources.sec_rss.feeds,
      "analyst_rss": D.sources.analyst_rss.feeds,
      "releases_atom": [
        "llama.cpp",
        "ollama",
        "vllm",
        "claude-code"
      ]
    },
    "keyword_lists": [
      "ai_terms",
      "hn_sweep",
      "gmail_seed",
      "politics_deny",
      "hn_title_queries",
      "gmail_senders"
    ],
    "regex_lists": {
      "ai_terms": {
        "head": "(?<!\\w)a\\.i\\.(?!\\w)|\\b\\d+(\\.\\d+)?b[- ]param\\w*|\\b(",
        "tail": ")\\b|(llm|vlm|gpt)s?\\b|gpt-"
      },
      "politics_deny": {
        "head": "\\b(?:",
        "tail": ")\\b"
      }
    },
    "baseline": {
      "ai_terms": D.keywords.ai_terms,
      "politics_deny": D.keywords.politics_deny
    },
    "keyword_list_max": 200,
    "keyword_len_max": 120,
    "taste_max": 0.3,
    "box_only": [
      "gmail",
      "x_taste"
    ],
    "empty_means_off": [
      "hn_title_queries",
      "gmail_senders"
    ],
    "list_rules": {
      "hn_title_queries": {
        "kind": "plain",
        "max": 8,
        "len_max": 40,
        "bad_chars": "[\\\\^$*?()[\\]{}|]",
        "incident": [
          "artifactory",
          "production rce",
          "hf swarm",
          "cluster-admin",
          "eval board",
          "persistent-sol",
          "metr wave"
        ],
        "ban": [
          "sol",
          "astra",
          "persistent sol",
          "hf breach",
          "jailbreak",
          "bluesky"
        ]
      },
      "gmail_senders": {
        "kind": "address",
        "max": 20,
        "pattern": "^[a-z0-9._%+-]+@[a-z0-9-]+(?:\\.[a-z0-9-]+)+$"
      }
    }
  },
  "config": D,
  "file_hash": "9e8aa501e4fa88fcfe52ecaf9180829f25788f0f9f9e1f9c89adc81f13b777c0"
};
