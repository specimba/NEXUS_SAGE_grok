#!/usr/bin/env bun
/**
 * PASS-S1 — re-render src/data/sage-setup.ts after a committed config change (code pass, no crawl): same renderer
 * ingest uses, with the last crawl's stamp + crawl_sources rows from artifacts/sage/ingest-last.json, read-only
 * config load (no last-good write). The next real crawl rewrites the module anyway.
 *   bun scripts/s1-regen-setup.ts [--head <sha>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadSageConfig } from "../src/lib/sage-config-disk";
import { renderSageSetupTs } from "../src/lib/sage-setup";

const desk = resolve(import.meta.dir, "..");
const last = JSON.parse(readFileSync(resolve(desk, "artifacts/sage/ingest-last.json"), "utf8")) as {
  stamped_at: string;
  crawl_sources: { id: string; rows: number; status: string; reason?: string | null }[];
};
// `--head <sha>`: the commit the config change sits on (default: current HEAD) — keeps since_commit on a real SHA.
const hi = process.argv.indexOf("--head");
const l = loadSageConfig(desk, { write: false, ...(hi > 0 && process.argv[hi + 1] ? { head: process.argv[hi + 1] } : {}) });
if (l.status !== "ok") {
  console.error(`config invalid: ${l.errors.join("; ")}`);
  process.exit(1);
}
writeFileSync(
  resolve(desk, "src/data/sage-setup.ts"),
  renderSageSetupTs(l, { stamp: last.stamped_at, rows: last.crawl_sources.map((r) => ({ id: r.id, rows: r.rows, status: r.status, reason: r.reason ?? null })) }),
);
console.log(`sage-setup.ts re-rendered: config_hash=${l.config_hash} since=${l.since_commit ?? "—"}`);
