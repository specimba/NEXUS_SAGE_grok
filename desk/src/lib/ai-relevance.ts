/**
 * Shared AI-relevance gate (Beat 5 HN gate, widened to general-company lab feeds + GNews).
 * A row must carry an AI/ML term or a lab/model name in its title, or (when allowed) come from
 * an AI-lab domain. Generic company names alone (Google/Apple/Nvidia/Meta/Microsoft) never qualify —
 * e.g. a Steve Jobs iPhone 4 Antennagate Q&A or an NVIDIA "… Launches on GeForce NOW" game post.
 */

export const AI_TERMS =
  /(?<!\w)a\.i\.(?!\w)|\b\d+(\.\d+)?b[- ]param\w*|\b(ai|ais|agi|small models?|vector (db|database)s?|artificial intelligence|machine learning|deep learning|ml|neural|transformers?|agents?|agentic|inference|embeddings?|fine-?tun\w*|rag|diffusion|multimodal|text-to-speech|tts|speech-to-text|stt|prompts?|evals?|alignment|reasoning models?|quantiz\w*|quants?|gguf|llama\.cpp|open[- ]weights?|foundation models?|frontier models?|language models?|chatbots?|copilot|vibe cod\w*|mcp|generative|(video|image|text|code|music|speech|3d) generation|computer vision|reinforcement learning|robot(ics|s)?|humanoids?|(transfer|federated|contrastive|representation|few-shot|zero-shot|in-context|self-supervised|multi-task) learning|tool[- ]use|graphrag|swe-\w+|earth-2)\b|(llm|vlm|gpt)s?\b|gpt-/i;

export const AI_NAMES =
  /\b(openai|anthropic|deepmind|hugging ?face|mistral|deepseek|qwen|claude|gemini|gemma|llama|grok|xai|chatgpt|codex|sora|nemotron|glm|kimi|opus|sonnet|haiku|perplexity|cohere|metr|midjourney|stability ai|whisper|jev|cursor|ollama|vllm|pytorch|tensorflow|jax|nano banana|cuda|tensorrt)\b/i;

export const AI_DOMAINS = [
  "openai.com",
  "anthropic.com",
  "claude.dev",
  "claude.ai",
  "deepmind.google",
  "deepmind.com",
  "huggingface.co",
  "mistral.ai",
  "x.ai",
  "ai.meta.com",
  "ai.google",
  "ai.google.dev",
  "research.google",
  "artificialanalysis.ai",
  "developer.nvidia.com",
  "research.nvidia.com",
] as const;

/** Title-only check — used for general-company feeds and GNews (whose URL is news.google.com). */
export function isAiRelevantTitle(title: string): boolean {
  const t = String(title ?? "");
  return AI_TERMS.test(t) || AI_NAMES.test(t);
}

/** Title, or AI-lab domain / blog.google AI path. */
export function isAiRelevant(title: string, url?: string | null): boolean {
  if (isAiRelevantTitle(title)) return true;
  try {
    const u = new URL(String(url ?? ""));
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (AI_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true;
    if (host === "blog.google" && /innovation-and-ai|\/ai\/|models-and-research/i.test(u.pathname)) return true;
  } catch {
    /* no url */
  }
  return false;
}

/**
 * Lab feeds whose every post is AI (OpenAI / DeepMind / Google AI blog / HF / Mistral) pass untouched.
 * General-company feeds (NVIDIA blog incl. GeForce NOW, NVIDIA dev, MS Research, Google Research)
 * must pass the title gate — their own domain does not count.
 */
export const AI_ONLY_LAB_FEEDS = new Set(["openai", "anthropic", "deepmind", "google-ai", "huggingface", "mistral"]);

export function isLabItemAiRelevant(lab: string, title: string): boolean {
  return AI_ONLY_LAB_FEEDS.has(lab) || isAiRelevantTitle(title);
}

export function partitionAiRelevant<T>(items: readonly T[], keep: (it: T) => boolean): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const it of items) (keep(it) ? kept : dropped).push(it);
  return { kept, dropped };
}
