#!/usr/bin/env bun
/**
 * PASS-A2 A2.3 — one-off check (not a CI step): old (pre-A2) vs new analyst AI-title gate over the same cached entries.
 *   bun scripts/analyst-gate-diff.ts [--cache <dir>] [--base <sha>]
 * Default cache: artifacts/sage/rss-analyst-cache/ (gitignored crawl cache). Config ai_terms from the committed config.
 * Prints `analyst-gate: base=<sha> kept_old=N kept_new=M dropped_company_only=K newly_kept=X` and every kept→dropped
 * title (title · feed · matched company word). Exit 1 when newly_kept > 0 (the new gate must never be looser).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AI_TERMS } from "../src/lib/ai-relevance";
import { ANALYST_COMPANY_WORDS, ANALYST_FEEDS, analystDropReason, type AnalystId } from "../src/lib/rss-analyst";
import { LAB_FEEDS, parseRssOrAtom } from "../src/lib/rss-labs";
import { applySageConfig, loadSageConfig } from "../src/lib/sage-config-disk";
import { HEAT_COMPANIES, OTHER_LABS } from "../src/lib/topic-heat";
import { classifyPost } from "../src/lib/x-hygiene";

const desk = resolve(import.meta.dir, "..");
const opt = (k: string) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const cache = resolve(opt("--cache") || resolve(desk, "artifacts/sage/rss-analyst-cache"));
const base = opt("--base") || spawnSync("git", ["log", "-1", "--format=%h", "--grep=^chore(sage): crawl"], { cwd: desk, encoding: "utf8" }).stdout.trim() || "?";
applySageConfig(loadSageConfig(desk).config);

// Pre-A2 gate, rebuilt verbatim: lab ids + every heat regex.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const OLD_NAMES = (() => {
  const labIds = [...new Set(LAB_FEEDS.map((f) => f.lab))].map((id) => escapeRe(id).replace(/-/g, "[- ]?"));
  const heat = [...HEAT_COMPANIES.filter((c) => c.id !== "other").map((c) => c.re.source), ...Object.values(OTHER_LABS).map((l) => l.re.source)];
  return new RegExp([`\\b(${labIds.join("|")})\\b`, ...heat.map((h) => `(?:${h})`)].join("|"), "i");
})();
function oldReason(title: string, summary: string, feed: AnalystId): string | null {
  const c = classifyPost({ text: `${title} ${summary}`, handle: feed });
  if (c.flatten || c.class === "flatten" || c.class === "drop") return `deny:${c.class}`;
  if (/^\[AINews\]/i.test(title)) return null;
  return AI_TERMS.test(title) || OLD_NAMES.test(title) ? null : "not-ai";
}

let keptOld = 0, keptNew = 0, companyOnly = 0, newlyKept = 0;
const changed: string[] = [];
for (const f of ANALYST_FEEDS) {
  const p = resolve(cache, `${f.id}.xml`);
  if (!existsSync(p)) { console.error(`analyst-gate: ${f.id}.xml missing in ${cache}`); continue; }
  const seen = new Set<string>();
  for (const e of parseRssOrAtom(readFileSync(p, "utf8"))) {
    const title = String(e.title ?? "").trim();
    if (!title || !e.link || seen.has(title)) continue;
    seen.add(title);
    const o = oldReason(title, e.summary ?? "", f.id);
    const n = analystDropReason(title, e.summary ?? "", f.id);
    if (o === null) keptOld++;
    if (n === null) keptNew++;
    if (n === "not-ai:company-only") companyOnly++;
    if (o !== null && n === null) newlyKept++;
    if (o === null && n !== null) changed.push(`  - ${title} · ${f.id} · ${(title.match(ANALYST_COMPANY_WORDS)?.[0] ?? "?").toLowerCase()} · ${n}`);
  }
}
console.log(`analyst-gate: base=${base} kept_old=${keptOld} kept_new=${keptNew} dropped_company_only=${companyOnly} newly_kept=${newlyKept}`);
for (const l of changed) console.log(l);
process.exit(newlyKept > 0 ? 1 : 0);
