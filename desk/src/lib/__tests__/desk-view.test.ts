/**
 * OPT win 3 — the slim client view (src/data/desk-view.ts) must give the desk EXACTLY what the raw crawl modules gave:
 * same Pulse rows (chips, N SRC, NEW, signal, summary as rendered), same story ages, same drawer coverage, same papers.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as V from "@/data/desk-view";
import { CRAWL, CRAWL_AT } from "@/data/x-crawl";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { HN_PULSE } from "@/data/hn-pulse";
import { RSS_LABS } from "@/data/rss-labs";
import { RSS_SECURITY } from "@/data/rss-security";
import { PULSE_CLUSTERS, PULSE_CLUSTERS_AT } from "@/data/pulse-clusters";
import { PAPERS } from "@/data/papers";
import { WIRE_CRAWL_AT, WIRE_ROWS } from "@/data/wire";
import { TOPIC_HEAT_AT } from "@/data/topic-heat";
import { memberInfo } from "@/lib/member-info";
import {
  ABSTRACT_CHARS,
  SUMMARY_CHARS,
  buildDeskView,
  crawlItemIds,
  inflateClusters,
  inflateMembers,
  memberAt,
  memberItems,
  stripPublisher,
  xRows,
} from "@/lib/desk-view";
import { buildPaperRows, buildRows, labBadge, type ClusterInput, type PaperInput, type PulseMemberInfo } from "@/lib/pulse-v5";
import { buildCoverage, type MemberItem } from "@/lib/story-drawer";

const DESK = join(import.meta.dir, "../../..");

// ── what desk.tsx computed from the raw modules before win 3 ──
const RAW_MEMBERS = memberInfo();
const RAW_AT: Record<string, string> = {};
for (const h of HN_PULSE) RAW_AT[h.id] = h.at;
for (const g of GNEWS_RSS) RAW_AT[g.id] = g.published;
for (const r of RSS_LABS) RAW_AT[r.id] = r.published;
for (const r of RSS_SECURITY) RAW_AT[r.id] = r.published;
const RAW_ITEMS: Record<string, MemberItem> = {};
for (const h of HN_PULSE) RAW_ITEMS[h.id] = { title: h.text, publisher: `hn/${h.author}`, badge: "HN", at: h.at, url: h.url };
for (const g of GNEWS_RSS)
  RAW_ITEMS[g.id] = { title: stripPublisher(g.title, g.publisher), publisher: g.publisher || "google news", badge: "GNW", at: g.published, url: g.link };
for (const r of RSS_LABS) RAW_ITEMS[r.id] = { title: r.title, publisher: r.lab, badge: labBadge(r.lab), at: r.published, url: r.link };
for (const r of RSS_SECURITY) RAW_ITEMS[r.id] = { title: r.title, publisher: r.lab, badge: "SEC", at: r.published, url: r.link };
const RAW_X: ClusterInput[] = CRAWL.map((p) => ({
  id: `x:${p.id}`, title: p.take, url: p.href, lead_id: `x:${p.id}`, lead_source: "x", sources: ["x"],
  member_ids: [`x:${p.id}`], size: 1, at: p.at, first_seen: null, is_new: false,
}));

// ── what desk.tsx computes from the slim view now ──
const MEMBERS = inflateMembers(V.MEMBER_ROWS);
const ITEM_IDS = crawlItemIds(V.MEMBER_ROWS);
const CLUSTERS = inflateClusters(V.MEMBER_ROWS, V.ORPHAN_CLUSTERS);

/** The Pulse row only ever shows summary.slice(0, 280). */
const asRendered = (rows: ReturnType<typeof buildRows>) => ({
  ...rows,
  rows: rows.rows.map((r) => ({ ...r, summary: r.summary?.slice(0, SUMMARY_CHARS) })),
});
const norm = (o: unknown) => JSON.parse(JSON.stringify(o));

describe("desk-view.ts — slim client view == raw crawl modules", () => {
  test("generated file is in sync with the raw modules (bun scripts/desk-view.ts --check)", () => {
    const r = spawnSync("bun", ["scripts/desk-view.ts", "--check"], { cwd: DESK, encoding: "utf8" });
    expect(`${r.stdout}${r.stderr}`).toContain("in sync");
    expect(r.status).toBe(0);
  });

  test("one crawl: DESK_VIEW_AT = CRAWL_AT = PULSE_CLUSTERS_AT = WIRE_CRAWL_AT = TOPIC_HEAT_AT", () => {
    for (const at of [V.CRAWL_AT, V.PULSE_CLUSTERS_AT, CRAWL_AT, PULSE_CLUSTERS_AT, WIRE_CRAWL_AT, TOPIC_HEAT_AT]) expect(V.DESK_VIEW_AT).toBe(at);
    expect(V.WIRE_ROWS).toEqual(norm(WIRE_ROWS));
  });

  test("Pulse rows (clusters + X) are identical as rendered — chips, N SRC, NEW, signal, security, summary", () => {
    const raw = asRendered(buildRows([...(PULSE_CLUSTERS as ClusterInput[]), ...RAW_X], RAW_MEMBERS));
    const slim = asRendered(buildRows([...CLUSTERS, ...xRows(V.X_POSTS)], MEMBERS));
    expect(norm(slim)).toEqual(norm(raw));
  });

  test("Wire chips: the Wire subset builds the same rows", () => {
    const ids = new Set(V.WIRE_ROWS.map((r) => r.id));
    const raw = buildRows((PULSE_CLUSTERS as ClusterInput[]).filter((c) => ids.has(c.id)), RAW_MEMBERS);
    const slim = buildRows(CLUSTERS.filter((c) => ids.has(c.id)), MEMBERS);
    expect(norm(asRendered(slim))).toEqual(norm(asRendered(raw)));
  });

  test("every cluster field the desk reads survives (only canonical_url / all_sources / score dropped)", () => {
    const rawSlim = PULSE_CLUSTERS.map((c) => {
      const rest: Record<string, unknown> = { ...(c as Record<string, unknown>) };
      for (const k of ["canonical_url", "all_sources", "score"]) delete rest[k];
      return rest;
    });
    expect(norm(CLUSTERS)).toEqual(norm(rawSlim));
  });

  test("member info: same badge / publisher / title / time / url / signal / security; summary only for row leads (≤280)", () => {
    const leads = new Set([...PULSE_CLUSTERS.map((c) => c.lead_id), ...CRAWL.map((p) => `x:${p.id}`)]);
    const expected: Record<string, PulseMemberInfo> = {};
    for (const [id, m] of Object.entries(RAW_MEMBERS)) {
      const e: PulseMemberInfo = { ...m };
      if (e.score == null) delete e.score;
      if (!e.summary || !leads.has(id)) delete e.summary;
      else e.summary = e.summary.slice(0, SUMMARY_CHARS);
      if (!e.security) delete e.security;
      expected[id] = e;
    }
    expect(norm(MEMBERS)).toEqual(norm(expected));
  });

  test("story ages (MEMBER_AT) and drawer coverage for every cluster are identical", () => {
    expect(memberAt(V.MEMBER_ROWS, ITEM_IDS)).toEqual(RAW_AT);
    const items = memberItems(V.MEMBER_ROWS, ITEM_IDS);
    expect(norm(items)).toEqual(norm(RAW_ITEMS));
    for (const c of PULSE_CLUSTERS) {
      const slimC = CLUSTERS.find((x) => x.id === c.id)!;
      expect(norm(buildCoverage(slimC, items))).toEqual(norm(buildCoverage(c as ClusterInput, RAW_ITEMS)));
    }
  });

  test("Papers rows identical as rendered (abstract shown ≤600 chars)", () => {
    const shown = (rows: ReturnType<typeof buildPaperRows>) => rows.map((r) => ({ ...r, abstract: r.abstract?.slice(0, ABSTRACT_CHARS) ?? null }));
    expect(norm(shown(buildPaperRows(V.PAPERS)))).toEqual(norm(shown(buildPaperRows(PAPERS as unknown as PaperInput[]))));
  });

  test("orphan clusters (lead not a crawl item) keep their position", () => {
    const members = { "hn:1": { badge: "HN", publisher: "hn/a", title: "A", at: "2026-10-01T00:00:00Z", url: "https://a" } };
    const mk = (id: string, lead: string) => ({ id, title: id, url: `https://${id}`, lead_id: lead, lead_source: "hn-algolia", sources: ["hn-algolia"], member_ids: [lead], size: 1, at: "2026-10-01T00:00:00Z", first_seen: null, is_new: false });
    const clusters = [mk("cl:hn:9", "hn:9"), mk("cl:hn:1", "hn:1"), mk("cl:hn:8", "hn:8")];
    const v = buildDeskView({ clusters, members, gnews: [], xPosts: [], papers: [] });
    expect(v.orphanClusters.map((o) => o.i)).toEqual([0, 2]);
    expect(norm(inflateClusters(v.memberRows, v.orphanClusters))).toEqual(norm(clusters));
  });

  test("the desk client imports crawl data only through desk-view (raw crawl modules stay out of the bundle)", () => {
    const desk = readFileSync(join(DESK, "src/components/sage/desk.tsx"), "utf8");
    for (const raw of ["x-crawl", "hn-pulse", "gnews-rss", "rss-labs", "rss-security", "pulse-clusters", "papers", "shelf", "wire", "topic-heat", "corroboration-rank", "lead-pick", "source-health"])
      expect(desk).not.toContain(`"@/data/${raw}"`);
    expect(desk).not.toContain("@/lib/member-info");
  });
});
