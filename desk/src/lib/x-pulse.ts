/**
 * Pulse scoring + hydrate + STALE age + emerging topics.
 * applyHydrate: never write 0 over a real count.
 */

import { watchWeight } from "@/data/x-watchlist";

export const STALE_HOURS = 18;

export type Scoreable = {
  handle?: string;
  likes?: number;
  views?: number;
  at?: string;
  tag?: string;
  text?: string;
  weight?: number;
};

export type HydrateCounts = {
  likes?: number;
  views?: number;
  replies?: number;
  reposts?: number;
};

/** Prefer scorePost; `score` is the alias used in older call sites. */
export function scorePost(post: Scoreable, now = Date.now()): number {
  const w = post.weight ?? watchWeight(post.handle ?? "");
  const likes = Math.max(0, post.likes ?? 0);
  const views = Math.max(0, post.views ?? 0);
  const engagement = Math.log10(likes + 1) * 2 + Math.log10(views + 1);
  let recency = 1;
  if (post.at) {
    const ageH = (now - Date.parse(post.at)) / 3_600_000;
    recency = Math.max(0.15, 1 - ageH / 72);
  }
  const tagBoost =
    post.tag === "lead-bond" ? 1.4 : post.tag === "companion" ? 1.2 : post.tag === "rumor" ? 0.6 : 1;
  return Number((w * engagement * recency * tagBoost).toFixed(4));
}

export const score = scorePost;

/**
 * Merge live counts into a stored post.
 * Never write 0 (or undefined/null coerced) over a real positive count.
 */
export function applyHydrate<T extends HydrateCounts>(prev: T, next: Partial<HydrateCounts>): T {
  const out = { ...prev };
  const keys = ["likes", "views", "replies", "reposts"] as const;
  for (const k of keys) {
    if (!(k in next) || next[k] === undefined || next[k] === null) continue;
    const n = Number(next[k]);
    const p = Number(prev[k] ?? 0);
    if (!Number.isFinite(n)) continue;
    if (n === 0 && p > 0) continue; // never-zero over live
    if (n < p && n === 0) continue;
    (out as HydrateCounts)[k] = n;
  }
  return out;
}

export function crawlAgeHours(crawledAt: string, now = Date.now()): {
  hours: number;
  stale: boolean;
} {
  const t = Date.parse(crawledAt);
  const hours = Number.isFinite(t) ? (now - t) / 3_600_000 : Infinity;
  return { hours, stale: hours > STALE_HOURS };
}

export type TopicPost = {
  handle: string;
  topic: string;
  text?: string;
};

/**
 * Emerging topic needs two distinct handles mentioning the same topic key.
 */
export function emergingTopics(
  posts: TopicPost[],
  minHandles = 2,
): { topic: string; handles: string[]; count: number }[] {
  const map = new Map<string, Set<string>>();
  for (const p of posts) {
    const topic = p.topic.trim().toLowerCase();
    if (!topic) continue;
    const h = p.handle.replace(/^@/, "").toLowerCase();
    if (!map.has(topic)) map.set(topic, new Set());
    map.get(topic)!.add(h);
  }
  return [...map.entries()]
    .map(([topic, set]) => ({
      topic,
      handles: [...set].sort(),
      count: set.size,
    }))
    .filter((t) => t.count >= minHandles)
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}
