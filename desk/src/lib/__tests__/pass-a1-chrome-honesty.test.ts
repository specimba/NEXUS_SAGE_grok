/**
 * Pass A1 — chrome honesty when Digest unlock is live.
 * Topbar pack = digest-last; mute Sep CYCLE.window / fancyTWEETS PACK_SOURCE;
 * Moved pin follows unlock lead (not hf-swarm); Digest/Voice HELD kicker follows Brief's lead view.
 * Data-driven (crawls rewrite LEAD_TODAY / DIGEST_UNLOCK) — no hard-coded lead titles.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CYCLE } from "@/data/cycle";
import { DIGEST_CADENCE } from "@/data/digest-cadence";
import { DIGEST_UNLOCK } from "@/data/digest-unlock";
import { LEAD_TODAY, LEAD_HELD, LEAD_FIRST_AT } from "@/data/lead-pick";
import { PACK_AT, PACK_SOURCE } from "@/data/digest-pack";
import {
  HELD_KICKER,
  STALE_HELD_KICKER,
  pickedLeadEligible,
  resolveUnlock,
  titleEligible,
  withLeadView,
} from "@/lib/digest-unlock";
import { LEAD_HELD_TEXT, leadView } from "@/lib/lead-view";
import { FX_LAST_GOOD_SNAP, FX_STATES, FX_TODAY_LEAD, FX_TODAY_SNAP } from "./fixtures/unlock-states";

const deskSrc = readFileSync(resolve(import.meta.dir, "../../../src/components/sage/desk.tsx"), "utf8");
const liveView = () => resolveUnlock({ held: LEAD_HELD, today: LEAD_TODAY, lastGood: DIGEST_UNLOCK });

describe("Pass A1 chrome honesty", () => {
  test("unlock follows Brief LEAD_TODAY when not HELD, keeps last good when HELD; cycle stays 003", () => {
    expect(CYCLE.id).toBe("003");
    expect(DIGEST_UNLOCK.cycleId).toBe("003");
    const live = resolveUnlock(FX_STATES.live);
    expect(live.stamp).toBe("live");
    expect(live.kicker).toBeNull();
    expect(live.leadId).toBe(FX_TODAY_LEAD.cluster_id);
    expect(live.lead.title).toBe(FX_TODAY_LEAD.headline);
    const held = resolveUnlock(FX_STATES.held);
    expect(held.stamp).toBe("held");
    expect(held.kicker).toBe(HELD_KICKER);
    expect(held.lead.title).toBe(FX_LAST_GOOD_SNAP.lead.title);
    // Live data, whichever state the crawl left it in.
    const view = liveView();
    expect(view.stamp).toBe(LEAD_HELD ? "held" : "live");
    if (!LEAD_HELD) expect(DIGEST_UNLOCK.leadId).toBe(LEAD_TODAY?.cluster_id ?? null);
    expect(view.lead.title).not.toMatch(/HF production swarm/i);
  });

  test("picked lead from lab RSS is the Digest title (lead-pick already gated ≥2 SRC); rows still gated", () => {
    expect(pickedLeadEligible({ id: "cl:rss:google-ai:abc", sources: 2 })).toBe(true);
    expect(pickedLeadEligible({ id: "cl:hn:1", sources: 3 })).toBe(true);
    expect(pickedLeadEligible({ id: "cl:gmail:abc", sources: 2 })).toBe(false);
    expect(pickedLeadEligible({ id: "cl:taste:abc", sources: 2 })).toBe(false);
    expect(pickedLeadEligible({ id: "", sources: 2 })).toBe(false);
    // Wire / Pulse rows: lone RSS never a title (Pass A rule unchanged).
    expect(titleEligible({ id: "cl:rss:lab:1", sources: 1 })).toBe(false);
  });

  test("topbar pack display uses DIGEST_CADENCE (digest-last), not Sep PACK_AT", () => {
    expect(deskSrc).toContain("const packStamp = DIGEST_CADENCE.last_at");
    expect(deskSrc).toContain("{DIGEST_CADENCE.pack_id}");
    expect(deskSrc).not.toMatch(/pack \{istDateTime\(PACK_AT\)\}/);
    expect(deskSrc).not.toMatch(/import \{[^}]*PACK_AT[^}]*\} from "@\/data\/digest-pack"/);
    expect(DIGEST_CADENCE.pack_id.startsWith(DIGEST_CADENCE.last_at.slice(0, 10))).toBe(true);
    expect(DIGEST_CADENCE.last_at > PACK_AT).toBe(true); // archive provenance may remain in data
  });

  test("CYCLE.window + cyc compile stamp muted when unlock live; archive path keeps them", () => {
    expect(deskSrc).toContain("cycleWindowLabel");
    expect(deskSrc).toContain("`unlock · pick ${unlockChrome.pickDate ?? \"—\"}`");
    expect(deskSrc).toMatch(/data-cycle-window=\{unlockLive \? "unlock" : "archive"\}/);
    expect(deskSrc).toContain("const cycChipAt = unlockLive && unlockChrome.frozenAt ? unlockChrome.frozenAt : CYCLE.compiledAt");
    // Soft-fail: archive mode may still render CYCLE.window
    expect(deskSrc).toContain(": CYCLE.window");
    // Fixture snapshots (both states) carry a pick date + freeze newer than the Sep compile.
    expect(FX_TODAY_SNAP.pickDate).toBe(FX_TODAY_LEAD.date);
    for (const st of [FX_STATES.live, FX_STATES.held]) {
      const v = resolveUnlock(st);
      expect(v.pickDate).toBe(st.held ? FX_LAST_GOOD_SNAP.pickDate : FX_TODAY_LEAD.date);
      expect(v.frozenAt! > CYCLE.compiledAt).toBe(true);
    }
    if (!LEAD_HELD) expect(DIGEST_UNLOCK.pickDate).toBe(LEAD_TODAY!.date);
    expect(DIGEST_UNLOCK.frozenAt! > CYCLE.compiledAt).toBe(true);
  });

  test("PACK_SOURCE fancyTWEETS not live provenance when unlock active", () => {
    expect(deskSrc).not.toMatch(/\{PACK_SOURCE\}/);
    expect(deskSrc).toContain('data-pack-source={unlock.stamp === "archive" ? "archive" : "unlock"}');
    expect(deskSrc).toContain("unlock · ${unlock.leadId");
    expect(PACK_SOURCE).toMatch(/fancyTWEETS/); // kept as archive data only
  });

  test("Moved pin follows DIGEST_UNLOCK lead when unlock live; hf-swarm demoted; Brief context pin reads archive", () => {
    expect(deskSrc).toContain("Pass A1: when unlock live, Moved pin follows DIGEST_UNLOCK lead");
    expect(deskSrc).toContain("const movedLeadId = movedUnlock ? unlock.leadId : RANK_CURRENT.lead_id");
    expect(deskSrc).toContain('ARCHIVE_LEAD_IDS = new Set(["hf-swarm", "hf-incident"])');
    expect(deskSrc).toContain("data-moved-lead={movedLeadId}");
    expect(deskSrc).toContain("(movedUnlock ? RANK_MOVED.filter((m) => !ARCHIVE_LEAD_IDS.has(m.id)) : RANK_MOVED)");
    expect(deskSrc).toContain(`data-unlock-lead="1"`);
    expect(DIGEST_UNLOCK.leadId).not.toMatch(/^hf-/);
    expect(deskSrc).toContain('"archive · cycle 003 context"');
  });

  test("archive fold stays closed by default (Pass A chrome)", () => {
    expect(deskSrc).toContain("archive · 003 · {CYCLE.pins.length} pins · closed");
    expect(deskSrc).toContain('<details className="sage-panel sage-ticks digest-archive-fold"');
    expect(deskSrc).not.toMatch(/<details[^>]*open[^>]*digest-archive-fold|digest-archive-fold[^>]*open/);
  });

  test("Digest/Voice HELD kicker follows Brief's runtime lead view; titles unchanged", () => {
    const live = resolveUnlock(FX_STATES.live);
    expect(live.stamp).toBe("live");
    // Brief lead fresh → no kicker.
    const fresh = leadView({ held: false, today: { headline: "x" }, firstAt: new Date().toISOString() }, Date.now());
    expect(withLeadView(live, fresh)).toBe(live);
    // Brief 24h-age HELD → Digest/Voice HELD with Brief's wording, same title + rows.
    const firstAt = FX_TODAY_LEAD.first_at!;
    const later = Date.parse(firstAt) + 30 * 3_600_000;
    const stale = leadView({ held: false, today: FX_TODAY_LEAD, firstAt }, later);
    expect(stale.held).toBe(true);
    const held = withLeadView(live, stale);
    expect(held.stamp).toBe("held");
    expect(held.kicker).toBe(STALE_HELD_KICKER);
    expect(held.lead.title).toBe(live.lead.title);
    expect(held.rows).toEqual(live.rows);
    // Build-time HELD flag → Brief's no-qualifying-story text.
    const noPick = withLeadView(live, leadView({ held: true, today: null, firstAt: null }, null));
    expect(noPick.kicker).toBe(LEAD_HELD_TEXT);
    expect(noPick.lead.title).toBe(live.lead.title);
    // HELD fixture: already held → last good titles + HELD kicker, left alone by the lead view.
    const already = resolveUnlock(FX_STATES.held);
    expect(withLeadView(already, stale).kicker).toBe(HELD_KICKER);
    expect(withLeadView(already, stale).lead.title).toBe(FX_LAST_GOOD_SNAP.lead.title);
    // Live data: whatever the crawl left, Digest/Voice still resolve to a non-archive view while a last good exists.
    const liveData = withLeadView(liveView(), leadView({ held: LEAD_HELD, today: LEAD_TODAY, firstAt: LEAD_FIRST_AT }, null));
    expect(liveData.stamp).not.toBe("archive");
    // Desk wires Digest + Voice through the same leadViewAt as Brief.
    expect(deskSrc).toContain("const lv = leadViewAt(useNow());");
    expect(deskSrc.match(/const unlock = useLeadAwareUnlock\(\);/g)?.length).toBe(2);
    expect(STALE_HELD_KICKER).toBe("HELD · lead older than 24h");
    expect(deskSrc).toContain("HELD · lead older than 24h ("); // Brief plate wording matches
  });
});
