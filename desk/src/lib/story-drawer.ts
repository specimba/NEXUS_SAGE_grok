/**
 * Beat 8 — Pulse story drawer (refs/UX-BEAT8-9-DRAWER-KEYS.md). Pure helpers, no IO / DOM.
 * Coverage list = one row per source, earliest first, SELF reposts last (struck, counts 0).
 * Navigation helpers (next/prev over drawer-capable rows) are the Beat 9 key surface.
 */
import { corroborationMultiplier } from "@/lib/corroboration";
import { memberSource, selfRepostIds, sourceBadge, type ClusterInput } from "@/lib/pulse-v5";

export const STORY_PARAM = "story";

export type MemberItem = {
  /** Source's own headline. */
  title: string;
  publisher: string;
  badge: string;
  at: string | null;
  url: string | null;
};

export type CoverageRow = {
  id: string;
  badge: string;
  publisher: string;
  title: string;
  at: string | null;
  url: string | null;
  lead: boolean;
  self: boolean;
};

export function buildCoverage(c: ClusterInput, items: Record<string, MemberItem>): CoverageRow[] {
  const selfIds = selfRepostIds(c);
  selfIds.delete(c.lead_id);
  const rows = c.member_ids.map((id): CoverageRow => {
    const m = items[id];
    const src = (c.members ?? []).find((x) => x.id === id)?.source ?? memberSource(id) ?? c.lead_source;
    const self = selfIds.has(id);
    return {
      id,
      badge: self ? "SELF" : (m?.badge ?? sourceBadge(src)),
      publisher: m?.publisher ?? sourceBadge(src),
      title: m?.title ?? (id === c.lead_id ? c.title : "(headline not in this crawl)"),
      at: m?.at ?? (id === c.lead_id ? c.at : null),
      url: m?.url ?? (id === c.lead_id ? c.url : null),
      lead: id === c.lead_id,
      self,
    };
  });
  const t = (r: CoverageRow) => {
    const v = Date.parse(r.at ?? "");
    return Number.isFinite(v) ? v : Number.POSITIVE_INFINITY;
  };
  return rows.sort((a, b) => Number(a.self) - Number(b.self) || t(a) - t(b) || a.id.localeCompare(b.id));
}

/** Drawer is for clusters with 2+ independent sources; single-source rows keep inline expand. */
export function opensDrawer(r: { multiSource: boolean }): boolean {
  return r.multiSource;
}

export function scoreContribution(sources: number): string {
  return `score contribution ×${corroborationMultiplier(sources).toFixed(2)} (${sources} SRC)`;
}

let HHMM_FMT: Intl.DateTimeFormat | undefined;

export function istanbulHHMM(iso: string | null): string {
  const t = Date.parse(iso ?? "");
  if (!Number.isFinite(t)) return "--:--";
  HHMM_FMT ??= new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return HHMM_FMT.format(t);
}

/** `N SRC · first seen HH:MM · age 4h · NEW|▲2|▼1` (mark omitted when there is none). */
export function drawerKicker(o: { sources: number; firstSeen: string | null; age: string; mark?: string | null }): string {
  const parts = [`${o.sources} SRC`, `first seen ${istanbulHHMM(o.firstSeen)}`, `age ${o.age}`];
  if (o.mark) parts.push(o.mark);
  return parts.join(" · ");
}

/** Next / previous drawer-capable id (wraps). Beat 9 j/k and drawer-internal next/prev use this. */
export function stepId(ids: readonly string[], cur: string | null, dir: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const i = cur == null ? -1 : ids.indexOf(cur);
  if (i < 0) return dir === 1 ? ids[0]! : ids[ids.length - 1]!;
  return ids[(i + dir + ids.length) % ids.length]!;
}

export function readStoryParam(search: string): string | null {
  const v = new URLSearchParams(search).get(STORY_PARAM);
  return v && v.length < 200 ? v : null;
}

/** New search string with ?story set/cleared, other params kept. */
export function writeStoryParam(search: string, id: string | null): string {
  const p = new URLSearchParams(search);
  if (id) p.set(STORY_PARAM, id);
  else p.delete(STORY_PARAM);
  const s = p.toString();
  return s ? `?${s}` : "";
}
