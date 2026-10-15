#!/usr/bin/env bun
/**
 * PASS-C3 11a — max-size Setup fixture for the box overflow-390 gate. Writes a SYNTHETIC src/data/sage-setup.ts body
 * where everything the config can grow to is at its code bound: every source on, every cap at its ceiling, every wired
 * feed, every keyword list at KEYWORD_LIST_MAX terms incl. one term of exactly KEYWORD_LEN_MAX chars (imported, not
 * hard-coded) and long unbroken terms, 6-digit row counts, a soft-fail, and 8 C2-length (160-char) invalid errors.
 *   bun scripts/setup-max-fixture.ts <scratch path>      (refuses the live src/data/sage-setup.ts)
 * To gate: back up the live file, copy the fixture over it, PAGES build, overflow-390 on ?view=setup + &edit=1, then
 * restore the live file (git checkout / bun scripts/desk-view.ts). Never commit the synthetic file.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defaultSageConfig, fileJson, KEYWORD_LEN_MAX, KEYWORD_LIST_MAX, limitsFromCode, SOURCE_IDS, validateSageConfig } from "../src/lib/sage-config";
import { buildSetupView, CRAWL_ROW_ID, renderSageSetupModule } from "../src/lib/sage-setup";
import { configHash } from "../src/lib/sage-config-disk";

const out = process.argv[2];
if (!out || resolve(out) === resolve(import.meta.dir, "../src/data/sage-setup.ts")) {
  console.error("usage: bun scripts/setup-max-fixture.ts <scratch path> (never the live src/data/sage-setup.ts)");
  process.exit(2);
}

function maxFixtureConfig() {
  const L = limitsFromCode();
  const c = defaultSageConfig() as unknown as { sources: Record<string, Record<string, unknown>>; keywords: Record<string, string[]>; taste: { weight: number; max: number } };
  for (const id of L.source_ids) {
    c.sources[id]!.on = true;
    for (const [f, max] of Object.entries(L.ceilings[id] ?? {})) c.sources[id]![f] = max;
    if (L.feeds[id]) c.sources[id]!.feeds = [...L.feeds[id]!];
  }
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const word = (i: number, len: number) => Array.from({ length: len }, (_, k) => letters[(i * 7 + k) % 26]).join("");
  for (const k of L.keyword_lists) {
    const terms = [...(L.baseline[k] ?? c.keywords[k] ?? [])];
    terms.push(word(1, KEYWORD_LEN_MAX)); // exactly KEYWORD_LEN_MAX, unbroken
    terms.push(`${word(2, 50)} ${word(3, 60)}`);
    for (let i = 0; terms.length < KEYWORD_LIST_MAX; i++) terms.push(`${k}-${word(i, 8 + (i % 5) * 9)}-${i}`);
    c.keywords[k] = [...new Set(terms)].slice(0, KEYWORD_LIST_MAX);
  }
  c.taste.weight = L.taste_max;
  return c;
}

const cfg = maxFixtureConfig();
const v = validateSageConfig(cfg);
if (!v.ok) {
  console.error(`fixture config is not valid:\n  ${v.errors.join("\n  ")}`);
  process.exit(1);
}
const rows = SOURCE_IDS.flatMap((id, i) => {
  const rid = CRAWL_ROW_ID[id];
  return rid ? [{ id: rid, rows: 100000 + i * 7919, status: i === 3 ? "fail" : "ok", reason: i === 3 ? "timeout" : null }] : [];
});
const err = (i: number) => `keywords.ai_terms: invalid regex fragment "(${"q".repeat(120)}" · fixture error ${i} · ${"z".repeat(160)}`.slice(0, 160);
const view = buildSetupView(
  {
    config: v.config,
    config_hash: configHash(v.config),
    status: "invalid",
    used: "last-good",
    errors: Array.from({ length: 8 }, (_, i) => err(i)),
    since_commit: "fffffff",
    since_at: "2026-10-16T08:11:00Z",
  },
  { stamp: "2026-10-16T08:11:00Z", rows },
);
const file = fileJson(cfg);
writeFileSync(
  out,
  renderSageSetupModule({ ...view, limits: limitsFromCode(), config: cfg, file_hash: createHash("sha256").update(file).digest("hex") }),
);
const longest = Math.max(...Object.values(cfg.keywords).flat().map((t) => t.length));
console.log(`setup max fixture → ${out} · ${Object.values(cfg.keywords).map((l) => l.length).join("/")} terms · longest ${longest} (= KEYWORD_LEN_MAX ${KEYWORD_LEN_MAX}) · ${file.length} B config`);
