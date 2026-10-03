import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { paceWait } from "@/lib/pace";

describe("request pacing is injectable (tests never sleep on wall time)", () => {
  test("default interval: sleeps the remaining gap through the injected sleep", async () => {
    const waits: number[] = [];
    await paceWait(Date.now(), 2_000, { sleep: async (ms) => void waits.push(ms) });
    expect(waits.length).toBe(1);
    expect(waits[0]).toBeGreaterThan(1_900);
    expect(waits[0]).toBeLessThanOrEqual(2_000);
  });

  test("minIntervalMs 0 or a first request never sleeps", async () => {
    const waits: number[] = [];
    const sleep = async (ms: number) => void waits.push(ms);
    await paceWait(Date.now(), 2_000, { minIntervalMs: 0, sleep });
    await paceWait(0, 2_000, { sleep });
    expect(waits).toEqual([]);
  });

  test("no test writes a cache into artifacts/sage (scratch dirs come from tmp-cache.ts)", () => {
    const dir = import.meta.dir;
    const offenders = readdirSync(dir)
      .filter((f) => f.endsWith(".test.ts"))
      .filter((f) => /\.\.\/artifacts\/sage\/[a-z]+-cache/.test(readFileSync(join(dir, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
