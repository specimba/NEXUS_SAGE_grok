/**
 * Publisher / domain / X-handle → company map, shared by dedupe (cluster independent-source
 * counting, `self_repost` member flag) and corroboration (Beat 4 SRC chips / rank).
 *
 * Rule: a source whose company is the same as the original post's company is a self-repost
 * and counts as 0 independent sources (e.g. Google News surfacing "… - NVIDIA Blog" for
 * NVIDIA's own blogs.nvidia.com post). Independent outlets (TechCrunch, Al Jazeera, …) are
 * not in this map and always count.
 */

export type Company =
  | "nvidia"
  | "google"
  | "openai"
  | "anthropic"
  | "huggingface"
  | "microsoft"
  | "meta"
  | "mistral"
  | "xai"
  | "apple"
  | "amazon"
  | "aisle";

/** Host suffix → company. `google` covers DeepMind / Google Research / Google AI blog. */
export const DOMAIN_COMPANY: ReadonlyArray<readonly [string, Company]> = [
  ["nvidia.com", "nvidia"],
  ["deepmind.google", "google"],
  ["deepmind.com", "google"],
  ["blog.google", "google"],
  ["research.google", "google"],
  ["ai.google", "google"],
  ["ai.google.dev", "google"],
  ["googleblog.com", "google"],
  ["openai.com", "openai"],
  ["anthropic.com", "anthropic"],
  ["claude.ai", "anthropic"],
  ["claude.com", "anthropic"],
  ["huggingface.co", "huggingface"],
  ["microsoft.com", "microsoft"],
  ["ai.meta.com", "meta"],
  ["about.fb.com", "meta"],
  ["mistral.ai", "mistral"],
  ["x.ai", "xai"],
  ["machinelearning.apple.com", "apple"],
  ["apple.com", "apple"],
  ["aboutamazon.com", "amazon"],
  ["amazon.science", "amazon"],
  ["aisle.com", "aisle"],
];

/**
 * Google News `<source>` publisher names (exact brand names, not "mentions"). Anchored so
 * "NVIDIA Technical Blog - NVIDIA Developer" matches but "Nvidia stock news" never does.
 */
export const PUBLISHER_COMPANY: ReadonlyArray<readonly [RegExp, Company]> = [
  [/^nvidia(\s+(blog|technical blog|developer|newsroom|news|investor relations|corporation))*(\s*[-|–]\s*nvidia.*)?$/i, "nvidia"],
  [/^(google\s*)?deepmind$/i, "google"],
  [/^(the keyword|google( (blog|research|ai|developers blog|cloud blog))?)$/i, "google"],
  [/^openai$/i, "openai"],
  [/^anthropic$/i, "anthropic"],
  [/^hugging ?face$/i, "huggingface"],
  [/^microsoft( (research|blog|news|source|azure blog))?$/i, "microsoft"],
  [/^(meta|meta ai|meta newsroom)$/i, "meta"],
  [/^mistral( ai)?$/i, "mistral"],
  [/^xai$/i, "xai"],
  [/^apple( machine learning research| newsroom)?$/i, "apple"],
  [/^aisle$/i, "aisle"],
];

/**
 * Official / founder X handles (lower-case, no @). Founder rows are judgment calls kept to
 * people whose public role is the company (e.g. Stanislav Fort — AISLE founder / chief scientist).
 */
export const X_HANDLE_COMPANY: Readonly<Record<string, Company>> = {
  nvidia: "nvidia",
  nvidiaai: "nvidia",
  nvidiadc: "nvidia",
  googledeepmind: "google",
  googleai: "google",
  googleresearch: "google",
  openai: "openai",
  openaidevs: "openai",
  anthropicai: "anthropic",
  claudeai: "anthropic",
  huggingface: "huggingface",
  msftresearch: "microsoft",
  aiatmeta: "meta",
  mistralai: "mistral",
  xai: "xai",
  stanislavfort: "aisle",
};

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function companyOfUrl(url: string | null | undefined): Company | null {
  const host = hostOf(String(url ?? ""));
  if (!host) return null;
  if (host === "x.com" || host === "twitter.com") {
    const handle = new URL(String(url)).pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    return (handle && X_HANDLE_COMPANY[handle]) || null;
  }
  for (const [d, c] of DOMAIN_COMPANY) if (host === d || host.endsWith(`.${d}`)) return c;
  return null;
}

export function companyOfPublisher(publisher: string | null | undefined): Company | null {
  const p = String(publisher ?? "").trim();
  if (!p) return null;
  for (const [re, c] of PUBLISHER_COMPANY) if (re.test(p)) return c;
  // a bare domain as publisher ("blogs.nvidia.com")
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(p)) return companyOfUrl(`https://${p}`);
  return null;
}

/**
 * Company of a crawl item. Google News links are news.google.com redirects, so the
 * `<source>` publisher decides; otherwise the URL host decides, falling back to publisher
 * only for GNews (lab RSS `publisher` is a feed id, never a brand).
 */
export function companyOf(it: { url?: string | null; publisher?: string | null; source?: string }): Company | null {
  const host = hostOf(String(it.url ?? ""));
  const isGnews = it.source === "gnews-rss" || host === "news.google.com";
  if (isGnews) return companyOfPublisher(it.publisher) ?? (host && host !== "news.google.com" ? companyOfUrl(it.url) : null);
  return companyOfUrl(it.url);
}

/** True when `it` is published by the same company as the original post (counts as 0 sources). */
export function isSelfRepost(
  it: { url?: string | null; publisher?: string | null; source?: string },
  originCompanies: ReadonlySet<Company | string>,
): boolean {
  const c = companyOf(it);
  return c !== null && originCompanies.has(c);
}
