/**
 * Per-source pause state (crawl side). Persisted at artifacts/sage/source-state.json.
 * Committed-safe: holds no secrets (never an API key, only "anon" | "key" auth mode) and is
 * rebuildable (delete it → next failure/429 recreates it; missing file = nothing paused).
 *
 * Rules (OpenAlex first; generic for any source):
 *  · HTTP 429 → paused_until = now + Retry-After (delta-seconds or HTTP-date); no header →
 *    next midnight UTC (OpenAlex's daily budget resets then).
 *  · 3 consecutive failures (429 / 5xx / other HTTP / parse / network) → pause ≥ 24h.
 *    Both rules apply; the later paused_until wins.
 *  · While paused: skip the source entirely — no request, no retries.
 *  · A pause recorded under one auth mode (anon IP budget) does not bind the other (an API key
 *    has its own budget), so adding OPENALEX_API_KEY lifts an anonymous pause immediately.
 *  · Success resets the failure streak and clears the pause.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const FAILS_BEFORE_PAUSE = 3;
export const FAIL_PAUSE_MS = 24 * 60 * 60 * 1000;

export type AuthMode = "anon" | "key";
export type SourceRunStatus = "ok" | "fail" | "paused";

export type SourceStateEntry = {
  id: string;
  consecutive_failures: number;
  paused_until: string | null;
  pause_reason: string | null;
  paused_auth: AuthMode | null;
  last_attempt_at: string | null;
  last_ok_at: string | null;
  last_status: number | null;
  last_reason: string | null;
};

export type SourceStateFile = {
  schema: 1;
  updated_at: string | null;
  note: string;
  sources: Record<string, SourceStateEntry>;
};

const NOTE =
  "Crawl pause state — no secrets, rebuildable (delete to reset). Written by bun run ingest.";

export function isoSec(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function emptySourceState(): SourceStateFile {
  return { schema: 1, updated_at: null, note: NOTE, sources: {} };
}

function emptyEntry(id: string): SourceStateEntry {
  return {
    id,
    consecutive_failures: 0,
    paused_until: null,
    pause_reason: null,
    paused_auth: null,
    last_attempt_at: null,
    last_ok_at: null,
    last_status: null,
    last_reason: null,
  };
}

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function parseSourceState(raw: unknown): SourceStateFile {
  const out = emptySourceState();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Partial<SourceStateFile>;
  out.updated_at = str(r.updated_at);
  if (r.sources && typeof r.sources === "object") {
    for (const [id, e] of Object.entries(r.sources)) {
      if (!e || typeof e !== "object") continue;
      const x = e as Partial<SourceStateEntry>;
      out.sources[id] = {
        id,
        consecutive_failures: Math.max(0, Math.floor(Number(x.consecutive_failures) || 0)),
        paused_until: str(x.paused_until),
        pause_reason: str(x.pause_reason),
        paused_auth: x.paused_auth === "key" || x.paused_auth === "anon" ? x.paused_auth : null,
        last_attempt_at: str(x.last_attempt_at),
        last_ok_at: str(x.last_ok_at),
        last_status: Number.isFinite(Number(x.last_status)) && x.last_status != null ? Number(x.last_status) : null,
        last_reason: str(x.last_reason),
      };
    }
  }
  return out;
}

export function readSourceState(path: string): SourceStateFile {
  if (!existsSync(path)) return emptySourceState();
  try {
    return parseSourceState(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return emptySourceState();
  }
}

export function writeSourceState(path: string, state: SourceStateFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

/** Next 00:00:00 UTC strictly after `now`. */
export function nextMidnightUtc(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** Retry-After (delta-seconds or HTTP-date) → absolute epoch ms, uncapped. null if absent/invalid. */
export function retryAfterUntil(header: string | null | undefined, now: number): number | null {
  if (header == null) return null;
  const raw = String(header).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return now + Number(raw) * 1000;
  const when = Date.parse(raw);
  if (!Number.isFinite(when)) return null;
  return Math.max(now, when);
}

/** Active pause for `id` under `auth`, or null. */
export function activePause(
  state: SourceStateFile,
  id: string,
  now: number,
  auth: AuthMode = "anon",
): { until: string; reason: string | null } | null {
  const e = state.sources[id];
  if (!e?.paused_until) return null;
  const until = Date.parse(e.paused_until);
  if (!Number.isFinite(until) || until <= now) return null;
  if (e.paused_auth && e.paused_auth !== auth) return null;
  return { until: e.paused_until, reason: e.pause_reason };
}

export type NetworkOutcome =
  | { ok: true }
  | { ok: false; status: number | null; reason: string; retryAfter?: string | null };

/** Apply one network outcome (never call for cache hits / skipped runs). Pure. */
export function recordSourceOutcome(
  state: SourceStateFile,
  id: string,
  o: NetworkOutcome,
  now: number,
  auth: AuthMode = "anon",
): SourceStateFile {
  const prev = state.sources[id] ?? emptyEntry(id);
  const at = isoSec(now);
  let next: SourceStateEntry;
  if (o.ok) {
    next = {
      ...prev,
      consecutive_failures: 0,
      paused_until: null,
      pause_reason: null,
      paused_auth: null,
      last_attempt_at: at,
      last_ok_at: at,
      last_status: 200,
      last_reason: null,
    };
  } else {
    const fails = prev.consecutive_failures + 1;
    const cands: { until: number; why: string }[] = [];
    if (o.status === 429) {
      const ra = retryAfterUntil(o.retryAfter ?? null, now);
      cands.push(
        ra != null
          ? { until: ra, why: `HTTP 429 Retry-After ${String(o.retryAfter).trim()}` }
          : { until: nextMidnightUtc(now), why: "HTTP 429 no Retry-After → next midnight UTC" },
      );
    }
    if (fails >= FAILS_BEFORE_PAUSE) {
      cands.push({ until: now + FAIL_PAUSE_MS, why: `${fails} consecutive failures → 24h` });
    }
    const best = cands.sort((a, b) => b.until - a.until)[0];
    next = {
      ...prev,
      consecutive_failures: fails,
      paused_until: best ? isoSec(best.until) : null,
      pause_reason: best ? best.why : null,
      paused_auth: best ? auth : null,
      last_attempt_at: at,
      last_status: o.status,
      last_reason: o.reason.slice(0, 200),
    };
  }
  return { schema: 1, updated_at: at, note: NOTE, sources: { ...state.sources, [id]: next } };
}
