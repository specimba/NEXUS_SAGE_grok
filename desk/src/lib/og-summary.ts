/**
 * Desk bug B: HN / GNews / release members carry no summary, so their open Pulse card was metadata only.
 * (1) desk-view borrows a cluster mate's real summary (lead has none); (2) the crawl reads the linked article's own
 * og:description / meta description for the top N HN links (≤280 chars). Never invented: only text the page publishes.
 */
import { decodeEntities } from "@/lib/plain-headline";

export const OG_SUMMARY_CHARS = 280;
export const OG_SUMMARY_TOP_N = 12;
export const OG_SUMMARY_TIMEOUT_MS = 4000;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[1] ?? m[2] ?? "") : null;
}

/** og:description first, then twitter:description, then <meta name="description">; decoded, collapsed, cut to 280. */
export function parseMetaDescription(html: string): string | null {
  const head = String(html ?? "").slice(0, 200_000);
  const found: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (content && !(key in found)) found[key] = content;
  }
  const raw = found["og:description"] ?? found["twitter:description"] ?? found["description"];
  if (!raw) return null;
  const t = decodeEntities(raw).replace(/\s+/g, " ").trim();
  if (t.length < 20) return null;
  return t.length > OG_SUMMARY_CHARS ? `${t.slice(0, OG_SUMMARY_CHARS - 1).trimEnd()}…` : t;
}

/** An article link worth reading (not HN's own discussion page, not a PDF). */
export function ogEligibleUrl(url: string): boolean {
  return /^https?:\/\//.test(url) && !/news\.ycombinator\.com/.test(url) && !/\.pdf(?:$|[?#])/i.test(url);
}

/** Fetch the top `n` rows' (by score) linked pages; returns id → description. Soft-fails per URL. */
export async function fetchOgSummaries(
  rows: { id: string; url: string; score: number }[],
  { n = OG_SUMMARY_TOP_N, timeoutMs = OG_SUMMARY_TIMEOUT_MS, fetchImpl = fetch }: { n?: number; timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<Map<string, string>> {
  const top = rows.filter((r) => ogEligibleUrl(r.url)).sort((a, b) => b.score - a.score).slice(0, n);
  const out = new Map<string, string>();
  await Promise.all(
    top.map(async (r) => {
      try {
        const res = await fetchImpl(r.url, { signal: AbortSignal.timeout(timeoutMs), redirect: "follow", headers: { "user-agent": "nexus-sage-desk/1 (+og:description)" } });
        if (!res.ok || !/html/i.test(res.headers.get("content-type") ?? "")) return;
        const d = parseMetaDescription(await res.text());
        if (d) out.set(r.id, d);
      } catch {
        /* soft-fail: no summary for this row */
      }
    }),
  );
  return out;
}

/** Member ids that may lend a summary (box-only Gmail / X never do). */
export function canLendSummary(id: string): boolean {
  return !/^(?:gmail|x|taste):/.test(id);
}
