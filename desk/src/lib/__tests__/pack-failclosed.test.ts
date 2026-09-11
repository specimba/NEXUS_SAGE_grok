/**
 * P2 fail-closed proofs F1–F5 — refs/OPS-P2-FAILCLOSED-WIPE.md · P2-ACCEPT.md
 * Never invents OK; each case expects exit ≠ 0 / reject.
 */
import { describe, expect, test } from "bun:test";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import {
  assertArchiveComplete,
  extractTar,
  isSecretish,
  listTarPaths,
  readJson,
  sha256File,
  validateLocks,
  validateManifestSchema,
  verifyManifestHashes,
  writeJson,
} from "../../../scripts/lib/pack-common.mjs";

const DESK = join(import.meta.dir, "../../..");
const CURRENT = join(DESK, "artifacts/sage/CURRENT.json");

function run(cmd: string[], opts: { cwd?: string; env?: Record<string, string> } = {}) {
  return spawnSync(cmd[0]!, cmd.slice(1), {
    cwd: opts.cwd ?? DESK,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env ?? {}) },
  });
}

function latestPrimaryPack(): string {
  const r = spawnSync(
    "bash",
    ["-lc", "ls -t /workspace/nexus-sage/packs/sage-pack-*.tar.gz | head -1"],
    { encoding: "utf8" },
  );
  const p = (r.stdout || "").trim();
  expect(p.length).toBeGreaterThan(0);
  expect(existsSync(p)).toBe(true);
  return p;
}

function mutatePack(
  srcArchive: string,
  mutate: (staging: string, manifest: Record<string, unknown>) => void,
): string {
  const staging = mkdtempSync(join(tmpdir(), "sage-fc-mut-"));
  const outDir = mkdtempSync(join(tmpdir(), "sage-fc-out-"));
  try {
    extractTar(srcArchive, staging);
    const manifestPath = join(staging, "manifest.json");
    const manifest = readJson(manifestPath) as Record<string, unknown>;
    mutate(staging, manifest);
    writeJson(manifestPath, manifest);
    const out = join(outDir, "mutated.tar.gz");
    const paths = listTarPaths(srcArchive);
    const tar = spawnSync("tar", ["-czf", out, "-C", staging, ...paths], {
      encoding: "utf8",
    });
    if (tar.status !== 0) throw new Error(tar.stderr || tar.stdout || "tar fail");
    // keep outDir alive by copying to a durable temp under /tmp owned by us
    const durable = join(tmpdir(), `sage-fc-${Date.now()}.tar.gz`);
    copyFileSync(out, durable);
    return durable;
  } finally {
    rmSync(staging, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  }
}

describe("P2 fail-closed F1–F5", () => {
  test("F1: pack:export with CURRENT missing → exit ≠ 0", () => {
    expect(existsSync(CURRENT)).toBe(true);
    const bak = `${CURRENT}.f1-bak`;
    renameSync(CURRENT, bak);
    try {
      const r = run(["bun", "run", "pack:export"]);
      expect(r.status).not.toBe(0);
      const out = `${r.stdout || ""}\n${r.stderr || ""}`;
      expect(out).toMatch(/CURRENT|HARD GATE|missing/i);
      expect(out).not.toMatch(/pack:export wrote dual-home/);
    } finally {
      if (existsSync(bak) && !existsSync(CURRENT)) renameSync(bak, CURRENT);
      else if (existsSync(bak)) rmSync(bak, { force: true });
    }
    expect(existsSync(CURRENT)).toBe(true);
  });

  test("F2: import with tampered file hash → exit ≠ 0 · desk CURRENT unchanged", () => {
    const base = latestPrimaryPack();
    const before = readFileSync(CURRENT, "utf8");
    const bad = mutatePack(base, (staging, manifest) => {
      const cur = join(staging, "artifacts/sage/CURRENT.json");
      const data = readJson(cur);
      data.note = `${data.note || ""} · TAMPER-F2`;
      writeJson(cur, data);
      // leave manifest.files[] hash for CURRENT stale → mismatch
      void manifest;
    });
    try {
      const r = run(["bun", "run", "pack:import", "--", bad]);
      expect(r.status).not.toBe(0);
      const out = `${r.stdout || ""}\n${r.stderr || ""}`;
      expect(out).toMatch(/hash mismatch|integrity/i);
      expect(out).not.toMatch(/pack:import OK/);
      expect(readFileSync(CURRENT, "utf8")).toBe(before);
    } finally {
      rmSync(bad, { force: true });
    }
  });

  test("F3: import inventing cycle 004 / wrong lead → exit ≠ 0", () => {
    const base = latestPrimaryPack();
    const before = readFileSync(CURRENT, "utf8");
    const bad = mutatePack(base, (staging, manifest) => {
      const cur = join(staging, "artifacts/sage/CURRENT.json");
      const data = readJson(cur);
      data.id = "004";
      writeJson(cur, data);
      // rename digests so expectedPackPaths(004) might be sought; keep 003 digests
      // but force lock invent via CURRENT + manifest
      manifest.cycle = "004";
      (manifest.locks as Record<string, unknown>).new_primary = false;
      // rehash CURRENT so we fail on locks not hashes
      const files = manifest.files as Array<{ path: string; sha256: string }>;
      const entry = files.find((f) => f.path === "artifacts/sage/CURRENT.json");
      if (entry) entry.sha256 = sha256File(cur);
      // also bump cycle snapshot id + lead if present
      const snapPath = join(staging, "snapshots/cycle.json");
      const snap = readJson(snapPath);
      if (snap.CYCLE) {
        snap.CYCLE.id = "004";
        const lead = snap.CYCLE.pins?.find((p: { kind: string }) => p.kind === "lead");
        if (lead) lead.id = "wrong-lead";
      }
      writeJson(snapPath, snap);
      const snapEntry = files.find((f) => f.path === "snapshots/cycle.json");
      if (snapEntry) snapEntry.sha256 = sha256File(snapPath);
      manifest.lead_id = "wrong-lead";
      (manifest.locks as Record<string, unknown>).lead_id = "wrong-lead";
    });
    try {
      const r = run(["bun", "run", "pack:import", "--", bad]);
      expect(r.status).not.toBe(0);
      const out = `${r.stdout || ""}\n${r.stderr || ""}`;
      expect(out).toMatch(/lock violation|004|new primary|missing|refuse|incomplete/i);
      expect(out).not.toMatch(/pack:import OK/);
      expect(readFileSync(CURRENT, "utf8")).toBe(before);
    } finally {
      rmSync(bad, { force: true });
    }
  });

  test("F4: import Sol=Astra / lock flatten → exit ≠ 0", () => {
    const base = latestPrimaryPack();
    const before = readFileSync(CURRENT, "utf8");

    const badSol = mutatePack(base, (_staging, manifest) => {
      (manifest.locks as Record<string, unknown>).sol_ne_astra = false;
    });
    try {
      const r = run(["bun", "run", "pack:import", "--", badSol]);
      expect(r.status).not.toBe(0);
      const out = `${r.stdout || ""}\n${r.stderr || ""}`;
      expect(out).toMatch(/sol_ne_astra/i);
      expect(readFileSync(CURRENT, "utf8")).toBe(before);
    } finally {
      rmSync(badSol, { force: true });
    }

    const badDeny = mutatePack(base, (staging, manifest) => {
      const snapPath = join(staging, "snapshots/cycle.json");
      const snap = readJson(snapPath);
      if (snap.CYCLE?.trust?.deny) {
        snap.CYCLE.trust.deny = snap.CYCLE.trust.deny.filter(
          (d: string) => !/astra/i.test(d),
        );
      }
      (manifest.locks as Record<string, unknown>).deny = (
        (manifest.locks as { deny?: string[] }).deny ?? []
      ).filter((d) => !/astra/i.test(d));
      writeJson(snapPath, snap);
      const files = manifest.files as Array<{ path: string; sha256: string }>;
      const snapEntry = files.find((f) => f.path === "snapshots/cycle.json");
      if (snapEntry) snapEntry.sha256 = sha256File(snapPath);
    });
    try {
      const r = run(["bun", "run", "pack:import", "--", badDeny]);
      expect(r.status).not.toBe(0);
      const out = `${r.stdout || ""}\n${r.stderr || ""}`;
      expect(out).toMatch(/Astra-as-HF|Sol≠Astra|DENY|lock violation/i);
      expect(readFileSync(CURRENT, "utf8")).toBe(before);
    } finally {
      rmSync(badDeny, { force: true });
    }
  });

  test("F5: secrets / .env / bearer ban — helpers + live pack scan", () => {
    expect(isSecretish(".env", "FOO=bar")).toBe(true);
    expect(isSecretish("credentials.json", "{}")).toBe(true);
    expect(isSecretish("src/data/cycle.ts", "export const CYCLE = {}")).toBe(false);
    expect(
      isSecretish(
        "src/data/x-crawl.ts",
        "const x = 'api_key = \"sage_test_abcdefghijklmnopqrstuvwxyz\"'",
      ),
    ).toBe(true);
    expect(
      isSecretish(
        "src/data/x-crawl.ts",
        "Authorization: Bearer sage_test_abcdefghijklmnopqrstuvwx",
      ),
    ).toBe(true);
    expect(
      isSecretish(
        "src/data/x-crawl.ts",
        "token xoxb-12345678901234567890-abcdefghij",
      ),
    ).toBe(true);

    const base = latestPrimaryPack();
    // forge archive containing .env → assertArchiveComplete refuses
    const staging = mkdtempSync(join(tmpdir(), "sage-fc-sec-"));
    try {
      extractTar(base, staging);
      writeFileSync(join(staging, ".env"), "SECRET=1\n", "utf8");
      const forged = join(tmpdir(), `sage-fc-env-${Date.now()}.tar.gz`);
      const paths = [...listTarPaths(base), ".env"];
      const tar = spawnSync("tar", ["-czf", forged, "-C", staging, ...paths], {
        encoding: "utf8",
      });
      expect(tar.status).toBe(0);
      expect(() => assertArchiveComplete(forged, "003")).toThrow(/forbidden|\.env/i);
      rmSync(forged, { force: true });
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }

    // live dual-home pack scan — no secret markers in members
    const listed = listTarPaths(base);
    expect(listed.some((p) => /(^|\/)\.env/.test(p))).toBe(false);
    const strings = spawnSync("bash", ["-lc", `tar -xOzf '${base}' | tr -d '\\0' | head -c 5000000`], {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    const blob = strings.stdout || "";
    expect(blob).not.toMatch(/BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/);
    expect(blob).not.toMatch(/\bxoxb-[0-9A-Za-z-]+/);
    expect(blob).not.toMatch(/\bsk-[A-Za-z0-9]{20,}/);
    expect(blob).not.toMatch(/bearer\s+[A-Za-z0-9._-]{20,}/i);
  });

  test("helpers: validateManifestSchema / validateLocks / verifyManifestHashes unit rejects", () => {
    const schema = validateManifestSchema({
      schema: 1,
      pack_id: "x",
      created_at: "t",
      cycle: "003",
      lead_id: "hf-incident",
      lead_policy: "unlock",
      app: { name: "nexus-sage-desk", version: "0.2.0" },
      locks: {
        lead_id: "hf-incident",
        sol_ne_astra: false,
        deny: [],
        new_primary: false,
        no_cycle_004_without_primary: true,
      },
      files: [{ path: "artifacts/sage/CURRENT.json", sha256: "abc" }],
      homes: { primary: "/p", secondary: "/s" },
    });
    expect(schema.ok).toBe(false);
    expect(schema.errors.some((e: string) => /sol_ne_astra/.test(e))).toBe(true);

    const locks = validateLocks({
      current: { id: "004" },
      cycle: {
        id: "004",
        pins: [{ kind: "lead", id: "wrong" }],
        trust: { deny: ["civilizations copy"] },
      },
      manifest: {
        cycle: "004",
        lead_id: "wrong",
        locks: { new_primary: false, deny: ["civilizations copy"] },
      },
    });
    expect(locks.ok).toBe(false);
    expect(locks.errors.some((e: string) => /004|new primary|Astra|DENY/i.test(e))).toBe(
      true,
    );

    const staging = mkdtempSync(join(tmpdir(), "sage-fc-hash-"));
    try {
      mkdirSync(join(staging, "artifacts/sage"), { recursive: true });
      writeFileSync(join(staging, "artifacts/sage/CURRENT.json"), '{"id":"003"}\n');
      const hash = verifyManifestHashes(staging, {
        cycle: "003",
        files: [
          {
            path: "artifacts/sage/CURRENT.json",
            sha256: "deadbeef",
          },
        ],
      });
      expect(hash.ok).toBe(false);
      expect(hash.errors.some((e: string) => /hash mismatch|missing required/i.test(e))).toBe(
        true,
      );
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  });
});
