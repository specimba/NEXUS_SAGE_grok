#!/usr/bin/env bun
/**
 * PASS-Q1 §2 hash gate. Computes reader_hash over src/data/*.ts and compares with artifacts/sage/reader-hash.json.
 *   bun scripts/reader-hash.ts            → prints {"reader_hash","prev","changed"} JSON; writes $GITHUB_OUTPUT changed=…
 *   bun scripts/reader-hash.ts --commit published|skipped
 *        → writes artifacts/sage/last-checked.json (checked_at, reader_hash, published_at, data_at, soft history)
 *          and, when published, artifacts/sage/reader-hash.json.
 * Exit 1 on any gate error (watchdog reads gate_error).
 */
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readerHash } from "@/lib/reader-hash";

const desk = resolve(import.meta.dir, "..");
const dataDir = resolve(desk, "src/data");
const art = resolve(desk, "artifacts/sage");
const hashPath = resolve(art, "reader-hash.json");
const checkedPath = resolve(art, "last-checked.json");
const readJson = (p: string) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);

const crawlAt = readFileSync(resolve(dataDir, "x-crawl.ts"), "utf8").match(/export const CRAWL_AT\s*=\s*"([^"]+)"/)?.[1] ?? null;
const files: Record<string, string> = {};
for (const f of readdirSync(dataDir).filter((n) => n.endsWith(".ts"))) files[f] = readFileSync(resolve(dataDir, f), "utf8");
const hash = readerHash(files, crawlAt);
const prev = readJson(hashPath)?.reader_hash ?? null;
const changed = hash !== prev;

const mode = process.argv.includes("--commit") ? process.argv[process.argv.indexOf("--commit") + 1] : null;
if (!mode) {
  console.log(JSON.stringify({ reader_hash: hash, prev, changed, crawl_at: crawlAt }));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nreader_hash=${hash}\n`);
  process.exit(0);
}
if (mode !== "published" && mode !== "skipped") {
  console.error(`reader-hash: --commit published|skipped, got ${mode}`);
  process.exit(1);
}
const now = new Date().toISOString();
const last = readJson(checkedPath) ?? {};
// soft history: share of sources that soft-failed this run (from ingest-last.json), newest first, keep 4
let soft: { soft: number; total: number } | null = null;
try {
  const ing = readJson(resolve(art, "ingest-last.json"));
  const rows = (ing?.crawl_sources ?? []) as { id: string; status: string }[];
  // box-only sources (Gmail F, X-session E) are soft by design in CI — not counted
  const counted = rows.filter((r) => !/^(gmail|x)/.test(r.id));
  if (counted.length) soft = { soft: counted.filter((r) => r.status !== "ok").length, total: counted.length };
} catch { /* soft history optional */ }
const out = {
  checked_at: now,
  data_at: crawlAt,
  reader_hash: hash,
  published_at: mode === "published" ? now : (last.published_at ?? null),
  published_crawl: mode === "published" ? crawlAt : (last.published_crawl ?? null),
  last_run: mode,
  soft_history: [soft, ...(last.soft_history ?? [])].filter(Boolean).slice(0, 4),
  gate_error: null,
};
writeFileSync(checkedPath, JSON.stringify(out, null, 2) + "\n");
if (mode === "published") writeFileSync(hashPath, JSON.stringify({ reader_hash: hash, crawl_at: crawlAt, published_at: now }, null, 2) + "\n");
console.log(`reader-hash: ${mode} · ${hash.slice(0, 12)} · checked ${now}`);
