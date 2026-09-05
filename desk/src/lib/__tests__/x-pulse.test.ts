import { describe, expect, test } from "bun:test";
import {
  applyHydrate,
  crawlAgeHours,
  emergingTopics,
  scorePost,
  STALE_HOURS,
} from "@/lib/x-pulse";

describe("applyHydrate", () => {
  test("never writes 0 over a real likes count", () => {
    const prev = { likes: 261, views: 23182 };
    const out = applyHydrate(prev, { likes: 0, views: 24000 });
    expect(out.likes).toBe(261);
    expect(out.views).toBe(24000);
  });

  test("never writes 0 over a real views count", () => {
    const prev = { likes: 10, views: 500 };
    const out = applyHydrate(prev, { likes: 12, views: 0 });
    expect(out.likes).toBe(12);
    expect(out.views).toBe(500);
  });

  test("allows first hydrate from zero/missing", () => {
    const prev = { likes: 0, views: 0 };
    const out = applyHydrate(prev, { likes: 5, views: 100 });
    expect(out.likes).toBe(5);
    expect(out.views).toBe(100);
  });
});

describe("crawlAgeHours", () => {
  test("STALE when age > 18h", () => {
    const crawledAt = "2026-09-03T05:40:00Z";
    const now = Date.parse(crawledAt) + (STALE_HOURS + 1) * 3_600_000;
    const r = crawlAgeHours(crawledAt, now);
    expect(r.hours).toBeGreaterThan(18);
    expect(r.stale).toBe(true);
  });

  test("not STALE under 18h", () => {
    const crawledAt = "2026-09-03T05:40:00Z";
    const now = Date.parse(crawledAt) + 10 * 3_600_000;
    const r = crawlAgeHours(crawledAt, now);
    expect(r.stale).toBe(false);
  });
});

describe("emergingTopics", () => {
  test("two-handle rule — single handle excluded", () => {
    const topics = emergingTopics([
      { handle: "dair_ai", topic: "harness" },
      { handle: "dair_ai", topic: "harness" },
      { handle: "stanislavfort", topic: "curl-cve" },
      { handle: "AndrewCurran_", topic: "astra" },
      { handle: "steph_palazzolo", topic: "astra" },
    ]);
    expect(topics.find((t) => t.topic === "harness")).toBeUndefined();
    expect(topics.find((t) => t.topic === "curl-cve")).toBeUndefined();
    const astra = topics.find((t) => t.topic === "astra");
    expect(astra).toBeDefined();
    expect(astra!.handles.length).toBeGreaterThanOrEqual(2);
  });
});

describe("scorePost", () => {
  test("returns finite score", () => {
    const s = scorePost({
      handle: "dair_ai",
      likes: 342,
      views: 36614,
      at: "2026-09-02T15:30:07Z",
      tag: "rest",
    });
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThan(0);
  });
});
