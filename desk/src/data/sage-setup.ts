/** PASS-C2 ?view=setup payload — written by ingest. LAZY chunk only (dynamic import); never First Load. */
import type { SageSetupView } from "@/lib/sage-setup";

export const SAGE_SETUP: SageSetupView = {
  "stamped_at": "2026-10-20T03:20:29Z",
  "config_path": "desk/config/sage-sources.json",
  "config_hash": "73282beec242",
  "status": "ok",
  "used": "committed",
  "errors": [],
  "since_commit": "3cb1b6d",
  "since_at": "2026-10-15T22:44:24Z",
  "sources": [
    {
      "id": "hn",
      "on": true,
      "caps": "cap 20",
      "last_rows": 51,
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
      "last_rows": 28,
      "state": "ok"
    },
    {
      "id": "gnews",
      "on": true,
      "caps": "cap 32",
      "last_rows": 28,
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
      "last_rows": 5,
      "state": "soft-fail"
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
      "last_rows": null,
      "state": "—"
    }
  ],
  "keywords": [
    {
      "id": "ai_terms",
      "terms": [
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
      ]
    },
    {
      "id": "hn_sweep",
      "terms": [
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
      ]
    },
    {
      "id": "gmail_seed",
      "terms": [
        "AI",
        "newsletter",
        "tech",
        "LLM",
        "intelligence",
        "hack",
        "security",
        "paper"
      ]
    },
    {
      "id": "politics_deny",
      "terms": [
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
      ]
    },
    {
      "id": "hn_title_queries",
      "terms": [
        "agent",
        "open weights",
        "prompt injection",
        "Qwen",
        "local model"
      ]
    }
  ],
  "taste": {
    "weight": 0,
    "max": 0.3
  }
};
