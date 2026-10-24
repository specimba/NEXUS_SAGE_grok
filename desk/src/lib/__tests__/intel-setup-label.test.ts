import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SAGE_SETUP } from "@/data/sage-setup";
import { GMAIL_NEWS, GMAIL_NEWS_AT } from "@/data/gmail-news";
import { X_TASTE } from "@/data/x-taste";
import { snapshotLabel, SNAPSHOT_STALE_H } from "@/lib/snapshot-label";

const DESK = join(import.meta.dir, "../../..");

describe("Intel plan 6 — setup bay: box-only rows show 'snapshot · N rows · age Xh'", () => {
  test("label + 24 h stale flag", () => {
    expect(SNAPSHOT_STALE_H).toBe(24);
    expect(snapshotLabel({ rows: 10, at: "2026-10-24T00:00:00Z" }, "2026-10-24T05:30:00Z")).toEqual({ text: "snapshot · 10 rows · age 5h", stale: false });
    expect(snapshotLabel({ rows: 10, at: "2026-10-23T05:00:00Z" }, "2026-10-24T05:30:00Z")).toEqual({ text: "snapshot · 10 rows · age 24h", stale: false });
    expect(snapshotLabel({ rows: 8, at: "2026-10-23T05:00:00Z" }, "2026-10-24T06:00:00Z").stale).toBe(true);
    expect(snapshotLabel({ rows: 0, at: null }, "2026-10-24T06:00:00Z")).toEqual({ text: "snapshot · 0 rows · age —", stale: true });
  });
  test("generated setup carries the committed Gmail / X snapshot counts and stamps", () => {
    const g = SAGE_SETUP.sources.find((s) => s.id === "gmail")!;
    const x = SAGE_SETUP.sources.find((s) => s.id === "x_taste")!;
    expect(g.snapshot).toEqual({ rows: GMAIL_NEWS.length, at: GMAIL_NEWS_AT });
    expect(x.snapshot).toEqual({ rows: X_TASTE.items.length, at: X_TASTE.captured_at });
    expect(SAGE_SETUP.sources.filter((s) => s.state !== "box-only").every((s) => s.snapshot === undefined)).toBe(true);
  });
  test("bay renders the snapshot label (flagged when stale); 'never on page' is gone", () => {
    const bay = readFileSync(join(DESK, "src/components/sage/setup-bay.tsx"), "utf8");
    expect(bay).not.toContain("never on page");
    expect(bay).toContain("snapshotLabel(row.snapshot, now)");
    expect(bay).toContain('data-snapshot-stale={l.stale ? "" : undefined}');
    expect(bay).toContain("now={s.stamped_at}");
    expect(readFileSync(join(DESK, "src/components/sage/setup-editor.tsx"), "utf8")).toContain("now={s.stamped_at}");
  });
});
