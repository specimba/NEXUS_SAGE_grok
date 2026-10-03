/**
 * Request pacing shared by the polite sources (HN, Google News RSS, lab RSS, security RSS).
 * Production uses each source's *_MIN_INTERVAL_MS and the real timer; tests inject
 * `minIntervalMs: 0` (or a fake `sleep`) through the fetch options so the suite never waits on wall time.
 */
export type Pace = {
  /** Gap between live requests (default: the source's *_MIN_INTERVAL_MS). */
  minIntervalMs?: number;
  /** Sleep override (tests). */
  sleep?: (ms: number) => Promise<void>;
};

export function realSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wait until `minIntervalMs` has passed since `lastRequestAt` (0 = never requested). */
export async function paceWait(lastRequestAt: number, defaultMs: number, pace: Pace = {}): Promise<void> {
  const min = pace.minIntervalMs ?? defaultMs;
  const gap = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && min > 0 && gap < min) await (pace.sleep ?? realSleep)(min - gap);
}
