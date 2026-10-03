#!/usr/bin/env bun
/**
 * Worst-case proof for DESK_VIEW_CAPS: writes the synthetic worst-case desk-view (every lane at its row cap, every
 * field at max — src/lib/__tests__/desk-view-synth.ts), seed-searched for the largest module that still fits gzBytes.
 *   bun scripts/desk-view-worst.ts /tmp/dv-worst.ts
 * To measure: copy it over src/data/desk-view.ts in a scratch worktree, `bun run build`, read First Load JS for `/`,
 * then restore the real file (bun scripts/desk-view.ts). Never commit the synthetic file.
 */
import { writeFileSync } from "node:fs";
import { rawDeskViewInputs } from "@/lib/desk-view-inputs";
import { fitDeskView } from "@/lib/desk-view-module";
import { synth, synthExtras } from "@/lib/__tests__/desk-view-synth";
const { extras } = rawDeskViewInputs();
let best: ReturnType<typeof fitDeskView> | null = null; let bs = 0;
for (let seed = 1; seed <= 120; seed++) {
  const s = synth(seed);
  const fit = fitDeskView(s.input, synthExtras(extras, s.wire));
  if (!best || fit.gz > best.gz) { best = fit; bs = seed; }
}
const out = process.argv[2];
if (!out || out.endsWith("src/data/desk-view.ts")) throw new Error("usage: bun scripts/desk-view-worst.ts <scratch path> (never the live src/data/desk-view.ts)");
writeFileSync(out, best!.body);
console.log("worst seed", bs, "raw", best!.body.length, "gz", best!.gz, JSON.stringify(best!.view.trimmed), "members", Object.keys(best!.view.memberRows).length);
