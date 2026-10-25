/** Desk bug A: the morning daily pick must not reset the 12h refresh clock by re-crowning the incumbent. */
import { expect, test } from "bun:test";
import type { WireCluster } from "@/lib/wire";
import { applyPick, decideLeadRefresh, LEAD_FRESH_AGE_H, LEAD_REPICK_AFTER_H, type LeadEntry, type LeadHistory } from "@/lib/lead-pick";

const PICKED = "2026-10-24T13:20:00Z"; // Oct 24 16:20 Istanbul
const MORNING = "2026-10-25T03:20:00Z"; // Oct 25 06:20 Istanbul
const ago = (h: number, from: string) => new Date(Date.parse(from) - h * 3_600_000).toISOString();

const sweden: WireCluster = {
  id: "cl:hn:50219364",
  title: "OpenAI model story Sweden",
  url: "https://example.com/sweden",
  lead_id: "hn:50219364",
  lead_source: "hn-algolia",
  sources: ["hn-algolia", "rss-lab"],
  member_ids: ["hn:50219364", "rss:openai:sw"],
  size: 2,
  at: ago(16, MORNING),
  first_seen: null,
  is_new: false,
};

test("daily pick does not re-crown the incumbent", () => {
  expect(LEAD_REPICK_AFTER_H).toBe(12);
  expect(LEAD_FRESH_AGE_H).toBe(12);
  const h: LeadHistory = {
    schema: 1,
    entries: [{ date: "2026-10-24", cluster_id: sweden.id, headline: sweden.title, url: sweden.url, sources: 2, sig: null, reason: "picked", at: PICKED, crawl_at: PICKED, first_at: ago(16, MORNING) } as LeadEntry],
  };
  const memberAt = { "hn:50219364": ago(16, MORNING), "rss:openai:sw": ago(16, MORNING) };
  const d = decideLeadRefresh(h, [sweden], { crawlAt: MORNING, at: MORNING, memberAt });
  expect(d.action).toBe("picked");
  if (d.action !== "picked") return;
  expect(d.entry.cluster_id).toBe(sweden.id);
  expect(d.entry.at).toBe(PICKED); // original pick time kept, not 06:20
  // At 18:00 Oct 25 (>12h since the ORIGINAL pick) a fresh candidate can replace it.
  const later = "2026-10-25T15:00:00Z";
  const fresh: WireCluster = { ...sweden, id: "cl:hn:new", lead_id: "hn:new", member_ids: ["hn:new", "rss:openai:new"], title: "OpenAI model story new", at: ago(2, later) };
  const r = decideLeadRefresh(applyPick(h, d), [sweden, fresh], { crawlAt: later, at: later, memberAt: { ...memberAt, "hn:new": ago(2, later), "rss:openai:new": ago(2, later) } });
  expect(r.action === "picked" && r.entry.cluster_id).toBe("cl:hn:new");
});
