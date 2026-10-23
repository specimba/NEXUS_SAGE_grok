/**
 * PASS-N — "new since your last visit" ticks (refs/PASS-N-NEW-TICKS.md §N4). Pure helpers.
 * Reuses Beat 10's localStorage record (LAST_SEEN_KEY): legacy plain ISO, or JSON { seen_at, keys }.
 * No `keys` (first visit, legacy, corrupt, future seen_at, storage throws) ⇒ no ticks this visit.
 */
import { canonicalizeUrl } from "@/lib/canon-url";
import { LAST_SEEN_KEY, TICK_SR, isSince } from "@/lib/since";

export { TICK_SR };

export const KEYS_CAP = 400;
const SKEW_MS = 600_000;
const iso = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));

export type SeenRecord = { seen_at: string | null; keys: string[] | null };

export function readSeen(raw: string | null): SeenRecord {
  if (iso(raw)) return { seen_at: raw, keys: null };
  try {
    const o = JSON.parse(raw!);
    if (o && !Array.isArray(o) && Array.isArray(o.keys) && o.keys.every((k: unknown) => typeof k === "string"))
      return { seen_at: iso(o.seen_at) ? o.seen_at : null, keys: o.keys };
  } catch {}
  return { seen_at: null, keys: null };
}

/** Same row key as PASS-W: canonical URL, row id when the row has no URL. */
export const rowKey = (url: string | null | undefined, id: string) => (url ? canonicalizeUrl(url) : id);

/** Gmail and X rows never tick. */
export const tickable = (memberId: string) => !/^(gmail|x):/.test(memberId);

export function isTick(key: string, firstSeen: string | null | undefined, base: string | null, seen: Set<string> | null, paper = false) {
  return !!seen && !seen.has(key) && (paper || isSince(firstSeen, base));
}

/** Current visit's keys first, then the previous ones; deduped, capped at KEYS_CAP. */
export const mergeKeys = (cur: readonly string[], prev: readonly string[] | null) => [...new Set([...cur, ...(prev ?? [])])].slice(0, KEYS_CAP);

/** Any row with an id and a URL (`url`, papers: `abs`). */
export type TickRow = { id: string; url?: string | null; abs?: string | null };
const keyOf = (r: TickRow) => rowKey(r.url ?? r.abs, r.id);

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void } | null;

export function openVisit(store: Store, now = Date.now()) {
  let raw: string | null = null;
  try {
    raw = store?.getItem(LAST_SEEN_KEY) ?? null;
  } catch {}
  const rec = readSeen(raw);
  const ok = rec.keys && rec.seen_at && Date.parse(rec.seen_at) <= now + SKEW_MS;
  const noted: string[] = [];
  const save = (at: string | null) => {
    try {
      store?.setItem(LAST_SEEN_KEY, JSON.stringify({ seen_at: at, keys: mergeKeys(noted, rec.keys) }));
    } catch {}
  };
  const seen = ok ? new Set(rec.keys) : null;
  return {
    seen,
    /** Register on-screen rows (Wire / Pulse / Papers) — key order = render order. */
    note: (rows: readonly (TickRow | string)[]) => {
      for (const r of rows) {
        const k = typeof r === "string" ? r : keyOf(r);
        if (!noted.includes(k)) noted.push(k);
      }
    },
    flush: () => save(rec.seen_at),
    leave: () => save(new Date().toISOString()),
    /** Wire / Pulse row: tickable lead (never Gmail / X), key not seen, first-seen after base. */
    tick: (r: TickRow, firstSeen: string | null | undefined, base: string | null, lead = "") =>
      tickable(lead) && isTick(keyOf(r), firstSeen, base, seen),
    /** Paper row: key not seen alone (§N4.3). */
    paper: (r: TickRow) => isTick(keyOf(r), null, null, seen, true),
  };
}

export type Visit = ReturnType<typeof openVisit>;
