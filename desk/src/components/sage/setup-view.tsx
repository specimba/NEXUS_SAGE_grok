"use client";
/**
 * PASS-C2 → UX-NEXT-3 idea 3 — Setup as a patch bay (`?view=setup`), read-only. Lazy chunk: desk.tsx dynamic-imports
 * this file only when the URL asks for it, so neither the component nor SAGE_SETUP is in First Load.
 * PASS-C3: the `edit` chip (pushState `&edit=1`, re-read on popstate) lazy-loads setup-editor.tsx — the only place
 * with controls. This file stays control-free: edit desk/config/sage-sources.json by commit.
 */
import { useEffect, useState, type ComponentType } from "react";
import { SAGE_SETUP } from "@/data/sage-setup";
import { IST_LABEL, istDateTime } from "@/lib/ist-time";
import { setupRoute } from "@/lib/setup-route";
import type { SageSetupView } from "@/lib/sage-setup";
import { bayCounts, ReadOnlyBay } from "./setup-bay";

type EditorProps = { s: SageSetupView };
const loadEditor = () => import("./setup-editor");

export function SetupView() {
  const s = SAGE_SETUP;
  const [edit, setEdit] = useState(false);
  const [Editor, setEditor] = useState<null | ComponentType<EditorProps>>(null);
  useEffect(() => {
    const read = () => setEdit(setupRoute(window.location.search).edit);
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  useEffect(() => {
    if (edit && !Editor && s.limits) loadEditor().then((m) => setEditor(() => m.SetupEditor));
  }, [edit, Editor, s.limits]);
  const toggle = () => {
    const p = new URLSearchParams(window.location.search);
    if (edit) p.delete("edit");
    else p.set("edit", "1");
    window.history.pushState(window.history.state, "", window.location.pathname + "?" + p + window.location.hash);
    setEdit(!edit);
  };
  const c = bayCounts(s.sources);
  const editing = edit && !!Editor;
  return (
    <section className="leadlog sage-setup sage-panel" aria-label="Setup · active crawl config" data-config-hash={s.config_hash} data-edit={editing ? "1" : "0"}>
      <header className="leadlog-head">
        <span className="leadlog-kicker">SETUP · patch bay{editing ? " · draft" : ""}</span>
        <span className="leadlog-meta tabular-nums">
          hash {s.config_hash} · {s.status === "ok" ? "ok" : <span className="sage-deny">config invalid · {s.used}</span>}
        </span>
        {/* Close = Brief without ?view (plain link: keeps the close logic out of First Load). */}
        <a className="leadlog-close focus-phosphor" href="./#brief" aria-label="Close setup view">
          close
        </a>
      </header>
      <div className="bay-sum tabular-nums">
        <span>
          <b>{c.sources}</b> sources
        </span>
        <span>
          <b>{c.live}</b> live
        </span>
        <span className="bay-sum-dim">{c.boxOnly} box-only</span>
        <span className={c.softFail ? "bay-sum-warn" : "bay-sum-dim"}>{c.softFail} soft-fail</span>
        <span>
          <b>{c.rows}</b> rows last crawl
        </span>
        <span className="bay-sum-dim">
          {s.since_commit ? `since ${s.since_commit}` : "since: next crawl records it"}
          {s.since_at ? ` · ${istDateTime(s.since_at).slice(5)} ${IST_LABEL}` : ""}
        </span>
        {s.limits ? (
          <button type="button" className="bay-edit focus-phosphor" onClick={toggle} aria-pressed={edit} title="draft a config change (copy JSON → GitHub PR)">
            {edit ? "done" : "edit"}
          </button>
        ) : null}
      </div>
      {!editing && s.errors.length ? (
        <ul className="sage-setup-errors" aria-label="config invalid">
          {s.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {editing && Editor ? <Editor s={s} /> : <ReadOnlyBay s={s} />}
      {editing ? null : (
        <p className="bay-foot tabular-nums">
          edit desk/config/sage-sources.json by commit{s.stamped_at ? ` · crawl ${istDateTime(s.stamped_at)} ${IST_LABEL}` : ""}
        </p>
      )}
    </section>
  );
}
