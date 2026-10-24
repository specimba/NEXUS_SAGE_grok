import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DESK = join(import.meta.dir, "../../..");
const src = readFileSync(join(DESK, "scripts/intel-export.ts"), "utf8");

describe("Intel plan 5 — intel-export (box-only Gmail + X snapshot export)", () => {
  test("fresh temp clone, never /workspace/nexus-sage, only the snapshot files, ff-only, never force", () => {
    expect(src).toContain('mkdtempSync(join(tmpdir(), "intel-export-"))');
    expect(src).toContain('const FORBIDDEN_ROOT = "/workspace/nexus-sage"');
    expect(src).toMatch(/INTEL_EXPORT_FILES = \[\s*"desk\/src\/data\/gmail-news\.ts",\s*"desk\/artifacts\/sage\/x-taste-last\.json",\s*"desk\/src\/data\/x-taste\.ts",\s*"desk\/src\/data\/sage-desk-config\.ts",\s*"desk\/artifacts\/sage\/x-taste-refresh-last\.json",\s*\]/);
    expect(src).toContain('["merge-base", "--is-ancestor", "origin/main", "HEAD"]');
    expect(src).toContain('["push", "--quiet", "origin", "HEAD:main"]');
    const code = src.split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*\*)/.test(l)).join("\n");
    expect(code).not.toMatch(/--force|"-f"|\+HEAD|add", "-A"|add", "\."/);
    expect(src).toContain("refusing: unexpected changed files");
    expect(src).toContain("refusing: gmail-news.ts carries an address or snippet field");
  });
  test("CI refuses; --clone-from without --dry-run refuses; a dry-run proof is committed", () => {
    const ci = spawnSync("bun", [join(DESK, "scripts/intel-export.ts"), "--gmail", "x"], { env: { ...process.env, CI: "1" }, encoding: "utf8" });
    expect(ci.status).toBe(0);
    expect(ci.stdout).toContain("box-only");
    const env = { ...process.env };
    delete env.CI; delete env.GITLAB_CI; delete env.GITHUB_ACTIONS;
    const nd = spawnSync("bun", [join(DESK, "scripts/intel-export.ts"), "--gmail", join(DESK, "src/lib/__tests__/fixtures/gmail-search-sample.json"), "--clone-from", "/nonexistent"], { env, encoding: "utf8" });
    expect(nd.status).toBe(1);
    expect(nd.stderr).toContain("dry-run only");
    const proof = readFileSync(join(DESK, "../refs/INTEL-EXPORT-DRYRUN.md"), "utf8");
    expect(proof).toContain("intel-export: DRY-RUN OK");
    expect(proof).toContain("no commit, no push");
    expect(proof).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]/i);
  });
});
