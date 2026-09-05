#!/usr/bin/env bun
/**
 * Digest cadence tick — WIRE-DIGEST-CADENCE.
 * Usage:
 *   bun run digest:tick
 *   bun run digest:tick -- --force
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desk = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

async function main() {
  const force = process.argv.includes("--force");
  const { runDigestTick } = await import(resolve(desk, "src/lib/digest-tick.ts"));

  const result = runDigestTick({ deskRoot: desk, force });

  if (result.status === "HOLD") {
    console.log(`digest:tick HOLD — next_at=${result.next_at} (within CADENCE_MS)`);
    process.exit(0);
  }

  console.log(`digest:tick WROTE pack_id=${result.pack_id}`);
  console.log(`  cycle=${result.cycleId} lead=${result.leadId}`);
  console.log(`  last_at=${result.last_at}`);
  console.log(`  next_at=${result.next_at}`);
  console.log(`  pack json: ${result.paths.packJsonPath}`);
  console.log(`  pack md:   ${result.paths.packMdPath}`);
  console.log(`  digest:    ${result.paths.cycleJsonPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("digest:tick FAIL —", err?.message ?? err);
  process.exit(1);
});
