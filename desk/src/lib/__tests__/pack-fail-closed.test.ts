/**
 * P2 fail-closed F1–F5 proofs — refs/OPS-P2-FAILCLOSED-WIPE.md · P2-ACCEPT.md
 * Never invent OK: every case must reject (exit ≠ 0 / ok:false).
 */
import { describe, expect, test } from "bun:test";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  assertArchiveComplete,
  isSecretish,
  validateLocks,
  validateManifestSchema,
  verifyManifestHashes,
  writeJson,
} from "../../../scripts/lib/pack-common.mjs";

const desk = resolve(import.meta.dir, "../../..");

function baseManifest(overrides: Record<string, unknown> = {}) {
  return {
    schema: 1,
    pack_id: "sage-pack-003-test",
    created_at: "2026-09-11T13:00:00.000Z",
    cycle: "003",
    lead_id: "hf-incident",
    lead_policy: "unlock",
    app: { name: "nexus-sage-desk", version: "0.2.0" },
    locks: {
      lead_id: "hf-incident",
      sol_ne_astra: true,
      deny: ["Astra as HF attacker", "civilizations copy"],
      new_primary: false,
      no_cycle_004_without_primary: true,
    },
    files: [{ path: "artifacts/sage/CURRENT.json", sha256: "abc" }],
    homes: {
      primary: "/workspace/nexus-sage/packs/",
      secondary: "/workspace/nexus-sage/desk/packs/",
    },
    ...overrides,
  };
}

function goodCycle(overrides: Record<string, unknown> = {}) {
  return {
    id: "003",
    leadPolicy: "unlock",
    pins: [{ kind: "lead", id: "hf-incident" }],
    trust: {
      deny: ["X Ads mutation", "Missed-DNA as news", "Astra as HF attacker", "civilizations copy"],
    },
    ...overrides,
  };
}

describe("P2 fail-closed F1–F5", () => {
  test("F1: export with CURRENT missing → exit ≠ 0", () => {
    const missing = join(tmpdir(), `sage-missing-current-${Date.now()}.json`);
    if (existsSync(missing)) rmSync(missing);
    const r = spawnSync("bun", ["scripts/pack-export.mjs"], {
      cwd: desk,
      encoding: "utf8",
      env: { ...process.env, SAGE_CURRENT_PATH: missing },
    });
    expect(r.status).not.toBe(0);
    expect(`${r.stderr}${r.stdout}`).toMatch(/CURRENT|HARD GATE|missing/i);
  });

  test("F2: verifyManifestHashes rejects tampered file hash", () => {
    const staging = mkdtempSync(join(tmpdir(), "sage-f2-"));
    try {
      mkdirSync(join(staging, "artifacts/sage"), { recursive: true });
      const rel = "artifacts/sage/CURRENT.json";
      writeJson(join(staging, rel), { schema: 1, id: "003" });
      const manifest = baseManifest({
        files: [{ path: rel, sha256: "0".repeat(64) }],
      });
      const check = verifyManifestHashes(staging, manifest);
      expect(check.ok).toBe(false);
      expect(check.errors.some((e: string) => /hash mismatch/i.test(e))).toBe(true);
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  });

  test("F2: import with tampered CURRENT hash → exit ≠ 0 (desk CURRENT unchanged)", () => {
    const srcPack = resolve(desk, "../packs/sage-pack-003-20260911T093002Z.tar.gz");
    expect(existsSync(srcPack)).toBe(true);
    const work = mkdtempSync(join(tmpdir(), "sage-f2-import-"));
    const deskCurrent = join(desk, "artifacts/sage/CURRENT.json");
    const before = readFileSync(deskCurrent);
    try {
      const extract = spawnSync("tar", ["-xzf", srcPack, "-C", work], { encoding: "utf8" });
      expect(extract.status).toBe(0);
      const currentRel = "artifacts/sage/CURRENT.json";
      const currentAbs = join(work, currentRel);
      const cur = JSON.parse(readFileSync(currentAbs, "utf8"));
      cur.note = "TAMPERED-FOR-F2";
      writeFileSync(currentAbs, JSON.stringify(cur, null, 2) + "\n");
      // leave manifest.files[] hash stale → mismatch
      const badPack = join(work, "tampered.tar.gz");
      const tar = spawnSync(
        "tar",
        [
          "-czf",
          badPack,
          "-C",
          work,
          "manifest.json",
          "artifacts",
          "snapshots",
          "src",
        ],
        { encoding: "utf8" },
      );
      expect(tar.status).toBe(0);
      const r = spawnSync("bun", ["scripts/pack-import.mjs", "--", badPack], {
        cwd: desk,
        encoding: "utf8",
      });
      expect(r.status).not.toBe(0);
      expect(`${r.stderr}${r.stdout}`).toMatch(/hash mismatch|integrity/i);
      expect(readFileSync(deskCurrent).equals(before)).toBe(true);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });

  test("F3: inventing cycle 004 without new_primary → reject", () => {
    const check = validateLocks({
      current: { id: "004" },
      cycle: goodCycle({ id: "004", pins: [{ kind: "lead", id: "hf-incident" }] }),
      manifest: baseManifest({
        cycle: "004",
        locks: {
          lead_id: "hf-incident",
          sol_ne_astra: true,
          deny: ["Astra as HF attacker", "civilizations copy"],
          new_primary: false,
          no_cycle_004_without_primary: true,
        },
      }),
    });
    expect(check.ok).toBe(false);
    expect(check.errors.some((e: string) => /004|new primary/i.test(e))).toBe(true);
  });

  test("F3: import inventing cycle 004 → exit ≠ 0", () => {
    const srcPack = resolve(desk, "../packs/sage-pack-003-20260911T093002Z.tar.gz");
    const work = mkdtempSync(join(tmpdir(), "sage-f3-"));
    const deskCurrent = join(desk, "artifacts/sage/CURRENT.json");
    const before = readFileSync(deskCurrent);
    try {
      expect(spawnSync("tar", ["-xzf", srcPack, "-C", work]).status).toBe(0);
      const manifestPath = join(work, "manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.cycle = "004";
      manifest.pack_id = "sage-pack-004-evil";
      manifest.locks.new_primary = false;
      // rewrite CURRENT + cycle snapshot ids + rename digests so required-path check uses 004
      const curPath = join(work, "artifacts/sage/CURRENT.json");
      const cur = JSON.parse(readFileSync(curPath, "utf8"));
      cur.id = "004";
      writeFileSync(curPath, JSON.stringify(cur, null, 2) + "\n");
      const snapPath = join(work, "snapshots/cycle.json");
      const snap = JSON.parse(readFileSync(snapPath, "utf8"));
      snap.CYCLE.id = "004";
      writeFileSync(snapPath, JSON.stringify(snap, null, 2) + "\n");
      copyFileSync(
        join(work, "artifacts/sage/digest-003.json"),
        join(work, "artifacts/sage/digest-004.json"),
      );
      copyFileSync(
        join(work, "artifacts/sage/digest-003.md"),
        join(work, "artifacts/sage/digest-004.md"),
      );
      // rebuild hashes for mutated files but keep invent-004 lock fail
      const hashFile = (p: string) =>
        createHash("sha256").update(readFileSync(p)).digest("hex");
      for (const entry of manifest.files) {
        const abs = join(work, entry.path.replace("digest-003", "digest-004"));
        if (entry.path.includes("digest-003")) {
          entry.path = entry.path.replace("digest-003", "digest-004");
        }
        if (existsSync(join(work, entry.path))) {
          entry.sha256 = hashFile(join(work, entry.path));
        }
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      const badPack = join(work, "cycle004.tar.gz");
      expect(
        spawnSync("tar", ["-czf", badPack, "-C", work, "manifest.json", "artifacts", "snapshots", "src"])
          .status,
      ).toBe(0);
      const r = spawnSync("bun", ["scripts/pack-import.mjs", "--", badPack], {
        cwd: desk,
        encoding: "utf8",
      });
      expect(r.status).not.toBe(0);
      expect(`${r.stderr}${r.stdout}`).toMatch(/004|new primary|lock/i);
      expect(readFileSync(deskCurrent).equals(before)).toBe(true);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });

  test("F4: sol_ne_astra=false / Astra DENY strip → reject", () => {
    const schema = validateManifestSchema(
      baseManifest({
        locks: {
          lead_id: "hf-incident",
          sol_ne_astra: false,
          deny: ["Astra as HF attacker", "civilizations copy"],
          new_primary: false,
          no_cycle_004_without_primary: true,
        },
      }),
    );
    expect(schema.ok).toBe(false);
    expect(schema.errors.some((e: string) => /sol_ne_astra/i.test(e))).toBe(true);

    const denyStrip = validateLocks({
      current: { id: "003" },
      cycle: goodCycle({
        trust: { deny: ["X Ads mutation", "Missed-DNA as news", "civilizations copy"] },
      }),
      manifest: baseManifest(),
    });
    expect(denyStrip.ok).toBe(false);
    expect(denyStrip.errors.some((e: string) => /Astra|Sol/i.test(e))).toBe(true);
  });

  test("F4: import sol_ne_astra=false → exit ≠ 0", () => {
    const srcPack = resolve(desk, "../packs/sage-pack-003-20260911T093002Z.tar.gz");
    const work = mkdtempSync(join(tmpdir(), "sage-f4-"));
    const deskCurrent = join(desk, "artifacts/sage/CURRENT.json");
    const before = readFileSync(deskCurrent);
    try {
      expect(spawnSync("tar", ["-xzf", srcPack, "-C", work]).status).toBe(0);
      const manifestPath = join(work, "manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.locks.sol_ne_astra = false;
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      const badPack = join(work, "sol-flatten.tar.gz");
      expect(
        spawnSync("tar", ["-czf", badPack, "-C", work, "manifest.json", "artifacts", "snapshots", "src"])
          .status,
      ).toBe(0);
      const r = spawnSync("bun", ["scripts/pack-import.mjs", "--", badPack], {
        cwd: desk,
        encoding: "utf8",
      });
      expect(r.status).not.toBe(0);
      expect(`${r.stderr}${r.stdout}`).toMatch(/sol_ne_astra/i);
      expect(readFileSync(deskCurrent).equals(before)).toBe(true);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  });

  test("F5: secrets / .env / bearer banned", () => {
    expect(isSecretish(".env", "FOO=1")).toBe(true);
    expect(isSecretish("src/data/cycle.ts", "Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345")).toBe(
      true,
    );
    expect(isSecretish("src/data/cycle.ts", "token sk-abcdefghijklmnopqrstuvwxyz")).toBe(true);
    expect(isSecretish("src/data/cycle.ts", "xoxb-12345678901234567890-abcdef")).toBe(true);
    expect(isSecretish("src/data/cycle.ts", "const id = '003';")).toBe(false);

    const staging = mkdtempSync(join(tmpdir(), "sage-f5-"));
    try {
      // minimal valid-looking archive with forbidden .env
      mkdirSync(join(staging, "artifacts/sage"), { recursive: true });
      writeFileSync(join(staging, ".env"), "SECRET=1\n");
      for (const rel of [
        "manifest.json",
        "artifacts/sage/CURRENT.json",
        "artifacts/sage/digest-003.json",
        "artifacts/sage/digest-003.md",
        "snapshots/cycle.json",
        "snapshots/x-crawl.json",
        "src/data/cycle.ts",
        "src/data/digest-pack.ts",
        "src/data/x-crawl.ts",
      ]) {
        const abs = join(staging, rel);
        mkdirSync(join(abs, ".."), { recursive: true });
        if (!existsSync(abs)) writeFileSync(abs, rel.endsWith(".json") ? "{}\n" : "//\n");
      }
      const archive = join(staging, "bad.tar.gz");
      expect(
        spawnSync("tar", ["-czf", archive, "-C", staging, "."], { encoding: "utf8" }).status,
      ).toBe(0);
      expect(() => assertArchiveComplete(archive, "003")).toThrow(/forbidden|\.env/i);
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  });
});
