/** PASS-N (refs/PASS-N-NEW-TICKS.md, §N4 rulings override N1–N3) — 12 acceptance tests. */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalizeUrl } from "@/lib/dedupe";
import { LAST_SEEN_KEY, sinceBase } from "@/lib/since";
import { KEYS_CAP, TICK_SR, isTick, mergeKeys, openVisit, readSeen, rowKey, tickable } from "@/lib/new-ticks";

const BASE = "2026-10-23T09:00:00.000Z";
const NOW = Date.parse("2026-10-23T12:00:00.000Z");
const after = "2026-10-23T10:00:00.000Z";
const before = "2026-10-23T08:00:00.000Z";

function mem(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}
const stored = (s: ReturnType<typeof mem>) => JSON.parse(s.m.get(LAST_SEEN_KEY)!);
const desk = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");

describe("PASS-N new-since-last-visit ticks", () => {
  test("1 empty storage → zero ticks; state written after render (flush)", () => {
    const s = mem();
    const v = openVisit(s, NOW);
    expect(v.seen).toBeNull();
    expect(isTick("a", after, null, v.seen)).toBe(false);
    expect(s.m.has(LAST_SEEN_KEY)).toBe(false);
    v.note(["a", "b"]);
    v.flush();
    expect(stored(s)).toEqual({ seen_at: null, keys: ["a", "b"] });
  });

  test("2 second visit with 3 new keys after seen_at → exactly those 3 ticked", () => {
    const s = mem({ [LAST_SEEN_KEY]: JSON.stringify({ seen_at: BASE, keys: ["old1", "old2"] }) });
    const v = openVisit(s, NOW);
    const rows = ["old1", "n1", "old2", "n2", "n3"];
    expect(rows.filter((k) => isTick(k, after, BASE, v.seen))).toEqual(["n1", "n2", "n3"]);
  });

  test("3 key new but first-seen before seen_at → no tick; papers qualify on key alone", () => {
    const seen = new Set(["x"]);
    expect(isTick("n", before, BASE, seen)).toBe(false);
    expect(isTick("n", null, BASE, seen)).toBe(false);
    expect(isTick("n", null, BASE, seen, true)).toBe(true);
    expect(isTick("x", null, BASE, seen, true)).toBe(false);
  });

  test("4 corrupt JSON / wrong shape → zero ticks, state replaced cleanly", () => {
    for (const raw of ["{nope", '{"seen_at":5,"keys":"a"}', "[1,2]", '{"seen_at":"' + BASE + '","keys":[1]}']) {
      const s = mem({ [LAST_SEEN_KEY]: raw });
      const v = openVisit(s, NOW);
      expect(v.seen).toBeNull();
      v.note(["k"]);
      v.flush();
      expect(stored(s).keys).toEqual(["k"]);
    }
    // §N5.1 cut: an old Beat 10 record (plain ISO, no keys) simply resets → no ticks, no baseline, replaced cleanly.
    const s = mem({ [LAST_SEEN_KEY]: BASE });
    const v = openVisit(s, NOW);
    expect(v.seen).toBeNull();
    expect(readSeen(BASE)).toEqual({ seen_at: null, keys: null });
    v.note(["k"]);
    v.flush();
    expect(stored(s)).toEqual({ seen_at: null, keys: ["k"] });
    expect(sinceBase(null, BASE)).toBeNull();
    expect(sinceBase(null, JSON.stringify({ seen_at: BASE, keys: [] }))).toBe(BASE);
  });

  test("5 localStorage throws → zero ticks, no error", () => {
    const boom = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
    const v = openVisit(boom, NOW);
    expect(v.seen).toBeNull();
    expect(() => { v.note(["a"]); v.flush(); v.leave(); }).not.toThrow();
    expect(openVisit(null, NOW).seen).toBeNull();
  });

  test("6 keys capped at 400, newest kept", () => {
    const prev = Array.from({ length: 400 }, (_, i) => `p${i}`);
    const cur = Array.from({ length: 50 }, (_, i) => `c${i}`);
    const out = mergeKeys(cur, prev);
    expect(KEYS_CAP).toBe(400);
    expect(out.length).toBe(400);
    expect(out.slice(0, 50)).toEqual(cur);
    expect(out[50]).toBe("p0");
    expect(out.includes("p399")).toBe(false);
    expect(mergeKeys(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });

  test("7 lead, Gmail and X rows never ticked", () => {
    expect(tickable("gmail:abc")).toBe(false);
    expect(tickable("x:sama:1")).toBe(false);
    for (const id of ["hn:1", "rss:openai:a", "rss-sec:x", "gnews:a", "anl:a", "rel:a"]) expect(tickable(id)).toBe(true);
    // The Brief lead never renders a tick: ticks live only in Wire / Pulse / Papers rows.
    const at = desk.indexOf("function Brief(");
    const lead = desk.slice(at, desk.indexOf("\nfunction ", at + 1));
    expect(lead.length).toBeGreaterThan(100);
    expect(lead.includes("NewTick")).toBe(false);
  });

  test("8 ticks unchanged after view switch / popstate within the same visit", () => {
    const s = mem({ [LAST_SEEN_KEY]: JSON.stringify({ seen_at: BASE, keys: ["old"] }) });
    const v = openVisit(s, NOW);
    const ticks = () => ["old", "n1"].filter((k) => isTick(k, after, BASE, v.seen));
    expect(ticks()).toEqual(["n1"]);
    v.note(["old", "n1"]);
    v.flush();
    v.note(["n1", "paper1"]); // Papers lane mounts later (view switch)
    v.flush();
    expect(ticks()).toEqual(["n1"]);
    expect(stored(s)).toEqual({ seen_at: BASE, keys: ["old", "n1", "paper1"] });
  });

  test("9 seen_at in the future (>10 min) → first visit", () => {
    const fut = new Date(NOW + 11 * 60_000).toISOString();
    const s = mem({ [LAST_SEEN_KEY]: JSON.stringify({ seen_at: fut, keys: ["a"] }) });
    expect(openVisit(s, NOW).seen).toBeNull();
    const ok = new Date(NOW + 9 * 60_000).toISOString();
    expect(openVisit(mem({ [LAST_SEEN_KEY]: JSON.stringify({ seen_at: ok, keys: ["a"] }) }), NOW).seen).not.toBeNull();
  });

  test("10 tick is a dot inside the headline cell (wraps, never a new grid column)", () => {
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const rule = css.slice(css.indexOf(".since-tick {"), css.indexOf("}", css.indexOf(".since-tick {")));
    expect(rule).toContain("var(--pip-amber)");
    expect(rule).toContain("display: inline-block");
    expect((desk.match(/<NewTick \/>/g) ?? []).length).toBe(3); // Wire, Pulse, Papers
  });

  test("11 row key = PASS-W key (canonical URL, row id fallback)", () => {
    expect(rowKey("https://www.ft.com/content/a?utm_source=x", "id1")).toBe(canonicalizeUrl("https://www.ft.com/content/a?utm_source=x"));
    expect(rowKey("", "id1")).toBe("id1");
    expect(rowKey(null, "id1")).toBe("id1");
  });

  test("12 accessible text on each tick, no visible text label", () => {
    expect(TICK_SR).toBe("new since your last visit");
    const fn = desk.slice(desk.indexOf("function NewTick"), desk.indexOf("// end NewTick"));
    expect(fn).toContain("sr-only");
    expect(fn).toContain("TICK_SR");
    expect(fn).not.toContain(">NEW<");
  });
});

describe("PASS-N wiring", () => {
  test("visit.tick applies lead exclusion, key, first-seen and paper rule", () => {
    const s = mem({ [LAST_SEEN_KEY]: JSON.stringify({ seen_at: BASE, keys: [canonicalizeUrl("https://www.a.com/x/")] }) });
    const v = openVisit(s, NOW);
    const a = { id: "c1", url: "https://a.com/x" };
    const b = { id: "c2", url: "https://b.com/y" };
    expect(v.tick(a, after, BASE, "hn:1")).toBe(false);
    expect(v.tick(b, after, BASE, "hn:2")).toBe(true);
    expect(v.tick(b, before, BASE, "hn:2")).toBe(false);
    expect(v.tick(b, after, BASE, "gmail:2")).toBe(false);
    expect(v.tick(b, after, BASE, "x:a:2")).toBe(false);
    expect(v.paper({ id: "p1", abs: "https://arxiv.org/abs/1" })).toBe(true);
    v.note([b, { id: "noid" }]);
    v.flush();
    expect(stored(s).keys.slice(0, 2)).toEqual([canonicalizeUrl(b.url), "noid"]);
  });
  test("tick module stays out of First Load (lazy import only)", () => {
    expect(desk).toContain('import("@/lib/new-ticks")');
    expect(desk).not.toMatch(/from "@\/lib\/new-ticks"/);
    expect(desk).not.toMatch(/from "@\/lib\/(dedupe|canon-url)"/);
  });
});
