import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const DESK = join(import.meta.dir, "../../..");
const STAGE = join(DESK, "scripts/backup-stage.sh");
const LIST = readFileSync(join(DESK, "scripts/backup-allowlist.txt"), "utf8")
  .split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean);
const tmp = mkdtempSync(join(tmpdir(), "backup-stage-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const sh = (args: string[], cwd: string) => {
  const p = Bun.spawnSync(args, { cwd, env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  return { code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() };
};
function put(root: string, rel: string, body = "{}\n") {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}
const ALLOWED = [
  "desk/artifacts/sage/CURRENT.json", "desk/artifacts/sage/ingest-last.json", "desk/artifacts/sage/source-state.json",
  "desk/artifacts/sage/source-health.json", "desk/artifacts/sage/lead-history.json", "desk/artifacts/sage/wire-last.json",
  "desk/artifacts/sage/digest-003.json", "desk/artifacts/sage/packs/2026-09-25T15.json",
  "desk/src/data/wire.ts", "desk/src/data/source-health.ts", "desk/src/data/lead-pick.ts", "packs/drill-log.md",
];
const PLANTED = [
  "desk/artifacts/sage/feedback.json", "desk/artifacts/sage/notes.json", "desk/artifacts/sage/taste-votes.json",
  "desk/src/data/feedback.json", "desk/src/data/notes.json", "desk/src/data/taste-votes.json",
  "desk/artifacts/sage/packs/feedback.json", "desk/artifacts/sage/hn-cache/x.json",
  "desk/src/data/x-taste.ts", "desk/artifacts/sage/x-taste-last.json", "desk/.env",
];

function repo(name: string) {
  const root = join(tmp, name);
  mkdirSync(root, { recursive: true });
  sh(["git", "init", "-q"], root);
  for (const f of [...ALLOWED, ...PLANTED]) put(root, f);
  return root;
}
const staged = (root: string) => sh(["git", "diff", "--cached", "--name-only"], root).out.trim().split("\n").filter(Boolean).sort();

describe("backup commit stages a fixed allowlist only", () => {
  test("planted feedback/notes/taste-votes are NOT staged; allowlisted crawl/Wire/lead/health files are", () => {
    const root = repo("real");
    const r = sh(["bash", STAGE, root], DESK);
    expect(r.code).toBe(0);
    const s = staged(root);
    expect(s).toEqual([...ALLOWED].sort());
    for (const f of PLANTED) expect(s).not.toContain(f);
  });
  test("--dry (shadow) stages nothing and lists only allowlisted paths", () => {
    const root = repo("dry");
    const r = sh(["bash", STAGE, root, "--dry"], DESK);
    expect(r.code).toBe(0);
    expect(staged(root)).toEqual([]);
    const listed = r.out.split("\n").filter((l) => l.startsWith("would stage ")).map((l) => l.slice(12)).sort();
    expect(listed).toEqual([...ALLOWED].sort());
    for (const f of PLANTED) expect(r.out).not.toContain(f);
  });
  test("allowlist is exact files / one-segment globs — never a directory, never a catch-all", () => {
    for (const l of LIST) {
      expect(l.endsWith("/")).toBe(false);
      expect(l).not.toMatch(/\*\*|^\.|\/\*$|\/\*\.(json|ts|md)$/);
      expect(l).toMatch(/\.(json|ts|md)$/);
    }
    expect(LIST).not.toContain("desk/artifacts/sage");
    expect(LIST).not.toContain("desk/src/data");
    expect(LIST).toEqual(expect.arrayContaining([
      "desk/artifacts/sage/lead-history.json", "desk/artifacts/sage/ingest-last.json", "desk/artifacts/sage/source-state.json",
      "desk/artifacts/sage/source-health.json", "desk/artifacts/sage/wire-last.json", "desk/src/data/wire.ts",
    ]));
  });
  test("cf-build.sh stages only via backup-stage.sh (no add -A / add . / directory add)", () => {
    const cf = readFileSync(join(DESK, "scripts/cf-build.sh"), "utf8").split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
    expect(cf).toContain('bash scripts/backup-stage.sh "$REPO_ROOT"');
    expect(cf).not.toMatch(/git[^\n]*\badd\b/);
    expect(cf).not.toMatch(/CRAWL_PATHS/);
    const helper = readFileSync(STAGE, "utf8");
    expect(helper).not.toMatch(/add\s+(-A|--all|\.)(\s|$)/);
  });
});
