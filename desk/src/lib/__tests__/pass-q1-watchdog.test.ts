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
  describe("slot-based missed-slot rule (Q1G §2 amend): --pre exits 2 + marker, the last step fails the job", () => {
    // Slots 06:11 · 11:11 · 16:11 · 21:11 TRT = 03:11 · 08:11 · 13:11 · 18:11 UTC (TRT = UTC+3).
    const lcAt = (checked_at: string) => ({ checked_at, last_run: "skipped", soft_history: [], gate_error: null });
    const runM = (args: string[], now: string, lc: object | null, missed: string, extra: Record<string, string> = {}) => {
      const dir = mkdtempSync(resolve(tmpdir(), "wd-"));
      const p = resolve(dir, "last-checked.json");
      if (lc) writeFileSync(p, JSON.stringify(lc));
      return spawnSync("bun", [script, ...args], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_NOW: now, WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: "", WATCHDOG_MISSED: missed, ...extra } });
    };
    const marker = () => resolve(mkdtempSync(resolve(tmpdir(), "wd-m-")), "watchdog-missed.txt");
    test("a missed 11:11 is flagged at 16:11; green once this run heals it, red if not (daytime)", () => {
      const m = marker();
      const pre = runM(["--pre"], "2026-10-14T13:11:40Z", lcAt("2026-10-14T03:12:30Z"), m);
      expect(pre.status).toBe(2);
      expect(pre.stderr).toContain("watchdog FAIL (pre): missed slot 2026-10-14 11:11 TRT: last checked_at 2026-10-14T03:12:30Z is before 2026-10-14 11:01 TRT");
      expect(readFileSync(m, "utf8")).toContain("pre-crawl missed slot 2026-10-14 11:11 TRT");
      // Oct 28 heal: the crawl refreshed checked_at for THIS slot ⇒ the historical miss is a WARN, job stays green
      const last = runM(["--missed-slot"], "2026-10-14T13:13:00Z", lcAt("2026-10-14T13:12:50Z"), m);
      expect(last.status).toBe(0);
      expect(last.stderr).toContain("watchdog WARN: pre-crawl missed slot 2026-10-14 11:11 TRT");
      expect(last.stderr).toContain("recovered");
      // WATCHDOG_STRICT_MISSED=1 keeps the old always-fail behaviour
      const strict = runM(["--missed-slot"], "2026-10-14T13:13:00Z", lcAt("2026-10-14T13:12:50Z"), m, { WATCHDOG_STRICT_MISSED: "1" });
      expect(strict.status).toBe(1);
      expect(strict.stderr).toContain("watchdog FAIL: pre-crawl missed slot 2026-10-14 11:11 TRT");
      // not healed (checked_at still before this slot − 10 min) ⇒ still red
      const stale = runM(["--missed-slot"], "2026-10-14T13:13:00Z", lcAt("2026-10-14T03:12:30Z"), m);
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain("watchdog FAIL: pre-crawl missed slot 2026-10-14 11:11 TRT");
    });
    test("a missed 21:11 fails at 06:11 (crossing midnight)", () => {
      const m = marker();
      const pre = runM(["--pre"], "2026-10-15T03:11:40Z", lcAt("2026-10-14T13:12:30Z"), m);
      expect(pre.status).toBe(2);
      expect(pre.stderr).toContain("missed slot 2026-10-14 21:11 TRT");
      expect(readFileSync(m, "utf8")).toContain("2026-10-14 21:11 TRT");
    });
    test("all slots present passes at every slot, overnight included (exit 0, no marker, silent)", () => {
      const cases: [string, string][] = [
        ["2026-10-15T03:11:40Z", "2026-10-14T18:12:40Z"], // 06:11, last 21:12 (prev day)
        ["2026-10-15T08:11:40Z", "2026-10-15T03:12:40Z"], // 11:11, last 06:12
        ["2026-10-15T13:11:40Z", "2026-10-15T08:12:40Z"], // 16:11, last 11:12
        ["2026-10-15T18:11:40Z", "2026-10-15T13:12:40Z"], // 21:11, last 16:12
      ];
      for (const [now, at] of cases) {
        const m = marker();
        const r = runM(["--pre"], now, lcAt(at), m);
        expect(r.status).toBe(0);
        expect(r.stdout + r.stderr).toBe("");
        expect(existsSync(m)).toBe(false);
      }
      expect(runM(["--missed-slot"], "2026-10-15T18:13:00Z", lcAt("2026-10-15T18:12:40Z"), marker()).status).toBe(0);
    });
    test("a late 11:40 check-in passes at 16:11", () => {
      const m = marker();
      const r = runM(["--pre"], "2026-10-15T13:11:40Z", lcAt("2026-10-15T08:40:00Z"), m);
      expect(r.status).toBe(0);
      expect(existsSync(m)).toBe(false);
    });
    test("10-minute grace edge: 11:01:00 passes, 11:00:59 fails (at 16:11); a late-started run still uses its own slot", () => {
      expect(runM(["--pre"], "2026-10-15T13:11:40Z", lcAt("2026-10-15T08:01:00Z"), marker()).status).toBe(0);
      expect(runM(["--pre"], "2026-10-15T13:11:40Z", lcAt("2026-10-15T07:59:59Z"), marker()).status).toBe(2);
      // the 16:11 job started 40 min late (16:51): previous slot is still 11:11
      expect(runM(["--pre"], "2026-10-15T13:51:00Z", lcAt("2026-10-15T08:12:40Z"), marker()).status).toBe(0);
    });
    test("cold start: no last-checked.json → 'watchdog: first run', exit 0, no marker", () => {
      const m = marker();
      const r = runM(["--pre"], "2026-10-15T13:11:40Z", null, m);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("watchdog: first run");
      expect(existsSync(m)).toBe(false);
    });
    test("--pre: other problems (gate error, soft ratio) stay warn-only — exit 0, no marker", () => {
      const m = marker();
      const r = runM(["--pre"], "2026-10-15T13:11:40Z", { ...lcAt("2026-10-15T08:12:40Z"), gate_error: "boom", soft_history: [{ soft: 6, total: 10 }, { soft: 5, total: 10 }] }, m);
      expect(r.status).toBe(0);
      expect(r.stderr).toContain("watchdog WARN (pre): hash gate errored: boom");
      expect(existsSync(m)).toBe(false);
    });
    test("post-crawl: this run's own slot must have checked in; WATCHDOG_MISSED unset never fails --missed-slot", () => {
      expect(runM([], "2026-10-15T13:13:00Z", lcAt("2026-10-15T13:12:50Z"), "").status).toBe(0);
      const stale = runM([], "2026-10-15T13:13:00Z", lcAt("2026-10-15T08:12:40Z"), "");
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain("watchdog FAIL: missed slot 2026-10-15 16:11 TRT");
      expect(runM(["--missed-slot"], "2026-10-15T13:13:00Z", lcAt("2026-10-15T08:12:40Z"), "").status).toBe(0);
    });
    test("yml: fixed 10h retired; marker reset; only exit 2 tolerated on --pre; --missed-slot is the last step", () => {
      const ci = readFileSync(resolve(import.meta.dir, "../../../../ci/gitlab-ci.yml"), "utf8");
      expect(ci).not.toContain("WATCHDOG_MAX_AGE_H");
      expect(ci).toContain("WATCHDOG_MISSED: $CI_PROJECT_DIR/watchdog-missed.txt");
      expect(ci).toContain('rm -f "$WATCHDOG_MISSED"; bun scripts/watchdog.ts --pre || [ $? = 2 ]');
      const sc = ci.slice(ci.indexOf("  script:"), ci.indexOf("  after_script:"));
      const steps = sc.split("\n").filter((l) => /^    - /.test(l));
      expect(steps[steps.length - 1]).toBe("    - bun scripts/watchdog.ts --missed-slot");
      expect(readFileSync(script, "utf8")).not.toContain("WATCHDOG_MAX_AGE_H");
    });
  });
});
