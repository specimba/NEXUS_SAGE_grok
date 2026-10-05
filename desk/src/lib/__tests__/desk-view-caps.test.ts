/**
 * OPT win 3 follow-up — desk-view has a FIXED size (DESK_VIEW_CAPS + LEAD_LOG_CAPS): over-cap input drops the oldest
 * story whole (ties by id), output is deterministic, no rendered id ever dangles, and the synthetic worst case (every
 * lane at its cap, every field at max) stays inside the gzip budget whose build was measured under 185 kB.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as V from "@/data/desk-view";
import { LEAD_LOG } from "@/data/lead-log-view";
import {
  DESK_VIEW_CAPS,
  buildDeskView,
  clip,
  crawlItemIds,
  inflateClusters,
  xPosts,
  type DeskView,
  type DeskViewInput,
} from "@/lib/desk-view";
import { rawDeskViewInputs } from "@/lib/desk-view-inputs";
import { deskViewPins, fitDeskView, gzBytes, renderDeskViewModule } from "@/lib/desk-view-module";
import { LEAD_LOG_CAPS, buildLeadLog, renderLeadLogText, slimLeadLog } from "@/lib/lead-log";
import { renderLeadLogModule } from "@/lib/lead-log-module";
import { synth, synthExtras, synthLeadLog } from "./desk-view-synth";

const DESK = join(import.meta.dir, "../../..");

/**
 * Measured 2026-10-03 (next build, synthetic worst case from desk-view-synth.ts, seed-searched to sit just under the
 * budget): module gzip 41 385 B → First Load JS for `/` 181 kB (page 78.7 kB + shared 103 kB); per extra module byte
 * ≈ +1 chunk byte, so at the full 41 900 B budget ≈ 181.8 kB — ≥ 3 kB under the 185 kB gate. The real 07:12:59Z crawl
 * (capped) builds to 181 kB. Raising gzBytes past this needs a new worst-case build.
 */
const WORST_CASE_PROVEN_GZ = 41_900;
const WORST_CASE_FIRST_LOAD_KB = 181.8;
/** slimLeadLog(synthLeadLog()) measured 2026-10-03 — the holotape props can never grow past this. */
const WORST_LOG_RAW = 134_000;
const WORST_LOG_GZ = 38_000;

const hn = (n: number, at: string, extra: Record<string, unknown> = {}) => ({ badge: "HN", publisher: `hn/u${n}`, title: `story ${n}`, at, url: `https://e.com/${n}`, summary: `sum ${n}`, ...extra });
const story = (lead: string, at: string, members: string[] = [lead]) => ({
  id: `cl:${lead}`, title: `story ${lead.split(":")[1]}`, url: `https://e.com/${lead.split(":")[1]}`, lead_id: lead, lead_source: "hn-algolia",
  sources: ["hn-algolia"], member_ids: members, size: members.length, at, first_seen: null, is_new: false,
});
const small = (caps = { ...DESK_VIEW_CAPS, items: { ...DESK_VIEW_CAPS.items, hn: 3 } }) => caps;

/** Every id the desk can render resolves inside the view. */
function assertNoDangling(view: DeskView, wireIds: string[] = []) {
  const clusters = inflateClusters(view.memberRows, view.orphanClusters);
  const ids = new Set(clusters.map((c) => c.id));
  for (const c of clusters) for (const id of [c.lead_id, ...c.member_ids]) expect(view.memberRows[id]).toBeDefined();
  for (const id of wireIds) expect(ids.has(id)).toBe(true);
  for (const p of xPosts(view.xPosts, view.memberRows)) {
    expect(view.memberRows[`x:${p.id}`]).toBeDefined();
    expect(p.take.length).toBeGreaterThan(0);
  }
  // No member is kept that no story / X post points at.
  const live = new Set([...clusters.flatMap((c) => [c.lead_id, ...c.member_ids]), ...view.xPosts.map((p) => `x:${p.id}`)]);
  for (const id of Object.keys(view.memberRows)) expect(live.has(id)).toBe(true);
}

describe("desk-view caps — fixed size, oldest dropped first", () => {
  test("over the per-source cap: the oldest stories go (whole, with their members), ties broken by id", () => {
    const members = {
      "hn:1": hn(1, "2026-10-01T00:00:00Z"), "hn:2": hn(2, "2026-10-02T00:00:00Z"), "hn:3": hn(3, "2026-10-02T00:00:00Z"),
      "hn:4": hn(4, "2026-10-03T00:00:00Z"), "hn:5": hn(5, "2026-10-03T01:00:00Z"),
    };
    // cl:hn:4 carries hn:2 as a member → 5 items over 4 stories; cap 3 ⇒ drop oldest (hn:1), then the tie hn:3 (< hn:4 time).
    const clusters = [story("hn:5", "2026-10-03T01:00:00Z"), story("hn:4", "2026-10-03T00:00:00Z", ["hn:4", "hn:2"]), story("hn:3", "2026-10-02T00:00:00Z"), story("hn:1", "2026-10-01T00:00:00Z")];
    const v = buildDeskView({ clusters, members, gnews: [], xPosts: [], papers: [] }, { caps: small() });
    expect(inflateClusters(v.memberRows, v.orphanClusters).map((c) => c.id)).toEqual(["cl:hn:5", "cl:hn:4"]);
    expect(crawlItemIds(v.memberRows)).toEqual(["hn:5", "hn:4", "hn:2"]);
    expect(v.trimmed).toEqual({ stories: 2, items: 2, xPosts: 0, papers: 0 });
    assertNoDangling(v);
    // Same time ⇒ the lower id goes first.
    const tie = { "hn:7": hn(7, "2026-10-02T00:00:00Z"), "hn:8": hn(8, "2026-10-02T00:00:00Z"), "hn:9": hn(9, "2026-10-02T00:00:00Z"), "hn:6": hn(6, "2026-10-02T00:00:00Z") };
    const tc = ["hn:8", "hn:6", "hn:9", "hn:7"].map((id) => story(id, "2026-10-02T00:00:00Z"));
    const tv = buildDeskView({ clusters: tc, members: tie, gnews: [], xPosts: [], papers: [] }, { caps: small() });
    expect(crawlItemIds(tv.memberRows)).toEqual(["hn:8", "hn:9", "hn:7"]);
  });

  test("pinned stories (Wire / rank / lead) survive even when they are the oldest; the budget drop skips them too", () => {
    const members = { "hn:1": hn(1, "2026-09-01T00:00:00Z"), "hn:2": hn(2, "2026-10-02T00:00:00Z"), "hn:3": hn(3, "2026-10-02T00:00:00Z"), "hn:4": hn(4, "2026-10-03T00:00:00Z") };
    const clusters = [story("hn:4", "2026-10-03T00:00:00Z"), story("hn:3", "2026-10-02T00:00:00Z"), story("hn:2", "2026-10-02T00:00:00Z"), story("hn:1", "2026-09-01T00:00:00Z")];
    const input: DeskViewInput = { clusters, members, gnews: [], xPosts: [], papers: [], pins: ["cl:hn:1"] };
    const v = buildDeskView(input, { caps: small(), drop: 1 });
    expect(inflateClusters(v.memberRows, v.orphanClusters).map((c) => c.id)).toEqual(["cl:hn:4", "cl:hn:1"]);
  });

  test("field caps: text past its cap is cut with an ellipsis; an over-long link drops its story (links are never cut)", () => {
    expect(clip("abcdef", 6)).toBe("abcdef");
    expect(clip("abcdefg", 6)).toBe("abcde…");
    const C = DESK_VIEW_CAPS.chars;
    const long = "x".repeat(C.title + 50);
    const members = { "hn:1": hn(1, "2026-10-03T00:00:00Z", { title: long, publisher: "p".repeat(C.publisher + 9) }), "hn:2": hn(2, "2026-10-03T00:00:00Z", { url: `https://e.com/${"u".repeat(C.url)}` }) };
    const clusters = [{ ...story("hn:1", "2026-10-03T00:00:00Z"), title: long }, story("hn:2", "2026-10-03T00:00:00Z")];
    const v = buildDeskView({ clusters, members, gnews: [], xPosts: [], papers: [] });
    expect(Object.keys(v.memberRows)).toEqual(["hn:1"]);
    const r = v.memberRows["hn:1"]!;
    expect(r.t!.length).toBe(C.title);
    expect(r.t!.endsWith("…")).toBe(true);
    expect(r.p!.length).toBe(C.publisher);
    expect(inflateClusters(v.memberRows, v.orphanClusters)[0]!.title).toBe(r.t!);
  });

  test("X posts past the cap: newest kept; papers past the cap: lowest arXiv id (oldest) dropped, feed order kept", () => {
    const caps = { ...DESK_VIEW_CAPS, xPosts: 2, papers: 2 };
    const x = [1, 2, 3].map((n) => ({ id: `${n}`, take: `take ${n}`, href: `https://x.com/a/status/${n}`, at: `2026-10-0${n}T00:00:00Z` }));
    const members = Object.fromEntries(x.map((p) => [`x:${p.id}`, { badge: "X", publisher: "@a", summary: `${p.take} — text`, url: p.href }]));
    const papers = ["2610.00002", "2609.00009", "2610.00001"].map((id) => ({ id, title: id, up: 1, href: `https://arxiv.org/abs/${id}` }));
    const v = buildDeskView({ clusters: [], members, gnews: [], xPosts: x, papers }, { caps });
    expect(xPosts(v.xPosts, v.memberRows).map((p) => p.id)).toEqual(["2", "3"]);
    expect(v.papers.map((p) => p.id)).toEqual(["2610.00002", "2610.00001"]);
    expect(v.trimmed).toEqual({ stories: 0, items: 0, xPosts: 1, papers: 1 });
    assertNoDangling(v);
  });

  test("deterministic: the same input renders a byte-identical module (real crawl + synthetic worst case)", () => {
    const { input, extras } = rawDeskViewInputs();
    expect(fitDeskView(input, extras).body).toBe(fitDeskView(input, extras).body);
    const s = synth(3);
    expect(fitDeskView(s.input, synthExtras(extras, s.wire)).body).toBe(fitDeskView(synth(3).input, synthExtras(extras, synth(3).wire)).body);
  });

  test("today's view: no dangling ids, every pinned story kept, gzip within budget", () => {
    const view: DeskView = { memberRows: V.MEMBER_ROWS, orphanClusters: V.ORPHAN_CLUSTERS, xPosts: V.X_POSTS, papers: V.PAPERS, trimmed: V.DESK_VIEW_TRIMMED };
    const { extras } = rawDeskViewInputs();
    assertNoDangling(view, deskViewPins(extras).filter((id) => rawDeskViewInputs().input.clusters.some((c) => c.id === id)));
    expect(gzBytes(readFileSync(join(DESK, "src/data/desk-view.ts"), "utf8"))).toBeLessThanOrEqual(DESK_VIEW_CAPS.gzBytes);
  });

  test("synthetic WORST case (every lane at cap, every field at max) is cut to the budget the build proved", () => {
    expect(DESK_VIEW_CAPS.gzBytes).toBeLessThanOrEqual(WORST_CASE_PROVEN_GZ);
    expect(WORST_CASE_FIRST_LOAD_KB).toBeLessThanOrEqual(182);
    const { extras } = rawDeskViewInputs();
    for (const seed of [1, 7, 28]) {
      const s = synth(seed);
      const items = Object.keys(s.input.members).filter((id) => !id.startsWith("x:"));
      for (const [src, cap] of Object.entries(DESK_VIEW_CAPS.items)) expect(items.filter((id) => id.startsWith(`${src}:`)).length).toBe(cap);
      const fit = fitDeskView(s.input, synthExtras(extras, s.wire));
      expect(gzBytes(fit.body)).toBe(fit.gz);
      expect(fit.gz).toBeLessThanOrEqual(DESK_VIEW_CAPS.gzBytes);
      expect(fit.view.trimmed.stories).toBeGreaterThan(0); // the budget, not the crawl, set the size
      assertNoDangling(fit.view, s.wire.map((w) => w.id));
      // The smallest drop that fits: one story fewer would not.
      expect(gzBytes(renderDeskViewModule(buildDeskView({ ...s.input, pins: deskViewPins(synthExtras(extras, s.wire)) }, { drop: fit.drop - 1 }), synthExtras(extras, s.wire)))).toBeGreaterThan(DESK_VIEW_CAPS.gzBytes);
    }
  });

  test("the client never imports the generator side (zlib / raw modules)", () => {
    const desk = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
    for (const m of ["desk-view-module", "desk-view-inputs", "lead-log-module"]) expect(desk).not.toContain(`@/lib/${m}`);
    const page = readFileSync(join(DESK, "src/app/page.tsx"), "utf8");
    expect(page).not.toMatch(/import [^\n]*lead-history\.json/);
    expect(page).toContain("@/data/lead-log-view");
  });
});

describe("lead-log view — capped holotape (LEAD_LOG_CAPS), lead-history.json untouched", () => {
  const history = JSON.parse(readFileSync(join(DESK, "artifacts/sage/lead-history.json"), "utf8"));

  test("generated lead-log-view.ts is exactly slimLeadLog(buildLeadLog(lead-history.json))", () => {
    expect(readFileSync(join(DESK, "src/data/lead-log-view.ts"), "utf8")).toBe(renderLeadLogModule(history));
    expect(LEAD_LOG).toEqual(JSON.parse(JSON.stringify(slimLeadLog(buildLeadLog(history)))));
  });

  test("past the caps: newest days, newest passes, first ✗ lines; text cut with …; only rendered fields kept", () => {
    const big = synthLeadLog();
    const more = { ...big, days: [...big.days, ...big.days.map((d) => ({ ...d, date: d.date.replace("2026-09", "2026-08") }))] };
    more.days[0]!.passes = [...more.days[0]!.passes, ...more.days[0]!.passes];
    more.days[0]!.passes[0]!.out[0]!.headline = "h".repeat(LEAD_LOG_CAPS.headline + 40);
    const s = slimLeadLog(more);
    expect(s.days.length).toBe(LEAD_LOG_CAPS.days);
    expect(s.days[0]!.date).toBe(more.days[0]!.date);
    expect(s.days[0]!.passes.length).toBe(LEAD_LOG_CAPS.passes);
    for (const d of s.days) for (const p of d.passes) {
      expect(p.out.length).toBeLessThanOrEqual(LEAD_LOG_CAPS.outs);
      for (const o of p.out) {
        expect(Object.keys(o).every((k) => ["code", "headline", "detail"].includes(k))).toBe(true);
        expect(o.headline.length).toBeLessThanOrEqual(LEAD_LOG_CAPS.headline);
      }
    }
    // AGE never shows its detail on the tape, so it is not shipped.
    const age = slimLeadLog({ lastAt: null, days: [{ ...big.days[0]!, passes: [{ at: "2026-09-30T03:17:00Z", held: true, out: [{ code: "AGE", headline: "h", detail: "x" }] }] }] });
    expect(age.days[0]!.passes[0]!.out[0]).toEqual({ code: "AGE", headline: "h" });
  });

  test("worst-case log (every cap full, every field max) has a fixed size", () => {
    const body = renderLeadLogModule({ schema: 0 }); // shape check: empty history renders
    expect(body).toContain("days: []");
    const worst = JSON.stringify(slimLeadLog(synthLeadLog()));
    // 10 days × 6 passes × 8 ✗ lines at max length — ships in index.html (server props), not in First Load JS.
    expect(worst.length).toBeLessThanOrEqual(WORST_LOG_RAW);
    expect(gzBytes(worst)).toBeLessThanOrEqual(WORST_LOG_GZ);
  });
});
