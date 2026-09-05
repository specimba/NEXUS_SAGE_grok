/**
 * Security lab RSS — Trail of Bits + Fox-IT + Project Zero.
 * NCC stays skip (broken HTML/404). Pulse + shelf + Digest refs · never Brief.
 * Cycle stays 003 · lead hf-incident. Spec: refs/WIRE-SECURITY-RSS.md (Fox-IT extend APPROVED).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPost, type PostClass } from "./x-hygiene";
import { classifyUrl } from "./ingest/shelf";
import {
  itemId,
  parseRssOrAtom,
  RSS_CACHE_TTL_MS,
  RSS_MAX_ITEMS_PER_FEED,
  RSS_MIN_INTERVAL_MS,
  type ParsedFeedEntry,
} from "./rss-labs";

export const SEC_RSS_UA = "NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)";

/** Soft cap when streaming huge Atom (Project Zero ~13MB). */
export const SEC_RSS_STREAM_MAX_BYTES = 1_500_000;
export const SEC_RSS_STREAM_MAX_ENTRIES = 12;

export type SecurityLabId =
  | "trailofbits"
  | "fox-it"
  | "ncc"
  | "projectzero"
  | "google-sec";

export type SecurityRssItem = {
  id: string;
  lab: SecurityLabId;
  title: string;
  link: string;
  published: string;
  summary: string;
  source: "rss-security";
  shelfOnly: boolean;
  pulseEligible: boolean;
  briefEligible: false;
  digestRefOk: true;
  class: PostClass;
  tag: "rest" | "rumor" | "companion" | "incident";
  reasons: string[];
};

export type SecurityFeedDef = {
  lab: "trailofbits" | "fox-it" | "projectzero";
  urls: readonly string[];
  /** Large Atom — stream + stop after N entries / byte budget. */
  streamCap?: boolean;
};

/** Must-wire: ToB + Fox-IT + Project Zero. NCC intentionally absent. */
export const SECURITY_FEEDS: readonly SecurityFeedDef[] = [
  {
    lab: "trailofbits",
    urls: ["https://blog.trailofbits.com/feed/"],
  },
  {
    lab: "fox-it",
    urls: ["https://blog.fox-it.com/feed/"],
  },
  {
    lab: "projectzero",
    urls: ["https://projectzero.google/feed.xml"],
    streamCap: true,
  },
] as const;

const LAB_HANDLE: Record<"trailofbits" | "fox-it" | "projectzero", string> = {
  trailofbits: "trailofbits",
  "fox-it": "foxit",
  projectzero: "projectzero",
};

const DEFAULT_CACHE_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../artifacts/sage/rss-sec-cache",
);

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function resolveSecRssCacheDir(root?: string): string {
  if (root) return resolve(root, "artifacts/sage/rss-sec-cache");
  return DEFAULT_CACHE_DIR;
}

function clipSummary(s: string, max = 400): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
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

function toIso(published: string): string {
  if (!published) return new Date(0).toISOString().replace(/\.\d{3}Z$/, "Z");
  const d = new Date(published);
  if (Number.isNaN(d.getTime())) return published;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Parse only the first `max` RSS `<item>` or Atom `<entry>` blocks.
 * Stops scanning once the quota is filled (large Project Zero Atom).
 */
export function parseRssOrAtomCapped(
  xml: string,
  max = SEC_RSS_STREAM_MAX_ENTRIES,
): ParsedFeedEntry[] {
  if (!xml || typeof xml !== "string" || max <= 0) return [];
  const out: ParsedFeedEntry[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) && out.length < max) {
    const block = m[1]!;
    const title = firstTag(block, "title");
    let link = firstTagRaw(block, "link");
    if (!link || !/^https?:\/\//i.test(link)) {
      const sc = block.match(/<link\b[^>]*\bhref="([^"]+)"[^>]*\/?>/i);
      if (sc?.[1]) link = decodeXmlEntities(sc[1]);
    }
    const guid = firstTagRaw(block, "guid") || link;
    if (!link && guid && /^https?:\/\//i.test(guid)) link = guid;
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
  while ((m = entryRe.exec(xml)) && out.length < max) {
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

/** Exploit how-to / weaponize sensationalism → rumor tag (still never Brief). */
export function isExploitSensationalism(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (/step[- ]by[- ]step/.test(t) && /exploit|weaponize|rce|remote code/.test(t)) ||
    /complete exploit (poc|walkthrough|tutorial)/i.test(text) ||
    /how to (weaponize|exploit)\b/i.test(text) ||
    /exploit (poc|tutorial|how-to|howto)\b/i.test(text)
  );
}

export function toSecurityItems(
  entries: ParsedFeedEntry[],
  lab: SecurityLabId,
): SecurityRssItem[] {
  const out: SecurityRssItem[] = [];
  const seen = new Set<string>();
  const handle =
    lab === "trailofbits" || lab === "fox-it" || lab === "projectzero"
      ? LAB_HANDLE[lab]
      : lab === "ncc"
        ? "nccgroup"
        : "googlesec";

  for (const e of entries) {
    const title = String(e.title ?? "").trim();
    const link = String(e.link ?? "").trim();
    if (!title || !link) continue;
    const idKey = e.guid || link;
    const id = `rss-sec:${lab}:${itemId(idKey)}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const blob = `${title} ${e.summary ?? ""}`;
    const classified = classifyPost({ text: blob, handle });

    if (classified.flatten || classified.class === "flatten") continue;
    if (classified.class === "drop") continue;

    const urlLane = classifyUrl(link);
    const toolkitShelf = urlLane.lane === "shelf";
    const sensational = isExploitSensationalism(blob);

    let tag: SecurityRssItem["tag"] = "rest";
    if (classified.class === "rumor" || classified.rumor || sensational) tag = "rumor";
    else if (classified.class === "companion") tag = "companion";
    else if (classified.class === "incident") tag = "incident";

    const reasons = [...classified.reasons];
    if (sensational) reasons.push("exploit-sensationalism → rumor (never Brief)");

    out.push({
      id,
      lab,
      title,
      link,
      published: e.published,
      summary: clipSummary(e.summary ?? ""),
      source: "rss-security",
      shelfOnly: toolkitShelf,
      pulseEligible: !toolkitShelf,
      briefEligible: false,
      digestRefOk: true,
      class: sensational && classified.class === "rest" ? "rumor" : classified.class,
      tag,
      reasons,
    });
  }

  return out.sort((a, b) => b.published.localeCompare(a.published));
}

export function isSecurityBriefEligible(_item?: SecurityRssItem): false {
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

function countCloseTags(buf: string, tag: "item" | "entry"): number {
  const re = new RegExp(`</${tag}>`, "gi");
  return (buf.match(re) ?? []).length;
}

/**
 * Stream GET — stop once we have enough </entry>|</item> or hit byte budget.
 * Avoids holding the full ~13MB Project Zero Atom when possible.
 */
async function getXmlStreamCapped(
  url: string,
  maxBytes = SEC_RSS_STREAM_MAX_BYTES,
  maxEntries = SEC_RSS_STREAM_MAX_ENTRIES,
): Promise<{ ok: true; body: string } | { ok: false; status: number }> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": SEC_RSS_UA,
    },
  });
  if (res.status === 429 || res.status >= 500 || !res.ok) {
    // drain lightly if present
    try {
      await res.arrayBuffer();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const body = await res.text();
    return { ok: true, body: body.slice(0, maxBytes) };
  }

  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const entries =
        countCloseTags(buf, "entry") || countCloseTags(buf, "item");
      if (entries >= maxEntries || buf.length >= maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
    }
    buf += decoder.decode();
  } catch (err) {
    console.log(`RSS-SEC stream: ${String(err)}`);
    if (!buf) return { ok: false, status: -1 };
  }

  // Truncate after Nth close tag when possible so parse stays small
  const capped = truncateAfterNthEntry(buf, maxEntries);
  return { ok: true, body: capped };
}

/** Keep prefix through the Nth </entry> or </item>; else byte-slice. */
export function truncateAfterNthEntry(xml: string, n: number): string {
  if (!xml || n <= 0) return "";
  let count = 0;
  const re = /<\/(entry|item)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    count += 1;
    if (count >= n) {
      return xml.slice(0, m.index + m[0].length);
    }
  }
  return xml.length > SEC_RSS_STREAM_MAX_BYTES
    ? xml.slice(0, SEC_RSS_STREAM_MAX_BYTES)
    : xml;
}

async function getXml(
  url: string,
): Promise<{ ok: true; body: string } | { ok: false; status: number }> {
  await throttle();
  lastRequestAt = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": SEC_RSS_UA,
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

export type FetchSecRssOpts = {
  cacheDir?: string;
  feeds?: readonly SecurityFeedDef[];
  maxPerFeed?: number;
  fixtures?: Partial<Record<SecurityLabId, string>>;
  now?: number;
};

export type FetchSecRssResult = {
  items: SecurityRssItem[];
  pulse: SecurityRssItem[];
  shelf: SecurityRssItem[];
  feedsOk: { lab: string; url: string; count: number }[];
  feedsSkipped: { lab: string; reason: string }[];
};

export async function fetchRssSecurity(
  opts: FetchSecRssOpts = {},
): Promise<FetchSecRssResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const maxPerFeed = Math.max(
    1,
    Math.min(50, opts.maxPerFeed ?? RSS_MAX_ITEMS_PER_FEED),
  );
  const now = opts.now ?? Date.now();
  const feeds = opts.feeds ?? SECURITY_FEEDS;

  const all: SecurityRssItem[] = [];
  const feedsOk: FetchSecRssResult["feedsOk"] = [];
  const feedsSkipped: FetchSecRssResult["feedsSkipped"] = [];
  const seenIds = new Set<string>();

  for (const feed of feeds) {
    if (opts.fixtures?.[feed.lab]) {
      const raw = opts.fixtures[feed.lab]!;
      const entries = (
        feed.streamCap
          ? parseRssOrAtomCapped(raw, maxPerFeed)
          : parseRssOrAtom(raw).slice(0, maxPerFeed)
      );
      const mapped = toSecurityItems(entries, feed.lab);
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
          const res = feed.streamCap
            ? await getXmlStreamCapped(url, SEC_RSS_STREAM_MAX_BYTES, maxPerFeed)
            : await getXml(url);
          if (!res.ok) {
            lastStatus = res.status;
            if (res.status === 404) continue;
            console.log(`RSS-SEC[${feed.lab}]: HTTP ${res.status} — skip`);
            break;
          }
          got = feed.streamCap
            ? truncateAfterNthEntry(res.body, maxPerFeed)
            : res.body;
          usedUrl = url;
          writeCache(cacheDir, feed.lab, got, now);
          break;
        } catch (err) {
          lastStatus = -1;
          console.log(`RSS-SEC[${feed.lab}]: fetch failed — ${String(err)}`);
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
      entries = feed.streamCap
        ? parseRssOrAtomCapped(xml, maxPerFeed)
        : parseRssOrAtom(xml).slice(0, maxPerFeed);
    } catch {
      feedsSkipped.push({ lab: feed.lab, reason: "bad XML" });
      continue;
    }

    if (!entries.length) {
      feedsSkipped.push({ lab: feed.lab, reason: "empty parse" });
      continue;
    }

    const mapped = toSecurityItems(entries, feed.lab);
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

export function toSecShelfItems(
  items: SecurityRssItem[],
): { href: string; label: string; reason: "rss-security-shelf" }[] {
  return items
    .filter((i) => i.shelfOnly)
    .map((i) => ({
      href: i.link,
      label: `${i.lab}: ${i.title}`.slice(0, 72),
      reason: "rss-security-shelf" as const,
    }));
}
