/**
 * Source health ledger (AUTONOMY-4H Beat 2). Pure — caller does IO.
 * Persisted at artifacts/sage/source-health.json by every real ingest.
 */

export const HEALTH_WINDOW_DAYS = 7;
const DAY_MS = 86_400_000;

export type SourceOutcome = {
  id: string;
  ok: boolean;
  items: number;
  reason?: string | null;
};

export type HealthEvent = {
  at: string;
  ok: boolean;
  items: number;
  reason?: string;
};

export type SourceHealthEntry = {
  id: string;
  last_ok: string | null;
  last_fail: string | null;
  fail_reason: string | null;
  streak_ok: number;
  streak_fail: number;
  items_last: number;
  history: HealthEvent[];
};

export type SourceHealthLedger = {
  schema: 1;
  updated_at: string | null;
  window_days: number;
  sources: Record<string, SourceHealthEntry>;
};

export type SourceHealthState = "ok" | "flaky" | "fail";

export function emptyLedger(): SourceHealthLedger {
  return { schema: 1, updated_at: null, window_days: HEALTH_WINDOW_DAYS, sources: {} };
}

/** Accept unknown JSON; return a valid ledger (drop malformed entries). */
export function parseLedger(raw: unknown): SourceHealthLedger {
  const out = emptyLedger();
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Partial<SourceHealthLedger>;
  out.updated_at = typeof r.updated_at === "string" ? r.updated_at : null;
  if (r.sources && typeof r.sources === "object") {
    for (const [id, e] of Object.entries(r.sources)) {
      if (!e || typeof e !== "object") continue;
      out.sources[id] = {
        id,
        last_ok: e.last_ok ?? null,
        last_fail: e.last_fail ?? null,
        fail_reason: e.fail_reason ?? null,
        streak_ok: Number(e.streak_ok) || 0,
        streak_fail: Number(e.streak_fail) || 0,
        items_last: Number(e.items_last) || 0,
        history: Array.isArray(e.history)
          ? e.history.filter((h) => h && typeof h.at === "string" && typeof h.ok === "boolean")
          : [],
      };
    }
  }
  return out;
}

export function pruneHistory(history: readonly HealthEvent[], now: string, days = HEALTH_WINDOW_DAYS): HealthEvent[] {
  const cutoff = Date.parse(now) - days * DAY_MS;
  return history.filter((h) => {
    const t = Date.parse(h.at);
    return Number.isFinite(t) && t >= cutoff;
  });
}

export function applyOutcome(
  prev: SourceHealthEntry | undefined,
  o: SourceOutcome,
  at: string,
): SourceHealthEntry {
  const base: SourceHealthEntry = prev ?? {
    id: o.id,
    last_ok: null,
    last_fail: null,
    fail_reason: null,
    streak_ok: 0,
    streak_fail: 0,
    items_last: 0,
    history: [],
  };
  const reason = o.ok ? undefined : (o.reason || "unknown").slice(0, 200);
  const ev: HealthEvent = { at, ok: o.ok, items: Math.max(0, Math.floor(o.items || 0)) };
  if (reason) ev.reason = reason;
  return {
    id: o.id,
    last_ok: o.ok ? at : base.last_ok,
    last_fail: o.ok ? base.last_fail : at,
    fail_reason: o.ok ? base.fail_reason : reason!,
    streak_ok: o.ok ? base.streak_ok + 1 : 0,
    streak_fail: o.ok ? 0 : base.streak_fail + 1,
    items_last: ev.items,
    history: pruneHistory([...base.history, ev], at),
  };
}

export function updateLedger(
  prev: SourceHealthLedger | null | undefined,
  outcomes: readonly SourceOutcome[],
  at: string,
): SourceHealthLedger {
  const base = prev ? parseLedger(prev) : emptyLedger();
  const sources: Record<string, SourceHealthEntry> = {};
  for (const [id, e] of Object.entries(base.sources)) {
    sources[id] = { ...e, history: pruneHistory(e.history, at) };
  }
  for (const o of outcomes) sources[o.id] = applyOutcome(base.sources[o.id], o, at);
  return { schema: 1, updated_at: at, window_days: HEALTH_WINDOW_DAYS, sources };
}

export function healthState(e: SourceHealthEntry): SourceHealthState {
  if (e.streak_fail > 0) return e.streak_fail >= 2 || !e.last_ok ? "fail" : "flaky";
  const fails = e.history.filter((h) => !h.ok).length;
  return fails > 0 ? "flaky" : "ok";
}

export type SourceHealthRow = {
  id: string;
  state: SourceHealthState;
  last_ok: string | null;
  last_fail: string | null;
  fail_reason: string | null;
  streak_ok: number;
  streak_fail: number;
  items_last: number;
  runs_7d: number;
  ok_7d: number;
};

export function summarizeLedger(l: SourceHealthLedger): SourceHealthRow[] {
  return Object.values(l.sources)
    .map((e) => ({
      id: e.id,
      state: healthState(e),
      last_ok: e.last_ok,
      last_fail: e.last_fail,
      fail_reason: e.fail_reason,
      streak_ok: e.streak_ok,
      streak_fail: e.streak_fail,
      items_last: e.items_last,
      runs_7d: e.history.length,
      ok_7d: e.history.filter((h) => h.ok).length,
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
