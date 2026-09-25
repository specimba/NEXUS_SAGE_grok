/**
 * Beat 10 — "since you were here" (refs/UX-BEAT10-SINCE-HEAT.md). Pure helpers.
 * lastSeenAt lives in localStorage and is written on tab leave (visibilitychange hidden / pagehide),
 * never on load. The session's baseline is pinned in sessionStorage so a reload (which also fires
 * pagehide) keeps showing the same markers. First visit ever ⇒ no baseline ⇒ no markers.
 */
export const LAST_SEEN_KEY = "sage.lastSeenAt";
export const SESSION_BASE_KEY = "sage.sinceBase";
/** Session marker for "this tab started as a first-ever visit" — stays marker-free across reloads. */
export const FIRST_VISIT = "first";

/** Baseline for this tab session: pinned session value, else the stored last visit, else null. */
export function sinceBase(session: string | null, local: string | null): string | null {
  if (session === FIRST_VISIT) return null;
  const ok = (v: string | null) => (v && Number.isFinite(Date.parse(v)) ? v : null);
  return ok(session) ?? ok(local);
}

export function isSince(firstSeen: string | null | undefined, base: string | null): boolean {
  if (!base || !firstSeen) return false;
  const t = Date.parse(firstSeen);
  return Number.isFinite(t) && t > Date.parse(base);
}

/** Stable partition: "since" rows first (keep order), then the rest. */
export function partitionSince<T>(rows: readonly T[], firstSeen: (r: T) => string | null | undefined, base: string | null) {
  const since: T[] = [];
  const rest: T[] = [];
  for (const r of rows) (isSince(firstSeen(r), base) ? since : rest).push(r);
  return { since, rest };
}
