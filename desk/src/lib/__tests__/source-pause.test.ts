import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { activePauses, isPausedAt } from "@/lib/source-pause";

const NOW = Date.parse("2026-09-25T13:00:00Z");
const state = {
  sources: {
    openalex: { paused_until: "2026-09-26T00:00:00Z", pause_reason: "HTTP 429 Retry-After 40541" },
    crossref: { paused_until: "2026-09-25T09:00:00Z", pause_reason: "3 fails" }, // past ⇒ not paused
    hn: { paused_until: null, pause_reason: null },
    gnews: { paused_until: "garbage", pause_reason: null },
  },
};

describe("PAUSED merge (source-state.json → health at build time)", () => {
  test("only future paused_until counts", () => {
    expect(activePauses(state, NOW)).toEqual({
      openalex: { until: "2026-09-26T00:00:00Z", reason: "HTTP 429 Retry-After 40541" },
    });
  });
  test("missing / empty state = nothing paused", () => {
    expect(activePauses(null, NOW)).toEqual({});
    expect(activePauses({ sources: {} }, NOW)).toEqual({});
  });
  test("browser re-check after mount: a pause that expired since the build is not paused", () => {
    const p = { until: "2026-09-26T00:00:00Z", reason: null };
    expect(isPausedAt(p, null)).toBe(true); // static HTML trusts the build-time merge
    expect(isPausedAt(p, NOW)).toBe(true);
    expect(isPausedAt(p, Date.parse("2026-09-26T00:00:01Z"))).toBe(false);
    expect(isPausedAt(undefined, NOW)).toBe(false);
  });
  test("build-stamp.mjs merges pauses in the same prebuild step; desk renders PAUSED · until HH:MM dim", () => {
    const stamp = readFileSync(join(import.meta.dir, "../../../scripts/build-stamp.mjs"), "utf8");
    expect(stamp).toMatch(/source-state\.json/);
    expect(stamp).toMatch(/activePauses\(/);
    const desk = readFileSync(join(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(desk).toMatch(/PAUSED · until \{istHHMM\(/);
    const css = readFileSync(join(import.meta.dir, "../../app/globals.css"), "utf8");
    expect(css).toMatch(/data-state="paused"\][^{]*\{[^}]*--muted-foreground[^}]*text-decoration: none/s);
  });
});
