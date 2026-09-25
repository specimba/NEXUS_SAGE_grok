/**
 * Beat 10 · one-off topic-heat backfill from REAL persisted crawls: every committed version of
 * src/data/pulse-clusters.ts in git history (source "git"). Idempotent (upsert by crawl_at).
 *   bun scripts/heat-backfill.ts
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { countCompanies, countOtherLabs, upsertCrawl, type HeatFile } from "@/lib/topic-heat";

const desk = resolve(import.meta.dir, "..");
const heatPath = resolve(desk, "artifacts/sage/topic-heat.json");
const git = (...a: string[]) => execFileSync("git", a, { cwd: desk, encoding: "utf8", maxBuffer: 64 << 20 });
let heat: HeatFile | null = existsSync(heatPath) ? JSON.parse(readFileSync(heatPath, "utf8")) : null;
for (const sha of git("log", "--format=%H", "--", "src/data/pulse-clusters.ts").trim().split("\n").filter(Boolean)) {
  const src = git("show", `${sha}:desk/src/data/pulse-clusters.ts`);
  const at = src.match(/PULSE_CLUSTERS_AT\s*=\s*"([^"]+)"/)?.[1];
  if (!at) continue;
  const clusters = src
    .split("\n")
    .filter((l) => l.trimStart().startsWith('{"id":'))
    .map((l) => JSON.parse(l.trim().replace(/,$/, "")) as { title: string; member_ids: string[] });
  if (heat?.crawls.some((c) => c.crawl_at === at && c.source === "postingest" && c.labs)) continue; // never overwrite a live record
  heat = upsertCrawl(heat, { crawl_at: at, counts: countCompanies(clusters), labs: countOtherLabs(clusters), source: `git:${sha.slice(0, 7)}` });
  console.log(`backfill ${at} ${sha.slice(0, 7)} clusters=${clusters.length} ${JSON.stringify(heat.crawls.find((c) => c.crawl_at === at)!.counts)}`);
}
writeFileSync(heatPath, JSON.stringify(heat, null, 2) + "\n");
console.log(`topic-heat.json crawls=${heat?.crawls.length ?? 0}`);
