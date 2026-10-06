/**
 * Pass E — browser-safe taste soft meters / shelf cap (no node:fs).
 * Soft: login_wall / skipped / empty / taste stale (>14d). Never invents cards.
 */
import type { SoftFailChip } from "@/data/soft-fail-meters";
import type { XTasteSnap } from "@/data/x-taste";

/** Visible Taste shelf rows before fold (Pass E: 5–8). */
export const TASTE_VISIBLE_CAP = 6;

/** Soft `taste stale` if capture older than this (Pass E). */
export const TASTE_STALE_MS = 14 * 24 * 60 * 60 * 1000;

export function tasteIsStale(capturedAt: string, now = Date.now()): boolean {
  const t = Date.parse(capturedAt);
  if (!Number.isFinite(t)) return true;
  return now - t > TASTE_STALE_MS;
}

/** Soft meter for X-session: login_wall / skip / empty / taste stale. Never invents items. */
export function tasteSoftMeter(
  snap: Pick<XTasteSnap, "captured_at" | "skipped" | "soft_fail" | "soft_fail_reason" | "items">,
  now = Date.now(),
): SoftFailChip {
  if (snap.skipped || snap.soft_fail) {
    const detail = (snap.soft_fail_reason || "skipped").replace(/^taste\s+/i, "") || "skipped";
    return { id: "x_session", label: "X-session", state: "soft", detail };
  }
  if (!snap.items.length) {
    return { id: "x_session", label: "X-session", state: "soft", detail: "empty" };
  }
  if (tasteIsStale(snap.captured_at, now)) {
    return { id: "x_session", label: "X-session", state: "soft", detail: "taste stale" };
  }
  return { id: "x_session", label: "X-session", state: "ok", detail: "landed" };
}
