/**
 * Cross-source Pulse dedupe (AUTONOMY-4H Beat 2).
 * Pure functions — no IO. Same story from HN + Google News + lab/security RSS
 * collapses into one cluster carrying sources[] badges.
 *
 * Merge rule: identical canonical URL OR normalized-title token Jaccard ≥ threshold (default 0.6).
 * Locks: GNews never sole-leads a multi-source cluster (lead prefers lab RSS > HN > security RSS > GNews).
 */

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

export type PulseMember = PulseInput & { canonical_url: string };

export type PulseCluster = {
  id: string;
  title: string;
  url: string;
  canonical_url: string;
  lead_id: string;
  lead_source: PulseSource;
  sources: PulseSource[];
  member_ids: string[];
  members: PulseMember[];
  size: number;
  at: string;
  first_seen?: string;
  is_new?: boolean;
};

export const DEDUPE_THRESHOLD = 0.6;
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
  "is", "are", "was", "be", "as", "its", "it", "this", "that", "our", "your", "we", "you",
  "into", "over", "new", "how", "why", "what", "vs", "via", "after", "about",
]);

/** Strip " - Publisher" / " | Publisher" suffixes (Google News style) when publisher known or suffix is short. */
export function stripPublisherSuffix(title: string, publisher?: string): string {
  let t = (title || "").trim();
  if (publisher) {
    const esc = publisher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\s+[-–—|]\\s+${esc}\\s*$`, "i"), "");
  }
  return t;
}

export function normalizeTitle(title: string, publisher?: string): string[] {
  const t = stripPublisherSuffix(title, publisher)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]s\b/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(^|\s)\.+|\.+(\s|$)/g, " ");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tok of t.split(/\s+/)) {
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

export function titleSimilarity(a: string, b: string, pubA?: string, pubB?: string): number {
  return jaccard(normalizeTitle(a, pubA), normalizeTitle(b, pubB));
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

/**
 * Cluster Pulse items across sources. Deterministic: input order breaks ties.
 * Union-find over pairs (same canonical URL, or title Jaccard ≥ threshold with ≥ MIN_TITLE_TOKENS each).
 */
export function clusterItems(
  items: readonly PulseInput[],
  opts: { threshold?: number; stamp?: string } = {},
): PulseCluster[] {
  const threshold = opts.threshold ?? DEDUPE_THRESHOLD;
  const members: PulseMember[] = items.map((it) => ({ ...it, canonical_url: canonicalizeUrl(it.url) }));
  const tokens = members.map((m) => normalizeTitle(m.title, m.publisher));
  const parent = members.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };
  const byUrl = new Map<string, number>();
  members.forEach((m, i) => {
    if (!m.canonical_url) return;
    const prev = byUrl.get(m.canonical_url);
    if (prev === undefined) byUrl.set(m.canonical_url, i);
    else union(prev, i);
  });
  for (let i = 0; i < members.length; i++) {
    if (tokens[i].length < MIN_TITLE_TOKENS) continue;
    for (let j = i + 1; j < members.length; j++) {
      if (tokens[j].length < MIN_TITLE_TOKENS) continue;
      if (jaccard(tokens[i], tokens[j]) >= threshold) union(i, j);
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
  for (const [, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const lead = pickLead(group);
    const sources = [...new Set(group.map((g) => g.source))].sort(
      (a, b) => LEAD_PRIORITY[a] - LEAD_PRIORITY[b],
    );
    const first_seen = minIso(group.map((g) => g.first_seen));
    clusters.push({
      id: `cl:${lead.id}`,
      title: stripPublisherSuffix(lead.title, lead.publisher),
      url: lead.url,
      canonical_url: lead.canonical_url,
      lead_id: lead.id,
      lead_source: lead.source,
      sources,
      member_ids: group.map((g) => g.id),
      members: group,
      size: group.length,
      at: maxIso(group.map((g) => g.at)),
      ...(first_seen ? { first_seen } : {}),
      ...(first_seen && opts.stamp ? { is_new: first_seen === opts.stamp } : {}),
    });
  }
  return clusters;
}

export function clusterStats(inCount: number, clusters: readonly PulseCluster[]) {
  const multi = clusters.filter((c) => c.sources.length > 1);
  return {
    items_in: inCount,
    clusters_out: clusters.length,
    collapsed: inCount - clusters.length,
    multi_source: multi.length,
    multi_member: clusters.filter((c) => c.size > 1).length,
  };
}
