/**
 * UX-NEXT-3 §2 — morning edition day tape: crawl field (crawl-tape.json), DAY_TAPE desk field, tape states.
 * Fixtures are real crawls (git history of src/data/pulse-clusters.ts, Oct 14–15) + real lead-history entries.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DayTape } from "@/components/sage/day-tape";
import {
  buildDayTape,
  CRAWL_TAPE_KEEP,
  DAY_TAPE_MAX,
  dayTapeView,
  editionDate,
  nextPickSlot,
  parseCrawlTape,
  recordCrawl,
  slotHeight,
  type CrawlTapeLog,
  type DayTapeSlot,
} from "@/lib/day-tape";
import { stripStamps } from "@/lib/reader-hash";
import { istHHMM } from "@/lib/ist-time";

const DESK = join(import.meta.dir, "../../..");
/** Real crawls (stamp, "is_new":true clusters at that crawl) — scripts/day-tape-backfill.ts output. */
const REAL: CrawlTapeLog = parseCrawlTape({
  crawls: [
    { at: "2026-10-13T08:23:23Z", new: 59 },
    { at: "2026-10-14T08:22:59Z", new: 74 },
    { at: "2026-10-14T17:15:03Z", new: 33 },
    { at: "2026-10-14T18:23:11Z", new: 18 },
    { at: "2026-10-15T03:21:16Z", new: 22 },
    { at: "2026-10-15T08:21:35Z", new: 25 },
    { at: "2026-10-15T13:22:12Z", new: 22 },
  ],
});
const CRAWL_AT = "2026-10-15T18:21:26Z";
/** lead-history 2026-10-15 (picked at the 06:21 crawl). */
const PICKED = { date: "2026-10-15", crawl_at: "2026-10-15T03:21:16Z", reason: "picked", pick_slot: "06:21" };
/** Same day, HELD at the 06:21 crawl (fixture: every candidate GNW_ONLY). */
const HELD = { date: "2026-10-15", crawl_at: "2026-10-15T03:21:16Z", reason: "held", pick_slot: "06:21" };
/** Stale: the last pick is from an earlier date (no entry today). */
const STALE = { date: "2026-10-13", crawl_at: "2026-10-13T08:23:23Z", reason: "picked", pick_slot: "11:23" };

const render = (tape: readonly DayTapeSlot[], o: { since?: string | null; next?: string; held?: boolean } = {}) =>
  renderToStaticMarkup(createElement(DayTape, { tape, crawlAt: CRAWL_AT, since: o.since ?? null, next: o.next ?? "06:11", held: o.held ?? false }));
const kinds = (html: string) => [...html.matchAll(/data-kind="([^"]*)"/g)].map((m) => m[1]);

describe("crawl field: crawl-tape.json", () => {
  test("recordCrawl appends oldest-first, replaces a rerun of the same stamp, keeps the newest CRAWL_TAPE_KEEP", () => {
    let log = parseCrawlTape(null);
    for (let i = 0; i < CRAWL_TAPE_KEEP + 4; i++) log = recordCrawl(log, new Date(Date.UTC(2026, 9, 1, i)).toISOString(), i);
    expect(log.crawls).toHaveLength(CRAWL_TAPE_KEEP);
    expect(log.crawls[0]!.new).toBe(4);
    const again = recordCrawl(log, log.crawls.at(-1)!.at, 99);
    expect(again.crawls).toHaveLength(CRAWL_TAPE_KEEP);
    expect(again.crawls.at(-1)!.new).toBe(99);
  });
  test("parseCrawlTape drops malformed entries and sorts", () => {
    const p = parseCrawlTape({ crawls: [{ at: "2026-10-15T08:21:35Z", new: 3 }, { at: "nope", new: 1 }, { at: "2026-10-15T03:21:16Z", new: -1 }, { at: "2026-10-14T18:23:11Z", new: 2 }] });
    expect(p.crawls.map((c) => c.at)).toEqual(["2026-10-14T18:23:11Z", "2026-10-15T08:21:35Z"]);
    expect(parseCrawlTape("garbage").crawls).toEqual([]);
  });
  test("ingest records the crawl stamp with the first_seen = stamp cluster count", () => {
    const src = readFileSync(join(DESK, "scripts/ingest.ts"), "utf8");
    expect(src).toContain("recordCrawl(parseCrawlTape(readJson(tapePath)), stamp, clusters.filter((c) => c.first_seen === stamp).length)");
  });
  test("the committed seed is real history: every entry matches a crawl stamp with its is_new count", () => {
    const seed = parseCrawlTape(JSON.parse(readFileSync(join(DESK, "artifacts/sage/crawl-tape.json"), "utf8")));
    expect(seed.crawls.length).toBeGreaterThan(0);
    expect(seed.crawls.length).toBeLessThanOrEqual(CRAWL_TAPE_KEEP);
    for (const c of REAL.crawls.slice(1)) expect(seed.crawls).toContainEqual(c);
  });
});

describe("desk field: DAY_TAPE", () => {
  test("yesterday's last crawl + today's crawls; PICK on the slot whose time = LEAD_TODAY.pick_slot", () => {
    const tape = buildDayTape(REAL, CRAWL_AT, 40, PICKED);
    expect(tape.map((s) => istHHMM(s.at))).toEqual(["21:23", "06:21", "11:21", "16:22", "21:21"]);
    expect(tape.map((s) => s.new)).toEqual([18, 22, 25, 22, 40]);
    expect(tape.filter((s) => s.pick)).toEqual([{ at: PICKED.crawl_at, new: 22, pick: "pick" }]);
    expect(istHHMM(tape.find((s) => s.pick)!.at)).toBe(PICKED.pick_slot);
  });
  test("HELD day: the pick slot carries held, never pick", () => {
    const tape = buildDayTape(REAL, CRAWL_AT, 40, HELD);
    expect(tape.find((s) => s.at === HELD.crawl_at)!.pick).toBe("held");
    expect(tape.some((s) => s.pick === "pick")).toBe(false);
  });
  test("stale / no pick today and the cycle seed mark no slot", () => {
    expect(buildDayTape(REAL, CRAWL_AT, 40, STALE).some((s) => s.pick)).toBe(false);
    expect(buildDayTape(REAL, CRAWL_AT, 40, { ...PICKED, reason: "seed" }).some((s) => s.pick)).toBe(false);
    expect(buildDayTape(REAL, CRAWL_AT, 40, null).some((s) => s.pick)).toBe(false);
  });
  test("NOW = CRAWL_AT with the current crawl's own count; no log ⇒ just the current crawl (nothing invented)", () => {
    expect(buildDayTape(parseCrawlTape(null), CRAWL_AT, 40, PICKED)).toEqual([{ at: CRAWL_AT, new: 40 }]);
    expect(buildDayTape(recordCrawl(REAL, CRAWL_AT, 7), CRAWL_AT, 40, null).at(-1)).toEqual({ at: CRAWL_AT, new: 40 });
  });
  test(`never more than ${DAY_TAPE_MAX} crawl slots: yesterday, pick and NOW survive, then the newest`, () => {
    let log = REAL;
    for (const at of ["2026-10-15T04:00:00Z", "2026-10-15T05:00:00Z", "2026-10-15T10:00:00Z", "2026-10-15T15:00:00Z"]) log = recordCrawl(log, at, 1);
    const tape = buildDayTape(log, CRAWL_AT, 40, PICKED);
    expect(tape).toHaveLength(DAY_TAPE_MAX);
    expect(tape[0]!.at).toBe("2026-10-14T18:23:11Z");
    expect(tape.some((s) => s.pick === "pick")).toBe(true);
    expect(tape.at(-1)!.at).toBe(CRAWL_AT);
  });
  test("generated desk-view.ts carries DAY_TAPE from the committed log + LEAD_TODAY", async () => {
    const { DAY_TAPE, CRAWL_AT: AT, LEAD_TODAY } = await import("@/data/desk-view");
    expect(DAY_TAPE.at(-1)!.at).toBe(AT);
    expect(DAY_TAPE.length).toBeLessThanOrEqual(DAY_TAPE_MAX);
    const pick = DAY_TAPE.find((s) => s.pick);
    if (LEAD_TODAY?.reason === "picked" && pick) expect(istHHMM(pick.at)).toBe(LEAD_TODAY.pick_slot!);
  });
  test("reader-hash: a crawl whose only change is the tape hashes equal", () => {
    const a = `export const X = 1;\nexport const DAY_TAPE: DayTapeSlot[] = [{"at":"2026-10-15T13:22:12Z","new":22}];\nexport const Y = 2;`;
    const b = `export const X = 1;\nexport const DAY_TAPE: DayTapeSlot[] = [{"at":"2026-10-15T13:22:12Z","new":22},{"at":"2026-10-15T18:21:26Z","new":0}];\nexport const Y = 2;`;
    expect(stripStamps(a)).toBe(stripStamps(b));
    expect(stripStamps(a)).not.toBe(stripStamps(b.replace("Y = 2", "Y = 3")));
  });
});

describe("tape view + states", () => {
  const tape = buildDayTape(REAL, CRAWL_AT, 40, PICKED);
  test("edition date, overnight (first crawl today), today total", () => {
    const v = dayTapeView(tape, CRAWL_AT, null);
    expect(v.date).toBe("THU 15 OCT");
    expect(editionDate("2026-10-15T21:30:00Z")).toBe("FRI 16 OCT"); // 00:30 Istanbul
    expect(v.overnight).toBe(22);
    expect(v.today).toBe(22 + 25 + 22 + 40);
  });
  test("bars rank by new (log scale, 0 ⇒ no bar)", () => {
    const v = dayTapeView(tape, CRAWL_AT, null);
    const byNew = [...v.slots].sort((a, b) => a.new - b.new);
    for (let i = 1; i < byNew.length; i++) expect(byNew[i]!.h).toBeGreaterThanOrEqual(byNew[i - 1]!.h);
    expect(v.slots.at(-1)!.h).toBe(100);
    expect(slotHeight(0, 40)).toBe(0);
    expect(slotHeight(1, 400)).toBeGreaterThanOrEqual(8);
  });
  test("picked day: prev · pick · · · now · next, summary says picked HH:MM", () => {
    const html = render(tape);
    expect(kinds(html)).toEqual(["prev", "pick", "", "", "now", "next"]);
    expect(html).toContain("lead picked <b>06:21</b>");
    expect(html).toContain('data-day-tape="5"');
    expect(html).not.toContain("▲ you");
  });
  test("HELD day: hollow held tag on the pick slot, summary says held, NEXT = the plate's next try", () => {
    const html = render(buildDayTape(REAL, CRAWL_AT, 40, HELD), { held: true, next: nextPickSlot(true, "14:11") });
    expect(kinds(html)).toEqual(["prev", "held", "", "", "now", "next"]);
    expect(html).toContain('<span class="day-slot-tag">held</span>');
    expect(html).not.toContain(">pick<");
    expect(html).toContain("lead <b>held</b>");
    expect(html).toContain(">14:11<");
  });
  test("stale day: no pick slot; held flag ⇒ summary held, else no pick yet", () => {
    const st = buildDayTape(REAL, CRAWL_AT, 40, STALE);
    expect(kinds(render(st, { held: true }))).toEqual(["prev", "", "", "", "now", "next"]);
    expect(render(st, { held: true })).toContain("lead <b>held</b>");
    expect(render(st)).toContain("no pick yet");
  });
  test("next pick slot: 06:11 after a pick; HELD retries only 06:00–20:59", () => {
    expect(nextPickSlot(false, "10:11")).toBe("06:11");
    expect(nextPickSlot(true, "10:11")).toBe("10:11");
    expect(nextPickSlot(true, "22:11")).toBe("06:11");
    expect(nextPickSlot(true, "02:11")).toBe("06:11");
  });
  test("▲ you sits under the last slot at/before the since baseline; none on a first visit or before the tape", () => {
    expect(dayTapeView(tape, CRAWL_AT, "2026-10-15T14:00:00Z").you).toBe(3);
    expect(dayTapeView(tape, CRAWL_AT, null).you).toBeNull();
    expect(dayTapeView(tape, CRAWL_AT, "2026-10-14T10:00:00Z").you).toBeNull();
    const html = render(tape, { since: "2026-10-15T14:00:00Z" });
    expect(html.match(/▲ you/g)).toHaveLength(1);
  });
  test("pick and NOW on the same crawl: one pick tag, flagged now", () => {
    const morning = buildDayTape(REAL, "2026-10-15T03:21:16Z", 22, PICKED);
    const html = renderToStaticMarkup(createElement(DayTape, { tape: morning, crawlAt: "2026-10-15T03:21:16Z", since: null, next: "06:11", held: false }));
    expect(kinds(html)).toEqual(["prev", "pick", "next"]);
    expect(html).toContain('data-now="1"');
  });
  test("empty tape renders nothing", () => {
    expect(render([])).toBe("");
  });
});
