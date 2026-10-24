/**
 * PASS-C2 — renderers for the two generated config modules (ingest writes both every crawl):
 *   src/data/sage-desk-config.ts  tiny desk knobs (taste on / visible cap / weight) — in First Load
 *   src/data/sage-setup.ts        read-only ?view=setup payload — lazy chunk only, never First Load
 * Pure: no node:fs (the loader is sage-config-disk.ts).
 */
import type { SageConfig, SourceId } from "./sage-config-types";
import { orderTasteShelf } from "./x-taste-meter";
import type { SageLimits } from "./sage-config-rules";
import { GMAIL_NEWS, GMAIL_NEWS_AT } from "@/data/gmail-news";
import { X_TASTE } from "@/data/x-taste";

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
  /** Intel plan 6: box-only sources show their committed snapshot (rows + stamp) instead of "never on page". */
  snapshot?: { rows: number; at: string | null };
};

/** Box-only snapshots as committed (Gmail export / X taste refresh). */
export function boxSnapshots(): Partial<Record<SourceId, { rows: number; at: string | null }>> {
  return {
    gmail: { rows: GMAIL_NEWS.length, at: GMAIL_NEWS_AT || null },
    x_taste: { rows: X_TASTE.items?.length ?? 0, at: X_TASTE.captured_at || null },
  };
}

export { SNAPSHOT_STALE_H, snapshotLabel } from "./snapshot-label";

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
  keywords: { id: string; terms: string[]; count?: number }[];
  /** Lists kept off the published page (box-only addresses): list id → term count. */
  redacted?: Record<string, number>;
  taste: { weight: number; max: number };
  /** PASS-C3.1 (scripts/desk-view.ts + ingest): the rule inputs from code, for the browser editor. */
  limits?: SageLimits;
  /** PASS-C3.1: the committed desk/config/sage-sources.json as parsed (null = unreadable / bad JSON). */
  config?: unknown;
  /** PASS-C3.1: sha256 of the committed file bytes (the draft's base_hash). */
  file_hash?: string;
};

/** PASS-C3.1 editor fields (written next to the C2 view; see sage-config-disk.ts setupEditFields). */
export type SetupEditFields = { limits: SageLimits; config: unknown; file_hash: string };

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
  snaps: Partial<Record<SourceId, { rows: number; at: string | null }>> = boxSnapshots(),
): SageSetupView {
  const sources = (Object.keys(l.config.sources) as SourceId[]).map((id): SetupSourceRow => {
    const on = l.config.sources[id].on;
    const rid = CRAWL_ROW_ID[id];
    const row = rid ? crawl.rows.find((r) => r.id === rid) : undefined;
    const state = !on ? "off" : row ? (row.status === "ok" ? "ok" : row.status === "paused" ? "paused" : "soft-fail") : id === "gmail" || id === "x_taste" ? "box-only" : "—";
    const snap = state === "box-only" ? snaps[id] : undefined;
    return { id, on, caps: capsText(id, l.config), last_rows: on && row ? row.rows : null, state, ...(snap ? { snapshot: snap } : {}) };
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

/**
 * The ?view=setup module. PASS-C3: the editor fields repeat the code defaults several times (limits.defaults, the
 * baseline lists, the committed config, the C2 keyword lists), so every repeat of a defaults sub-tree is emitted as a
 * reference to one `D` const — same values, ~half the lazy-chunk bytes. Deterministic (same input ⇒ same text).
 */
/** Lists whose terms never reach Pages (Gmail sender addresses stay in desk/config for box use only). */
export const SETUP_REDACTED_LISTS = ["gmail_senders"] as const;

/** Publish boundary: the setup payload shows only a count for redacted lists — no address anywhere in the module. */
export function redactSetupForPage(v: SageSetupView): SageSetupView {
  const out: SageSetupView = JSON.parse(JSON.stringify(v));
  const red: Record<string, number> = { ...(out.redacted ?? {}) };
  for (const id of SETUP_REDACTED_LISTS) {
    const kw = out.keywords.find((k) => k.id === id);
    if (kw) {
      red[id] = kw.count ?? kw.terms.length;
      kw.count = red[id];
      kw.terms = [];
    }
    const cfg = out.config as { keywords?: Record<string, unknown> } | undefined;
    if (cfg?.keywords && id in cfg.keywords) {
      if (!(id in red)) red[id] = Array.isArray(cfg.keywords[id]) ? (cfg.keywords[id] as unknown[]).length : 0;
      delete cfg.keywords[id];
    }
    if (out.limits) {
      const d = out.limits.defaults.keywords as unknown as Record<string, string[]>;
      if (d && id in d) d[id] = [];
    }
  }
  if (Object.keys(red).length) out.redacted = red;
  return out;
}

export function renderSageSetupModule(view: SageSetupView): string {
  const v = redactSetupForPage(view);
  const D = v.limits?.defaults;
  const refs = new Map<string, string>();
  const walk = (x: unknown, path: string) => {
    if (typeof x !== "object" || x === null) return;
    const k = JSON.stringify(x);
    if (k.length > 24 && !refs.has(k)) refs.set(k, path);
    for (const [key, y] of Object.entries(x)) walk(y, Array.isArray(x) ? `${path}[${key}]` : `${path}.${key}`);
  };
  if (D) walk(D, "D");
  const ser = (x: unknown, ind: string, top = false, noRef = false): string => {
    if (typeof x !== "object" || x === null) return JSON.stringify(x);
    const ref = top || noRef ? undefined : refs.get(JSON.stringify(x));
    if (ref) return ref;
    const next = `${ind}  `;
    if (Array.isArray(x)) return x.length ? `[\n${x.map((y) => next + ser(y, next, false, noRef)).join(",\n")}\n${ind}]` : "[]";
    const e = Object.entries(x).filter(([, y]) => y !== undefined);
    return e.length ? `{\n${e.map(([k, y]) => `${next}${JSON.stringify(k)}: ${ser(y, next, false, noRef)}`).join(",\n")}\n${ind}}` : "{}";
  };
  return `/** PASS-C2/C3 ?view=setup payload — written by ingest + scripts/desk-view.ts. LAZY chunk only (dynamic import); never First Load. */
import type { SageSetupView } from "@/lib/sage-setup";
${D ? `\n/** Code defaults — referenced below wherever the same values repeat. */\nconst D: NonNullable<SageSetupView["limits"]>["defaults"] = ${ser(D, "", true, true)};\n` : ""}
export const SAGE_SETUP: SageSetupView = ${ser(v, "", true)};
`;
}

export function renderSageSetupTs(
  l: SetupLoaded,
  crawl: { stamp: string; rows: { id: string; rows: number; status: string; reason: string | null }[] },
  edit?: SetupEditFields,
): string {
  return renderSageSetupModule({ ...buildSetupView(l, crawl), ...(edit ?? {}) });
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

