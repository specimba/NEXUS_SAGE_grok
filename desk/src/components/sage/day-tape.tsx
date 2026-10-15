import { dayTapeView, type DayTapeSlot } from "@/lib/day-tape";
import { istHHMM } from "@/lib/ist-time";

/**
 * UX-NEXT-3 §2 — morning edition day tape, above the Brief grid. Display-only. `next` = the next pick slot
 * (06:11 after a pick; the HELD plate's next try on a HELD day before 21:00). `since` = Beat 10 baseline (null ⇒ no marker).
 */
export function DayTape({ tape, crawlAt, since, next, held }: { tape: readonly DayTapeSlot[]; crawlAt: string; since: string | null; next: string; held: boolean }) {
  if (!tape.length) return null;
  const v = dayTapeView(tape, crawlAt, since);
  const tag = (k: string) => (k === "pick" || k === "held" || k === "now" ? k : "·");
  return (
    <section className="day-tape" aria-label="Day tape: today's crawls and the lead pick" data-day-tape={v.slots.length}>
      <div className="day-tape-head">
        <span className="day-tape-kicker">edition</span>
        <span className="day-tape-date">{v.date}</span>
        <span className="day-tape-sum tabular-nums">
          overnight <b>+{v.overnight}</b> ·{" "}
          {v.pick ? (v.pick.held ? <>lead <b>held</b></> : <>lead picked <b>{istHHMM(v.pick.hhmmAt)}</b></>) : held ? <>lead <b>held</b></> : "no pick yet"} · today{" "}
          <b>+{v.today}</b> new clusters
        </span>
      </div>
      <ol className="day-tape-track" style={{ ["--n" as string]: v.slots.length + 1 }}>
        {v.slots.map((s, i) => (
          <li key={s.at} className="day-slot" data-kind={s.kind} data-now={s.now ? "1" : undefined} data-at={s.at}>
            <span className="day-slot-tag">{tag(s.kind)}</span>
            <span className="day-slot-bar">
              <i style={{ ["--h" as string]: `${s.h}%` }} />
            </span>
            <span className="day-slot-t tabular-nums">{istHHMM(s.at)}</span>
            <span className="day-slot-n tabular-nums">+{s.new}</span>
            {v.you === i ? <span className="day-slot-you">▲ you</span> : null}
          </li>
        ))}
        <li className="day-slot" data-kind="next">
          <span className="day-slot-tag">
            next<span className="day-slot-wide"> pick</span>
          </span>
          <span className="day-slot-bar">
            <i />
          </span>
          <span className="day-slot-t tabular-nums">{next}</span>
          <span className="day-slot-n tabular-nums">—</span>
        </li>
      </ol>
    </section>
  );
}
