/**
 * Pass E — session taste only: mirror-on-WROTE, soft skip/stale, never Brief, likes ignored for Pulse UP.
 */
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { X_TASTE } from "@/data/x-taste";
import { buildRows, sigCell, type PulseMemberInfo } from "@/lib/pulse-v5";
import {
  TASTE_STALE_MS,
  TASTE_VISIBLE_CAP,
  diskToSnap,
  emitXTasteOnWrote,
  readXTasteLast,
  readXTasteModule,
  syncXTasteFromDisk,
  tasteIsStale,
  tasteSoftMeter,
  writeXTasteTs,
  xTasteCoherenceFails,
  type XTasteDisk,
} from "@/lib/x-taste-disk";

const NOW = Date.parse("2026-10-07T00:15:00.000Z");
const FRESH = "2026-10-06T12:00:00.000Z";
const STALE = "2026-09-11T09:32:00.000Z";

function skipDisk(at = FRESH): XTasteDisk {
  return {
    schema: 1,
    captured_at: at,
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
    items: [],
    skipped: true,
    soft_fail: true,
    soft_fail_reason: "login_wall",
    land: "SOFT",
    counts: { seen: 0, kept: 0 },
    session_alive: false,
  };
}

function okDisk(at = FRESH): XTasteDisk {
  return {
    schema: 1,
    captured_at: at,
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
    items: [
      {
        url: "https://x.com/dair_ai/status/2097935359384719537",
        author: "@dair_ai",
        text: "Meta agent paper",
        surface: "bookmark",
      },
      {
        url: "https://x.com/deepseek_ai/status/2097930608790167907",
        author: "@deepseek_ai",
        text: "DeepSeek flash",
        surface: "like",
      },
    ],
    skipped: false,
    soft_fail: false,
    soft_fail_reason: null,
    land: "GO",
    counts: { seen: 10, kept: 2 },
    session_alive: true,
  };
}

describe("Pass E session taste", () => {
  let deskRoot: string;

  beforeEach(() => {
    deskRoot = mkdtempSync(join(tmpdir(), "sage-pass-e-"));
    mkdirSync(join(deskRoot, "artifacts/sage"), { recursive: true });
    mkdirSync(join(deskRoot, "src/data"), { recursive: true });
  });

  afterEach(() => {
    rmSync(deskRoot, { recursive: true, force: true });
  });

  test("fixture skip / login_wall → empty items, soft meter, no invent", () => {
    const { snap } = emitXTasteOnWrote(deskRoot, skipDisk());
    expect(snap.skipped).toBe(true);
    expect(snap.items).toEqual([]);
    expect(snap.briefEligible).toBe(false);
    expect(snap.pulseLeadEligible).toBe(false);
    expect(snap.paidApi).toBe(false);
    const meter = tasteSoftMeter(snap, NOW);
    expect(meter).toEqual({ id: "x_session", label: "X-session", state: "soft", detail: "login_wall" });
    const disk = readXTasteLast(deskRoot)!;
    expect(disk.items).toEqual([]);
    expect(disk.skipped).toBe(true);
  });

  test("likes present on taste item ignored for Pulse UP", () => {
    // Taste "like" surface is shelf-only; cluster UP still HN-only (Pass D lock).
    const members: Record<string, PulseMemberInfo> = {
      "gnews:lead": { badge: "GNW", publisher: "Reuters" },
      "hn:1": { badge: "HN", publisher: "hn/a", score: 42 },
      "x:taste-like": { badge: "X", publisher: "@deepseek_ai", score: 9999 },
    };
    const { rows } = buildRows(
      [
        {
          id: "cl:mix",
          title: "mix",
          url: "https://example.com",
          lead_id: "gnews:lead",
          lead_source: "gnews-rss",
          sources: ["gnews-rss", "hn-algolia", "x"],
          member_ids: ["gnews:lead", "hn:1", "x:taste-like"],
          size: 3,
          at: FRESH,
          first_seen: null,
          is_new: false,
        },
      ],
      members,
    );
    expect(rows[0]!.score).toBe(42);
    expect(sigCell(rows[0]!)).toEqual({ text: "42", dim: false });
    // Committed taste may include like surfaces — still never feed Brief/UP.
    expect(X_TASTE.items.some((i) => i.surface === "like")).toBe(true);
    expect(X_TASTE.briefEligible).toBe(false);
    expect(X_TASTE.pulseLeadEligible).toBe(false);
  });

  test("mirror-on-WROTE: module equals disk ids/counts after emit", () => {
    const { snap } = emitXTasteOnWrote(deskRoot, okDisk());
    expect(snap.items.map((i) => i.id)).toEqual(["2097935359384719537", "2097930608790167907"]);
    const mod = readXTasteModule(deskRoot)!;
    expect(mod.captured_at).toBe(FRESH);
    expect(mod.ids).toEqual(snap.items.map((i) => i.id));
    expect(mod.kept).toBe(2);
    expect(mod.briefEligible).toBe(false);
    expect(mod.pulseLeadEligible).toBe(false);
    expect(mod.paidApi).toBe(false);
    expect(xTasteCoherenceFails(deskRoot)).toEqual([]);
  });

  test("sync-from-disk soft when missing — keep committed module, no invent", () => {
    writeXTasteTs(deskRoot, diskToSnap(okDisk(STALE)));
    const before = readXTasteModule(deskRoot)!;
    const r = syncXTasteFromDisk(deskRoot);
    expect(r.status).toBe("soft");
    expect(readXTasteModule(deskRoot)!.ids).toEqual(before.ids);
    expect(xTasteCoherenceFails(deskRoot)).toEqual([]);
  });

  test("stale >14d → soft taste stale without inventing items", () => {
    expect(tasteIsStale(STALE, NOW)).toBe(true);
    expect(NOW - Date.parse(STALE)).toBeGreaterThan(TASTE_STALE_MS);
    const { snap } = emitXTasteOnWrote(deskRoot, okDisk(STALE));
    expect(snap.items.length).toBe(2); // honest prior items kept
    const meter = tasteSoftMeter(snap, NOW);
    expect(meter).toEqual({ id: "x_session", label: "X-session", state: "soft", detail: "taste stale" });
    // Fresh capture clears soft stale
    expect(tasteSoftMeter(diskToSnap(okDisk(FRESH)), NOW).state).toBe("ok");
  });

  test("never Brief: type locks + diskToSnap force false even if disk lies", () => {
    const lying = {
      ...okDisk(),
      briefEligible: true as unknown as false,
      pulseLeadEligible: true as unknown as false,
      paidApi: true as unknown as false,
    };
    const snap = diskToSnap(lying);
    expect(snap.briefEligible).toBe(false);
    expect(snap.pulseLeadEligible).toBe(false);
    expect(snap.paidApi).toBe(false);
    emitXTasteOnWrote(deskRoot, lying);
    const src = readFileSync(join(deskRoot, "src/data/x-taste.ts"), "utf8");
    expect(src).toContain('"briefEligible": false');
    expect(src).toContain('"pulseLeadEligible": false');
    expect(src).toContain('"paidApi": false');
    expect(src).not.toMatch(/"briefEligible":\s*true/);
  });

  test("coherence fails closed on ids drift", () => {
    emitXTasteOnWrote(deskRoot, okDisk());
    writeFileSync(
      join(deskRoot, "src/data/x-taste.ts"),
      renderStaleModule(),
      "utf8",
    );
    const fails = xTasteCoherenceFails(deskRoot);
    expect(fails.length).toBeGreaterThan(0);
    expect(fails.some((f) => /ids|captured_at/.test(f))).toBe(true);
  });

  test("visible cap is within 5–8", () => {
    expect(TASTE_VISIBLE_CAP).toBeGreaterThanOrEqual(5);
    expect(TASTE_VISIBLE_CAP).toBeLessThanOrEqual(8);
  });

  test("committed X_TASTE eligibility locks", () => {
    expect(X_TASTE.briefEligible).toBe(false);
    expect(X_TASTE.pulseLeadEligible).toBe(false);
    expect(X_TASTE.paidApi).toBe(false);
    expect(existsSync).toBeTruthy();
  });
});

function renderStaleModule() {
  return `export const X_TASTE = {
  "captured_at": "2026-01-01T00:00:00Z",
  "briefEligible": false,
  "pulseLeadEligible": false,
  "paidApi": false,
  "items": [{ "id": "999", "text": "drift", "surface": "feed" }],
  "skipped": false,
  "soft_fail": false,
  "soft_fail_reason": null,
  "land": "GO",
  "counts": { "seen": 1, "kept": 1 },
} as const;
`;
}
