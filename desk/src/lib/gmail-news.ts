/**
 * Pass F — Gmail keyword news → Pulse (never Brief).
 * Search Canberk's Gmail for AI/tech/security/paper mail; rank by quality-in-time (qi);
 * emit ≤12 Pulse rows (`source: "gmail-news"`, briefEligible: false, pulse_only: true).
 * Soft-fail on auth/quota/5xx/timeout — crawl + publish still succeed.
 * Spec: refs/PASS-F-GMAIL-NEWS.md. DENY: paid X · Bluesky · pasted Atom URL lists · inventing Brief pins.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export const GMAIL_NEWS_SOURCE = "gmail-news" as const;
export const GMAIL_FETCH_CAP = 24;
export const GMAIL_EMIT_CAP = 12;
export const GMAIL_SOFT_TIMEOUT_MS = 15_000;
export const GMAIL_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const GMAIL_CACHE_DIR_NAME = "gmail-news-cache";

/** Seed keywords that must stay covered by the query builder. */
export const GMAIL_SEED_KEYWORDS = [
  "AI",
  "newsletter",
  "tech",
  "LLM",
  "intelligence",
  "hack",
  "security",
  "paper",
] as const;

/** Canonical Gmail search (pass mark). Variants allowed; seed set stays covered. */
export const GMAIL_QUERY = [
  "(",
  'subject:(AI OR "artificial intelligence" OR LLM OR "large language" OR GPT OR Claude OR "machine learning" OR ML)',
  ' OR subject:(newsletter OR digest OR weekly OR "daily brief")',
  " OR subject:(tech OR technology OR hack OR hacking OR security OR CVE OR paper OR arXiv OR research)",
  ' OR "artificial intelligence" OR LLM OR newsletter OR "security advisory"',
  ")",
  " newer_than:14d",
  " -in:spam",
].join("");

export type GmailPriority = "P1" | "P2" | "P3";

export type GmailNewsHit = {
  id: string; // gmail:<messageId>
  messageId: string;
  threadId: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  from: string;
  publisher: string;
  source: typeof GMAIL_NEWS_SOURCE;
  pulseEligible: true;
  briefEligible: false;
  pulse_only: true;
  digestRefOk: false;
  qi: number;
  priority: GmailPriority;
  tag: "rest" | "rumor" | "companion" | "incident";
};

export type GmailRawMessage = {
  id: string;
  threadId?: string;
  subject?: string;
  snippet?: string;
  sender?: string;
  date?: string;
  viewUrl?: string;
};

export type GmailNewsResult = {
  ok: boolean;
  soft_fail: boolean;
  soft_fail_reason: string | null;
  query: string;
  query_hash: string;
  fetched: number;
  items: GmailNewsHit[];
  from_cache: boolean;
  duration_ms: number;
};

const NOISE_FROM =
  /accounts\.google\.com|noreply-accounts@google|turna\.com|brita\.net|pitchfork\.com|securityalert|2fa|verification code|receipt@|calendar-notification|noreply@youtube/i;
const NOISE_SUBJECT =
  /^(security alert|you shared some google account|verify your|your order|receipt|invoice|password reset|sign-in attempt|2-step|otp\b)/i;
const PROMO_SUBJECT = /\b(save \d+%|% off|deal sichern|tatilini|u[cç]ak bileti|spotify premium)\b/i;

export function queryHash(q: string = GMAIL_QUERY): string {
  return createHash("sha1").update(q).digest("hex").slice(0, 12);
}

export function buildGmailQuery(): string {
  // Seed coverage check is a test concern; this returns the canonical query.
  return GMAIL_QUERY;
}

export function publisherFromSender(sender: string): string {
  const s = String(sender ?? "").trim();
  const angle = s.match(/<([^>]+)>/);
  const email = (angle ? angle[1]! : s).trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 0) return s.slice(0, 40) || "gmail";
  const host = email.slice(at + 1).replace(/^mail\.|^newsletter\.|^news\.|^comms\./, "");
  const root = host.split(".").slice(-2).join(".");
  return root || host || "gmail";
}

export function extractLink(snippet: string, viewUrl?: string): string | null {
  const text = String(snippet ?? "");
  const m = text.match(/https?:\/\/[^\s<>"')\]]+/i);
  if (m) {
    const u = m[0]!.replace(/[),.]+$/, "");
    if (/unsubscribe|mailto:|preference/i.test(u)) return viewUrl || null;
    return u;
  }
  return viewUrl || null;
}

export function isNoise(msg: Pick<GmailRawMessage, "subject" | "sender" | "snippet">): boolean {
  const sub = String(msg.subject ?? "");
  const from = String(msg.sender ?? "");
  if (NOISE_FROM.test(from)) return true;
  if (NOISE_SUBJECT.test(sub)) return true;
  if (PROMO_SUBJECT.test(sub)) return true;
  // Pure account / OAuth share notices
  if (/google account data|allowed .+ access to some of your google/i.test(String(msg.snippet ?? ""))) return true;
  return false;
}

const SEED_RE = [
  /\bAI\b/i,
  /artificial intelligence/i,
  /\bLLM\b/i,
  /large language/i,
  /\bGPT\b/i,
  /Claude/i,
  /machine learning|\bML\b/i,
  /newsletter|digest|daily brief/i,
  /\btech(?:nology)?\b/i,
  /\bhack(?:ing|er)?\b/i,
  /security|CVE|cyber/i,
  /\bpaper\b|arXiv|research/i,
  /intelligence/i,
];

export function topicHitDensity(subject: string, snippet: string): number {
  const text = `${subject}\n${snippet}`;
  let n = 0;
  for (const re of SEED_RE) if (re.test(text)) n++;
  return n;
}

export function senderTrust(from: string): number {
  const f = from.toLowerCase();
  if (/@(substack|beehiiv|axios|theinformation|techstrong|infosecurity|securityweek|ghost\.io|crewai|metr\.|divenewsletter|alvarocintas)/.test(f))
    return 2;
  if (/newsletter|news@|hello@|ai\.plus|404-media/.test(f)) return 1.5;
  if (/noreply|no-reply|donotreply/.test(f)) return 0.5;
  return 1;
}

/** Quality-in-time: topic density × recency decay × sender trust. Past 72h decays hard for Pulse rank. */
export function qualityInTime(opts: {
  subject: string;
  snippet: string;
  from: string;
  published: string;
  now?: number;
  hasArticleUrl?: boolean;
}): { qi: number; priority: GmailPriority } {
  const now = opts.now ?? Date.now();
  const t = Date.parse(opts.published);
  const ageH = Number.isFinite(t) ? Math.max(0, (now - t) / 3_600_000) : 48;
  const recency = ageH <= 24 ? 1 : ageH <= 72 ? 0.7 : ageH <= 168 ? 0.35 : 0.15;
  const density = topicHitDensity(opts.subject, opts.snippet);
  const trust = senderTrust(opts.from);
  const linkBoost = opts.hasArticleUrl ? 1.1 : 0.85;
  const qi = Math.round(density * 10 * recency * trust * linkBoost * 10) / 10;
  const priority: GmailPriority = qi >= 40 ? "P1" : qi >= 18 ? "P2" : "P3";
  return { qi, priority };
}

export function toHit(msg: GmailRawMessage, now?: number): GmailNewsHit | null {
  if (!msg.id) return null;
  if (isNoise(msg)) return null;
  const title = String(msg.subject ?? "").trim() || "(no subject)";
  const snippet = String(msg.snippet ?? "");
  const link = extractLink(snippet, msg.viewUrl);
  if (!link) return null;
  const from = String(msg.sender ?? "");
  const published = msg.date && Number.isFinite(Date.parse(msg.date)) ? new Date(msg.date).toISOString().replace(/\.\d{3}Z$/, "Z") : new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const hasArticleUrl = /^https?:\/\//i.test(link) && !/mail\.google\.com/i.test(link);
  const { qi, priority } = qualityInTime({
    subject: title,
    snippet,
    from,
    published,
    now,
    hasArticleUrl,
  });
  if (qi < 5 && densityZero(title, snippet)) return null;
  return {
    id: `gmail:${msg.id}`,
    messageId: msg.id,
    threadId: msg.threadId || msg.id,
    title,
    link,
    published,
    summary: snippet.slice(0, 280),
    from,
    publisher: publisherFromSender(from),
    source: GMAIL_NEWS_SOURCE,
    pulseEligible: true,
    briefEligible: false,
    pulse_only: true,
    digestRefOk: false,
    qi,
    priority,
    tag: /security|CVE|hack|vulnerab/i.test(title) ? "incident" : "rest",
  };
}

function densityZero(subject: string, snippet: string) {
  return topicHitDensity(subject, snippet) === 0;
}

/** Dedupe by message-id; keep highest qi. Cap emit at GMAIL_EMIT_CAP, sorted qi then freshness. */
export function rankAndEmit(hits: GmailNewsHit[], cap = GMAIL_EMIT_CAP): GmailNewsHit[] {
  const byId = new Map<string, GmailNewsHit>();
  for (const h of hits) {
    const prev = byId.get(h.messageId);
    if (!prev || h.qi > prev.qi) byId.set(h.messageId, h);
  }
  return [...byId.values()]
    .sort((a, b) => b.qi - a.qi || Date.parse(b.published) - Date.parse(a.published) || a.id.localeCompare(b.id))
    .slice(0, cap);
}

export function cacheDir(root?: string): string {
  const desk = root ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
  return resolve(desk, "artifacts/sage", GMAIL_CACHE_DIR_NAME);
}

export type CachedMessage = {
  messageId: string;
  subject: string;
  link: string;
  snippet: string;
  from: string;
  published: string;
  viewUrl?: string;
  cached_at: string;
};

export function writeMessageCache(dir: string, msg: CachedMessage): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${msg.messageId}.json`), JSON.stringify(msg));
}

export function pruneCache(dir: string, now = Date.now(), ttl = GMAIL_CACHE_TTL_MS): number {
  if (!existsSync(dir)) return 0;
  let dropped = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") || name === "last-search.json") continue;
    const p = join(dir, name);
    try {
      const j = JSON.parse(readFileSync(p, "utf8")) as CachedMessage;
      const t = Date.parse(j.cached_at || j.published);
      if (!Number.isFinite(t) || now - t > ttl) {
        unlinkSync(p);
        dropped++;
      }
    } catch {
      try {
        if (now - statSync(p).mtimeMs > ttl) {
          unlinkSync(p);
          dropped++;
        }
      } catch { /* ignore */ }
    }
  }
  return dropped;
}

export function cacheHits(dir: string, now = Date.now()): GmailNewsHit[] {
  if (!existsSync(dir)) return [];
  const out: GmailNewsHit[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") || name === "last-search.json") continue;
    try {
      const j = JSON.parse(readFileSync(join(dir, name), "utf8")) as CachedMessage;
      const t = Date.parse(j.cached_at || j.published);
      if (Number.isFinite(t) && now - t > GMAIL_CACHE_TTL_MS) continue;
      const hit = toHit(
        {
          id: j.messageId,
          subject: j.subject,
          snippet: j.snippet,
          sender: j.from,
          date: j.published,
          viewUrl: j.viewUrl || j.link,
        },
        now,
      );
      if (hit) out.push(hit);
    } catch { /* skip */ }
  }
  return out;
}

/**
 * Process a search_threads-shaped payload (MCP or fixture) into Pulse hits + cache.
 * Pure enough for tests: pass `raw.threads`.
 */
export function ingestSearchPayload(
  payload: { threads?: Array<{ id?: string; messages?: GmailRawMessage[]; viewUrl?: string }> },
  opts: { cacheDir?: string; now?: number; query?: string } = {},
): GmailNewsResult {
  const t0 = Date.now();
  const query = opts.query ?? GMAIL_QUERY;
  const now = opts.now ?? Date.now();
  const dir = opts.cacheDir;
  const raw: GmailRawMessage[] = [];
  for (const th of payload.threads ?? []) {
    const msgs = th.messages?.length ? th.messages : [];
    for (const m of msgs) {
      raw.push({
        id: m.id || th.id || "",
        threadId: m.threadId || th.id,
        subject: m.subject,
        snippet: m.snippet,
        sender: m.sender,
        date: m.date,
        viewUrl: m.viewUrl || th.viewUrl,
      });
    }
  }
  const fetched = Math.min(raw.length, GMAIL_FETCH_CAP);
  const hits: GmailNewsHit[] = [];
  for (const m of raw.slice(0, GMAIL_FETCH_CAP)) {
    const hit = toHit(m, now);
    if (!hit) continue;
    hits.push(hit);
    if (dir) {
      writeMessageCache(dir, {
        messageId: hit.messageId,
        subject: hit.title,
        link: hit.link,
        snippet: hit.summary,
        from: hit.from,
        published: hit.published,
        viewUrl: m.viewUrl,
        cached_at: new Date(now).toISOString(),
      });
    }
  }
  if (dir) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "last-search.json"),
      JSON.stringify({ query, query_hash: queryHash(query), at: new Date(now).toISOString(), fetched, emitted: hits.length }),
    );
    pruneCache(dir, now);
  }
  const items = rankAndEmit(hits);
  return {
    ok: true,
    soft_fail: false,
    soft_fail_reason: null,
    query,
    query_hash: queryHash(query),
    fetched,
    items,
    from_cache: false,
    duration_ms: Date.now() - t0,
  };
}

export type GmailFetcher = (query: string, signal: AbortSignal) => Promise<{ threads: Array<{ id?: string; messages?: GmailRawMessage[]; viewUrl?: string }> }>;

/**
 * Live run: call fetcher (Gmail REST or MCP bridge) with 15s soft timeout.
 * On failure → soft_fail, optionally fall back to fresh cache hits.
 */
export async function runGmailNews(opts: {
  fetcher?: GmailFetcher;
  cacheDir?: string;
  now?: number;
  timeoutMs?: number;
}): Promise<GmailNewsResult> {
  const t0 = Date.now();
  const query = GMAIL_QUERY;
  const qh = queryHash(query);
  const dir = opts.cacheDir ?? cacheDir();
  const timeoutMs = opts.timeoutMs ?? GMAIL_SOFT_TIMEOUT_MS;
  const now = opts.now ?? Date.now();

  const mcpDump = join(dir, "last-mcp-search.json");
  if (!opts.fetcher && existsSync(mcpDump)) {
    try {
      const st = statSync(mcpDump);
      if (now - st.mtimeMs < 6 * 60 * 60 * 1000) {
        const payload = JSON.parse(readFileSync(mcpDump, "utf8"));
        return ingestSearchPayload(payload, { cacheDir: dir, now, query });
      }
    } catch { /* fall through */ }
  }

  if (!opts.fetcher) {
    // No live transport: use cache if any, else honest soft.
    const cached = rankAndEmit(cacheHits(dir, now));
    if (cached.length) {
      return {
        ok: true,
        soft_fail: false,
        soft_fail_reason: null,
        query,
        query_hash: qh,
        fetched: cached.length,
        items: cached,
        from_cache: true,
        duration_ms: Date.now() - t0,
      };
    }
    return {
      ok: false,
      soft_fail: true,
      soft_fail_reason: "no Gmail fetcher / empty cache",
      query,
      query_hash: qh,
      fetched: 0,
      items: [],
      from_cache: false,
      duration_ms: Date.now() - t0,
    };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const payload = await opts.fetcher(query, ac.signal);
    clearTimeout(timer);
    return ingestSearchPayload(payload, { cacheDir: dir, now, query });
  } catch (err) {
    clearTimeout(timer);
    const reason =
      ac.signal.aborted || (err instanceof Error && err.name === "AbortError")
        ? `timeout ${timeoutMs}ms`
        : /401|unauthorized/i.test(String(err))
          ? "HTTP 401"
          : String(err).slice(0, 160);
    const cached = rankAndEmit(cacheHits(dir, now));
    return {
      ok: cached.length > 0,
      soft_fail: true,
      soft_fail_reason: reason,
      query,
      query_hash: qh,
      fetched: cached.length,
      items: cached,
      from_cache: cached.length > 0,
      duration_ms: Date.now() - t0,
    };
  }
}

/** Gmail REST users.messages.list + get when GMAIL_ACCESS_TOKEN (or GOOGLE_ACCESS_TOKEN) is set. */
export function envTokenFetcher(token: string): GmailFetcher {
  return async (query, signal) => {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
    listUrl.searchParams.set("q", query);
    listUrl.searchParams.set("maxResults", String(GMAIL_FETCH_CAP));
    const listRes = await fetch(listUrl, { signal, headers: { Authorization: `Bearer ${token}` } });
    if (listRes.status === 401) throw new Error("HTTP 401");
    if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
    const list = (await listRes.json()) as { threads?: { id: string }[] };
    const threads: Array<{ id: string; messages: GmailRawMessage[]; viewUrl?: string }> = [];
    for (const t of (list.threads ?? []).slice(0, GMAIL_FETCH_CAP)) {
      const getUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
      const gr = await fetch(getUrl, { signal, headers: { Authorization: `Bearer ${token}` } });
      if (!gr.ok) continue;
      const body = (await gr.json()) as {
        id: string;
        messages?: Array<{
          id: string;
          snippet?: string;
          internalDate?: string;
          payload?: { headers?: { name: string; value: string }[] };
        }>;
      };
      const messages: GmailRawMessage[] = (body.messages ?? []).map((m) => {
        const headers = Object.fromEntries((m.payload?.headers ?? []).map((h) => [h.name.toLowerCase(), h.value]));
        const ms = m.internalDate ? Number(m.internalDate) : NaN;
        return {
          id: m.id,
          threadId: body.id,
          subject: headers.subject,
          snippet: m.snippet,
          sender: headers.from,
          date: Number.isFinite(ms) ? new Date(ms).toISOString() : headers.date,
          viewUrl: `https://mail.google.com/mail/#all/${body.id}`,
        };
      });
      threads.push({ id: body.id, messages, viewUrl: `https://mail.google.com/mail/#all/${body.id}` });
    }
    return { threads };
  };
}

export function tokenFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const t = env.GMAIL_ACCESS_TOKEN || env.GOOGLE_ACCESS_TOKEN || env.GMAIL_TOKEN;
  return t && t.length > 8 ? t : null;
}
