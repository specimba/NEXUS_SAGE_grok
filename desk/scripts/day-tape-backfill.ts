#!/usr/bin/env bun
/**
 * UX-NEXT-3 §2 one-off seed of artifacts/sage/crawl-tape.json from git history (real crawls only): for each of the
 * last commits that changed src/data/pulse-clusters.ts, its PULSE_CLUSTERS_AT and the number of clusters with
 * "is_new":true (first_seen = that crawl's stamp — exactly what ingest records from now on).
 *   bun scripts/day-tape-backfill.ts [--write] [ref]     (default ref HEAD; prints the log, writes only with --write)
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CRAWL_TAPE_KEEP, CRAWL_TAPE_PATH, parseCrawlTape, recordCrawl } from "../src/lib/day-tape";

const desk = resolve(import.meta.dir, "..");
const ref = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "HEAD";
const git = (...a: string[]) => execFileSync("git", a, { cwd: desk, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const shas = git("log", "--format=%H", "-n", String(CRAWL_TAPE_KEEP * 2), ref, "--", "src/data/pulse-clusters.ts").trim().split("\n").filter(Boolean);
let log = parseCrawlTape(null);
for (const sha of shas.reverse()) {
  const body = git("show", `${sha}:desk/src/data/pulse-clusters.ts`);
  const at = /export const PULSE_CLUSTERS_AT = "([^"]+)"/.exec(body)?.[1];
  if (!at) continue;
  const n = (body.match(/"is_new":true/g) ?? []).length;
  log = recordCrawl(log, at, n);
  console.log(`${sha.slice(0, 7)} ${at} +${n}`);
}
if (process.argv.includes("--write")) {
  writeFileSync(resolve(desk, CRAWL_TAPE_PATH), `${JSON.stringify(log, null, 2)}\n`);
  console.log(`wrote ${CRAWL_TAPE_PATH} (${log.crawls.length} crawls)`);
}
