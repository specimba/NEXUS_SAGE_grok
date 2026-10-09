import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const script = resolve(import.meta.dir, "../../../scripts/watchdog.ts");
const run = (lc: object, now: string) => {
  const dir = mkdtempSync(resolve(tmpdir(), "wd-"));
  const p = resolve(dir, "last-checked.json");
  writeFileSync(p, JSON.stringify(lc));
  return spawnSync("bun", [script], { encoding: "utf8", env: { ...process.env, WATCHDOG_CHECKED: p, WATCHDOG_NOW: now, WATCHDOG_LIVE_URL: "off", GITHUB_OUTPUT: "" } });
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
});
