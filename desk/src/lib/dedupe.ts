/**
 * Cross-source Pulse dedupe (AUTONOMY-4H Beat 2).
 * Pure functions — no IO. Same story from HN + Google News + lab/security RSS
 * collapses into one cluster carrying sources[] badges.
 *
 * v2 merge rule (Beat 2 re-land): identical canonical URL, OR
 *   pairScore ≥ DEDUPE_THRESHOLD within a DEDUPE_WINDOW_HOURS published-time window, where
 *   pairScore = ½·IDF-weighted containment + ½·IDF-weighted Jaccard over normalized headline
 *   tokens (lowercase, punctuation/stopwords/publisher suffix stripped, light stem, money +
 *   versions kept) + a small bonus for shared company/product entities.
 * Guards: ≥2 shared content (non-entity, non-number) tokens unless one headline is fully
 *   contained in the other; conflicting product versions (GPT-6 vs GPT-5.6) never merge.
 *   This keeps "Gemini 3.8 Live Avatar" ≠ "Gemini 3.8 Live Extended Thinking".
 * Locks: GNews never sole-leads a multi-source cluster (lead prefers lab RSS > HN > security RSS > GNews).
 */

import { companyOf, isSelfRepost, type Company } from "./publisher-company";

export type PulseSource = "rss-lab" | "hn-algolia" | "rss-security" | "gnews-rss";

export type PulseInput = {
  id: string;
  source: PulseSource;
  title: string;
  url: string;
  at: string;
  publisher?: string;
  score?: number;
  first_seen?: string;
};

export type PulseMember = PulseInput & {
  canonical_url: string;
  /** GNews item published by the same company as the cluster's original post — counts 0 sources. */
  self_repost?: true;
};

export type PulseCluster = {
  id: string;
  title: string;
  url: string;
  canonical_url: string;
  lead_id: string;
  lead_source: PulseSource;
  /** Independent source classes (self-reposts excluded) — drives multi-source badges. */
  sources: PulseSource[];
  /** Every source class present, self-reposts included. */
  all_sources: PulseSource[];
  member_ids: string[];
  members: PulseMember[];
  size: number;
  at: string;
  first_seen?: string;
  is_new?: boolean;
  /** Strongest pair score that linked members (1 = same canonical URL; 0 = singleton). */
  score: number;
};

/** Tuned against real HN × lab RSS × GNews pairs (see __tests__/fixtures/dedupe-real-pairs.json). */
export const DEDUPE_THRESHOLD = 0.6;
/** Published-time window for title matches (hours). */
export const DEDUPE_WINDOW_HOURS = 24;
/** Near-identical headlines (score ≥ this) get 2× the window — blog publish vs HN post lag. */
export const DEDUPE_NEAR_IDENTICAL = 0.9;
/** Extra score required when either side lacks a parseable published time. */
export const DEDUPE_NO_TIME_PENALTY = 0.1;
/** Titles with fewer tokens than this only merge on canonical URL (avoid short-title false friends). */
export const MIN_TITLE_TOKENS = 3;

const LEAD_PRIORITY: Record<PulseSource, number> = {
  "rss-lab": 0,
  "hn-algolia": 1,
  "rss-security": 2,
  "gnews-rss": 3,
};

const TRACKING_PARAMS = new Set([
  "ref",
  "ref_src",
  "ref_url",
  "referrer",
  "source",
  "src",
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "oc",
  "cmp",
  "cmpid",
  "campaign",
  "s",
  "si",
  "amp",
  "output",
  "outputtype",
  "_ga",
  "_gl",
  "yclid",
  "twclid",
  "spm",
  "share",
  "smid",
  "sref",
  "guccounter",
  "guce_referrer",
  "guce_referrer_sig",
  "ncid",
  "mkt_tok",
  "_hsenc",
  "_hsmi",
  "vero_id",
  "sr_share",
  "cid",
  "icid",
  "ito",
  "taid",
  "trk",
  "feature",
  "rss",
]);

function isTrackingParam(key: string): boolean {
  const k = key.toLowerCase();
  return k.startsWith("utm_") || k.startsWith("hsa_") || k.startsWith("pk_") || TRACKING_PARAMS.has(k);
}

function b64urlDecode(s: string): string {
  try {
    const norm = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = norm + "===".slice((norm.length + 3) % 4);
    if (typeof atob === "function") return atob(pad);
    return Buffer.from(pad, "base64").toString("binary");
  } catch {
    return "";
  }
}

/**
 * Resolve a news.google.com/rss/articles/<blob> redirect offline when the blob
 * embeds the publisher URL (legacy CBMi… protobuf). Newer encrypted blobs return null.
 */
export function resolveGoogleNewsUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)news\.google\.com$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/\/(?:rss\/)?articles\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const raw = b64urlDecode(m[1]);
  const hit = raw.match(/https?:\/\/[\x21-\x7e]+/);
  if (!hit) return null;
  const cand = hit[0].replace(/[\x00-\x20"']+$/, "");
  try {
    const out = new URL(cand);
    if (/(^|\.)google\.com$/i.test(out.hostname)) return null;
    return out.toString();
  } catch {
    return null;
  }
}

/** Canonical URL: https, lower host, no www/m/amp prefix, no tracking params, no hash, no AMP path, no trailing slash. */
export function canonicalizeUrl(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  const resolved = resolveGoogleNewsUrl(raw) ?? raw;
  let u: URL;
  try {
    u = new URL(resolved);
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
  let host = u.hostname.toLowerCase().replace(/^(www\d*|m|mobile|amp)\./, "");
  if (host.endsWith(".cdn.ampproject.org")) {
    // https://example-com.cdn.ampproject.org/c/s/example.com/path
    const pm = u.pathname.match(/^\/[a-z]\/(?:s\/)?([^/]+)(\/.*)?$/i);
    if (pm) {
      host = pm[1].toLowerCase().replace(/^(www\d*|m|amp)\./, "");
      u = new URL(`https://${host}${pm[2] ?? "/"}${u.search}`);
    }
  }
  const keep: [string, string][] = [];
  u.searchParams.forEach((v, k) => {
    if (!isTrackingParam(k)) keep.push([k, v]);
  });
  keep.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  let path = u.pathname
    .replace(/\/amp\/?$/i, "")
    .replace(/\.amp(\.html)?$/i, "$1")
    .replace(/\/index\.html?$/i, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  if (!path) path = "";
  const qs = keep.length
    ? `?${keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`
    : "";
  return `https://${host}${path}${qs}`;
}

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "by", "at", "from",
  "is", "are", "was", "were", "be", "been", "as", "its", "it", "this", "that", "these", "those",
  "our", "your", "their", "his", "her", "we", "you", "they", "i", "he", "she", "us",
  "into", "over", "new", "how", "why", "what", "when", "who", "vs", "via", "after", "about",
  "has", "have", "had", "can", "could", "will", "would", "may", "might", "just", "now", "more",
  "most", "up", "out", "own", "but", "not", "no", "so", "than", "then", "there", "here", "all",
  "says", "say", "said", "report", "reports", "reportedly", "according", "announces", "announced",
  "introducing", "introduces", "unveils", "launches", "launched", "launch", "today", "hn", "show",
  "ask", "video", "pdf", "blog", "post", "news", "update", "hello", "meet",
]);

/**
 * Company / product entities (post-normalization tokens). Shared entities add a small bonus
 * and anchor version-conflict checks. Aliases fold tickers/brands onto one token.
 */
const ENTITY_ALIASES: Record<string, string> = {
  googl: "google",
  goog: "google",
  alphabet: "google",
  "google's": "google",
  msft: "microsoft",
  nvda: "nvidia",
  meta: "meta",
  facebook: "meta",
  chatgpt: "chatgpt",
  "x.ai": "xai",
  huggingface: "huggingface",
  hf: "huggingface",
};
export const ENTITIES = new Set([
  "openai", "anthropic", "google", "deepmind", "meta", "microsoft", "nvidia", "amd", "intel",
  "apple", "amazon", "aws", "mistral", "huggingface", "xai", "deepseek", "qwen", "alibaba",
  "akamai", "oracle", "ibm", "salesforce", "perplexity", "cohere", "baidu", "bytedance",
  "tencent", "samsung", "tesla", "zhipu", "moonshot", "cursor", "github",
  "gemini", "gemma", "claude", "opus", "sonnet", "haiku", "gpt", "chatgpt", "codex", "sora",
  "llama", "grok", "copilot", "nemotron", "glm", "kimi", "phi", "astra", "sol", "luna",
  "beam", "suncatcher", "veo", "imagen", "whisper", "dall", "o3", "o4",
]);
/** Entities whose immediate next numeric token is a model version (gpt 6, gemini 3.8, opus 5.5). */
const VERSIONED = new Set([
  "gemini", "gemma", "claude", "opus", "sonnet", "haiku", "gpt", "llama", "grok", "glm",
  "nemotron", "qwen", "deepseek", "kimi", "phi", "mistral", "veo", "imagen", "sora",
]);
/** Light synonym folding for deal-style headlines. */
const SYNONYMS: Record<string, string> = {
  agreement: "deal", pact: "deal", contract: "deal", partnership: "deal",
  ink: "sign", inks: "sign", signs: "sign", signed: "sign", strikes: "sign", strike: "sign",
  seals: "sign", seal: "sign", struck: "sign",
  acquires: "acquire", acquisition: "acquire", buys: "acquire", buy: "acquire",
  tts: "texttospeech",
};

/** Known outlet suffixes (when publisher field is missing / differs). */
const OUTLET_SUFFIX = /\s+[-–—|:]\s+(the verge|techcrunch|reuters|bloomberg|cnbc|the information|wired|ars technica|engadget|zdnet|venturebeat|axios|the guardian|financial times|ft|bbc( news)?|cnn|forbes|business insider|fortune|the new york times|nyt|wsj|the wall street journal|yahoo( finance)?|benzinga|barron's|marketwatch|the register|tom's hardware|9to5google|9to5mac|siliconangle|the decoder|mashable|gizmodo|slashdot|hacker news|medium|substack|youtube|x|twitter)\s*$/i;

const LEADING_LABEL = /^(exclusive|opinion|analysis|breaking|update|watch|live|explainer|commentary|breakingviews)\s*[|:–—-]\s*/i;

/**
 * Strip " - Publisher" / " | Publisher" suffixes (Google News style) — the `<source>` publisher,
 * a known outlet, or a trailing site-brand segment tied to the publisher
 * ("… | NVIDIA Technical Blog" from NVIDIA Developer, "… | Mars" from "Mars, Incorporated").
 * Also drops leading desk labels ("Exclusive | ", "Opinion | ").
 */
export function stripPublisherSuffix(title: string, publisher?: string): string {
  let t = (title || "").trim();
  const pub = (publisher || "").trim();
  if (pub) {
    const esc = pub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\s+[-–—|]\\s+${esc}\\s*$`, "i"), "");
  }
  t = t.replace(OUTLET_SUFFIX, "");
  const brand = t.match(/\s+[|｜–—]\s+([^|｜–—]{2,40})$/);
  if (brand) {
    const seg = brand[1]!.trim();
    const segL = seg.toLowerCase();
    const pubHead = pub.toLowerCase().split(/[\s,.]+/)[0] ?? "";
    const tied =
      seg.split(/\s+/).length <= 4 &&
      (/\bblog\b/i.test(seg) ||
        (pubHead.length >= 3 && (segL.startsWith(pubHead) || pub.toLowerCase().startsWith(segL))));
    if (tied) t = t.slice(0, brand.index).trimEnd();
  }
  t = t.replace(LEADING_LABEL, "");
  return t.trim();
}

function stem(tok: string): string {
  if (/\d/.test(tok) || tok.length <= 3) return tok;
  let t = tok;
  if (t.endsWith("ies") && t.length > 4) t = `${t.slice(0, -3)}y`;
  else if (t.endsWith("ing") && t.length > 5) t = t.slice(0, -3);
  else if (t.endsWith("ed") && t.length > 4) t = t.slice(0, -2);
  else if (t.endsWith("es") && t.length > 4 && /(ss|sh|ch|x|z)es$/.test(t)) t = t.slice(0, -2);
  else if (t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us") && !t.endsWith("is")) t = t.slice(0, -1);
  if (t.endsWith("e") && t.length > 4) t = t.slice(0, -1);
  return t;
}

/** Ordered normalized tokens (duplicates removed). Numbers/versions/money kept (12b, 3.8, 5.5). */
export function normalizeTitle(title: string, publisher?: string): string[] {
  const t = stripPublisherSuffix(title, publisher)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/hugging\s*face/g, "huggingface")
    .replace(/text[\s-]*to[\s-]*speech/g, "texttospeech")
    .replace(/open[\s-]*weights?/g, "openweight")
    .replace(/open[\s-]*source[sd]?/g, "opensource")
    .replace(/\$\s*/g, "")
    .replace(/(\d+(?:\.\d+)?)\s*(?:billion|bn)\b/g, "$1b")
    .replace(/(\d+(?:\.\d+)?)\s*(?:million|mn)\b/g, "$1m")
    .replace(/(\d+(?:\.\d+)?)\s*(?:trillion)\b/g, "$1t")
    .replace(/['’`]s\b/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(^|\s)\.+|\.+(\s|$)/g, " ");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of t.split(/\s+/)) {
    if (!raw || STOPWORDS.has(raw)) continue;
    let tok = ENTITY_ALIASES[raw] ?? SYNONYMS[raw] ?? raw;
    if (!ENTITIES.has(tok)) tok = SYNONYMS[stem(tok)] ?? stem(tok);
    if (!tok || STOPWORDS.has(tok)) continue;
    if (seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

export function jaccard(a: readonly string[], b: readonly string[]): number {
  if (!a.length && !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const isNumberTok = (t: string) => /\d/.test(t);

/** product → version map from ordered tokens ("gpt","6" → gpt:6). */
function versionsOf(tokens: readonly string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    if (VERSIONED.has(tokens[i]) && /^\d+(\.\d+)*$/.test(tokens[i + 1])) m.set(tokens[i], tokens[i + 1]);
  }
  return m;
}

export type PairScore = {
  score: number;
  jaccard: number;
  containment: number;
  shared: string[];
  shared_entities: string[];
  shared_content: number;
  blocked?: "version-conflict" | "thin-overlap" | "time-window" | "short-title";
  hours_apart: number | null;
};

export type TokenWeights = (tok: string) => number;

/**
 * Pair score over normalized tokens. weights = IDF over the batch (common tokens like "ai"
 * weigh less than "akamai"); defaults to uniform weight 1.
 */
export function scoreTokens(
  a: readonly string[],
  b: readonly string[],
  weights: TokenWeights = () => 1,
): PairScore {
  const A = new Set(a);
  const B = new Set(b);
  const shared = [...A].filter((x) => B.has(x));
  const w = (xs: Iterable<string>) => {
    let s = 0;
    for (const x of xs) s += weights(x);
    return s;
  };
  const wA = w(A);
  const wB = w(B);
  const wI = w(shared);
  const wU = wA + wB - wI;
  const jac = wU > 0 ? wI / wU : 0;
  const cont = Math.min(wA, wB) > 0 ? wI / Math.min(wA, wB) : 0;
  const shared_entities = shared.filter((x) => ENTITIES.has(x));
  const shared_content = shared.filter((x) => !ENTITIES.has(x) && !isNumberTok(x)).length;
  const bonus = Math.min(0.15, 0.05 * shared_entities.length);
  let score = 0.5 * cont + 0.5 * jac + (shared_content >= 1 ? bonus : 0);
  score = Math.min(1, score);
  const out: PairScore = {
    score: Number(score.toFixed(3)),
    jaccard: Number(jac.toFixed(3)),
    containment: Number(cont.toFixed(3)),
    shared,
    shared_entities,
    shared_content,
    hours_apart: null,
  };
  const va = versionsOf(a);
  const vb = versionsOf(b);
  for (const [prod, v] of va) {
    const other = vb.get(prod);
    if (other && other !== v) {
      out.blocked = "version-conflict";
      return out;
    }
  }
  const fullyContained = shared.length === Math.min(A.size, B.size);
  // Identical normalized headlines (e.g. "Introducing GPT-6 Sol and Luna" syndicated) are the same
  // item even when every token is an entity/version.
  const identical = A.size === B.size && shared.length === A.size && A.size >= MIN_TITLE_TOKENS;
  if (shared_content < 2 && !(fullyContained && shared_content >= 1) && !identical) out.blocked = "thin-overlap";
  return out;
}

export function titleSimilarity(a: string, b: string, pubA?: string, pubB?: string): number {
  const s = scoreTokens(normalizeTitle(a, pubA), normalizeTitle(b, pubB));
  return s.blocked ? Math.min(s.score, DEDUPE_THRESHOLD - 0.01) : s.score;
}

function parseAt(v: string | undefined): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) && t > 0 ? t : null;
}

/** Build IDF weights over a batch of token lists: log(1 + N/df). */
export function idfWeights(tokenLists: readonly (readonly string[])[]): TokenWeights {
  const df = new Map<string, number>();
  for (const toks of tokenLists) for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  const n = Math.max(1, tokenLists.length);
  return (tok) => Math.log(1 + n / (df.get(tok) ?? 1));
}

export type ScoreOpts = {
  threshold?: number;
  windowHours?: number;
  weights?: TokenWeights;
};

/** Full pair decision incl. time window + short-title guard. `match` = mergeable by title. */
export function scorePair(
  a: PulseInput,
  b: PulseInput,
  opts: ScoreOpts & { tokensA?: string[]; tokensB?: string[] } = {},
): PairScore & { match: boolean; need: number } {
  const threshold = opts.threshold ?? DEDUPE_THRESHOLD;
  const windowH = opts.windowHours ?? DEDUPE_WINDOW_HOURS;
  const ta = opts.tokensA ?? normalizeTitle(a.title, a.publisher);
  const tb = opts.tokensB ?? normalizeTitle(b.title, b.publisher);
  const s = scoreTokens(ta, tb, opts.weights);
  const tA = parseAt(a.at);
  const tB = parseAt(b.at);
  let need = threshold;
  if (tA !== null && tB !== null) {
    s.hours_apart = Number((Math.abs(tA - tB) / 3_600_000).toFixed(1));
    const win = s.score >= DEDUPE_NEAR_IDENTICAL ? windowH * 2 : windowH;
    if (s.hours_apart > win && !s.blocked) s.blocked = "time-window";
  } else {
    need = threshold + DEDUPE_NO_TIME_PENALTY;
  }
  if ((ta.length < MIN_TITLE_TOKENS || tb.length < MIN_TITLE_TOKENS) && !s.blocked) s.blocked = "short-title";
  return { ...s, need, match: !s.blocked && s.score >= need };
}

function pickLead(members: PulseMember[]): PulseMember {
  return [...members].sort((x, y) => {
    const p = LEAD_PRIORITY[x.source] - LEAD_PRIORITY[y.source];
    if (p !== 0) return p;
    const s = (y.score ?? 0) - (x.score ?? 0);
    if (s !== 0) return s;
    return (Date.parse(y.at) || 0) - (Date.parse(x.at) || 0);
  })[0];
}

function minIso(values: (string | undefined)[]): string | undefined {
  let best: string | undefined;
  let bestT = Infinity;
  for (const v of values) {
    if (!v) continue;
    const t = Date.parse(v);
    if (Number.isFinite(t) && t < bestT) {
      bestT = t;
      best = v;
    }
  }
  return best;
}

function maxIso(values: string[]): string {
  let best = values[0] ?? "";
  let bestT = -Infinity;
  for (const v of values) {
    const t = Date.parse(v);
    if (Number.isFinite(t) && t > bestT) {
      bestT = t;
      best = v;
    }
  }
  return best;
}

export type ScoredPair = PairScore & {
  match: boolean;
  need: number;
  a: { id: string; source: PulseSource; title: string; at: string };
  b: { id: string; source: PulseSource; title: string; at: string };
};

/** Diagnostics: top cross-source pairs by score (matches + near-misses). */
export function topCrossSourcePairs(
  items: readonly PulseInput[],
  opts: ScoreOpts & { limit?: number } = {},
): ScoredPair[] {
  const tokens = items.map((m) => normalizeTitle(m.title, m.publisher));
  const weights = opts.weights ?? idfWeights(tokens);
  const out: ScoredPair[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].source === items[j].source) continue;
      const s = scorePair(items[i], items[j], { ...opts, weights, tokensA: tokens[i], tokensB: tokens[j] });
      if (s.shared.length === 0) continue;
      const pick = (x: PulseInput) => ({ id: x.id, source: x.source, title: x.title, at: x.at });
      out.push({ ...s, a: pick(items[i]), b: pick(items[j]) });
    }
  }
  return out.sort((x, y) => y.score - x.score).slice(0, opts.limit ?? 20);
}

/**
 * Beat 5: pick GNews corroborators from a wider pool — pool items whose headline directly
 * matches (scorePair().match, same threshold/window/guards) a non-GNews anchor item.
 * Keeps ≤ perAnchor best-scoring corroborators per anchor. IDF is computed over anchors+pool.
 */
export function pickCorroborators(
  anchors: readonly PulseInput[],
  pool: readonly PulseInput[],
  opts: ScoreOpts & { perAnchor?: number; exclude?: ReadonlySet<string> } = {},
): { item: PulseInput; anchor_id: string; score: number; self_repost: boolean }[] {
  const perAnchor = opts.perAnchor ?? 3;
  const nonG = anchors.filter((a) => a.source !== "gnews-rss");
  const cands = pool.filter((p) => !opts.exclude?.has(p.id));
  const tokA = nonG.map((a) => normalizeTitle(a.title, a.publisher));
  const tokP = cands.map((p) => normalizeTitle(p.title, p.publisher));
  const weights = opts.weights ?? idfWeights([...anchors.map((a) => normalizeTitle(a.title, a.publisher)), ...tokP]);
  const byAnchor = new Map<string, { item: PulseInput; anchor_id: string; score: number }[]>();
  cands.forEach((p, j) => {
    let best: { anchor_id: string; score: number } | null = null;
    nonG.forEach((a, i) => {
      const s = scorePair(a, p, { ...opts, weights, tokensA: tokA[i], tokensB: tokP[j] });
      if (s.match && (!best || s.score > best.score)) best = { anchor_id: a.id, score: s.score };
    });
    if (best) {
      const b = best as { anchor_id: string; score: number };
      const list = byAnchor.get(b.anchor_id) ?? [];
      list.push({ item: p, anchor_id: b.anchor_id, score: b.score });
      byAnchor.set(b.anchor_id, list);
    }
  });
  const out: { item: PulseInput; anchor_id: string; score: number; self_repost: boolean }[] = [];
  const anchorById = new Map(nonG.map((a) => [a.id, a]));
  for (const list of byAnchor.values()) {
    list.sort((x, y) => y.score - x.score || (Date.parse(y.item.at) || 0) - (Date.parse(x.item.at) || 0));
    for (const c of list.slice(0, perAnchor)) {
      // Same company as the anchor (e.g. "… - NVIDIA Blog" for a blogs.nvidia.com post): still
      // attached as a member, but counts 0 corroborating sources.
      const ac = companyOf(anchorById.get(c.anchor_id) ?? {});
      out.push({ ...c, self_repost: ac !== null && isSelfRepost(c.item, new Set([ac])) });
    }
  }
  return out;
}

/**
 * Cluster Pulse items across sources. Deterministic: input order breaks ties.
 * Union-find over pairs (same canonical URL, or scorePair().match).
 */
export function clusterItems(
  items: readonly PulseInput[],
  opts: ScoreOpts & { stamp?: string } = {},
): PulseCluster[] {
  const members: PulseMember[] = items.map((it) => ({ ...it, canonical_url: canonicalizeUrl(it.url) }));
  const tokens = members.map((m) => normalizeTitle(m.title, m.publisher));
  const weights = opts.weights ?? idfWeights(tokens);
  const parent = members.map((_, i) => i);
  const edge = members.map(() => 0);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number, score: number) => {
    const ra = find(a);
    const rb = find(b);
    const best = Math.max(edge[ra], edge[rb], score);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
    edge[Math.min(ra, rb)] = best;
  };
  const byUrl = new Map<string, number>();
  members.forEach((m, i) => {
    if (!m.canonical_url) return;
    const prev = byUrl.get(m.canonical_url);
    if (prev === undefined) byUrl.set(m.canonical_url, i);
    else union(prev, i, 1);
  });
  for (let i = 0; i < members.length; i++) {
    if (tokens[i].length < MIN_TITLE_TOKENS) continue;
    for (let j = i + 1; j < members.length; j++) {
      if (tokens[j].length < MIN_TITLE_TOKENS) continue;
      const s = scorePair(members[i], members[j], { ...opts, weights, tokensA: tokens[i], tokensB: tokens[j] });
      if (s.match) union(i, j, s.score);
    }
  }
  const groups = new Map<number, PulseMember[]>();
  members.forEach((m, i) => {
    const r = find(i);
    const g = groups.get(r);
    if (g) g.push(m);
    else groups.set(r, [m]);
  });
  const clusters: PulseCluster[] = [];
  for (const [root, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const lead = pickLead(group);
    // Self-repost rule: a GNews member whose publisher is the same company as any non-GNews
    // member (the original post / its lab feed / the story an HN row links to) counts 0 sources.
    const origin = new Set(
      group.filter((g) => g.source !== "gnews-rss").map((g) => companyOf(g)).filter((c): c is Company => c !== null),
    );
    for (const g of group) {
      if (g.source === "gnews-rss" && origin.size && isSelfRepost(g, origin)) g.self_repost = true;
      else delete g.self_repost;
    }
    const bySrc = (a: PulseSource, b: PulseSource) => LEAD_PRIORITY[a] - LEAD_PRIORITY[b];
    const all_sources = [...new Set(group.map((g) => g.source))].sort(bySrc);
    const sources = [...new Set(group.filter((g) => !g.self_repost).map((g) => g.source))].sort(bySrc);
    const first_seen = minIso(group.map((g) => g.first_seen));
    clusters.push({
      id: `cl:${lead.id}`,
      title: stripPublisherSuffix(lead.title, lead.publisher),
      url: lead.url,
      canonical_url: lead.canonical_url,
      lead_id: lead.id,
      lead_source: lead.source,
      sources,
      all_sources,
      member_ids: group.map((g) => g.id),
      members: group,
      size: group.length,
      at: maxIso(group.map((g) => g.at)),
      score: group.length > 1 ? Number(edge[root].toFixed(3)) : 0,
      ...(first_seen ? { first_seen } : {}),
      ...(first_seen && opts.stamp ? { is_new: first_seen === opts.stamp } : {}),
    });
  }
  return clusters;
}

export function clusterStats(inCount: number, clusters: readonly PulseCluster[]) {
  const multi = clusters.filter((c) => c.sources.length > 1);
  return {
    /** Clusters with ≥2 INDEPENDENT source classes (self-reposts count 0). */
    multi_source_independent: multi.length,
    /** Clusters with ≥2 source classes counting self-reposts (pre-fix definition). */
    multi_source_raw: clusters.filter((c) => (c.all_sources ?? c.sources).length > 1).length,
    self_reposts: clusters.reduce((n, c) => n + c.members.filter((m) => m.self_repost).length, 0),
    items_in: inCount,
    clusters_out: clusters.length,
    collapsed: inCount - clusters.length,
    multi_source: multi.length,
    multi_member: clusters.filter((c) => c.size > 1).length,
  };
}
