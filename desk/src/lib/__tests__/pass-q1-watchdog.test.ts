import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
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
});
