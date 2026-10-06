/**
 * Pass C — real dates on Papers / Pulse / Wire.
 */
import { describe, expect, test } from "bun:test";
import {
  arxivIdMonthIso,
  buildPaperRows,
  paperDateMmDd,
  paperPublishedIso,
  type PaperInput,
} from "@/lib/pulse-v5";
import { istMMDD } from "@/lib/ist-time";

describe("Pass C paper DATE", () => {
  test("HF/arXiv published wins over Crossref issued and arXiv id month", () => {
    const p: PaperInput = {
      id: "2610.03120",
      title: "t",
      up: 1,
      href: "https://arxiv.org/abs/2610.03120",
      published: "2026-10-02T10:40:49Z",
      crossrefIssued: "2025-10-19",
    };
    expect(paperPublishedIso(p)).toBe("2026-10-02T10:40:49Z");
    expect(paperDateMmDd(p)).toBe("10-02");
    expect(buildPaperRows([p])[0]!.date).toBe("10-02");
  });

  test("OpenAlex publication_date before Crossref; Crossref before arXiv id fallback", () => {
    expect(
      paperDateMmDd({
        id: "2610.03120",
        title: "t",
        up: 1,
        href: "h",
        openalexPublicationDate: "2026-10-04",
        crossrefIssued: "2025-10-19",
      }),
    ).toBe("10-04");
    expect(
      paperDateMmDd({
        id: "2610.03120",
        title: "t",
        up: 1,
        href: "h",
        crossrefIssued: "2025-10-19",
      }),
    ).toBe("10-19");
  });

  test("arXiv id YYMM → first-of-month MM-DD; never invents today", () => {
    expect(arxivIdMonthIso("2610.03120")).toBe("2026-10-01T00:00:00Z");
    expect(paperDateMmDd({ id: "2610.03120", title: "t", up: 1, href: "h" })).toBe("10-01");
    const today = istMMDD(new Date().toISOString());
    // Soft-fail: garbage id with no dates → null / —
    expect(paperPublishedIso({ id: "not-an-id", title: "t", up: 1, href: "h" })).toBeNull();
    expect(paperDateMmDd({ id: "not-an-id", title: "t", up: 1, href: "h" })).toBeNull();
    expect(buildPaperRows([{ id: "not-an-id", title: "t", up: 1, href: "h" }])[0]!.date).toBeNull();
    // Must not equal "today" invented from wall clock for the null case
    expect(buildPaperRows([{ id: "not-an-id", title: "t", up: 1, href: "h" }])[0]!.date).not.toBe(today);
  });

  test("date-only midnight stays honest (show the day)", () => {
    expect(paperDateMmDd({ id: "x", title: "t", up: 1, href: "h", published: "2026-09-15" })).toBe("09-15");
  });
});

describe("Pass C istMMDD", () => {
  test("formats Istanbul MM-DD; unparseable → —", () => {
    expect(istMMDD("2026-10-06T20:03:17Z")).toBe("10-06");
    expect(istMMDD("not-a-date")).toBe("—");
  });
});
