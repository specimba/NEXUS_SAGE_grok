/**
 * Seen-index (AUTONOMY-4H Beat 2): canonical URL → first_seen, persisted at
 * artifacts/sage/seen-index.json. Pure — caller does IO. first_seen is stable
 * across runs; is_new ⇔ first seen in this crawl stamp.
 */

export const SEEN_RETENTION_DAYS = 30;

export type SeenEntry = { first_seen: string; last_seen: string; title?: string };

export type SeenIndex = {
  schema: 1;
  updated_at: string | null;
  entries: Record<string, SeenEntry>;
};

export function emptySeenIndex(): SeenIndex {
  return { schema: 1, updated_at: null, entries: {} };
}

export function parseSeenIndex(raw: unknown): SeenIndex {
  const out = emptySeenIndex();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Partial<SeenIndex>;
  out.updated_at = typeof r.updated_at === "string" ? r.updated_at : null;
  if (r.entries && typeof r.entries === "object") {
    for (const [k, v] of Object.entries(r.entries)) {
      if (v && typeof v.first_seen === "string") {
        out.entries[k] = {
          first_seen: v.first_seen,
          last_seen: typeof v.last_seen === "string" ? v.last_seen : v.first_seen,
          ...(v.title ? { title: v.title } : {}),
        };
      }
    }
  }
  return out;
}

/**
 * Mark keys seen at `stamp`. Existing first_seen never moves. Entries unseen for
 * > retentionDays are pruned (bounded file). Returns a new index.
 */
export function markSeen(
  prev: SeenIndex | null | undefined,
  items: readonly { key: string; title?: string }[],
  stamp: string,
  retentionDays = SEEN_RETENTION_DAYS,
): SeenIndex {
  const base = prev ? parseSeenIndex(prev) : emptySeenIndex();
  const entries: Record<string, SeenEntry> = {};
  const cutoff = Date.parse(stamp) - retentionDays * 86_400_000;
  for (const [k, v] of Object.entries(base.entries)) {
    const t = Date.parse(v.last_seen);
    if (Number.isFinite(t) && t >= cutoff) entries[k] = { ...v };
  }
  for (const it of items) {
    if (!it.key) continue;
    const cur = entries[it.key] ?? base.entries[it.key];
    if (cur) {
      entries[it.key] = { ...cur, last_seen: stamp };
    } else {
      entries[it.key] = { first_seen: stamp, last_seen: stamp, ...(it.title ? { title: it.title.slice(0, 160) } : {}) };
    }
  }
  const sorted: Record<string, SeenEntry> = {};
  for (const k of Object.keys(entries).sort()) sorted[k] = entries[k];
  return { schema: 1, updated_at: stamp, entries: sorted };
}

export function firstSeen(index: SeenIndex, key: string): string | undefined {
  return index.entries[key]?.first_seen;
}

export function isNew(index: SeenIndex, key: string, stamp: string): boolean {
  return index.entries[key]?.first_seen === stamp;
}
