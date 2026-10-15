/**
 * PASS-C2 — renderers for the two generated config modules (ingest writes both every crawl):
 *   src/data/sage-desk-config.ts  tiny desk knobs (taste on / visible cap / weight) — in First Load
 *   src/data/sage-setup.ts        read-only ?view=setup payload — lazy chunk only, never First Load
 * Pure: no node:fs (the loader is sage-config-disk.ts).
 */
import type { SageConfig, SourceId } from "./sage-config-types";
import { orderTasteShelf } from "./x-taste-meter";

/** Config source id → A4 soft-fail meter chip id. */
export function softMeterSourceId(id: SourceId): string {
  const m: Partial<Record<SourceId, string>> = { hf_papers: "hf", lab_rss: "rss", x_taste: "x_session", analyst_rss: "anl", releases_atom: "rel" };
  return m[id] ?? id;
}

/** Config source id → crawl_sources[] row id in ingest-last.json. */
export const CRAWL_ROW_ID: Record<SourceId, string | null> = {
  hn: "hn",
  hf_papers: "hf",
  lab_rss: "rss_labs",
  sec_rss: "rss_security",
  gnews: "gnews",
  github: "github",
  openalex: "openalex",
  crossref: "crossref",
  arxiv: "arxiv",
  wikidata: "wikidata",
  gmail: null,
  x_taste: null,
  analyst_rss: "rss_analyst",
  releases_atom: "releases_atom",
};

export type SetupLoaded = {
  config: SageConfig;
  config_hash: string;
  status: "ok" | "invalid";
  used: "committed" | "last-good" | "defaults";
  errors: string[];
  since_commit: string | null;
  since_at: string | null;
};

export type SetupSourceRow = {
  id: SourceId;
  on: boolean;
  caps: string;
  last_rows: number | null;
  state: string;
};

export type SageSetupView = {
  stamped_at: string;
  config_path: string;
  config_hash: string;
  status: "ok" | "invalid";
  used: "committed" | "last-good" | "defaults";
  errors: string[];
  since_commit: string | null;
  since_at: string | null;
  sources: SetupSourceRow[];
  keywords: { id: string; terms: string[] }[];
  taste: { weight: number; max: number };
};

function capsText(id: SourceId, c: SageConfig): string {
  const s = c.sources[id] as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(s)) {
    if (k === "on") continue;
    if (Array.isArray(v)) parts.push(`${k} ${v.length}`);
    else parts.push(`${k} ${String(v)}`);
  }
  return parts.join(" · ") || "—";
}

export function buildSetupView(
  l: SetupLoaded,
  crawl: { stamp: string; rows: { id: string; rows: number; status: string; reason: string | null }[] },
): SageSetupView {
  const sources = (Object.keys(l.config.sources) as SourceId[]).map((id): SetupSourceRow => {
    const on = l.config.sources[id].on;
    const rid = CRAWL_ROW_ID[id];
    const row = rid ? crawl.rows.find((r) => r.id === rid) : undefined;
    const state = !on ? "off" : row ? (row.status === "ok" ? "ok" : row.status === "paused" ? "paused" : "soft-fail") : id === "gmail" || id === "x_taste" ? "box-only" : "—";
    return { id, on, caps: capsText(id, l.config), last_rows: on && row ? row.rows : null, state };
  });
  return {
    stamped_at: crawl.stamp,
    config_path: "desk/config/sage-sources.json",
    config_hash: l.config_hash,
    status: l.status,
    used: l.used,
    errors: l.errors.slice(0, 8).map((e) => e.slice(0, 160)),
    since_commit: l.since_commit,
    since_at: l.since_at,
    sources,
    keywords: Object.entries(l.config.keywords).map(([id, terms]) => ({ id, terms: [...terms] })),
    taste: { ...l.config.taste },
  };
}

export function renderSageSetupTs(
  l: SetupLoaded,
  crawl: { stamp: string; rows: { id: string; rows: number; status: string; reason: string | null }[] },
): string {
  const v = buildSetupView(l, crawl);
  return `/** PASS-C2 ?view=setup payload — written by ingest. LAZY chunk only (dynamic import); never First Load. */
import type { SageSetupView } from "@/lib/sage-setup";

export const SAGE_SETUP: SageSetupView = ${JSON.stringify(v, null, 2)};
`;
}

export type SageDeskConfig = { taste_on: boolean; taste_visible_cap: number; taste_weight: number; taste_idx: number[] | null };
export type TasteCtx = { items: readonly { id: string; text: string }[]; pulseTitles: readonly string[] };

/**
 * Desk knobs (taste shelf only). `taste_idx` = which snapshot items the shelf shows, in which order:
 * null ⇒ all, snapshot order (on + weight 0 — the default); [] ⇒ x_taste off; else the taste.weight order
 * computed here against the crawl's Pulse headlines. The desk just maps indexes (no ranking code in First Load).
 */
export function deskConfigOf(c: SageConfig, taste: TasteCtx = { items: [], pulseTitles: [] }): SageDeskConfig {
  const w = c.taste.weight;
  let idx: number[] | null = null;
  if (!c.sources.x_taste.on) idx = [];
  else if (w > 0) {
    const pos = new Map(taste.items.map((it, i) => [it, i]));
    const order = orderTasteShelf(taste.items, w, taste.pulseTitles).map((it) => pos.get(it)!);
    if (order.some((v, i) => v !== i)) idx = order;
  }
  return { taste_on: c.sources.x_taste.on, taste_visible_cap: c.sources.x_taste.visible_cap, taste_weight: w, taste_idx: idx };
}

export function renderSageDeskConfigTs(l: { config: SageConfig }, taste?: TasteCtx): string {
  const d = deskConfigOf(l.config, taste);
  return `/** PASS-C2 desk knobs from desk/config/sage-sources.json (written by ingest / taste refresh). Taste shelf only. */
export const SAGE_DESK_CONFIG: { taste_on: boolean; taste_visible_cap: number; taste_weight: number; taste_idx: readonly number[] | null } = {
  taste_on: ${d.taste_on},
  taste_visible_cap: ${d.taste_visible_cap},
  taste_weight: ${d.taste_weight},
  taste_idx: ${JSON.stringify(d.taste_idx)},
};
`;
}

