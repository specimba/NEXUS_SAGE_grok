/**
 * Pass B — Digest UI stamp sync: emit-on-WROTE, skip-on-HOLD wall-clock, coherence fail on drift.
 */
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runDigestTick } from "@/lib/digest-tick";
import {
  digestCadenceCoherenceFails,
  newestPackStamp,
  readDigestCadenceModule,
  readDigestLast,
  renderDigestCadenceTs,
  syncDigestCadenceFromDisk,
  writeDigestCadenceTs,
  writeDigestLast,
} from "@/lib/digest-pack-disk";
import { packStamp } from "@/lib/digest-pack";

const NOW = Date.parse("2026-10-06T19:20:17.030Z");

describe("Pass B digest-cadence mirror", () => {
  let deskRoot: string;

  beforeEach(() => {
    deskRoot = mkdtempSync(join(tmpdir(), "sage-pass-b-"));
    mkdirSync(join(deskRoot, "artifacts/sage"), { recursive: true });
    mkdirSync(join(deskRoot, "src/data"), { recursive: true });
    writeFileSync(
      join(deskRoot, "artifacts/sage/CURRENT.json"),
      JSON.stringify({ id: "003" }) + "\n",
    );
    // Seed a committed cadence module (stale Sep) so soft-fail has something to keep.
    writeDigestCadenceTs(deskRoot, {
      last_at: "2026-09-06T18:56:10.743Z",
      next_at: "2026-09-07T00:56:10.743Z",
      pack_id: "2026-09-06T18",
    });
  });

  afterEach(() => {
    rmSync(deskRoot, { recursive: true, force: true });
  });

  test("emit-on-WROTE: module equals digest-last.json after tick", () => {
    const r = runDigestTick({ deskRoot, now: NOW, force: true });
    expect(r.status).toBe("WROTE");
    if (r.status !== "WROTE") return;
    const disk = readDigestLast(deskRoot)!;
    const mod = readDigestCadenceModule(deskRoot)!;
    expect(mod.last_at).toBe(disk.last_at);
    expect(mod.next_at).toBe(disk.next_at);
    expect(mod.pack_id).toBe(disk.pack_id);
    expect(mod.pack_id).toBe(packStamp(NOW));
    expect(mod.pack_id).toBe(newestPackStamp(deskRoot));
    expect(digestCadenceCoherenceFails(deskRoot)).toEqual([]);
  });

  test("skip-on-HOLD: does not rewrite module to wall-clock now", () => {
    // First WROTE establishes disk + module
    const wrote = runDigestTick({ deskRoot, now: NOW, force: true });
    expect(wrote.status).toBe("WROTE");
    const before = readDigestCadenceModule(deskRoot)!;
    const beforeSrc = readFileSync(join(deskRoot, "src/data/digest-cadence.ts"), "utf8");

    // HOLD within cadence — wall clock is much later; module must keep real last_at, not now.
    const later = NOW + 60_000; // 1 min later, still within 6h
    const hold = runDigestTick({ deskRoot, now: later });
    expect(hold.status).toBe("HOLD");
    const after = readDigestCadenceModule(deskRoot)!;
    expect(after.last_at).toBe(before.last_at);
    expect(after.pack_id).toBe(before.pack_id);
    expect(after.last_at).not.toBe(new Date(later).toISOString());
    // Still mirrors disk (sync-from-disk on HOLD is ok; must not invent)
    expect(after.last_at).toBe(readDigestLast(deskRoot)!.last_at);
    expect(beforeSrc.includes(before.last_at)).toBe(true);
  });

  test("coherence fails closed on forced stale cadence drift", () => {
    writeDigestLast(deskRoot, {
      last_at: "2026-10-06T19:20:17.030Z",
      next_at: "2026-10-07T01:20:17.030Z",
      pack_id: "2026-10-06T19",
    });
    mkdirSync(join(deskRoot, "artifacts/sage/packs"), { recursive: true });
    writeFileSync(join(deskRoot, "artifacts/sage/packs/2026-10-06T19.json"), "{}\n");
    // Stale Sep module
    writeDigestCadenceTs(deskRoot, {
      last_at: "2026-09-06T18:56:10.743Z",
      next_at: "2026-09-07T00:56:10.743Z",
      pack_id: "2026-09-06T18",
    });
    const fails = digestCadenceCoherenceFails(deskRoot);
    expect(fails.length).toBeGreaterThan(0);
    expect(fails.some((f) => /last_at/.test(f))).toBe(true);
  });

  test("soft-fail missing digest-last: keep committed module, no invent", () => {
    const before = readDigestCadenceModule(deskRoot)!;
    const r = syncDigestCadenceFromDisk(deskRoot);
    expect(r.status).toBe("soft");
    const after = readDigestCadenceModule(deskRoot)!;
    expect(after.last_at).toBe(before.last_at);
    expect(digestCadenceCoherenceFails(deskRoot)).toEqual([]); // soft: no hard fail
  });

  test("renderDigestCadenceTs shape", () => {
    const src = renderDigestCadenceTs({
      last_at: "2026-10-06T19:20:17.030Z",
      next_at: "2026-10-07T01:20:17.030Z",
      pack_id: "2026-10-06T19",
    });
    expect(src).toContain('export const DIGEST_CADENCE');
    expect(src).toContain('"pack_id": "2026-10-06T19"');
    expect(existsSync).toBeTruthy();
  });
});
