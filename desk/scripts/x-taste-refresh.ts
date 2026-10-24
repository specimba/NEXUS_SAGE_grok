/**
 * PASS-C2 weekly X taste refresh — BOX ONLY (Mon 09:17 TRT routine). Never in CI.
 *   bun scripts/x-taste-refresh.ts --capture <raw.json> [--commit]
 *   bun scripts/x-taste-refresh.ts --skip <reason> [--commit]       (login_wall / challenge / …)
 * raw.json = { "items": [{ "url", "author", "text", "surface": "bookmark"|"like"|"feed" }], "seen": N }
 *         or { "skipped": true, "reason": "login_wall" } — written by the routine's read-only browser pass.
 * --commit: selective `git add` of the files this run wrote + one commit (no push). Exit 0 on an honest skip.
 * Prints `NOTIFY: X session needs login on the box` on a login wall — the routine sends that one line to Grok Bot.
 *   bun scripts/x-taste-refresh.ts --plan   (intel plan 4: prints the widened free X reads for this run, config/x-taste-widen.json)
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { readCaptureFile, refreshTaste, type RefreshInput } from "../src/lib/x-taste-refresh";
import { PULSE_CLUSTERS } from "../src/data/pulse-clusters";

const root = resolve(import.meta.dir, "..");
const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
if (process.argv.includes("--plan")) {
  const { loadXWiden, widenPlan } = await import("../src/lib/x-taste-widen");
  const c = loadXWiden(root);
  console.log(JSON.stringify({ accounts: c.accounts.length, calls: widenPlan(c) }, null, 2));
  process.exit(0);
}
const cap = arg("--capture");
const skip = arg("--skip");
if (!cap && !skip) {
  console.error("usage: x-taste-refresh.ts --capture <raw.json> | --skip <reason> [--commit]");
  process.exit(2);
}
const input: RefreshInput = cap ? readCaptureFile(resolve(cap)) : { kind: "skip", reason: skip! };
const r = refreshTaste(root, input, { pulseTitles: PULSE_CLUSTERS.map((c) => c.title) });
if (r.status === "refused") {
  console.log(`x-taste-refresh: ${r.reason} — nothing done`);
  process.exit(0);
}
if (r.status === "wrote") console.log(`x-taste-refresh: WROTE captured_at=${r.captured_at} kept=${r.kept}/${r.seen}`);
else {
  console.log(`x-taste-refresh: skipped (${r.reason}) — last honest shelf kept, no retry`);
  if (r.notify) console.log(`NOTIFY: ${r.notify}`);
}
if (process.argv.includes("--commit") && r.files.length) {
  const add = spawnSync("git", ["add", "--", ...r.files], { cwd: root, stdio: "inherit" });
  if (add.status !== 0) process.exit(1);
  const msg = r.status === "wrote" ? `chore(sage): X taste refresh ${r.captured_at} (box) [skip ci]` : `chore(sage): X taste refresh skipped (${r.reason}) (box) [skip ci]`;
  const c = spawnSync("git", ["commit", "-m", msg, "--", ...r.files], { cwd: root, stdio: "inherit" });
  process.exit(c.status === 0 ? 0 : 1);
}
