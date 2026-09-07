#!/usr/bin/env bun
/**
 * A2 — Digest DUE → WROTE → dual-home pack:export (OPS-A1-A3-AUTOMATION.md)
 *
 * Weekday daytime cron only (Mon–Fri · ~09:00–17:00 Europe/Istanbul).
 * No overnight @every firehose. Standing Grok one-shots are separate.
 *
 * Flow:
 *   1. bun run digest:tick
 *   2. if stdout contains WROTE → bun run pack:export (dual-home)
 *   3. HOLD → no export (exit 0)
 *
 * Hard bans: no Brief pollution · no paid X · no WIRE · no cycle 004
 *
 * Usage:
 *   bun scripts/a2-digest-export.mjs
 *   bun run a2:tick
 *
 * Env:
 *   A2_LOG  log path (default ../../logs/a2-digest.log)
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const desk = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const root = resolve(desk, "..");
const LOG = process.env.A2_LOG || resolve(root, "logs/a2-digest.log");

function log(line) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;
  console.log(msg);
  try {
    mkdirSync(resolve(root, "logs"), { recursive: true });
    appendFileSync(LOG, msg + "\n", "utf8");
  } catch {
    /* ignore log IO */
  }
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: desk,
    encoding: "utf8",
    env: process.env,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  if (out) {
    for (const line of out.split("\n")) log(`  | ${line}`);
  }
  return { status: r.status ?? 1, out };
}

log("A2 start — digest:tick then conditional pack:export");
const tick = run("bun", ["scripts/digest-tick.mjs"]);
if (tick.status !== 0) {
  log(`FAIL — digest:tick exit=${tick.status}`);
  process.exit(tick.status || 1);
}

const wrote = /\bWROTE\b/.test(tick.out);
if (!wrote) {
  log("A2 HOLD — no pack:export");
  process.exit(0);
}

log("A2 WROTE — running pack:export dual-home");
const exp = run("bun", ["scripts/pack-export.mjs"]);
if (exp.status !== 0) {
  log(`FAIL — pack:export exit=${exp.status}`);
  process.exit(exp.status || 1);
}
log("A2 OK — DUE→WROTE→dual-home complete");
process.exit(0);
