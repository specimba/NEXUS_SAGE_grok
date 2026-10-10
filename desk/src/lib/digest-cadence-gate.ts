// Pass A2 — pure cadence gate, split from digest-pack.ts so the client never pulls the Sep pack renderer.
export const CADENCE_MS = 6 * 60 * 60 * 1000;
/** Browser mirror key — disk `digest-last.json` is truth. */
export const PACK_KEY = "sage-digest-last";

export type DigestLast = {
  last_at: string;
  next_at: string;
  pack_id: string;
};

export function nextDue(lastIso: string | null, now = Date.now()) {
  if (!lastIso) return { due: true, nextAt: new Date(now).toISOString(), ageH: Infinity };
  const last = Date.parse(lastIso);
  const next = last + CADENCE_MS;
  return { due: now >= next, nextAt: new Date(next).toISOString(), ageH: (now - last) / 3_600_000 };
}

/**
 * Cadence gate from digest-last.json shape.
 * Missing file → due. If now < next_at → HOLD.
 * (Pure — no node:fs; disk I/O lives in digest-pack-disk.ts.)
 */
export function isDigestDue(last: DigestLast | null, now = Date.now()) {
  if (!last) {
    return { due: true as const, reason: "missing" as const, nextAt: new Date(now).toISOString() };
  }
  const nextMs = Date.parse(last.next_at);
  if (Number.isFinite(nextMs) && now < nextMs) {
    return { due: false as const, reason: "hold" as const, nextAt: last.next_at };
  }
  if (!Number.isFinite(nextMs)) {
    const fromLast = nextDue(last.last_at, now);
    return {
      due: fromLast.due,
      reason: fromLast.due ? ("due" as const) : ("hold" as const),
      nextAt: fromLast.nextAt,
    };
  }
  return { due: true as const, reason: "due" as const, nextAt: new Date(now + CADENCE_MS).toISOString() };
}

/** Pack stem: YYYY-MM-DDTHH (UTC hour). */
export function packStamp(now: Date | number = Date.now()): string {
  const d = typeof now === "number" ? new Date(now) : now;
  return d.toISOString().slice(0, 13);
}
