#!/usr/bin/env bun
/** B3 · print the per-source crawl table from artifacts/sage/ingest-last.json (cf-build.sh). Never fails the build. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderCrawlTable } from "../src/lib/crawl-table";

const p = resolve(import.meta.dir, "../artifacts/sage/ingest-last.json");
if (!existsSync(p)) {
  console.log("  (no artifacts/sage/ingest-last.json)");
  process.exit(0);
}
try {
  console.log(renderCrawlTable(JSON.parse(readFileSync(p, "utf8"))));
} catch (e) {
  console.log(`  (ingest-last.json unreadable: ${(e as Error).message})`);
}
