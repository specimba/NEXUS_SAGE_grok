#!/usr/bin/env bun
/**
 * Hard gate: refuse dev/build/start without a valid, fresh, consistent artifacts/sage/CURRENT.json.
 * Works on a clean CI checkout (repo contents only). No soft-fallback. Exit 1 on any failure.
 * Rules live in scripts/lib/current-gate.mjs (also enforced by next.config.ts at build).
 */
import { resolve } from "node:path";
import { checkCurrent } from "./lib/current-gate.mjs";

const deskRoot = resolve(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..");
const r = checkCurrent({ deskRoot });
if (!r.ok) {
  for (const e of r.errors) console.error(`SAGE HARD GATE: ${e}`);
  console.error("Refuse to start. Restore/refresh artifacts/sage/CURRENT.json + generated data (bun run ingest).");
  process.exit(1);
}
console.log(`SAGE gate OK — cycle ${r.lock.id} · crawl ${r.lock.crawled_at} (${r.ageH.toFixed(1)}h) @ ${r.path}`);
