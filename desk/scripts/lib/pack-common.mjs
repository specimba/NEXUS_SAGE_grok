/**
 * P2 wipe-resilience — shared helpers per refs/P2-CONTRACT.md
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  cpSync,
  rmSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const SCHEMA_VERSION = 1;
export const DEFAULT_LEAD_ID = "hf-incident";
export const LOCKED_CYCLE_WITHOUT_PRIMARY = "003";

/** Paths that must appear inside a valid sage pack archive (contract). */
export function expectedPackPaths(cycleId) {
  return [
    "manifest.json",
    "artifacts/sage/CURRENT.json",
    `artifacts/sage/digest-${cycleId}.json`,
    `artifacts/sage/digest-${cycleId}.md`,
    "snapshots/cycle.json",
    "snapshots/x-crawl.json",
    "src/data/cycle.ts",
    "src/data/digest-pack.ts",
    "src/data/x-crawl.ts",
  ];
}

/** Content paths hashed in manifest.files[] (all required except manifest itself). */
export function hashedPackPaths(cycleId) {
  return expectedPackPaths(cycleId).filter((p) => p !== "manifest.json");
}

export function deskRoot(cwd = process.cwd()) {
  return resolve(cwd);
}

export function nexusRoot(desk = deskRoot()) {
  return resolve(desk, "..");
}

export function primaryPackHome(desk = deskRoot()) {
  return resolve(nexusRoot(desk), "packs");
}

/**
 * Second home (contract): desk/packs/
 * Override with SAGE_PACK_HOME (operator Downloads / Drive).
 */
export function secondaryPackHome(desk = deskRoot()) {
  if (process.env.SAGE_PACK_HOME) return resolve(process.env.SAGE_PACK_HOME);
  return resolve(desk, "packs");
}

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
  return p;
}

export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

export function sha256File(path) {
  return sha256(readFileSync(path));
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function utcStamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function currentPath(desk = deskRoot()) {
  return process.env.SAGE_CURRENT_PATH
    ? resolve(process.env.SAGE_CURRENT_PATH)
    : resolve(desk, "artifacts/sage/CURRENT.json");
}

export function requireCurrentFile(desk = deskRoot()) {
  const path = currentPath(desk);
  if (!existsSync(path)) {
    throw new Error(`SAGE HARD GATE: missing CURRENT.json at ${path} — export/import refuse`);
  }
  let data;
  try {
    data = readJson(path);
  } catch (err) {
    throw new Error(`SAGE HARD GATE: unreadable CURRENT.json at ${path}: ${err.message}`);
  }
  if (!data?.id || typeof data.id !== "string") {
    throw new Error(`SAGE HARD GATE: CURRENT.json missing cycle id at ${path}`);
  }
  return { path, data };
}

/** Normalize files[] from contract array or legacy map. */
export function normalizeFileEntries(files) {
  if (Array.isArray(files)) {
    return files.map((e) => ({
      path: e.path,
      sha256: e.sha256,
    }));
  }
  if (files && typeof files === "object") {
    return Object.entries(files).map(([path, meta]) => ({
      path,
      sha256: typeof meta === "string" ? meta : meta?.sha256,
    }));
  }
  return [];
}

export function validateManifestSchema(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, errors: ["manifest missing or not an object"] };
  }
  if (manifest.schema !== SCHEMA_VERSION) {
    errors.push(`schema must be ${SCHEMA_VERSION} (got ${manifest.schema})`);
  }
  for (const k of ["pack_id", "created_at", "cycle", "lead_id", "lead_policy"]) {
    if (!manifest[k] || typeof manifest[k] !== "string") {
      errors.push(`missing required field: ${k}`);
    }
  }
  if (!manifest.app || manifest.app.name !== "nexus-sage-desk") {
    errors.push("app.name must be nexus-sage-desk");
  }
  if (!manifest.locks || typeof manifest.locks !== "object") {
    errors.push("missing locks");
  } else {
    if (manifest.locks.sol_ne_astra !== true) errors.push("locks.sol_ne_astra must be true");
    if (typeof manifest.locks.new_primary !== "boolean") {
      errors.push("locks.new_primary must be boolean");
    }
    if (manifest.locks.no_cycle_004_without_primary !== true) {
      errors.push("locks.no_cycle_004_without_primary must be true");
    }
    if (!Array.isArray(manifest.locks.deny)) errors.push("locks.deny must be array");
  }
  if (!manifest.homes?.primary || !manifest.homes?.secondary) {
    errors.push("homes.primary and homes.secondary required");
  }
  const entries = normalizeFileEntries(manifest.files);
  if (!entries.length) errors.push("files[] empty");
  return { ok: errors.length === 0, errors };
}

/** Fail-closed lock checks for pack contents / desk restore. */
export function validateLocks({ current, cycle, manifest }) {
  const errors = [];
  const cycleId = current?.id ?? cycle?.id ?? manifest?.cycle;
  const lead =
    cycle?.pins?.find((p) => p.kind === "lead")?.id ??
    manifest?.lead_id ??
    manifest?.locks?.lead_id;

  if (!cycleId) errors.push("missing cycle id");
  if (manifest?.cycle && current?.id && manifest.cycle !== current.id) {
    errors.push(`manifest.cycle ${manifest.cycle} ≠ CURRENT.id ${current.id}`);
  }
  if (cycle?.id && current?.id && cycle.id !== current.id) {
    errors.push(`cycle snapshot id ${cycle.id} ≠ CURRENT.id ${current.id}`);
  }
  if (manifest?.lead_id && lead && manifest.lead_id !== lead) {
    errors.push(`manifest.lead_id ${manifest.lead_id} ≠ cycle lead ${lead}`);
  }

  if (cycleId === LOCKED_CYCLE_WITHOUT_PRIMARY) {
    if (lead && lead !== DEFAULT_LEAD_ID) {
      errors.push(
        `lock violation: lead ≠ ${DEFAULT_LEAD_ID} while CURRENT/cycle still ${LOCKED_CYCLE_WITHOUT_PRIMARY} (got ${lead})`,
      );
    }
  }

  if (
    cycleId &&
    Number(cycleId) > Number(LOCKED_CYCLE_WITHOUT_PRIMARY) &&
    manifest?.locks?.new_primary !== true
  ) {
    errors.push(
      `lock violation: pack invents cycle ${cycleId} without new primary (locks.new_primary required)`,
    );
  }

  const deny = cycle?.trust?.deny ?? manifest?.locks?.deny ?? [];
  if (deny.length) {
    if (!deny.some((d) => /astra.*hf|hf.*astra/i.test(d))) {
      errors.push("lock violation: DENY must include Astra-as-HF (Sol≠Astra)");
    }
    if (!deny.some((d) => /civilization/i.test(d))) {
      errors.push("lock violation: DENY must include civilizations copy");
    }
  }

  return { ok: errors.length === 0, errors, cycleId, lead: lead ?? DEFAULT_LEAD_ID };
}

export function verifyManifestHashes(stagingRoot, manifest) {
  const errors = [];
  const entries = normalizeFileEntries(manifest?.files);
  const cycleId = manifest?.cycle;
  if (cycleId) {
    for (const rel of hashedPackPaths(cycleId)) {
      if (!entries.some((e) => e.path === rel)) {
        errors.push(`files[] missing required path: ${rel}`);
      }
    }
  }
  for (const { path: rel, sha256: want } of entries) {
    const abs = join(stagingRoot, rel);
    if (!existsSync(abs)) {
      errors.push(`missing file for hash: ${rel}`);
      continue;
    }
    const got = sha256File(abs);
    if (!want || got !== want) {
      errors.push(
        `hash mismatch: ${rel} (got ${String(got).slice(0, 12)}… want ${String(want).slice(0, 12)}…)`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

export function listTarPaths(archivePath) {
  const r = spawnSync("tar", ["-tzf", archivePath], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`tar -tzf failed: ${r.stderr || r.stdout}`);
  }
  return r.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^\.\//, ""));
}

export function assertArchiveComplete(archivePath, cycleId) {
  const listed = listTarPaths(archivePath);
  const want = expectedPackPaths(cycleId);
  const missing = want.filter((p) => !listed.includes(p) && !listed.includes(`./${p}`));
  if (missing.length) {
    throw new Error(`partial pack refused — missing in archive: ${missing.join(", ")}`);
  }
  const banned = listed.filter(
    (p) =>
      /(^|\/)node_modules(\/|$)/.test(p) ||
      /(^|\/)\.next(\/|$)/.test(p) ||
      /(^|\/)\.env/.test(p) ||
      /\.(pem|key)$/i.test(p) ||
      /(^|\/).*credentials.*/i.test(p) ||
      /\.db(-wal|-shm)?$/i.test(p),
  );
  if (banned.length) {
    throw new Error(`pack contains forbidden paths: ${banned.join(", ")}`);
  }
  return listed;
}

/** Write both homes; FAIL if either copy fails. */
export function writeDualHome(archivePath, desk = deskRoot()) {
  const name = basename(archivePath);
  const primary = ensureDir(primaryPackHome(desk));
  const secondary = ensureDir(secondaryPackHome(desk));
  const primaryDest = join(primary, name);
  const secondaryDest = join(secondary, name);

  if (resolve(archivePath) !== resolve(primaryDest)) {
    copyFileSync(archivePath, primaryDest);
  }
  if (!existsSync(primaryDest)) {
    throw new Error(`dual-home FAIL — primary missing after write: ${primaryDest}`);
  }

  if (resolve(primaryDest) !== resolve(secondaryDest)) {
    copyFileSync(primaryDest, secondaryDest);
  }
  if (!existsSync(secondaryDest)) {
    throw new Error(`dual-home FAIL — secondary missing after write: ${secondaryDest}`);
  }

  return {
    primary: primaryDest,
    secondary: secondaryDest,
    homes: { primary: primary + "/", secondary: secondary + "/" },
  };
}

export function extractTar(archivePath, destDir) {
  ensureDir(destDir);
  const r = spawnSync("tar", ["-xzf", archivePath, "-C", destDir], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`tar extract failed: ${r.stderr || r.stdout}`);
  }
}

export function runGateAndSmoke(desk = deskRoot()) {
  const gate = spawnSync("bun", ["scripts/check-current.mjs"], {
    cwd: desk,
    encoding: "utf8",
  });
  if (gate.status !== 0) {
    return {
      ok: false,
      step: "check-current",
      stdout: gate.stdout,
      stderr: gate.stderr,
    };
  }
  const test = spawnSync("bun", ["test", "src/lib/__tests__"], {
    cwd: desk,
    encoding: "utf8",
  });
  if (test.status !== 0) {
    return {
      ok: false,
      step: "unit-smoke",
      stdout: test.stdout,
      stderr: test.stderr,
    };
  }
  return { ok: true, gateOut: gate.stdout, testOut: test.stdout };
}

export function snapshotDeskState(desk, rollbackDir) {
  ensureDir(rollbackDir);
  const sage = join(desk, "artifacts/sage");
  if (existsSync(sage)) {
    cpSync(sage, join(rollbackDir, "artifacts/sage"), { recursive: true });
  }
  for (const f of ["cycle.ts", "digest-pack.ts", "x-crawl.ts"]) {
    const src = join(desk, "src/data", f);
    if (existsSync(src)) {
      ensureDir(join(rollbackDir, "src/data"));
      copyFileSync(src, join(rollbackDir, "src/data", f));
    }
  }
  const snap = join(desk, "artifacts/snapshots");
  if (existsSync(snap)) {
    cpSync(snap, join(rollbackDir, "artifacts/snapshots"), { recursive: true });
  }
  return rollbackDir;
}

/** Restore desk data dirs from a rollback snapshot. */
export function restoreRollback(desk, rollbackDir) {
  if (!rollbackDir || !existsSync(rollbackDir)) return false;
  const sageSrc = join(rollbackDir, "artifacts/sage");
  const sageDst = join(desk, "artifacts/sage");
  if (existsSync(sageSrc)) {
    rmSync(sageDst, { recursive: true, force: true });
    cpSync(sageSrc, sageDst, { recursive: true });
  }
  for (const f of ["cycle.ts", "digest-pack.ts", "x-crawl.ts"]) {
    const src = join(rollbackDir, "src/data", f);
    if (existsSync(src)) {
      ensureDir(join(desk, "src/data"));
      copyFileSync(src, join(desk, "src/data", f));
    }
  }
  const snapSrc = join(rollbackDir, "artifacts/snapshots");
  if (existsSync(snapSrc)) {
    const snapDst = join(desk, "artifacts/snapshots");
    rmSync(snapDst, { recursive: true, force: true });
    cpSync(snapSrc, snapDst, { recursive: true });
  }
  return true;
}

export function isSecretish(relPath, content) {
  if (/(^|\/)\.env|credentials|\.pem$|\.key$/i.test(relPath)) return true;
  if (typeof content === "string") {
    if (/BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/.test(content)) return true;
    if (/api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9]{20,}/i.test(content)) return true;
    if (/bearer\s+[A-Za-z0-9._\-]{20,}/i.test(content)) return true;
    if (/\b(sk|xoxb|xoxp|ghp|gho)[_-][A-Za-z0-9]{16,}/i.test(content)) return true;
  }
  return false;
}
