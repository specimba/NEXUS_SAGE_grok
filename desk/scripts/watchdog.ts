#!/usr/bin/env bun
/**
 * PASS-Q1 §3 — one watchdog, failure-only. Plain bun, no LLM, no posts.
 *   bun scripts/watchdog.ts            → exit 0 silent when healthy; exit 1 + reasons on stderr otherwise.
 * Fails when: last-checked.json checked_at older than 8h (WATCHDOG_MAX_AGE_H) · live gh-pages crawl ≠ main crawl after a
 * published run · last two runs both soft-failed ≥ half the sources · the hash gate errored.
 *   bun scripts/watchdog.ts --pre      → pre-crawl check: warn-only, never blocks; a missing last-checked.json is a cold start ("watchdog: first run", exit 0).
 *                                        Without --pre (post-crawl) a missing file still FAILs.
 *   Crawl-stamp mismatch live vs main: --pre → WARN, exit 0. Post-crawl → FAIL unless live is NEWER than this run's crawl.
 *   Missed slot (Q1G): --pre with checked_at older than WATCHDOG_MAX_AGE_H still WARNs and exits 0 (the crawl runs and
 *   heals the desk), but appends the reason to WATCHDOG_MISSED (a job-local file). The job's LAST step,
 *   `bun scripts/watchdog.ts --missed-slot`, exits 1 if that file is non-empty ⇒ red job ⇒ GitLab's failure email.
 *   --missed-slot reads nothing else (no live fetch, no retries).
 * Env: WATCHDOG_MISSED (path; unset = no missed-slot marker) · WATCHDOG_NOW (ISO, fixtures) · WATCHDOG_LIVE_URL (default the Pages URL; "off" skips the live compare).
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
const MISSED = process.env.WATCHDOG_MISSED ?? "";
if (process.argv.includes("--missed-slot")) {
  const why = MISSED && existsSync(MISSED) ? readFileSync(MISSED, "utf8").trim() : "";
  if (why) {
    for (const l of why.split("\n")) console.error(`watchdog FAIL: missed slot — ${l} (this run crawled and published; failing so GitLab emails)`);
    process.exit(1);
  }
  process.exit(0);
}
if (PRE && !existsSync(checkedPath)) {
  console.log("watchdog: first run");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=true\n`);
  process.exit(0);
}
const lc = existsSync(checkedPath) ? JSON.parse(readFileSync(checkedPath, "utf8")) : null;
if (!lc) fails.push(`no ${checkedPath}`);
else {
  const age = (now - Date.parse(lc.checked_at)) / 3_600_000;
  if (!Number.isFinite(age) || age > MAX_H) {
    const msg = `checked_at ${lc.checked_at} is ${age.toFixed(1)}h old (> ${MAX_H}h)`;
    fails.push(msg);
    if (PRE && MISSED) appendFileSync(MISSED, `pre-crawl ${msg}\n`);
  }
  if (lc.gate_error) fails.push(`hash gate errored: ${lc.gate_error}`);
  const h = (lc.soft_history ?? []) as ({ soft: number; total: number } | null)[];
  if (h.length >= 2 && h.slice(0, 2).every((x) => x && x.total > 0 && x.soft * 2 >= x.total))
    fails.push(`last two runs soft-failed ≥ half the sources (${h.slice(0, 2).map((x) => `${x!.soft}/${x!.total}`).join(", ")})`);
  if (lc.last_run === "published" && LIVE !== "off") {
    try {
      const html = await (await fetch(LIVE, { signal: AbortSignal.timeout(15_000), cache: "no-store" })).text();
      const live = html.match(/data-crawl-at="([^"]+)"/)?.[1] ?? null;
      const want = lc.published_crawl as string | null;
      if (live !== want) {
        const msg = `live gh-pages crawl ${live} ≠ main crawl ${want}`;
        // --pre: the box and CI both move gh-pages, so a mismatch here is never a reason to block the crawl.
        if (PRE) console.warn(`watchdog WARN: ${msg} (pre-crawl, not blocking)`);
        // post-crawl: this run's crawl (written by reader-hash just now) must be live; live NEWER = box published later, OK.
        else if (!(live && want && Date.parse(live) > Date.parse(want))) fails.push(msg);
      }
    } catch (e) {
      fails.push(`live fetch failed: ${String(e).slice(0, 120)}`);
    }
  }
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${fails.length === 0}\n`);
if (fails.length && PRE) {
  // Pre-crawl: never block the crawl. A box crawl or a missed slot can leave main/live out of step; the crawl itself fixes that.
  for (const f of fails) console.warn(`watchdog WARN (pre): ${f}`);
  process.exit(0);
}
if (fails.length) {
  for (const f of fails) console.error(`watchdog FAIL: ${f}`);
  if (process.env.WATCHDOG_REPORT) appendFileSync(process.env.WATCHDOG_REPORT, fails.map((f) => `- ${f}`).join("\n") + "\n");
  process.exit(1);
}
