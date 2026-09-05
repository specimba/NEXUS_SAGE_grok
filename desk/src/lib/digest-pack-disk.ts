/**
 * Disk helpers for Digest cadence — Node/Bun only (not imported by browser UI).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { DigestItem } from "@/data/digest-pack";
import {
  isDigestDue,
  packStamp,
  renderPlan,
  renderReport,
  type DigestLast,
} from "@/lib/digest-pack";

export { isDigestDue, packStamp };
export type { DigestLast };

export function digestSageDir(deskRoot: string) {
  return resolve(deskRoot, "artifacts/sage");
}

export function digestLastPath(deskRoot: string) {
  return join(digestSageDir(deskRoot), "digest-last.json");
}

export function digestPacksDir(deskRoot: string) {
  return join(digestSageDir(deskRoot), "packs");
}

export function readDigestLast(deskRoot: string): DigestLast | null {
  const path = digestLastPath(deskRoot);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as DigestLast;
    if (!raw?.last_at || !raw?.next_at) return null;
    return {
      last_at: String(raw.last_at),
      next_at: String(raw.next_at),
      pack_id: String(raw.pack_id ?? ""),
    };
  } catch {
    return null;
  }
}

export function writeDigestLast(deskRoot: string, last: DigestLast) {
  const path = digestLastPath(deskRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(last, null, 2) + "\n", "utf8");
}

export function ensurePacksDir(deskRoot: string) {
  const dir = digestPacksDir(deskRoot);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeDigestPackFiles(
  deskRoot: string,
  opts: {
    cycleId: string;
    leadId: string;
    at: string;
    source: string;
    items: DigestItem[];
    dropped: string[];
    packId: string;
  },
) {
  const packsDir = ensurePacksDir(deskRoot);
  const sage = digestSageDir(deskRoot);
  mkdirSync(sage, { recursive: true });

  const plan = renderPlan(opts.items);
  const packJson = {
    at: opts.at,
    cycle: opts.cycleId,
    lead_id: opts.leadId,
    pack_id: opts.packId,
    plan,
  };
  const packJsonPath = join(packsDir, `${opts.packId}.json`);
  const packMdPath = join(packsDir, `${opts.packId}.md`);
  writeFileSync(packJsonPath, JSON.stringify(packJson, null, 2) + "\n", "utf8");
  writeFileSync(
    packMdPath,
    renderReport(opts.items, opts.at, { source: opts.source, dropped: opts.dropped }),
    "utf8",
  );

  const digestJson = {
    at: opts.at,
    source: opts.source,
    cycle: opts.cycleId,
    lead_id: opts.leadId,
    items: opts.items,
    dropped: opts.dropped,
    plan,
  };
  const cycleJsonPath = join(sage, `digest-${opts.cycleId}.json`);
  const cycleMdPath = join(sage, `digest-${opts.cycleId}.md`);
  writeFileSync(cycleJsonPath, JSON.stringify(digestJson, null, 2) + "\n", "utf8");
  writeFileSync(
    cycleMdPath,
    renderReport(opts.items, opts.at, { source: opts.source, dropped: opts.dropped }),
    "utf8",
  );

  return {
    packJsonPath,
    packMdPath,
    cycleJsonPath,
    cycleMdPath,
    plan,
  };
}
