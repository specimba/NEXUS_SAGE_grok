/** PASS-L — fresher lead: 36h window in two tiers, frozen from pick time (HELD only >48h), 16:11 recovery, no churn. */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyPick, currentLead, decidePick, entryFor, inRetryWindow, leadAgeBand, leadCandidates, type LeadHistory } from "@/lib/lead-pick";
import { leadView } from "@/lib/lead-view";
import { buildLiveSnapshot, resolveUnlock } from "@/lib/digest-unlock";
import { buildLeadLog } from "@/lib/lead-log";
import { PL_HISTORY, PL_PREV, PL_SLOT, plCluster } from "./fixtures/lead-pass-l";

const DESK = join(import.meta.dir, "../../..");
const pick = (h: LeadHistory, clusters: ReturnType<typeof plCluster>[], slot: string) =>
  decidePick(h, clusters, { crawlAt: slot, at: slot, crawlStartedAt: slot });

describe("PASS-L pass marks", () => {
  test("#1 best story 30h old, nothing under 24h → picked (tier 24–36h), not HELD", () => {
    const d = pick(PL_HISTORY, [plCluster(3, "a30", 30)], PL_SLOT.s0611);
    expect(d.action).toBe("picked");
    if (d.action !== "picked") return;
    expect(d.entry).toMatchObject({ cluster_id: "cl:hn:a30", age_band: "24–36h", pick_slot: "06:11" });
    const lv = leadView({ held: false, today: d.entry, firstAt: d.entry.first_at! }, Date.parse(PL_SLOT.s0611));
    expect(lv.held).toBe(false);
    // 37h is outside the window: still HELD (window edge).
    expect(pick(PL_HISTORY, [plCluster(3, "a37", 37)], PL_SLOT.s0611).action).toBe("held");
  });

  test("#2 20h with fewer SRC beats 30h with more SRC (tier first)", () => {
    const now = Date.parse(PL_SLOT.s0611);
    const ids = leadCandidates([plCluster(4, "b30", 30), plCluster(2, "b20", 20)], now).map((c) => c.id);
    expect(ids).toEqual(["cl:hn:b20", "cl:hn:b30"]);
    const d = pick(PL_HISTORY, [plCluster(4, "b30", 30), plCluster(2, "b20", 20)], PL_SLOT.s0611);
    if (d.action === "picked") expect(d.entry).toMatchObject({ cluster_id: "cl:hn:b20", age_band: "<24h" });
    else throw new Error("expected pick");
  });

  test("#3 picked 06:11 at 20h is still the lead at 21:11 and next morning; HELD only past 48h", () => {
    const d = pick(PL_HISTORY, [plCluster(3, "c20", 20)], PL_SLOT.s0611);
    if (d.action !== "picked") throw new Error("expected pick");
    const first = Date.parse(d.entry.first_at!);
    const view = (t: number) => leadView({ held: false, today: d.entry, firstAt: d.entry.first_at! }, t);
    expect(view(Date.parse(PL_SLOT.s2111)).held).toBe(false); // 35h old
    expect(view(first + 24 * 3_600_000).held).toBe(false);
    expect(view(first + 48 * 3_600_000).held).toBe(false);
    expect(view(first + 48 * 3_600_000 + 1).held).toBe(true);
    expect(view(first + 50 * 3_600_000)).toMatchObject({ held: true, reason: "stale" });
    // later same-day crawls never re-pick
    const h = applyPick(PL_HISTORY, d);
    for (const s of [PL_SLOT.s1111, PL_SLOT.s1611, PL_SLOT.s2111]) expect(pick(h, [plCluster(4, "c-new", 2, s)], s)).toEqual({ action: "none", why: "already-picked" });
  });

  test("#4 HELD at 06:11 and 11:11, qualifying story at 16:11 → picked at 16:11; Digest/Voice titles follow; no re-pick after", () => {
    let h = PL_HISTORY;
    const none = [plCluster(1, "lonely", 3)]; // 1 SRC: never qualifies
    h = applyPick(h, pick(h, none, PL_SLOT.s0611));
    h = applyPick(h, pick(h, none, PL_SLOT.s1111));
    const held = entryFor(h, "2026-10-12")!;
    expect(held.reason).toBe("held");
    expect(held.attempts?.length).toBe(2);
    expect(held.headline).toBe(PL_PREV.headline);
    const d = pick(h, [plCluster(3, "d16", 5, PL_SLOT.s1611)], PL_SLOT.s1611);
    expect(d.action).toBe("picked");
    h = applyPick(h, d);
    const lead = currentLead(h)!;
    expect(lead).toMatchObject({ cluster_id: "cl:hn:d16", reason: "picked", pick_slot: "16:11", catch_up: true });
    const snap = buildLiveSnapshot({ lead, wire: [], frozenAt: lead.at });
    expect(resolveUnlock({ held: false, today: lead, lastGood: snap }).lead.title).toBe(lead.headline);
    // Picked date locks: 21:11 (and any later retry) never re-picks.
    expect(pick(h, [plCluster(4, "d21", 1, PL_SLOT.s2111)], PL_SLOT.s2111)).toEqual({ action: "none", why: "already-picked" });
  });

  test("#5 a 21:11 crawl on a HELD date does not pick", () => {
    let h = PL_HISTORY;
    const none = [plCluster(1, "lonely", 3)];
    for (const s of [PL_SLOT.s0611, PL_SLOT.s1111, PL_SLOT.s1611]) h = applyPick(h, pick(h, none, s));
    expect(entryFor(h, "2026-10-12")?.reason).toBe("held");
    expect(pick(h, [plCluster(4, "e21", 1, PL_SLOT.s2111)], PL_SLOT.s2111)).toEqual({ action: "none", why: "retry-closed" });
    expect(inRetryWindow(PL_SLOT.s1611)).toBe(true);
    expect(inRetryWindow("2026-10-12T17:59:59Z")).toBe(true); // 20:59
    expect(inRetryWindow(PL_SLOT.s2111)).toBe(false);
    expect(inRetryWindow("2026-10-12T02:59:00Z")).toBe(false); // 05:59
  });

  test("#6 kicker shows the age band; lead log records tier + pick slot", () => {
    expect(leadAgeBand(23.9)).toBe("<24h");
    expect(leadAgeBand(24)).toBe("24–36h");
    expect(leadAgeBand(null)).toBeNull();
    const src = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
    expect(src).toContain('<span data-lead-band="1">{leadBand(lead)}</span>');
    expect(src).not.toContain("sticky 24h");
    const d = pick(PL_HISTORY, [plCluster(3, "f30", 30)], PL_SLOT.s0611);
    const h = applyPick(PL_HISTORY, d);
    const log = buildLeadLog(h);
    expect(JSON.stringify(log)).toContain("slot 06:11");
    expect(JSON.stringify(log)).toContain("tier 24–36h");
  });
});
