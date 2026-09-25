/**
 * Per-source crawl log: one row per source per ingest run — rows fetched, wall time, status.
 * Pure helpers; scripts/ingest.ts times each source block and writes the rows to
 * artifacts/sage/ingest-last.json → crawl_sources[] (and prints the table).
 */

export type CrawlSourceStatus = "ok" | "fail" | "paused";

export type CrawlSourceRow = {
  id: string;
  label: string;
  status: CrawlSourceStatus;
  rows: number;
  duration_ms: number;
  paused_until: string | null;
  reason: string | null;
};

/** Monotonic ms stopwatch. `lap()` returns whole ms since start. */
export function stopwatch(now: () => number = () => performance.now()) {
  const t0 = now();
  return { lap: () => Math.max(0, Math.round(now() - t0)) };
}

/** Time an async block; the block's own try/catch keeps soft-fail semantics. */
export async function timed<T>(fn: () => Promise<T>, now?: () => number): Promise<{ value: T; ms: number }> {
  const sw = stopwatch(now);
  const value = await fn();
  return { value, ms: sw.lap() };
}

export function crawlSourceRow(input: {
  id: string;
  label?: string;
  ok: boolean;
  rows: number;
  duration_ms: number;
  paused_until?: string | null;
  skipped_paused?: boolean;
  reason?: string | null;
}): CrawlSourceRow {
  const status: CrawlSourceStatus = input.skipped_paused ? "paused" : input.ok ? "ok" : "fail";
  return {
    id: input.id,
    label: input.label ?? input.id,
    status,
    rows: Math.max(0, Math.floor(input.rows || 0)),
    duration_ms: Math.max(0, Math.round(input.duration_ms || 0)),
    paused_until: input.paused_until ?? null,
    reason: status === "ok" ? null : (input.reason ?? null)?.slice(0, 160) ?? null,
  };
}

export function totalMs(rows: readonly CrawlSourceRow[]): number {
  return rows.reduce((n, r) => n + r.duration_ms, 0);
}

/** Fixed-width console table (also used by a1-stale-ingest logs). */
export function renderCrawlSourceTable(rows: readonly CrawlSourceRow[], wallMs?: number): string {
  const tot = totalMs(rows);
  const lines = [
    `  ${"source".padEnd(14)} ${"status".padEnd(7)} ${"rows".padStart(5)} ${"ms".padStart(7)} ${"share".padStart(6)}  note`,
  ];
  for (const r of rows) {
    const share = tot > 0 ? `${((r.duration_ms / tot) * 100).toFixed(1)}%` : "—";
    const note = r.status === "paused" ? `until ${r.paused_until ?? "?"}` : r.reason ?? (r.paused_until ? `paused_until ${r.paused_until}` : "");
    lines.push(
      `  ${r.label.padEnd(14)} ${r.status.padEnd(7)} ${String(r.rows).padStart(5)} ${String(r.duration_ms).padStart(7)} ${share.padStart(6)}  ${note}`.trimEnd(),
    );
  }
  lines.push(`  ${"sources total".padEnd(14)} ${"".padEnd(7)} ${"".padStart(5)} ${String(tot).padStart(7)}${wallMs != null ? `  (ingest wall ${wallMs} ms)` : ""}`);
  return lines.join("\n");
}
