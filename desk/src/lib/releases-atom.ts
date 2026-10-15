/**
 * PASS-S1.3 — release feeds (source type `releases_atom`): GitHub `releases.atom` for local-inference / agent tools.
 * Public Atom, no token, no API quota; same fetch / timeout / 6h cache / ≤1 req per 2 s helpers as the lab feeds.
 *
 * Filter (code, per feed; not configurable):
 *   1. semver tags only — `^v?(\d+)\.(\d+)(?:\.(\d+))?$` (drops b11671 build tags, -rc/-alpha/-beta/-dev, nightly)
 *   2. emit only a MINOR-or-MAJOR bump against the last emitted version (artifacts/sage/releases-seen.json);
 *      a feed with no state seeds silently (no emit)
 *   3. ≤ 1 item per feed per 24h (a bump inside the window waits; state is not advanced)
 * Pulse chip REL. Single publisher (github.com) → never a lead, never Wire/Brief, never a Digest title.
 * Spec: refs/PASS-S1-SCOUT-SOURCES.md §S1.3.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getXml, looksLikeHtml, parseRssOrAtom, readCache, writeCache, type FeedSoftFail, type ParsedFeedEntry } from "./rss-labs";
import { RSS_FEED_TIMEOUT_MS } from "./rss-timeout";
import type { Pace } from "./pace";

export type ReleaseFeedId = "llama.cpp" | "ollama" | "vllm" | "claude-code";
export type ReleaseFeedDef = { id: ReleaseFeedId; label: string; repo: string; url: string; defaultOn: boolean };

/** The registry — config `releases_atom.feeds` may only list these ids. claude-code is off by default (patch churn). */
export const RELEASE_FEEDS: readonly ReleaseFeedDef[] = [
  { id: "llama.cpp", label: "llama.cpp", repo: "ggml-org/llama.cpp", url: "https://github.com/ggml-org/llama.cpp/releases.atom", defaultOn: true },
  { id: "ollama", label: "Ollama", repo: "ollama/ollama", url: "https://github.com/ollama/ollama/releases.atom", defaultOn: true },
  { id: "vllm", label: "vLLM", repo: "vllm-project/vllm", url: "https://github.com/vllm-project/vllm/releases.atom", defaultOn: true },
  { id: "claude-code", label: "Claude Code", repo: "anthropics/claude-code", url: "https://github.com/anthropics/claude-code/releases.atom", defaultOn: false },
] as const;

/** Default Pulse rows per feed (ceiling = × 2 = 4). */
export const RELEASES_CAP = 2;
export const RELEASES_CAP_MAX = 4;
export const RELEASES_SOURCE = "releases-atom" as const;
export const RELEASE_RATE_MS = 24 * 3_600_000;
/** An emitted release stays a Pulse row this long (then it ages out like any Pulse item). */
export const RELEASE_SHOW_MS = 7 * 24 * 3_600_000;
export const SEMVER_RE = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/;

export type Semver = { major: number; minor: number; patch: number };
export function parseSemver(tag: string): Semver | null {
  const m = SEMVER_RE.exec(String(tag ?? "").trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3] ?? 0) };
}
export function cmpSemver(a: Semver, b: Semver): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}
/** True when `next` is a minor-or-major bump over `prev` (a patch bump, equal or lower → false). */
export function isMinorOrMajorBump(prev: Semver, next: Semver): boolean {
  return next.major > prev.major || (next.major === prev.major && next.minor > prev.minor);
}

export type ReleaseItem = {
  id: string;
  feed: ReleaseFeedId;
  title: string;
  link: string;
  /** Release time from the feed (`<updated>`). */
  published: string;
  tag: string;
  source: typeof RELEASES_SOURCE;
  /** Crawl stamp the item was emitted at (rate window). */
  emitted_at: string;
  pulseEligible: true;
  briefEligible: false;
};

export type ReleaseFeedState = {
  /** Last emitted (or seeded) version tag — the bump baseline. */
  version: string;
  seeded_at: string;
  /** Last emit time (null = seeded, never emitted). */
  emitted_at: string | null;
  /** Newest-first emitted items, ≤ RELEASES_CAP_MAX. */
  emitted: ReleaseItem[];
};
export type ReleasesSeen = { schema: 1; feeds: Partial<Record<ReleaseFeedId, ReleaseFeedState>> };
export const emptyReleasesSeen = (): ReleasesSeen => ({ schema: 1, feeds: {} });

/** Tag from the release link (`…/releases/tag/<tag>`), else the Atom id / title tail. */
export function releaseTag(e: Pick<ParsedFeedEntry, "link" | "guid" | "title">): string {
  const m = /\/releases\/tag\/([^/?#]+)/.exec(e.link ?? "");
  if (m) return decodeURIComponent(m[1]);
  const g = String(e.guid ?? "").split("/").pop() ?? "";
  return g || String(e.title ?? "").trim();
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

export type ReleaseDecision = {
  state: ReleaseFeedState;
  emitted: ReleaseItem | null;
  /** seed | bump | rate-limited | no-bump | no-semver */
  action: "seed" | "bump" | "rate-limited" | "no-bump" | "no-semver";
  newest: string | null;
  skipped: { tag: string; reason: "not-semver" | "patch" | "not-newer" }[];
};

/**
 * Pure per-feed decision. `prev` undefined → seed (newest semver becomes the baseline; no emit).
 * Otherwise emit the HIGHEST minor/major bump over `prev.version`, unless the last emit was < 24h ago
 * (then nothing changes, so the bump is still pending next crawl).
 */
export function decideRelease(
  feed: ReleaseFeedDef,
  entries: readonly ParsedFeedEntry[],
  prev: ReleaseFeedState | undefined,
  now: number,
): ReleaseDecision {
  const skipped: ReleaseDecision["skipped"] = [];
  const semver: { e: ParsedFeedEntry; tag: string; v: Semver }[] = [];
  for (const e of entries) {
    const tag = releaseTag(e);
    const v = parseSemver(tag);
    if (!v) {
      skipped.push({ tag, reason: "not-semver" });
      continue;
    }
    semver.push({ e, tag, v });
  }
  semver.sort((a, b) => cmpSemver(b.v, a.v));
  const newest = semver[0] ?? null;
  if (!prev) {
    if (!newest) {
      return { state: { version: "", seeded_at: iso(now), emitted_at: null, emitted: [] }, emitted: null, action: "no-semver", newest: null, skipped };
    }
    return { state: { version: newest.tag, seeded_at: iso(now), emitted_at: null, emitted: [] }, emitted: null, action: "seed", newest: newest.tag, skipped };
  }
  const base = parseSemver(prev.version);
  if (!base) {
    // Previous seed found no semver tag — seed now from this crawl.
    if (!newest) return { state: prev, emitted: null, action: "no-semver", newest: null, skipped };
    return { state: { ...prev, version: newest.tag, seeded_at: iso(now) }, emitted: null, action: "seed", newest: newest.tag, skipped };
  }
  const bumps = semver.filter((s) => isMinorOrMajorBump(base, s.v));
  for (const s of semver) {
    if (bumps.includes(s)) continue;
    skipped.push({ tag: s.tag, reason: cmpSemver(s.v, base) > 0 ? "patch" : "not-newer" });
  }
  const top = bumps[0];
  if (!top) return { state: prev, emitted: null, action: "no-bump", newest: newest?.tag ?? null, skipped };
  const last = prev.emitted_at ? Date.parse(prev.emitted_at) : NaN;
  if (Number.isFinite(last) && now - last < RELEASE_RATE_MS) {
    return { state: prev, emitted: null, action: "rate-limited", newest: newest?.tag ?? null, skipped };
  }
  const item: ReleaseItem = {
    id: `rel:${feed.id}:${top.tag}`,
    feed: feed.id,
    title: `${feed.label} ${top.tag}`,
    link: top.e.link,
    published: top.e.published || iso(now),
    tag: top.tag,
    source: RELEASES_SOURCE,
    emitted_at: iso(now),
    pulseEligible: true,
    briefEligible: false,
  };
  return {
    state: { ...prev, version: top.tag, emitted_at: iso(now), emitted: [item, ...prev.emitted].slice(0, RELEASES_CAP_MAX) },
    emitted: item,
    action: "bump",
    newest: newest?.tag ?? null,
    skipped,
  };
}

/** Pulse rows from state: each enabled feed's emitted items, newest first, shown ≤ 7 days, ≤ cap per feed. */
export function releaseRows(seen: ReleasesSeen, feeds: readonly ReleaseFeedId[], cap: number, now: number): ReleaseItem[] {
  const out: ReleaseItem[] = [];
  for (const id of feeds) {
    const st = seen.feeds[id];
    if (!st) continue;
    out.push(...st.emitted.filter((x) => now - (Date.parse(x.emitted_at) || 0) < RELEASE_SHOW_MS).slice(0, Math.max(0, cap)));
  }
  return out.sort((a, b) => b.published.localeCompare(a.published));
}

const DEFAULT_CACHE_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../artifacts/sage/releases-cache");
export function resolveReleasesCacheDir(root?: string): string {
  return root ? resolve(root, "artifacts/sage/releases-cache") : DEFAULT_CACHE_DIR;
}
export function resolveReleasesSeenPath(root?: string): string {
  return root
    ? resolve(root, "artifacts/sage/releases-seen.json")
    : resolve(fileURLToPath(new URL(".", import.meta.url)), "../../artifacts/sage/releases-seen.json");
}
/** Tolerant parse of releases-seen.json (missing / malformed → empty = every feed seeds). */
export function parseReleasesSeen(raw: string | null | undefined): ReleasesSeen {
  if (!raw) return emptyReleasesSeen();
  try {
    const j = JSON.parse(raw) as ReleasesSeen;
    if (j && j.schema === 1 && j.feeds && typeof j.feeds === "object") return j;
  } catch {
    /* fall through */
  }
  return emptyReleasesSeen();
}

export type FetchReleasesOpts = {
  feeds?: readonly ReleaseFeedDef[];
  seen?: ReleasesSeen;
  cap?: number;
  cacheDir?: string;
  feedTimeoutMs?: number;
  fixtures?: Partial<Record<ReleaseFeedId, string>>;
  fetchImpl?: typeof fetch;
  now?: number;
  minIntervalMs?: number;
  sleep?: Pace["sleep"];
};
export type FetchReleasesResult = {
  items: ReleaseItem[];
  seen: ReleasesSeen;
  decisions: { feed: ReleaseFeedId; action: ReleaseDecision["action"]; newest: string | null; emitted: string | null; baseline: string }[];
  feedsOk: { feed: ReleaseFeedId; url: string; entries: number }[];
  feedsSoftFail: FeedSoftFail[];
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason?: string;
  brief: false;
  pulse_only: true;
};

/** Fetch each enabled feed (sequential, shared throttle, per-feed soft-fail), decide, return rows + next state. */
export async function fetchReleasesAtom(opts: FetchReleasesOpts = {}): Promise<FetchReleasesResult> {
  const now = opts.now ?? Date.now();
  const feeds = opts.feeds ?? RELEASE_FEEDS.filter((f) => f.defaultOn);
  const cap = Math.max(0, Math.min(RELEASES_CAP_MAX, opts.cap ?? RELEASES_CAP));
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const timeoutMs = opts.feedTimeoutMs ?? RSS_FEED_TIMEOUT_MS;
  const pace: Pace = { minIntervalMs: opts.minIntervalMs, sleep: opts.sleep };
  const prevSeen = opts.seen ?? emptyReleasesSeen();
  const seen: ReleasesSeen = { schema: 1, feeds: { ...prevSeen.feeds } };
  const decisions: FetchReleasesResult["decisions"] = [];
  const feedsOk: FetchReleasesResult["feedsOk"] = [];
  const feedsSoftFail: FeedSoftFail[] = [];
  const soft = (feed: string, reason: string) => {
    console.log(`REL[${feed}]: soft_fail — ${reason}`);
    feedsSoftFail.push({ lab: feed, reason, soft_fail: true });
  };
  for (const feed of feeds) {
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
        try {
          const res = await getXml(feed.url, opts.fetchImpl ?? fetch, pace, timeoutMs);
          if (res.ok) {
            xml = res.body;
            usedUrl = feed.url;
            writeCache(cacheDir, feed.id, xml, now);
          } else {
            soft(feed.id, res.reason);
            continue;
          }
        } catch (err) {
          const name = (err as Error)?.name;
          soft(feed.id, name === "TimeoutError" || name === "AbortError" ? `timeout ${timeoutMs}ms` : `network: ${String(err)}`);
          continue;
        }
      }
    }
    if (looksLikeHtml(xml)) {
      soft(feed.id, "HTML not Atom");
      continue;
    }
    const entries = parseRssOrAtom(xml);
    if (!entries.length) {
      soft(feed.id, "empty parse");
      continue;
    }
    const prev = prevSeen.feeds[feed.id];
    const d = decideRelease(feed, entries, prev, now);
    seen.feeds[feed.id] = d.state;
    decisions.push({ feed: feed.id, action: d.action, newest: d.newest, emitted: d.emitted?.tag ?? null, baseline: prev?.version ?? "(none)" });
    feedsOk.push({ feed: feed.id, url: usedUrl, entries: entries.length });
  }
  const items = releaseRows(seen, feeds.map((f) => f.id), cap, now);
  const soft_fail = feedsSoftFail.length > 0;
  return {
    items,
    seen,
    decisions,
    feedsOk,
    feedsSoftFail,
    ok: feedsOk.length >= 1,
    soft_fail,
    soft_fail_reason: soft_fail ? feedsSoftFail.map((f) => `${f.lab}:${f.reason}`).join(" · ") : undefined,
    brief: false,
    pulse_only: true,
  };
}
