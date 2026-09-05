#!/usr/bin/env bun
/**
 * Hard gate: refuse boot/build without artifacts/sage/CURRENT.json.
 * No soft-fallback. Exit 1 if missing or unreadable.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const path = process.env.SAGE_CURRENT_PATH
  ? resolve(process.env.SAGE_CURRENT_PATH)
  : resolve(root, "artifacts/sage/CURRENT.json");

if (!existsSync(path)) {
  console.error(`SAGE HARD GATE: missing CURRENT.json at ${path}`);
  console.error("Refuse to start. Restore artifacts/sage/CURRENT.json (cycle lock).");
  process.exit(1);
}

try {
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  if (!data || typeof data.id !== "string" || !data.id) {
    console.error(`SAGE HARD GATE: CURRENT.json at ${path} has no cycle id`);
    process.exit(1);
  }
  console.log(`SAGE gate OK — cycle ${data.id} @ ${path}`);
} catch (err) {
  console.error(`SAGE HARD GATE: cannot read/parse CURRENT.json at ${path}`);
  console.error(err);
  process.exit(1);
}
