"use client";
import { Fragment, useState, type CSSProperties } from "react";
import { IST_LABEL, istDateTime, istHHMM } from "@/lib/ist-time";
import { tapeLines, type LeadLog, type LogDay } from "@/lib/lead-log";
import { LEAD_HELD_TEXT } from "@/lib/lead-view";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/cn";

/** "2h ago" / "3d ago" — only ever called after mount (now != null). */
function agoText(iso: string, now: number): string {
  const m = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function Tape({ day }: { day: LogDay }) {
  const lines = tapeLines(day);
  return (
    <li className="leadlog-tape" aria-label={`Tape playback ${day.date}`}>
      <ol className="leadlog-tape-lines">
        {lines.map((l, i) => (
          <li key={i} className="leadlog-tape-line" data-kind={l.kind} style={{ "--i": i } as CSSProperties}>
            {l.kind === "head" ? (
              <span className="leadlog-tape-head">&gt; {l.text}</span>
            ) : (
              <>
                <span className="leadlog-tape-mark" aria-hidden>
                  {l.mark}
                </span>
                <span className="leadlog-tape-code">{l.code}</span>
                <span className="leadlog-tape-text">{l.text}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </li>
  );
}

/** Beat 11 — Pip-Boy holotape: one row per Istanbul day (newest first), click / Enter plays that day's tape. */
export function LeadLogPanel({ log, onClose }: { log: LeadLog; onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const now = useNow();
  const n = log.days.length;
  const toggle = (date: string) => setOpen((cur) => (cur === date ? null : date));
  return (
    <section className="leadlog sage-panel sage-ticks" aria-label="Lead log holotape" data-leadlog-days={n}>
      <div className="leadlog-head">
        <p className="leadlog-kicker">
          HOLOTAPE · LEAD LOG · {n} day{n === 1 ? "" : "s"}
        </p>
        <span className="leadlog-meta tabular-nums">
          {log.lastAt ? (
            <span title={`${istDateTime(log.lastAt)} ${IST_LABEL}`}>
              last pick {istHHMM(log.lastAt)} {IST_LABEL}
              {now != null ? ` · ${agoText(log.lastAt, now)}` : ""}
            </span>
          ) : (
            "no pick yet"
          )}
          {" · lead-history.json"}
        </span>
        <button type="button" className="leadlog-close focus-phosphor" onClick={onClose} aria-label="Close lead log">
          × brief
        </button>
      </div>
      {n === 0 ? (
        <p className="leadlog-empty">no lead history yet · the first crawl from 06:00 {IST_LABEL} picks</p>
      ) : (
        <div className="leadlog-table">
          <div className="leadlog-cols leadlog-colhead" aria-hidden>
            <span>DATE</span>
            <span>PICK</span>
            <span>LEAD HEADLINE</span>
            <span>PUBS</span>
            <span className="leadlog-sig">
              SIG
            </span>
          </div>
          <ol className="leadlog-rows" aria-label="Daily lead picks, newest first">
            {log.days.map((d) => {
              const isOpen = open === d.date;
              const held = d.state === "held";
              return (
                <Fragment key={d.date}>
                  <li
                    className={cn("leadlog-cols leadlog-row", isOpen && "leadlog-row-open")}
                    data-state={d.state}
                    data-nav-row
                    data-href={d.state === "picked" && d.url ? d.url : undefined}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggle(d.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.target === e.currentTarget) {
                        e.preventDefault();
                        toggle(d.date);
                      }
                    }}
                  >
                    <span className="leadlog-date tabular-nums">{d.date}</span>
                    <span className="leadlog-pick tabular-nums">{held ? "HELD" : d.state === "seed" ? "SEED" : istHHMM(d.at)}</span>
                    {held ? (
                      <span className="leadlog-headline">
                        {LEAD_HELD_TEXT}
                        {d.headline ? <span className="leadlog-carried"> · {d.headline}</span> : null}
                      </span>
                    ) : (
                      <span className="leadlog-headline">{d.headline}</span>
                    )}
                    {/* HELD: nothing was picked, so no pubs/sig (the carried lead's numbers would mislead). */}
                    <span className="leadlog-pubs tabular-nums">
                      {held ? "—" : d.sources}
                      {!held && d.pubs.length ? <span className="leadlog-pubnames"> {d.pubs.slice(0, 3).join(", ")}</span> : null}
                    </span>
                    <span className="leadlog-sig tabular-nums">{held ? "—" : (d.sig ?? "—")}</span>
                  </li>
                  {isOpen ? <Tape day={d} /> : null}
                </Fragment>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
