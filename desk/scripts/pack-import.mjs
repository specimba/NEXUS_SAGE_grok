#!/usr/bin/env bun
/**
 * P2 pack:import — per refs/P2-CONTRACT.md
 * Unpack → schema → hashes → locks → rollback snapshot → restore → gate+smoke.
 * On any post-restore fail: restore rollback, exit non-zero.
 */
import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  deskRoot,
  ensureDir,
  expectedPackPaths,
  extractTar,
  primaryPackHome,
  readJson,
  requireCurrentFile,
  restoreRollback,
  runGateAndSmoke,
  snapshotDeskState,
  utcStamp,
  validateLocks,
  validateManifestSchema,
  verifyManifestHashes,
} from "./lib/pack-common.mjs";

const desk = deskRoot();

function fail(msg, code = 1) {
  console.error(`pack:import FAIL — ${msg}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = argv.slice(2).filter((a) => a !== "--");
  return { path: args[0] };
}

function restoreFromStaging(staging, deskRootPath) {
  ensureDir(join(deskRootPath, "artifacts/sage"));
  const currentSrc = join(staging, "artifacts/sage/CURRENT.json");
  copyFileSync(currentSrc, join(deskRootPath, "artifacts/sage/CURRENT.json"));

  const cycleId = readJson(currentSrc).id;
  for (const rel of [
    `artifacts/sage/digest-${cycleId}.json`,
    `artifacts/sage/digest-${cycleId}.md`,
  ]) {
    const src = join(staging, rel);
    if (existsSync(src)) copyFileSync(src, join(deskRootPath, rel));
  }

  ensureDir(join(deskRootPath, "artifacts/snapshots"));
  for (const f of ["cycle.json", "x-crawl.json"]) {
    const src = join(staging, "snapshots", f);
    if (existsSync(src)) {
      copyFileSync(src, join(deskRootPath, "artifacts/snapshots", f));
    }
  }

  ensureDir(join(deskRootPath, "src/data"));
  for (const f of ["cycle.ts", "digest-pack.ts", "x-crawl.ts"]) {
    const src = join(staging, "src/data", f);
    if (!existsSync(src)) fail(`pack missing src/data/${f}`);
    copyFileSync(src, join(deskRootPath, "src/data", f));
  }
}

function main() {
  const { path: packArg } = parseArgs(process.argv);
  if (!packArg) {
    fail("usage: bun run pack:import -- <path-to-sage-pack-*.tar.gz>");
  }
  const archivePath = resolve(packArg);
  if (!existsSync(archivePath)) {
    fail(`pack not found: ${archivePath}`);
  }

  const staging = mkdtempSync(join(tmpdir(), "sage-pack-import-"));
  let rollbackDir = null;
  let restored = false;
  try {
    try {
      extractTar(archivePath, staging);
    } catch (err) {
      fail(err.message);
    }

    const manifestPath = join(staging, "manifest.json");
    if (!existsSync(manifestPath)) fail("pack missing manifest.json");
    const manifest = readJson(manifestPath);

    const schemaCheck = validateManifestSchema(manifest);
    if (!schemaCheck.ok) {
      fail(`manifest schema:\n  - ${schemaCheck.errors.join("\n  - ")}`);
    }

    const hashCheck = verifyManifestHashes(staging, manifest);
    if (!hashCheck.ok) {
      fail(`hash mismatch / integrity:\n  - ${hashCheck.errors.join("\n  - ")}`);
    }

    const currentPath = join(staging, "artifacts/sage/CURRENT.json");
    if (!existsSync(currentPath)) {
      fail("import without valid CURRENT refuses desk ready — missing artifacts/sage/CURRENT.json");
    }
    let current;
    try {
      current = readJson(currentPath);
    } catch {
      fail("import without valid CURRENT refuses desk ready — unreadable CURRENT.json");
    }
    if (!current?.id) {
      fail("import without valid CURRENT refuses desk ready — no cycle id");
    }

    const cycleSnapPath = join(staging, "snapshots/cycle.json");
    if (!existsSync(cycleSnapPath)) fail("pack missing snapshots/cycle.json");
    const cycleSnap = readJson(cycleSnapPath);
    const cycle = cycleSnap.CYCLE ?? cycleSnap;

    const lockCheck = validateLocks({ current, cycle, manifest });
    if (!lockCheck.ok) {
      fail(`lock violation:\n  - ${lockCheck.errors.join("\n  - ")}`);
    }

    const deskCurrentPath = join(desk, "artifacts/sage/CURRENT.json");
    if (existsSync(deskCurrentPath)) {
      try {
        const deskCurrent = readJson(deskCurrentPath);
        if (deskCurrent.id === "003" && lockCheck.lead !== "hf-incident") {
          fail(
            `lock violation: lead ≠ hf-incident while desk CURRENT still 003 (got ${lockCheck.lead})`,
          );
        }
      } catch {
        /* wiped */
      }
    }

    for (const rel of expectedPackPaths(current.id)) {
      if (!existsSync(join(staging, rel))) {
        fail(`pack incomplete — missing ${rel}`);
      }
    }

    rollbackDir = join(primaryPackHome(desk), `rollback-${utcStamp()}`);
    snapshotDeskState(desk, rollbackDir);
    console.log(`pack:import rollback saved → ${rollbackDir}`);

    restoreFromStaging(staging, desk);
    restored = true;

    let gate;
    try {
      gate = requireCurrentFile(desk);
    } catch (err) {
      restoreRollback(desk, rollbackDir);
      fail(`post-import CURRENT gate: ${err.message} — rollback restored`);
    }

    const smoke = runGateAndSmoke(desk);
    if (!smoke.ok) {
      restoreRollback(desk, rollbackDir);
      fail(
        `post-import smoke (${smoke.step}) failed — rollback restored\n${smoke.stderr || smoke.stdout}`,
      );
    }

    console.log(`pack:import OK — cycle ${gate.data.id} lead ${lockCheck.lead}`);
    console.log(`  archive:  ${archivePath}`);
    console.log(`  rollback: ${rollbackDir}`);
    console.log(`  gate: ${(smoke.gateOut || "").trim()}`);
    console.log(`  smoke: unit tests passed`);
  } catch (err) {
    if (restored && rollbackDir) {
      try {
        restoreRollback(desk, rollbackDir);
        console.error(`pack:import restored rollback after error`);
      } catch (rbErr) {
        console.error(`pack:import rollback restore also failed: ${rbErr.message}`);
      }
    }
    if (err && !String(err.message || err).startsWith("pack:import FAIL")) {
      fail(err.message || String(err));
    }
    throw err;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

main();
