import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const script = resolve(import.meta.dir, "../../../scripts/watchdog.ts");
const runLive = (lc: object, live: string, args: string[]) => {
  const dir = mkdtempSync(resolve(tmpdir(), "wd-"));
  const p = resolve(dir, "last-checked.json");
  const h = resolve(dir, "index.html");
  writeFileSync(p, JSON.stringify(lc));
  writeFileSync(h, `<html><body data-crawl-at="${live}"></body></html>`);
  return spawnSync("bun", [script, ...args], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_NOW: "2026-10-10T12:00:00Z", WATCHDOG_LIVE_URL: `file://${h}`, GITHUB_OUTPUT: "" } });
};
const run = (lc: object, now: string) => {
  const dir = mkdtempSync(resolve(tmpdir(), "wd-"));
  const p = resolve(dir, "last-checked.json");
  writeFileSync(p, JSON.stringify(lc));
  return spawnSync("bun", [script], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_NOW: now, WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: "" } });
};
const runMissing = (args: string[]) => {
  const p = resolve(mkdtempSync(resolve(tmpdir(), "wd-")), "last-checked.json");
  return spawnSync("bun", [script, ...args], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: "" } });
};
const base = { checked_at: "2026-10-09T20:00:00Z", last_run: "skipped", soft_history: [{ soft: 1, total: 10 }], gate_error: null };

describe("PASS-Q1 watchdog", () => {
  test("healthy → exit 0, silent", () => {
    const r = run(base, "2026-10-10T00:00:00Z");
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).toBe("");
  });
  test("forced stale checked_at → exit 1", () => {
    const r = run(base, "2026-10-10T05:00:01Z");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("checked_at");
  });
  test("two half-soft runs → exit 1", () => {
    const r = run({ ...base, soft_history: [{ soft: 5, total: 10 }, { soft: 6, total: 10 }] }, "2026-10-10T00:00:00Z");
    expect(r.status).toBe(1);
  });
  test("gate error → exit 1", () => {
    expect(run({ ...base, gate_error: "boom" }, "2026-10-10T00:00:00Z").status).toBe(1);
  });
  test("cold start --pre: missing last-checked.json → first run, exit 0", () => {
    const r = runMissing(["--pre"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("watchdog: first run");
  });
  test("post-crawl: missing last-checked.json still FAILs", () => {
    const r = runMissing([]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("watchdog FAIL: no");
  });
  const pub = { checked_at: "2026-10-10T11:00:00Z", last_run: "published", published_crawl: "2026-10-10T08:21:16Z", soft_history: [], gate_error: null };
  test("--pre: live ≠ main crawl → WARN, exit 0", () => {
    const r = runLive(pub, "2026-10-10T11:13:02Z", ["--pre"]);
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("watchdog WARN");
    expect(r.stderr).not.toContain("FAIL");
    const r2 = runLive(pub, "2026-10-10T07:00:00Z", ["--pre"]);
    expect(r2.status).toBe(0);
  });
  test("post-crawl: live older than this run's crawl → FAIL", () => {
    const r = runLive(pub, "2026-10-10T07:00:00Z", []);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("watchdog FAIL: live gh-pages crawl");
  });
  test("post-crawl: live NEWER than this run's crawl (box published later) → pass", () => {
    const r = runLive(pub, "2026-10-10T11:13:02Z", []);
    expect(r.status).toBe(0);
  });
  test("post-crawl: live = this run's crawl → pass", () => {
    expect(runLive(pub, "2026-10-10T08:21:16Z", []).status).toBe(0);
  });
  describe("missed slot (Q1G): --pre stays warn-only, the last step fails the job", () => {
    const stale = { checked_at: "2026-10-09T20:00:00Z", last_run: "skipped", soft_history: [], gate_error: null };
    const runM = (args: string[], now: string, lc: object | null, missed: string) => {
      const dir = mkdtempSync(resolve(tmpdir(), "wd-"));
      const p = resolve(dir, "last-checked.json");
      if (lc) writeFileSync(p, JSON.stringify(lc));
      return spawnSync("bun", [script, ...args], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_NOW: now, WATCHDOG_MAX_AGE_H: "10", WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: "", WATCHDOG_MISSED: missed } });
    };
    const marker = () => resolve(mkdtempSync(resolve(tmpdir(), "wd-m-")), "watchdog-missed.txt");
    test("--pre, checked_at 10.5h old → WARN + exit 0, marker written; --missed-slot then exits 1", () => {
      const m = marker();
      const pre = runM(["--pre"], "2026-10-10T06:30:00Z", stale, m);
      expect(pre.status).toBe(0);
      expect(pre.stderr).toContain("watchdog WARN (pre): checked_at 2026-10-09T20:00:00Z is 10.5h old (> 10h)");
      expect(readFileSync(m, "utf8")).toContain("pre-crawl checked_at 2026-10-09T20:00:00Z is 10.5h old");
      // post-crawl the run has refreshed checked_at, so only the marker can fail the job
      const last = runM(["--missed-slot"], "2026-10-10T06:35:00Z", { ...stale, checked_at: "2026-10-10T06:34:00Z" }, m);
      expect(last.status).toBe(1);
      expect(last.stderr).toContain("watchdog FAIL: missed slot — pre-crawl checked_at 2026-10-09T20:00:00Z is 10.5h old");
    });
    test("--pre, 9.9h old (the 21:11 → 06:11 overnight gap) → no marker; --missed-slot exits 0 silently", () => {
      const m = marker();
      const pre = runM(["--pre"], "2026-10-10T05:54:00Z", stale, m);
      expect(pre.status).toBe(0);
      expect(existsSync(m)).toBe(false);
      const last = runM(["--missed-slot"], "2026-10-10T06:00:00Z", stale, m);
      expect(last.status).toBe(0);
      expect(last.stdout + last.stderr).toBe("");
    });
    test("cold start --pre writes no marker; WATCHDOG_MISSED unset never fails --missed-slot", () => {
      const m = marker();
      expect(runM(["--pre"], "2026-10-10T06:30:00Z", null, m).status).toBe(0);
      expect(existsSync(m)).toBe(false);
      expect(runM(["--missed-slot"], "2026-10-10T06:30:00Z", stale, "").status).toBe(0);
    });
    test("--pre with other failures (gate error) stays warn-only and does not mark a missed slot", () => {
      const m = marker();
      const pre = runM(["--pre"], "2026-10-10T00:00:00Z", { ...stale, gate_error: "boom" }, m);
      expect(pre.status).toBe(0);
      expect(existsSync(m)).toBe(false);
    });
    test("yml: marker reset before --pre, --missed-slot is the last script step", () => {
      const ci = readFileSync(resolve(import.meta.dir, "../../../../ci/gitlab-ci.yml"), "utf8");
      expect(ci).toContain("WATCHDOG_MISSED: $CI_PROJECT_DIR/watchdog-missed.txt");
      expect(ci).toContain('rm -f "$WATCHDOG_MISSED"; bun scripts/watchdog.ts --pre');
      const script = ci.slice(ci.indexOf("  script:"), ci.indexOf("  after_script:"));
      const steps = script.split("\n").filter((l) => /^    - /.test(l));
      expect(steps[steps.length - 1]).toBe("    - bun scripts/watchdog.ts --missed-slot");
    });
  });
});
