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
 */
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { emptyStore, renderAtomFeed, snapshotEditions, type EditionStore } from "./lib/atom-feed";

const argDesk = process.argv.includes("--desk") ? process.argv[process.argv.indexOf("--desk") + 1] : null;
const desk = resolve(argDesk || resolve(import.meta.dir, ".."));
const p = {
  history: resolve(desk, "artifacts/sage/lead-history.json"),
  store: resolve(desk, "artifacts/sage/morning-editions.json"),
  crawl: resolve(desk, "src/data/x-crawl.ts"),
  wire: resolve(desk, "src/data/wire.ts"),
  papers: resolve(desk, "src/data/papers.ts"),
  feed: resolve(desk, "public/feed.xml"),
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
  const xml = renderAtomFeed(next);
  const notes: string[] = [];
  if (!wireThisCrawl) notes.push(`wire crawl ${wireMod.WIRE_CRAWL_AT ?? "?"} ≠ CRAWL_AT ${crawlAt}, no snapshot`);
  if (changed.length) {
    writeIfChanged(p.store, JSON.stringify(next, null, 2) + "\n");
    notes.push(`snapshot ${changed.join(", ")}`);
  }
  if (xml == null) return `atom-feed: skipped (no editions yet)${notes.length ? ` · ${notes.join(" · ")}` : ""}`;
  const wrote = writeIfChanged(p.feed, xml);
  const n = (xml.match(/<entry>/g) ?? []).length;
  return `atom-feed: ${wrote ? "wrote" : "unchanged"} public/feed.xml · ${n} entr${n === 1 ? "y" : "ies"} · ${Buffer.byteLength(xml)} B${notes.length ? ` · ${notes.join(" · ")}` : ""}`;
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
console.log(line);
if (statusFile) {
  try {
    writeFileSync(statusFile, line + "\n");
  } catch {
    /* status is best-effort */
  }
}
process.exit(0);
