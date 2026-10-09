import { describe, expect, test } from "bun:test";
import { fetchRssLabs, LAB_FEEDS } from "@/lib/rss-labs";
import { RSS_FEED_TIMEOUT_MS } from "@/lib/rss-timeout";
import { fast } from "./tmp-cache";

/** fetch that never answers until its AbortSignal fires (a hung feed). */
const hangingFetch = ((_url: string, init?: RequestInit) =>
  new Promise<Response>((_res, rej) => {
    init?.signal?.addEventListener("abort", () => rej(init.signal!.reason));
  })) as unknown as typeof fetch;

describe("RSS per-feed timeout", () => {
  test("default cap is 10s", () => {
    expect(RSS_FEED_TIMEOUT_MS).toBe(10_000);
  });

  test("hung feed soft-fails with a timeout reason; crawl continues, no throw", async () => {
    const feeds = LAB_FEEDS.filter((f) => f.lab !== ("anthropic" as string) && f.lab !== ("meta" as string)).slice(0, 2);
    expect(feeds.length).toBe(2);
    const t0 = Date.now();
    const r = await fetchRssLabs({ ...fast(), feeds, fetchImpl: hangingFetch, feedTimeoutMs: 50 });
    expect(Date.now() - t0).toBeLessThan(2_000 * feeds[0].urls.length * 2);
    expect(r.soft_fail).toBe(true);
    expect(r.feedsSoftFail.length).toBe(2);
    for (const s of r.feedsSoftFail) expect(s.reason).toBe("timeout 50ms");
  });
});
