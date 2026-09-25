import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LEAD_HELD_TEXT, leadView, nextCrawlSlotHHMM } from "@/lib/lead-view";
import { LEAD_HELD, LEAD_TODAY } from "@/data/lead-pick";

const DESK = join(import.meta.dir, "../../..");
const today = { headline: "OpenAI ships a model", cluster_id: "cl:hn:1" };
const FIRST = "2026-09-25T06:00:00Z";

describe("leadView — one source of truth for Brief plate, status bar, INGEST line", () => {
  test("HELD pick ⇒ HELD everywhere, before and after mount; carried headline never shown as the lead", () => {
    for (const now of [null, Date.parse("2026-09-25T12:00:00Z")]) {
      const v = leadView({ held: true, today, firstAt: FIRST }, now);
      expect(v).toMatchObject({ held: true, reason: "held", headline: null, carried: "OpenAI ships a model" });
    }
  });
  test("a lead for today ⇒ the real headline", () => {
    expect(leadView({ held: false, today, firstAt: FIRST }, Date.parse("2026-09-25T12:00:00Z"))).toEqual({
      held: false, reason: null, headline: "OpenAI ships a model", id: "cl:hn:1", carried: null,
    });
  });
  test("24h age check switches only after mount (static HTML keeps the lead; the browser flips to HELD)", () => {
    const pick = { held: false, today, firstAt: FIRST };
    expect(leadView(pick, null).held).toBe(false);
    expect(leadView(pick, Date.parse("2026-09-26T05:59:00Z")).held).toBe(false);
    expect(leadView(pick, Date.parse("2026-09-26T06:00:00Z"))).toMatchObject({ held: true, reason: "stale", carried: "OpenAI ships a model" });
  });
  test("no pick at all ⇒ HELD", () => {
    expect(leadView({ held: false, today: null, firstAt: null }, null)).toMatchObject({ held: true, reason: "held", carried: null });
  });
  test("text is exactly 'HELD · no qualifying story'", () => {
    expect(LEAD_HELD_TEXT).toBe("HELD · no qualifying story");
  });
});

describe("next try = next crawl slot 02/06/10/14/18/22 :11 Istanbul", () => {
  const at = (ist: string) => Date.parse(`${ist}+03:00`);
  test.each([
    ["2026-09-25T17:05:00", "18:11"],
    ["2026-09-25T14:16:00", "18:11"],
    ["2026-09-25T18:10:59", "18:11"],
    ["2026-09-25T18:11:00", "22:11"],
    ["2026-09-25T22:30:00", "02:11"],
    ["2026-09-25T00:00:00", "02:11"],
    ["2026-09-25T02:11:00", "06:11"],
    ["2026-09-25T09:59:00", "10:11"],
  ])("%s ⇒ %s", (ist, hhmm) => {
    expect(nextCrawlSlotHHMM(at(ist))).toBe(hhmm);
  });
});

describe("desk wiring", () => {
  const src = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
  test("no spot renders LEAD_TODAY.headline directly (all go through leadView)", () => {
    expect(src).not.toMatch(/LEAD_TODAY\?\.headline/);
    expect(src.match(/<LeadInline view=\{leadV\} \/>/g)?.length).toBe(2);
    expect(src).toMatch(/lv\.held \? "sage-take-held" : "sage-take-inverse"/);
  });
  test("HELD plate CSS is outlined (no fill), vars only", () => {
    const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* HELD lead (UX)"));
    expect(block).toMatch(/\.sage-take\.sage-take-held \{\s*background: transparent;\s*border: 1px solid var\(--phosphor\);\s*box-shadow: none;/);
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  test("static export: while HELD, header/ticker lead cells read HELD, never the carried headline", () => {
    const html = join(DESK, "out/index.html");
    if (!existsSync(html) || !LEAD_HELD) return;
    const h = readFileSync(html, "utf8");
    const cells = [...h.matchAll(/<span class="desk-lead-headline[^"]*"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);
    if (!h.includes("desk-lead-held")) return; // out/ predates this fix
    expect(cells.length).toBe(2);
    for (const c of cells) expect(c).toBe(LEAD_HELD_TEXT);
    if (LEAD_TODAY?.headline) for (const c of cells) expect(c).not.toContain(LEAD_TODAY.headline.slice(0, 20));
    expect(h).toContain('data-lead-state="held"');
    expect(h.replaceAll("<!-- -->", "")).toMatch(/HELD · no qualifying story · next try \d\d:11/);
  });
});
