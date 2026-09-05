#!/usr/bin/env bun
/**
 * P2 pack:export — per refs/P2-CONTRACT.md
 * Dual-home: /workspace/nexus-sage/packs/ + desk/packs/ (or SAGE_PACK_HOME).
 * FAIL if CURRENT missing, lock violation, partial archive, or dual-home write fail.
 */
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  SCHEMA_VERSION,
  DEFAULT_LEAD_ID,
  assertArchiveComplete,
  deskRoot,
  ensureDir,
  expectedPackPaths,
  hashedPackPaths,
  isSecretish,
  primaryPackHome,
  requireCurrentFile,
  secondaryPackHome,
  sha256,
  sha256File,
  utcStamp,
  validateLocks,
  writeDualHome,
  writeJson,
} from "./lib/pack-common.mjs";

const desk = deskRoot();

async function loadDataModules() {
  const cycleMod = await import(resolve(desk, "src/data/cycle.ts"));
  const digestMod = await import(resolve(desk, "src/data/digest-pack.ts"));
  const digestLib = await import(resolve(desk, "src/lib/digest-pack.ts"));
  const crawlMod = await import(resolve(desk, "src/data/x-crawl.ts"));
  return { cycleMod, digestMod, digestLib, crawlMod };
}

function fail(msg, code = 1) {
  console.error(`pack:export FAIL — ${msg}`);
  process.exit(code);
}

async function main() {
  let current;
  try {
    current = requireCurrentFile(desk);
  } catch (err) {
    fail(err.message);
  }

  const { cycleMod, digestMod, digestLib, crawlMod } = await loadDataModules();
  const CYCLE = cycleMod.CYCLE;
  const WAVES = cycleMod.WAVES;
  const WAVE_TIMELINE = cycleMod.WAVE_TIMELINE;
  const DIGEST_ITEMS = digestMod.DIGEST_ITEMS;
  const DROPPED = digestMod.DROPPED;
  const PACK_AT = digestMod.PACK_AT;
  const PACK_SOURCE = digestMod.PACK_SOURCE;
  const CRAWL = crawlMod.CRAWL;
  const CRAWL_AT = crawlMod.CRAWL_AT;

  const leadPin = CYCLE.pins.find((p) => p.kind === "lead");
  const leadId = leadPin?.id ?? DEFAULT_LEAD_ID;
  const leadPolicy = CYCLE.leadPolicy ?? "unlock";

  const lockCheck = validateLocks({
    current: current.data,
    cycle: CYCLE,
    manifest: {
      cycle: current.data.id,
      lead_id: leadId,
      locks: {
        lead_id: leadId,
        new_primary: false,
        deny: CYCLE.trust?.deny ?? [],
      },
    },
  });
  if (!lockCheck.ok) {
    fail(`lock violation before export:\n  - ${lockCheck.errors.join("\n  - ")}`);
  }

  const cycleId = current.data.id;
  const createdAt = new Date().toISOString();
  const stamp = utcStamp();
  const packId = `sage-pack-${cycleId}-${stamp}`;
  const packName = `${packId}.tar.gz`;

  const primaryHome = ensureDir(primaryPackHome(desk));
  const secondaryHome = ensureDir(secondaryPackHome(desk));

  const staging = mkdtempSync(join(tmpdir(), "sage-pack-export-"));
  try {
    ensureDir(join(staging, "artifacts/sage"));
    copyFileSync(current.path, join(staging, "artifacts/sage/CURRENT.json"));

    const digestJson = {
      at: PACK_AT,
      source: PACK_SOURCE,
      cycle: cycleId,
      lead_id: leadId,
      items: DIGEST_ITEMS,
      dropped: DROPPED,
      plan: digestLib.renderPlan(DIGEST_ITEMS),
    };
    writeJson(join(staging, `artifacts/sage/digest-${cycleId}.json`), digestJson);
    writeFileSync(
      join(staging, `artifacts/sage/digest-${cycleId}.md`),
      digestLib.renderReport(DIGEST_ITEMS, PACK_AT),
      "utf8",
    );

    writeJson(join(staging, "snapshots/cycle.json"), {
      CYCLE,
      WAVES,
      WAVE_TIMELINE,
      exported_at: createdAt,
    });
    writeJson(join(staging, "snapshots/x-crawl.json"), {
      CRAWL_AT,
      CRAWL,
      exported_at: createdAt,
    });

    for (const f of ["cycle.ts", "digest-pack.ts", "x-crawl.ts"]) {
      const src = join(desk, "src/data", f);
      if (!existsSync(src)) fail(`missing data source ${f}`);
      const body = readFileSync(src, "utf8");
      if (isSecretish(`src/data/${f}`, body)) fail(`refusing secretish content in ${f}`);
      ensureDir(join(staging, "src/data"));
      writeFileSync(join(staging, "src/data", f), body, "utf8");
    }

    const files = [];
    for (const rel of hashedPackPaths(cycleId)) {
      const abs = join(staging, rel);
      if (!existsSync(abs)) fail(`staging incomplete — missing ${rel}`);
      files.push({ path: rel, sha256: sha256File(abs) });
    }

    const manifest = {
      schema: SCHEMA_VERSION,
      pack_id: packId,
      created_at: createdAt,
      cycle: cycleId,
      lead_id: leadId,
      lead_policy: leadPolicy,
      app: { name: "nexus-sage-desk", version: "0.2.0" },
      locks: {
        lead_id: leadId,
        sol_ne_astra: true,
        deny: CYCLE.trust?.deny ?? [],
        new_primary: false,
        no_cycle_004_without_primary: true,
      },
      files,
      homes: {
        primary: primaryHome + "/",
        secondary: secondaryHome + "/",
      },
    };
    writeJson(join(staging, "manifest.json"), manifest);

    const archivePath = join(primaryHome, packName);
    const tar = spawnSync(
      "tar",
      ["-czf", archivePath, "-C", staging, ...expectedPackPaths(cycleId)],
      { encoding: "utf8" },
    );
    if (tar.status !== 0) {
      fail(`tar create failed: ${tar.stderr || tar.stdout}`);
    }

    let listed;
    try {
      listed = assertArchiveComplete(archivePath, cycleId);
    } catch (err) {
      rmSync(archivePath, { force: true });
      fail(err.message);
    }

    let homes;
    try {
      homes = writeDualHome(archivePath, desk);
    } catch (err) {
      rmSync(archivePath, { force: true });
      fail(err.message);
    }

    console.log(`pack:export archive OK — ${listed.length} paths`);
    console.log(`pack:export wrote dual-home:`);
    console.log(`  primary:   ${homes.primary}`);
    console.log(`  secondary: ${homes.secondary}`);
    console.log(`  pack_id=${packId} cycle=${cycleId} lead=${leadId} schema=${SCHEMA_VERSION}`);
    console.log(`  manifest sha256=${sha256(readFileSync(join(staging, "manifest.json")))}`);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
