#!/usr/bin/env bun
/**
 * OPT win 3 — write src/data/desk-view.ts (the ONE data module the desk client imports for crawl data) and
 * src/data/lead-log-view.ts (the capped holotape log app/page.tsx hands the desk as props).
 * Runs at the end of scripts/rank-snapshot.ts (npm postingest / rank:snapshot) in a fresh process, so it reads
 * the modules ingest + rank-snapshot just wrote. Deterministic: same raw modules ⇒ byte-identical output.
 * Size is fixed by DESK_VIEW_CAPS (src/lib/desk-view.ts) and LEAD_LOG_CAPS (src/lib/lead-log.ts), not by the crawl.
 *   bun scripts/desk-view.ts          write (only when the content changed)
 *   bun scripts/desk-view.ts --check  exit 1 if either file is not what the raw modules produce
 *   bun scripts/desk-view.ts --report what the caps trimmed from THIS crawl (why, how old) + lead-log days; writes
 *                                     nothing, always exit 0 — live-data checks are a report, never a test
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DESK_VIEW_CAPS, keptStories, sourceOf } from "@/lib/desk-view";
import { deskViewPins } from "@/lib/desk-view-module";
import { buildLeadLog, LEAD_LOG_CAPS } from "@/lib/lead-log";
import { rawDeskViewInputs } from "@/lib/desk-view-inputs";
import { fitDeskView } from "@/lib/desk-view-module";
import { renderDeskViewPapersModule } from "@/lib/desk-view-module";
import { renderLeadLogModule } from "@/lib/lead-log-module";

const desk = resolve(import.meta.dir, "..");
const historyPath = resolve(desk, "artifacts/sage/lead-history.json");

const { input, extras } = rawDeskViewInputs();
const fit = fitDeskView(input, extras);
const logBody = renderLeadLogModule(existsSync(historyPath) ? JSON.parse(readFileSync(historyPath, "utf8")) : null);

const files = [
  { name: "src/data/desk-view.ts", body: fit.body },
  { name: "src/data/desk-view-papers.ts", body: renderDeskViewPapersModule(fit.view, extras) },
  { name: "src/data/lead-log-view.ts", body: logBody },
].map((f) => ({ ...f, path: resolve(desk, f.name) }));
const stale = files.filter((f) => (existsSync(f.path) ? readFileSync(f.path, "utf8") : null) !== f.body);
const v = fit.view;
const t = v.trimmed;
const at = extras.stamps.PULSE_CLUSTERS_AT;
const summary = `crawl ${at} · ${Object.keys(v.memberRows).length} members · ${Object.values(v.memberRows).filter((r) => r.c).length + v.orphanClusters.length} clusters · ${v.papers.length} papers · ${(fit.body.length / 1024).toFixed(1)} KB · gz ${fit.gz}/${DESK_VIEW_CAPS.gzBytes} B · trimmed ${t.stories} stories / ${t.items} items / ${t.xPosts} X / ${t.papers} papers · lead log ${(logBody.length / 1024).toFixed(1)} KB`;
if (process.argv.includes("--report")) {
  const pins = new Set(deskViewPins(extras));
  const kept = keptStories({ ...input, pins: [...pins] }, { drop: fit.drop });
  const linkLong = (c: (typeof input.clusters)[number]) =>
    [c.url, ...[c.lead_id, ...c.member_ids].map((id) => input.members[id]?.url ?? "")].some((u) => u.length > DESK_VIEW_CAPS.chars.url);
  const cnt: Record<string, number> = {};
  input.clusters.forEach((c, i) => { if (kept.has(i)) for (const id of new Set([c.lead_id, ...c.member_ids])) cnt[sourceOf(id)] = (cnt[sourceOf(id)] ?? 0) + 1; });
  const dropped = input.clusters.filter((_, i) => !kept.has(i));
  console.log(`desk-view REPORT · ${summary}`);
  const longest = input.clusters.reduce((m, c) => Math.max(m, c.url.length), 0);
  const over640 = input.clusters.filter((c, i) => kept.has(i) && c.url.length > 640).length;
  console.log(`  links: longest story link ${longest} chars · ${over640} kept stories with links > 640 (kept whole; drop only > ${DESK_VIEW_CAPS.chars.url})`);
  console.log(`  budget drop ${fit.drop} · pins ${pins.size} · kept items/source ${Object.entries(cnt).map(([k, n]) => `${k} ${n}/${DESK_VIEW_CAPS.items[k] ?? "∞"}`).join(" · ")}`);
  for (const c of [...dropped].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)))
    console.log(`  - ${c.at} ${c.id} · ${linkLong(c) ? `link ${Math.max(c.url.length, ...[c.lead_id, ...c.member_ids].map((id) => (input.members[id]?.url ?? "").length))} > ${DESK_VIEW_CAPS.chars.url} chars — broken data (any age)` : "age (oldest unpinned)"} · ${c.title.slice(0, 60)}`);
  const ageDropped = dropped.filter((c) => !linkLong(c));
  const keptFree = input.clusters.filter((c, i) => kept.has(i) && !pins.has(c.id));
  if (ageDropped.length && keptFree.length) {
    const newest = ageDropped.reduce((a, c) => (c.at > a ? c.at : a), "");
    const oldest = keptFree.reduce((a, c) => (c.at < a ? c.at : a), "9");
    console.log(`  age order: newest age-dropped ${newest} ${newest <= oldest ? "≤" : "> (NOTE: not oldest-first — check)"} oldest kept unpinned ${oldest}`);
  }
  if (existsSync(historyPath)) {
    const full = buildLeadLog(JSON.parse(readFileSync(historyPath, "utf8")));
    const shown = full.days.slice(0, LEAD_LOG_CAPS.days);
    console.log(`  lead log: ${full.days.length} days in history · tape shows ${shown.length} (cap ${LEAD_LOG_CAPS.days}) ${shown.at(-1)?.date ?? ""}…${shown[0]?.date ?? ""}${full.days.length > shown.length ? ` · off tape: ${full.days.slice(LEAD_LOG_CAPS.days).map((d) => d.date).join(" ")}` : ""}`);
  }
  console.log(`  generated files ${stale.length ? `STALE: ${stale.map((f) => f.name).join(" + ")}` : "in sync"}`);
} else if (process.argv.includes("--check")) {
  if (stale.length) {
    console.error(`desk-view STALE — ${stale.map((f) => f.name).join(" + ")} ≠ raw modules (crawl ${at}); run bun scripts/desk-view.ts`);
    process.exit(1);
  }
  console.log(`desk-view OK (in sync) · ${summary}`);
} else {
  for (const f of stale) writeFileSync(f.path, f.body);
  console.log(`desk-view ${stale.length ? `written (${stale.map((f) => f.name.replace("src/data/", "")).join(", ")})` : "unchanged"} · ${summary}`);
}
