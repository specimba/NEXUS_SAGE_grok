import { describe, expect, test } from "bun:test";
import { execSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

// PASS-Q1G: two consecutive CI-like runs, each a fresh depth-1 clone of a local bare remote. Run 2 must see run 1's state.
const desk = resolve(import.meta.dir, "../../..");
const sh = (cmd: string, cwd: string) => execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const gitEnv = "-c user.name=t -c user.email=t@t -c commit.gpgsign=false";

function fixtureRemote() {
  const root = mkdtempSync(resolve(tmpdir(), "q1g-"));
  const seed = resolve(root, "seed");
  for (const d of ["desk/scripts", "desk/src/lib", "desk/src/data", "desk/artifacts/sage"]) mkdirSync(resolve(seed, d), { recursive: true });
  for (const f of ["scripts/reader-hash.ts", "scripts/watchdog.ts", "scripts/ci-state.sh", "src/lib/reader-hash.ts", "tsconfig.json"])
    copyFileSync(resolve(desk, f), resolve(seed, "desk", f));
  writeFileSync(resolve(seed, "desk/src/data/x-crawl.ts"), 'export const CRAWL_AT = "2026-10-10T08:00:00Z";\n');
  writeFileSync(resolve(seed, "desk/artifacts/sage/ingest-last.json"), "{}\n");
  sh(`git init -q -b main && git add -- desk && git ${gitEnv} commit -q -m seed`, seed);
  sh(`git clone -q --bare seed remote.git`, root);
  return root;
}

function ciRun(root: string, n: number) {
  const repo = resolve(root, `run${n}`);
  sh(`git clone -q --depth 1 --branch main file://${resolve(root, "remote.git")} run${n}`, root);
  const d = resolve(repo, "desk");
  const env = { ...process.env, WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: resolve(root, `hash${n}.out`), WATCHDOG_MAX_AGE_H: "10" };
  writeFileSync(env.GITHUB_OUTPUT, "");
  const seed = sh("bash scripts/ci-state.sh seed", d);
  const pre = spawnSync("bun", ["scripts/watchdog.ts", "--pre"], { cwd: d, encoding: "utf8", env });
  const hash = JSON.parse(spawnSync("bun", ["scripts/reader-hash.ts"], { cwd: d, encoding: "utf8", env }).stdout);
  const changed = String(hash.changed);
  spawnSync("bun", ["scripts/reader-hash.ts", "--commit", changed === "true" ? "published" : "skipped"], { cwd: d, env });
  sh(`bash scripts/ci-state.sh stage ${changed}`, d);
  sh(`git ${gitEnv} commit -q -m run${n} && git push -q origin HEAD:main`, d);
  const lc = JSON.parse(readFileSync(resolve(d, "artifacts/sage/last-checked.json"), "utf8"));
  return { seed, pre: pre.stdout + pre.stderr, preStatus: pre.status, hash, lc };
}

describe("PASS-Q1G state persists across fresh depth-1 clones", () => {
  test("run 1 cold start, run 2 sees prev, changed=false, no 'first run', checked_at advances", () => {
    const root = fixtureRemote();
    const r1 = ciRun(root, 1);
    expect(r1.pre).toContain("watchdog: first run");
    expect(r1.hash.prev).toBeNull();
    expect(r1.hash.changed).toBe(true);
    const r2 = ciRun(root, 2);
    expect(r2.preStatus).toBe(0);
    expect(r2.pre).not.toContain("first run");
    expect(r2.hash.prev).toBe(r1.hash.reader_hash);
    expect(r2.hash.changed).toBe(false);
    expect(r2.lc.last_run).toBe("skipped");
    expect(Date.parse(r2.lc.checked_at)).toBeGreaterThan(Date.parse(r1.lc.checked_at));
    // the skip path committed the fresh last-checked.json (not reverted to run 1's)
    const r3 = ciRun(root, 3);
    expect(r3.pre).not.toContain("first run");
    expect(Date.parse(r3.lc.checked_at)).toBeGreaterThan(Date.parse(r2.lc.checked_at));
    const pushed = JSON.parse(sh("git show main:desk/artifacts/sage/last-checked.json", resolve(root, "remote.git")));
    expect(pushed.checked_at).toBe(r3.lc.checked_at);
  }, 30_000);
});
