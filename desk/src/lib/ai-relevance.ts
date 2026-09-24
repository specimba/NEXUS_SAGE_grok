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
 * Lab RSS relevance (Director, after 04a31d5): first-party research-lab feeds are AI by
 * default — no title check (OpenAI, Anthropic, DeepMind, Google AI, MS Research, Google
 * Research, HF, Mistral, …). Only NVIDIA's company-wide feeds (blogs.nvidia.com, developer
 * blog) are filtered, by feed <category> / link path — never by title:
 *  · GeForce NOW (category or /geforce-now path) → always out (weekly cloud-gaming game drops)
 *  · other consumer categories/paths (Gaming, Cloud Gaming, GeForce, RTX Kit, /gaming, /geforce)
 *    → out unless the post also carries an AI / data-center / research category
 * The title-based AI gate stays only for HN and Google News.
 */
export const CATEGORY_FILTERED_LAB_FEEDS = new Set(["nvidia", "nvidia-dev"]);

const NV_GFN_CATEGORY = /^geforce now$/i;
const NV_GFN_PATH = /\/(blog\/)?(geforce-now|gfn)[-/]/i;
const NV_CONSUMER_CATEGORY = /^(gaming|cloud gaming|geforce|geforce now|rtx kit|rtx remix|game development|esports)$/i;
const NV_CONSUMER_PATH = /\/(gaming|geforce|game-ready|rtx-remix)([-/]|$)/i;
const NV_AI_CATEGORY =
  /\bai\b|artificial intelligence|generative|agentic|llms?\b|vlms?\b|inference|training|deep learning|machine learning|data (center|science)|research|robotics|physical ai|hpc|scientific computing|nemotron|nemo|cuda|tensorrt|dynamo|ai factory|ai infrastructure/i;

export type LabRelevanceInput = { lab: string; link?: string | null; categories?: readonly string[] | null };

/** Reason string when an NVIDIA post is dropped, null when kept. */
export function labItemDropReason(it: LabRelevanceInput): string | null {
  if (!CATEGORY_FILTERED_LAB_FEEDS.has(it.lab)) return null;
  const cats = (it.categories ?? []).map((c) => c.trim()).filter(Boolean);
  let path = "";
  try {
    path = new URL(String(it.link ?? "")).pathname;
  } catch {
    /* no link */
  }
  const gfnCat = cats.find((c) => NV_GFN_CATEGORY.test(c));
  if (gfnCat) return `category:${gfnCat}`;
  if (NV_GFN_PATH.test(path)) return `path:${path}`;
  const consumerCat = cats.find((c) => NV_CONSUMER_CATEGORY.test(c));
  const consumerPath = NV_CONSUMER_PATH.test(path) ? path : null;
  if (!consumerCat && !consumerPath) return null;
  if (cats.some((c) => NV_AI_CATEGORY.test(c))) return null;
  return consumerCat ? `category:${consumerCat}` : `path:${consumerPath}`;
}

export function isLabItemRelevant(it: LabRelevanceInput): boolean {
  return labItemDropReason(it) === null;
}

export function partitionAiRelevant<T>(items: readonly T[], keep: (it: T) => boolean): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const it of items) (keep(it) ? kept : dropped).push(it);
  return { kept, dropped };
}
