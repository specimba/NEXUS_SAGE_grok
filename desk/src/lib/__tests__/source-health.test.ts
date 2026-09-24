import { describe, expect, test } from "bun:test";
import {
  applyOutcome,
  emptyLedger,
  healthState,
  parseLedger,
  pruneHistory,
  summarizeLedger,
  updateLedger,
} from "@/lib/source-health";

const H = (h: number) => new Date(Date.UTC(2026, 8, 25, 0) + h * 3_600_000).toISOString().replace(/\.\d{3}Z$/, "Z");

describe("source health ledger", () => {
  test("first ok run seeds entry", () => {
    const l = updateLedger(null, [{ id: "hn", ok: true, items: 10 }], H(0));
    expect(l.sources.hn).toMatchObject({
      last_ok: H(0),
      last_fail: null,
      fail_reason: null,
      streak_ok: 1,
      streak_fail: 0,
      items_last: 10,
    });
    expect(l.sources.hn.history).toHaveLength(1);
    expect(l.updated_at).toBe(H(0));
  });

  test("streaks: ok ok fail fail ok", () => {
    let l = emptyLedger();
    const seq = [true, true, false, false, true];
    const snaps: [number, number][] = [];
    seq.forEach((ok, i) => {
      l = updateLedger(l, [{ id: "openalex", ok, items: ok ? 3 : 0, reason: ok ? undefined : "HTTP 429" }], H(i * 4));
      snaps.push([l.sources.openalex.streak_ok, l.sources.openalex.streak_fail]);
    });
    expect(snaps).toEqual([[1, 0], [2, 0], [0, 1], [0, 2], [1, 0]]);
    const e = l.sources.openalex;
    expect(e.last_fail).toBe(H(12));
    expect(e.fail_reason).toBe("HTTP 429"); // last failure reason retained after recovery
    expect(e.last_ok).toBe(H(16));
    expect(e.items_last).toBe(3);
  });

  test("history rolls to 7 days", () => {
    let l = emptyLedger();
    for (let i = 0; i < 60; i++) l = updateLedger(l, [{ id: "rss", ok: true, items: 1 }], H(i * 4)); // 10 days @4h
    const hist = l.sources.rss.history;
    const oldest = Date.parse(hist[0].at);
    expect(Date.parse(H(59 * 4)) - oldest).toBeLessThanOrEqual(7 * 86_400_000);
    expect(hist.length).toBe(43); // 7d / 4h = 42 intervals + current
    expect(l.sources.rss.streak_ok).toBe(60); // streak not bounded by window
  });

  test("sources absent this run keep entry but prune history", () => {
    let l = updateLedger(null, [{ id: "wikidata", ok: true, items: 2 }], H(0));
    l = updateLedger(l, [{ id: "hn", ok: true, items: 1 }], H(24 * 8));
    expect(l.sources.wikidata.history).toHaveLength(0);
    expect(l.sources.wikidata.last_ok).toBe(H(0));
  });

  test("pruneHistory drops malformed timestamps", () => {
    expect(pruneHistory([{ at: "nope", ok: true, items: 0 }, { at: H(0), ok: true, items: 1 }], H(1))).toHaveLength(1);
  });

  test("parseLedger tolerates garbage", () => {
    expect(parseLedger(null).sources).toEqual({});
    expect(parseLedger({ sources: { x: null, y: { streak_ok: "2", history: "bad" } } }).sources.y.streak_ok).toBe(2);
  });

  test("health state + summary", () => {
    const fail1 = applyOutcome(applyOutcome(undefined, { id: "gh", ok: true, items: 1 }, H(0)), { id: "gh", ok: false, items: 0, reason: "403" }, H(4));
    expect(healthState(fail1)).toBe("flaky");
    const fail2 = applyOutcome(fail1, { id: "gh", ok: false, items: 0 }, H(8));
    expect(healthState(fail2)).toBe("fail");
    expect(fail2.fail_reason).toBe("unknown");
    const rec = applyOutcome(fail2, { id: "gh", ok: true, items: 5 }, H(12));
    expect(healthState(rec)).toBe("flaky"); // fails still inside 7d window
    const l = updateLedger(null, [{ id: "b", ok: true, items: 1 }, { id: "a", ok: false, items: 0, reason: "x" }], H(0));
    const rows = summarizeLedger(l);
    expect(rows.map((r) => [r.id, r.state, r.runs_7d, r.ok_7d])).toEqual([
      ["a", "fail", 1, 0],
      ["b", "ok", 1, 1],
    ]);
  });
});
