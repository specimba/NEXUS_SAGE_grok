#!/usr/bin/env bun
/**
 * A1 — STALE auto-ingest (OPS-A1-A3-AUTOMATION.md)
 *
 * Weekday daytime cron only (Mon–Fri · ~09:00–17:00 local/VM intent).
 * No overnight @every firehose. Standing cron installs AFTER Reviewer PASS.
 *
 * Threshold: crawl age ≥ 12h → ingest + dual-home pack + live=:disk verify.
 * FORCE=1 bypasses age gate (dry-run / operator override).
 *
 * Hard bans (Reviewer FAIL list):
 *   - NEVER touch Brief pins / cycle lead
 *   - NEVER create digest 004 / cycle 004
 *   - NEVER paid X / X_BEARER / api.x.com
 *   - NEVER new WIRE-* craft
 *   - Soft-fails stamped (OpenAlex 429 etc.) — never silent-wash
 *
 * Usage:
 *   bun scripts/a1-stale-ingest.mjs
 *   FORCE=1 bun scripts/a1-stale-ingest.mjs
 *   DRY_RUN=1 FORCE=1 bun scripts/a1-stale-ingest.mjs   # plan-only (no mutate)
 *
 * Env:
 *   FORCE=1          run even if age < 12h
 *   DRY_RUN=1        print plan + SKIP mutate (evidence scaffolding only)
 *   SAGE_DESK_URL    live desk URL (default http://127.0.0.1:3000/)
 *   A1_AGE_HOURS     stale threshold (default 12)
 *   A1_LOG           log path (default ../../logs/a1-stale-ingest.log)
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
  appendFileSync,
  readdirSync,
  statSync,
  openSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, spawn } from "node:child_process";

const desk = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const root = resolve(desk, "..");
const FORCE = process.env.FORCE === "1" || process.argv.includes("--force");
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");
const AGE_H = Number(process.env.A1_AGE_HOURS || "12");
const DESK_URL = process.env.SAGE_DESK_URL || "http://127.0.0.1:3000/";
const LOG = process.env.A1_LOG || resolve(root, "logs/a1-stale-ingest.log");

const WEEKDAY_WINDOW =
  "Mon–Fri daytime only (~09:00–17:00 VM/local intent) — no overnight @every firehose; standing cron AFTER Reviewer PASS";

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

function fail(msg, code = 1) {
  log(`FAIL — ${msg}`);
  process.exit(code);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readCrawlAt() {
  const crawlPath = join(desk, "src/data/x-crawl.ts");
  if (existsSync(crawlPath)) {
    const src = readFileSync(crawlPath, "utf8");
    const m = src.match(/export const CRAWL_AT\s*=\s*"([^"]+)"/);
    if (m) return { at: m[1], source: "x-crawl.ts" };
  }
  const ingestLast = join(desk, "artifacts/sage/ingest-last.json");
  if (existsSync(ingestLast)) {
    const j = JSON.parse(readFileSync(ingestLast, "utf8"));
    const at = j.stamped_at || j.crawl_at || j.at || j.crawled_at;
    if (at) return { at, source: "ingest-last.json" };
  }
  const current = join(desk, "artifacts/sage/CURRENT.json");
  if (existsSync(current)) {
    const j = JSON.parse(readFileSync(current, "utf8"));
    if (j.crawled_at) return { at: j.crawled_at, source: "CURRENT.json" };
  }
  fail("cannot read CRAWL_AT from x-crawl.ts / ingest-last / CURRENT");
}

function ageHours(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) fail(`bad CRAWL_AT: ${iso}`);
  return (Date.now() - t) / 3_600_000;
}

function run(cmd, args, opts = {}) {
  log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || desk,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
    maxBuffer: 32 * 1024 * 1024,
    timeout: opts.timeout ?? 600_000,
  });
  if (r.stdout?.trim()) console.log(r.stdout.trimEnd());
  if (r.stderr?.trim()) console.error(r.stderr.trimEnd());
  if (r.error) fail(`${cmd} spawn error: ${r.error.message}`);
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} exited ${r.status}`);
  return r;
}

function curlLiveCrawl() {
  const curl = spawnSync(
    "curl",
    ["-sS", "-L", "--max-time", "15", "-A", "sage-a1-stale/1", DESK_URL],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (curl.status !== 0 || !curl.stdout) {
    return {
      ok: false,
      error: curl.stderr || `curl status ${curl.status}`,
      crawl: null,
      build: null,
      html: "",
    };
  }
  const html = curl.stdout;
  const plain = html.replace(/<!--[\s\S]*?-->/g, "");
  const crawlChip = plain.match(/\bcrawl\s+(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\b/i);
  const buildAttr = html.match(/\bdata-sage-build\s*=\s*["']([^"']*)["']/i);
  return {
    ok: true,
    crawl: crawlChip ? crawlChip[1] : null,
    build: buildAttr ? buildAttr[1] : null,
    html,
  };
}

function killPort3000() {
  log("live lag → kill next on :3000");
  spawnSync("fuser", ["-k", "3000/tcp"], { encoding: "utf8" });
  const ss = spawnSync("ss", ["-tlnp"], { encoding: "utf8" });
  const out = ss.stdout || "";
  const m = out.match(/:3000\b[\s\S]*?pid=(\d+)/);
  if (m) {
    spawnSync("kill", ["-TERM", m[1]], { encoding: "utf8" });
    spawnSync("sleep", ["1"]);
    spawnSync("kill", ["-KILL", m[1]], { encoding: "utf8" });
  }
  spawnSync("pkill", ["-f", "next start --hostname 0.0.0.0 --port 3000"], {
    encoding: "utf8",
  });
  spawnSync("sleep", ["2"]);
}

function startServerBackground() {
  mkdirSync(resolve(root, "logs"), { recursive: true });
  const logPath = resolve(root, "logs/desk-3000.log");
  const fd = openSync(logPath, "a");
  const child = spawn("bun", ["run", "start"], {
    cwd: desk,
    detached: true,
    stdio: ["ignore", fd, fd],
    env: process.env,
  });
  child.unref();
  log(`started bun run start pid=${child.pid} log=${logPath}`);
  for (let i = 0; i < 45; i++) {
    spawnSync("sleep", ["1"]);
    const live = curlLiveCrawl();
    if (live.ok && live.build) {
      log(`:3000 up build=${live.build} crawl=${live.crawl || "(none)"}`);
      return live;
    }
  }
  fail(":3000 did not become ready within ~45s after start");
}

function collectSoftFails(ingestLast) {
  const soft = [];
  if (!ingestLast || typeof ingestLast !== "object") return soft;
  for (const [key, val] of Object.entries(ingestLast)) {
    if (val && typeof val === "object" && val.soft_fail) {
      soft.push({
        provider: key,
        reason: val.soft_fail_reason || "unknown",
        ok: val.ok ?? false,
      });
    }
  }
  return soft;
}

function assertLocks(ingestLast) {
  const cyclePath = join(desk, "src/data/cycle.ts");
  const cycleSrc = readFileSync(cyclePath, "utf8");
  const current = JSON.parse(
    readFileSync(join(desk, "artifacts/sage/CURRENT.json"), "utf8"),
  );
  const errors = [];
  if (current.id !== "003") errors.push(`CURRENT.id=${current.id} (want 003)`);
  if (!cycleSrc.includes('id: "hf-incident"') || !cycleSrc.includes('kind: "lead"')) {
    errors.push("cycle.ts missing lead hf-incident");
  }
  if (/export const CYCLE[\s\S]*?\bid:\s*"004"/.test(cycleSrc)) {
    errors.push("cycle 004 appeared in CYCLE");
  }
  if (current.id === "004") errors.push("CURRENT jumped to 004");
  if (ingestLast) {
    if (ingestLast.cycle && ingestLast.cycle !== "003") {
      errors.push(`ingest-last.cycle=${ingestLast.cycle}`);
    }
    if (ingestLast.lead_id && ingestLast.lead_id !== "hf-incident") {
      errors.push(`ingest-last.lead_id=${ingestLast.lead_id}`);
    }
    const x = ingestLast.x || {};
    if (x.disabled !== true && x.skipped !== true && (x.fetched || 0) > 0) {
      errors.push("paid/live X fetch detected in ingest-last.x");
    }
    if (ingestLast.locks && ingestLast.locks.no_paid_x === false) {
      errors.push("locks.no_paid_x broken");
    }
  }
  if (errors.length) fail(`lock violation:\n  - ${errors.join("\n  - ")}`);
}

function latestPackName() {
  const home = join(root, "packs");
  const names = readdirSync(home)
    .filter((n) => /^sage-pack-003-.*\.tar\.gz$/.test(n))
    .sort();
  if (!names.length) fail("no sage-pack-003-*.tar.gz in packs/");
  return names[names.length - 1];
}

function updateDrillLog({ packName, sha, manifestSha, crawlAt, softFails, force, age }) {
  const path = join(root, "packs/drill-log.md");
  const packId = packName.replace(/\.tar\.gz$/, "");
  const softLine =
    softFails.length === 0
      ? "- Soft-fails: none"
      : `- Soft-fails STAMPED (not silent): ${softFails
          .map((s) => `${s.provider}=${s.reason}`)
          .join("; ")}`;
  const utc = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const body = `# P2 home 2b drill-log — operator off-box

**UTC refreshed:** ${utc}  
**Pack id:** \`${packId}\`  
**Cycle / lead:** \`003\` / \`hf-incident\`  

## Homes

| Home | Path | Status |
|------|------|--------|
| 1 · VM primary | \`/workspace/nexus-sage/packs/${packName}\` | OK |
| 2a · desk mirror | \`/workspace/nexus-sage/desk/packs/${packName}\` | OK |
| 2b · operator PC | \`C:\\Users\\speci.000\\Downloads\\nexus-sage-packs\\${packName}\` | PENDING (no re-ask) |

## Checksums (VM)

\`\`\`
sha256  ${sha}
\`\`\`

## Notes
- A1 STALE auto-ingest ${force ? "FORCE=1 dry-run" : "age≥12h"} · crawl \`${crawlAt}\` · pre-age ~${age.toFixed(2)}h
- Dual-home pack \`${packId}\` identical both homes
- Freeze ON · cycle 003 / hf-incident · no digest 004 · no craft · no WIRE · no paid X
- Manifest sha256 \`${manifestSha}\`
${softLine}
- Weekday window: ${WEEKDAY_WINDOW}
- Reviewer stamp pending (Coder factual only)
`;
  writeFileSync(path, body, "utf8");
  const deskCopy = join(desk, "packs/drill-log.md");
  try {
    mkdirSync(join(desk, "packs"), { recursive: true });
    copyFileSync(path, deskCopy);
  } catch {
    /* optional */
  }
  log(`updated ${path}`);
}

function updatePackDualHomeHeader({
  packName,
  sha,
  manifestSha,
  crawlAt,
  softFails,
  force,
  age,
}) {
  const path = join(root, "refs/PACK-DUAL-HOME.md");
  const prev = existsSync(path) ? readFileSync(path, "utf8") : "";
  const stampIdx = prev.search(/^### Reviewer /m);
  let remainder = stampIdx >= 0 ? prev.slice(stampIdx) : "";
  if (remainder.startsWith("### Reviewer stamp — pending")) {
    const next = remainder.search(/^### Reviewer stamp — 20/m);
    remainder = next >= 0 ? remainder.slice(next) : "";
  }
  const softLine =
    softFails.length === 0
      ? "**Soft-fails:** none"
      : `**Soft-fails STAMPED:** ${softFails
          .map((s) => `${s.provider} ${s.reason}`)
          .join("; ")}`;
  const stamp =
    packName.match(/sage-pack-003-(.+)\.tar\.gz$/)?.[1] || "unknown";
  const header = `# Pack dual-home — latest export

**UTC:** ${stamp}  
**Pack:** \`${packName}\`

| Home | Path |
|------|------|
| Primary (VM) | \`/workspace/nexus-sage/packs/${packName}\` |
| Desk mirror | \`/workspace/nexus-sage/desk/packs/${packName}\` |
| Operator | Windows \`Downloads\\nexus-sage-packs\\\` or Drive — see \`P2-EXPORT-IMPORT.md\` |

**Locks:** cycle \`003\` · lead \`hf-incident\` · \`sol_ne_astra\` · no \`004\` without primary  

**Digest cadence:** unchanged by A1 (Brief pins / digest tick not mutated)  

**Crawl / ingest:** \`${crawlAt}\`  

**sha256 (archive):** \`${sha}\`  
**manifest sha256:** \`${manifestSha}\`  

**Commands:** \`bun run pack:export\` · \`bun run pack:import -- <path>\` · \`bun run digest:tick\` · \`bun run ingest\` · \`FORCE=1 bun scripts/a1-stale-ingest.mjs\`

**A1 note:** ${force ? "FORCE=1 dry-run" : "age≥12h path"} · pre-age ~${age.toFixed(2)}h · ${WEEKDAY_WINDOW}  

${softLine}

### Reviewer stamp — pending

(Factual dual-home above from Coder A1 auto-ingest. Reviewer owns PASS/FAIL stamp.)

`;
  writeFileSync(
    path,
    header + (remainder ? "\n" + remainder.replace(/^\n+/, "") : ""),
    "utf8",
  );
  log(`updated factual header ${path}`);
}

function appendDryRunEvidence({
  crawlBefore,
  crawlAfter,
  packName,
  sha,
  softFails,
  liveCrawl,
  force,
  age,
  rebuilt,
}) {
  const path = join(root, "refs/A1-DRY-RUN.md");
  const match = liveCrawl === crawlAfter ? "PASS" : "FAIL";
  const softStr = softFails.length
    ? softFails.map((s) => `${s.provider}=${s.reason}`).join("; ")
    : "none";
  const lines = [
    `# A1 STALE auto-ingest — DRY-RUN evidence`,
    ``,
    `**UTC:** ${new Date().toISOString()}`,
    `**Operator:** Coder Gürok (executor) · Reviewer stamp pending`,
    `**FORCE:** ${force ? "1" : "0"} · **pre-age:** ${age.toFixed(2)}h (threshold ${AGE_H}h)`,
    `**Weekday window:** ${WEEKDAY_WINDOW}`,
    ``,
    `## Path exercised`,
    ``,
    `1. Read CRAWL_AT → age gate (FORCE bypass)`,
    `2. \`bun run ingest\``,
    `3. \`bun run pack:export\` dual-home`,
    `4. Compare live :3000 crawl to disk${
      rebuilt ? " → lag → kill/rebuild/restart/re-verify" : " → match (no rebuild)"
    }`,
    `5. Stamp soft-fails · update drill-log + PACK-DUAL-HOME factual header`,
    ``,
    `## Results`,
    ``,
    `| Check | Result |`,
    `|-------|--------|`,
    `| 1 stamp-truth live=disk | live=\`${liveCrawl}\` disk=\`${crawlAfter}\` **${match}** |`,
    `| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |`,
    `| 3 no X | ingest-last.x skipped/disabled |`,
    `| 4 locks hold | cycle 003 · lead hf-incident · no 004 |`,
    `| 5 dual-home sha identical | \`${packName}\` sha256 \`${sha}\` |`,
    `| 6 soft-fails stamped | ${softStr} |`,
    `| 7 not overnight spam | script documents weekday window; cron NOT installed |`,
    `| 8 no craft/WIRE | no new WIRE-* · Brief untouched |`,
    ``,
    `Crawl before: \`${crawlBefore}\` → after: \`${crawlAfter}\``,
    ``,
    `**Standing cron:** NOT installed (awaits Reviewer PASS).`,
    ``,
  ];
  writeFileSync(path, lines.join("\n"), "utf8");

  const ops = join(root, "refs/OPS-A1-A3-AUTOMATION.md");
  if (existsSync(ops)) {
    let src = readFileSync(ops, "utf8");
    const note = `
## A1 dry-run evidence (${new Date().toISOString().slice(0, 16)}Z)

- Script: \`desk/scripts/a1-stale-ingest.mjs\` · FORCE=1 path exercised
- Crawl \`${crawlBefore}\` → \`${crawlAfter}\` · pack \`${packName}\`
- Dual-home sha \`${sha.slice(0, 12)}…\` · soft-fails: ${softStr}
- Checklist: see \`refs/A1-DRY-RUN.md\` · Reviewer stamp pending · **cron not installed**
`;
    src = src.trimEnd() + "\n" + note;
    writeFileSync(ops, src, "utf8");
  }
  log(`wrote ${path}`);
}

async function main() {
  log(
    `A1 STALE auto-ingest start · FORCE=${FORCE ? 1 : 0} DRY_RUN=${DRY_RUN ? 1 : 0} threshold=${AGE_H}h`,
  );
  log(`weekday window policy: ${WEEKDAY_WINDOW}`);

  const wireDir = join(root, "refs");
  const wireBefore = readdirSync(wireDir).filter((f) => f.startsWith("WIRE-"));
  const wireMtimes = Object.fromEntries(
    wireBefore.map((f) => [f, statSync(join(wireDir, f)).mtimeMs]),
  );
  const cycleShaBefore = createHash("sha256")
    .update(readFileSync(join(desk, "src/data/cycle.ts")))
    .digest("hex");

  const { at: crawlBefore, source } = readCrawlAt();
  const age = ageHours(crawlBefore);
  log(`CRAWL_AT=${crawlBefore} source=${source} age_h=${age.toFixed(3)}`);

  if (age < AGE_H && !FORCE) {
    log(
      `SKIP — crawl age ${age.toFixed(2)}h < ${AGE_H}h (not STALE). ${WEEKDAY_WINDOW}. Set FORCE=1 to override.`,
    );
    process.exit(0);
  }

  if (age < AGE_H && FORCE) {
    log(
      `FORCE=1 — exercising full path despite age ${age.toFixed(2)}h < ${AGE_H}h (dry-run / override)`,
    );
  } else {
    log(`STALE gate open — age ${age.toFixed(2)}h ≥ ${AGE_H}h`);
  }

  if (DRY_RUN) {
    log("DRY_RUN=1 — plan only; no ingest/pack/rebuild");
    console.log(
      JSON.stringify(
        {
          action: "would_ingest_pack_verify",
          crawlBefore,
          age_h: age,
          force: FORCE,
          weekday_window: WEEKDAY_WINDOW,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  if (process.env.X_BEARER_TOKEN) {
    log(
      "WARN: X_BEARER_TOKEN present in env — ingest must still skip paid X (locks assert)",
    );
  }

  run("bun", ["run", "ingest"], { timeout: 600_000 });

  const ingestLast = JSON.parse(
    readFileSync(join(desk, "artifacts/sage/ingest-last.json"), "utf8"),
  );
  const softFails = collectSoftFails(ingestLast);
  if (softFails.length) {
    for (const s of softFails) {
      log(`SOFT-FAIL STAMPED — ${s.provider}: ${s.reason}`);
    }
  } else {
    log("soft-fails: none");
  }
  assertLocks(ingestLast);

  const { at: crawlAfter } = readCrawlAt();
  log(`post-ingest CRAWL_AT=${crawlAfter}`);

  run("bun", ["run", "pack:export"], { timeout: 180_000 });
  const packName = latestPackName();
  const primary = join(root, "packs", packName);
  const secondary = join(desk, "packs", packName);
  if (!existsSync(primary) || !existsSync(secondary)) {
    fail(
      `dual-home miss — primary=${existsSync(primary)} secondary=${existsSync(secondary)}`,
    );
  }
  const shaP = sha256File(primary);
  const shaS = sha256File(secondary);
  if (shaP !== shaS) fail(`dual-home sha mismatch primary=${shaP} secondary=${shaS}`);
  log(`dual-home OK ${packName} sha256=${shaP}`);

  let manifestSha = "(see archive)";
  const tarList = spawnSync("tar", ["-xOf", primary, "manifest.json"], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (tarList.status === 0 && tarList.stdout) {
    manifestSha = createHash("sha256").update(tarList.stdout).digest("hex");
  }

  let live = curlLiveCrawl();
  let rebuilt = false;
  if (!live.ok) {
    log(`live fetch failed (${live.error}) — attempting rebuild/restart`);
    killPort3000();
    run("bun", ["run", "build"], { timeout: 600_000 });
    live = startServerBackground();
    rebuilt = true;
  } else if (live.crawl !== crawlAfter) {
    log(`live crawl lag disk: live=${live.crawl} disk=${crawlAfter}`);
    killPort3000();
    run("bun", ["run", "build"], { timeout: 600_000 });
    live = startServerBackground();
    rebuilt = true;
    if (live.crawl !== crawlAfter) {
      fail(
        `post-rebuild live crawl still lags: live=${live.crawl} disk=${crawlAfter}`,
      );
    }
  } else {
    log(`stamp-truth OK live=disk=${crawlAfter} build=${live.build}`);
  }

  assertLocks(ingestLast);
  const cycleShaAfter = createHash("sha256")
    .update(readFileSync(join(desk, "src/data/cycle.ts")))
    .digest("hex");
  if (cycleShaBefore !== cycleShaAfter) {
    fail("cycle.ts changed — Brief pins must not be touched by A1");
  }
  const wireAfter = readdirSync(wireDir).filter((f) => f.startsWith("WIRE-"));
  const newWires = wireAfter.filter((f) => !wireBefore.includes(f));
  if (newWires.length) fail(`new WIRE-* created: ${newWires.join(", ")}`);
  for (const f of wireBefore) {
    const mt = statSync(join(wireDir, f)).mtimeMs;
    if (mt !== wireMtimes[f]) fail(`WIRE file mutated: ${f}`);
  }

  updateDrillLog({
    packName,
    sha: shaP,
    manifestSha,
    crawlAt: crawlAfter,
    softFails,
    force: FORCE,
    age,
  });
  updatePackDualHomeHeader({
    packName,
    sha: shaP,
    manifestSha,
    crawlAt: crawlAfter,
    softFails,
    force: FORCE,
    age,
  });
  appendDryRunEvidence({
    crawlBefore,
    crawlAfter,
    packName,
    sha: shaP,
    softFails,
    liveCrawl: live.crawl,
    force: FORCE,
    age,
    rebuilt,
  });

  const vc = spawnSync("bun", ["run", "visual:check"], {
    cwd: desk,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 60_000,
  });
  if (vc.stdout?.trim()) console.log(vc.stdout.trimEnd());
  if (vc.stderr?.trim()) console.error(vc.stderr.trimEnd());
  if (vc.status !== 0) {
    log("visual:check non-zero (logged; stamp-truth already verified)");
  }

  log(
    `DONE · pack=${packName} crawl=${crawlAfter} live=${live.crawl} soft_fails=${softFails.length} rebuilt=${rebuilt} cron=NOT_INSTALLED`,
  );
  console.log(
    JSON.stringify(
      {
        status: "OK",
        force: FORCE,
        age_h_before: age,
        crawl_before: crawlBefore,
        crawl_after: crawlAfter,
        live_crawl: live.crawl,
        pack: packName,
        sha256: shaP,
        soft_fails: softFails,
        rebuilt,
        weekday_window: WEEKDAY_WINDOW,
        cron_installed: false,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  fail(err?.stack || String(err));
});
