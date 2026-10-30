import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { newWithinAge, wireCounts, wireHeader, wireMark } from "@/lib/wire";

const CRAWL = "2026-10-30T23:40:04Z";
const ago = (h: number) => new Date(Date.parse(CRAWL) - h * 3_600_000).toISOString();
type R = { id: string; status: "new" | "up" | "down" | "same"; rank: number; prev_rank: number | null; at: string };
const ROWS: R[] = [
  { id: "old31", status: "new", rank: 1, prev_rank: null, at: ago(31) },
  { id: "h2", status: "new", rank: 2, prev_rank: null, at: ago(2) },
  { id: "h6", status: "new", rank: 3, prev_rank: null, at: ago(6) },
  { id: "up", status: "up", rank: 4, prev_rank: 6, at: ago(40) },
  { id: "down", status: "down", rank: 5, prev_rank: 4, at: ago(3) },
];

describe("PASS-NEW-AGE — Wire NEW only < 24h", () => {
  test("strict < 24h boundary", () => {
    expect(newWithinAge(ago(23.99), CRAWL)).toBe(true);
    expect(newWithinAge(ago(24), CRAWL)).toBe(false);
    expect(newWithinAge(ago(31), CRAWL)).toBe(false);
    expect(newWithinAge(null, CRAWL)).toBe(true);
  });
  test("31h new-to-crawl loses NEW; 2h/6h keep it; moved untouched", () => {
    // Same map as desk.tsx WIRE_ROWS.
    const g = ROWS.map((r) => (r.status == "new" && !newWithinAge(r.at, CRAWL) ? { ...r, status: "same" as const } : r));
    expect(g.map((r) => r.status)).toEqual(["same", "new", "new", "up", "down"]);
    expect(wireMark(g[0])).toBe("·");
    expect(g.map(wireMark).slice(1)).toEqual(["NEW", "NEW", "▲2", "▼1"]);
    expect(wireCounts(ROWS).fresh).toBe(3);
    expect(wireCounts(g)).toEqual({ fresh: 2, moved: 2 });
    expect(wireHeader(CRAWL, g)).toContain("2 new · 2 moved");
  });
  test("desk wires the gate on Brief Wire + Pulse; PASS-N ticks untouched", () => {
    const src = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(src).toContain('r.status == "new" && !newWithinAge(firstAtIso(r), WIRE_CRAWL_AT)');
    expect(src).toContain('data-status={st}');
    expect(src).toMatch(/r\.showNew && newWithinAge\(/);
    expect(src).toContain("visit?.tick(r, FIRST_SEEN.get(r.id), since, wireRowById.get(r.id)?.leadId)");
  });
});
