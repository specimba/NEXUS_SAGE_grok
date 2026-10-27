#!/usr/bin/env bun
/**
 * PASS-Q1 §3 — one watchdog, failure-only. Plain bun, no LLM, no posts.
 *   bun scripts/watchdog.ts            → post-crawl: exit 0 silent when healthy; exit 1 + reasons on stderr otherwise.
 * Fails when: checked_at earlier than THIS run's slot − 10 min (this run never checked in) · live gh-pages crawl ≠ main
 * crawl after a published run · last two runs both soft-failed ≥ half the sources · the hash gate errored.
 *   Slots (Q1G §2, amended Oct 16 — slot-based, the fixed 10h rule is retired): 06:11 · 11:11 · 16:11 · 21:11 Europe/Istanbul.
 *   "This run's slot" = the latest slot ≤ now (+2 min skew); "the previous slot" = the one before it (crosses midnight).
 *   bun scripts/watchdog.ts --pre      → pre-crawl. MISSED SLOT: last checked_at < previous slot − 10 min ⇒ prints
 *                                        "watchdog FAIL (pre): missed slot …", appends it to WATCHDOG_MISSED, exits 2.
 *                                        Everything else stays warn-only (exit 0): live≠main mismatch, gate error, soft ratio.
 *                                        Missing last-checked.json = cold start ("watchdog: first run", exit 0).
 *     Why exit 2 + a deferred job failure instead of stopping the job: if --pre aborted the crawl, checked_at would never
 *     advance and every later slot would fail too (the desk would stay stale until someone intervened). The yml runs
 *     `watchdog.ts --pre || [ $? = 2 ]` (only exit 2 is tolerated), the crawl + publish heal the desk, and the job's LAST
 *     step `watchdog.ts --missed-slot` exits 1 on a non-empty WATCHDOG_MISSED ⇒ red job ⇒ GitLab's failure email.
 *   bun scripts/watchdog.ts --missed-slot → reads WATCHDOG_MISSED + last-checked (no live fetch, no retries). Healed (Oct 28):
 *     if this run refreshed checked_at for its OWN slot, the historical miss prints a WARN and exits 0 (recovery run stays
 *     green); only a miss not healed by this run exits 1. WATCHDOG_STRICT_MISSED=1 = old always-fail.
 *   Without --pre (post-crawl) a missing file still FAILs. Live mismatch post-crawl → FAIL unless live is NEWER than this run's crawl.
 * Env: WATCHDOG_MISSED (path; unset = no marker) · WATCHDOG_NOW (ISO, fixtures) · WATCHDOG_LIVE_URL (default the Pages URL; "off" skips the live compare).
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const desk = resolve(import.meta.dir, "..");
const checkedPath = process.env.WATCHDOG_CHECKED ?? resolve(desk, "artifacts/sage/last-checked.json");
const now = process.env.WATCHDOG_NOW ? Date.parse(process.env.WATCHDOG_NOW) : Date.now();
const LIVE = process.env.WATCHDOG_LIVE_URL ?? "https://specimba.github.io/NEXUS_SAGE_grok/";
const fails: string[] = [];

// ── slots (Europe/Istanbul wall clock; offset read via Intl so a future DST rule can't skew it) ──
const SLOTS = [[6, 11], [11, 11], [16, 11], [21, 11]] as const;
const GRACE_MS = 10 * 60_000;
const SKEW_MS = 2 * 60_000;
const tzOffsetMs = (t: number) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", hourCycle: "h23", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(t).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
};
/** All slot instants (UTC ms) on the TRT calendar days around t, ascending. */
const slotsAround = (t: number) => {
  const off = tzOffsetMs(t), local = new Date(t + off), out: number[] = [];
  for (let d = -2; d <= 1; d++) for (const [h, m] of SLOTS) {
    const wall = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + d, h, m);
    out.push(wall - tzOffsetMs(wall - off));
  }
  return out.sort((a, b) => a - b);
};
const fmtTrt = (t: number) => new Date(t + tzOffsetMs(t)).toISOString().slice(0, 16).replace("T", " ") + " TRT";
const all = slotsAround(now);
const ownIdx = all.findLastIndex((s) => s <= now + SKEW_MS);
const ownSlot = all[ownIdx], prevSlot = all[ownIdx - 1];

const PRE = process.argv.includes("--pre");
const MISSED = process.env.WATCHDOG_MISSED ?? "";
if (process.argv.includes("--missed-slot")) {
  const why = MISSED && existsSync(MISSED) ? readFileSync(MISSED, "utf8").trim() : "";
  if (why) {
    // Heal: a historical miss is not a reason to keep the job red once THIS run's crawl refreshed checked_at for its own
    // slot (the crawl + publish steps before this one already succeeded, or the job would have stopped there). The miss is
    // still reported loudly (WARN line in the job log). WATCHDOG_STRICT_MISSED=1 restores the old always-fail behaviour.
    let healed = false;
    try {
      const at = Date.parse(JSON.parse(readFileSync(checkedPath, "utf8")).checked_at);
      healed = Number.isFinite(at) && at >= ownSlot - GRACE_MS;
    } catch {}
    const strict = process.env.WATCHDOG_STRICT_MISSED === "1";
    for (const l of why.split("\n")) {
      if (healed && !strict) console.error(`watchdog WARN: ${l} (recovered — this run crawled for ${fmtTrt(ownSlot)}; job stays green)`);
      else console.error(`watchdog FAIL: ${l} (${healed ? "strict mode" : `checked_at still before ${fmtTrt(ownSlot - GRACE_MS)} after this run`}; failing so GitLab emails)`);
    }
    process.exit(healed && !strict ? 0 : 1);
  }
  process.exit(0);
}
if (PRE && !existsSync(checkedPath)) {
  console.log("watchdog: first run");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=true\n`);
  process.exit(0);
}
let missed = "";
const lc = existsSync(checkedPath) ? JSON.parse(readFileSync(checkedPath, "utf8")) : null;
if (!lc) fails.push(`no ${checkedPath}`);
else {
  const at = Date.parse(lc.checked_at);
  // --pre: the PREVIOUS slot must have checked in. Post-crawl: THIS run's slot must have (checked_at was just refreshed).
  const slot = PRE ? prevSlot : ownSlot;
  if (!Number.isFinite(at) || at < slot - GRACE_MS) {
    const msg = `missed slot ${fmtTrt(slot)}: last checked_at ${lc.checked_at} is before ${fmtTrt(slot - GRACE_MS)}`;
    if (PRE) missed = msg;
    else fails.push(msg);
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
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${fails.length === 0 && !missed}\n`);
if (PRE) {
  // Pre-crawl: only a missed slot is a failure (exit 2, deferred to the job's last step); the rest warns. Never exit 1 here.
  for (const f of fails) console.warn(`watchdog WARN (pre): ${f}`);
  if (missed) {
    console.error(`watchdog FAIL (pre): ${missed}`);
    if (MISSED) appendFileSync(MISSED, `pre-crawl ${missed}\n`);
    process.exit(2);
  }
  process.exit(0);
}
if (fails.length) {
  for (const f of fails) console.error(`watchdog FAIL: ${f}`);
  if (process.env.WATCHDOG_REPORT) appendFileSync(process.env.WATCHDOG_REPORT, fails.map((f) => `- ${f}`).join("\n") + "\n");
  process.exit(1);
}
