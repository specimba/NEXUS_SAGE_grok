/**
 * PASS-C3 ruling (3) — box publish after a desk/config change. CI regenerates the generated modules every crawl
 * (rank-snapshot → `bun scripts/desk-view.ts`, write mode) before pages-publish's `--check`; the box publish did not, so a
 * merged config edit left src/data/sage-setup.ts (config / file_hash) stale and `pages-coherence` failed. Now
 * pages-publish runs `bun scripts/desk-view.ts --sync-config` first, which follows this pure decision:
 *   - nothing stale → ok, nothing written;
 *   - desk/config unchanged (file_hash in SAGE_SETUP = the file's sha256) → no-op here; `--check` reports anything stale;
 *   - desk/config changed and ONLY sage-setup.ts is stale → write (exactly what CI's desk-view write does);
 *   - desk/config changed but other generated files are stale too → refuse (regenerating them here would hide a skipped
 *     postingest that `--check` exists to catch) and fail with the exact command to run. Never a silent skip.
 */
export const CONFIG_SYNC_FILE = "src/data/sage-setup.ts";

export type ConfigSyncDecision =
  | { action: "in-sync"; msg: string }
  | { action: "no-config-change"; msg: string }
  | { action: "write"; msg: string }
  | { action: "fail"; msg: string; cmd: string };

export function configSyncDecision(o: { stale: readonly string[]; setupFileHash: string | undefined; diskFileHash: string; desk: string }): ConfigSyncDecision {
  const changed = o.setupFileHash !== o.diskFileHash;
  const from = (o.setupFileHash ?? "none").slice(0, 12);
  const to = o.diskFileHash.slice(0, 12);
  if (o.stale.length === 0) return { action: "in-sync", msg: `desk-view config-sync: in sync (config file_hash ${to})` };
  if (!changed) return { action: "no-config-change", msg: `desk-view config-sync: desk/config unchanged (file_hash ${to}); stale ${o.stale.join(" + ")} left for --check` };
  const others = o.stale.filter((f) => f !== CONFIG_SYNC_FILE);
  if (others.length === 0)
    return { action: "write", msg: `desk-view config-sync: desk/config changed (file_hash ${from} → ${to}) — regenerating ${CONFIG_SYNC_FILE} (write mode, as CI does)` };
  const cmd = `cd ${o.desk} && bun run rank:snapshot && bun scripts/desk-view.ts --check`;
  return {
    action: "fail",
    cmd,
    msg: `desk-view config-sync: desk/config changed (file_hash ${from} → ${to}) AND ${others.join(" + ")} stale vs raw modules — not regenerating in publish (would hide a skipped postingest). Run: ${cmd}`,
  };
}
