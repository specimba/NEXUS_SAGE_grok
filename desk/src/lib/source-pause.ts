/**
 * PAUSED health cells. The crawl writes artifacts/sage/source-state.json (`sources.<id>.paused_until`);
 * scripts/build-stamp.mjs merges the ACTIVE pauses into the build at prebuild, so a pause shows even
 * when the last crawl's SOURCE_HEALTH predates it. A paused_until in the past is not paused — at build
 * time and again in the browser after mount. Pure helpers (no IO).
 */
export type SourcePause = { until: string; reason: string | null };
export type PauseMap = Record<string, SourcePause>;

type StateLike = { sources?: Record<string, { paused_until?: string | null; pause_reason?: string | null } | undefined> } | null | undefined;

/** Pauses still in force at `now` (paused_until strictly after now). */
export function activePauses(state: StateLike, now: number): PauseMap {
  const out: PauseMap = {};
  for (const [id, s] of Object.entries(state?.sources ?? {})) {
    const until = s?.paused_until ?? null;
    const t = Date.parse(until ?? "");
    if (until && Number.isFinite(t) && t > now) out[id] = { until, reason: s?.pause_reason ?? null };
  }
  return out;
}

/** Is `id` paused at `now`? (null now = trust the build-time merge.) */
export function isPausedAt(p: SourcePause | undefined, now: number | null): boolean {
  if (!p) return false;
  if (now == null) return true;
  return Date.parse(p.until) > now;
}
