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
    ],
    "watch_terms": []
  },
  "taste": {
    "weight": 0,
    "max": 0.3
  }
};

export const SAGE_SETUP: SageSetupView = {
  "stamped_at": "2026-10-23T18:20:31Z",
  "config_path": "desk/config/sage-sources.json",
  "config_hash": "51f61811180e",
  "status": "ok",
  "used": "committed",
  "errors": [],
  "since_commit": "266aaf3",
  "since_at": "2026-10-23T17:01:49Z",
  "sources": [
    {
      "id": "hn",
      "on": true,
      "caps": "cap 20",
      "last_rows": 75,
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
      "last_rows": 105,
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
      "last_rows": 49,
      "state": "ok"
    },
    {
      "id": "github",
      "on": true,
      "caps": "cap 5",
      "last_rows": 2,
      "state": "ok"
    },
    {
      "id": "openalex",
      "on": true,
      "caps": "—",
      "last_rows": 3,
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
      "last_rows": 6,
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
    },
    {
      "id": "watch_terms",
      "terms": [
        "Grok",
        "xAI",
        "OpenAI",
        "Anthropic",
        "Claude",
        "Gemini",
        "DeepSeek",
        "Qwen",
        "Llama",
        "open-weights",
        "agent",
        "MCP",
        "CVE",
        "zero-day",
        "jailbreak",
        "prompt injection"
      ]
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
      "gmail_senders",
      "watch_terms"
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
      "gmail_senders",
      "watch_terms"
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
      },
      "watch_terms": {
        "kind": "watch",
        "max": 20
      }
    }
  },
  "config": {
    "schema": 1,
    "sources": D.sources,
    "keywords": {
      "ai_terms": D.keywords.ai_terms,
      "hn_sweep": D.keywords.hn_sweep,
      "gmail_seed": D.keywords.gmail_seed,
      "politics_deny": D.keywords.politics_deny,
      "hn_title_queries": D.keywords.hn_title_queries,
      "gmail_senders": D.keywords.gmail_senders,
      "watch_terms": [
        "Grok",
        "xAI",
        "OpenAI",
        "Anthropic",
        "Claude",
        "Gemini",
        "DeepSeek",
        "Qwen",
        "Llama",
        "open-weights",
        "agent",
        "MCP",
        "CVE",
        "zero-day",
        "jailbreak",
        "prompt injection"
      ]
    },
    "taste": {
      "weight": 0,
      "max": 0.3
    }
  },
  "file_hash": "cd38121c2b7e23f6bb278be30263ab8eb5aa28782138cadf33718fb2f741bbed"
};
