import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// GitLab CI headless Chrome for overflow-390: on demand, code-changed path only, pinned, fail closed, no GitLab cache.
const desk = resolve(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(resolve(desk, p), "utf8");
const script = resolve(desk, "scripts/ci-chrome.sh");
const VER = "155.0.8059.79";

function run(env: Record<string, string>) {
  return spawnSync("bash", [script], { env: { PATH: process.env.PATH ?? "/usr/bin:/bin", ...env }, encoding: "utf8" });
}
function fakeChrome(versionOk: boolean) {
  const dir = mkdtempSync(join(tmpdir(), "ci-chrome-"));
  const bin = join(dir, VER, "chrome-headless-shell-linux64", "chrome-headless-shell");
  mkdirSync(resolve(bin, ".."), { recursive: true });
  writeFileSync(bin, versionOk ? `#!/bin/sh\necho "Google Chrome for Testing ${VER}"\n` : "#!/bin/sh\nexit 3\n");
  chmodSync(bin, 0o755);
  return { dir, bin };
}

describe("ci-chrome.sh (chrome-headless-shell on demand)", () => {
  test("already unpacked + --version ok → prints the binary path last, no download", () => {
    const { dir, bin } = fakeChrome(true);
    const r = run({ SAGE_CHROME_DIR: dir, SAGE_CHROME_VERSION: VER, SAGE_CHROME_URL: "file:///nonexistent/never-fetched.zip" });
    rmSync(dir, { recursive: true, force: true });
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split("\n").pop()).toBe(bin);
    expect(r.stderr).toContain(`Google Chrome for Testing ${VER} ready`);
  });
  test("binary that fails --version → exit ≠ 0 with a FAIL line", () => {
    const { dir } = fakeChrome(false);
    const r = run({ SAGE_CHROME_DIR: dir, SAGE_CHROME_VERSION: VER });
    rmSync(dir, { recursive: true, force: true });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/ci-chrome FAIL: .*--version failed/);
  });
  test("download failure → exit ≠ 0 with a FAIL line, no path printed", () => {
    const dir = mkdtempSync(join(tmpdir(), "ci-chrome-"));
    const r = run({ SAGE_CHROME_DIR: dir, SAGE_CHROME_VERSION: VER, SAGE_CHROME_URL: "file:///nonexistent/chrome.zip" });
    rmSync(dir, { recursive: true, force: true });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("ci-chrome FAIL: download failed");
    expect(r.stdout.trim()).toBe("");
  });
  test("pinned Chrome for Testing headless-shell URL; apt only for the missing libs, --no-install-recommends", () => {
    const sh = read("scripts/ci-chrome.sh");
    expect(sh).toContain("set -euo pipefail");
    expect(sh).toContain(`VER="\${SAGE_CHROME_VERSION:-${VER}}"`);
    expect(sh).toContain("chrome-for-testing-public/$VER/linux64/chrome-headless-shell-linux64.zip");
    expect(sh).toContain("--no-install-recommends");
    expect(sh).not.toMatch(/^\s*apt-get install[^\n]*\bchromium\b/m);
  });
});

describe("pages-publish.sh + gitlab-ci.yml wiring", () => {
  test("install runs only on the code-changed overflow-390 path; failure is a CHECK FAIL", () => {
    const sh = read("scripts/pages-publish.sh");
    const skip = sh.indexOf('log "overflow-390 skipped — $why"');
    const install = sh.indexOf('bash "$DESK/scripts/ci-chrome.sh"');
    const runCheck = sh.indexOf("bun scripts/overflow-390-check.ts");
    expect(skip).toBeGreaterThan(0);
    expect(install).toBeGreaterThan(skip);
    expect(runCheck).toBeGreaterThan(install);
    expect(sh.match(/scripts\/ci-chrome\.sh"/g)?.length).toBe(1);
    expect(sh).toContain('[ "${SAGE_CHROME_INSTALL:-0}" = "1" ]');
    expect(sh).toContain('export CHROME_BIN="$cbin"');
    expect(sh).toContain("but the headless Chrome install failed");
    expect(sh).toContain("but no headless Chrome (CHROME_BIN/google-chrome) in this runner");
  });
  test("CI opts in with the same pinned version; the browser is never a GitLab cache path", () => {
    const ci = read("../ci/gitlab-ci.yml");
    expect(ci).toContain('SAGE_CHROME_INSTALL: "1"');
    expect(ci).toContain(`SAGE_CHROME_VERSION: "${VER}"`);
    expect(ci).toContain("SAGE_OVERFLOW_390: auto");
    const cachePaths = ci.match(/paths: \[[^\]]*\]/g) ?? [];
    expect(cachePaths.length).toBeGreaterThan(0);
    for (const p of cachePaths) expect(p).not.toMatch(/chrome|apt/i);
  });
});
