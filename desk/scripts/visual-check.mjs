#!/usr/bin/env node
/**
 * DESK-HARDEN-VISUAL — chrome regression guard.
 * Curls live :3000 (or SAGE_DESK_URL) and fails on amber / gray-pill relapse
 * or LIVE stamp frozen at CYCLE.compiledAt without a fresher crawl chip.
 */
import { spawnSync } from "node:child_process";

const URL = process.env.SAGE_DESK_URL || "http://127.0.0.1:3000/";
const FROZEN_COMPILE = "2026-09-03T05:40:00Z";

function fail(msg, details = []) {
  console.error("visual:check FAIL");
  console.error(" -", msg);
  for (const d of details) console.error(" -", d);
  process.exit(1);
}

function fetchHtml(url) {
  // Prefer curl (task contract); fall back to fetch for restricted shells.
  const curl = spawnSync(
    "curl",
    ["-sS", "-L", "--max-time", "10", "-A", "sage-visual-check/1", url],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (curl.status === 0 && curl.stdout) return curl.stdout;
  // Node 18+ / Bun global fetch
  return null;
}

async function fetchHtmlAsync(url) {
  const viaCurl = fetchHtml(url);
  if (viaCurl != null) return viaCurl;
  const res = await fetch(url, {
    headers: { "user-agent": "sage-visual-check/1" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) fail(`HTTP ${res.status} from ${url}`);
  return await res.text();
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function htmlTheme(html) {
  const m = html.match(/<html\b[^>]*>/i);
  if (!m) return null;
  const tm = m[0].match(/\bdata-theme\s*=\s*["']([^"']+)["']/i);
  return tm ? tm[1] : null;
}

const html = await fetchHtmlAsync(URL);
const plain = stripComments(html);
const errors = [];

const theme = htmlTheme(html);
if (theme !== "phosphor") {
  errors.push(
    theme == null
      ? 'missing data-theme="phosphor" on <html>'
      : `live theme is data-theme="${theme}" (want phosphor)`,
  );
}
if (theme === "amber" || /<html\b[^>]*\bdata-theme\s*=\s*["']amber["']/i.test(html)) {
  errors.push('data-theme="amber" must not be the live theme');
}

const hasLanePrefix = /class="[^"]*lane-prefix[^"]*"|\blane-prefix\b/.test(html);
const has01 = /\[01\]/.test(plain) || /\[\s*01\s*\]/.test(plain);
const hasBriefLane =
  /desk-lane/.test(html) &&
  (/>\s*brief\s*</i.test(plain) || /lane-prefix[\s\S]{0,80}brief/i.test(html));

if (!has01 && !(hasLanePrefix && hasBriefLane)) {
  errors.push(
    "missing lane markers [01] (or lane-prefix + brief) — gray-pill relapse?",
  );
}

// Optional crawl freshness: if HTML exposes a crawl chip, LIVE must not be
// only the frozen compile stamp without a fresher crawl time.
const crawlChip = plain.match(/\bcrawl\s+(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\b/i);
const pulseLive = /\bPULSE\s+LIVE\b/i.test(plain) || /\bSTALE\s+[\d.]+H\b/i.test(plain);
if (crawlChip) {
  const crawlAt = crawlChip[1];
  if (crawlAt === FROZEN_COMPILE) {
    errors.push(
      `crawl chip is frozen compile-only ${FROZEN_COMPILE} — want CRAWL_AT / ingest fresher than CYCLE.compiledAt`,
    );
  }
} else if (pulseLive && plain.includes(FROZEN_COMPILE) && !/\bcrawl\s+20\d{2}-/.test(plain)) {
  // LIVE/PULSE present but only the old compile stamp exposed as time truth
  const times = [...plain.matchAll(/\b(20\d{2}-\d{2}-\d{2}T[\d:.]+Z)\b/g)].map((m) => m[1]);
  const onlyFrozen = times.length > 0 && times.every((t) => t === FROZEN_COMPILE);
  if (onlyFrozen) {
    errors.push(
      `LIVE stamp looks like only ${FROZEN_COMPILE} with no fresher crawl chip`,
    );
  }
}

// Operator UX: footer health chip exposes BUILD_ID so stale :3000 is obvious.
const buildAttr = html.match(/\bdata-sage-build\s*=\s*["']([^"']*)["']/i);
const buildPlain = plain.match(/\bbuild\s+([A-Za-z0-9_-]{3,})/i);
if (!buildAttr && !buildPlain) {
  errors.push('missing BUILD_ID / data-sage-build health chip in footer');
} else if (buildAttr && (!buildAttr[1] || buildAttr[1] === 'unknown')) {
  errors.push(`data-sage-build is empty/unknown: "${buildAttr[1] ?? ""}"`);
}

if (errors.length) fail(errors[0], errors.slice(1));

const buildId = buildAttr ? buildAttr[1] : buildPlain ? buildPlain[1] : "(none)";
const summary = {
  url: URL,
  theme,
  lane01: has01 || (hasLanePrefix && hasBriefLane),
  crawl: crawlChip ? crawlChip[1] : "(none exposed)",
  build: buildId,
  bytes: html.length,
};
console.log("visual:check OK");
console.log(
  `  url=${summary.url} theme=${summary.theme} lanes=${summary.lane01 ? "ok" : "?"} crawl=${summary.crawl} build=${summary.build} bytes=${summary.bytes}`,
);
process.exit(0);
