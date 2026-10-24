import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadXWiden, validateXWiden, widenPlan, X_WIDEN_PATH } from "@/lib/x-taste-widen";

const DESK = join(import.meta.dir, "../../..");
const raw = () => JSON.parse(readFileSync(join(DESK, X_WIDEN_PATH), "utf8"));

describe("Intel plan 4 — X widening from SCOUT-X-WIDEN-OCT24", () => {
  test("31 scout-verified accounts, 6 story + 3 news queries, box-only, free reads only", () => {
    const c = loadXWiden(DESK);
    expect(c.accounts.length).toBe(31);
    expect(c.accounts.map((a) => a.handle)).toContain("cursor_ai");
    expect(c.accounts.map((a) => a.handle)).not.toContain("SimonWillison");
    expect(c.accounts.map((a) => a.handle)).not.toContain("Teknium1");
    expect(c.story_queries.map((q) => q.id)).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]);
    expect(c.news_queries.length).toBe(3);
    expect(c.box_only).toBe(true);
    expect(JSON.stringify(raw())).not.toMatch(/token|secret|bearer|cookie|password|api[_-]?key/i);
  });
  test("plan: news cards first, untested combined watch query skipped, within the 15-call budget", () => {
    const p = widenPlan(loadXWiden(DESK));
    expect(p.slice(0, 3).every((x) => x.tool === "search_news")).toBe(true);
    expect(p.some((x) => x.id === "watch")).toBe(false);
    expect(p.length).toBeLessThanOrEqual(15);
    const tested = { ...raw(), watch_query: { ...raw().watch_query, tested: true } };
    expect(widenPlan(tested)[3]!.id).toBe("watch");
  });
  test("validator rejects paid/unknown tools, credential keys, bad handles, watch handles outside the list", () => {
    const bad = (f: (c: ReturnType<typeof raw>) => void) => { const c = raw(); f(c); return validateXWiden(c).ok; };
    expect(bad((c) => { c.story_queries[0].tool = "paid_firehose"; })).toBe(false);
    expect(bad((c) => { c.api_key = "x"; })).toBe(false);
    expect(bad((c) => { c.accounts.push({ handle: "bad handle!", lane: "x" }); })).toBe(false);
    expect(bad((c) => { c.watch_query.q = "from:nobody_here"; })).toBe(false);
    expect(bad((c) => { c.box_only = false; })).toBe(false);
  });
  test("CI never touches X: no CI file or client code reads the widen config", () => {
    const ci = readFileSync(join(DESK, "../ci/gitlab-ci.yml"), "utf8");
    expect(ci).not.toMatch(/x-taste|x_taste|X_BEARER/i);
    expect(readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8")).not.toContain("x-taste-widen");
  });
});
