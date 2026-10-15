/**
 * PASS-C2 config check: bun scripts/sage-config-check.ts [--emit]
 * Validates desk/config/sage-sources.json against the code ceilings and prints config_hash.
 * Exit 1 on an invalid config (the crawl itself never fails on it — it falls back to last good).
 * --emit: (re)write src/data/sage-desk-config.ts + src/data/sage-setup.ts from the current config and the
 *         last crawl's artifacts/sage/ingest-last.json (no network, no crawl) — e.g. right after a config commit.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadSageConfig, setupEditFields } from "../src/lib/sage-config-disk";
import { renderSageDeskConfigTs, renderSageSetupTs } from "../src/lib/sage-setup";
import { X_TASTE } from "../src/data/x-taste";
import { PULSE_CLUSTERS } from "../src/data/pulse-clusters";

const root = resolve(import.meta.dir, "..");
const l = loadSageConfig(root, { write: false, head: null });
// Not a crawl: never claim a commit — the next crawl records which commit first ran this config hash.
if (!l.since_commit) l.since_at = null;
console.log(`sage-config ${l.status} (${l.used}) config_hash=${l.config_hash}`);
for (const e of l.errors) console.log(`  invalid: ${e}`);
for (const w of l.warnings) console.log(`  warning: ${w}`);
if (process.argv.includes("--emit")) {
  const ingestPath = resolve(root, "artifacts/sage/ingest-last.json");
  const last = existsSync(ingestPath) ? JSON.parse(readFileSync(ingestPath, "utf8")) : {};
  const rows = (last.crawl_sources ?? []) as { id: string; rows: number; status: string; reason: string | null }[];
  writeFileSync(resolve(root, "src/data/sage-desk-config.ts"), renderSageDeskConfigTs(l, { items: X_TASTE.items, pulseTitles: PULSE_CLUSTERS.map((c) => c.title) }));
  writeFileSync(resolve(root, "src/data/sage-setup.ts"), renderSageSetupTs(l, { stamp: String(last.stamped_at ?? ""), rows }, setupEditFields(root)));
  console.log("  wrote src/data/sage-desk-config.ts + src/data/sage-setup.ts");
}
process.exit(l.status === "ok" ? 0 : 1);
