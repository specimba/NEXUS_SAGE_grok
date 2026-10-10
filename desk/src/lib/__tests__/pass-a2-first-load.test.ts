/**
 * Pass A2 — First Load headroom (2026-10-10 gate trip: 185 039 B vs 185 000 B cap at crawl 03:17:55Z).
 * Cause: desk-view.ts sat at its own gz budget (41 900 B, set when the code was ~3 kB smaller), so crawl growth inside
 * that budget plus A1/Q1 code ate the last bytes. Cut: Papers rows → lazy desk-view-papers.ts chunk; Sep digest pack +
 * report renderer → lazy archive-003 chunk; budget 41 900 → 35 500 B.
 * Measured (next build, scripts/first-load.cjs): 177 789 B at desk-view gz 35 439 B; +2 045 B of real crawl data
 * (budget temporarily 37 500) → 179 757 B. ≈ 1 B First Load per gz byte of desk-view.ts.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DESK_VIEW_CAPS } from "@/lib/desk-view";
import { gzBytes } from "@/lib/desk-view-module";

const DESK = join(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(join(DESK, p), "utf8");
const deskSrc = read("src/components/sage/desk.tsx");
const staticImports = [...deskSrc.matchAll(/^import [^;]*? from "([^"]+)";/gms)].map((m) => m[1]);

const CAP = 185_000;
const REVIEWER_MAX = 182_000;
/** First Load minus gzip -9(desk-view.ts), measured at this pass (177 789 − 35 439). */
const CODE_BASELINE = 142_350;
const GROWTH_FIXTURE = 2_048;

describe("Pass A2 · First Load headroom", () => {
  test("desk.tsx never statically imports the Sep archive pack, archive chunk, or Papers rows", () => {
    for (const m of ["@/data/digest-pack", "@/lib/archive-003", "@/data/desk-view-papers", "@/data/papers"]) expect(staticImports).not.toContain(m);
    expect(deskSrc).toContain('import("@/lib/archive-003")');
    expect(deskSrc).toContain('import("@/data/desk-view-papers")');
  });

  test("desk-view.ts (First Load data) carries no PAPERS; desk-view-papers.ts does", () => {
    expect(read("src/data/desk-view.ts")).not.toContain("export const PAPERS");
    expect(read("src/data/desk-view.ts")).not.toContain(`from "@/data/desk-view-papers"`);
    expect(read("src/data/desk-view-papers.ts")).toContain("export const PAPERS");
  });

  test("full budget + 2 kB crawl growth stays ≤ 182 000 B (and under the 185 kB cap)", () => {
    expect(DESK_VIEW_CAPS.gzBytes).toBeLessThanOrEqual(35_500);
    const live = gzBytes(read("src/data/desk-view.ts"));
    expect(live).toBeLessThanOrEqual(DESK_VIEW_CAPS.gzBytes);
    expect(CODE_BASELINE + live).toBeLessThanOrEqual(REVIEWER_MAX);
    expect(CODE_BASELINE + DESK_VIEW_CAPS.gzBytes + GROWTH_FIXTURE).toBeLessThanOrEqual(REVIEWER_MAX);
    expect(CODE_BASELINE + DESK_VIEW_CAPS.gzBytes + GROWTH_FIXTURE).toBeLessThan(CAP);
  });

  test("archive fold loads on open, shows a muted loading line, and an 'archive unavailable' fallback", () => {
    const fold = deskSrc.slice(deskSrc.indexOf("function CycleArchiveFold()"), deskSrc.indexOf("function Digest()"));
    expect(fold).toContain("onToggle");
    expect(fold).toContain("e.currentTarget.open");
    expect(fold).toContain("loadArchive()");
    expect(fold).toContain("loading archive · 003…");
    expect(fold).toContain("archive unavailable");
    expect(fold).toContain("minHeight"); // reserved height: no layout jump, never blank
    expect(fold).not.toContain("<details open");
  });
});
