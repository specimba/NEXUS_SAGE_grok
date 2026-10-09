"use client";
import { useEffect, useState } from "react";

/**
 * Wall clock for relative times (AGE, FRESH/STALE, since-last-visit, lead 24h HELD).
 * null during SSR/static prerender AND the first client render (identical HTML ⇒ no hydration
 * mismatch); set after mount, then ticks every `tickMs`. Callers render the absolute Istanbul
 * time while null, then swap to the relative value.
 */
export function useNow(tickMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(t);
  }, [tickMs]);
  return now;
}

/** PASS-Q1 §2: last crawl CHECK (gh-pages last-checked.json, refreshed even when publish is skipped); falls back to the data stamp. */
let chk: string | undefined;
export function useCheckedAt(dataAt: string): string {
  const [v, setV] = useState(chk);
  useEffect(() => {
    if (!chk) fetch("last-checked.json", { cache: "no-store" }).then((r) => r.json()).then((j) => setV((chk = j.checked_at))).catch(() => {});
  }, []);
  return v && v > dataAt ? v : dataAt;
}
