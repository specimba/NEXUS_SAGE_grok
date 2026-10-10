"use client";
import type { SyntheticEvent } from "react";
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CYCLE, WAVES } from "@/data/cycle";
// Crawl data comes ONLY from the generated slim view (OPT win 3); raw src/data crawl modules never reach the client.
import {
  CRAWL_AT,
  LEAD_FIRST_AT,
  LEAD_HELD,
  LEAD_TODAY,
  LEAD_YESTERDAY,
  MEMBER_ROWS,
  ORPHAN_CLUSTERS,
  PULSE_CLUSTERS_AT,
  RANK_CURRENT,
  RANK_MOVED,
  RANK_PREV,
  SHELF,
  SOURCE_HEALTH,
  SOURCE_HEALTH_AT,
  TOPIC_HEAT_WINDOWS,
  WIRE_CRAWL_AT,
  WIRE_PREV_CRAWL_AT,
  WIRE_ROWS,
  X_POSTS,
} from "@/data/desk-view";
import { crawlItemIds, inflateClusters, inflateMembers, memberAt, memberItems, stripPublisher, xRows } from "@/lib/desk-view";
import { X_TASTE } from "@/data/x-taste";
import { TASTE_VISIBLE_CAP, tasteSoftMeter } from "@/lib/x-taste-meter";
import { DIGEST_UNLOCK } from "@/data/digest-unlock";
import { resolveUnlock, withLeadView, type UnlockView, type UnlockRow } from "@/lib/digest-unlock";
import { DIGEST_CADENCE } from "@/data/digest-cadence";
import { groupFirstAt, leadAgeHours } from "@/lib/lead-pick";
import { LEAD_HELD_TEXT, leadView, nextCrawlSlotHHMM, type LeadView } from "@/lib/lead-view";
import { IST_LABEL, istDateTime, istHHMM, istHHMMSS, istMMDD } from "@/lib/ist-time";
import { useCheckedAt, useNow } from "@/lib/use-now";
import { archiveFoldLabel } from "@/lib/archive-fold";
import { footerStamp } from "@/lib/build-footer";
import { isPausedAt, type PauseMap } from "@/lib/source-pause";
import { istanbulHHMM, wireHeader, wireMark } from "@/lib/wire";
import { WIKIDATA_DENY_LAST } from "@/data/wikidata-deny-last";
import { SOFT_FAIL_METERS } from "@/data/soft-fail-meters";
import { isDigestDue, nextDue, PACK_KEY } from "@/lib/digest-cadence-gate";
import type { UnlockRow as ArchiveRow } from "@/lib/digest-unlock";

/** Pass A2: Sep archive payload is a lazy chunk — never in First Load. */
const loadArchive = () => import("@/lib/archive-003");
import { crawlAgeHours } from "@/lib/x-pulse";
import { crawlFreshness, STALE_GUARD_HOURS } from "@/lib/crawl-staleness";
import {
  buildRows,
  compactAge,
  healthCellState,
  healthTicks,
  HEALTH_TICKS,
  PULSE_V5_MAX_ROWS,
  sigCell,
  buildPaperRows,
  type PaperInput,
  type ClusterInput,
  type PulseMemberInfo,
  type SrcChip,
  chipLabel,
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
import { FIRST_VISIT, LAST_SEEN_KEY, SESSION_BASE_KEY, partitionSince, sinceBase } from "@/lib/since";
import { companyFilterMatch, deltaText, heatCells, heatLabel } from "@/lib/topic-heat";
import { isTypingTarget, KEY_MAP, matchesFilter, resolveKey, stepSelection } from "@/lib/keys";
import { writeStoryParam } from "@/lib/story-drawer";
import { LeadLogPanel } from "@/components/sage/lead-log";
import type { LeadLog } from "@/lib/lead-log";

/** Beat 11 — `?view=leadlog` opens the holotape inside the Brief (no new lane tab). */
const LEADLOG_VIEW = "leadlog";
function viewFromSearch(search: string): string | null {
  return new URLSearchParams(search).get("view");
}
function withView(search: string, view: string | null): string {
  const p = new URLSearchParams(search);
  if (view) p.set("view", view);
  else p.delete("view");
  const s = p.toString();
  return s ? `?${s}` : "";
}

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
  /** Build-time stamp (static page: there is no per-request server boot). */
  builtAt?: string;
  /** Active source pauses merged at prebuild (artifacts/sage/source-state.json). */
  pauses?: PauseMap;
  /** B2 footer: source commit, crawl commit, public repo URL (build-time). */
  commit?: string;
  crawlCommit?: string;
  repoUrl?: string;
  /** Beat 11 — slim lead log built at build time from artifacts/sage/lead-history.json (app/page.tsx). */
  leadLog?: LeadLog;
};

/** One chip per source type, ×n when that type has >1 independent publisher; Σ n = N SRC (SELF excluded). */
function SrcChips({ chips, multi, max }: { chips: SrcChip[]; multi: boolean; max: number }) {
  const shown = chips.slice(0, max);
  const rest = chips.slice(max).reduce((a, c) => a + c.n, 0);
  return (
    <>
      {shown.map((ch, i) => (
        <span
          key={ch.badge}
          className={cn("pulse-v5-badge", i === 0 ? (multi ? "pulse-v5-src-lead" : "pulse-v5-src-solo") : "pulse-v5-also")}
          data-chip={ch.badge}
          data-chip-n={ch.n}
        >
          {chipLabel(ch)}
        </span>
      ))}
      {rest ? (
        <span className="pulse-v5-badge pulse-v5-also" data-chip="+" data-chip-n={rest}>
          +{rest}
        </span>
      ) : null}
    </>
  );
}

/** Beat B1 · pauses reach the Pulse health strip without prop-drilling through lanes. */
export const PausesCtx = createContext<PauseMap>({});

/**
 * AGE cell: server/static HTML shows the absolute Istanbul time (e.g. "14:11"); after mount it swaps
 * to the relative value ("2h"). Fixed 5ch column, tabular numerals — no layout shift, no hydration mismatch.
 */
/** Pass C — fold calendar day into AGE: static `MM-DD · HH:MM`, live `MM-DD · 2h`; missing → dim —. */
function AgeCell({ iso, now, className }: { iso: string | null | undefined; now: number | null; className?: string }) {
  const raw = iso && Number.isFinite(Date.parse(iso)) ? iso : null;
  const day = raw ? istMMDD(raw) : "—";
  const age = raw == null ? "—" : now == null ? istHHMM(raw) : compactAge(raw, now);
  const text = day === "—" && age === "—" ? "—" : day === "—" ? age : `${day} · ${age}`;
  return (
    <span
      className={cn("pulse-v5-age tabular-nums", (day === "—" || age === "—") && "pulse-v5-sig-dim", className)}
      data-age-at={raw ?? undefined}
      data-age-rel={now == null || raw == null ? undefined : "1"}
      data-date={day === "—" ? undefined : day}
      title={raw ? `${istDateTime(raw)} ${IST_LABEL}` : "no timestamp"}
    >
      {text}
    </span>
  );
}

/** Crawl items (HN / GNews / lab / security — not X posts) and the per-member info memberInfo() builds at ingest. */
const CRAWL_ITEM_IDS = crawlItemIds(MEMBER_ROWS);
const MEMBERS = inflateMembers(MEMBER_ROWS);
const PULSE_CLUSTERS = inflateClusters(MEMBER_ROWS, ORPHAN_CLUSTERS);
/** Every member item's own time (HN created_at, GNews / lab / security published). */
const MEMBER_AT: Record<string, string> = memberAt(MEMBER_ROWS, CRAWL_ITEM_IDS);
/** Story age = its EARLIEST member item (same rule as the lead pick) — late reposts never make it look fresh. */
function firstAtIso(c: { at: string; member_ids: readonly string[] }): string {
  const t = groupFirstAt({ at: c.at, member_ids: [...c.member_ids] }, MEMBER_AT);
  return Number.isFinite(t) ? new Date(t).toISOString() : c.at;
}

/** Beat 9 — filter + story hand-off shared with lane tables (one global key handler lives in Desk). Beat 10 adds setFilter (heat cells) + since baseline. */
type DeskKeys = {
  q: string;
  report: (shown: number, total: number) => void;
  openStory: (id: string) => void;
  setFilter: (q: string) => void;
  since: string | null;
};
const DeskKeysCtx = createContext<DeskKeys>({ q: "", report: () => {}, openStory: () => {}, setFilter: () => {}, since: null });
const useDeskKeys = () => useContext(DeskKeysCtx);

const NAV_ROWS = ".desk-stage [data-nav-row]";

/** Beat 10 — older rows kept visible under the since divider when the since block exceeds the top-N cap. */
const PULSE_SINCE_TAIL = 5;

/** Beat 10 — first_seen per cluster id (crawl-time truth from the seen-index). */
const FIRST_SEEN = new Map<string, string | null>(PULSE_CLUSTERS.map((c) => [c.id, c.first_seen]));

/**
 * Beat 10 — "since you were here" baseline. lastSeenAt is written ONLY on tab leave
 * (visibilitychange → hidden, pagehide), never on load. The session pins its baseline in
 * sessionStorage so a reload (which fires pagehide) keeps the same markers. First visit ⇒ null.
 */
function useSinceBase(): string | null {
  const [base, setBase] = useState<string | null>(null);
  useEffect(() => {
    let session: string | null = null;
    let local: string | null = null;
    try {
      session = window.sessionStorage.getItem(SESSION_BASE_KEY);
      local = window.localStorage.getItem(LAST_SEEN_KEY);
    } catch {}
    const b = sinceBase(session, local);
    if (session == null) {
      try {
        window.sessionStorage.setItem(SESSION_BASE_KEY, b ?? FIRST_VISIT);
      } catch {}
    }
    setBase(b);
    const leave = () => {
      try {
        window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      } catch {}
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") leave();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  return base;
}
// end useSinceBase

/** Beat 10 — amber divider under the rows that arrived since the last visit. */
function SinceDivider({ base, n }: { base: string; n: number }) {
  return (
    <li className="since-divider" role="separator" aria-label={`Since your last visit at ${istanbulHHMM(base)}: ${n} new rows above`}>
      <span className="since-divider-kicker tabular-nums">
        since your last visit · {istanbulHHMM(base)} · {n} new row{n === 1 ? "" : "s"}
      </span>
    </li>
  );
}

const EMPTY_LOG: LeadLog = { days: [], lastAt: null };

export function Desk({ buildId = "dev", builtAt = "", pauses = {}, commit = "", crawlCommit = "", repoUrl = "", leadLog = EMPTY_LOG }: DeskProps) {
  const [lane, setLane] = useState<Lane>("brief");
  const [ingestOpen, setIngestOpen] = useState(false);
  // Tabs light only after the hash is read — SSR default "brief" must never paint as filled on another lane.
  const [laneReady, setLaneReady] = useState(false);
  // B2 build stamp footer (Istanbul clock, source + crawl commit links).
  const stamp = footerStamp({ commit, crawlCommit, builtAt, crawlAt: CRAWL_AT, repoUrl });
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

  // ── Beat 11 · lead log view (?view=leadlog, read after mount ⇒ static HTML never differs) ──
  const [logOpen, setLogOpen] = useState(false);
  useEffect(() => {
    const read = () => setLogOpen(viewFromSearch(window.location.search) === LEADLOG_VIEW);
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const openLog = useCallback(() => {
    const { pathname, search } = window.location;
    window.history.pushState(window.history.state, "", `${pathname}${withView(search, LEADLOG_VIEW)}#brief`);
    setLogOpen(true);
    setLane("brief");
    window.requestAnimationFrame(() => document.querySelector(".leadlog")?.scrollIntoView({ block: "nearest" }));
  }, []);
  const closeLog = useCallback(() => {
    const { pathname, search, hash } = window.location;
    window.history.replaceState(window.history.state, "", `${pathname}${withView(search, null)}${hash}`);
    setLogOpen(false);
  }, []);
  const leadLogState = useMemo(() => ({ leadLog, logOpen, openLog, closeLog }), [leadLog, logOpen, openLog, closeLog]);

  // ── Beat 9 · keyboard control ──
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [counts, setCounts] = useState<{ shown: number; total: number } | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const sel = useRef<Partial<Record<Lane, number>>>({});
  const pendingG = useRef<number | null>(null);
  const live = useRef({ lane, keymapOpen, filterOpen, q, logOpen });
  live.current = { lane, keymapOpen, filterOpen, q, logOpen };

  const report = useCallback((shown: number, total: number) => setCounts({ shown, total }), []);
  const openStory = useCallback(
    (id: string) => {
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, "", `${pathname}${writeStoryParam(search, id)}#pulse`);
      go("pulse");
    },
    [go],
  );
  const since = useSinceBase();
  const setFilter = useCallback((v: string) => {
    setQ(v);
    setFilterOpen(false);
  }, []);
  const keysCtx = useMemo(() => ({ q, report, openStory, setFilter, since }), [q, report, openStory, setFilter, since]);

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
            return;
          }
          if (L.logOpen && L.lane === "brief") closeLog();
          return;
        case "leadlog":
          if (drawer) return;
          return L.logOpen && L.lane === "brief" ? closeLog() : openLog();
        case "filter":
          return setFilterOpen(true);
        case "since": {
          if (drawer) return;
          const i = rows.findIndex((r) => r.hasAttribute("data-since"));
          return i >= 0 ? select(i, true) : undefined;
        }
        case "keymap":
          return setKeymapOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, select, clearFilter, openLog, closeLog]);

  // Relative crawl age only after mount (static HTML shows the absolute Istanbul crawl time).
  const now = useNow();
  const checkedAt = useCheckedAt(CRAWL_AT);
  const age = now == null ? null : crawlAgeHours(checkedAt, now);
  const fresh = now == null ? null : crawlFreshness(checkedAt, now);
  // Same lead source of truth as the Brief plate (HELD flag at build, 24h age after mount).
  const leadV = leadViewAt(now);
  // Pass A1 — chrome honesty: when Digest unlock is live, topbar stops selling Sep pack/window.
  const unlockChrome = useDigestUnlock();
  const unlockLive = unlockChrome.stamp !== "archive";
  const packStamp = DIGEST_CADENCE.last_at;
  const cycleWindowLabel = unlockLive ? `unlock · pick ${unlockChrome.pickDate ?? "—"}` : CYCLE.window;
  const cycChipAt = unlockLive && unlockChrome.frozenAt ? unlockChrome.frozenAt : CYCLE.compiledAt;

  return (
    <PausesCtx.Provider value={pauses}>
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
                <span className="text-sm text-muted" data-cycle-window={unlockLive ? "unlock" : "archive"}>{cycleWindowLabel}</span>
              </div>
            </div>
            <div className="desk-chips flex flex-wrap items-center gap-2">
              <span className="desk-chip desk-chip-quiet">STABLE</span>
              <span
                className={cn("desk-chip tabular-nums", age?.stale ? "desk-chip-warn sage-stale-chip" : "desk-chip-live")}
                data-crawl-state={fresh?.label}
                role="status"
                title={`crawl ${istDateTime(CRAWL_AT)} ${IST_LABEL}${fresh ? ` · age ${fresh.hours.toFixed(1)}h` : ""} · STALE after ${STALE_GUARD_HOURS}h`}
              >
                {fresh ? `${fresh.label} ${fresh.hours.toFixed(1)}H` : `CRAWL ${istHHMM(CRAWL_AT)}`}
              </span>
              <span className="desk-chip desk-chip-live desk-chip-wrap tabular-nums" title="crawl snap" data-crawl-at={CRAWL_AT}>
                checked {istHHMM(checkedAt)} · data <span className="hidden md:inline">{istDateTime(CRAWL_AT)}</span>
                <span className="md:hidden">{istHHMM(CRAWL_AT)}</span>
                <span className="hidden md:inline"> {IST_LABEL}</span>
              </span>
              <span className="desk-chip desk-chip-quiet tabular-nums" title={`${unlockLive ? "unlock frozen" : "cycle compile"} ${istDateTime(cycChipAt)}`}>
                cyc <span className="hidden md:inline">{unlockLive ? "003 · pick " : ""}{istDateTime(cycChipAt)}</span>
                <span className="md:hidden">{istDateTime(cycChipAt).slice(5, 10)}</span>
              </span>
            </div>
          </div>
          {/* Phone: the ingest line folds behind a tap (Beat 12); md+ always shows it. */}
          <button
            type="button"
            className="desk-ingest-toggle font-mono text-kicker uppercase tracking-kicker md:hidden"
            aria-expanded={ingestOpen}
            aria-controls="desk-ingest-line"
            onClick={() => setIngestOpen((o) => !o)}
          >
            ingest · snap {istHHMM(CRAWL_AT)} {ingestOpen ? "▴" : "▾"}
          </button>
          <p
            id="desk-ingest-line"
            className={`desk-ingest-line ${ingestOpen ? "block" : "hidden"} font-mono text-kicker uppercase tracking-kicker text-subtle md:block`}
          >
            ingest · snap {istDateTime(CRAWL_AT)} · pack {istDateTime(packStamp)} {IST_LABEL} · {DIGEST_CADENCE.pack_id} · lead{" "}
            <LeadInline view={leadV} />
          </p>
          <div className="desk-ticker" aria-label="What changed">
            <span className="desk-ticker-label">Δ LIVE</span>
            <div className="desk-ticker-track">
              <span className="desk-ticker-item">
                <span className="tabular-nums">{istHHMM(CRAWL_AT)} {IST_LABEL}</span> crawl{age ? (age.stale ? " STALE" : " FRESH") : ""}
              </span>
              <span className="desk-ticker-item">
                <span className="tabular-nums">{istHHMM(DIGEST_CADENCE.last_at)} {IST_LABEL}</span> digest HOLD→{istHHMM(DIGEST_CADENCE.next_at)}
              </span>
              <span className="desk-ticker-item">
                lead{" "}
                <LeadInline view={leadV} />{" "}
                · Sol≠Astra
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
            {lane === "brief" ? (
              <LeadLogCtx.Provider value={leadLogState}>
                <Brief />
              </LeadLogCtx.Provider>
            ) : null}
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
        data-sage-built={builtAt || undefined}
        aria-label="Build health"
      >
        <p className="desk-build-stamp font-mono text-kicker uppercase tracking-kicker tabular-nums">
          <span className="desk-keys-hint">? keys</span>
          <span
            className="desk-build-stamp-text"
            data-sage-stamp={stamp.text}
            data-sage-commit={commit || undefined}
            data-sage-crawl-commit={crawlCommit || undefined}
            title={`build ${buildId} · built ${builtAt ? `${istDateTime(builtAt)} ${IST_LABEL}` : "—"} · crawl ${istDateTime(CRAWL_AT)} ${IST_LABEL}${stamp.crawlShort ? ` · crawl commit ${stamp.crawlShort}` : ""}`}
          >
            build{" "}
            {stamp.commitHref ? (
              <a className="desk-build-stamp-link" href={stamp.commitHref} target="_blank" rel="noreferrer">
                {stamp.short}
              </a>
            ) : (
              stamp.short
            )}
            {` · deployed ${stamp.deployed} · `}
            {stamp.crawlHref ? (
              <a className="desk-build-stamp-link" href={stamp.crawlHref} target="_blank" rel="noreferrer" title={`crawl commit ${stamp.crawlShort}`}>
                crawl {stamp.crawl}
              </a>
            ) : (
              `crawl ${stamp.crawl}`
            )}
            {` ${IST_LABEL}`}
          </span>
        </p>
      </footer>
    </div>
    </PausesCtx.Provider>
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
  const now = useNow();
  const members = useMembers();
  // Chips from the same shared unit logic as Pulse (Σ chips = N SRC, WIRE copies once).
  const wireRowById = useMemo(() => {
    const ids = new Set(WIRE_ROWS.map((r) => r.id));
    return new Map(buildRows(PULSE_CLUSTERS.filter((c) => ids.has(c.id)), members).rows.map((r) => [r.id, r]));
  }, [members]);
  const { q, report, openStory, since } = useDeskKeys();
  const part = useMemo(
    () => partitionSince(WIRE_ROWS.filter((r) => matchesFilter(q, [r.title])), (r) => FIRST_SEEN.get(r.id), since),
    [q, since],
  );
  const rows = useMemo(() => [...part.since, ...part.rest], [part]);
  useEffect(() => report(rows.length, WIRE_ROWS.length), [rows.length, report]);
  // Empty Wire still renders its crawl stamp (Pages coherence gate reads it) with an honest zero line.
  return (
    <section className="brief-wire sage-panel sage-ticks lg:col-span-6" aria-label="Wire — live multi-source clusters">
      <div className="brief-wire-head">
        <span>{wireHeader(WIRE_CRAWL_AT, WIRE_ROWS)}</span>
        <span className="brief-wire-prev tabular-nums">
          {WIRE_PREV_CRAWL_AT ? `vs ${istanbulHHMM(WIRE_PREV_CRAWL_AT)}` : "first crawl"}
        </span>
      </div>
      {WIRE_ROWS.length === 0 ? (
        <p className="brief-wire-empty">0 stories with 2+ independent sources this crawl (the lead pick is never repeated here).</p>
      ) : null}
      <ol className="brief-wire-list" hidden={WIRE_ROWS.length === 0}>
        {rows.map((r, i) => {
          const mark = wireMark(r);
          const isNewSince = i < part.since.length;
          return (
            <Fragment key={r.id}>
            <li
              className="brief-wire-row"
              data-status={r.status}
              data-since={isNewSince ? "1" : undefined}
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
              <AgeCell iso={firstAtIso(r)} now={now} />
              <a className="brief-wire-headline focus-phosphor" data-row-clamp="wire" href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <span className="brief-wire-src" data-src-n={r.sources}>
                {wireRowById.get(r.id) ? <SrcChips chips={wireRowById.get(r.id)!.chips} multi max={3} /> : null}
                <span className="sage-src-chip sage-src-chip-multi tabular-nums">{r.sources} SRC</span>
              </span>
            </li>
            {since && part.since.length > 0 && i === part.since.length - 1 ? <SinceDivider base={since} n={part.since.length} /> : null}
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}

/** Today's lead for every spot outside the Brief plate too (status bar, INGEST line). `now` = null before mount. */
function leadViewAt(now: number | null): LeadView {
  return leadView({ held: LEAD_HELD, today: LEAD_TODAY, firstAt: LEAD_FIRST_AT }, now);
}

/** Status-bar / INGEST-line lead cell: the real headline only when there's a lead today, else muted HELD. */
function LeadInline({ view }: { view: LeadView }) {
  if (view.held)
    return (
      <span className="desk-lead-headline desk-lead-held" data-lead-held="1" title={view.carried ? `held · last lead: ${view.carried}` : "held"}>
        {LEAD_HELD_TEXT}
      </span>
    );
  return (
    <span className="desk-lead-headline" title={`lead ${view.id ?? ""}`}>
      {view.headline}
    </span>
  );
}

/** Beat 11 — lead log state handed from Desk (URL `?view=leadlog`) to the Brief. */
type LeadLogState = { leadLog: LeadLog; logOpen: boolean; openLog: () => void; closeLog: () => void };
const LeadLogCtx = createContext<LeadLogState>({ leadLog: EMPTY_LOG, logOpen: false, openLog: () => {}, closeLog: () => {} });

function Brief() {
  const { leadLog, logOpen, openLog, closeLog } = useContext(LeadLogCtx);
  // Lead staleness: crawl stamp on first render (SSR/static-stable), then the wall clock.
  // 24h lead-age HELD check runs in the browser after mount (static HTML ships only LEAD_FIRST_AT).
  const leadNow = useNow();
  const leadAge = leadNow == null ? null : leadAgeHours(LEAD_FIRST_AT, leadNow);
  // HELD (no qualifying story at the pick, e.g. every candidate GNW_ONLY) or lead story ≥24h old → HELD plate,
  // never the carried headline as if it were today's lead. Same source of truth as the status bar / INGEST line.
  const lv = leadViewAt(leadNow);
  const lead = lv.held ? null : LEAD_TODAY;
  const staleLead = lv.held ? LEAD_TODAY : null;
  // Next crawl slot (02/06/10/14/18/22 :11 Istanbul): wall clock after mount, crawl stamp in static HTML.
  const nextTry = nextCrawlSlotHHMM(leadNow ?? Date.parse(CRAWL_AT));
  const chkAt = useCheckedAt(CRAWL_AT);
  const age = leadNow == null ? null : crawlAgeHours(chkAt, leadNow);
  const waveMax = 956;
  const waveVals: Record<number, number> = { 1: 80, 2: 700, 3: 956 };
  const pip = [
    { id: "board", label: "board", val: "1,200", pct: 100, hot: false },
    { id: "hf", label: "HF wave", val: "~700", pct: Math.round((700 / 1200) * 100), hot: true },
    { id: "secrets", label: "secrets", val: "956", pct: Math.round((956 / 1200) * 100), hot: false },
  ] as const;
  return (
    <>
    {logOpen ? <LeadLogPanel log={leadLog} onClose={closeLog} /> : null}
    <div className="brief-v5 grid gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
      {/* Left · Pip-Boy needle rail */}
      <aside
        className="sage-panel sage-ticks sage-instrument sage-pip-rail flex flex-col gap-1 px-2 py-2 order-last lg:order-none lg:col-span-2 lg:row-span-3"
        aria-label="Cycle 003 board instrument rail"
      >
        <p className="font-mono text-kicker uppercase tracking-kicker text-primary">rail · cyc/003 board</p>
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
              age?.stale ? "sage-stale" : "sage-signal",
            )}
          >
            {age ? (age.stale ? `STALE ${age.hours.toFixed(1)}h` : `FRESH ${age.hours.toFixed(1)}h`) : `crawl ${istHHMM(CRAWL_AT)}`}
          </p>
          <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {istHHMMSS(CRAWL_AT)} {IST_LABEL}
          </p>
        </div>
      </aside>

      {/* Mid · inverse story plate — brightest surface */}
      <section
        className={cn(
          "sage-panel sage-ticks sage-bento-hero sage-take px-3 py-3 lg:col-span-6 lg:row-span-1",
          lv.held ? "sage-take-held" : "sage-take-inverse",
        )}
        aria-label="Brief take story"
        data-lead-state={lv.held ? lv.reason : "lead"}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker">Take · lead of the day</p>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {lead
              ? `${lead.reason === "seed" ? "cycle 003 seed" : "daily pick"} · ${lead.date}`
              : staleLead
                ? `held · last pick ${LEAD_YESTERDAY?.date ?? staleLead.date}`
                : "no pick yet"}
          </span>
        </div>
        {staleLead ? (
          <>
            {lv.reason === "held" ? (
              <p
                className="sage-lead-held font-mono text-kicker uppercase tracking-kicker tabular-nums"
                data-lead-held="1"
                title="a lead needs ≥2 SRC incl. one non-Google-News publisher · every crawl from 06:00 retries until one qualifies"
              >
                {LEAD_HELD_TEXT} · <span className="whitespace-nowrap">next try {nextTry}</span>
              </p>
            ) : (
              <p className="sage-lead-held font-mono text-kicker uppercase tracking-kicker tabular-nums" data-lead-stale="1">
                HELD · lead older than 24h ({leadAge != null ? `${Math.floor(leadAge)}h` : "—"}) · <span className="whitespace-nowrap">next try {nextTry}</span>
              </p>
            )}
            {staleLead.headline ? (
              <h2 className="sage-take-held-title font-display text-lg normal-case tracking-normal md:text-xl" data-lead-carried="1">
                {staleLead.headline}
              </h2>
            ) : null}
          </>
        ) : (
        <>
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
        </>
        )}
        {/* The Yesterday row is the only way into the log. When it would repeat the HELD plate's headline (or there is
            no yesterday), keep the row with just a right-aligned → LOG (≥44px tap) — same spot every day. */}
        {!LEAD_YESTERDAY || (lv.held && LEAD_YESTERDAY.headline === staleLead?.headline) ? (
          <a
            className="sage-take-yesterday sage-take-yesterday-link sage-take-yesterday-goonly focus-phosphor text-sm"
            href={`?view=${LEADLOG_VIEW}#brief`}
            data-leadlog-link="1"
            aria-label="Open the lead log"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              openLog();
            }}
          >
            <span className="sage-take-yesterday-go font-mono text-kicker uppercase tracking-kicker">→ log</span>
          </a>
        ) : (
          <a
            className="sage-take-yesterday sage-take-yesterday-link focus-phosphor text-sm"
            href={`?view=${LEADLOG_VIEW}#brief`}
            data-leadlog-link="1"
            aria-label={`Yesterday ${LEAD_YESTERDAY.date}: ${LEAD_YESTERDAY.headline} — open the lead log`}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              openLog();
            }}
          >
            <span className="font-mono text-kicker uppercase tracking-kicker">Yesterday · {LEAD_YESTERDAY.date}</span>{" "}
            <span className="line-clamp-1 sage-headline">{LEAD_YESTERDAY.headline}</span>
            <span className="sage-take-yesterday-go font-mono text-kicker uppercase tracking-kicker">→ log</span>
          </a>
        )}
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
          <span className="font-mono text-kicker uppercase tracking-kicker text-primary">companion</span>
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
                    <span className={cn(p.kind === "companion" && "text-primary", p.kind === "rest" && "text-subtle")}>
                      {ctx ? "archive · cycle 003 context" : p.kind}
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
    </>
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

function useMembers(): Record<string, PulseMemberInfo> {
  return MEMBERS;
}

/** Beat 8 — every source's own headline + time, keyed by member id (story drawer coverage list). */
function useMemberItems(): Record<string, MemberItem> {
  return useMemo(() => memberItems(MEMBER_ROWS, CRAWL_ITEM_IDS), []);
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
  now: number | null;
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
            {drawerKicker({ sources: row.sourceCount, firstSeen, age: now == null ? istHHMM(firstAtIso(cluster)) : compactAge(firstAtIso(cluster), now), mark })}
          </p>
          <p className="story-drawer-chips" data-src-n={row.sourceCount}>
            <SrcChips chips={row.chips} multi={row.multiSource} max={9} />
          </p>
        </header>
        <ol className="story-drawer-list" aria-label="Coverage by source">
          {coverage.map((c) => (
            <li key={c.id} className="story-drawer-item" data-self={c.self ? "1" : undefined}>
              {(() => {
                // Beat 10: the WHOLE source row is the link (≥44px); "open ↗" stays as the visible cue.
                const body = (
                  <>
                    <span className="story-drawer-src tabular-nums">
                      <span className={cn("pulse-v5-badge", c.self ? "pulse-v5-self" : c.lead ? "pulse-v5-src-lead" : "pulse-v5-also")}>
                        {c.badge}
                      </span>{" "}
                      {c.publisher} · {c.at ? `${istanbulHHMM(c.at)}${now == null ? "" : ` · ${compactAge(c.at, now)}`}` : "time —"}
                    </span>
                    <span className="story-drawer-headline">{c.title}</span>
                    {c.self ? <span className="story-drawer-selfcap">company&apos;s own post · counts 0</span> : null}
                    {row.wireCopyIds.includes(c.id) ? (
                      <span className="story-drawer-wirecap" data-wire-copy="1" title="press-release / wire copy — near-identical headline within 2h · counted once">
                        WIRE · same copy · counts once
                      </span>
                    ) : null}
                    {c.url ? (
                      <span className="story-drawer-open sage-signal" aria-hidden>
                        open ↗
                      </span>
                    ) : null}
                  </>
                );
                return c.url ? (
                  <a className="story-drawer-rowlink focus-phosphor" href={c.url} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                ) : (
                  <div className="story-drawer-rowlink" data-nolink="1">{body}</div>
                );
              })()}
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
const X_ROWS: ClusterInput[] = xRows(X_POSTS, MEMBER_ROWS);

/** Beat 10 — topic heat strip (refs/UX-BEAT10-SINCE-HEAT.md). Bars = 4h routine windows; null = honest gap. */
function HeatStrip() {
  const { setFilter, q } = useDeskKeys();
  const cells = useMemo(() => heatCells(TOPIC_HEAT_WINDOWS), []);
  const max = Math.max(1, ...cells.flatMap((c) => c.bars.map((b) => b ?? 0)));
  const labels = TOPIC_HEAT_WINDOWS.map((w) => w.label);
  return (
    <div className="heat-strip" role="group" aria-label="Topic heat by company and other labs, last six 4-hour windows">
      <span className="heat-strip-kicker tabular-nums" title="one crawl per 4h routine window (02/06/10/14/18/22 Istanbul) · last crawl in the window · gaps = no crawl">
        {heatLabel(TOPIC_HEAT_WINDOWS)}
      </span>
      {cells.map((c) => (
        <button
          key={c.id}
          type="button"
          className="heat-cell focus-phosphor"
          data-cell={c.id}
          data-hot={c.hot ? "1" : undefined}
          aria-pressed={q.trim().toLowerCase() === c.filter}
          onClick={() => setFilter(c.filter)}
          aria-label={`${c.label}: ${c.current ?? "no data"} this window${c.drivers ? ` (${c.drivers})` : ""}${c.delta != null ? `, ${deltaText(c.delta)} vs previous` : ""}. Filter to ${c.label}.`}
          title={c.bars.map((b, i) => `${labels[i]}h ${b == null ? "gap" : b}`).join(" · ")}
        >
          <span className="heat-cell-label">{c.label}</span>
          <span className="heat-spark" aria-hidden>
            {c.bars.map((b, i) =>
              b == null ? (
                <span key={i} className="heat-bar heat-gap" title={`${labels[i]}h window · gap · no crawl`} />
              ) : (
                <span key={i} className="heat-bar" style={{ height: `${Math.max(8, Math.round((b / max) * 100))}%` }} />
              ),
            )}
          </span>
          <span className="heat-cell-num">
            <span className="heat-cell-count tabular-nums">{c.current ?? "—"}</span>
            {c.drivers ? <span className="heat-cell-drivers">{c.drivers}</span> : null}
          </span>
          <span className="heat-cell-delta tabular-nums" data-dir={c.delta == null ? undefined : c.delta > 0 ? "up" : c.delta < 0 ? "down" : "flat"}>
            {c.delta == null ? "gap" : deltaText(c.delta)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Pulse() {
  // First render = crawl stamp (SSR-stable); then wall clock.
  // Relative times after mount only (static HTML: absolute Istanbul times).
  const now = useNow();
  const pauses = useContext(PausesCtx);
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
  const { q, report, since } = useDeskKeys();
  const part = useMemo(
    () =>
      partitionSince(
        rows.filter(
          (r) =>
            matchesFilter(q, [r.title, r.leadBadge, ...r.alsoBadges, ...r.alsoPublishers, members[r.leadId]?.publisher]) ||
            companyFilterMatch(q, clusterById.get(r.id)),
        ),
        (r) => FIRST_SEEN.get(r.id),
        since,
      ),
    [rows, q, members, clusterById, since],
  );
  const filtered = useMemo(() => [...part.since, ...part.rest], [part]);
  useEffect(() => report(filtered.length, rows.length), [filtered.length, rows.length, report]);
  // Beat 10: every since-row stays visible above the divider, even past the top-N cap.
  const visible = showAll || q ? filtered : filtered.slice(0, Math.max(PULSE_V5_MAX_ROWS, part.since.length + PULSE_SINCE_TAIL));
  const chkAt = useCheckedAt(CRAWL_AT);
  const fresh = now == null ? null : crawlFreshness(chkAt, now);
  const health = [...SOURCE_HEALTH].sort(
    (a, b) => HEALTH_ORDER.indexOf(a.id) - HEALTH_ORDER.indexOf(b.id),
  );
  const tasteMeter = tasteSoftMeter(X_TASTE);
  const tasteItems = tasteAll ? X_TASTE.items : X_TASTE.items.slice(0, TASTE_VISIBLE_CAP);

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
          // Build-time merge from source-state.json first; a crawl-written paused_until on the row also counts.
          const rowUntil = (s as { paused_until?: string | null }).paused_until;
          const pause = pauses[s.id] ?? (rowUntil ? { until: rowUntil, reason: s.fail_reason } : undefined);
          if (isPausedAt(pause, now)) {
            // PAUSED (crawl skips the source until then) — dim, not the struck-through fail style.
            return (
              <span
                key={s.id}
                role="listitem"
                className="pulse-v5-health-cell"
                data-state="paused"
                title={`${s.id} · paused until ${istDateTime(pause!.until)} ${IST_LABEL}${pause!.reason ? ` · ${pause!.reason}` : ""}`}
              >
                <span className="pulse-v5-health-label">{HEALTH_LABEL[s.id] ?? s.id}</span>
                <span className="tabular-nums">PAUSED · until {istHHMM(pause!.until)}</span>
              </span>
            );
          }
          const state = healthCellState(s.state);
          const ticks = healthTicks(s.streak_ok);
          return (
            <span
              key={s.id}
              role="listitem"
              className="pulse-v5-health-cell"
              data-state={state}
              title={`${s.id} · ${s.state}${s.fail_reason ? ` · ${s.fail_reason}` : ""} · ok ${s.ok_7d}/${s.runs_7d} 7d · ledger ${istDateTime(SOURCE_HEALTH_AT)} ${IST_LABEL}`}
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
          {since && part.since.length === 0 ? (
            <span className="since-nothing tabular-nums">nothing since {istanbulHHMM(since)}</span>
          ) : null}
          {fresh == null ? (
            <span className="sage-signal tabular-nums" role="status" title={`crawl ${istDateTime(CRAWL_AT)} ${IST_LABEL}`}>
              CRAWL {istHHMM(CRAWL_AT)}
            </span>
          ) : fresh.stale ? (
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

      {/* 1b · Beat 10 topic heat — 4h routine windows, click a cell = filter to that company */}
      <HeatStrip />

      {/* 2 · Main grid — cluster table | Taste rail */}
      <div className="pulse-v5-grid">
        <section className="pulse-v5-table" aria-label="Pulse story clusters">
          <div className="pulse-v5-head" aria-hidden>
            <span>#</span>
            <span>NEW</span>
            <span className="pulse-v5-age">AGE</span>
            <span>HEADLINE</span>
            <span>SRC</span>
            <span className="pulse-v5-sig">UP</span>
          </div>
          <ol>
            {visible.map((r, i) => {
              const inDrawer = opensDrawer(r);
              const open = inDrawer ? drawer.openId === r.id : openClusterId === r.id;
              const lead = members[r.leadId];
              const sig = sigCell(r);
              const isNewSince = i < part.since.length;
              return (
                <Fragment key={r.id}>
                <li className="pulse-v5-row" data-open={open ? "1" : undefined}>
                  <div
                    role="button"
                    data-since={isNewSince ? "1" : undefined}
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
                    <AgeCell iso={clusterById.get(r.id) ? firstAtIso(clusterById.get(r.id)!) : r.at} now={now} />
                    <span className="pulse-v5-headline">{stripPublisher(r.title, lead?.publisher ?? "")}</span>
                    <span className="pulse-v5-src" data-src-n={r.sourceCount} title={`${r.sourceCount} SRC · ${r.chips.map(chipLabel).join(" ")}`}>
                      <SrcChips chips={r.chips} multi={r.multiSource} max={2} />
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
                {since && part.since.length > 0 && i === part.since.length - 1 ? (
                  <SinceDivider base={since} n={part.since.length} />
                ) : null}
                </Fragment>
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
          {tasteMeter.state === "soft" ? (
            <p className="pulse-v5-taste-skip" role="status" data-taste-meter={tasteMeter.detail}>
              shelf · soft · <span className="sage-deny">{tasteMeter.detail}</span>
              {tasteMeter.detail === "taste stale"
                ? " · prior honest shelf · no invent"
                : " · Session quiet / login wall — taste empty. Sign into X on Agent Computer Chrome, then re-run capture."}
            </p>
          ) : null}
          {X_TASTE.skipped || X_TASTE.items.length === 0 ? (
            tasteMeter.state === "soft" ? null : (
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
            )
          ) : (
            <ul>
              {tasteItems.map((it) => (
                <li key={it.id}>
                  <p className="pulse-v5-taste-kicker">
                    taste · {it.surface}
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
          {X_TASTE.items.length > TASTE_VISIBLE_CAP ? (
            <button type="button" className="pulse-v5-more focus-phosphor" onClick={() => setTasteAll((v) => !v)}>
              {tasteAll ? "fewer taste" : `+${X_TASTE.items.length - TASTE_VISIBLE_CAP} more taste`}
            </button>
          ) : null}
          <p className="pulse-v5-taste-kicker tabular-nums">
            kept {X_TASTE.counts.kept}/{X_TASTE.counts.seen} · land {X_TASTE.land}
            {tasteMeter.state === "soft" ? <> · meter {tasteMeter.detail}</> : null}
          </p>
        </aside>
      </div>

      {/* 3 · Footer ledger line — eligibility copy lives here once */}
      <p className="pulse-v5-foot tabular-nums">
        <span className="sage-deny">DENY</span> · {SOFT_FAIL_METERS.deny.join(" · ")} · briefEligible=false · Pulse never
        Brief · never sole lead · clusters {PULSE_CLUSTERS.length} · multi-source {rows.filter((r) => r.multiSource).length} · snap {istDateTime(PULSE_CLUSTERS_AT)} {IST_LABEL}
        {SOFT_FAIL_METERS.soft_count > 0 || tasteMeter.state === "soft" ? (
          <>
            {" · "}
            <span className="sage-deny">SOFT</span>{" "}
            {[...SOFT_FAIL_METERS.aggregate, tasteMeter.state === "soft" ? `X-session ${tasteMeter.detail}` : null]
              .filter(Boolean)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(" · ") || tasteMeter.detail}
          </>
        ) : null}
      </p>
    </div>
  );
}


/** Pass A — one shared unlock view for Digest + Voice (frozen at pick). */
function useDigestUnlock(): UnlockView {
  return useMemo(
    () =>
      resolveUnlock({
        held: LEAD_HELD,
        today: LEAD_TODAY
          ? {
              date: LEAD_TODAY.date,
              at: LEAD_TODAY.at,
              cluster_id: LEAD_TODAY.cluster_id,
              headline: LEAD_TODAY.headline,
              url: LEAD_TODAY.url,
              sources: LEAD_TODAY.sources,
              sig: LEAD_TODAY.sig,
              reason: LEAD_TODAY.reason,
              crawl_at: LEAD_TODAY.at,
            }
          : null,
        lastGood: DIGEST_UNLOCK,
      }),
    [],
  );
}

/** Pass A1 — Sep cycle-003 lead ids: archive / closed fold only, never the live Moved lead row. */
const ARCHIVE_LEAD_IDS = new Set(["hf-swarm", "hf-incident"]);

/** Pass A1 — Digest/Voice unlock + Brief's runtime HELD (same leadViewAt source as the Brief plate). Titles unchanged. */
function useLeadAwareUnlock(): UnlockView {
  const base = useDigestUnlock();
  const lv = leadViewAt(useNow());
  return useMemo(() => withLeadView(base, lv), [base, lv.held, lv.reason]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Pass A chrome: HELD / archive · 003 are a small kicker above the lead — never a second headline. */
function UnlockKicker({ view }: { view: UnlockView }) {
  if (!view.kicker) return null;
  return (
    <p
      className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums"
      data-unlock-kicker={view.stamp}
    >
      {view.kicker}
    </p>
  );
}

/** Pass A chrome: live lead uses the same Take title classes as Brief. */
function UnlockLeadTitle({
  row,
  className,
}: {
  row: UnlockRow;
  className?: string;
}) {
  const title = (
    <h2
      className={cn(
        "sage-take-title font-display text-2xl font-bold normal-case tracking-normal md:text-3xl",
        className,
      )}
      data-unlock-lead="1"
    >
      {row.url ? (
        <a href={row.url} target="_blank" rel="noreferrer" className="sage-take-link">
          {row.title}
        </a>
      ) : (
        row.title
      )}
    </h2>
  );
  return <div className="sage-take-plate">{title}</div>;
}

/** CYCLE.003 pins — closed fold; does not compete with today's lead. Pass A2: rows load lazily on first open. */
function CycleArchiveFold() {
  const [open, setOpen] = useState(false);
  const [pins, setPins] = useState<ArchiveRow[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
    if (!e.currentTarget.open || state === "loading" || state === "ready") return;
    setState("loading");
    loadArchive()
      .then((a) => {
        setPins(a.archiveFoldRows());
        setState("ready");
      })
      .catch(() => setState("error"));
  };
  return (
    <details className="sage-panel sage-ticks digest-archive-fold" data-archive-fold="003" data-archive-state={state} onToggle={onToggle}>
      <summary className="cursor-pointer px-2.5 py-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
        archive · 003 · {CYCLE.pins.length} pins · <span data-archive-fold-label>{archiveFoldLabel(open)}</span>
      </summary>
      <ul className="space-y-1 border-t border-line px-2.5 py-2" style={{ minHeight: `${CYCLE.pins.length * 3.25}rem` }}>
        {state === "ready" && pins ? (
          pins.map((p) => (
            <li key={p.id} className="pin-card-quiet px-2 py-1">
              <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                {p.kind} · {p.id}
              </p>
              <p className="truncate text-sm text-muted">{p.title}</p>
            </li>
          ))
        ) : (
          <li className="px-2 py-1 font-mono text-kicker uppercase tracking-kicker text-subtle" data-archive-note={state === "error" ? "unavailable" : "loading"}>
            {state === "error" ? "archive unavailable" : "loading archive · 003…"}
          </li>
        )}
      </ul>
    </details>
  );
}

function Digest() {
  const unlock = useLeadAwareUnlock();
  // Pass A1: when unlock live, Moved pin follows DIGEST_UNLOCK lead — never hf-swarm (archive only).
  const movedUnlock = unlock.stamp !== "archive" && !!unlock.leadId;
  const movedLeadId = movedUnlock ? unlock.leadId : RANK_CURRENT.lead_id;
  const liveRows = useMemo(() => [unlock.lead, ...unlock.rows], [unlock]);
  const [openId, setOpenId] = useState(unlock.lead.id);
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
  // Relative values after mount only; before mount (static HTML) evaluate at the last tick — deterministic.
  const now = useNow();
  const cadenceNow = now ?? Date.parse(DIGEST_CADENCE.last_at);
  const diskCadence = useMemo(
    () =>
      isDigestDue(
        {
          last_at: DIGEST_CADENCE.last_at,
          next_at: DIGEST_CADENCE.next_at,
          pack_id: DIGEST_CADENCE.pack_id,
        },
        cadenceNow,
      ),
    [cadenceNow],
  );
  const cadence = useMemo(() => nextDue(last ?? DIGEST_CADENCE.last_at, cadenceNow), [last, cadenceNow]);
  const due = diskCadence.due;
  const nextAt = diskCadence.nextAt;
  const item = liveRows.find((i) => i.id === openId) ?? unlock.lead;
  const tickAgeH = useMemo(() => {
    const t = Date.parse(DIGEST_CADENCE.last_at);
    if (now == null || !Number.isFinite(t)) return null;
    return (now - t) / 3_600_000;
  }, [now]);
  const windowSpan = useMemo(() => {
    const a = Date.parse(DIGEST_CADENCE.last_at);
    const b = Date.parse(nextAt);
    if (now == null || !Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
    return Math.max(0, Math.min(100, Math.round(((now - a) / (b - a)) * 100)));
  }, [nextAt, now]);

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
              {istHHMM(nextAt)}
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
                tickAgeH != null && tickAgeH > 6 ? "sage-stale" : "sage-signal",
              )}
            >
              {tickAgeH != null && Number.isFinite(tickAgeH) ? `${tickAgeH.toFixed(1)}h ago` : istHHMM(DIGEST_CADENCE.last_at)}
            </p>
            <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {istHHMMSS(DIGEST_CADENCE.last_at)} {IST_LABEL}
            </p>
          </div>
        </aside>

        {/* Mid · unlocked lead / open row — Brief Take chrome (Pass A) */}
        <section
          className="sage-panel sage-ticks sage-panel-glow holo-edge sage-bento-hero sage-take px-4 py-3 lg:col-span-6 lg:row-span-1"
          aria-label="Digest report body"
          data-unlock-stamp={unlock.stamp}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker">
              Report · story
            </p>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {item.kind} · cyc/{CYCLE.id} · {unlock.stamp}
            </span>
          </div>
          <UnlockKicker view={unlock} />
          {item.kind === "lead" ? (
            <UnlockLeadTitle row={item} />
          ) : (
            <h2 className="sage-take-title mt-1 font-display text-xl font-bold normal-case tracking-normal md:text-2xl">
              {item.title}
            </h2>
          )}
          <dl className="pin-meta mt-3 max-w-prose">
            <dt>take</dt>
            <dd className="text-phosphor-bright">{item.take}</dd>
            <dt>why</dt>
            <dd className="text-muted">{item.why}</dd>
            <dt className="sage-signal">move</dt>
            <dd className="sage-signal">{item.move}</dd>
          </dl>
        </section>

        {/* Right · unlocked rows + closed archive · 003 fold */}
        <div className="digest-item-rail flex flex-col gap-1.5 lg:col-span-4 lg:row-span-2">
          <div
            className="pin-legend-rail sage-panel sage-ticks flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
            aria-label="Digest item rail"
          >
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">items</span>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {liveRows.length} · unlock · cyc/{CYCLE.id}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {liveRows.map((i, idx) => {
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
                      [{String(idx + 1).padStart(2, "0")}] · {i.kind}
                      {i.sources ? ` · ${i.sources} SRC` : ""}
                    </p>
                    <p
                      data-row-clamp="digest"
                      className={cn(
                        "mt-0.5 truncate text-sm",
                        open ? "text-phosphor-bright" : "text-phosphor",
                      )}
                    >
                      {i.title}
                    </p>
                    <p className="mt-0.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
                      {open ? "open" : "ready"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          <CycleArchiveFold />
        </div>

        {/* Under mid · next window / pack span */}
        <section
          className="sage-panel sage-ticks overflow-hidden lg:col-span-6"
          aria-label="Digest next window"
        >
          <div className="sage-panel-header">Next window · pack span</div>
          <div className="p-2.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {istHHMM(DIGEST_CADENCE.last_at)} → {istHHMM(nextAt)} {IST_LABEL} · {DIGEST_CADENCE.pack_id}
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
            <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle" data-pack-source={unlock.stamp === "archive" ? "archive" : "unlock"}>
              {unlock.stamp === "archive"
                ? `archive · cyc/${CYCLE.id} · Sol≠Astra`
                : `unlock · ${unlock.leadId ?? unlock.lead.id} · pick ${unlock.pickDate ?? "—"} · cyc/${CYCLE.id} · Sol≠Astra`}
            </p>
          </div>
        </section>

        {/* Beat 4 · Moved since last crawl — corroboration rank vs previous snapshot */}
        <section
          className="sage-panel sage-ticks sage-moved overflow-hidden lg:col-span-12"
          aria-label="Moved since last crawl"
        >
          <div className="sage-panel-header">Moved since last crawl · corroboration rank below lead</div>
          <div className="px-2.5 py-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums" data-moved-lead={movedLeadId}>
              crawl {RANK_PREV?.crawl_at ? istDateTime(RANK_PREV.crawl_at) : "—"} → {istDateTime(RANK_CURRENT.crawl_at)} {IST_LABEL} · lead {movedLeadId} pinned · ×
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
              {movedUnlock ? (
                <li className="sage-moved-row" data-status="same" data-unlock-lead="1" data-row-clamp="moved">
                  <span className="sage-moved-delta">=</span>
                  <span className="sage-moved-item truncate">{movedLeadId} · lead · pick {unlock.pickDate}</span>
                  <span className="tabular-nums" data-label="rank">1</span>
                  <span className="tabular-nums" data-label="base">—</span>
                  <span className="tabular-nums" data-label="SRC">{unlock.lead.sources}</span>
                  <span className="tabular-nums" data-label="×">pin</span>
                </li>
              ) : null}
              {(movedUnlock ? RANK_MOVED.filter((m) => !ARCHIVE_LEAD_IDS.has(m.id)) : RANK_MOVED).map((m) => {
                const r = RANK_CURRENT.rows.find((x) => x.id === m.id);
                const glyph =
                  m.status === "up" ? "▲" : m.status === "down" ? "▼" : m.status === "new" ? "NEW" : m.status === "gone" ? "OUT" : "=";
                return (
                  <li key={m.id} className="sage-moved-row" data-status={m.status} data-corroboration={m.by_corroboration ? "1" : undefined}>
                    <span className="sage-moved-delta">{glyph}</span>
                    <span className="sage-moved-item truncate">
                      {m.id}
                      {r?.lead ? " · lead" : ""}
                      {m.by_corroboration ? " · moved by SRC" : ""}
                    </span>
                    <span className="tabular-nums" data-label="rank">
                      {m.prev_rank ?? "—"}→{m.rank ?? "—"}
                    </span>
                    <span className="tabular-nums" data-label="base">{r?.base_rank ?? "—"}</span>
                    <span className="tabular-nums" data-label="SRC">
                      {m.prev_sources ?? "—"}→{m.sources ?? "—"}
                    </span>
                    <span className="tabular-nums" data-label="×">{r?.lead ? "pin" : r?.mult ?? "—"}</span>
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
        <div className="sage-panel-header">Ops · preview browser-only · downloads</div>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <button
            type="button"
            className="focus-phosphor h-9 bg-accent px-3 font-mono text-kicker uppercase tracking-kicker text-accent-fg"
            onClick={runPreview}
            title="preview only · bun run digest:tick"
          >
            Preview report
          </button>
          <button
            type="button"
            className="term focus-phosphor h-9 px-3 font-mono text-kicker uppercase tracking-kicker"
            onClick={() =>
              void loadArchive().then((a) =>
                download(
                  `sage-digest-${DIGEST_CADENCE.pack_id.replace(/:/g, "")}.md`,
                  a.renderReport(a.DIGEST_ITEMS, last ?? DIGEST_CADENCE.last_at),
                  "text/markdown",
                ),
              )
            }
          >
            Download report.md
          </button>
          <button
            type="button"
            className="term focus-phosphor h-9 px-3 font-mono text-kicker uppercase tracking-kicker"
            title="UI twin JSON · bun run pack:export"
            onClick={() =>
              void loadArchive().then((a) => download(
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
                    digest: { at: last, items: a.DIGEST_ITEMS, plan: a.renderPlan(), dropped: a.DROPPED },
                    cycle_snapshot: { CYCLE, WAVES, WAVE_TIMELINE: a.WAVE_TIMELINE },
                  },
                  null,
                  2,
                ),
                "application/json",
              ))
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
        <div className="sage-panel-header">Toolkit shelf · classifyUrl · never Brief</div>
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
  // Pass A2: Papers rows are a lazy chunk (desk-view-papers.ts) — fetched when this lane mounts, never in First Load.
  const [papers, setPapers] = useState<readonly PaperInput[] | null>(null);
  const [papersErr, setPapersErr] = useState(false);
  useEffect(() => {
    let live = true;
    import("@/data/desk-view-papers")
      .then((m) => live && setPapers(m.PAPERS as unknown as PaperInput[]))
      .catch(() => live && setPapersErr(true));
    return () => {
      live = false;
    };
  }, []);
  const allRows = useMemo(() => (papers ? buildPaperRows(papers as PaperInput[]) : []), [papers]);
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
        PAPERS · {papers ? `${rows.length} rows` : papersErr ? "papers unavailable" : "loading papers…"} · HF daily + arXiv/OpenAlex/Crossref enrich · never Brief
      </p>
      <section className="pulse-v5-table" aria-label="Papers table">
        <div className="papers-v6-head" aria-hidden>
          <span>#</span>
          <span className="pulse-v5-sig">UP</span>
          <span className="pulse-v5-age">DATE</span>
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
                  <span className={cn("pulse-v5-age tabular-nums", !p.date && "pulse-v5-sig-dim")}>{p.date ?? "—"}</span>
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
  const unlock = useLeadAwareUnlock();
  const [playing, setPlaying] = useState(false);
  const [level, setLevel] = useState(0);
  const [beat, setBeat] = useState<VoiceBeatId>("idle");
  const lead = unlock.lead;

  const script = useMemo(
    () => ({
      take: lead.title,
      why: lead.take,
      move:
        unlock.rows.length > 0
          ? unlock.rows.map((r) => r.title).join(" · ")
          : lead.move,
    }),
    [lead, unlock.rows],
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
      <div className="voice-v4 grid min-w-0 max-w-full grid-cols-1 gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
        {/* Left · VU meters Ava / Andrew */}
        <aside
          className="sage-panel sage-ticks sage-instrument flex min-w-0 flex-col gap-2 px-2.5 py-2 lg:col-span-2 lg:row-span-2"
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
          className="sage-panel sage-ticks sage-panel-glow holo-edge sage-bento-hero sage-take min-w-0 break-words px-4 py-3 lg:col-span-6 lg:row-span-1"
          aria-label="Voice script"
          data-unlock-stamp={unlock.stamp}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker">
              Script · story
            </p>
            <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              lead · cyc/{CYCLE.id} · TAKE→WHY→MOVE
            </span>
          </div>
          <UnlockKicker view={unlock} />
          <UnlockLeadTitle row={lead} />
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
          {unlock.rows.length ? (
            <ul className="mt-3 max-w-prose space-y-1 border-t border-line pt-2 text-sm text-muted" data-voice-rows="1">
              {unlock.rows.map((r) => (
                <li key={r.id} data-row-clamp="voice" className="border-l-2 border-phosphor pl-3 truncate">
                  {r.title}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Right · clip / speaker / TTS chain — quiet */}
        <div className="voice-ops-rail flex min-w-0 flex-col gap-1.5 lg:col-span-4 lg:row-span-2">
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
              lead {lead.id} · unlock
            </p>
            <CycleArchiveFold />
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
            {`Podcast mix offline · unlock · cyc/${CYCLE.id} · Sol≠Astra`}
          </p>
        </div>

        {/* Under mid · waveform / chain progress */}
        <section
          className="sage-panel sage-ticks min-w-0 overflow-hidden lg:col-span-6"
          aria-label="Voice chain progress"
        >
          <div className="sage-panel-header">Waveform · chain progress</div>
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
        <div className="sage-panel-header">Governance · trust close</div>
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
          <div className="sage-panel-header">Wikidata DENY · grounding only</div>
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
