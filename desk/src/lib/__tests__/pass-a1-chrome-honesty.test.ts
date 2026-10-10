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

const deskSrc = readFileSync(resolve(import.meta.dir, "../../../src/components/sage/desk.tsx"), "utf8");
const liveView = () => resolveUnlock({ held: LEAD_HELD, today: LEAD_TODAY, lastGood: DIGEST_UNLOCK });

describe("Pass A1 chrome honesty", () => {
  test("unlock is live and follows Brief LEAD_TODAY; cycle stays 003", () => {
    expect(LEAD_HELD).toBe(false);
    expect(CYCLE.id).toBe("003");
    expect(DIGEST_UNLOCK.cycleId).toBe("003");
    expect(DIGEST_UNLOCK.leadId).toBe(LEAD_TODAY?.cluster_id ?? null);
    const view = liveView();
    expect(view.stamp).toBe("live");
    expect(view.lead.title).toBe(LEAD_TODAY!.headline);
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
    expect(DIGEST_UNLOCK.pickDate).toBe(LEAD_TODAY!.date);
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
    const live = liveView();
    // Brief lead fresh → no kicker.
    const fresh = leadView({ held: false, today: { headline: "x" }, firstAt: new Date().toISOString() }, Date.now());
    expect(withLeadView(live, fresh)).toBe(live);
    // Brief 24h-age HELD → Digest/Voice HELD with Brief's wording, same title + rows.
    const firstAt = LEAD_FIRST_AT ?? LEAD_TODAY!.at;
    const later = Date.parse(firstAt) + 30 * 3_600_000;
    const stale = leadView({ held: LEAD_HELD, today: LEAD_TODAY, firstAt }, later);
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
    // Already held / archive views are left alone.
    const already = resolveUnlock({ held: true, today: null, lastGood: DIGEST_UNLOCK });
    expect(withLeadView(already, stale).kicker).toBe(HELD_KICKER);
    // Desk wires Digest + Voice through the same leadViewAt as Brief.
    expect(deskSrc).toContain("const lv = leadViewAt(useNow());");
    expect(deskSrc.match(/const unlock = useLeadAwareUnlock\(\);/g)?.length).toBe(2);
    expect(STALE_HELD_KICKER).toBe("HELD · lead older than 24h");
    expect(deskSrc).toContain("HELD · lead older than 24h ("); // Brief plate wording matches
  });
});
