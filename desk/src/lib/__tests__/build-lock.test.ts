/**
 * desk/.build.lock: the :3000 build (package.json "build" = scripts/locked-build.sh) and pages-publish.sh share one
 * flock, so a build started during the Pages .next swap waits instead of compiling into the wrong folder.
 * Exercised for real with a scratch lock file and NEXUS_BUILD_DRY=1 (takes the lock, builds nothing).
 */
import { describe, expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpCache } from "./tmp-cache";
import { mkdirSync } from "node:fs";

const DESK = resolve(import.meta.dir, "../../..");
const script = join(DESK, "scripts/locked-build.sh");
function scratchLock() {
  const d = tmpCache("build-lock");
  mkdirSync(d, { recursive: true });
  return join(d, ".build.lock");
}
/** Hold `lock` for `secs` in a separate process (like a running pages-publish); resolves once it is held. */
async function hold(lock: string, secs: number) {
  const p = spawn("flock", [lock, "sh", "-c", `echo held; sleep ${secs}`], { stdio: ["ignore", "pipe", "ignore"] });
  await new Promise<void>((r) => p.stdout!.once("data", () => r()));
  return p;
}
const run = (lock: string, env: Record<string, string>) => {
  const t = Date.now();
  const r = spawnSync("bash", [script], { cwd: DESK, encoding: "utf8", env: { ...process.env, NEXUS_BUILD_LOCK_FILE: lock, NEXUS_BUILD_DRY: "1", NEXUS_BUILD_LOCK_HELD: "", ...env } });
  return { ...r, ms: Date.now() - t, out: `${r.stdout}${r.stderr}` };
};

describe("build lock (desk/.build.lock)", () => {
  test("free lock: builds at once", () => {
    const r = run(scratchLock(), {});
    expect(r.status).toBe(0);
    expect(r.out).toContain("DRY — lock ok");
    expect(r.out).not.toContain("waiting");
  });
  test("held lock: waits, then builds when it is released", async () => {
    const lock = scratchLock();
    const h = await hold(lock, 1.5);
    const r = run(lock, { NEXUS_BUILD_LOCK_WAIT: "20" });
    h.kill();
    expect(r.status).toBe(0);
    expect(r.out).toContain("waiting up to 20s");
    expect(r.out).toContain("lock acquired after wait");
    expect(r.ms).toBeGreaterThan(1000);
  });
  test("held past the timeout: fails loudly (exit 75), builds nothing", async () => {
    const lock = scratchLock();
    const h = await hold(lock, 5);
    const r = run(lock, { NEXUS_BUILD_LOCK_WAIT: "1" });
    h.kill();
    expect(r.status).toBe(75);
    expect(r.out).toContain("still held after 1s");
    expect(r.out).not.toContain("DRY — lock ok");
  });
  test("NEXUS_BUILD_LOCK_HELD=1 (set by the lock holder): no second flock, no deadlock", async () => {
    const lock = scratchLock();
    const h = await hold(lock, 5);
    const r = run(lock, { NEXUS_BUILD_LOCK_HELD: "1", NEXUS_BUILD_LOCK_WAIT: "1" });
    h.kill();
    expect(r.status).toBe(0);
    expect(r.ms).toBeLessThan(1000);
    expect(r.out).toContain("not locking again");
  });
  test("wiring: every :3000 build path goes through the lock; pages-publish holds it and calls next build directly", () => {
    const pkg = JSON.parse(readFileSync(join(DESK, "package.json"), "utf8"));
    expect(pkg.scripts.build).toBe("bash scripts/locked-build.sh");
    expect(pkg.scripts.prebuild).toBeUndefined(); // would run outside the lock
    expect(pkg.scripts["build:pages"]).toBe("PAGES_BUILD_ONLY=1 bash scripts/pages-publish.sh");
    for (const f of ["scripts/a1-stale-ingest.mjs", "scripts/cf-build.sh"]) {
      const src = readFileSync(join(DESK, f), "utf8");
      expect(src).not.toMatch(/^[^#\n]*\b(npx |bunx |\.bin\/)?next build/m); // they build via `bun run build` = locked-build.sh
      expect(src).not.toMatch(/"next", \["build"/);
      expect(src).toMatch(/bun run build|"run", "build"/);
    }
    const sh = readFileSync(join(DESK, "scripts/pages-publish.sh"), "utf8");
    expect(sh).toMatch(/flock -w "\$LOCK_WAIT" 9/);
    expect(sh).toContain("export NEXUS_BUILD_LOCK_HELD=1");
    expect(sh).toContain('PAGES=1 "$DESK/node_modules/.bin/next" build');
    expect(sh).not.toMatch(/PAGES=1 bun run build/);
    const lockAt = sh.indexOf('exec 9>>"$LOCK"'), swapAt = sh.indexOf('mv "$NEXT_DIR" "$HOLD"'), relAt = sh.indexOf("\nrelease_lock   #");
    expect(lockAt).toBeGreaterThan(0);
    expect(lockAt).toBeLessThan(swapAt);
    expect(swapAt).toBeLessThan(relAt);
    expect(readFileSync(join(DESK, ".gitignore"), "utf8")).toContain("/.build.lock");
  });
});
