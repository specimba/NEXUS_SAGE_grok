"use client";
/**
 * UX-NEXT-3 idea 3 — the Setup patch bay parts, shared by the read-only bay (setup-view.tsx) and the PASS-C3 editor
 * (setup-editor.tsx, its own lazy chunk). Presentational only: no storage, no network, no ingest imports.
 */
import { useState, type ReactNode } from "react";
import type { SageSetupView, SetupSourceRow } from "@/lib/sage-setup";

/** 12-segment log meter: round(12·log1p(n)/log1p(max)). */
export function meterSegs(n: number | null, max: number): number {
  if (!n || n <= 0 || max <= 0) return 0;
  return Math.min(12, Math.round((12 * Math.log1p(n)) / Math.log1p(max)));
}

export const CART_LABEL: Record<string, string> = { politics_deny: "politics deny" };
export const cartLabel = (id: string) => CART_LABEL[id] || id.replace(/_/g, " ");
/** Read-only chips shown before `+N more` (deny lists always show every blocked term). */
export const CHIPS_SHOWN = 9;

export function bayCounts(rows: readonly SetupSourceRow[]) {
  return {
    sources: rows.length,
    live: rows.filter((r) => r.on && r.state !== "box-only").length,
    boxOnly: rows.filter((r) => r.state === "box-only").length,
    softFail: rows.filter((r) => r.state === "soft-fail").length,
    rows: rows.reduce((a, r) => a + (r.last_rows || 0), 0),
  };
}

export function BayModule(p: {
  row: SetupSourceRow;
  max: number;
  on: boolean;
  sw: ReactNode;
  caps: ReactNode;
  extra?: ReactNode;
  changed?: boolean;
  errs?: string[];
}) {
  const { row } = p;
  const box = row.state === "box-only";
  const state = !p.on ? "off" : box ? "box-only" : row.state === "soft-fail" ? "soft-fail" : "ok";
  const segs = box ? 0 : meterSegs(row.last_rows, p.max);
  return (
    <li className="bay-mod" data-state={state} data-source={row.id} data-changed={p.changed ? "" : undefined} data-bad={p.errs?.length ? "" : undefined}>
      <div className="bay-mod-head">
        <span className="bay-led" aria-hidden />
        <span className="bay-id">{row.id}</span>
        {p.changed ? <span className="bay-delta" title="changed in draft">Δ</span> : null}
        {p.sw}
      </div>
      {box ? (
        <div className="bay-rows">
          <b>box-only</b>
          <span>· never on page</span>
        </div>
      ) : (
        <div className="bay-rows">
          <b>{row.last_rows == null ? "—" : row.last_rows}</b>
          <span>
            {row.last_rows == null ? row.state : "rows"}
            <em className="bay-wide"> · last crawl</em>
          </span>
        </div>
      )}
      <div className="bay-meter" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} data-on={i < segs ? "" : undefined} />
        ))}
      </div>
      <div className="bay-caps">{p.caps}</div>
      {p.extra}
      {p.errs?.length ? (
        <ul className="bay-err">
          {p.errs.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Box-only list on the page: a count, never the addresses. */
export const RedactedNote = ({ id, n }: { id: string; n: number }) => (
  <p className="bay-redacted" data-redacted={id}>
    {n} {id === "gmail_senders" ? (n === 1 ? "sender" : "senders") : "terms"} · box-only · edit by commit
  </p>
);

/** Read-only `on` glyph. */
export const BaySw = ({ on }: { on: boolean }) => <span className="bay-sw" data-off={on ? undefined : ""}>{on ? "on" : "off"}</span>;

export function BayCart(p: { id: string; count: number; children: ReactNode; changed?: boolean; errs?: string[] }) {
  const deny = p.id === "politics_deny";
  return (
    <div className="bay-cart" data-cart={p.id} data-deny={deny ? "" : undefined} data-changed={p.changed ? "" : undefined} data-bad={p.errs?.length ? "" : undefined}>
      <div className="bay-cart-head">
        {cartLabel(p.id)}
        {p.changed ? <span className="bay-delta">Δ</span> : null}
        <span>
          {p.count} {deny ? "blocked" : p.id === "gmail_senders" ? "senders" : "terms"}
        </span>
      </div>
      {p.children}
      {p.errs?.length ? (
        <ul className="bay-err">
          {p.errs.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ReadChips({ id, terms }: { id: string; terms: string[] }) {
  const [all, setAll] = useState(false);
  const cut = id === "politics_deny" || all ? terms.length : CHIPS_SHOWN;
  const more = terms.length - cut;
  return (
    <div className="bay-chips">
      {terms.slice(0, cut).map((t) => (
        <span key={t}>{t}</span>
      ))}
      {more > 0 ? (
        <button type="button" className="bay-more focus-phosphor" onClick={() => setAll(true)} aria-label={"show " + more + " more " + cartLabel(id) + " terms"}>
          +{more} more
        </button>
      ) : null}
    </div>
  );
}

export function BayTaste(p: { weight: number; max: number; track?: ReactNode; changed?: boolean }) {
  return (
    <div className="bay-taste tabular-nums" data-changed={p.changed ? "" : undefined}>
      <span>
        weight {p.weight}
        {p.changed ? <span className="bay-delta"> Δ</span> : null}
      </span>
      {p.track || (
        <span className="bay-taste-track" aria-hidden>
          <span className="bay-taste-knob" style={{ left: "calc(" + (p.weight / (p.max || 1)) * 100 + "% - " + (p.weight / (p.max || 1)) * 8 + "px)" }} />
        </span>
      )}
      <span>
        max {p.max} <em>· pulse shelf only · never lead</em>
      </span>
    </div>
  );
}

/** The read-only patch bay (UX-NEXT-3 idea 3) straight from SAGE_SETUP. */
export function ReadOnlyBay({ s }: { s: SageSetupView }) {
  const max = Math.max(0, ...s.sources.map((r) => r.last_rows || 0));
  return (
    <>
      <ul className="bay-grid" aria-label="Sources">
        {s.sources.map((r) => (
          <BayModule key={r.id} row={r} max={max} on={r.on} sw={<BaySw on={r.on} />} caps={r.caps === "—" ? "no cap" : r.caps} />
        ))}
      </ul>
      <p className="bay-sec">keyword cartridges</p>
      <div className="bay-carts">
        {s.keywords.map((k) => (
          <BayCart key={k.id} id={k.id} count={k.count ?? k.terms.length}>
            {k.count != null ? <RedactedNote id={k.id} n={k.count} /> : <ReadChips id={k.id} terms={k.terms} />}
          </BayCart>
        ))}
      </div>
      <p className="bay-sec">x taste dial</p>
      <BayTaste weight={s.taste.weight} max={s.taste.max} />
    </>
  );
}
