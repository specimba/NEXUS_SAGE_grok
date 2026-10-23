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
/** PASS-N — screen-reader text of the new-since-last-visit dot. */
export const TICK_SR = "new since your last visit";

/** Baseline for this tab session: pinned session value, else the stored last visit, else null. */
export function sinceBase(session: string | null, local: string | null): string | null {
  if (session === FIRST_VISIT) return null;
  const ok = (v: string | null) => (v && Number.isFinite(Date.parse(v)) ? v : null);
  // PASS-N: the stored record is JSON { seen_at, keys }. §N5.1 cut: no legacy plain-ISO fallback — an old record resets.
  let at: unknown = null;
  try {
    at = JSON.parse(local!).seen_at;
  } catch {}
  return ok(session) ?? ok(typeof at === "string" ? at : null);
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
