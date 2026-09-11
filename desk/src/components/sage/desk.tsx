"use client";
import { useEffect, useMemo, useState } from "react";
import { CYCLE, WAVES, WAVE_TIMELINE } from "@/data/cycle";
import { CRAWL, CRAWL_AT } from "@/data/x-crawl";
import { HN_PULSE, HN_PULSE_AT } from "@/data/hn-pulse";
import { RSS_LABS, RSS_LABS_AT } from "@/data/rss-labs";
import { GNEWS_RSS, GNEWS_RSS_AT } from "@/data/gnews-rss";
import { RSS_SECURITY, RSS_SECURITY_AT } from "@/data/rss-security";
import { X_TASTE } from "@/data/x-taste";
import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE } from "@/data/digest-pack";
import { DIGEST_CADENCE } from "@/data/digest-cadence";
import { PAPERS } from "@/data/papers";
import { SHELF } from "@/data/shelf";
import { WIKIDATA_DENY_LAST } from "@/data/wikidata-deny-last";
import { SOFT_FAIL_METERS } from "@/data/soft-fail-meters";
import { isDigestDue, nextDue, PACK_KEY, renderPlan, renderReport } from "@/lib/digest-pack";
import { crawlAgeHours } from "@/lib/x-pulse";
import { cn } from "@/lib/cn";

const LANES = ["brief", "pulse", "digest", "papers", "voice", "governance"] as const;
type Lane = (typeof LANES)[number];

function laneFromHash(): Lane {
  const raw = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  return (LANES as readonly string[]).includes(raw) ? (raw as Lane) : "brief";
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

export function Desk({ buildId = "dev", serverStartedAt = "" }: DeskProps) {
  const [lane, setLane] = useState<Lane>("brief");
  const buildShort = buildId.length > 12 ? buildId.slice(0, 12) : buildId;
  useEffect(() => {
    setLane(laneFromHash());
    const onHash = () => setLane(laneFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id: Lane) => {
    setLane(id);
    if (typeof window !== "undefined") window.location.hash = id;
  };

  const age = crawlAgeHours(CRAWL_AT);
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
              <span className={cn("desk-chip", age.stale ? "sage-stale" : "desk-chip-live")}>
                {age.stale ? `STALE ${age.hours.toFixed(1)}H` : "PULSE LIVE"}
              </span>
              <span className="desk-chip desk-chip-live tabular-nums" title="crawl snap">
                crawl {CRAWL_AT}
              </span>
              <span className="desk-chip desk-chip-quiet tabular-nums" title="cycle compile">cyc {CYCLE.compiledAt}</span>
            </div>
          </div>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            ingest · snap {CRAWL_AT} · pack {PACK_AT} · lead {CYCLE.pins[0]?.id}
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
                lead {CYCLE.pins[0]?.id} · Sol≠Astra
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
            {LANES.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                aria-current={lane === id ? "page" : undefined}
                className={cn("desk-lane-btn focus-phosphor", lane === id && "block-cursor")}
              >
                <span className="lane-prefix" aria-hidden>
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                {id}
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
            <span className="tabular-nums">policy {CYCLE.leadPolicy} · pins {CYCLE.pins.length}/3</span>
          </div>
          <div className="relative z-10 p-3 md:p-4">
            {lane === "brief" ? <Brief /> : null}
            {lane === "pulse" ? <Pulse /> : null}
            {lane === "digest" ? <Digest /> : null}
            {lane === "papers" ? <Papers /> : null}
            {lane === "voice" ? <Voice /> : null}
            {lane === "governance" ? <Gov /> : null}
          </div>
        </div>
      </main>
      <footer
        className="desk-footer relative z-10 mx-auto max-w-7xl px-4 pb-3 pt-1 md:px-6"
        data-sage-build={buildId}
        data-sage-boot={serverStartedAt || undefined}
        aria-label="Build health"
      >
        <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
          {`build ${buildShort}${serverStartedAt ? ` · boot ${serverStartedAt}` : ""}`}
        </p>
      </footer>
    </div>
  );
}

function Brief() {
  const age = crawlAgeHours(CRAWL_AT);
  const waveMax = 956;
  const waveVals: Record<number, number> = { 1: 80, 2: 700, 3: 956 };
  return (
    <div className="brief-v4 grid gap-2 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
      {/* Left instrument cluster — katagami break */}
      <aside
        className="sage-panel sage-ticks sage-instrument flex flex-col gap-2 px-2.5 py-2 lg:col-span-2 lg:row-span-2"
        aria-label="Instrument cluster"
      >
        <p className="font-mono text-kicker uppercase tracking-kicker text-amber">cluster · meters</p>
        <div className="sage-kpi sage-kpi-stack px-2 py-1.5">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">board</p>
          <p className="sage-metric font-display text-xl tabular-nums text-phosphor">1,200</p>
        </div>
        <div className="sage-kpi sage-kpi-stack sage-kpi-hot px-2 py-1.5">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">HF wave</p>
          <p className="sage-metric font-display text-xl tabular-nums text-phosphor">~700</p>
        </div>
        <div className="sage-kpi sage-kpi-stack px-2 py-1.5">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">secrets</p>
          <p className="sage-metric font-display text-xl tabular-nums text-phosphor">956</p>
        </div>
        <div className="mt-auto border-t border-line pt-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">crawl</p>
          <p className={cn("font-mono text-kicker uppercase tracking-kicker tabular-nums", age.stale ? "sage-stale" : "sage-signal")}>
            {age.stale ? `STALE ${age.hours.toFixed(1)}h` : `FRESH ${age.hours.toFixed(1)}h`}
          </p>
          <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {CRAWL_AT.slice(11, 19)}Z
          </p>
        </div>
      </aside>

      {/* Take — story break, spans mid */}
      <section className="sage-panel sage-ticks sage-panel-glow holo-edge sage-bento-hero sage-take px-4 py-3 lg:col-span-6 lg:row-span-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="lane-kicker font-mono text-kicker uppercase tracking-kicker text-amber">Take · story</p>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">lead · hf-incident</span>
        </div>
        <h2 className="sage-take-title mt-2 font-display text-3xl font-medium normal-case tracking-normal text-phosphor-bright md:text-4xl">
          {CYCLE.exec[0]}
        </h2>
        <ul className="mt-3 max-w-prose space-y-1.5 text-sm text-muted">
          {CYCLE.exec.slice(1).map((line) => (
            <li key={line} className="border-l-2 border-phosphor pl-3">
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Pins — dense stack · compact legend rail */}
      <div className="pin-col flex flex-col gap-1.5 lg:col-span-4 lg:row-span-2">
        <div
          className="pin-legend-rail sage-panel sage-ticks flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
          aria-label="Pin legend"
        >
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">pins</span>
          <span className="inline-flex items-center gap-1 font-mono text-kicker uppercase tracking-kicker">
            <span className="sage-lead-badge">lead</span>
          </span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-amber">companion</span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">rest</span>
          <span className="ml-auto font-mono text-kicker uppercase tracking-kicker text-subtle">
            Sol≠Astra · ≠2nd lead
          </span>
        </div>
        <ol className="flex flex-col gap-1.5">
          {CYCLE.pins.map((p) => (
            <li
              key={p.id}
              className={cn(
                "sage-panel sage-ticks pin-card px-2.5 py-2",
                p.kind === "lead" && "sage-lead sage-lead-frame",
                p.kind !== "lead" && "pin-card-quiet",
              )}
            >
              <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                <span
                  className={cn(
                    p.kind === "lead" && "sage-lead-badge",
                    p.kind === "companion" && "text-amber",
                    p.kind === "rest" && "text-subtle",
                  )}
                >
                  {p.kind}
                </span>{" "}
                · <span className="tabular-nums">{p.id}</span>
              </p>
              <h3
                className={cn(
                  "mt-0.5 font-display font-medium normal-case tracking-wide",
                  p.kind === "lead" ? "text-base text-phosphor-bright" : "text-sm text-phosphor",
                )}
              >
                {p.title}
              </h3>
              <dl className={cn("pin-meta mt-1", p.kind !== "lead" && "pin-meta-dense")}>
                <dt>take</dt>
                <dd className={p.kind !== "lead" ? "line-clamp-2" : undefined}>{p.take}</dd>
                {p.kind === "lead" ? (
                  <>
                    <dt>why</dt>
                    <dd className="text-muted">{p.why}</dd>
                    <dt className="sage-signal">move</dt>
                    <dd className="sage-signal">{p.move}</dd>
                  </>
                ) : (
                  <>
                    <dt className="sage-signal">move</dt>
                    <dd className="sage-signal line-clamp-2">{p.move}</dd>
                  </>
                )}
              </dl>
            </li>
          ))}
        </ol>
      </div>

      {/* Asymmetric waves under Take */}
      <section className="sage-panel sage-ticks overflow-hidden lg:col-span-6" aria-label="Three waves">
        <div className="sage-panel-header">Three waves · eval board cohorts</div>
        <div className="p-2.5">
          <p className="text-sm text-muted">
            Not a civilization chart. Split citation: METR waves 1–2; OpenAI wave 3.
          </p>
          <ul className="mt-2 grid gap-2 md:grid-cols-6">
            {WAVES.map((w) => {
              const pct = Math.round(((waveVals[w.id] ?? 0) / waveMax) * 100);
              return (
                <li
                  key={w.id}
                  className={cn(
                    "sage-panel sage-ticks p-2",
                    w.id === 2 ? "md:col-span-3 sage-wave-hot" : w.id === 3 ? "md:col-span-2" : "md:col-span-1",
                  )}
                >
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    Wave {w.id} · {w.label} · {w.cite}
                  </p>
                  <p className="sage-metric mt-1 font-display text-lg tabular-nums text-phosphor-bright">
                    {w.n}
                  </p>
                  <div
                    className="mt-2 h-1.5 w-full bg-bg-deep"
                    role="img"
                    aria-label={`Wave ${w.id} relative size ${pct}%`}
                  >
                    <div
                      className="h-full bg-phosphor"
                      style={{ width: `${pct}%`, opacity: 0.55 + pct / 200 }}
                    />
                  </div>
                  <p className={cn("mt-1.5 text-sm text-muted", w.id === 2 && "line-clamp-2")}>{w.scope}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle">
            {WAVE_TIMELINE.join(" → ")}
          </p>
          {age.stale ? (
            <p className="sage-stale mt-1">STALE · crawl {age.hours.toFixed(1)}h</p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-3 lg:col-span-12" aria-label="Brief trust strip">
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker sage-signal">ALLOW</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {CYCLE.trust.allow.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker sage-deny">DENY</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {CYCLE.trust.deny.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="sage-panel sage-ticks px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-muted">Open</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {CYCLE.trust.open.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Pulse() {
  const age = crawlAgeHours(CRAWL_AT);
  const [openSecId, setOpenSecId] = useState<string | null>(null);
  return (
    <div className="sage-lane-craft lane-pulse">
      <div className="sage-panel sage-ticks lane-craft-pulse-header mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
        <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
          Pulse · snap {CRAWL_AT}
        </p>
        {age.stale ? (
          <p className="sage-stale" role="status">
            STALE · crawl {age.hours.toFixed(1)}h · bun run ingest
          </p>
        ) : (
          <p className="sage-signal font-mono text-kicker uppercase tracking-kicker tabular-nums" role="status">
            FRESH · {age.hours.toFixed(1)}h
          </p>
        )}
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {CRAWL.map((p) => (
          <li key={p.id} className="sage-panel sage-ticks overflow-hidden">
            {p.media ? (
              <img src={p.media} alt="" className="h-40 w-full object-cover opacity-80" crossOrigin="anonymous" />
            ) : null}
            <div className="p-4">
              <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                @{p.handle} · {p.tag} · {p.likes}♥
              </p>
              <p className="mt-2 text-sm">{p.take}</p>
              <p className="mt-2 text-sm text-muted">{p.text}</p>
              <a href={p.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center text-sm sage-signal">
                Open source
              </a>
            </div>
          </li>
        ))}
      </ul>
      <section className="mt-4" aria-label="HN Algolia chatter">
        <div className="sage-panel sage-ticks mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            HN chatter · {HN_PULSE_AT} · pulse only
          </p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            never Brief · {HN_PULSE.length} hits
          </p>
        </div>
        {HN_PULSE.length === 0 ? (
          <p className="text-sm text-muted">No HN Pulse candidates. Run bun run ingest.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {HN_PULSE.map((h) => (
              <li key={h.id} className="sage-panel sage-ticks overflow-hidden">
                <div className="p-4">
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    hn/{h.author} · {h.tag} · {h.score}pts · {h.source}
                  </p>
                  <p className="mt-2 text-sm text-phosphor-bright">{h.text}</p>
                  <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                    {h.id} · {h.at}
                  </p>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-11 items-center text-sm sage-signal"
                  >
                    Open HN / story
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-4" aria-label="Lab blog RSS">
        <div className="sage-panel sage-ticks mb-3 flex flex-wrap items-center justify-between gap-2 p-3">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            Lab RSS · {RSS_LABS_AT || "—"} · pulse only
          </p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            never Brief · {RSS_LABS.length} hits
          </p>
        </div>
        {RSS_LABS.length === 0 ? (
          <p className="text-sm text-muted">No lab RSS items. Run bun run ingest.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {RSS_LABS.map((r) => (
              <li key={r.id} className="sage-panel sage-ticks overflow-hidden">
                <div className="p-4">
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    {r.lab} · {r.tag} · {r.source}
                  </p>
                  <p className="mt-2 text-sm text-phosphor-bright">{r.title}</p>
                  {r.summary ? (
                    <p className="mt-2 text-sm text-muted">{r.summary.slice(0, 220)}</p>
                  ) : null}
                  <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                    {r.id} · {r.published}
                  </p>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-11 items-center text-sm sage-signal"
                  >
                    Open lab post
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>


      <section className="mt-4" aria-label="Soft-fail health meters">
        <div className="sage-panel sage-ticks px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              FREE FEEDS · soft-fail meters
            </p>
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              snap {SOFT_FAIL_METERS.stamped_at} · never Brief
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Provider health chips">
            {SOFT_FAIL_METERS.providers.map((c) => {
              const chipClass =
                c.state === "ok"
                  ? "desk-chip desk-chip-live"
                  : c.state === "soft"
                    ? "desk-chip desk-chip-warn"
                    : "desk-chip desk-chip-quiet";
              const statusLabel = c.state === "ok" ? "OK" : c.state === "soft" ? "soft" : "DENY";
              return (
                <span key={c.id} role="listitem" className={chipClass} title={c.detail}>
                  {c.label} · {statusLabel}
                  {c.state !== "ok" ? <> · {c.detail}</> : null}
                  {c.state === "ok" && c.detail === "landed" ? <> · landed</> : null}
                </span>
              );
            })}
          </div>
          <p
            className={
              SOFT_FAIL_METERS.soft_count
                ? "mt-2 font-mono text-kicker uppercase tracking-kicker text-amber"
                : "mt-2 font-mono text-kicker uppercase tracking-kicker sage-signal"
            }
            role="status"
          >
            {SOFT_FAIL_METERS.soft_count
              ? SOFT_FAIL_METERS.aggregate.join(" · ")
              : "ALL GREEN · 0 soft-fails"}
          </p>
          <p className="mt-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
            <span className="sage-deny">DENY</span>
            {" · "}
            {SOFT_FAIL_METERS.deny.join(" · ")}
          </p>
          <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle">
            briefEligible=false
          </p>
        </div>
      </section>

      <section className="mt-4" aria-label="Google News RSS spice">
        <div className="sage-panel sage-ticks mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            news · google rss · pulse only · {GNEWS_RSS_AT || "—"}
          </p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            never Brief · never sole lead · {GNEWS_RSS.length} hits
          </p>
        </div>
        {GNEWS_RSS.length === 0 ? (
          <div className="sage-panel sage-ticks pin-card-quiet px-3 py-2.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              shelf · quiet · empty/soft OK
            </p>
            <p className="mt-1 text-sm text-muted">
              No Google News spice yet. Soft-fail empty is honest — run bun run ingest. Never Brief · never sole Pulse lead.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {GNEWS_RSS.slice(0, 8).map((r) => (
              <li key={r.id} className="sage-panel sage-ticks pin-card-quiet px-3 py-2">
                <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                  news · google rss · pulse only
                  {r.publisher ? <> · {r.publisher}</> : null}
                  <> · {r.tag}</>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-phosphor">{r.title}</p>
                {r.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{r.summary.slice(0, 180)}</p>
                ) : null}
                <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle">
                  never Brief · never sole lead · {r.published}
                </p>
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex h-8 items-center font-mono text-kicker uppercase tracking-kicker sage-signal"
                >
                  open
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4" aria-label="Operator X-session taste">
        <div className="sage-panel sage-ticks mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            Taste · operator X-session · pulse only
          </p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            never Brief · never lead · paid API DENY
          </p>
        </div>
        {X_TASTE.skipped || X_TASTE.items.length === 0 ? (
          <div className="sage-panel sage-ticks pin-card-quiet px-3 py-2.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              shelf · skip
              {X_TASTE.soft_fail && X_TASTE.soft_fail_reason ? (
                <>
                  {" "}
                  · <span className="sage-deny">{X_TASTE.soft_fail_reason}</span>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-muted">
              Session quiet / login wall — taste empty. Sign into X on Agent Computer Chrome, then re-run dry-run.
              Cards stay below HN/RSS; never Brief lead.
            </p>
            <p className="mt-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              kept {X_TASTE.counts.kept}/{X_TASTE.counts.seen} · briefEligible=false · land {X_TASTE.land}
              {X_TASTE.stamped_at ? <> · stamp {X_TASTE.stamped_at}</> : null}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {X_TASTE.items.slice(0, 8).map((it) => (
              <li key={it.id} className="sage-panel sage-ticks pin-card-quiet px-3 py-2">
                <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                  taste · {it.surface}
                  {it.handle ? <> · @{it.handle}</> : null}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-phosphor">{it.text}</p>
                <p className="mt-1 font-mono text-kicker uppercase tracking-kicker text-subtle">
                  briefEligible=false · pulseLeadEligible=false
                </p>
                {it.url ? (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex h-8 items-center font-mono text-kicker uppercase tracking-kicker sage-signal"
                  >
                    open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4" aria-label="Security lab RSS">
        <div className="sage-panel sage-ticks overflow-hidden mb-2">
          <div className="sage-panel-header">&gt; Security RSS · ToB / Fox-IT / PZ · pulse only</div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
              {RSS_SECURITY_AT || "—"} · {RSS_SECURITY.length} hits
            </p>
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">never Brief</p>
          </div>
        </div>
        {RSS_SECURITY.length === 0 ? (
          <p className="text-sm text-muted">No security RSS items. Run bun run ingest.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {RSS_SECURITY.map((r, idx) => {
              const open = openSecId === r.id;
              return (
              <li key={r.id} className="sage-panel sage-ticks px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                      [{String(idx + 1).padStart(2, "0")}] · {r.lab} · {r.tag}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-phosphor-bright">{r.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.summary ? (
                      <button
                        type="button"
                        className="term focus-phosphor h-8 px-2 font-mono text-kicker uppercase tracking-kicker"
                        onClick={() => setOpenSecId(open ? null : r.id)}
                      >
                        {open ? "hide" : "exp"}
                      </button>
                    ) : null}
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-phosphor inline-flex h-8 items-center px-2 font-mono text-kicker uppercase tracking-kicker sage-signal"
                    >
                      open
                    </a>
                  </div>
                </div>
                {open && r.summary ? (
                  <p className="mt-2 max-w-prose border-t border-line pt-2 text-sm text-muted">
                    {r.summary.slice(0, 320)}
                  </p>
                ) : null}
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Digest() {
  const [view, setView] = useState<"plan" | "library" | "report">("plan");
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

  const runPreview = () => {
    const at = new Date().toISOString();
    setLast(at);
    setPreviewNote(true);
    try {
      localStorage.setItem(PACK_KEY, at);
    } catch {
      /* ignore */
    }
    setView("report");
  };

  return (
    <div className="sage-lane-craft lane-digest">
      <div className="sage-panel sage-ticks overflow-hidden">
        <div className="sage-panel-header">&gt; Digest · {PACK_SOURCE} · shelf</div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
          <h2 className="font-display text-lg tracking-wide text-phosphor-bright">Library and pack</h2>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">never Brief lead</p>
        </div>
        <p className="border-t border-line px-3 py-2 text-sm text-muted">
          02 Sep list scored, not dumped. Lead stays HF. Rest: AISLE curl CVEs + harness papers.
        </p>
      </div>
      <div className="sage-panel sage-ticks mt-3 overflow-hidden">
        <div className="sage-panel-header">&gt; Toolkit shelf · classifyUrl · never Brief</div>
        <p className="border-b border-line px-3 py-1.5 font-mono text-kicker uppercase tracking-kicker text-subtle">
          {SHELF.length} links · github-search off Pulse lead
        </p>
        <ul className="max-h-48 overflow-auto divide-y divide-line">
          {SHELF.slice(0, 16).map((s) => (
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
      <div className="sage-panel sage-ticks lane-craft-digest-panel mt-3 overflow-hidden">
        <div className="sage-panel-header">&gt; Cadence · VM digest:tick · 6h</div>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <span className={cn("desk-chip", due ? "desk-chip-live" : "sage-stale")}>
            {due ? "DUE" : "HOLD"}
          </span>
          <span className="desk-chip tabular-nums">pack {DIGEST_CADENCE.pack_id}</span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            last {DIGEST_CADENCE.last_at.slice(11, 16)}Z · next {nextAt.slice(11, 16)}Z
          </span>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            lead hf-incident · never invent pins
          </span>
        </div>
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
      <nav className="desk-lane mt-3" aria-label="Digest views">
        {(["plan", "library", "report"] as const).map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            aria-current={view === id ? "page" : undefined}
            className={cn("desk-lane-btn focus-phosphor", view === id && "block-cursor")}
          >
            <span className="lane-prefix">[{String(i + 1).padStart(2, "0")}]</span>
            {id}
          </button>
        ))}
      </nav>
      {view === "plan" ? (
        <ol className="mt-4 space-y-3">
          {plan.map((p, i) => (
            <li key={p.id} className="sage-panel sage-ticks p-3">
              <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                [{String(i + 1).padStart(2, "0")}] · {p.kind} · {p.file} · {p.confidence}
              </p>
              <h3 className="mt-2 text-base font-medium normal-case">{p.title}</h3>
              <p className="mt-2 text-sm sage-signal">{p.move}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                {p.evidence.map((e) => (
                  <li key={e.slice(0, 24)}>{e}</li>
                ))}
              </ul>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                {p.steps.map((s) => (
                  <li key={s.slice(0, 24)}>{s}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-subtle">Done when {p.doneWhen}</p>
              <p className="text-sm text-subtle">Unlock if {p.unlockIf}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {view === "library" ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-12">
          <ul className="space-y-2 lg:col-span-4">
            {DIGEST_ITEMS.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(i.id)}
                  className={cn(
                    "sage-panel sage-ticks focus-phosphor w-full p-3 text-left",
                    i.id === item.id && "sage-panel-glow term-amber",
                  )}
                >
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    {i.kind} · {i.confidence}
                  </p>
                  <p className="mt-1 text-sm normal-case">{i.title}</p>
                </button>
              </li>
            ))}
          </ul>
          <article className="sage-panel sage-ticks p-4 lg:col-span-8">
            <div className="sage-panel-header">{item.title}</div>
            <p className="mt-3 text-sm">{item.take}</p>
            <p className="mt-3 text-sm text-muted">{item.why}</p>
            <p className="mt-3 text-sm sage-signal">{item.move}</p>
          </article>
        </div>
      ) : null}
      {view === "report" ? (
        <pre className="sage-panel sage-ticks mt-4 max-h-[28rem] overflow-auto p-3 text-sm whitespace-pre-wrap">{report}</pre>
      ) : null}
    </div>
  );
}

function Papers() {
  const [openId, setOpenId] = useState<string | null>(null);
  const copyId = (id: string) => {
    void navigator.clipboard?.writeText(id);
  };
  return (
    <div className="sage-lane-craft lane-papers">
      <div className="sage-panel sage-ticks lane-craft-papers-panel overflow-hidden">
        <div className="sage-panel-header">&gt; Papers · HF daily + arXiv/OpenAlex/Crossref enrich · shelf</div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            {PAPERS.length} rows · abs/pdf · year/DOI when enriched
          </p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">never Brief</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {PAPERS.map((p, idx) => {
          const open = openId === p.id;
          return (
            <li key={p.id} className="sage-panel sage-ticks px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
                    [{String(idx + 1).padStart(2, "0")}] · {p.id} · {p.up}↑
                    {"year" in p && (p as { year?: number }).year != null
                      ? ` · ${(p as { year: number }).year}`
                      : ""}
                    {"doi" in p && typeof (p as { doi?: string }).doi === "string"
                      ? ` · ${(p as { doi: string }).doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}`
                      : ""}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-phosphor-bright">{p.title}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="term focus-phosphor h-8 px-2 font-mono text-kicker uppercase tracking-kicker"
                    onClick={() => setOpenId(open ? null : p.id)}
                  >
                    {open ? "hide" : "exp"}
                  </button>
                  <button
                    type="button"
                    className="term focus-phosphor h-8 px-2 font-mono text-kicker uppercase tracking-kicker"
                    onClick={() => copyId(p.id)}
                  >
                    id
                  </button>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-phosphor inline-flex h-8 items-center px-2 font-mono text-kicker uppercase tracking-kicker sage-signal"
                  >
                    abs
                  </a>
                  {"pdfUrl" in p && typeof (p as { pdfUrl?: string }).pdfUrl === "string" ? (
                    <a
                      href={(p as { pdfUrl: string }).pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-phosphor inline-flex h-8 items-center px-2 font-mono text-kicker uppercase tracking-kicker sage-signal"
                    >
                      pdf
                    </a>
                  ) : null}
                </div>
              </div>
              {open ? (
                <p className="mt-2 max-w-prose border-t border-line pt-2 text-sm text-muted">
                  {"abstract" in p && typeof (p as { abstract?: string }).abstract === "string"
                    ? (p as { abstract: string }).abstract.slice(0, 600)
                    : "Abstract not mounted on this cycle. Open arXiv for full text."}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
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

  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="max-w-2xl space-y-3">
      <div className="sage-panel sage-ticks overflow-hidden">
        <div className="sage-panel-header">&gt; Voice · two-speaker ops · browser TTS fallback</div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
            Ava TAKE/MOVE · Andrew WHY · cyc/{CYCLE.id}
          </p>
          <span
            className={cn(
              "desk-chip",
              playing ? "desk-chip-live" : "text-subtle",
            )}
          >
            {playing ? `LIVE · ${beat}` : "READY"}
          </span>
        </div>
        <p className="border-t border-line px-3 py-2 text-sm text-muted">
          Podcast mix stays offline until a new primary unlocks. This lane reads the locked lead pin only.
        </p>
      </div>

      <div className="sage-panel sage-ticks overflow-hidden">
        <div className="sage-panel-header">&gt; Script · TAKE → WHY → MOVE</div>
        <dl className="pin-meta p-3">
          <dt className={cn(beat === "take" && "sage-signal")}>take</dt>
          <dd className={cn(beat === "take" && "text-phosphor-bright")}>{script.take}</dd>
          <dt className={cn(beat === "why" && "text-amber")}>why</dt>
          <dd className={cn("text-muted", beat === "why" && "text-phosphor-bright")}>{script.why}</dd>
          <dt className={cn(beat === "move" && "sage-signal")}>move</dt>
          <dd className={cn("sage-signal", beat === "move" && "text-phosphor-bright")}>{script.move}</dd>
        </dl>
      </div>

      <div className="sage-panel sage-ticks overflow-hidden">
        <div className="sage-panel-header">&gt; Deck · VU</div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <button
            type="button"
            className="focus-phosphor h-9 bg-accent px-3 font-mono text-kicker uppercase tracking-kicker text-accent-fg"
            onClick={playing ? stop : speakChain}
            aria-pressed={playing}
          >
            {playing ? "Stop" : "Play brief"}
          </button>
          <span className="font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            lead {lead?.id ?? "hf-incident"}
          </span>
        </div>
        <div className="border-t border-line px-3 pb-3 pt-2">
          <div
            className="flex h-14 items-end gap-0.5 border border-line bg-bg-deep p-1.5"
            role="img"
            aria-label={playing ? `VU level ${Math.round(level * 100)} percent` : "VU idle"}
          >
            {bars.map((i) => {
              const threshold = (i + 1) / bars.length;
              const on = playing && level >= threshold;
              const hot = threshold > 0.85;
              return (
                <div
                  key={i}
                  className={cn(
                    "min-w-0 flex-1",
                    on ? (hot ? "bg-amber" : "bg-phosphor") : "bg-phosphor-deep",
                  )}
                  style={{
                    height: `${14 + (i / (bars.length - 1)) * 86}%`,
                    opacity: on ? 0.5 + threshold * 0.5 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle tabular-nums">
            VU · phosphor · peak amber · {playing ? `${Math.round(level * 100)}%` : "00%"}
          </p>
        </div>
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
