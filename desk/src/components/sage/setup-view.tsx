"use client";
/**
 * PASS-C2 — read-only Setup view (`?view=setup`). Lazy chunk: desk.tsx dynamic-imports this file only when the
 * URL asks for it, so neither the component nor the SAGE_SETUP payload is in First Load. No edit controls.
 */
import { SAGE_SETUP } from "@/data/sage-setup";
import { IST_LABEL, istDateTime } from "@/lib/ist-time";

export function SetupView() {
  const s = SAGE_SETUP;
  return (
    <section className="leadlog sage-setup sage-panel" aria-label="Setup · active crawl config" data-config-hash={s.config_hash}>
      <header className="leadlog-head">
        <span className="leadlog-kicker">SETUP · config</span>
        <span className="leadlog-meta tabular-nums">
          hash {s.config_hash} · {s.status === "ok" ? "ok" : <span className="sage-deny">config invalid · {s.used}</span>}
        </span>
        {/* Close = the desk without ?view (plain link: keeps the close logic out of First Load). */}
        <a className="leadlog-close focus-phosphor" href="./" aria-label="Close setup view">
          close
        </a>
      </header>
      <p className="sage-setup-line tabular-nums">
        {s.since_commit ? `since ${s.since_commit}` : "since: next crawl records it"}
        {s.since_at ? ` · ${istDateTime(s.since_at)} ${IST_LABEL}` : ""}
        {s.stamped_at ? ` · crawl ${istDateTime(s.stamped_at)} ${IST_LABEL}` : ""}
      </p>
      {s.errors.length ? (
        <ul className="sage-setup-errors">
          {s.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <ul className="sage-setup-sources" aria-label="Sources">
        <li className="sage-setup-src sage-setup-colhead" aria-hidden>
          <span>source</span>
          <span>on</span>
          <span>last</span>
          <span>state</span>
          <span className="sage-setup-caps">caps</span>
        </li>
        {s.sources.map((r) => (
          <li key={r.id} className="sage-setup-src tabular-nums" data-source={r.id} data-state={r.state}>
            <span>{r.id}</span>
            <span>{r.on ? "on" : "off"}</span>
            <span>{r.last_rows ?? "—"}</span>
            <span className={r.state === "soft-fail" || r.state === "off" ? "sage-deny" : undefined}>{r.state}</span>
            <span className="sage-setup-caps">{r.caps}</span>
          </li>
        ))}
      </ul>
      <div className="sage-setup-kw">
        {s.keywords.map((k) => (
          <details key={k.id}>
            <summary className="tabular-nums">
              {k.id} · {k.terms.length}
            </summary>
            <p className="sage-setup-terms">{k.terms.join(" · ")}</p>
          </details>
        ))}
      </div>
      <p className="sage-setup-line tabular-nums">
        taste weight {s.taste.weight} (max {s.taste.max}) · Pulse taste shelf order only
      </p>
      <p className="sage-setup-line sage-setup-muted">edit desk/config/sage-sources.json by commit</p>
    </section>
  );
}
