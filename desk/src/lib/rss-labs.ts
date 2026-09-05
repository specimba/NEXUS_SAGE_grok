/**
 * Lab blog RSS — first-party GET only.
 * OpenAI / DeepMind / Google AI / Hugging Face.
 * Pulse + shelf · never Brief · cycle stays 003 · lead hf-incident.
 * Zero credentials. No Anthropic/Meta HTML scrape. No Reddit.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPost, type PostClass } from "./x-hygiene";
import { classifyUrl } from "./ingest/shelf";

export const RSS_UA = "NEXUS-SAGE-desk/0.2 (free-ingest; rss)";
export const RSS_MIN_INTERVAL_MS = 2_000;
export const RSS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** Cap per feed — OpenAI news can be ~700KB. */
export const RSS_MAX_ITEMS_PER_FEED = 12;

export type LabId =
  | "openai"
  | "deepmind"
  | "google-ai"
  | "huggingface"
  | "anthropic"
  | "meta";

export type LabRssItem = {
  id: string;
  lab: LabId;
  title: string;
  link: string;
  published: string;
  summary: string;
  source: "rss-lab" | "rss-mirror";
  shelfOnly: boolean;
  pulseEligible: boolean;
  briefEligible: false;
  class: PostClass;
  tag: "rest" | "rumor" | "companion" | "incident";
  reasons: string[];
};

export type LabFeedDef = {
  lab: Exclude<LabId, "anthropic" | "meta">;
  /** First-party URLs tried in order (404 → next). */
  urls: readonly string[];
};

/** Approved first-party feeds only — Anthropic/Meta intentionally absent. */
export const LAB_FEEDS: readonly LabFeedDef[] = [
  {
    lab: "openai",
    urls: [
      "https://openai.com/news/rss.xml",
      "https://openai.com/blog/rss.xml",
    ],
  },
  {
    lab: "deepmind",
    urls: [
      "https://deepmind.google/blog/rss.xml",
      "https://deepmind.google/blog/feed/basic/",
    ],
  },
  {
    lab: "google-ai",
    urls: ["https://blog.google/technology/ai/rss/"],
  },
  {
    lab: "huggingface",
    urls: ["https://huggingface.co/blog/feed.xml"],
  },
] as const;

const LAB_HANDLE: Record<Exclude<LabId, "anthropic" | "meta">, string> = {
  openai: "openai",
  deepmind: "deepmind",
  "google-ai": "googleai",
  huggingface: "huggingface",
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/rss-cache",
);

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function resolveRssCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/rss-cache");
  return DEFAULT_CACHE_DIR;
}

export function itemId(linkOrGuid: string): string {
  return createHash("sha256").update(linkOrGuid.trim()).digest("hex").slice(0, 16);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function stripHtml(text: string): string {
  return decodeXmlEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? stripHtml(m[1]!) : "";
}

function firstTagRaw(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]!).trim() : "";
}

function linkFromRssItem(block: string): string {
  // Prefer <link>text</link>; fall back to <link href="..."/>
  const textLink = firstTagRaw(block, "link");
  if (textLink && /^https?:\/\//i.test(textLink)) return textLink;
  const selfClosing = block.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\/?>/i);
  if (selfClosing?.[1]) return decodeXmlEntities(selfClosing[1]);
  const guid = firstTagRaw(block, "guid");
  if (guid && /^https?:\/\//i.test(guid)) return guid;
  return textLink || guid || "";
}

function toIso(published: string): string {
  if (!published) return new Date(0).toISOString().replace(/\.\d{3}Z$/, "Z");
  const d = new Date(published);
  if (Number.isNaN(d.getTime())) return published;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function clipSummary(s: string, max = 400): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

export type ParsedFeedEntry = {
  title: string;
  link: string;
  guid: string;
  published: string;
  summary: string;
};

/** Parse RSS 2.0 `<item>` or Atom `<entry>` blocks. Bad XML → []. */
export function parseRssOrAtom(xml: string): ParsedFeedEntry[] {
  if (!xml || typeof xml !== "string") return [];
  const out: ParsedFeedEntry[] = [];

  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1]!;
    const title = firstTag(block, "title");
    const link = linkFromRssItem(block);
    const guid = firstTagRaw(block, "guid") || link;
    const published = toIso(
      firstTagRaw(block, "pubDate") ||
        firstTagRaw(block, "published") ||
        firstTagRaw(block, "dc:date") ||
        "",
    );
    const summary = clipSummary(
      firstTag(block, "description") ||
        firstTag(block, "summary") ||
        firstTag(block, "content:encoded") ||
        "",
    );
    if (!title && !link) continue;
    out.push({ title, link, guid, published, summary });
  }

  if (out.length) return out;

  const entryRe = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((m = entryRe.exec(xml))) {
    const block = m[1]!;
    const title = firstTag(block, "title");
    let link = "";
    const linkHref = block.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\/?>/i);
    if (linkHref?.[1]) link = decodeXmlEntities(linkHref[1]);
    if (!link) link = firstTagRaw(block, "id");
    const guid = firstTagRaw(block, "id") || link;
    const published = toIso(
      firstTagRaw(block, "published") || firstTagRaw(block, "updated") || "",
    );
    const summary = clipSummary(
      firstTag(block, "summary") || firstTag(block, "content") || "",
    );
    if (!title && !link) continue;
    out.push({ title, link, guid, published, summary });
  }

  return out;
}

/**
 * Map parsed entries → LabRssItem.
 * classifyPost / DENY / Sol≠Astra → drop.
 * toolkit URL → shelfOnly.
 * briefEligible always false.
 */
export function toLabItems(
  entries: ParsedFeedEntry[],
  lab: LabId,
  source: LabRssItem["source"] = "rss-lab",
): LabRssItem[] {
  const out: LabRssItem[] = [];
  const seen = new Set<string>();
  const handle =
    lab === "anthropic" || lab === "meta"
      ? lab
      : LAB_HANDLE[lab as Exclude<LabId, "anthropic" | "meta">];

  for (const e of entries) {
    const title = String(e.title ?? "").trim();
    const link = String(e.link ?? "").trim();
    if (!title || !link) continue;
    const idKey = e.guid || link;
    const id = `rss:${lab}:${itemId(idKey)}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const classified = classifyPost({
      text: `${title} ${e.summary ?? ""}`,
      handle,
    });

    if (classified.flatten || classified.class === "flatten") continue;
    if (classified.class === "drop") continue;

    const urlLane = classifyUrl(link);
    const toolkitShelf = urlLane.lane === "shelf";

    let tag: LabRssItem["tag"] = "rest";
    if (classified.class === "rumor" || classified.rumor) tag = "rumor";
    else if (classified.class === "companion") tag = "companion";
    else if (classified.class === "incident") tag = "incident";

    const pulseEligible = !toolkitShelf;
    out.push({
      id,
      lab,
      title,
      link,
      published: e.published,
      summary: clipSummary(e.summary ?? ""),
      source,
      shelfOnly: toolkitShelf,
      pulseEligible,
      briefEligible: false,
      class: classified.class,
      tag,
      reasons: classified.reasons,
    });
  }

  return out.sort((a, b) => b.published.localeCompare(a.published));
}

/** Hard gate: lab RSS never Brief lead/companion pin. */
export function isLabBriefEligible(_item?: LabRssItem): false {
  void _item;
  return false;
}

function cachePath(cacheDir: string, lab: string): string {
  return resolve(cacheDir, `${lab}.xml`);
}

function readCache(
  cacheDir: string,
  lab: string,
  now = Date.now(),
): string | null {
  const p = cachePath(cacheDir, lab);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf8");
    const stamp = raw.match(/^<!--\s*cached_at:([^\s]+)\s*-->/);
    if (stamp) {
      const t = Date.parse(stamp[1]!);
      if (Number.isFinite(t) && now - t > RSS_CACHE_TTL_MS) return null;
      return raw.replace(/^<!--[\s\S]*?-->\s*/, "");
    }
    return raw;
  } catch {
    return null;
  }
}

function writeCache(cacheDir: string, lab: string, xml: string, now = Date.now()) {
  mkdirSync(cacheDir, { recursive: true });
  const iso = new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(cachePath(cacheDir, lab), `<!-- cached_at:${iso} -->\n${xml}`);
}

async function throttle(): Promise<void> {
  const gap = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && gap < RSS_MIN_INTERVAL_MS) {
    await sleep(RSS_MIN_INTERVAL_MS - gap);
  }
}

async function getXml(
  url: string,
): Promise<{ ok: true; body: string } | { ok: false; status: number }> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": RSS_UA,
    },
  });
  const body = await res.text();
  if (res.status === 429 || res.status >= 500) {
    return { ok: false, status: res.status };
  }
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  return { ok: true, body };
}

export type FetchRssLabsOpts = {
  cacheDir?: string;
  feeds?: readonly LabFeedDef[];
  maxPerFeed?: number;
  /** Inject XML by lab id (tests / offline). Skips network for that lab. */
  fixtures?: Partial<Record<LabId, string>>;
  now?: number;
};

export type FetchRssLabsResult = {
  items: LabRssItem[];
  pulse: LabRssItem[];
  shelf: LabRssItem[];
  feedsOk: { lab: string; url: string; count: number }[];
  feedsSkipped: { lab: string; reason: string }[];
};

/**
 * Fetch approved lab feeds sequentially.
 * ≤1 req/2s · cache 6h · fail closed per-feed · never Brief.
 */
export async function fetchRssLabs(
  opts: FetchRssLabsOpts = {},
): Promise<FetchRssLabsResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const maxPerFeed = Math.max(
    1,
    Math.min(50, opts.maxPerFeed ?? RSS_MAX_ITEMS_PER_FEED),
  );
  const now = opts.now ?? Date.now();
  const feeds = opts.feeds ?? LAB_FEEDS;

  const all: LabRssItem[] = [];
  const feedsOk: FetchRssLabsResult["feedsOk"] = [];
  const feedsSkipped: FetchRssLabsResult["feedsSkipped"] = [];
  const seenIds = new Set<string>();

  for (const feed of feeds) {
    // Never fetch anthropic/meta without Scout-pasted mirror URL in wire doc
    if (feed.lab === ("anthropic" as string) || feed.lab === ("meta" as string)) {
      feedsSkipped.push({ lab: feed.lab, reason: "no first-party RSS / not approved" });
      continue;
    }

    if (opts.fixtures?.[feed.lab]) {
      const entries = parseRssOrAtom(opts.fixtures[feed.lab]!).slice(0, maxPerFeed);
      const mapped = toLabItems(entries, feed.lab, "rss-lab");
      for (const it of mapped) {
        if (seenIds.has(it.id)) continue;
        seenIds.add(it.id);
        all.push(it);
      }
      feedsOk.push({ lab: feed.lab, url: "fixture", count: mapped.length });
      continue;
    }

    let xml = readCache(cacheDir, feed.lab, now);
    let usedUrl = `(cache:${feed.lab})`;

    if (!xml) {
      let got: string | null = null;
      let lastStatus = 0;
      for (const url of feed.urls) {
        try {
          const res = await getXml(url);
          if (!res.ok) {
            lastStatus = res.status;
            if (res.status === 404) continue; // try fallback
            console.log(`RSS[${feed.lab}]: HTTP ${res.status} — skip`);
            break;
          }
          got = res.body;
          usedUrl = url;
          writeCache(cacheDir, feed.lab, got, now);
          break;
        } catch (err) {
          lastStatus = -1;
          console.log(`RSS[${feed.lab}]: fetch failed — ${String(err)}`);
          break;
        }
      }
      if (!got) {
        feedsSkipped.push({
          lab: feed.lab,
          reason: lastStatus ? `HTTP ${lastStatus}` : "network/empty",
        });
        continue;
      }
      xml = got;
    }

    let entries: ParsedFeedEntry[];
    try {
      entries = parseRssOrAtom(xml).slice(0, maxPerFeed);
    } catch {
      feedsSkipped.push({ lab: feed.lab, reason: "bad XML" });
      continue;
    }

    if (!entries.length) {
      feedsSkipped.push({ lab: feed.lab, reason: "empty parse" });
      continue;
    }

    const mapped = toLabItems(entries, feed.lab, "rss-lab");
    for (const it of mapped) {
      if (seenIds.has(it.id)) continue;
      seenIds.add(it.id);
      all.push(it);
    }
    feedsOk.push({ lab: feed.lab, url: usedUrl, count: mapped.length });
  }

  all.sort((a, b) => b.published.localeCompare(a.published));
  const pulse = all.filter((i) => i.pulseEligible);
  const shelf = all.filter((i) => i.shelfOnly);

  return { items: all, pulse, shelf, feedsOk, feedsSkipped };
}

/** Shelf rows from lab RSS toolkit / shelfOnly items. */
export function toShelfItems(
  items: LabRssItem[],
): { href: string; label: string; reason: "rss-lab-shelf" }[] {
  return items
    .filter((i) => i.shelfOnly)
    .map((i) => ({
      href: i.link,
      label: `${i.lab}: ${i.title}`.slice(0, 72),
      reason: "rss-lab-shelf" as const,
    }));
}
