/**
 * UX-1 clearance plate fixtures — REAL crawl data, HELD by construction (nothing invented):
 * the current crawl (PULSE_CLUSTERS @ PULSE_CLUSTERS_AT) run through the real picker with its ELIGIBLE stories taken out,
 * i.e. "this crawl, had none of its qualifying stories existed". Every ruled-out record (headline, N SRC, age, own
 * publisher, reason) is what decidePick computes for that real group. The last pick is the real LEAD_TODAY entry.
 * Used by clearance-plate.test.ts and scripts/lead-hold-fixture.ts (visual / overflow-390 HELD build).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PULSE_CLUSTERS, PULSE_CLUSTERS_AT } from "@/data/pulse-clusters";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { HN_PULSE } from "@/data/hn-pulse";
import { RSS_LABS } from "@/data/rss-labs";
import { RSS_SECURITY } from "@/data/rss-security";
import { X_TASTE } from "@/data/x-taste";
import { LEAD_TODAY } from "@/data/lead-pick";
import { memberInfo } from "@/lib/member-info";
import { applyPick, decidePick, leadCandidates, type LeadEntry, type LeadHistory, type LeadOpts } from "@/lib/lead-pick";

export function realLeadOpts(): LeadOpts {
  const publishers: Record<string, string> = {};
  for (const g of GNEWS_RSS) if (g.publisher) publishers[g.id] = g.publisher;
  for (const r of RSS_LABS) publishers[r.id] = r.lab;
  for (const r of RSS_SECURITY) publishers[r.id] = r.lab;
  const memberAt: Record<string, string> = {};
  for (const h of HN_PULSE) memberAt[h.id] = h.at;
  for (const g of GNEWS_RSS) memberAt[g.id] = g.published;
  for (const r of RSS_LABS) memberAt[r.id] = r.published;
  for (const r of RSS_SECURITY) memberAt[r.id] = r.published;
  const scores: Record<string, number> = {};
  for (const h of HN_PULSE) scores[h.id] = h.score;
  return { publishers, members: memberInfo(), memberAt, scores, tasteIds: X_TASTE.items.map((t) => t.id) };
}

/** The real crawl minus its eligible stories (what makes the pick HELD), optionally keeping only one reason family. */
export function heldClusters(keep?: (reason: string) => boolean) {
  const opts = realLeadOpts();
  const now = Date.parse(PULSE_CLUSTERS_AT);
  const eligible = new Set(leadCandidates(PULSE_CLUSTERS, now, opts).map((c) => c.id));
  const base = PULSE_CLUSTERS.filter((c) => !eligible.has(c.id));
  if (!keep) return base;
  const probe = decidePick({ schema: 1, entries: [] }, base, { ...opts, crawlAt: PULSE_CLUSTERS_AT, at: PULSE_CLUSTERS_AT, force: true });
  const ok = new Set((probe.action === "held" ? probe.entry.excluded ?? [] : []).filter((e) => keep(e.reason)).map((e) => e.cluster_id));
  return base.filter((c) => ok.has(c.id) || !(probe.action === "held" && (probe.entry.excluded ?? []).some((e) => e.cluster_id === c.id)));
}

/** The real last pick: LEAD_TODAY on a picked day, else the latest non-HELD entry of artifacts/sage/lead-history.json. */
export function realLastPick(): LeadEntry {
  if (LEAD_TODAY && LEAD_TODAY.reason !== "held") return LEAD_TODAY;
  const h = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../artifacts/sage/lead-history.json", import.meta.url)), "utf8")) as LeadHistory;
  const e = [...h.entries].reverse().find((x) => x.reason !== "held");
  if (!e) throw new Error("lead-hold fixture: no real pick in lead-history.json");
  return e;
}

/** A HELD day after the real last pick (realLastPick): the next Istanbul date, attempted by this crawl's data. */
export function heldHistory(keep?: (reason: string) => boolean): { history: LeadHistory; entry: LeadEntry } {
  const last = realLastPick();
  const h0: LeadHistory = { schema: 1, entries: [last] };
  const crawlAt = PULSE_CLUSTERS_AT; // this crawl's data, attempted on the Istanbul day after the last pick
  const nextDay = new Date(Date.parse(`${last.date}T03:11:00Z`) + 86_400_000).toISOString(); // 06:11 Istanbul next day
  const d = decidePick(h0, heldClusters(keep), { ...realLeadOpts(), crawlAt, at: nextDay, crawlStartedAt: nextDay });
  if (d.action !== "held") throw new Error(`lead-hold fixture: expected HELD, got ${d.action}`);
  const history = applyPick(h0, d);
  return { history, entry: history.entries[history.entries.length - 1]! };
}
