/** Intel plan 6 — box-only snapshot label for the setup bay (pure, no data imports: lazy setup chunk). */
export const SNAPSHOT_STALE_H = 24;
/** "snapshot · N rows · age Xh" (age vs the crawl stamp, so SSR is deterministic); stale when older than 24 h. */
export function snapshotLabel(snap: { rows: number; at: string | null }, nowIso: string): { text: string; stale: boolean } {
  const t = snap.at ? Date.parse(snap.at) : NaN;
  const now = Date.parse(nowIso);
  if (!Number.isFinite(t) || !Number.isFinite(now)) return { text: `snapshot · ${snap.rows} rows · age —`, stale: true };
  const h = Math.max(0, Math.floor((now - t) / 3_600_000));
  return { text: `snapshot · ${snap.rows} rows · age ${h}h`, stale: h > SNAPSHOT_STALE_H };
}
