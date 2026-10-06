/**
 * Pages publish gate: the header crawl and the Wire snapshot must come from the same crawl.
 *   bun scripts/pages-coherence.ts            → checks src/data (CRAWL_AT = WIRE_CRAWL_AT = PULSE_CLUSTERS_AT = TOPIC_HEAT_AT
 *                                               = DESK_VIEW_AT, and desk-view.ts + lead-log-view.ts are exactly what the raw
 *                                               modules / lead-history.json generate under DESK_VIEW_CAPS / LEAD_LOG_CAPS)
 *   bun scripts/pages-coherence.ts <out-dir>  → also checks the built index.html (header "CRAWL HH:MM" = "WIRE · crawl HH:MM")
 * Exit 1 on any mismatch. A manual ingest that skips postingest (rank-snapshot) fails here and never reaches Pages.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { digestCadenceCoherenceFails } from "@/lib/digest-pack-disk";
import { xTasteCoherenceFails } from "@/lib/x-taste-disk";

const desk = resolve(import.meta.dir, "..");
const pick = (file: string, name: string): string | null => {
  const m = readFileSync(resolve(desk, "src/data", file), "utf8").match(new RegExp(`export const ${name}(?::[^=]+)? = "([^"]+)"`));
  return m ? m[1] : null;
};
const stamps = {
  CRAWL_AT: pick("x-crawl.ts", "CRAWL_AT"),
  PULSE_CLUSTERS_AT: pick("pulse-clusters.ts", "PULSE_CLUSTERS_AT"),
  WIRE_CRAWL_AT: pick("wire.ts", "WIRE_CRAWL_AT"),
  TOPIC_HEAT_AT: pick("topic-heat.ts", "TOPIC_HEAT_AT"),
  // OPT win 3: the client renders from the slim view — it must carry the same crawl stamp …
  DESK_VIEW_AT: existsSync(resolve(desk, "src/data/desk-view.ts")) ? pick("desk-view.ts", "DESK_VIEW_AT") : null,
};
const fails: string[] = [];
for (const [k, v] of Object.entries(stamps)) if (!v) fails.push(`${k} not found`);
const ref = stamps.CRAWL_AT;
for (const [k, v] of Object.entries(stamps)) if (v && ref && v !== ref) fails.push(`${k} ${v} ≠ CRAWL_AT ${ref}`);
// … and the same content (a hand-edited raw module or a skipped regen fails here).
if (stamps.DESK_VIEW_AT) {
  const r = spawnSync("bun", ["scripts/desk-view.ts", "--check"], { cwd: desk, encoding: "utf8" });
  if (r.status !== 0) fails.push(`desk-view.ts / lead-log-view.ts stale vs raw modules (bun scripts/desk-view.ts --check: ${(r.stderr || r.stdout || "").trim().slice(0, 160)})`);
}

const out = process.argv[2];
if (out) {
  const idx = resolve(out, "index.html");
  if (!existsSync(idx)) fails.push(`${idx} missing`);
  else {
    const html = readFileSync(idx, "utf8");
    const wire = html.match(/WIRE · crawl (\d\d:\d\d)/)?.[1];
    const heads = [...new Set([...html.matchAll(/CRAWL (\d\d:\d\d)/g)].map((m) => m[1]))];
    if (!wire) fails.push("built index.html has no 'WIRE · crawl HH:MM'");
    if (heads.length === 0) fails.push("built index.html has no header 'CRAWL HH:MM'");
    for (const h of heads) if (wire && h !== wire) fails.push(`built header CRAWL ${h} ≠ WIRE crawl ${wire}`);
  }
}
// Pass B — Digest cadence module must mirror disk digest-last.json (+ newest pack stamp).
for (const f of digestCadenceCoherenceFails(desk)) fails.push(f);
// Pass E — X-taste module must mirror disk x-taste-last.json (ids/counts/locks).
for (const f of xTasteCoherenceFails(desk)) fails.push(f);

if (fails.length) {
  console.error(`pages-coherence FAIL: ${fails.join(" · ")} — run \`bun run rank:snapshot\` (postingest) and rebuild`);
  process.exit(1);
}
console.log(`pages-coherence OK: crawl ${ref}${out ? " · built header = Wire" : ""}`);
