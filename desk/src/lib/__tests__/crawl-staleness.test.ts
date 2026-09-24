import { describe, expect, test } from "bun:test";
import { crawlFreshness, STALE_GUARD_HOURS } from "@/lib/crawl-staleness";
import { crawlAgeHours, STALE_HOURS } from "@/lib/x-pulse";

const AT = "2026-09-25T02:11:00Z";
const t = (h: number) => Date.parse(AT) + h * 3_600_000;

describe("staleness guard", () => {
  test("threshold is 6h and x-pulse shares it", () => {
    expect(STALE_GUARD_HOURS).toBe(6);
    expect(STALE_HOURS).toBe(STALE_GUARD_HOURS);
  });
  test("FRESH at 0h, 4h (one missed-free cycle) and exactly 6h", () => {
    expect(crawlFreshness(AT, t(0)).label).toBe("FRESH");
    expect(crawlFreshness(AT, t(4)).label).toBe("FRESH");
    expect(crawlFreshness(AT, t(6)).stale).toBe(false);
  });
  test("STALE just past 6h", () => {
    const f = crawlFreshness(AT, t(6.01));
    expect(f.stale).toBe(true);
    expect(f.label).toBe("STALE");
    expect(crawlAgeHours(AT, t(6.01)).stale).toBe(true);
  });
  test("unparseable stamp is STALE; future stamp clamps to 0h FRESH", () => {
    expect(crawlFreshness("garbage", t(0)).stale).toBe(true);
    expect(crawlFreshness(AT, t(-2)).hours).toBe(0);
  });
});
