/**
 * Cap semantics on FIXED, committed fixtures — independent of whatever the latest crawl contains.
 *  - fixtures/desk-view-caps-fixture.json: hand-built crawl input + hand-derived expected kept sets (DESK_VIEW_CAPS rules:
 *    a link over LINK_MAX = 2048 chars (broken data) drops a story at any age unless pinned; per-source over cap → oldest unpinned first, ties by id;
 *    then `drop` extra oldest unpinned survivors; pinned stories are never dropped).
 *  - fixtures/lead-history-2026-10-06.json (12 days, snapshot of artifacts/sage/lead-history.json) +
 *    lead-log-tape-2026-10-06.expected.txt: the holotape keeps the newest LEAD_LOG_CAPS.days = 10 days, each day as the
 *    full history renders it.
 * Live crawl comparison is a report, never a test: bun scripts/desk-view.ts --report.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DESK_VIEW_CAPS, LINK_MAX, droppableStories, keptStories, type DeskViewInput } from "@/lib/desk-view";
import { LEAD_LOG_CAPS, buildLeadLog, renderLeadLogText, slimLeadLog } from "@/lib/lead-log";

const FX = join(import.meta.dir, "fixtures");
const fx = JSON.parse(readFileSync(join(FX, "desk-view-caps-fixture.json"), "utf8"));
const caps = { ...DESK_VIEW_CAPS, items: fx.caps.items } as typeof DESK_VIEW_CAPS; // real link cap (LINK_MAX)
const input = { clusters: fx.clusters, members: fx.members, pins: fx.pins, gnews: [], xPosts: [], papers: [] } as unknown as DeskViewInput;
const keptIds = (drop: number) => [...keptStories(input, { caps, drop })].map((i) => input.clusters[i]!.id).sort();

describe("desk-view caps on a fixed fixture (oldest first · pins never dropped · link cap)", () => {
  test("row + link caps (drop 0): a 708-char GNews link is kept whole; a >2048-char link drops even the NEWEST story; over-cap source sheds its oldest unpinned", () => {
    expect(LINK_MAX).toBe(2048);
    expect(DESK_VIEW_CAPS.chars.url).toBe(LINK_MAX);
    const len = (id: string) => fx.clusters.find((c: { id: string }) => c.id === id).url.length;
    expect(len("cl:gnews:g1")).toBe(708);
    expect(len("cl:gnews:gx")).toBeGreaterThan(2048);
    expect(keptIds(0)).toContain(fx.expected.drop0.kept_long_link);
    expect(keptIds(0)).not.toContain("cl:gnews:gx");
    expect(keptIds(0)).toEqual(fx.expected.drop0.kept);
    for (const id of Object.keys(fx.expected.drop0.why_dropped)) expect(keptIds(0)).not.toContain(id);
    expect(droppableStories(input, { caps })).toBe(fx.expected.drop0.droppable);
  });
  test("budget drops take the oldest unpinned survivors, ties broken by id", () => {
    expect(keptIds(3)).toEqual(fx.expected.drop3.kept);
  });
  test("pinned stories survive everything — even the oldest one and one with an over-long link", () => {
    expect(keptIds(99)).toEqual(fx.expected.drop99.kept);
    for (const d of [0, 1, 3, 5, 99]) for (const p of fx.pins) expect(keptIds(d)).toContain(p);
  });
  test("deterministic: input order does not change the result", () => {
    const rev = { ...input, clusters: [...input.clusters].reverse() };
    expect([...keptStories(rev, { caps, drop: 3 })].map((i) => rev.clusters[i]!.id).sort()).toEqual(fx.expected.drop3.kept);
  });
});

describe("lead-log cap on a fixed 12-day history (LEAD_LOG_CAPS.days = 10)", () => {
  const history = JSON.parse(readFileSync(join(FX, "lead-history-2026-10-06.json"), "utf8"));
  const full = buildLeadLog(history);
  const slim = slimLeadLog(full);
  test("cap is 10 days; the fixture has more, newest first", () => {
    expect(LEAD_LOG_CAPS.days).toBe(10);
    expect(full.days.length).toBe(12);
    const dates = full.days.map((d) => d.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
  test("the tape keeps the newest 10 days, each exactly as the full history renders it", () => {
    expect(slim.days.map((d) => d.date)).toEqual(full.days.slice(0, 10).map((d) => d.date));
    expect(renderLeadLogText(slim)).toBe(renderLeadLogText({ ...full, days: full.days.slice(0, 10) }));
  });
  test("golden tape text (header reads 10 days; HELD 09-27 explained line by line)", () => {
    const text = renderLeadLogText(slim);
    expect(text + "\n").toBe(readFileSync(join(FX, "lead-log-tape-2026-10-06.expected.txt"), "utf8"));
    expect(text.split("\n")[0]).toBe("HOLOTAPE · LEAD LOG · 10 days");
    expect(text).toContain("2026-09-27 · HELD");
  });
});
