import { describe, expect, test } from "bun:test";
import { healthReasonShort } from "../pulse-v5";

describe("healthReasonShort — health strip chip stays short at 390", () => {
  test("crawl timeout collapses to TIMEOUT", () => {
    expect(healthReasonShort("timeout after 30000ms budget", "fail")).toBe("TIMEOUT");
  });
  test("HTTP code keeps the bare code", () => {
    expect(healthReasonShort("HTTP 503", "fail")).toBe("503");
  });
  test("long free-text reason is cut to its first word, ≤10 chars", () => {
    const out = healthReasonShort("connection reset by peer while reading", "soft");
    expect(out).toBe("connection");
    expect(out.length).toBeLessThanOrEqual(10);
  });
  test("no reason falls back to the state", () => {
    expect(healthReasonShort(null, "soft")).toBe("SOFT");
  });
});
