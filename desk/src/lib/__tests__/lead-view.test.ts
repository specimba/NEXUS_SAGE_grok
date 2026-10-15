import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LEAD_HELD_TEXT, LEAD_STALE_TEXT, leadHeldText, leadView, nextCrawlSlotHHMM } from "@/lib/lead-view";
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
  test("48h age check switches only after mount (static HTML keeps the lead; the browser flips to HELD past 48h)", () => {
    const pick = { held: false, today, firstAt: FIRST };
    const h = (n: number) => Date.parse(FIRST) + n * 3_600_000;
    expect(leadView(pick, null).held).toBe(false);
    expect(leadView(pick, h(30)).held).toBe(false); // PASS-L: 30h-old lead stays live
    expect(leadView(pick, h(48)).held).toBe(false); // exactly 48h: not yet
    expect(leadView(pick, h(48) + 60_000)).toMatchObject({ held: true, reason: "stale", carried: "OpenAI ships a model" });
  });
  test("no pick at all ⇒ HELD", () => {
    expect(leadView({ held: false, today: null, firstAt: null }, null)).toMatchObject({ held: true, reason: "held", carried: null });
  });
  test("text is exactly 'HELD · no qualifying story'", () => {
    expect(LEAD_HELD_TEXT).toBe("HELD · no qualifying story");
  });
});

describe("Phase 2 polish", () => {
  const src = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
  const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
  test("#1 HELD text depends on the reason; LeadInline and the stale plate use it", () => {
    expect(LEAD_STALE_TEXT).toBe("HELD · lead >48h old");
    expect(leadHeldText("stale")).toBe(LEAD_STALE_TEXT);
    expect(leadHeldText("held")).toBe(LEAD_HELD_TEXT);
    expect(leadHeldText(null)).toBe(LEAD_HELD_TEXT);
    expect(src).toMatch(/\{leadHeldText\(view\.reason\)\}/);
    expect(src).toMatch(/\{leadHeldText\("stale"\)\} ·/);
    expect(src).not.toMatch(/lead older than 24h \(/);
  });
  test("#2 stale plate meta shows staleLead.date, never the old last-pick date", () => {
    expect(src).toMatch(/lv\.reason === "stale"\s*\? `held · lead \$\{staleLead\.date\}`/);
  });
  test("#3 <768 Yesterday headline: full width, clamp 2, tagged as an allowed row", () => {
    expect(src).toMatch(/sage-take-yesterday-headline line-clamp-1 sage-headline" data-row-clamp="yesterday"/);
    const m = css.slice(css.indexOf("@media (max-width: 767px) {\n  .brief-v5 .sage-take-yesterday:not"));
    expect(m).toMatch(/flex: 1 0 100%;[^}]*-webkit-line-clamp: 2;/);
  });
  test("#4 Voice MOVE is the lead's single line, never the joined row list", () => {
    expect(src).toMatch(/move: lead\.move,/);
    expect(src).not.toMatch(/unlock\.rows\.map\(\(r\) => r\.title\)\.join/);
    expect(src).toMatch(/data-voice-move="1"/);
  });
  test("#5 INGEST line has no lead cell", () => {
    const line = src.slice(src.indexOf('id="desk-ingest-line"'), src.indexOf('className="desk-ticker"'));
    expect(line).not.toMatch(/LeadInline|· lead/);
  });
  test("#6 .sage-deny is amber", () => {
    expect(css).toMatch(/\.sage-deny \{\s*color: var\(--pip-amber\);/);
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
  test("empty Wire still renders its crawl stamp and an honest zero line (Pages coherence reads the stamp)", () => {
    expect(src).not.toMatch(/WIRE_ROWS\.length === 0\) return null/);
    expect(src).toMatch(/className="brief-wire-empty"/);
  });
  test("no spot renders LEAD_TODAY.headline directly (all go through leadView)", () => {
    expect(src).not.toMatch(/LEAD_TODAY\?\.headline/);
    expect(src.match(/<LeadInline view=\{leadV\} \/>/g)?.length).toBe(1); // status bar only; INGEST line carries no lead (Phase 2 #5)
    expect(src).toMatch(/lv\.held \? "sage-take-held" : "sage-take-inverse"/);
  });
  test("HELD plate CSS is outlined (no fill), vars only", () => {
    const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* HELD lead (UX)"));
    expect(block).toMatch(/\.sage-take\.sage-take-held \{\s*background: transparent;\s*border: 1px solid var\(--phosphor\);\s*box-shadow: none;/);
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  test("static export: lead cells follow the built HELD state (branches on out/, never on the live crawl)", () => {
    const html = join(DESK, "out/index.html");
    if (!existsSync(html)) return;
    const h = readFileSync(html, "utf8").replaceAll("<!-- -->", "");
    const cells = [...h.matchAll(/<span class="desk-lead-headline[^"]*"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);
    if (h.includes('data-lead-state="held"')) {
      if (!h.includes("desk-lead-held")) return; // out/ predates this fix
      expect(cells.length).toBe(1);
      for (const c of cells) expect(c).toBe(LEAD_HELD_TEXT);
      if (LEAD_HELD && LEAD_TODAY?.headline) for (const c of cells) expect(c).not.toContain(LEAD_TODAY.headline.slice(0, 20));
      // UX-1: SIGNAL HOLD card — the retry bar names the next try slot.
      expect(h).toMatch(/data-lead-held="1"/);
      expect(h).toMatch(/next try <b>\d\d:11<\/b>/);
    } else {
      for (const c of cells) expect(c).not.toBe(LEAD_HELD_TEXT);
      expect(h).not.toContain('data-lead-held="1"');
    }
  });
});
