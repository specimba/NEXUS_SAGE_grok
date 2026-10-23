#!/usr/bin/env bun
/**
 * PASS-D Beat 13 — morning Atom feed (refs/PASS-D-ATOM-FEED.md). Crawl job: after desk-view (rank-snapshot) and
 * before reader-hash.ts.
 *   bun scripts/atom-feed.ts [--desk <dir>]
 * Reads  artifacts/sage/lead-history.json, src/data/x-crawl.ts (CRAWL_AT), src/data/wire.ts (WIRE_ROWS, WIRE_CRAWL_AT),
 *        src/data/papers.ts (PAPERS), artifacts/sage/morning-editions.json (snapshot store).
 * Writes artifacts/sage/morning-editions.json and public/feed.xml — each only when its bytes change.
 * $ATOM_FEED_STATUS (optional, CI): the result line is also written there, for the crawl.log `feed=` suffix
 *   (removed at start, so a crash leaves no stale status ⇒ scripts/publish-proof.ts reads it as skipped).
 * D4: any missing / unparseable input or generator error ⇒ `atom-feed: skipped (<reason>)`, existing files untouched, exit 0.
 * PASS-F2.2c/F2.3c: the TL;DR entry (src/data/tldr-24h.ts → artifacts/sage/tldr-feed.json) is entry 1; public/feed.atom is
 *   written with the same bytes as feed.xml in the same step (Atom MIME on Pages).
 * PASS-W: then, independently (its own try; a watch crash never touches feed.xml and vice versa), the watch feed:
 *   reads config/sage-sources.json keywords.watch_terms (via loadSageConfig, read-only), wire.ts, papers.ts,
 *   releases-atom.ts and artifacts/sage/watch-seen.json; writes watch-seen.json + public/watch.xml (bytes-changed only).
 *   watch_terms [] ⇒ `watch=off`, nothing written (an existing watch.xml is left as-is). Result `watch=<new>/<dropped>`
 *   (or `watch=off` / `watch=skipped (<reason>)`) is printed and written as the status file's second line.
 */
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadSageConfig } from "@/lib/sage-config-disk";
import { emptyStore, renderAtomFeed, snapshotEditions, tldrStep, type EditionStore, type TldrFeedEntry } from "./lib/atom-feed";
import { emptyWatchStore, renderWatchFeed, watchStep, type WatchStore } from "./lib/watch-feed";

const argDesk = process.argv.includes("--desk") ? process.argv[process.argv.indexOf("--desk") + 1] : null;
const desk = resolve(argDesk || resolve(import.meta.dir, ".."));
const p = {
  history: resolve(desk, "artifacts/sage/lead-history.json"),
  store: resolve(desk, "artifacts/sage/morning-editions.json"),
  crawl: resolve(desk, "src/data/x-crawl.ts"),
  wire: resolve(desk, "src/data/wire.ts"),
  papers: resolve(desk, "src/data/papers.ts"),
  feed: resolve(desk, "public/feed.xml"),
  /** PASS-F2.3c: byte-identical copy — GitHub Pages serves .atom as application/atom+xml (.xml is not). */
  feedAtom: resolve(desk, "public/feed.atom"),
  releases: resolve(desk, "src/data/releases-atom.ts"),
  watchSeen: resolve(desk, "artifacts/sage/watch-seen.json"),
  watch: resolve(desk, "public/watch.xml"),
  tldr: resolve(desk, "src/data/tldr-24h.ts"),
  tldrStore: resolve(desk, "artifacts/sage/tldr-feed.json"),
};

class Skip extends Error {}
const need = (f: string, label: string) => {
  if (!existsSync(f)) throw new Skip(`${label} missing`);
  return readFileSync(f, "utf8");
};
const writeIfChanged = (f: string, body: string) => {
  if (existsSync(f) && readFileSync(f, "utf8") === body) return false;
  writeFileSync(`${f}.tmp`, body);
  renameSync(`${f}.tmp`, f);
  return true;
};

async function main(): Promise<string> {
  let history: unknown;
  try {
    history = JSON.parse(need(p.history, "lead-history.json"));
  } catch (e) {
    if (e instanceof Skip) throw e;
    throw new Skip("lead-history.json unparseable");
  }
  const crawlAt = need(p.crawl, "x-crawl.ts").match(/export const CRAWL_AT\s*=\s*"([^"]+)"/)?.[1];
  if (!crawlAt) throw new Skip("CRAWL_AT not found in x-crawl.ts");
  need(p.wire, "wire.ts");
  need(p.papers, "papers.ts");
  const wireMod = (await import(p.wire)) as { WIRE_ROWS?: unknown; WIRE_CRAWL_AT?: string };
  const papersMod = (await import(p.papers)) as { PAPERS?: unknown };
  if (!Array.isArray(wireMod.WIRE_ROWS)) throw new Skip("WIRE_ROWS not an array");
  if (!Array.isArray(papersMod.PAPERS)) throw new Skip("PAPERS not an array");

  let store: EditionStore = emptyStore();
  if (existsSync(p.store)) {
    try {
      const s = JSON.parse(readFileSync(p.store, "utf8"));
      if (s?.schema !== 1 || !Array.isArray(s.editions)) throw new Error();
      store = s;
    } catch {
      throw new Skip("morning-editions.json unparseable");
    }
  }

  // The Wire snapshot must be this crawl's (pages-coherence rule); otherwise nothing is snapshotted this run.
  const wireThisCrawl = wireMod.WIRE_CRAWL_AT === crawlAt;
  const { store: next, changed } = wireThisCrawl
    ? snapshotEditions(store, history, { crawlAt, wire: wireMod.WIRE_ROWS as never, papers: papersMod.PAPERS as never })
    : { store, changed: [] as string[] };
  // PASS-F2.2c: the TL;DR entry (first; same id per day, rewritten in place). A missing / bad TL;DR never blocks the feed.
  const notes: string[] = [];
  let tldrPrev: TldrFeedEntry | null = null;
  try {
    if (existsSync(p.tldrStore)) {
      const j = JSON.parse(readFileSync(p.tldrStore, "utf8"));
      if (j?.schema === 1 && typeof j.date === "string" && Array.isArray(j.bullets)) tldrPrev = j;
    }
  } catch {
    notes.push("tldr-feed.json unparseable, rebuilt");
  }
  let tldr = tldrPrev;
  if (existsSync(p.tldr)) {
    try {
      const mod = (await import(p.tldr)) as { TLDR_24H?: Parameters<typeof tldrStep>[1] };
      if (mod.TLDR_24H) {
        const st = tldrStep(tldrPrev, mod.TLDR_24H, crawlAt);
        tldr = st.entry;
        if (st.changed && tldr) {
          writeIfChanged(p.tldrStore, JSON.stringify(tldr, null, 2) + "\n");
          notes.push(`tldr ${tldr.date} ${tldr.bullets.length} bullets`);
        }
      }
    } catch (e) {
      notes.push(`tldr skipped (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  const xml = renderAtomFeed(next, tldr);
  if (!wireThisCrawl) notes.push(`wire crawl ${wireMod.WIRE_CRAWL_AT ?? "?"} ≠ CRAWL_AT ${crawlAt}, no snapshot`);
  if (changed.length) {
    writeIfChanged(p.store, JSON.stringify(next, null, 2) + "\n");
    notes.push(`snapshot ${changed.join(", ")}`);
  }
  if (xml == null) return `atom-feed: skipped (no editions yet)${notes.length ? ` · ${notes.join(" · ")}` : ""}`;
  const wrote = writeIfChanged(p.feed, xml);
  writeIfChanged(p.feedAtom, xml); // PASS-F2.3c: same bytes, same step
  const n = (xml.match(/<entry>/g) ?? []).length;
  return `atom-feed: ${wrote ? "wrote" : "unchanged"} public/feed.xml · ${n} entr${n === 1 ? "y" : "ies"} · ${Buffer.byteLength(xml)} B${notes.length ? ` · ${notes.join(" · ")}` : ""}`;
}

/** PASS-W watch feed. Returns the `watch=` token. */
async function watch(): Promise<string> {
  const terms = loadSageConfig(desk).config.keywords.watch_terms ?? [];
  if (!terms.length) return "watch=off";
  const crawlAt = need(p.crawl, "x-crawl.ts").match(/export const CRAWL_AT\s*=\s*"([^"]+)"/)?.[1];
  if (!crawlAt) throw new Skip("CRAWL_AT not found in x-crawl.ts");
  need(p.wire, "wire.ts");
  need(p.papers, "papers.ts");
  const wireMod = (await import(p.wire)) as { WIRE_ROWS?: unknown; WIRE_CRAWL_AT?: string };
  const papersMod = (await import(p.papers)) as { PAPERS?: unknown };
  const relMod = existsSync(p.releases) ? ((await import(p.releases)) as { RELEASES_ATOM?: unknown }) : {};
  if (!Array.isArray(wireMod.WIRE_ROWS)) throw new Skip("WIRE_ROWS not an array");
  if (!Array.isArray(papersMod.PAPERS)) throw new Skip("PAPERS not an array");
  // Same coherence rule as feed.xml: only this crawl's Wire counts.
  if (wireMod.WIRE_CRAWL_AT !== crawlAt) throw new Skip(`wire crawl ${wireMod.WIRE_CRAWL_AT ?? "?"} ≠ CRAWL_AT ${crawlAt}`);
  let store: WatchStore = emptyWatchStore();
  if (existsSync(p.watchSeen)) {
    try {
      const s = JSON.parse(readFileSync(p.watchSeen, "utf8"));
      if (s?.schema !== 1 || typeof s.seen !== "object" || !Array.isArray(s.entries)) throw new Error();
      store = s;
    } catch {
      throw new Skip("watch-seen.json unparseable");
    }
  }
  const { store: next, added, dropped } = watchStep(store, terms, {
    crawlAt,
    wire: wireMod.WIRE_ROWS as never,
    papers: papersMod.PAPERS as never,
    releases: (Array.isArray(relMod.RELEASES_ATOM) ? relMod.RELEASES_ATOM : []) as never,
  });
  writeIfChanged(p.watchSeen, JSON.stringify(next, null, 2) + "\n");
  const xml = renderWatchFeed(next);
  if (xml != null) writeIfChanged(p.watch, xml);
  return `watch=${added}/${dropped}`;
}

const statusFile = process.env.ATOM_FEED_STATUS || null;
if (statusFile) rmSync(statusFile, { force: true });
let line: string;
try {
  line = await main();
} catch (e) {
  const why = e instanceof Skip ? e.message : `error: ${e instanceof Error ? e.message : String(e)}`;
  line = `atom-feed: skipped (${why})`;
}
let watchLine: string;
try {
  watchLine = await watch();
} catch (e) {
  const why = e instanceof Skip ? e.message : `error: ${e instanceof Error ? e.message : String(e)}`;
  watchLine = `watch=skipped (${why})`;
}
console.log(line);
console.log(watchLine);
if (statusFile) {
  try {
    writeFileSync(statusFile, line + "\n" + watchLine + "\n");
  } catch {
    /* status is best-effort */
  }
}
process.exit(0);
