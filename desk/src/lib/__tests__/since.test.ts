import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIRST_VISIT, isSince, partitionSince, sinceBase } from "@/lib/since";

describe("Beat 10 since-you-were-here", () => {
  test("first visit ever ⇒ no baseline ⇒ nothing marked", () => {
    expect(sinceBase(null, null)).toBeNull();
    expect(isSince("2026-09-24T22:00:00Z", null)).toBe(false);
  });
  test("session baseline wins over the (tab-leave-updated) stored visit; junk ignored", () => {
    expect(sinceBase("2026-09-24T20:00:00Z", "2026-09-24T23:00:00Z")).toBe("2026-09-24T20:00:00Z");
    expect(sinceBase(null, JSON.stringify({ seen_at: "2026-09-24T23:00:00Z", keys: [] }))).toBe("2026-09-24T23:00:00Z");
    // §N5.1 cut: an old plain-ISO record is no longer read — it resets (no baseline this visit).
    expect(sinceBase(null, "2026-09-24T23:00:00Z")).toBeNull();
    expect(sinceBase("nope", null)).toBeNull();
    // a tab that began as a first-ever visit stays marker-free even after pagehide wrote lastSeenAt on reload
    expect(sinceBase(FIRST_VISIT, "2026-09-24T23:00:00Z")).toBeNull();
  });
  test("strictly-after first_seen; null first_seen never marked; stable partition", () => {
    const rows = [
      { id: "a", fs: "2026-09-24T19:00:00Z" },
      { id: "b", fs: "2026-09-24T21:30:00Z" },
      { id: "c", fs: null },
      { id: "d", fs: "2026-09-24T22:10:00Z" },
    ];
    const p = partitionSince(rows, (r) => r.fs, "2026-09-24T21:00:00Z");
    expect(p.since.map((r) => r.id)).toEqual(["b", "d"]);
    expect(p.rest.map((r) => r.id)).toEqual(["a", "c"]);
    expect(isSince("2026-09-24T21:00:00Z", "2026-09-24T21:00:00Z")).toBe(false);
  });
  test("lastSeenAt is written on tab leave, never on load", () => {
    const tsx = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(tsx).toContain('"visibilitychange"');
    expect(tsx).toContain('"pagehide"');
    const block = tsx.slice(tsx.indexOf("function useSinceBase"), tsx.indexOf("// end useSinceBase"));
    expect(block.length).toBeGreaterThan(50);
    // PASS-N: the record is written through openVisit; only `leave` moves seen_at (flush keeps it — new-ticks test 1/4/8).
    // §N5.1 cut: no plain-ISO fallback write — the page never calls localStorage.setItem itself.
    expect(block.match(/localStorage\.setItem/g)).toBeNull();
    expect(block).toContain("v?.leave();");
    expect(block.indexOf("v?.leave();")).toBeGreaterThan(block.indexOf("const leave"));
  });
});
