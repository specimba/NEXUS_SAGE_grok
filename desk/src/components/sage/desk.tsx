"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CYCLE, WAVES, WAVE_TIMELINE } from "@/data/cycle";
import { CRAWL, CRAWL_AT } from "@/data/x-crawl";
import { HN_PULSE } from "@/data/hn-pulse";
import { RSS_LABS } from "@/data/rss-labs";
import { GNEWS_RSS } from "@/data/gnews-rss";
import { RSS_SECURITY } from "@/data/rss-security";
import { PULSE_CLUSTERS, PULSE_CLUSTERS_AT } from "@/data/pulse-clusters";
import { SOURCE_HEALTH, SOURCE_HEALTH_AT } from "@/data/source-health";
import { X_TASTE } from "@/data/x-taste";
import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE } from "@/data/digest-pack";
import { DIGEST_CADENCE } from "@/data/digest-cadence";
import { RANK_CURRENT, RANK_MOVED, RANK_PREV } from "@/data/corroboration-rank";
import { LEAD_HELD, LEAD_TODAY, LEAD_YESTERDAY } from "@/data/lead-pick";
import { WIRE_CRAWL_AT, WIRE_PREV_CRAWL_AT, WIRE_ROWS } from "@/data/wire";
import { istanbulHHMM, wireHeader, wireMark } from "@/lib/wire";
import { PAPERS } from "@/data/papers";
import { SHELF } from "@/data/shelf";
import { WIKIDATA_DENY_LAST } from "@/data/wikidata-deny-last";
import { SOFT_FAIL_METERS } from "@/data/soft-fail-meters";
import { isDigestDue, nextDue, PACK_KEY, renderPlan, renderReport } from "@/lib/digest-pack";
import { crawlAgeHours } from "@/lib/x-pulse";
import { crawlFreshness, STALE_GUARD_HOURS } from "@/lib/crawl-staleness";
import {
  buildRows,
  compactAge,
  healthCellState,
  healthTicks,
  HEALTH_TICKS,
  labBadge,
  PULSE_V5_MAX_ROWS,
  sigCell,
  buildPaperRows,
  type PaperInput,
  type ClusterInput,
  type PulseMemberInfo,
  type PulseV5Row,
} from "@/lib/pulse-v5";
import { cn } from "@/lib/cn";
import { isLane, laneTabs, type Lane } from "@/lib/lanes";
import {
  buildCoverage,
  drawerKicker,
  opensDrawer,
  readStoryParam,
  scoreContribution,
  type MemberItem,
} from "@/lib/story-drawer";
import { useStoryDrawer } from "@/lib/use-story-drawer";
import { isTypingTarget, KEY_MAP, matchesFilter, resolveKey, stepSelection } from "@/lib/keys";
import { writeStoryParam } from "@/lib/story-drawer";

function laneFromHash(): Lane {
  const raw = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  if (isLane(raw)) return raw;
  // A linked story drawer (?story=<clusterId>) lives on Pulse.
  return typeof window !== "undefined" && readStoryParam(window.location.search) ? "pulse" : "brief";
}

function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

type DeskProps = {
  buildId?: string;
  serverStartedAt?: string;
};

/** Beat 9 — filter + story hand-off shared with lane tables (one global key handler lives in Desk). */
type DeskKeys = { q: string; report: (shown: number, total: number) => void; openStory: (id: string) => void };
const DeskKeysCtx = createContext<DeskKeys>({ q: "", report: () => {}, openStory: () => {} });
const useDeskKeys = () => useContext(DeskKeysCtx);

const NAV_ROWS = ".desk-stage [data-nav-row]";

export function Desk({ buildId = "dev", serverStartedAt = "" }: DeskProps) {
  const [lane, setLane] = useState<Lane>("brief");
  // Tabs light only after the hash is read — SSR default "brief" must never paint as filled on another lane.
  const [laneReady, setLaneReady] = useState(false);
  const buildShort = buildId.length > 12 ? buildId.slice(0, 12) : buildId;
  useEffect(() => {
    setLane(laneFromHash());
    setLaneReady(true);
    const onHash = () => setLane(laneFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = useCallback((id: Lane) => {
    setLane(id);
    if (typeof window !== "undefined") window.location.hash = id;
  }, []);

  // ── Beat 9 · keyboard control ──
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState<{ shown: number; total: number } | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const sel = useRef<Partial<Record<Lane, number>>>({});
  const pendingG = useRef<number | null>(null);
  const live = useRef({ lane, keymapOpen, filterOpen, q });
  live.current = { lane, keymapOpen, filterOpen, q };

  const report = useCallback((shown: number, total: number) => setCounts({ shown, total }), []);
  const openStory = useCallback(
    (id: string) => {
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", `${pathname}${writeStoryParam(search, id)}#pulse`);
      go("pulse");
    },
    [go],
  );
  const keysCtx = useMemo(() => ({ q, report, openStory }), [q, report, openStory]);

  const navRows = () => [...document.querySelectorAll<HTMLElement>(NAV_ROWS)];
  const select = useCallback((idx: number, focus: boolean) => {
    const rows = navRows();
    for (const r of rows) r.removeAttribute("data-nav-selected");
    const el = rows[idx];
    if (!el) return;
    sel.current[live.current.lane] = idx;
    el.setAttribute("data-nav-selected", "1");
    if (focus) el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest" });
  }, []);
  const clearFilter = useCallback(() => {
    setQ("");
    setFilterOpen(false);
  }, []);

  // Lane change: drop the filter, re-mark the remembered row for that lane (no focus steal).
  useEffect(() => {
    setQ("");
    setFilterOpen(false);
    setCounts(null);
    const id = window.requestAnimationFrame(() => {
      const i = sel.current[lane];
      if (i != null && i >= 0) select(Math.min(i, navRows().length - 1), false);
    });
    return () => window.cancelAnimationFrame(id);
  }, [lane, select]);

  useEffect(() => {
    if (filterOpen) filterRef.current?.focus();
  }, [filterOpen]);

  // ONE global keydown listener for the whole desk; removed on unmount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof HTMLElement ? e.target : null;
      const L = live.current;
      const action = resolveKey(e, {
        typing: isTypingTarget(t),
        inFilter: t?.dataset.filterPrompt === "1",
        targetActivates: !!t && t !== document.body && !!t.closest("button, a[href], [role='button'], [data-nav-row]"),
        keymapOpen: L.keymapOpen,
        pendingG: pendingG.current != null,
      });
      if (!action) return;
      if (pendingG.current != null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
      }
      const drawer = document.querySelector<HTMLElement>(".story-drawer");
      const rows = navRows();
      const cur = sel.current[L.lane] ?? -1;
      const click = (sel: string) => document.querySelector<HTMLElement>(sel)?.click();
      e.preventDefault();
      switch (action.t) {
        case "lane":
          if (drawer) click("[data-drawer-close]");
          go(action.lane);
          return;
        case "next":
        case "prev":
          if (drawer) return click(action.t === "next" ? "[data-drawer-next]" : "[data-drawer-prev]");
          return select(stepSelection(cur, rows.length, action.t === "next" ? 1 : -1), true);
        case "first":
          return select(0, true);
        case "last":
          return select(rows.length - 1, true);
        case "g":
          pendingG.current = window.setTimeout(() => (pendingG.current = null), 700);
          return;
        case "enter":
          return rows[cur]?.click();
        case "open": {
          const href = rows[cur]?.dataset.href;
          if (href) window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        case "escape":
          if (L.keymapOpen) return setKeymapOpen(false);
          if (drawer) return click("[data-drawer-close]");
          if (L.filterOpen || L.q) {
            clearFilter();
            window.requestAnimationFrame(() => navRows()[sel.current[L.lane] ?? -1]?.focus({ preventScroll: true }));
          }
          return;
        case "filter":
          return setFilterOpen(true);
        case "keymap":
          return setKeymapOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, select, clearFilter]);

  const age = crawlAgeHours(CRAWL_AT);
  const fresh = crawlFreshness(CRAWL_AT);
  return (
    <div className="desk-shell relative">
      <div className="scanline pointer-events-none absolute inset-0 z-50" aria-hidden />
      <header className="desk-topbar px-4 py-2 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="desk-brand block-cursor text-kicker text-phosphor">SAGE://DESK</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-display text-2xl tracking-[0.12em] text-phosphor-bright">
                  CYC/{CYCLE.id}
                </h1>
                <span className="text-sm text-muted">{CYCLE.window}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="desk-chip desk-chip-quiet">STABLE</span>
              <span
                className={cn("desk-chip tabular-nums", age.stale ? "desk-chip-warn sage-stale-chip" : "desk-chip-live")}
                data-crawl-state={fresh.label}
                role="status"
                title={`crawl age ${fresh.hours.toFixed(1)}h · STALE after ${STALE_GUARD_HOURS}h (4h routine)`}
              >
                {fresh.label} {fresh.hours.toFixed(1)}H
              </span>
              <span className="desk-chip desk-chip-live tabular-nums" title="crawl snap">
                crawl {CRAWL_AT}
              </span>
              <span className="desk-chip desk-chip-quiet tabular-nums" title="cycle compile">cyc {CYCLE.compiledAt}</span>
            </div>
          </div>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            ingest · snap {CRAWL_AT} · pack {PACK_AT} · lead {LEAD_TODAY?.cluster_id ?? CYCLE.pins[0]?.id}
          </p>
          <div className="desk-ticker" aria-label="What changed">
            <span className="desk-ticker-label">Δ LIVE</span>
            <div className="desk-ticker-track">
              <span className="desk-ticker-item">
                <span className="tabular-nums">{CRAWL_AT.slice(11, 16)}Z</span> crawl {age.stale ? "STALE" : "FRESH"}
              </span>
              <span className="desk-ticker-item">
                <span className="tabular-nums">{DIGEST_CADENCE.last_at.slice(11, 16)}Z</span> digest HOLD→{DIGEST_CADENCE.next_at.slice(11, 16)}Z
              </span>
              <span className="desk-ticker-item">
                lead {LEAD_TODAY?.cluster_id ?? CYCLE.pins[0]?.id} · Sol≠Astra
              </span>
              <span className="desk-ticker-item">
                wikidata {WIKIDATA_DENY_LAST.hints.filter((h) => h.status === "rejected_false_friend").length} reject · {WIKIDATA_DENY_LAST.hints.filter((h) => h.status === "matched").length} match · brief=false
              </span>
              <span className="desk-ticker-item">
                visual phosphor · [01] lanes · no frontpage
              </span>
            </div>
          </div>
          <nav className="desk-lane" aria-label="Lanes">
            {laneTabs(lane, laneReady).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                aria-current={t.active ? "page" : undefined}
                data-active={t.active ? "1" : "0"}
                className={cn("desk-lane-btn focus-phosphor", t.active && "block-cursor")}
              >
                <span className="lane-prefix" aria-hidden>
                  {t.prefix}
                </span>
                {t.id}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:px-6">
        <div className="desk-stage sage-ticks relative overflow-hidden">
          <div className="crt-rain" aria-hidden />
          <div className="desk-stage-rail relative z-10">
            <span className="block-cursor">&gt; lane · {lane}</span>
            {q && !filterOpen ? (
              <button type="button" className="desk-filter-chip focus-phosphor" onClick={clearFilter} aria-label={`Clear filter ${q}`}>
                filter: {q} ×
              </button>
            ) : null}
            <span className="tabular-nums">policy {CYCLE.leadPolicy} · pins {CYCLE.pins.length}/3</span>
          </div>
          <div className="relative z-10 p-3 md:p-4">
            <DeskKeysCtx.Provider value={keysCtx}>
            {lane === "brief" ? <Brief /> : null}
            {lane === "pulse" ? <Pulse /> : null}
            {lane === "digest" ? <Digest /> : null}
            {lane === "papers" ? <Papers /> : null}
            {lane === "voice" ? <Voice /> : null}
            {lane === "governance" ? <Gov /> : null}
            </DeskKeysCtx.Provider>
          </div>
        </div>
      </main>
      {filterOpen ? (
        <div className="desk-filter-prompt" role="search">
          <label className="desk-filter-inner">
            <span className="desk-filter-prefix">&gt; filter:</span>
            <input
              ref={filterRef}
              data-filter-prompt="1"
              className="desk-filter-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                  setFilterOpen(false);
                  window.requestAnimationFrame(() => select(0, true));
                }
              }}
              aria-label="Filter rows"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="desk-filter-count tabular-nums">{counts ? `${counts.shown}/${counts.total}` : "—"}</span>
          </label>
        </div>
      ) : null}
      {keymapOpen ? (
        <div className="desk-keymap-scrim" onClick={() => setKeymapOpen(false)}>
          <div
            className="desk-keymap"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desk-keymap-title"
            tabIndex={-1}
            ref={(el) => el?.focus()}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="desk-keymap-title" className="desk-keymap-title">
              keys · desk
            </p>
            <dl className="desk-keymap-grid">
              {KEY_MAP.map(([k, a]) => (
                <div key={k} className="desk-keymap-row">
                  <dt>
                    {k.split(" ").map((part, i) =>
                      part === "/" && k !== "/" ? (
                        <span key={i} className="desk-keymap-sep"> / </span>
                      ) : (
                        <kbd key={i} className="desk-keycap">
                          {part}
                        </kbd>
                      ),
                    )}
                  </dt>
                  <dd>{a}</dd>
                </div>
              ))}
            </dl>
            <p className="desk-keymap-foot">Ctrl / Cmd / Alt keys stay with the browser · Esc close</p>
          </div>
        </div>
      ) : null}
      <footer
        className="desk-footer relative z-10 mx-auto max-w-7xl px-4 pb-3 pt-1 md:px-6"
        data-sage-build={buildId}
        data-sage-boot={serverStartedAt || undefined}
        aria-label="Build health"
      >
        <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
          {`build ${buildShort}${serverStartedAt ? ` · boot ${serverStartedAt}` : ""}`}
          <span className="desk-keys-hint"> · ? keys</span>
        </p>
      </footer>
    </div>
  );
}

/** Beat 4 — corroboration rank lookups (lead pinned; hf-incident pin ↔ hf-swarm digest row). */
const RANK_BY_ID = new Map(RANK_CURRENT.rows.map((r) => [r.id, r]));
function rankFor(id: string) {
  return RANK_BY_ID.get(id) ?? (id === "hf-incident" ? RANK_BY_ID.get("hf-swarm") : undefined);
}
function byCorroboration<T extends { id: string; kind: string }>(items: T[]): T[] {
  const lead = items.filter((i) => i.kind === "lead");
  const rest = items.filter((i) => i.kind !== "lead" && i.kind !== "drop");
  const drop = items.filter((i) => i.kind === "drop");
  const idx = new Map(items.map((i, k) => [i.id, k]));
  rest.sort(
    (a, b) =>
      (rankFor(a.id)?.rank ?? 99) - (rankFor(b.id)?.rank ?? 99) || (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0),
  );
  return [...lead, ...rest, ...drop];
}
function SrcChip({ id }: { id: string }) {
  const r = rankFor(id);
  if (!r) return null;
  return (
    <span
      className={cn("sage-src-chip tabular-nums", r.sources > 1 && "sage-src-chip-multi")}
      title={`${r.sources} independent sources · ×${r.mult} · ${r.source_keys.join(" · ")}`}
    >
      {r.sources} SRC
    </span>
  );
}

/** Beat 7 — Brief Wire strip: top 3–5 live clusters with ≥2 independent sources, NEW/▲/▼ vs previous crawl. */
function BriefWire() {
  const [now, setNow] = useState(() => Date.parse(WIRE_CRAWL_AT));
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const { q, report, openStory } = useDeskKeys();
  const rows = useMemo(() => WIRE_ROWS.filter((r) => matchesFilter(q, [r.title])), [q]);
  useEffect(() => report(rows.length, WIRE_ROWS.length), [rows.length, report]);
  if (WIRE_ROWS.length === 0) return null;
  return (
    <section className="brief-wire sage-panel sage-ticks lg:col-span-6" aria-label="Wire — live multi-source clusters">
      <div className="brief-wire-head">
        <span>{wireHeader(WIRE_CRAWL_AT, WIRE_ROWS)}</span>
        <span className="brief-wire-prev tabular-nums">
          {WIRE_PREV_CRAWL_AT ? `vs ${istanbulHHMM(WIRE_PREV_CRAWL_AT)}` : "first crawl"}
        </span>
      </div>
      <ol className="brief-wire-list">
        {rows.map((r) => {
          const mark = wireMark(r);
          return (
            <li
              key={r.id}
              className="brief-wire-row"
              data-status={r.status}
              data-nav-row
              data-href={r.url}
              tabIndex={-1}
              onClick={(e) => {
                // Enter (via the desk key handler) or a click on the row body opens the story drawer on Pulse.
                if ((e.target as HTMLElement).closest("a")) return;
                openStory(r.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.target === e.currentTarget) {
                  e.preventDefault();
                  openStory(r.id);
                }
              }}
            >
              <span className="brief-wire-mark tabular-nums">
                {r.status === "new" ? <span className="pulse-v5-new">NEW</span> : mark}
              </span>
              <span className="pulse-v5-age tabular-nums">{compactAge(r.at, now)}</span>
              <a className="brief-wire-headline focus-phosphor" href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <span className="sage-src-chip sage-src-chip-multi tabular-nums">{r.sources} SRC</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Brief() {
  const lead = LEAD_TODAY;
  const age = crawlAgeHours(CRAWL_AT);
  const waveMax = 956;
  const waveVals: Record<number, number> = { 1: 80, 2: 700, 3: 956 };
  const pip = [
    { id: "board", label: "board", val: "1,200", pct: 100, hot: false },
    { id: "hf", label: "HF wave", val: "~700", pct: Math.round((700 / 1200) * 100), hot: true },
    { id: "secrets", label: "secrets", val: "956", pct: Math.round((956 / 1200) * 100), hot: false },
  ] as const;
  return (
    <div className="brief-v5 grid gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
      {/* Left · Pip-Boy needle rail */}
      <aside
        className="sage-panel sage-ticks sage-instrument sage-pip-rail flex flex-col gap-1 px-2 py-2 lg:col-span-2 lg:row-span-3"
        aria-label="Cycle 003 board instrument rail"
      >
        <p className="font-mono text-kicker uppercase tracking-kicker text-amber">rail · cyc/003 board</p>
        {pip.map((g) => (
          <div key={g.id} className="sage-pip-gauge">
            <div className="sage-pip-track" role="img" aria-label={`${g.label} ${g.pct}%`}>
              <div className="sage-pip-fill" style={{ height: `${g.pct}%` }} />
              <div className="sage-pip-needle" style={{ bottom: `calc(${g.pct}% - 1px)` }} />
            </div>
            <div className="sage-pip-meta min-w-0">
              <p className="sage-pip-label">{g.label}</p>
              <p className={cn("sage-pip-val", g.hot && "sage-pip-val-hot")}>{g.val}</p>
            </div>
          </div>
        ))}
        <div className="mt-auto border-t border-line pt-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">crawl</p>
          <p
            className={cn(
              "font-mono text-kicker uppercase tracking-kicker tabular-nums",
              age.stale ? "sage-stale" : "sage-signal",
            )}
          >
            {age.stale ? `STALE ${age.hours.toFixed(1)}h` : `FRESH ${age.hours.toFixed(1)}h`}
          </p>
          <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {CRAWL_AT.slice(11, 19)}Z
          </p>
        </div>
      </aside>

      {/* Mid · inverse story plate — brightest surface */}
      <section
        className="sage-panel sage-ticks sage-bento-hero sage-take sage-take-inverse px-3 py-3 lg:col-span-6 lg:row-span-1"
        aria-label="Brief take story"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker">Take · lead of the day</p>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {lead ? `${lead.reason === "seed" ? "cycle 003 seed" : "daily pick"} · ${lead.date}` : "no pick yet"}
          </span>
        </div>
        {LEAD_HELD ? <p className="sage-lead-held font-mono text-kicker uppercase tracking-kicker">HELD · no qualifying story</p> : null}
        <div className="sage-take-plate">
          <h2 className="sage-take-title font-display text-2xl font-bold normal-case tracking-normal md:text-3xl">
            {lead?.url ? (
              <a href={lead.url} target="_blank" rel="noreferrer" className="sage-take-link">
                {lead.headline}
              </a>
            ) : (
              lead?.headline ?? CYCLE.exec[0]
            )}
          </h2>
        </div>
        {lead && lead.reason !== "seed" ? (
          <p className="sage-take-meta font-mono text-kicker uppercase tracking-kicker tabular-nums">
            <span className="sage-src-chip sage-src-chip-multi">{lead.sources} SRC</span>
            {" "}· sig {lead.sig ?? "—"} · picked {istanbulHHMM(lead.at)} UTC+3{lead.forced ? " · manual" : ""} · sticky 24h
          </p>
        ) : (
          <ul className="sage-take-body max-w-prose space-y-1.5 text-sm">
            {CYCLE.exec.slice(1).map((line) => (
              <li key={line} className="border-l-2 pl-3">
                {line}
              </li>
            ))}
          </ul>
        )}
        {LEAD_YESTERDAY ? (
          <p className="sage-take-yesterday text-sm">
            <span className="font-mono text-kicker uppercase tracking-kicker">Yesterday · {LEAD_YESTERDAY.date}</span>{" "}
            <span className="line-clamp-1">{LEAD_YESTERDAY.headline}</span>
          </p>
        ) : null}
      </section>

      {/* Under the Take · Beat 7 Wire — live multi-source clusters; never displaces lead/Take */}
      <BriefWire />

      {/* Pins — dense stack · compact legend rail */}
      <div className="pin-col flex flex-col gap-1.5 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-3">
        <div
          className="pin-legend-rail sage-panel sage-ticks flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
          aria-label="Pin legend"
        >
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">pins</span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-amber">companion</span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">rest</span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">context</span>
          <span className="ml-auto font-mono text-kicker uppercase tracking-kicker text-subtle">
            Sol≠Astra · ≠2nd lead
          </span>
        </div>
        <ol className="flex flex-col gap-1.5">
          {/* Daily lead lives on the Take; the old cycle-003 lead pin is demoted to context, last. */}
          {[
            ...byCorroboration(CYCLE.pins).filter((p) => p.kind !== "lead"),
            ...CYCLE.pins.filter((p) => p.kind === "lead"),
          ].map((p) => {
              const ctx = p.kind === "lead";
              return (
                <li
                  key={p.id}
                  className={cn("sage-panel sage-ticks pin-card pin-card-quiet px-2.5 py-2", ctx && "pin-card-context")}
                >
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    <span className={cn(p.kind === "companion" && "text-amber", p.kind === "rest" && "text-subtle")}>
                      {ctx ? "cycle 003 context" : p.kind}
                    </span>{" "}
                    · <span className="tabular-nums">{p.id}</span>
                    {!ctx ? (
                      <>
                        {" "}
                        <SrcChip id={p.id} />
                      </>
                    ) : null}
                  </p>
                  <h3 className="mt-0.5 font-display text-sm font-medium normal-case tracking-wide text-phosphor">
                    {p.title}
                  </h3>
                  <dl className="pin-meta pin-meta-dense mt-1">
                    <dt>take</dt>
                    <dd className="line-clamp-2">{p.take}</dd>
                    {!ctx ? (
                      <>
                        <dt className="sage-signal">move</dt>
                        <dd className="sage-signal line-clamp-2">{p.move}</dd>
                      </>
                    ) : null}
                  </dl>
                </li>
              );
            })}
        </ol>
      </div>

      {/* Under mid · denser wave strip */}
      <section
        className="sage-panel sage-ticks sage-wave-dense overflow-hidden lg:col-span-6 lg:col-start-3"
        aria-label="Three waves"
      >
        <div className="sage-panel-header">CYC/003 board · three waves</div>
        <div className="p-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            METR 1–2 · OpenAI 3 · not civilization chart
          </p>
          <ul className="mt-1.5 grid gap-1.5 md:grid-cols-6">
            {WAVES.map((w) => {
              const pct = Math.round(((waveVals[w.id] ?? 0) / waveMax) * 100);
              return (
                <li
                  key={w.id}
                  className={cn(
                    "sage-panel sage-ticks p-1.5",
                    w.id === 2 ? "md:col-span-3 sage-wave-hot" : w.id === 3 ? "md:col-span-2" : "md:col-span-1",
                  )}
                >
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    W{w.id} · {w.label} · {w.cite}
                  </p>
                  <p className="sage-metric mt-0.5 font-display tabular-nums text-phosphor-bright">{w.n}</p>
                  <div
                    className="sage-wave-bar mt-1.5 w-full"
                    role="img"
                    aria-label={`Wave ${w.id} relative size ${pct}%`}
                  >
                    <div style={{ width: `${pct}%`, height: "100%", opacity: 0.65 + pct / 200 }} />
                  </div>
                  <p className={cn("mt-1 text-xs text-muted", "line-clamp-2")}>{w.scope}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}


const HEALTH_LABEL: Record<string, string> = {
  hn: "HN",
  gnews: "GNW",
  rss_labs: "LAB",
  rss_security: "SEC",
  hf: "HF",
  arxiv: "ARX",
  crossref: "XREF",
  openalex: "OALX",
  github: "GH",
  wikidata: "WD",
};

const HEALTH_ORDER = ["hn", "gnews", "rss_labs", "rss_security", "hf", "arxiv", "crossref", "openalex", "github", "wikidata"];

function stripPublisher(title: string, publisher: string): string {
  const tail = ` - ${publisher}`;
  return publisher && title.endsWith(tail) ? title.slice(0, -tail.length) : title;
}

function useMembers(): Record<string, PulseMemberInfo> {
  return useMemo(() => {
    const m: Record<string, PulseMemberInfo> = {};
    for (const h of HN_PULSE) m[h.id] = { badge: "HN", publisher: `hn/${h.author}`, score: h.score, url: h.url };
    for (const g of GNEWS_RSS) m[g.id] = { badge: "GNW", publisher: g.publisher || "google news", url: g.link };
    for (const r of RSS_LABS)
      m[r.id] = { badge: labBadge(r.lab), publisher: r.lab, summary: r.summary || undefined, url: r.link };
    for (const s of RSS_SECURITY)
      m[s.id] = { badge: "SEC", publisher: s.lab, summary: s.summary || undefined, url: s.link, security: true };
    for (const p of CRAWL)
      m[`x:${p.id}`] = { badge: "X", publisher: `@${p.handle}`, score: p.likes, summary: `${p.take} — ${p.text}`, url: p.href };
    return m;
  }, []);
}

/** Beat 8 — every source's own headline + time, keyed by member id (story drawer coverage list). */
function useMemberItems(): Record<string, MemberItem> {
  return useMemo(() => {
    const m: Record<string, MemberItem> = {};
    for (const h of HN_PULSE) m[h.id] = { title: h.text, publisher: `hn/${h.author}`, badge: "HN", at: h.at, url: h.url };
    for (const g of GNEWS_RSS)
      m[g.id] = { title: stripPublisher(g.title, g.publisher), publisher: g.publisher || "google news", badge: "GNW", at: g.published, url: g.link };
    for (const r of RSS_LABS) m[r.id] = { title: r.title, publisher: r.lab, badge: labBadge(r.lab), at: r.published, url: r.link };
    for (const r of RSS_SECURITY) m[r.id] = { title: r.title, publisher: r.lab, badge: "SEC", at: r.published, url: r.link };
    return m;
  }, []);
}

const WIRE_BY_ID = new Map(WIRE_ROWS.map((r) => [r.id, r]));

/** Beat 8 — right side story drawer (Techmeme / Ground News). Pulse table stays visible, dimmed. */
function StoryDrawer({
  row,
  cluster,
  items,
  now,
  onClose,
  onNext,
  onPrev,
}: {
  row: PulseV5Row;
  cluster: ClusterInput;
  items: Record<string, MemberItem>;
  now: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const coverage = useMemo(() => buildCoverage(cluster, items), [cluster, items]);
  const wire = WIRE_BY_ID.get(row.id);
  const mark = wire && wire.status !== "same" ? wireMark(wire) : row.showNew ? "NEW" : null;
  const firstSeen = cluster.first_seen ?? coverage.find((c) => !c.self)?.at ?? row.at;
  const headId = `story-drawer-title-${row.id.replace(/[^a-z0-9]/gi, "-")}`;

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
  }, [row.id]);

  // Portal to <body>: the desk stage is its own stacking context (header would paint over the panel).
  return createPortal(
    <>
      <div className="story-drawer-scrim" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        className="story-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headId}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation(); // the desk's global Esc must not close twice
            onClose();
            return;
          }
          if (e.key !== "Tab" || !ref.current) return;
          // focus trap
          const f = [...ref.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
          if (f.length === 0) return;
          const first = f[0]!;
          const last = f[f.length - 1]!;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <header className="story-drawer-head">
          <div className="story-drawer-headrow">
            <h2 id={headId} className="story-drawer-title">
              {row.title}
            </h2>
            <button type="button" className="story-drawer-x focus-phosphor" data-drawer-close onClick={onClose} aria-label="Close story">
              ×
            </button>
          </div>
          <p className="story-drawer-kicker tabular-nums">
            {drawerKicker({ sources: row.sourceCount, firstSeen, age: compactAge(row.at, now), mark })}
          </p>
        </header>
        <ol className="story-drawer-list" aria-label="Coverage by source">
          {coverage.map((c) => (
            <li key={c.id} className="story-drawer-item" data-self={c.self ? "1" : undefined}>
              <p className="story-drawer-src tabular-nums">
                <span className={cn("pulse-v5-badge", c.self ? "pulse-v5-self" : c.lead ? "pulse-v5-src-lead" : "pulse-v5-also")}>
                  {c.badge}
                </span>{" "}
                {c.publisher} · {c.at ? `${istanbulHHMM(c.at)} · ${compactAge(c.at, now)}` : "time —"}
              </p>
              <p className="story-drawer-headline">{c.title}</p>
              {c.self ? <p className="story-drawer-selfcap">company&apos;s own post · counts 0</p> : null}
              {c.url ? (
                <a className="story-drawer-open sage-signal focus-phosphor" href={c.url} target="_blank" rel="noreferrer">
                  open ↗
                </a>
              ) : null}
            </li>
          ))}
        </ol>
        <footer className="story-drawer-foot tabular-nums">
          <span>{scoreContribution(row.sourceCount)}</span>
          <span className="story-drawer-nav">
            <button type="button" className="focus-phosphor" data-drawer-prev onClick={onPrev} aria-label="Previous story">
              ‹ prev
            </button>
            <button type="button" className="focus-phosphor" data-drawer-next onClick={onNext} aria-label="Next story">
              next ›
            </button>
            <span>Esc close</span>
          </span>
        </footer>
      </div>
    </>,
    document.body,
  );
}

/** Pulse V5 (Beat 3) — spec refs/UX-PULSE-V5.md. Operator X crawl posts join the one table as single-source X rows (not clusters). */
const X_ROWS: ClusterInput[] = CRAWL.map((p) => ({
  id: `x:${p.id}`,
  title: p.take,
  url: p.href,
  lead_id: `x:${p.id}`,
  lead_source: "x",
  sources: ["x"],
  member_ids: [`x:${p.id}`],
  size: 1,
  at: p.at,
  first_seen: null,
  is_new: false,
}));

function Pulse() {
  // First render = crawl stamp (SSR-stable); then wall clock.
  const [now, setNow] = useState(() => Date.parse(PULSE_CLUSTERS_AT));
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const members = useMembers();
  const { rows, baseline, newCount } = useMemo(
    () => buildRows([...PULSE_CLUSTERS, ...X_ROWS], members),
    [members],
  );
  // Beat 8: multi-source rows open the story drawer; single-source rows keep inline expand.
  const [openClusterId, setOpenClusterId] = useState<string | null>(null);
  const items = useMemberItems();
  const drawerIds = useMemo(() => rows.filter(opensDrawer).map((r) => r.id), [rows]);
  const drawer = useStoryDrawer(drawerIds);
  const clusterById = useMemo(() => new Map(PULSE_CLUSTERS.map((c) => [c.id, c as ClusterInput])), []);
  const drawerRow = drawer.openId ? rows.find((r) => r.id === drawer.openId) : undefined;
  const drawerCluster = drawer.openId ? clusterById.get(drawer.openId) : undefined;
  const [showAll, setShowAll] = useState(false);
  const [tasteAll, setTasteAll] = useState(false);
  const { q, report } = useDeskKeys();
  const filtered = useMemo(
    () => rows.filter((r) => matchesFilter(q, [r.title, r.leadBadge, ...r.alsoBadges, ...r.alsoPublishers, members[r.leadId]?.publisher])),
    [rows, q, members],
  );
  useEffect(() => report(filtered.length, rows.length), [filtered.length, rows.length, report]);
  const visible = showAll || q ? filtered : filtered.slice(0, PULSE_V5_MAX_ROWS);
  const fresh = crawlFreshness(CRAWL_AT, now);
  const health = [...SOURCE_HEALTH].sort(
    (a, b) => HEALTH_ORDER.indexOf(a.id) - HEALTH_ORDER.indexOf(b.id),
  );
  const tasteItems = tasteAll ? X_TASTE.items : X_TASTE.items.slice(0, 6);

  return (
    <div className="pulse-v5" data-baseline={baseline ? "1" : undefined} data-drawer={drawerRow ? "1" : undefined}>
      {drawerRow && drawerCluster ? (
        <StoryDrawer
          row={drawerRow}
          cluster={drawerCluster}
          items={items}
          now={now}
          onClose={drawer.close}
          onNext={drawer.next}
          onPrev={drawer.prev}
        />
      ) : null}
      {/* 1 · Health strip — ledger truth, one cell per source */}
      <div className="pulse-v5-health" role="list" aria-label="Source health ledger">
        {health.map((s) => {
          const state = healthCellState(s.state);
          const ticks = healthTicks(s.streak_ok);
          return (
            <span
              key={s.id}
              role="listitem"
              className="pulse-v5-health-cell"
              data-state={state}
              title={`${s.id} · ${s.state}${s.fail_reason ? ` · ${s.fail_reason}` : ""} · ok ${s.ok_7d}/${s.runs_7d} 7d · ledger ${SOURCE_HEALTH_AT}`}
            >
              <span className="pulse-v5-health-label">{HEALTH_LABEL[s.id] ?? s.id}</span>
              <span className="pulse-v5-ticks" aria-hidden>
                {Array.from({ length: HEALTH_TICKS }, (_, i) => (i < ticks ? "▮" : "▯")).join("")}
              </span>
              <span className="tabular-nums">
                {state === "ok" ? s.items_last : s.fail_reason?.replace(/^HTTP\s*/, "") || s.state.toUpperCase()}
              </span>
            </span>
          );
        })}
        <span className="pulse-v5-health-end">
          {baseline ? (
            <span className="pulse-v5-baseline" title={`${newCount}/${rows.length} rows first-seen this crawl — NEW plates suppressed`}>
              BASELINE · first crawl
            </span>
          ) : null}
          {fresh.stale ? (
            <span className="sage-stale pulse-v5-stale-plate tabular-nums" role="status" title={`STALE after ${STALE_GUARD_HOURS}h`}>
              STALE {fresh.hours.toFixed(1)}h
            </span>
          ) : (
            <span className="sage-signal tabular-nums" role="status">
              FRESH {fresh.hours.toFixed(1)}h
            </span>
          )}
        </span>
      </div>

      {/* 2 · Main grid — cluster table | Taste rail */}
      <div className="pulse-v5-grid">
        <section className="pulse-v5-table" aria-label="Pulse story clusters">
          <div className="pulse-v5-head" aria-hidden>
            <span>#</span>
            <span>NEW</span>
            <span className="pulse-v5-age">AGE</span>
            <span>HEADLINE</span>
            <span>SRC</span>
            <span className="pulse-v5-sig">SIG</span>
          </div>
          <ol>
            {visible.map((r, i) => {
              const inDrawer = opensDrawer(r);
              const open = inDrawer ? drawer.openId === r.id : openClusterId === r.id;
              const lead = members[r.leadId];
              const overflow = r.alsoBadges.length > 2 ? r.alsoBadges.length - 2 : 0;
              const sig = sigCell(r);
              return (
                <li key={r.id} className="pulse-v5-row" data-open={open ? "1" : undefined}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    aria-haspopup={inDrawer ? "dialog" : undefined}
                    data-story-row={inDrawer ? r.id : undefined}
                    data-nav-row
                    data-href={r.url}
                    className="pulse-v5-line focus-phosphor"
                    onClick={(e) =>
                      inDrawer
                        ? open
                          ? drawer.close()
                          : drawer.open(r.id, e.currentTarget)
                        : setOpenClusterId(open ? null : r.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (inDrawer) {
                          if (open) drawer.close();
                          else drawer.open(r.id, e.currentTarget);
                        } else setOpenClusterId(open ? null : r.id);
                      }
                    }}
                  >
                    <span className="pulse-v5-idx tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r.showNew ? <span className="pulse-v5-new">NEW</span> : null}</span>
                    <span className="pulse-v5-age tabular-nums">{compactAge(r.at, now)}</span>
                    <span className="pulse-v5-headline">{stripPublisher(r.title, lead?.publisher ?? "")}</span>
                    <span className="pulse-v5-src">
                      <span className={cn("pulse-v5-badge", r.multiSource ? "pulse-v5-src-lead" : "pulse-v5-src-solo")}>
                        {r.leadBadge}
                      </span>
                      {r.alsoBadges.slice(0, 2).map((b) => (
                        <span key={b} className="pulse-v5-badge pulse-v5-also">
                          {b}
                        </span>
                      ))}
                      {overflow ? <span className="pulse-v5-badge pulse-v5-also">+{overflow}</span> : null}
                      {r.selfBadges.length ? (
                        <span
                          className="pulse-v5-badge pulse-v5-self"
                          title={`self repost (${r.selfBadges.join(", ")}) — company's own post re-carried · 0 sources`}
                        >
                          SELF
                        </span>
                      ) : null}
                    </span>
                    <span className={cn("pulse-v5-sig tabular-nums", sig.dim && "pulse-v5-sig-dim")}>
                      {sig.text}
                    </span>
                  </div>
                  {open && !inDrawer ? (
                    <div className="pulse-v5-exp">
                      {r.multiSource && r.alsoPublishers.length ? (
                        <p className="pulse-v5-alsoline">
                          also covered by · {r.alsoPublishers.join(" · ")}
                        </p>
                      ) : null}
                      {r.summary ? <p className="pulse-v5-summary">{r.summary.slice(0, 280)}</p> : null}
                      <p className="pulse-v5-meta tabular-nums">
                        {lead?.publisher ?? r.leadBadge} · {r.at} · {r.size} member{r.size === 1 ? "" : "s"}
                        {" · "}
                        <a href={r.url} target="_blank" rel="noreferrer" className="sage-signal focus-phosphor">
                          open ↗
                        </a>
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {rows.length > PULSE_V5_MAX_ROWS ? (
            <button type="button" className="pulse-v5-more focus-phosphor" onClick={() => setShowAll((v) => !v)}>
              {showAll ? `show top ${PULSE_V5_MAX_ROWS}` : `show all ${rows.length}`}
            </button>
          ) : null}
        </section>

        <aside className="pulse-v5-taste sage-panel pin-card-quiet" aria-label="Operator X-session taste">
          <p className="pulse-v5-taste-head">TASTE · X-session · never lead</p>
          {X_TASTE.skipped || X_TASTE.items.length === 0 ? (
            <p className="pulse-v5-taste-skip">
              shelf · skip
              {X_TASTE.soft_fail && X_TASTE.soft_fail_reason ? (
                <>
                  {" "}
                  · <span className="sage-deny">{X_TASTE.soft_fail_reason}</span>
                </>
              ) : null}{" "}
              · Session quiet / login wall — taste empty. Sign into X on Agent Computer Chrome, then re-run dry-run.
            </p>
          ) : (
            <ul>
              {tasteItems.map((it) => (
                <li key={it.id}>
                  <p className="pulse-v5-taste-kicker">
                    {it.surface}
                    {it.handle ? <> · @{it.handle}</> : null}
                  </p>
                  {it.url ? (
                    <a href={it.url} target="_blank" rel="noreferrer" className="pulse-v5-taste-text focus-phosphor">
                      {it.text}
                    </a>
                  ) : (
                    <p className="pulse-v5-taste-text">{it.text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {X_TASTE.items.length > 6 ? (
            <button type="button" className="pulse-v5-more focus-phosphor" onClick={() => setTasteAll((v) => !v)}>
              {tasteAll ? "fewer" : `+${X_TASTE.items.length - 6} more`}
            </button>
          ) : null}
          <p className="pulse-v5-taste-kicker tabular-nums">
            kept {X_TASTE.counts.kept}/{X_TASTE.counts.seen} · land {X_TASTE.land}
          </p>
        </aside>
      </div>

      {/* 3 · Footer ledger line — eligibility copy lives here once */}
      <p className="pulse-v5-foot tabular-nums">
        <span className="sage-deny">DENY</span> · {SOFT_FAIL_METERS.deny.join(" · ")} · briefEligible=false · Pulse never
        Brief · never sole lead · clusters {PULSE_CLUSTERS.length} · multi-source {rows.filter((r) => r.multiSource).length} · snap {PULSE_CLUSTERS_AT}
      </p>
    </div>
  );
}

function Digest() {
  const [openId, setOpenId] = useState(DIGEST_ITEMS[0].id);
  const [last, setLast] = useState<string | null>(DIGEST_CADENCE.last_at);
  const [previewNote, setPreviewNote] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PACK_KEY);
      if (raw) setLast(raw);
    } catch {
      /* ignore */
    }
  }, []);
  const diskCadence = useMemo(
    () =>
      isDigestDue({
        last_at: DIGEST_CADENCE.last_at,
        next_at: DIGEST_CADENCE.next_at,
        pack_id: DIGEST_CADENCE.pack_id,
      }),
    [],
  );
  const cadence = useMemo(() => nextDue(last ?? DIGEST_CADENCE.last_at), [last]);
  const due = diskCadence.due;
  const nextAt = diskCadence.nextAt;
  const item = DIGEST_ITEMS.find((i) => i.id === openId) ?? DIGEST_ITEMS[0];
  const report = useMemo(
    () => renderReport(DIGEST_ITEMS, last ?? DIGEST_CADENCE.last_at),
    [last],
  );
  const plan = useMemo(() => renderPlan(), []);
  const tickAgeH = useMemo(() => {
    const t = Date.parse(DIGEST_CADENCE.last_at);
    if (!Number.isFinite(t)) return Infinity;
    return (Date.now() - t) / 3_600_000;
  }, []);
  const windowSpan = useMemo(() => {
    const a = Date.parse(DIGEST_CADENCE.last_at);
    const b = Date.parse(nextAt);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
    const now = Date.now();
    return Math.max(0, Math.min(100, Math.round(((now - a) / (b - a)) * 100)));
  }, [nextAt]);

  const runPreview = () => {
    const at = new Date().toISOString();
    setLast(at);
    setPreviewNote(true);
    try {
      localStorage.setItem(PACK_KEY, at);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="sage-lane-craft lane-digest">
      <div className="digest-v4 grid gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
        {/* Left · cadence meters */}
        <aside
          className="sage-panel sage-ticks sage-instrument flex flex-col gap-2 px-2.5 py-2 lg:col-span-2 lg:row-span-2"
          aria-label="Digest cadence meters"
        >
          <p className="font-mono text-kicker uppercase tracking-kicker text-amber">cadence · meters</p>
          <div className="sage-kpi sage-kpi-stack px-2 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">gate</p>
            <p
              className={cn(
                "sage-metric font-display text-xl tabular-nums",
                due ? "text-phosphor-bright" : "text-phosphor",
              )}
            >
              {due ? "DUE" : "HOLD"}
            </p>
          </div>
          <div className="sage-kpi sage-kpi-stack px-2 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">next due</p>
            <p className="sage-metric font-display text-lg tabular-nums text-phosphor">
              {nextAt.slice(11, 16)}Z
            </p>
          </div>
          <div className="sage-kpi sage-kpi-stack px-2 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">pack</p>
            <p className="font-mono text-kicker uppercase tracking-kicker tabular-nums text-phosphor">
              {DIGEST_CADENCE.pack_id}
            </p>
          </div>
          <div className="mt-auto border-t border-line pt-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">last tick</p>
            <p
              className={cn(
                "font-mono text-kicker uppercase tracking-kicker tabular-nums",
                tickAgeH > 6 ? "sage-stale" : "sage-signal",
              )}
            >
              {Number.isFinite(tickAgeH) ? `${tickAgeH.toFixed(1)}h ago` : "—"}
            </p>
            <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {DIGEST_CADENCE.last_at.slice(11, 19)}Z
            </p>
          </div>
        </aside>

        {/* Mid · report / open item story — brightest */}
        <section
          className="sage-panel sage-ticks sage-panel-glow holo-edge sage-bento-hero sage-take px-4 py-3 lg:col-span-6 lg:row-span-1"
          aria-label="Digest report body"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker text-amber">
              Report · story
            </p>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {item.kind} · {item.id} · {item.confidence}
            </span>
          </div>
          <h2 className="sage-take-title mt-2 font-display text-2xl font-medium normal-case tracking-normal text-phosphor-bright md:text-3xl">
            {item.title}
          </h2>
          <dl className="pin-meta mt-3 max-w-prose">
            <dt>take</dt>
            <dd className="text-phosphor-bright">{item.take}</dd>
            <dt>why</dt>
            <dd className="text-muted">{item.why}</dd>
            <dt className="sage-signal">move</dt>
            <dd className="sage-signal">{item.move}</dd>
          </dl>
          {item.evidence.length ? (
            <ul className="mt-3 max-w-prose space-y-1 border-t border-line pt-2 text-sm text-muted">
              {item.evidence.slice(0, 3).map((e) => (
                <li key={e.slice(0, 32)} className="border-l-2 border-phosphor pl-3">
                  {e}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Right · compact item rail */}
        <div className="digest-item-rail flex flex-col gap-1.5 lg:col-span-4 lg:row-span-2">
          <div
            className="pin-legend-rail sage-panel sage-ticks flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
            aria-label="Digest item rail"
          >
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">items</span>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {DIGEST_ITEMS.length} · never Brief lead
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {byCorroboration(DIGEST_ITEMS).map((i, idx) => {
              const open = i.id === item.id;
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(i.id)}
                    aria-current={open ? "true" : undefined}
                    className={cn(
                      "sage-panel sage-ticks focus-phosphor pin-card w-full px-2.5 py-1.5 text-left",
                      open ? "sage-panel-glow" : "pin-card-quiet",
                    )}
                  >
                    <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                      [{String(idx + 1).padStart(2, "0")}] · {i.id} · {i.kind}
                      {i.kind !== "lead" && i.kind !== "drop" ? (
                        <>
                          {" "}
                          <SrcChip id={i.id} />
                        </>
                      ) : null}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-sm",
                        open ? "text-phosphor-bright" : "text-phosphor",
                      )}
                    >
                      {i.title}
                    </p>
                    <p className="mt-0.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
                      {i.confidence} · {open ? "open" : "ready"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Under mid · next window / pack span */}
        <section
          className="sage-panel sage-ticks overflow-hidden lg:col-span-6"
          aria-label="Digest next window"
        >
          <div className="sage-panel-header">&gt; Next window · pack span</div>
          <div className="p-2.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {DIGEST_CADENCE.last_at.slice(11, 16)}Z → {nextAt.slice(11, 16)}Z · {DIGEST_CADENCE.pack_id}
            </p>
            <div
              className="mt-2 h-1.5 w-full bg-bg-deep"
              role="img"
              aria-label={`Pack window progress ${windowSpan}%`}
            >
              <div
                className="h-full bg-phosphor"
                style={{ width: `${windowSpan}%`, opacity: 0.55 + windowSpan / 200 }}
              />
            </div>
            <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle">
              {PACK_SOURCE} · lead hf-incident · Sol≠Astra
            </p>
          </div>
        </section>

        {/* Beat 4 · Moved since last crawl — corroboration rank vs previous snapshot */}
        <section
          className="sage-panel sage-ticks sage-moved overflow-hidden lg:col-span-12"
          aria-label="Moved since last crawl"
        >
          <div className="sage-panel-header">&gt; Moved since last crawl · corroboration rank below lead</div>
          <div className="px-2.5 py-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              crawl {RANK_PREV?.crawl_at ?? "—"} → {RANK_CURRENT.crawl_at} · lead {RANK_CURRENT.lead_id} pinned · ×
              {"≤"}1.45 · curated items only
            </p>
            <ol className="sage-moved-table mt-1.5">
              <li className="sage-moved-head" aria-hidden>
                <span>Δ</span>
                <span>item</span>
                <span>rank</span>
                <span>base</span>
                <span>SRC</span>
                <span>×</span>
              </li>
              {RANK_MOVED.map((m) => {
                const r = RANK_CURRENT.rows.find((x) => x.id === m.id);
                const glyph =
                  m.status === "up" ? "▲" : m.status === "down" ? "▼" : m.status === "new" ? "NEW" : m.status === "gone" ? "OUT" : "=";
                return (
                  <li key={m.id} className="sage-moved-row" data-status={m.status} data-corroboration={m.by_corroboration ? "1" : undefined}>
                    <span className="sage-moved-delta">{glyph}</span>
                    <span className="truncate">
                      {m.id}
                      {r?.lead ? " · lead" : ""}
                      {m.by_corroboration ? " · moved by SRC" : ""}
                    </span>
                    <span className="tabular-nums">
                      {m.prev_rank ?? "—"}→{m.rank ?? "—"}
                    </span>
                    <span className="tabular-nums">{r?.base_rank ?? "—"}</span>
                    <span className="tabular-nums">
                      {m.prev_sources ?? "—"}→{m.sources ?? "—"}
                    </span>
                    <span className="tabular-nums">{r?.lead ? "pin" : r?.mult ?? "—"}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
              {RANK_MOVED.some((m) => m.status === "up" || m.status === "down" || m.by_corroboration)
                ? "reorder present"
                : "no reorder — corroboration agrees with base order this crawl"}
              {" · "}Taste / Pulse / shelf never ranked here (briefEligible=false)
            </p>
          </div>
        </section>
      </div>

      {/* Quiet ops chrome — preview browser-only */}
      <div className="sage-panel sage-ticks lane-craft-digest-panel mt-3 overflow-hidden">
        <div className="sage-panel-header">&gt; Ops · preview browser-only · downloads</div>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <button
            type="button"
            className="focus-phosphor h-9 bg-accent px-3 font-mono text-kicker uppercase tracking-kicker text-accent-fg"
            onClick={runPreview}
            title="Browser preview only — durable tick is bun run digest:tick"
          >
            Preview report
          </button>
          <button
            type="button"
            className="term focus-phosphor h-9 px-3 font-mono text-kicker uppercase tracking-kicker"
            onClick={() =>
              download(`sage-digest-${DIGEST_CADENCE.pack_id.replace(/:/g, "")}.md`, report, "text/markdown")
            }
          >
            Download report.md
          </button>
          <button
            type="button"
            className="term focus-phosphor h-9 px-3 font-mono text-kicker uppercase tracking-kicker"
            title="UI twin JSON — durable wipe pack: bun run pack:export · VM digest packs: artifacts/sage/packs/"
            onClick={() =>
              download(
                `sage-pack-twin-${CYCLE.id}.json`,
                JSON.stringify(
                  {
                    schema_version: 1,
                    cycle: CYCLE.id,
                    lead_id: CYCLE.pins.find((p) => p.kind === "lead")?.id ?? "hf-incident",
                    created_at: new Date().toISOString(),
                    digest_cadence: DIGEST_CADENCE,
                    note: "UI twin only — VM-real: bun run digest:tick → artifacts/sage/packs/; wipe pack: bun run pack:export",
                    locks: {
                      lead_id: "hf-incident",
                      sol_ne_astra: true,
                      deny: CYCLE.trust.deny,
                      new_primary: false,
                    },
                    digest: { at: last, items: DIGEST_ITEMS, plan, dropped: DROPPED },
                    cycle_snapshot: { CYCLE, WAVES, WAVE_TIMELINE },
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Download pack twin
          </button>
        </div>
        <p className="border-t border-line px-3 py-2 font-mono text-kicker uppercase tracking-kicker text-subtle">
          durable · bun run digest:tick · artifacts/sage/packs/{DIGEST_CADENCE.pack_id}.md|json
          {previewNote ? " · preview is localStorage only" : ""}
          {cadence.due !== due ? " · browser mirror may differ from disk" : ""}
        </p>
      </div>

      {/* Toolkit shelf — quiet companion, never Brief */}
      <div className="sage-panel sage-ticks mt-3 overflow-hidden">
        <div className="sage-panel-header">&gt; Toolkit shelf · classifyUrl · never Brief</div>
        <p className="border-b border-line px-3 py-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
          {SHELF.length} links · github-search off Pulse lead
        </p>
        <ul className="max-h-36 overflow-auto divide-y divide-line">
          {SHELF.slice(0, 12).map((s) => (
            <li key={s.href} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-1.5">
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="focus-phosphor truncate text-sm sage-signal"
              >
                {s.label}
              </a>
              <span className="font-mono text-kicker uppercase tracking-kicker text-subtle shrink-0">
                {s.reason}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


function Papers() {
  const [openId, setOpenId] = useState<string | null>(null);
  const allRows = useMemo(() => buildPaperRows(PAPERS as unknown as PaperInput[]), []);
  const { q, report } = useDeskKeys();
  const rows = useMemo(
    () => allRows.filter((p) => matchesFilter(q, [p.title, p.id, ...p.badges.map((b) => b.label)])),
    [allRows, q],
  );
  useEffect(() => report(rows.length, allRows.length), [rows.length, allRows.length, report]);
  const copyId = (id: string) => {
    void navigator.clipboard?.writeText(id);
  };
  return (
    <div className="sage-lane-craft lane-papers pulse-v5 papers-v6">
      <p className="papers-v6-kicker tabular-nums">
        PAPERS · {rows.length} rows · HF daily + arXiv/OpenAlex/Crossref enrich · never Brief
      </p>
      <section className="pulse-v5-table" aria-label="Papers table">
        <div className="papers-v6-head" aria-hidden>
          <span>#</span>
          <span className="pulse-v5-sig">UP</span>
          <span className="pulse-v5-age">YR</span>
          <span>TITLE</span>
          <span>SRC</span>
          <span>LINKS</span>
        </div>
        <ol>
          {rows.map((p, i) => {
            const open = openId === p.id;
            return (
              <li key={p.id} className="pulse-v5-row" data-open={open ? "1" : undefined}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  data-nav-row
                  data-href={p.abs}
                  className="papers-v6-line focus-phosphor"
                  onClick={() => setOpenId(open ? null : p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(open ? null : p.id);
                    }
                  }}
                >
                  <span className="pulse-v5-idx tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pulse-v5-sig tabular-nums">{p.up}</span>
                  <span className="pulse-v5-age tabular-nums">{p.year ?? "—"}</span>
                  <span className="pulse-v5-headline">{p.title}</span>
                  <span className="pulse-v5-src">
                    {p.badges.map((b) => (
                      <span key={b.label} className={cn("pulse-v5-badge", b.lit ? "papers-v6-lit" : "pulse-v5-also")}>
                        {b.label}
                      </span>
                    ))}
                  </span>
                  <span className="papers-v6-links">
                    <a
                      href={p.abs}
                      target="_blank"
                      rel="noreferrer"
                      className="sage-signal focus-phosphor"
                      onClick={(e) => e.stopPropagation()}
                    >
                      abs
                    </a>
                    {p.pdf ? (
                      <a
                        href={p.pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="sage-signal focus-phosphor"
                        onClick={(e) => e.stopPropagation()}
                      >
                        pdf
                      </a>
                    ) : null}
                  </span>
                </div>
                {open ? (
                  <div className="pulse-v5-exp papers-v6-exp">
                    <p className="pulse-v5-summary">
                      {p.abstract ? p.abstract.slice(0, 600) : "Abstract not mounted on this cycle. Open arXiv for full text."}
                    </p>
                    <p className="pulse-v5-meta tabular-nums">
                      {p.id}
                      {p.category ? ` · ${p.category}` : ""}
                      {p.doi ? ` · doi ${p.doi}` : ""}
                      {" · "}
                      <button
                        type="button"
                        className="sage-signal focus-phosphor"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyId(p.id);
                        }}
                      >
                        copy id
                      </button>
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

type VoiceBeatId = "take" | "why" | "move" | "idle";

function pickAvaAndrewVoices(): {
  Ava?: SpeechSynthesisVoice;
  Andrew?: SpeechSynthesisVoice;
} {
  if (typeof window === "undefined" || !window.speechSynthesis) return {};
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return {};
  const en = voices.filter((v) => /^en(-|_)/i.test(v.lang) || /english/i.test(v.name));
  const pool = en.length ? en : voices;
  const Ava =
    pool.find((v) =>
      /female|woman|samantha|victoria|karen|moira|zira|fiona|ava|siri/i.test(v.name),
    ) ?? pool[0];
  const Andrew =
    pool.find(
      (v) =>
        v !== Ava &&
        /male|man|daniel|alex|fred|david|mark|tom|andrew|rishi|arthur|google uk english male/i.test(
          v.name,
        ),
    ) ??
    pool.find((v) => v !== Ava) ??
    pool[0];
  return { Ava, Andrew };
}

function Voice() {
  const [playing, setPlaying] = useState(false);
  const [level, setLevel] = useState(0);
  const [beat, setBeat] = useState<VoiceBeatId>("idle");
  const lead = CYCLE.pins.find((p) => p.kind === "lead") ?? CYCLE.pins[0];

  const script = useMemo(
    () => ({
      take: lead?.take ?? CYCLE.exec[0],
      why: lead?.why ?? CYCLE.exec[1] ?? "",
      move: lead?.move ?? CYCLE.exec[2] ?? "",
    }),
    [lead],
  );

  useEffect(() => {
    if (!playing) {
      setLevel(0);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setLevel(0.55);
      return;
    }
    const id = window.setInterval(() => {
      setLevel(0.25 + Math.random() * 0.75);
    }, 120);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const onVoices = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", onVoices);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onVoices);
  }, []);

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setBeat("idle");
  };

  const speakChain = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = pickAvaAndrewVoices();
    const beats: Array<{ id: VoiceBeatId; speaker: "Ava" | "Andrew"; line: string }> = [
      { id: "take", speaker: "Ava", line: `TAKE. ${script.take}` },
      { id: "why", speaker: "Andrew", line: `WHY. ${script.why}` },
      { id: "move", speaker: "Ava", line: `MOVE. ${script.move}` },
    ];
    window.speechSynthesis.cancel();
    setPlaying(true);
    let i = 0;
    const next = () => {
      if (i >= beats.length) {
        setPlaying(false);
        setBeat("idle");
        return;
      }
      const b = beats[i++];
      setBeat(b.id);
      const utter = new SpeechSynthesisUtterance(`${b.speaker}. ${b.line}`);
      utter.rate = b.speaker === "Ava" ? 0.98 : 0.94;
      utter.pitch = b.speaker === "Ava" ? 1.08 : 0.92;
      const v = voices[b.speaker];
      if (v) utter.voice = v;
      utter.onend = () => next();
      utter.onerror = () => stop();
      window.speechSynthesis.speak(utter);
    };
    next();
  };

  const bars = Array.from({ length: 16 }, (_, i) => i);
  const avaHot = beat === "take" || beat === "move";
  const andrewHot = beat === "why";
  const avaLevel = playing ? (avaHot ? level : level * 0.28) : 0;
  const andrewLevel = playing ? (andrewHot ? level : level * 0.28) : 0;
  const chainPct =
    beat === "take" ? 33 : beat === "why" ? 66 : beat === "move" ? 100 : playing ? 10 : 0;

  const meterBars = (lvl: number, hotAmber: boolean) =>
    bars.map((i) => {
      const threshold = (i + 1) / bars.length;
      const on = lvl >= threshold;
      const hot = hotAmber && threshold > 0.85;
      return (
        <div
          key={i}
          className={cn(
            "min-w-0 flex-1",
            on ? (hot ? "bg-amber" : "bg-phosphor") : "bg-phosphor-deep",
          )}
          style={{
            height: `${18 + (i / (bars.length - 1)) * 82}%`,
            opacity: on ? 0.5 + threshold * 0.5 : 0.28,
          }}
        />
      );
    });

  return (
    <div className="sage-lane-craft lane-voice">
      <div className="voice-v4 grid gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
        {/* Left · VU meters Ava / Andrew */}
        <aside
          className="sage-panel sage-ticks sage-instrument flex flex-col gap-2 px-2.5 py-2 lg:col-span-2 lg:row-span-2"
          aria-label="Voice VU meters"
        >
          <p className="font-mono text-kicker uppercase tracking-kicker text-amber">VU · meters</p>
          <div className="sage-kpi sage-kpi-stack flex flex-col gap-1 px-2 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              Ava · {Math.round(avaLevel * 100)}%
            </p>
            <div
              className="flex h-16 items-end gap-0.5 border border-line bg-bg-deep p-1"
              role="img"
              aria-label={`Ava level ${Math.round(avaLevel * 100)} percent`}
            >
              {meterBars(avaLevel, avaHot)}
            </div>
          </div>
          <div className="sage-kpi sage-kpi-stack flex flex-col gap-1 px-2 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              Andrew · {Math.round(andrewLevel * 100)}%
            </p>
            <div
              className="flex h-16 items-end gap-0.5 border border-line bg-bg-deep p-1"
              role="img"
              aria-label={`Andrew level ${Math.round(andrewLevel * 100)} percent`}
            >
              {meterBars(andrewLevel, andrewHot)}
            </div>
          </div>
          <div className="mt-auto border-t border-line pt-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">deck</p>
            <p
              className={cn(
                "font-mono text-kicker uppercase tracking-kicker tabular-nums",
                playing ? "sage-signal" : "text-subtle",
              )}
            >
              {playing ? `LIVE · ${beat}` : "READY"}
            </p>
          </div>
        </aside>

        {/* Mid · script TAKE → WHY → MOVE — brightest */}
        <section
          className="sage-panel sage-ticks sage-panel-glow holo-edge sage-bento-hero sage-take px-4 py-3 lg:col-span-6 lg:row-span-1"
          aria-label="Voice script"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker text-amber">
              Script · story
            </p>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              lead · {lead?.id ?? "hf-incident"} · TAKE→WHY→MOVE
            </span>
          </div>
          <dl className="pin-meta mt-3 max-w-prose">
            <dt className={cn(beat === "take" && "sage-signal")}>take</dt>
            <dd className={cn("text-phosphor-bright", beat === "take" && "text-phosphor-bright")}>
              {script.take}
            </dd>
            <dt className={cn(beat === "why" && "text-amber")}>why</dt>
            <dd className={cn("text-muted", beat === "why" && "text-phosphor-bright")}>{script.why}</dd>
            <dt className={cn(beat === "move" && "sage-signal")}>move</dt>
            <dd className={cn("sage-signal", beat === "move" && "text-phosphor-bright")}>{script.move}</dd>
          </dl>
        </section>

        {/* Right · clip / speaker / TTS chain — quiet */}
        <div className="voice-ops-rail flex flex-col gap-1.5 lg:col-span-4 lg:row-span-2">
          <div
            className="pin-legend-rail sage-panel sage-ticks flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
            aria-label="Voice chain controls"
          >
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">chain</span>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              Ava / Andrew · cyc/{CYCLE.id}
            </span>
          </div>
          <div className="sage-panel sage-ticks pin-card-quiet flex flex-col gap-2 px-2.5 py-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">clip · TTS</p>
            <button
              type="button"
              className="focus-phosphor h-9 bg-accent px-3 font-mono text-kicker uppercase tracking-kicker text-accent-fg"
              onClick={playing ? stop : speakChain}
              aria-pressed={playing}
            >
              {playing ? "Stop" : "Play brief"}
            </button>
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              lead {lead?.id ?? "hf-incident"}
            </p>
            <ul className="space-y-1 border-t border-line pt-2">
              <li className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                Ava · TAKE / MOVE
              </li>
              <li className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                Andrew · WHY
              </li>
              <li className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                browser speechSynthesis · free only
              </li>
            </ul>
          </div>
          <p className="px-1 font-mono text-kicker uppercase tracking-kicker text-subtle">
            Podcast mix offline · locked lead only · Sol≠Astra
          </p>
        </div>

        {/* Under mid · waveform / chain progress */}
        <section
          className="sage-panel sage-ticks overflow-hidden lg:col-span-6"
          aria-label="Voice chain progress"
        >
          <div className="sage-panel-header">&gt; Waveform · chain progress</div>
          <div className="p-2.5">
            <div
              className="flex h-12 items-end gap-0.5 border border-line bg-bg-deep p-1.5"
              role="img"
              aria-label={playing ? `VU level ${Math.round(level * 100)} percent` : "VU idle"}
            >
              {Array.from({ length: 28 }, (_, i) => {
                const threshold = (i + 1) / 28;
                const on = playing && level >= threshold * 0.85;
                const hot = threshold > 0.88;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-w-0 flex-1",
                      on ? (hot ? "bg-amber" : "bg-phosphor") : "bg-phosphor-deep",
                    )}
                    style={{
                      height: `${12 + ((i * 37) % 88)}%`,
                      opacity: on ? 0.55 + threshold * 0.4 : 0.25,
                    }}
                  />
                );
              })}
            </div>
            <div
              className="mt-2 h-1.5 w-full bg-bg-deep"
              role="img"
              aria-label={`Chain progress ${chainPct}%`}
            >
              <div
                className="h-full bg-phosphor"
                style={{ width: `${chainPct}%`, opacity: 0.55 + chainPct / 200 }}
              />
            </div>
            <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              TAKE → WHY → MOVE · {playing ? `${Math.round(level * 100)}%` : "00%"} · amber filament scarce
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


function Gov() {
  return (
    <div>
      <div className="sage-panel sage-ticks overflow-hidden">
        <div className="sage-panel-header">&gt; Governance · trust close</div>
        <p className="border-b border-line px-3 py-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
          never invent pins · Sol ≠ Astra
        </p>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker sage-signal">ALLOW</p>
          <ul className="mt-1.5 space-y-1 text-sm">{CYCLE.trust.allow.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker sage-deny">DENY</p>
          <ul className="mt-1.5 space-y-1 text-sm">{CYCLE.trust.deny.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-muted">Open</p>
          <ul className="mt-1.5 space-y-1 text-sm">{CYCLE.trust.open.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
      <section className="mt-3" aria-label="Wikidata DENY hygiene">
        <div className="sage-panel sage-ticks overflow-hidden mb-2">
          <div className="sage-panel-header">&gt; Wikidata DENY · grounding only</div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              snap {WIKIDATA_DENY_LAST.at} · {WIKIDATA_DENY_LAST.hints.length} hints
            </p>
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              never Brief · never Pulse lead
            </p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {WIKIDATA_DENY_LAST.hints.map((h, idx) => (
            <li key={`${h.seed}-${h.qid ?? idx}`} className="sage-panel sage-ticks px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                    [{String(idx + 1).padStart(2, "0")}] · {h.seed} · {h.status}
                    {h.qid ? ` · ${h.qid}` : ""}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-phosphor-bright">{h.label ?? "—"}</p>
                </div>
                <span
                  className={
                    h.status === "matched"
                      ? "desk-chip desk-chip-live"
                      : h.status === "rejected_false_friend"
                        ? "desk-chip desk-chip-warn"
                        : "desk-chip"
                  }
                >
                  {h.status === "matched"
                    ? "match"
                    : h.status === "rejected_false_friend"
                      ? "reject"
                      : h.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle">
          brief={String(WIKIDATA_DENY_LAST.brief)} · pulse_lead={String(WIKIDATA_DENY_LAST.pulse_lead)} ·
          deny_only={String(WIKIDATA_DENY_LAST.deny_grounding_only)}
        </p>
      </section>
    </div>
  );
}
