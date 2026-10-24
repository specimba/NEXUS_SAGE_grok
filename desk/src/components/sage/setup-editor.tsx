"use client";
/**
 * PASS-C3 (Option B) — the Setup editor on the patch bay (`?view=setup&edit=1`). Own lazy chunk (setup-view.tsx
 * imports it only in edit mode). Browser-only draft: localStorage["sage-setup-draft-v1"] = {base_hash, config}.
 * The page never talks to the GitHub API: no token, no key, no write call — the hand-off is copy JSON + a plain
 * link to GitHub's web editor, and Canberk's PR/merge is the only way a config change lands.
 * (String `+` over template literals on purpose: the transpiled chunk is smaller — C3.4 size budget.)
 */
import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type KeyboardEvent } from "react";
import type { SageSetupView, SetupSourceRow } from "@/lib/sage-setup";
import { fileJson, type SageLimits } from "@/lib/sage-config-rules";
import * as S from "@/lib/setup-draft";
import { BayCart, BayModule, BayTaste, RedactedNote } from "./setup-bay";

const STEPS = "1 copy JSON · 2 select all in GitHub's editor and paste · 3 Commit changes → Create a new branch… and start a pull request · 4 merge";
const store = (f: (ls: Storage) => void) => {
  try {
    f(window.localStorage);
  } catch {}
};

// Buttons sit outside any form element, so the default type is inert — no type="button" needed (C3.4 bytes).
const Btn = (p: ButtonHTMLAttributes<HTMLButtonElement>) => <button className="bay-btn focus-phosphor" {...p} />;

function AddField({ list, max, onAdd }: { list: string; max: number; onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      if (e.key === "Enter") onAdd(v);
      else e.currentTarget.blur();
      setV("");
    }
  };
  return (
    <input className="bay-add focus-phosphor" value={v} maxLength={max} onChange={(e) => setV(e.target.value)} onKeyDown={key} placeholder="+ term ⏎ · Esc cancels" aria-label={"add a term to " + list} spellCheck={false} />
  );
}

export function SetupEditor({ s }: { s: SageSetupView }) {
  const L = s.limits as SageLimits;
  const fileHash = s.file_hash || "";
  const base = useMemo(() => S.committedBase(s.config, L), [s.config, L]);
  // Client-only component (setup-view loads it after mount), so the draft is read straight from localStorage.
  const [init] = useState(() => {
    let text: string | null = null;
    store((ls) => (text = ls.getItem(S.DRAFT_KEY)));
    return S.loadStored(text, fileHash, base, L);
  });
  const [draft, setDraft] = useState<S.Draft>(init ? init.draft : base);
  const [baseHash, setBaseHash] = useState(init ? init.base_hash : fileHash);
  const [stale, setStale] = useState(!!init && init.stale);
  const [fallback, setFallback] = useState("");
  const [copied, setCopied] = useState("");

  const diff = S.humanDiff(base, draft, L);
  const v = S.validateDraft(draft, L);
  const errs = v.ok ? [] : v.errors;
  const out = v.ok ? fileJson(draft) : null; // = S.copyText (copy JSON only while valid)

  useEffect(() => {
    store((ls) => (diff.length ? ls.setItem(S.DRAFT_KEY, S.storeText(draft, baseHash)) : stale || ls.removeItem(S.DRAFT_KEY)));
  }, [draft, diff.length, baseHash, stale]);

  const edit = (f: (d: S.Draft) => S.Draft) => (setDraft(f), setCopied(""));
  const keep = () => {
    setStale(false);
    setBaseHash(fileHash);
  };
  const reset = () => {
    setDraft(base);
    keep();
    setFallback("");
    store((ls) => ls.removeItem(S.DRAFT_KEY));
  };
  const copy = (text: string, what: string) =>
    // clipboard missing (non-secure context) or blocked → the selected readonly textarea fallback
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
      () => (setFallback(""), setCopied(what)),
      () => (setFallback(text), setCopied("")),
    );
  const changed = (p: string) => diff.some((d) => d.startsWith(p));
  const errsFor = (p: string) => errs.filter((e) => e.startsWith(p));
  const max = Math.max(0, ...s.sources.map((r) => r.last_rows || 0));

  return (
    <div className="bay-editor">
      {stale ? (
        <div className="bay-stale" role="alert">
          the committed config changed since this draft
          <Btn onClick={reset}>reset to live</Btn>
          <Btn onClick={keep}>keep draft</Btn>
        </div>
      ) : null}
      {errs.length ? (
        <ul className="sage-setup-errors">
          {errs.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <ul className="bay-grid">
        {L.source_ids.map((id) => {
          // PASS-S1 blocks have no crawl row until they run: an empty module, same controls.
          const r = s.sources.find((x) => x.id === id) || ({ id } as SetupSourceRow);
          const box = S.isBoxOnly(id, L);
          const on = S.srcVal(draft, id, "on", L) !== false;
          const fields = box ? [] : Object.keys(L.ceilings[id] || {});
          const wired = box ? null : L.feeds[id];
          const feeds = (S.srcVal(draft, id, "feeds", L) as string[]) || [];
          return (
            <BayModule
              key={id}
              row={box ? { ...r, state: "box-only" } : r}
              max={max}
              on={on}
              now={s.stamped_at}
              changed={changed(id + ".")}
              errs={errsFor("sources." + id)}
              sw={
                <button
                  className="bay-sw focus-phosphor"
                  data-off={on ? undefined : ""}
                  aria-pressed={on}
                  aria-label={id + " on"}
                  disabled={box}
                  title={box ? "box-only · edit by commit" : undefined}
                  onClick={() => edit((d) => S.toggleOn(d, id, L))}
                >
                  {on ? "on" : "off"}
                </button>
              }
              caps={
                box ? r.caps : fields.length ? (
                  <span className="bay-steps">
                    {fields.map((f) => {
                      const val = Number(S.srcVal(draft, id, f, L));
                      const [lo, hi] = S.capBounds(id, f, L);
                      const step = (n: number) => () => edit((d) => S.stepCap(d, id, f, n, L));
                      return (
                        <span key={f} className="bay-step" data-changed={changed(id + "." + f + " ") ? "" : undefined}>
                          <i>{f}</i>
                          <button className="focus-phosphor" disabled={val <= lo} aria-label={id + " " + f + " down"} onClick={step(-1)}>
                            −
                          </button>
                          <output>{val}</output>
                          <button className="focus-phosphor" disabled={val >= hi} aria-label={id + " " + f + " up"} onClick={step(1)}>
                            +
                          </button>
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  "no cap"
                )
              }
              extra={
                wired ? (
                  <div className="bay-chips bay-feeds">
                    {wired.map((f) => (
                      <button key={f} className="focus-phosphor" aria-pressed={feeds.includes(f)} onClick={() => edit((d) => S.toggleFeed(d, id, f, base, L))}>
                        {f}
                      </button>
                    ))}
                  </div>
                ) : null
              }
            />
          );
        })}
      </ul>
      <p className="bay-sec">keyword cartridges</p>
      <div className="bay-carts">
        {L.keyword_lists.filter((k) => !(k in (s.redacted ?? {}))).map((k) => {
          const terms = S.listVal(draft, k, L);
          const was = S.listVal(base, k, L);
          const kErrs = errsFor("keywords." + k);
          return (
            <BayCart key={k} id={k} count={terms.length} changed={changed(k + " ")} errs={kErrs}>
              <div className="bay-chips">
                {terms.map((t) => (
                  <span key={t} data-new={was.includes(t) ? undefined : ""} data-bad={kErrs.some((e) => e.includes(JSON.stringify(t))) ? "" : undefined}>
                    {t}
                    {S.removable(k, t, L) ? (
                      <button className="bay-x focus-phosphor" aria-label={"remove " + t} onClick={() => edit((d) => S.removeTerm(d, k, t, L))}>
                        ×
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
              <AddField list={k} max={L.keyword_len_max} onAdd={(t) => edit((d) => S.addTerm(d, k, t, L))} />
            </BayCart>
          );
        })}
      </div>
      {Object.entries(s.redacted ?? {}).map(([k, n]) => (
        <div className="bay-carts" key={k}>
          <BayCart id={k} count={n}>
            <RedactedNote id={k} n={n} />
          </BayCart>
        </div>
      ))}
      <p className="bay-sec">x taste dial</p>
      <BayTaste
        weight={S.tasteVal(draft, L)}
        max={L.taste_max}
        changed={changed("taste.")}
        track={
          <input
            type="range"
            className="bay-taste-range focus-phosphor"
            min={0}
            max={L.taste_max}
            step={0.05}
            value={S.tasteVal(draft, L)}
            aria-label="x taste weight · pulse shelf only · never lead"
            onChange={(e) => edit((d) => S.setTaste(d, Number(e.target.value), L))}
          />
        }
      />
      <div className="bay-draft tabular-nums">
        <span className={errs.length ? "bay-draft-bad" : undefined} aria-live="polite">
          {errs.length ? errs.length + (errs.length === 1 ? " error" : " errors") : diff.length + (diff.length === 1 ? " change" : " changes") + " · valid" + (copied && " · copied " + copied)}
        </span>
        <Btn onClick={reset} disabled={!diff.length && !stale}>
          reset
        </Btn>
        {s.redacted?.gmail_senders ? <span className="bay-redacted">gmail_senders ({s.redacted.gmail_senders}) is not in this copy — keep the committed list when pasting</span> : null}
        <Btn disabled={!out} onClick={() => out && copy(out, "JSON")}>
          copy JSON
        </Btn>
        <Btn disabled={!out || !diff.length} onClick={() => copy(diff.join("\n"), "summary")}>
          copy summary
        </Btn>
        {/* No href while invalid ⇒ not focusable, not clickable (disabled). */}
        <a className="bay-btn focus-phosphor" href={out ? S.GITHUB_EDIT_URL : undefined} aria-disabled={!out} target="_blank" rel="noopener noreferrer">
          open on GitHub
        </a>
      </div>
      {diff.length ? (
        <ul className="bay-diff tabular-nums">
          {diff.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
      {fallback ? <textarea className="bay-fallback" readOnly value={fallback} rows={6} autoFocus onFocus={(e) => e.currentTarget.select()} aria-label="copy this text" /> : null}
      <p className="bay-foot">{STEPS}</p>
    </div>
  );
}
