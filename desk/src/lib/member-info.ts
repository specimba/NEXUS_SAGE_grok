/**
 * Per-member info for every crawl item (badge, publisher, own headline + time). ONE builder shared by the
 * desk (Pulse / Wire / drawer chips) and scripts/rank-snapshot.ts (Wire gate, corroboration multiplier,
 * lead eligibility), so N SRC — incl. WIRE-copy dedupe — is computed identically everywhere.
 */
import { CRAWL } from "@/data/x-crawl";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { HN_PULSE } from "@/data/hn-pulse";
import { RSS_LABS } from "@/data/rss-labs";
import { RSS_SECURITY } from "@/data/rss-security";
import { labBadge, type PulseMemberInfo } from "@/lib/pulse-v5";

let cache: Record<string, PulseMemberInfo> | null = null;

export function memberInfo(): Record<string, PulseMemberInfo> {
  if (cache) return cache;
  const m: Record<string, PulseMemberInfo> = {};
  for (const h of HN_PULSE) m[h.id] = { badge: "HN", publisher: `hn/${h.author}`, score: h.score, url: h.url, title: h.text, at: h.at };
  for (const g of GNEWS_RSS) m[g.id] = { badge: "GNW", publisher: g.publisher || "google news", url: g.link, title: g.title, at: g.published };
  for (const r of RSS_LABS)
    m[r.id] = { badge: labBadge(r.lab), publisher: r.lab, summary: r.summary || undefined, url: r.link, title: r.title, at: r.published };
  for (const s of RSS_SECURITY)
    m[s.id] = { badge: "SEC", publisher: s.lab, summary: s.summary || undefined, url: s.link, security: true, title: s.title, at: s.published };
  for (const p of CRAWL)
    m[`x:${p.id}`] = { badge: "X", publisher: `@${p.handle}`, score: p.likes, summary: `${p.take} — ${p.text}`, url: p.href };
  cache = m;
  return m;
}
