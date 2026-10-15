/**
 * UX-1 clearance plate — pure helpers for the Brief lead plate (client-safe: no crawl data, no runtime imports).
 * Gate rail = the pick rule as three gates (≥2 SRC · own publisher · fresh); HELD → SIGNAL HOLD card with the closest
 * candidate's rail, where the gate that failed is the ONLY amber chip. Time bar = elapsed / total between two slots.
 */
import { CRAWL_SLOT_HOURS, CRAWL_SLOT_MINUTE } from "@/lib/lead-view";
import type { LeadClosest } from "@/lib/lead-pick";

const H = 3_600_000;
const IST = 3 * H; // Europe/Istanbul is fixed UTC+3
/** lead-pick.ts LEAD_PICK_HOUR / LEAD_RETRY_BEFORE_HOUR / LEAD_MAX_AGE_H / LEAD_STALE_AGE_H (kept literal: no picker in the client chunk). */
const PICK_H = 6;
const RETRY_BEFORE_H = 21;
const MAX_AGE_H = 36;
const STALE_AGE_H = 48;

const istDate = (ms: number) => new Date(ms + IST).toISOString().slice(0, 10);

/**
 * Next crawl slot strictly after `now` that can make a lead: on `date` (a HELD date) a retry slot 06–20h; on any later
 * Istanbul date the first slot from 06:00 (a new day's pick, catch-up included). `held=false`: only later dates.
 */
export function nextLeadSlot(now: number, date: string, held: boolean): number {
  const d0 = Date.parse(`${istDate(now)}T00:00:00Z`) - IST;
  for (let day = 0; day < 4; day++)
    for (const h of CRAWL_SLOT_HOURS) {
      const t = d0 + day * 24 * H + h * H + CRAWL_SLOT_MINUTE * 60_000;
      if (t <= now || h < PICK_H) continue;
      const sd = istDate(t);
      if (sd > date || (held && sd === date && h < RETRY_BEFORE_H)) return t;
    }
  return NaN;
}

export type Burn = { pct: number; left: string };
/** Share of [from, to] already elapsed at `now` (0–100, whole %), and the time left as "5h 55m". */
export function burn(from: number, to: number, now: number): Burn {
  const span = to - from;
  const pct = span > 0 ? Math.round(Math.min(1, Math.max(0, (now - from) / span)) * 100) : 100;
  const m = Math.max(0, Math.ceil((to - now) / 60_000));
  return { pct, left: `${Math.floor(m / 60)}h ${m % 60}m` };
}

/** One gate chip: `pass` false = the failed gate (amber). */
export type Gate = { k: string; label: string; note: string; pass: boolean };

const src = (n?: number): Gate => ({ k: "src", label: `${n ?? "2+"} SRC`, note: "≥2", pass: true });

/**
 * Closest candidate's rail. The recorded reason is the FIRST rule it failed (lead-pick order: time → age → title rules →
 * GNews-only / analyst-only / release), so exactly one gate is amber; gates the picker never reached are left out rather than guessed.
 * null candidate (nothing reached 2 SRC) → the single amber "<2 SRC" gate.
 */
export function closestGates(c: LeadClosest | null): Gate[] {
  if (!c) return [{ k: "src", label: "<2 SRC", note: "✗ ≥2", pass: false }];
  const r = c.reason;
  const gates = [src(c.sources)];
  const pub = c.pub ? [{ k: "pub", label: c.pub, note: "own publisher", pass: true }] : [];
  const fresh = { k: "fresh", label: c.age_h == null ? `<${MAX_AGE_H}h` : c.age_h < 1 ? "<1h" : `${c.age_h}h`, note: "fresh", pass: true };
  if (r === "no-time") return [...gates, { k: "fresh", label: "age ?", note: "✗ fresh", pass: false }];
  if (r.startsWith("age>=")) return [...gates, ...pub, { k: "fresh", label: c.age_h != null ? `${c.age_h}h` : `≥${MAX_AGE_H}h`, note: "✗ fresh", pass: false }];
  if (r === "GNW_ONLY") return [...gates, { k: "pub", label: "GNW only", note: "✗ own publisher", pass: false }, fresh];
  // PASS-S1.1 / S1.3 (lead-pick ANALYST_ONLY / RELEASE_LEAD): no own publisher besides analysts / a release.
  if (r === "analyst-only" || r === "release") return [...gates, { k: "pub", label: r === "release" ? "REL only" : "ANL only", note: "✗ own publisher", pass: false }, fresh];
  return [...gates, ...pub, fresh, { k: "rule", label: r, note: "✗ lead rule", pass: false }];
}

/** Stale day: the carried lead itself, with the fresh gate failed (>48h). */
export function staleGates(l: { sources: number; pub?: string }): Gate[] {
  return [src(l.sources), ...(l.pub ? [{ k: "pub", label: l.pub, note: "own publisher", pass: true }] : []), { k: "fresh", label: `>${STALE_AGE_H}h`, note: "✗ fresh", pass: false }];
}
