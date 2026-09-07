#!/usr/bin/env bun
/**
 * A2 — Digest DUE → WROTE → dual-home pack:export (OPS-A1-A3-AUTOMATION.md)
 *
 * Weekday daytime only (Mon–Fri · 09:00–17:00 Europe/Istanbul) unless A2_FORCE_WINDOW=1.
 * No overnight firehose. No Brief pollution · no paid X · no WIRE · no cycle 004.
 *
 * Flow:
 *   1. Window guard (Istanbul)
 *   2. bun run digest:tick
 *   3. if WROTE → pack:export → update PACK-DUAL-HOME + drill-log factual headers
 *   4. HOLD → no export (exit 0)
 *
 * Usage: bun run a2:tick
 * Env: A2_LOG · A2_FORCE_WINDOW=1 (tests only)
 */
import {
  appendFileSync,
  copyFileSync,
  
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const desk = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const root = resolve(desk, "..");
const LOG = process.env.A2_LOG || resolve(root, "logs/a2-digest.log");
const FORCE_WINDOW = process.env.A2_FORCE_WINDOW === "1";

function log(line) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;
  console.log(msg);
  try {
    mkdirSync(resolve(root, "logs"), { recursive: true });
    appendFileSync(LOG, msg + "\n", "utf8");
  } catch {
    /* ignore */
  }
}

function istanbulParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );
  const weekday = parts.weekday; // Mon..Sun
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  return { weekday, hour, minute };
}

function inWindow() {
  if (FORCE_WINDOW) return { ok: true, reason: "A2_FORCE_WINDOW=1" };
  const { weekday, hour, minute } = istanbulParts();
  const wdOk = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  // 09:00 inclusive through 16:59 (matches cron 9-16)
  const hourOk = hour >= 9 && hour <= 16;
  const ok = wdOk && hourOk;
  return {
    ok,
    reason: `Istanbul ${weekday} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} · weekday=${wdOk} · hour9-16=${hourOk}`,
  };
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

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function latestPackName() {
  const names = readdirSync(join(root, "packs"))
    .filter((n) => /^sage-pack-003-.*\.tar\.gz$/.test(n))
    .sort();
  if (!names.length) throw new Error("no sage-pack-003-*.tar.gz after export");
  return names[names.length - 1];
}

function readCrawlAt() {
  const p = join(desk, "src/data/x-crawl.ts");
  const src = readFileSync(p, "utf8");
  const m = src.match(/CRAWL_AT\s*=\s*"([^"]+)"/);
  return m?.[1] || "unknown";
}

function updateDrillLog({ packName, sha, manifestSha, packIdDigest }) {
  const path = join(root, "packs/drill-log.md");
  const packId = packName.replace(/\.tar\.gz$/, "");
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
- A2 unattended DUE→WROTE→dual-home · digest pack_id \`${packIdDigest || "?"}\`
- Dual-home pack \`${packId}\` identical both homes
- Freeze ON · cycle 003 / hf-incident · no digest 004 · no craft · no WIRE · no paid X · Bluesky DENY
- Manifest sha256 \`${manifestSha}\`
- Window: Europe/Istanbul Mon–Fri 09–16 (+ 09:00 catch-up)
- Reviewer stamp pending (Coder factual only)
`;
  writeFileSync(path, body, "utf8");
  try {
    mkdirSync(join(desk, "packs"), { recursive: true });
    copyFileSync(path, join(desk, "packs/drill-log.md"));
  } catch {
    /* optional */
  }
  log(`updated ${path}`);
}

function updatePackDualHomeHeader({ packName, sha, manifestSha, crawlAt, packIdDigest }) {
  const path = join(root, "refs/PACK-DUAL-HOME.md");
  const prev = existsSync(path) ? readFileSync(path, "utf8") : "";
  const stampIdx = prev.search(/^### Reviewer /m);
  let remainder = stampIdx >= 0 ? prev.slice(stampIdx) : "";
  if (remainder.startsWith("### Reviewer stamp — pending")) {
    const next = remainder.search(/^### Reviewer stamp — 20/m);
    remainder = next >= 0 ? remainder.slice(next) : "";
  }
  const stamp = packName.match(/sage-pack-003-(.+)\.tar\.gz$/)?.[1] || "unknown";
  const header = `# Pack dual-home — latest export

**UTC:** ${stamp}  
**Pack:** \`${packName}\`

| Home | Path |
|------|------|
| Primary (VM) | \`/workspace/nexus-sage/packs/${packName}\` |
| Desk mirror | \`/workspace/nexus-sage/desk/packs/${packName}\` |
| Operator | Windows \`Downloads\\\\nexus-sage-packs\\\\\` or Drive — see \`P2-EXPORT-IMPORT.md\` |

**Locks:** cycle \`003\` · lead \`hf-incident\` · \`sol_ne_astra\` · no \`004\` without primary  

**Digest cadence:** A2 WROTE · pack_id \`${packIdDigest || "?"}\`  

**Crawl / ingest:** \`${crawlAt}\`  

**sha256 (archive):** \`${sha}\`  
**manifest sha256:** \`${manifestSha}\`  

**Commands:** \`bun run pack:export\` · \`bun run a2:tick\` · \`bun run digest:tick\` · \`bun run ingest\`

**A2 note:** unattended DUE→WROTE→dual-home · Istanbul weekday window (+09:00 catch-up) · no overnight  

**Soft-fails:** (see ingest-last / freeze note — A2 does not ingest)

### Reviewer stamp — pending

(Factual dual-home above from Coder A2 auto-export. Reviewer owns PASS/FAIL stamp.)

`;
  writeFileSync(
    path,
    header + (remainder ? "\n" + remainder.replace(/^\n+/, "") : ""),
    "utf8",
  );
  log(`updated factual header ${path}`);
}

function parseDigestPackId(out) {
  const m = out.match(/pack_id[=:]?\s*([0-9T:-]+)/i) || out.match(/WROTE[^\n]*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2})/);
  return m?.[1] || null;
}

const win = inWindow();
log(`A2 start — ${win.reason}`);
if (!win.ok) {
  log("A2 SKIP — outside Istanbul weekday 09–16 window (set A2_FORCE_WINDOW=1 to override)");
  process.exit(0);
}

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

const packIdDigest = parseDigestPackId(tick.out);
log("A2 WROTE — running pack:export dual-home");
const exp = run("bun", ["scripts/pack-export.mjs"]);
if (exp.status !== 0) {
  log(`FAIL — pack:export exit=${exp.status}`);
  process.exit(exp.status || 1);
}

try {
  const packName = latestPackName();
  const primary = join(root, "packs", packName);
  const secondary = join(desk, "packs", packName);
  if (!existsSync(primary) || !existsSync(secondary)) {
    throw new Error(`dual-home miss primary=${existsSync(primary)} secondary=${existsSync(secondary)}`);
  }
  const shaP = sha256File(primary);
  const shaS = sha256File(secondary);
  if (shaP !== shaS) throw new Error(`dual-home sha mismatch`);
  // manifest sha best-effort from tar listing skip — use archive sha note
  const manifestSha = "see archive";
  const crawlAt = readCrawlAt();
  updateDrillLog({ packName, sha: shaP, manifestSha, packIdDigest });
  updatePackDualHomeHeader({
    packName,
    sha: shaP,
    manifestSha,
    crawlAt,
    packIdDigest,
  });
  log(`A2 OK — DUE→WROTE→dual-home · ${packName} · sha256=${shaP}`);
} catch (err) {
  log(`FAIL — post-export stamp: ${err.message || err}`);
  process.exit(1);
}
process.exit(0);
