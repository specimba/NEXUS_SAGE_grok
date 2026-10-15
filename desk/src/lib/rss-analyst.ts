/**
 * PASS-S1.1 — analyst feeds (Simon Willison, Latent Space + AINews). Not labs: rss-labs.ts stays first-party only.
 * Same RSS fetch / parse / timeout / 6h cache / ≤1 req per 2 s helpers as the lab feeds (shared throttle).
 * Pulse chip ANL. Analyst items count as publishers for Wire/Pulse corroboration, but a lead needs ≥1 publisher that
 * is neither an analyst nor GNews (lead-pick.ts `analyst-only`). Never Brief on their own. Cycle stays 003.
 * AINews daily recaps (title starts `[AINews]`) are one item each — never split into sub-stories.
 * Spec: refs/PASS-S1-SCOUT-SOURCES.md §S1.1.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAiRelevantTitle } from "./ai-relevance";
import {
  getXml,
  itemId,
  looksLikeHtml,
  parseRssOrAtom,
  readCache,
  writeCache,
  type FeedSoftFail,
  type ParsedFeedEntry,
} from "./rss-labs";
import { RSS_FEED_TIMEOUT_MS } from "./rss-timeout";
import { classifyPost, type PostClass } from "./x-hygiene";
import type { Pace } from "./pace";

export type AnalystId = "simonw" | "latent-space";
export type AnalystFeedDef = { id: AnalystId; label: string; urls: readonly string[] };

/** The registry — config `analyst_rss.feeds` may only list these ids. */
export const ANALYST_FEEDS: readonly AnalystFeedDef[] = [
  { id: "simonw", label: "Simon Willison", urls: ["https://simonwillison.net/atom/everything/"] },
  { id: "latent-space", label: "Latent Space", urls: ["https://www.latent.space/feed"] },
] as const;

/** Default per-feed cap (ceiling = × 2 = 12). */
export const ANALYST_RSS_CAP = 6;
export const ANALYST_SOURCE = "rss-analyst" as const;
/** AINews daily recap title prefix (Latent Space). */
export const AINEWS_RECAP_RE = /^\[AINews\]/i;

export type AnalystRssItem = {
  id: string;
  feed: AnalystId;
  title: string;
  link: string;
  published: string;
  summary: string;
  source: typeof ANALYST_SOURCE;
  /** AINews daily recap — one item, never split. */
  recap: boolean;
  pulseEligible: true;
  briefEligible: false;
  class: PostClass;
  tag: "rest" | "rumor" | "companion" | "incident";
};

const DEFAULT_CACHE_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../artifacts/sage/rss-analyst-cache");
export function resolveAnalystCacheDir(root?: string): string {
  return root ? resolve(root, "artifacts/sage/rss-analyst-cache") : DEFAULT_CACHE_DIR;
}

function clip(s: string, max = 400): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Why an analyst entry is not a Pulse row (null = kept): DENY/flatten, or not AI (recaps are always AI). */
export function analystDropReason(title: string, summary: string, feed: AnalystId): string | null {
  const c = classifyPost({ text: `${title} ${summary}`, handle: feed });
  if (c.flatten || c.class === "flatten" || c.class === "drop") return `deny:${c.class}`;
  if (AINEWS_RECAP_RE.test(title)) return null;
  return isAiRelevantTitle(title) ? null : "not-ai";
}

/** Parsed entries → analyst items (one per entry; an AINews recap stays ONE item). Newest first. */
export function toAnalystItems(entries: ParsedFeedEntry[], feed: AnalystId): { items: AnalystRssItem[]; dropped: { title: string; reason: string }[] } {
  const items: AnalystRssItem[] = [];
  const dropped: { title: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const title = String(e.title ?? "").trim();
    const link = String(e.link ?? "").trim();
    if (!title || !link) continue;
    const id = `anl:${feed}:${itemId(e.guid || link)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const why = analystDropReason(title, e.summary ?? "", feed);
    if (why) {
      dropped.push({ title, reason: why });
      continue;
    }
    const c = classifyPost({ text: `${title} ${e.summary ?? ""}`, handle: feed });
    items.push({
      id,
      feed,
      title,
      link,
      published: e.published,
      summary: clip(e.summary ?? ""),
      source: ANALYST_SOURCE,
      recap: AINEWS_RECAP_RE.test(title),
      pulseEligible: true,
      briefEligible: false,
      class: c.class,
      tag: c.class === "rumor" || c.rumor ? "rumor" : c.class === "companion" ? "companion" : c.class === "incident" ? "incident" : "rest",
    });
  }
  items.sort((a, b) => b.published.localeCompare(a.published));
  return { items, dropped };
}

export type FetchAnalystOpts = {
  cacheDir?: string;
  feeds?: readonly AnalystFeedDef[];
  maxPerFeed?: number;
  feedTimeoutMs?: number;
  fixtures?: Partial<Record<AnalystId, string>>;
  fetchImpl?: typeof fetch;
  now?: number;
  minIntervalMs?: number;
  sleep?: Pace["sleep"];
};

export type FetchAnalystResult = {
  items: AnalystRssItem[];
  dropped: { feed: AnalystId; title: string; reason: string }[];
  feedsOk: { feed: AnalystId; url: string; count: number }[];
  feedsSoftFail: FeedSoftFail[];
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  brief: false;
  pulse_only: true;
};

/**
 * Fetch the configured analyst feeds sequentially (≤1 req/2s shared with lab RSS · 6h cache · per-feed soft-fail).
 * The per-feed cap applies to entries BEFORE the AI gate (same as lab feeds), so ≤ cap rows per feed.
 */
export async function fetchRssAnalyst(opts: FetchAnalystOpts = {}): Promise<FetchAnalystResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const max = Math.max(1, Math.min(50, opts.maxPerFeed ?? ANALYST_RSS_CAP));
  const now = opts.now ?? Date.now();
  const timeoutMs = opts.feedTimeoutMs ?? RSS_FEED_TIMEOUT_MS;
  const pace: Pace = { minIntervalMs: opts.minIntervalMs, sleep: opts.sleep };
  const items: AnalystRssItem[] = [];
  const dropped: FetchAnalystResult["dropped"] = [];
  const feedsOk: FetchAnalystResult["feedsOk"] = [];
  const feedsSoftFail: FeedSoftFail[] = [];
  const soft = (feed: string, reason: string) => {
    console.log(`RSS-ANL[${feed}]: soft_fail — ${reason}`);
    feedsSoftFail.push({ lab: feed, reason, soft_fail: true });
  };
  for (const feed of opts.feeds ?? ANALYST_FEEDS) {
    let xml: string | null = null;
    let usedUrl = opts.fixtures ? "fixture" : `(cache:${feed.id})`;
    if (opts.fixtures) {
      xml = opts.fixtures[feed.id] ?? null;
      if (!xml) {
        soft(feed.id, "empty fixture");
        continue;
      }
    } else {
      xml = readCache(cacheDir, feed.id, now);
      if (!xml) {
        let reason = "network/empty";
        for (const url of feed.urls) {
          try {
            const res = await getXml(url, opts.fetchImpl ?? fetch, pace, timeoutMs);
            if (!res.ok) {
              reason = res.reason;
              continue;
            }
            xml = res.body;
            usedUrl = url;
            writeCache(cacheDir, feed.id, xml, now);
            break;
          } catch (err) {
            const name = (err as Error)?.name;
            reason = name === "TimeoutError" || name === "AbortError" ? `timeout ${timeoutMs}ms` : `network: ${String(err)}`;
          }
        }
        if (!xml) {
          soft(feed.id, reason);
          continue;
        }
      }
    }
    if (looksLikeHtml(xml)) {
      soft(feed.id, "HTML not RSS");
      continue;
    }
    const entries = parseRssOrAtom(xml)
      .sort((a, b) => b.published.localeCompare(a.published))
      .slice(0, max);
    if (!entries.length) {
      soft(feed.id, "empty parse");
      continue;
    }
    const r = toAnalystItems(entries, feed.id);
    items.push(...r.items);
    dropped.push(...r.dropped.map((d) => ({ feed: feed.id, ...d })));
    feedsOk.push({ feed: feed.id, url: usedUrl, count: r.items.length });
  }
  items.sort((a, b) => b.published.localeCompare(a.published));
  const soft_fail = feedsSoftFail.length > 0;
  return {
    items,
    dropped,
    feedsOk,
    feedsSoftFail,
    ok: feedsOk.length >= 1,
    soft_fail,
    soft_fail_reason: soft_fail ? feedsSoftFail.map((f) => `${f.lab}:${f.reason}`).join(" · ") : undefined,
    brief: false,
    pulse_only: true,
  };
}
