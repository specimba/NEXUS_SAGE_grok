/**
 * PASS-S1 test 2 helper — the crawl-side pipeline that decides Pulse/Wire/lead for one crawl, run on a frozen
 * fixture: clusterItems (dedupe v2) → buildWire → lead candidates + exclude reasons → decidePick (empty history,
 * forced). Pure; the fixture carries member info so no data module is read.
 */
import { clusterItems, type PulseInput } from "@/lib/dedupe";
import { decidePick, groupFirstAt, leadExcludeReason } from "@/lib/lead-pick";
import type { PulseMemberInfo } from "@/lib/pulse-v5";
import { buildWire } from "@/lib/wire";

export type S1Fixture = {
  note: string;
  stamp: string;
  inputs: PulseInput[];
  members: Record<string, PulseMemberInfo>;
};

export function oldSourcesPipeline(f: S1Fixture) {
  const inputs = f.inputs.map((x) => ({ ...x }));
  const clusters = clusterItems(inputs, { stamp: f.stamp }).sort(
    (a, b) => b.sources.length - a.sources.length || (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0),
  );
  const ci = clusters.map((c) => ({ ...c, first_seen: c.first_seen ?? null, is_new: c.is_new ?? false }));
  const scores: Record<string, number> = {};
  const memberAt: Record<string, string> = {};
  for (const x of inputs) {
    if (x.source === "hn-algolia" && typeof x.score === "number") scores[x.id] = x.score;
    if (x.source !== "gmail-news") memberAt[x.id] = x.at;
  }
  const now = Date.parse(f.stamp);
  const opts = { scores, memberAt, members: f.members };
  // PASS-F2.1a 6h backfill is a later, deliberate Wire change: off here so the pre-S1 golden stays byte-identical.
  const wire = buildWire(ci, null, { at: f.stamp, crawlAt: f.stamp, ...opts, backfillH: 0 });
  const all = buildWire(ci, null, { at: f.stamp, crawlAt: f.stamp, ...opts, max: 99, backfillH: 0 });
  const leadCands = all.rows.map((r) => {
    const c = ci.find((x) => x.id === r.id)!;
    return { id: r.id, sources: r.sources, first: groupFirstAt(c, memberAt), reason: leadExcludeReason(c, now, opts) };
  });
  const pick = decidePick({ schema: 1, entries: [] }, ci, { ...opts, crawlAt: f.stamp, at: f.stamp, force: true });
  return {
    cluster_ids: clusters.map((c) => c.id),
    clusters: clusters.map((c) => ({ id: c.id, lead_source: c.lead_source, sources: c.sources, member_ids: c.member_ids, score: c.score, title: c.title })),
    wire: wire.rows,
    lead_candidates: leadCands,
    pick,
  };
}
