/**
 * Pass A — Digest/Voice unlock vs CYCLE.003
 */
import { describe, expect, test } from "bun:test";
import { CYCLE } from "@/data/cycle";
import { DIGEST_ITEMS } from "@/data/digest-pack";
import { DIGEST_UNLOCK } from "@/data/digest-unlock";
import { LEAD_TODAY, LEAD_HELD } from "@/data/lead-pick";
import {
  ARCHIVE_KICKER,
  HELD_KICKER,
  archiveLeadFromCycle,
  buildLiveSnapshot,
  resolveUnlock,
  titleEligible,
  unlockToDigestItems,
  wireToUnlockRows,
} from "@/lib/digest-unlock";
import type { WireRow } from "@/lib/wire";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const deskSrc = resolve(import.meta.dir, "../../../src/components/sage/desk.tsx");

describe("Pass A digest unlock", () => {
  test("cycle label stays 003; no 004", () => {
    expect(CYCLE.id).toBe("003");
    expect(DIGEST_UNLOCK.cycleId).toBe("003");
    expect(JSON.stringify(DIGEST_UNLOCK)).not.toContain('"004"');
  });

  test("live unlock lead equals LEAD_TODAY title (not Sep 3 HF swarm)", () => {
    expect(LEAD_HELD).toBe(false);
    expect(LEAD_TODAY?.headline).toBeTruthy();
    const view = resolveUnlock({
      held: LEAD_HELD,
      today: LEAD_TODAY,
      lastGood: DIGEST_UNLOCK,
    });
    expect(view.stamp).toBe("live");
    expect(view.kicker).toBeNull();
    expect(view.lead.title).toBe(LEAD_TODAY!.headline);
    expect(view.lead.title).not.toMatch(/HF production swarm|Eval agents reached Hugging Face/i);
    expect(DIGEST_UNLOCK.lead.title).toBe(LEAD_TODAY!.headline);
  });

  test("Voice rows mirror Digest top rows (same snapshot)", () => {
    const view = resolveUnlock({
      held: false,
      today: LEAD_TODAY,
      lastGood: DIGEST_UNLOCK,
    });
    expect(view.rows.length).toBeGreaterThan(0);
    expect(view.rows.every((r) => r.kind !== "lead")).toBe(true);
    // Voice + Digest share DIGEST_UNLOCK
    expect(view.rows.map((r) => r.title)).toEqual(DIGEST_UNLOCK.rows.map((r) => r.title));
  });

  test("HELD keeps last good + HELD kicker", () => {
    const view = resolveUnlock({
      held: true,
      today: { ...LEAD_TODAY!, reason: "held", headline: LEAD_TODAY!.headline },
      lastGood: DIGEST_UNLOCK,
    });
    expect(view.stamp).toBe("held");
    expect(view.kicker).toBe(HELD_KICKER);
    expect(view.lead.title).toBe(DIGEST_UNLOCK.lead.title);
  });

  test("empty history → archive · 003 fallback (never invent)", () => {
    const view = resolveUnlock({ held: true, today: null, lastGood: null });
    expect(view.stamp).toBe("archive");
    expect(view.kicker).toBe(ARCHIVE_KICKER);
    const arch = archiveLeadFromCycle();
    expect(view.lead.title).toBe(arch.title);
    expect(view.lead.archive).toBe(true);
  });

  test("GML / taste / RSS-only never become titles", () => {
    expect(
      titleEligible({
        id: "gmail:abc",
        briefEligible: false,
        pulse_only: true,
        lead_source: "gmail-news",
        sources: 1,
        member_ids: ["gmail:abc"],
      }),
    ).toBe(false);
    expect(
      titleEligible({
        id: "cl:taste:x",
        pulse_only: true,
        briefEligible: false,
        member_ids: ["taste:x"],
      }),
    ).toBe(false);
    expect(
      titleEligible({
        id: "cl:rss:lab:1",
        lead_source: "rss-lab",
        sources: 2,
        member_ids: ["rss:lab:1", "gnews:2"],
      }),
    ).toBe(false);
    expect(
      titleEligible({
        id: "cl:hn:1",
        sources: 3,
        member_ids: ["hn:1", "gnews:2"],
      }),
    ).toBe(true);
  });

  test("mid-window freeze: same pickDate keeps titles; new pick swaps", () => {
    const lead = LEAD_TODAY!;
    const wireA: WireRow[] = [
      {
        id: "cl:hn:aaa",
        title: "Alpha story",
        url: "https://example.com/a",
        at: lead.at,
        sources: 3,
        score: 10,
        member_ids: ["hn:aaa", "gnews:a"],
        is_new: false,
        rank: 1,
        prev_rank: null,
        status: "new",
      },
    ];
    const wireB: WireRow[] = [
      {
        id: "cl:hn:bbb",
        title: "Beta story mid-window",
        url: "https://example.com/b",
        at: lead.at,
        sources: 4,
        score: 20,
        member_ids: ["hn:bbb", "gnews:b"],
        is_new: true,
        rank: 1,
        prev_rank: null,
        status: "new",
      },
    ];
    const snapA = buildLiveSnapshot({ lead, wire: wireA, frozenAt: lead.at });
    // Mid-window: resolve still uses lastGood (snapA), not a rebuilt wireB
    // Production UI passes only lastGood — mid-window rebuild must not swap titles.
    const uiMid = resolveUnlock({ held: false, today: lead, lastGood: snapA });
    void wireB; // used below for next-pick swap
    expect(uiMid.rows[0]?.title).toBe("Alpha story");
    expect(uiMid.rows[0]?.title).not.toBe("Beta story mid-window");

    const nextLead = {
      ...lead,
      date: "2026-10-07",
      at: "2026-10-07T03:11:00.000Z",
      cluster_id: "cl:hn:bbb",
      headline: "Beta story mid-window",
    };
    const nextSnap = buildLiveSnapshot({ lead: nextLead, wire: wireB, frozenAt: nextLead.at });
    const next = resolveUnlock({ held: false, today: nextLead, lastGood: nextSnap });
    expect(next.lead.title).toBe("Beta story mid-window");
    expect(next.pickDate).toBe("2026-10-07");
  });

  test("pack overlay carries unlocked titles; archive baseline retained as drops", () => {
    const view = resolveUnlock({
      held: LEAD_HELD,
      today: LEAD_TODAY,
      lastGood: DIGEST_UNLOCK,
    });
    const items = unlockToDigestItems(view, DIGEST_ITEMS);
    expect(items[0]!.kind).toBe("lead");
    expect(items[0]!.title).toBe(view.lead.title);
    expect(items.some((i) => i.kind === "drop" && /archive · 003/.test(i.title))).toBe(true);
    expect(items.some((i) => /Eval agents reached Hugging Face/i.test(i.title) && i.kind === "lead")).toBe(
      false,
    );
  });

  test("desk chrome: Brief Take title classes + kicker + closed archive fold", () => {
    const src = readFileSync(deskSrc, "utf8");
    expect(src).toContain("UnlockLeadTitle");
    expect(src).toContain("UnlockKicker");
    expect(src).toContain("CycleArchiveFold");
    expect(src).toContain('data-archive-fold="003"');
    expect(src).toMatch(/sage-take-title font-display text-2xl font-bold/);
    expect(src).toContain("useDigestUnlock");
    // Digest no longer opens on frozen DIGEST_ITEMS[0] as the live lead source of truth
    expect(src).toContain("DIGEST_UNLOCK");
  });

  test("wireToUnlockRows drops RSS/GNews-only", () => {
    const rows = wireToUnlockRows(
      [
        {
          id: "cl:rss:only",
          title: "RSS only",
          url: "https://lab.example/x",
          at: "2026-10-06T00:00:00Z",
          sources: 2,
          score: null,
          member_ids: ["rss:only", "gnews:1"],
          is_new: false,
          rank: 1,
          prev_rank: null,
          status: "new",
        },
        {
          id: "cl:hn:ok",
          title: "HN ok",
          url: "https://example.com",
          at: "2026-10-06T00:00:00Z",
          sources: 2,
          score: 1,
          member_ids: ["hn:ok", "gnews:2"],
          is_new: false,
          rank: 2,
          prev_rank: null,
          status: "same",
        },
      ],
      { max: 5 },
    );
    expect(rows.map((r) => r.id)).toEqual(["cl:hn:ok"]);
  });
});
