#!/usr/bin/env bun
/**
 * OPT win 3 — write src/data/desk-view.ts (the ONE data module the desk client imports for crawl data) and
 * src/data/lead-log-view.ts (the capped holotape log app/page.tsx hands the desk as props).
 * Runs at the end of scripts/rank-snapshot.ts (npm postingest / rank:snapshot) in a fresh process, so it reads
 * the modules ingest + rank-snapshot just wrote. Deterministic: same raw modules ⇒ byte-identical output.
 * Size is fixed by DESK_VIEW_CAPS (src/lib/desk-view.ts) and LEAD_LOG_CAPS (src/lib/lead-log.ts), not by the crawl.
 *   bun scripts/desk-view.ts          write (only when the content changed)
 *   bun scripts/desk-view.ts --check  exit 1 if either file is not what the raw modules produce
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DESK_VIEW_CAPS } from "@/lib/desk-view";
import { rawDeskViewInputs } from "@/lib/desk-view-inputs";
import { fitDeskView } from "@/lib/desk-view-module";
import { renderLeadLogModule } from "@/lib/lead-log-module";

const desk = resolve(import.meta.dir, "..");
const historyPath = resolve(desk, "artifacts/sage/lead-history.json");

const { input, extras } = rawDeskViewInputs();
const fit = fitDeskView(input, extras);
const logBody = renderLeadLogModule(existsSync(historyPath) ? JSON.parse(readFileSync(historyPath, "utf8")) : null);

const files = [
  { name: "src/data/desk-view.ts", body: fit.body },
  { name: "src/data/lead-log-view.ts", body: logBody },
].map((f) => ({ ...f, path: resolve(desk, f.name) }));
const stale = files.filter((f) => (existsSync(f.path) ? readFileSync(f.path, "utf8") : null) !== f.body);
const v = fit.view;
const t = v.trimmed;
const at = extras.stamps.PULSE_CLUSTERS_AT;
const summary = `crawl ${at} · ${Object.keys(v.memberRows).length} members · ${Object.values(v.memberRows).filter((r) => r.c).length + v.orphanClusters.length} clusters · ${v.papers.length} papers · ${(fit.body.length / 1024).toFixed(1)} KB · gz ${fit.gz}/${DESK_VIEW_CAPS.gzBytes} B · trimmed ${t.stories} stories / ${t.items} items / ${t.xPosts} X / ${t.papers} papers · lead log ${(logBody.length / 1024).toFixed(1)} KB`;
if (process.argv.includes("--check")) {
  if (stale.length) {
    console.error(`desk-view STALE — ${stale.map((f) => f.name).join(" + ")} ≠ raw modules (crawl ${at}); run bun scripts/desk-view.ts`);
    process.exit(1);
  }
  console.log(`desk-view OK (in sync) · ${summary}`);
} else {
  for (const f of stale) writeFileSync(f.path, f.body);
  console.log(`desk-view ${stale.length ? `written (${stale.map((f) => f.name.replace("src/data/", "")).join(", ")})` : "unchanged"} · ${summary}`);
}
