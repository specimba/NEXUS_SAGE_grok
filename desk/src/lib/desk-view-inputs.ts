/**
 * The raw crawl modules → desk-view inputs (scripts/desk-view.ts + tests). Imports every raw data module, so it is
 * scripts/tests only — the desk client never imports this file.
 */
import { CRAWL, CRAWL_AT } from "@/data/x-crawl";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { HN_PULSE } from "@/data/hn-pulse";
import { RSS_LABS } from "@/data/rss-labs";
import { RSS_SECURITY } from "@/data/rss-security";
import { PULSE_CLUSTERS, PULSE_CLUSTERS_AT } from "@/data/pulse-clusters";
import { SOURCE_HEALTH, SOURCE_HEALTH_AT } from "@/data/source-health";
import { WIRE_CRAWL_AT, WIRE_PREV_CRAWL_AT, WIRE_ROWS } from "@/data/wire";
import { TOPIC_HEAT_AT, TOPIC_HEAT_WINDOWS } from "@/data/topic-heat";
import { RANK_CURRENT, RANK_MOVED, RANK_PREV } from "@/data/corroboration-rank";
import { LEAD_FIRST_AT, LEAD_HELD, LEAD_TODAY, LEAD_YESTERDAY } from "@/data/lead-pick";
import { SHELF } from "@/data/shelf";
import { PAPERS } from "@/data/papers";
import { memberInfo } from "@/lib/member-info";
import { slimLead, type DeskViewInput } from "@/lib/desk-view";
import type { DeskViewExtras } from "@/lib/desk-view-module";
import type { PaperInput } from "@/lib/pulse-v5";

/** Rank snapshots minus `at` (the snapshot's wall-clock write time — never rendered; keeps reruns byte-identical). */
const noAt = <T extends { at?: unknown }>(s: T | null) => {
  if (!s) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { at, ...rest } = s;
  return rest;
};

export function rawDeskViewInputs(): { input: DeskViewInput; extras: DeskViewExtras } {
  const itemIds = [...HN_PULSE.map((h) => h.id), ...GNEWS_RSS.map((g) => g.id), ...RSS_LABS.map((r) => r.id), ...RSS_SECURITY.map((r) => r.id)];
  const members = memberInfo();
  // The client recovers the crawl-item list as "every member id not under x:" (crawlItemIds) — make sure that holds.
  for (const id of itemIds) if (id.startsWith("x:")) throw new Error(`desk-view: crawl item id ${id} collides with the X namespace`);
  if (JSON.stringify([...new Set(itemIds)]) !== JSON.stringify(Object.keys(members).filter((id) => !id.startsWith("x:"))))
    throw new Error("desk-view: memberInfo order ≠ crawl item order");
  return {
    input: {
      clusters: PULSE_CLUSTERS,
      members,
      gnews: GNEWS_RSS.map((g) => ({ id: g.id, title: g.title, publisher: g.publisher })),
      xPosts: CRAWL,
      papers: PAPERS as unknown as (PaperInput & Record<string, unknown>)[],
    },
    extras: {
      stamps: { CRAWL_AT, PULSE_CLUSTERS_AT, SOURCE_HEALTH_AT, WIRE_CRAWL_AT, WIRE_PREV_CRAWL_AT, TOPIC_HEAT_AT },
      LEAD_HELD,
      LEAD_FIRST_AT,
      LEAD_TODAY: slimLead(LEAD_TODAY),
      LEAD_YESTERDAY: slimLead(LEAD_YESTERDAY),
      RANK_CURRENT: noAt(RANK_CURRENT)!,
      RANK_PREV: noAt(RANK_PREV),
      RANK_MOVED,
      WIRE_ROWS,
      TOPIC_HEAT_WINDOWS,
      SOURCE_HEALTH,
      SHELF,
    },
  };
}
