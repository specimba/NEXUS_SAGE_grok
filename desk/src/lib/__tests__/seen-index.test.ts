import { describe, expect, test } from "bun:test";
import { emptySeenIndex, firstSeen, isNew, markSeen, parseSeenIndex } from "@/lib/seen-index";
import { canonicalizeUrl } from "@/lib/dedupe";

const S1 = "2026-09-25T02:11:00Z";
const S2 = "2026-09-25T06:11:00Z";
const S3 = "2026-09-25T10:11:00Z";

describe("seen-index", () => {
  test("first run: everything new with first_seen = stamp", () => {
    const idx = markSeen(emptySeenIndex(), [{ key: "https://a.com/x" }, { key: "https://b.com/y" }], S1);
    expect(firstSeen(idx, "https://a.com/x")).toBe(S1);
    expect(isNew(idx, "https://a.com/x", S1)).toBe(true);
  });

  test("first_seen stable across runs; only unseen keys are new", () => {
    let idx = markSeen(null, [{ key: "https://a.com/x" }], S1);
    idx = markSeen(idx, [{ key: "https://a.com/x" }, { key: "https://c.com/z" }], S2);
    idx = markSeen(JSON.parse(JSON.stringify(idx)), [{ key: "https://a.com/x" }, { key: "https://c.com/z" }], S3);
    expect(firstSeen(idx, "https://a.com/x")).toBe(S1);
    expect(firstSeen(idx, "https://c.com/z")).toBe(S2);
    expect(idx.entries["https://a.com/x"].last_seen).toBe(S3);
    expect(isNew(idx, "https://a.com/x", S3)).toBe(false);
    expect(isNew(idx, "https://c.com/z", S3)).toBe(false);
  });

  test("keyed by canonical URL: tracking variants are not new", () => {
    let idx = markSeen(null, [{ key: canonicalizeUrl("https://www.a.com/x/?utm_source=hn") }], S1);
    idx = markSeen(idx, [{ key: canonicalizeUrl("https://a.com/x?ref=rss") }], S2);
    expect(Object.keys(idx.entries)).toEqual(["https://a.com/x"]);
    expect(isNew(idx, "https://a.com/x", S2)).toBe(false);
  });

  test("absent key keeps first_seen (returns later without being NEW)", () => {
    let idx = markSeen(null, [{ key: "k" }], S1);
    idx = markSeen(idx, [], S2);
    idx = markSeen(idx, [{ key: "k" }], S3);
    expect(firstSeen(idx, "k")).toBe(S1);
  });

  test("retention prunes entries unseen for > 30 days; empty keys ignored", () => {
    let idx = markSeen(null, [{ key: "old" }, { key: "" }], "2026-08-01T00:00:00Z");
    idx = markSeen(idx, [{ key: "new" }], S1);
    expect(Object.keys(idx.entries)).toEqual(["new"]);
  });

  test("parseSeenIndex tolerates garbage", () => {
    expect(parseSeenIndex("x").entries).toEqual({});
    expect(parseSeenIndex({ entries: { a: { first_seen: S1 }, b: 3 } }).entries).toEqual({
      a: { first_seen: S1, last_seen: S1 },
    });
  });
});
