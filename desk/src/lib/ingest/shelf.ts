/**
 * Score URL lists the 02 Sep curation style:
 * toolkit / scanner / OWASP / GitHub agent-eval links → shelf only (never Brief).
 * No Zapier classify.
 */

export type UrlLane = "shelf" | "pulse" | "rest" | "drop";

export type ScoredUrl = {
  href: string;
  lane: UrlLane;
  reason: string;
};

const TOOLKIT_HOST_RE =
  /(?:^|\.)(?:owasp\.org|cheatsheetseries\.owasp\.org)$/i;

/** Non-GitHub toolkit path tokens (kept tight — do not match blog "/auditing-agent-…"). */
const TOOLKIT_PATH_RE =
  /(?:owasp|modsecurity|caido|cspbypass|activescan|active-scan|crs|virtual[-_]?patch|automated-threats)/i;

/**
 * GitHub-only shelf tokens for unauth search discovery (WIRE-GITHUB-SHELF).
 * Includes agent/eval/harness/llm/toolkit — scoped to github.com so lab RSS Pulse stays Pulse.
 */
const GITHUB_SHELF_PATH_RE =
  /(?:owasp|modsecurity|caido|cspbypass|activescan|active-scan|crs|virtual[-_]?patch|automated-threats|agentic|agents?|eval|harness|llmops|\bllm\b|red[-_]?team|sandbox|toolkit|auditor|governance)/i;

const PULSE_HOST_RE = /(?:^|\.)(?:x\.com|twitter\.com|t\.co)$/i;

const ARXIV_HOST_RE = /(?:^|\.)arxiv\.org$/i;

/** News-adjacent (CVE writeups etc.) — rest/digest, still not auto-Brief. */
const REST_RE = /aisle\.com|cve|zero-day|zeroday/i;

export function classifyUrl(href: string): ScoredUrl {
  let host = "";
  let path = href;
  try {
    const u = new URL(href);
    host = u.hostname.replace(/^www\./, "");
    path = `${u.pathname}${u.search}`;
  } catch {
    /* keep raw */
  }

  if (PULSE_HOST_RE.test(host) || /(?:^|\/\/)(?:x\.com|twitter\.com)\//i.test(href)) {
    return { href, lane: "pulse", reason: "x-status" };
  }

  // GitHub agent/eval/OWASP toolkits → shelf (search discovery + curation)
  if (/github\.com/i.test(host) && GITHUB_SHELF_PATH_RE.test(path)) {
    return { href, lane: "shelf", reason: "toolkit-github" };
  }

  if (TOOLKIT_HOST_RE.test(host) || TOOLKIT_PATH_RE.test(path) || TOOLKIT_PATH_RE.test(href)) {
    return { href, lane: "shelf", reason: "toolkit" };
  }

  // arXiv search hits — shelfOnly, never Brief
  if (ARXIV_HOST_RE.test(host) && /\/(?:abs|pdf)\//i.test(path)) {
    return { href, lane: "shelf", reason: "arxiv-shelf" };
  }

  if (REST_RE.test(href)) {
    return { href, lane: "rest", reason: "cve-wire" };
  }

  return { href, lane: "drop", reason: "unscored" };
}

/**
 * Score a newline/URL list. Toolkit never returns lane "brief".
 * Callers must keep shelf off Brief pins.
 */
export function scoreUrlList(urls: string[]): {
  shelf: ScoredUrl[];
  pulse: ScoredUrl[];
  rest: ScoredUrl[];
  dropped: ScoredUrl[];
} {
  const shelf: ScoredUrl[] = [];
  const pulse: ScoredUrl[] = [];
  const rest: ScoredUrl[] = [];
  const dropped: ScoredUrl[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    const href = raw.trim();
    if (!href || href.startsWith("#")) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const scored = classifyUrl(href);
    if (scored.lane === "shelf") shelf.push(scored);
    else if (scored.lane === "pulse") pulse.push(scored);
    else if (scored.lane === "rest") rest.push(scored);
    else dropped.push(scored);
  }

  return { shelf, pulse, rest, dropped };
}

/** Hard gate used by tests / compiler — toolkit must never be Brief-eligible. */
export function isBriefEligible(href: string): boolean {
  return classifyUrl(href).lane !== "shelf" && classifyUrl(href).lane !== "drop";
}
