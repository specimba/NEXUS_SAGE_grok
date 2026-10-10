#!/usr/bin/env bun
/**
 * PASS-Q1 §3 — one watchdog, failure-only. Plain bun, no LLM, no posts.
 *   bun scripts/watchdog.ts            → exit 0 silent when healthy; exit 1 + reasons on stderr otherwise.
 * Fails when: last-checked.json checked_at older than 8h (WATCHDOG_MAX_AGE_H) · live gh-pages crawl ≠ main crawl after a
 * published run · last two runs both soft-failed ≥ half the sources · the hash gate errored.
 *   bun scripts/watchdog.ts --pre      → pre-crawl check: a missing last-checked.json is a cold start ("watchdog: first run", exit 0).
 *                                        Without --pre (post-crawl) a missing file still FAILs.
 * Env: WATCHDOG_NOW (ISO, fixtures) · WATCHDOG_LIVE_URL (default the Pages URL; "off" skips the live compare).
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const desk = resolve(import.meta.dir, "..");
const checkedPath = process.env.WATCHDOG_CHECKED ?? resolve(desk, "artifacts/sage/last-checked.json");
const MAX_H = Number(process.env.WATCHDOG_MAX_AGE_H ?? "8");
const now = process.env.WATCHDOG_NOW ? Date.parse(process.env.WATCHDOG_NOW) : Date.now();
const LIVE = process.env.WATCHDOG_LIVE_URL ?? "https://specimba.github.io/NEXUS_SAGE_grok/";
const fails: string[] = [];

const PRE = process.argv.includes("--pre");
if (PRE && !existsSync(checkedPath)) {
  console.log("watchdog: first run");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=true\n`);
  process.exit(0);
}
const lc = existsSync(checkedPath) ? JSON.parse(readFileSync(checkedPath, "utf8")) : null;
if (!lc) fails.push(`no ${checkedPath}`);
else {
  const age = (now - Date.parse(lc.checked_at)) / 3_600_000;
  if (!Number.isFinite(age) || age > MAX_H) fails.push(`checked_at ${lc.checked_at} is ${age.toFixed(1)}h old (> ${MAX_H}h)`);
  if (lc.gate_error) fails.push(`hash gate errored: ${lc.gate_error}`);
  const h = (lc.soft_history ?? []) as ({ soft: number; total: number } | null)[];
  if (h.length >= 2 && h.slice(0, 2).every((x) => x && x.total > 0 && x.soft * 2 >= x.total))
    fails.push(`last two runs soft-failed ≥ half the sources (${h.slice(0, 2).map((x) => `${x!.soft}/${x!.total}`).join(", ")})`);
  if (lc.last_run === "published" && LIVE !== "off") {
    try {
      const html = await (await fetch(LIVE, { signal: AbortSignal.timeout(15_000), cache: "no-store" })).text();
      const live = html.match(/data-crawl-at="([^"]+)"/)?.[1] ?? null;
      if (live !== lc.published_crawl) fails.push(`live gh-pages crawl ${live} ≠ main crawl ${lc.published_crawl}`);
    } catch (e) {
      fails.push(`live fetch failed: ${String(e).slice(0, 120)}`);
    }
  }
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${fails.length === 0}\n`);
if (fails.length) {
  for (const f of fails) console.error(`watchdog FAIL: ${f}`);
  if (process.env.WATCHDOG_REPORT) appendFileSync(process.env.WATCHDOG_REPORT, fails.map((f) => `- ${f}`).join("\n") + "\n");
  process.exit(1);
}
