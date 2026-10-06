import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpCache } from "./tmp-cache";
import { buildRows } from "@/lib/pulse-v5";
import {
  GMAIL_QUERY,
  GMAIL_SEED_KEYWORDS,
  GMAIL_EMIT_CAP,
  buildGmailQuery,
  queryHash,
  ingestSearchPayload,
  runGmailNews,
  rankAndEmit,
  toHit,
  isNoise,
  pruneCache,
  writeMessageCache,
  type GmailNewsHit,
} from "@/lib/gmail-news";

const sample = JSON.parse(readFileSync(join(import.meta.dir, "fixtures/gmail-search-sample.json"), "utf8"));

describe("Pass F gmail-news", () => {
  test("query builder covers every seed keyword", () => {
    const q = buildGmailQuery();
    expect(q).toBe(GMAIL_QUERY);
    for (const k of GMAIL_SEED_KEYWORDS) {
      expect(q.toLowerCase()).toContain(k.toLowerCase());
    }
    expect(q).toContain("newer_than:14d");
    expect(queryHash(q)).toHaveLength(12);
  });

  test("keyword query → ≥1 Pulse row source gmail-news, briefEligible false", () => {
    const dir = tmpCache("gmail-ok");
    mkdirSync(dir, { recursive: true });
    const r = ingestSearchPayload(sample, { cacheDir: dir, now: Date.parse("2026-10-06T20:00:00Z") });
    expect(r.soft_fail).toBe(false);
    expect(r.items.length).toBeGreaterThanOrEqual(1);
    expect(r.items.length).toBeLessThanOrEqual(GMAIL_EMIT_CAP);
    for (const it of r.items) {
      expect(it.source).toBe("gmail-news");
      expect(it.briefEligible).toBe(false);
      expect(it.pulseEligible).toBe(true);
      expect(it.pulse_only).toBe(true);
      expect(it.id.startsWith("gmail:")).toBe(true);
      expect(it.link).toMatch(/^https?:\/\//);
    }
  });

  test("noise (2FA / promo / account share) dropped; qi ranks real news above weak", () => {
    expect(isNoise({ subject: "Security alert", sender: "no-reply@accounts.google.com", snippet: "You allowed Mistral" })).toBe(true);
    expect(isNoise({ subject: "Spare jetzt 20% auf alle Tischwasserfilter!", sender: "News_DE@service.brita.net" })).toBe(true);
    const r = ingestSearchPayload(sample, { now: Date.parse("2026-10-06T20:00:00Z") });
    expect(r.items.every((i) => !/Security alert|Tischwasserfilter|no link news/i.test(i.title))).toBe(true);
    const qis = r.items.map((i) => i.qi);
    expect(qis).toEqual([...qis].sort((a, b) => b - a));
  });

  test("dedupe by message-id keeps highest qi; emit cap 12", () => {
    const base = toHit({
      id: "dup",
      subject: "LLM security paper on arXiv",
      snippet: "https://arxiv.org/abs/2601.1 AI LLM security paper",
      sender: "news@axios.com",
      date: "2026-10-06T12:00:00Z",
      viewUrl: "https://mail.google.com/mail/#all/dup",
    })!;
    const low = { ...base, qi: 1, priority: "P3" as const };
    const high = { ...base, qi: 50, priority: "P1" as const };
    const many: GmailNewsHit[] = [low, high, ...Array.from({ length: 20 }, (_, i) => ({ ...base, id: `gmail:x${i}`, messageId: `x${i}`, qi: 10 + i, title: `AI news ${i}`, link: `https://ex.test/${i}` }))];
    const out = rankAndEmit(many, 12);
    expect(out).toHaveLength(12);
    expect(out.find((x) => x.messageId === "dup")?.qi).toBe(50);
  });

  test("Gmail timeout / 401 → soft meter shape, items from cache or empty, never throws", async () => {
    const dir = tmpCache("gmail-soft");
    mkdirSync(dir, { recursive: true });
    const soft401 = await runGmailNews({
      cacheDir: dir,
      timeoutMs: 50,
      fetcher: async () => {
        throw new Error("HTTP 401 unauthorized");
      },
    });
    expect(soft401.soft_fail).toBe(true);
    expect(soft401.soft_fail_reason).toMatch(/401/);
    expect(soft401.items).toEqual([]);

    const softTimeout = await runGmailNews({
      cacheDir: dir,
      timeoutMs: 30,
      fetcher: async (_q, signal) => {
        await new Promise((r, j) => {
          signal.addEventListener("abort", () => j(Object.assign(new Error("aborted"), { name: "AbortError" })));
          setTimeout(r, 500);
        });
        return { threads: [] };
      },
    });
    expect(softTimeout.soft_fail).toBe(true);
    expect(softTimeout.soft_fail_reason).toMatch(/timeout/i);
  });

  test("retention TTL drops stale cache files", () => {
    const dir = tmpCache("gmail-ttl");
    mkdirSync(dir, { recursive: true });
    writeMessageCache(dir, {
      messageId: "old",
      subject: "old AI",
      link: "https://ex.test/old",
      snippet: "AI",
      from: "a@b.com",
      published: "2026-01-01T00:00:00Z",
      cached_at: "2026-01-01T00:00:00Z",
    });
    writeMessageCache(dir, {
      messageId: "new",
      subject: "new AI",
      link: "https://ex.test/new",
      snippet: "AI",
      from: "a@b.com",
      published: "2026-10-06T00:00:00Z",
      cached_at: "2026-10-06T00:00:00Z",
    });
    const dropped = pruneCache(dir, Date.parse("2026-10-06T12:00:00Z"));
    expect(dropped).toBeGreaterThanOrEqual(1);
    expect(existsSync(join(dir, "old.json"))).toBe(false);
    expect(existsSync(join(dir, "new.json"))).toBe(true);
  });

  test("never Brief: every emitted row has briefEligible false and pulse_only true", () => {
    const r = ingestSearchPayload(sample);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((i) => i.briefEligible === false && i.pulse_only === true)).toBe(true);
  });
});


describe("Pass F Gmail SRC chip (Architect lock — not GNW)", () => {
  test("gmail-news members render distinct GML chip, never GNW", () => {
    const members = {
      "gmail:abc": { badge: "GML", publisher: "substack.com", title: "AI paper", at: "2026-10-06T12:00:00Z", url: "https://ex.test/a" },
      "gnews:xyz": { badge: "GNW", publisher: "Reuters", title: "Other", at: "2026-10-06T12:00:00Z", url: "https://news.google.com/x" },
    };
    const { rows } = buildRows(
      [
        { id: "cl:gmail:abc", title: "AI paper", url: "https://ex.test/a", lead_id: "gmail:abc", lead_source: "gmail-news", sources: ["gmail-news"], member_ids: ["gmail:abc"], size: 1, at: "2026-10-06T12:00:00Z", first_seen: null, is_new: false },
        { id: "cl:gnews:xyz", title: "Other", url: "https://news.google.com/x", lead_id: "gnews:xyz", lead_source: "gnews-rss", sources: ["gnews-rss"], member_ids: ["gnews:xyz"], size: 1, at: "2026-10-06T12:00:00Z", first_seen: null, is_new: false },
      ],
      members,
    );
    const gml = rows.find((r) => r.id === "cl:gmail:abc")!;
    const gnw = rows.find((r) => r.id === "cl:gnews:xyz")!;
    expect(gml.leadBadge).toBe("GML");
    expect(gml.chips.map((c) => c.badge)).toEqual(["GML"]);
    expect(gml.chips.some((c) => c.badge === "GNW")).toBe(false);
    expect(gnw.leadBadge).toBe("GNW");
  });
});
