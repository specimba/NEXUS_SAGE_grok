import { useEffect, useMemo, useState } from "react";
import { CYCLE } from "@/data/cycle";
import { CRAWL, CRAWL_AT } from "@/data/x-crawl";
import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE } from "@/data/digest-pack";
import { PAPERS } from "@/data/papers";
import { nextDue, PACK_KEY, renderPlan, renderReport } from "@/lib/digest-pack";
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

export function Desk() {
  const [lane, setLane] = useState<Lane>("brief");
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

  return (
    <div className="relative min-h-screen">
      <div className="scanline absolute inset-0 opacity-40" />
      <header className="relative border-b border-line px-4 py-3 md:px-6">
        <p className="font-mono text-kicker uppercase tracking-kicker text-muted">SAGE://DESK</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-xl tracking-wide">CYC/{CYCLE.id}</h1>
          <p className="text-sm text-muted">{CYCLE.window}</p>
          <p className="font-mono text-kicker uppercase tracking-kicker text-accent">{CYCLE.compiledAt} · STABLE</p>
        </div>
        <p className="mt-2 font-mono text-kicker uppercase tracking-kicker text-subtle">
          INGEST · X watch live · snap {CRAWL_AT} · pack {PACK_AT}
        </p>
        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Lanes">
          {LANES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={cn(
                "h-11 min-w-11 px-3 font-mono text-kicker uppercase tracking-kicker",
                lane === id ? "bg-accent text-accent-fg" : "term text-muted",
              )}
            >
              {id}
            </button>
          ))}
        </nav>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-6 md:px-6">
        {lane === "brief" ? <Brief /> : null}
        {lane === "pulse" ? <Pulse /> : null}
        {lane === "digest" ? <Digest /> : null}
        {lane === "papers" ? <Papers /> : null}
        {lane === "voice" ? <Voice /> : null}
        {lane === "governance" ? <Gov /> : null}
      </main>
    </div>
  );
}

function Brief() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="lg:col-span-7">
        <p className="font-mono text-kicker uppercase tracking-kicker text-accent">Take</p>
        <h2 className="mt-2 font-display text-2xl font-medium normal-case tracking-normal">{CYCLE.exec[0]}</h2>
        <ul className="mt-4 max-w-prose space-y-2 text-sm text-muted">
          {CYCLE.exec.slice(1).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <ol className="space-y-3 lg:col-span-5">
        {CYCLE.pins.map((p) => (
          <li key={p.id} className="term p-4">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              {p.kind} · {p.id}
            </p>
            <h3 className="mt-1 text-base font-medium">{p.title}</h3>
            <p className="mt-2 text-sm">{p.take}</p>
            <p className="mt-2 text-sm text-muted">{p.why}</p>
            <p className="mt-2 text-sm text-ok">{p.move}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pulse() {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {CRAWL.map((p) => (
        <li key={p.id} className="term overflow-hidden">
          {p.media ? (
            <img src={p.media} alt="" className="h-40 w-full object-cover opacity-80" crossOrigin="anonymous" />
          ) : null}
          <div className="p-4">
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
              @{p.handle} · {p.tag} · {p.likes}♥
            </p>
            <p className="mt-2 text-sm">{p.take}</p>
            <p className="mt-2 text-sm text-muted">{p.text}</p>
            <a href={p.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center text-sm text-ok">
              Open source
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Digest() {
  const [view, setView] = useState<"plan" | "library" | "report">("plan");
  const [openId, setOpenId] = useState(DIGEST_ITEMS[0].id);
  const [last, setLast] = useState<string | null>(PACK_AT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PACK_KEY);
      if (raw) setLast(raw);
    } catch {
      /* ignore */
    }
  }, []);
  const cadence = useMemo(() => nextDue(last ?? PACK_AT), [last]);
  const item = DIGEST_ITEMS.find((i) => i.id === openId) ?? DIGEST_ITEMS[0];
  const report = useMemo(() => renderReport(DIGEST_ITEMS, last ?? PACK_AT), [last]);
  const plan = useMemo(() => renderPlan(), []);

  const run = () => {
    const at = new Date().toISOString();
    setLast(at);
    try {
      localStorage.setItem(PACK_KEY, at);
    } catch {
      /* ignore */
    }
    setView("report");
  };

  return (
    <div>
      <p className="font-mono text-kicker uppercase tracking-kicker text-muted">Digest · {PACK_SOURCE}</p>
      <h2 className="mt-2 text-2xl font-medium">Library and pack</h2>
      <p className="mt-2 max-w-prose text-sm text-muted">
        02 Sep list was scored, not dumped. Lead stays HF. New rest: AISLE curl CVEs + harness papers.
      </p>
      <div className="term mt-5 flex flex-wrap items-center gap-3 p-4">
        <p className="font-mono text-kicker uppercase tracking-kicker text-accent">
          {cadence.due ? "DUE" : "HOLD"} · next {cadence.nextAt.slice(11, 16)}Z
        </p>
        <button type="button" className="h-11 bg-accent px-3 text-sm text-accent-fg" onClick={run}>
          Run digest
        </button>
        <button type="button" className="term h-11 px-3 text-sm" onClick={() => download("sage-digest-003.md", report, "text/markdown")}>
          Download report
        </button>
        <button
          type="button"
          className="term h-11 px-3 text-sm"
          onClick={() => download("sage-digest-003.json", JSON.stringify({ at: last, items: DIGEST_ITEMS, plan, dropped: DROPPED }, null, 2), "application/json")}
        >
          Download pack
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["plan", "library", "report"] as const).map((id) => (
          <button key={id} type="button" onClick={() => setView(id)} className={cn("h-11 px-3 font-mono text-kicker uppercase tracking-kicker", view === id ? "bg-accent text-accent-fg" : "term text-muted")}>
            {id}
          </button>
        ))}
      </div>
      {view === "plan" ? (
        <ol className="mt-6 space-y-4">
          {plan.map((p, i) => (
            <li key={p.id} className="term p-4">
              <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                {i + 1} · {p.kind} · {p.file} · {p.confidence}
              </p>
              <h3 className="mt-2 text-base font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-ok">{p.move}</p>
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
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <ul className="space-y-2 lg:col-span-4">
            {DIGEST_ITEMS.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setOpenId(i.id)} className={cn("term w-full p-3 text-left", i.id === item.id && "term-amber")}>
                  <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">
                    {i.kind} · {i.confidence}
                  </p>
                  <p className="mt-1 text-sm">{i.title}</p>
                </button>
              </li>
            ))}
          </ul>
          <article className="lg:col-span-8">
            <p className="text-sm">{item.take}</p>
            <p className="mt-3 text-sm text-muted">{item.why}</p>
            <p className="mt-3 text-sm text-ok">{item.move}</p>
          </article>
        </div>
      ) : null}
      {view === "report" ? <pre className="term mt-6 max-h-[28rem] overflow-auto p-4 text-sm whitespace-pre-wrap">{report}</pre> : null}
    </div>
  );
}

function Papers() {
  return (
    <ul className="space-y-3">
      {PAPERS.map((p) => (
        <li key={p.id} className="term flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-mono text-kicker uppercase tracking-kicker text-subtle">{p.id} · {p.up} up</p>
            <p className="mt-1 text-sm">{p.title}</p>
          </div>
          <a href={p.href} target="_blank" rel="noreferrer" className="h-11 text-sm text-ok">
            arXiv
          </a>
        </li>
      ))}
    </ul>
  );
}

function Voice() {
  const speak = () => {
    const text = `${CYCLE.exec[0]} ${CYCLE.exec[1]}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.96;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };
  return (
    <div className="term max-w-xl p-5">
      <p className="font-mono text-kicker uppercase tracking-kicker text-muted">Voice · browser neural fallback</p>
      <p className="mt-3 max-w-prose text-sm">Reads the brief take. Podcast mix is not remounted until the cycle lock has a new primary.</p>
      <button type="button" className="mt-4 h-11 bg-accent px-4 text-sm text-accent-fg" onClick={speak}>
        Play brief
      </button>
    </div>
  );
}

function Gov() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="term p-4">
        <p className="font-mono text-kicker uppercase tracking-kicker text-ok">Allow</p>
        <ul className="mt-2 space-y-1 text-sm">{CYCLE.trust.allow.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="term p-4">
        <p className="font-mono text-kicker uppercase tracking-kicker text-amber">Deny</p>
        <ul className="mt-2 space-y-1 text-sm">{CYCLE.trust.deny.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
      <section className="term p-4">
        <p className="font-mono text-kicker uppercase tracking-kicker text-muted">Open</p>
        <ul className="mt-2 space-y-1 text-sm">{CYCLE.trust.open.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
    </div>
  );
}
