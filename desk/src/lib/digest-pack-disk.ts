/**
 * Disk helpers for Digest cadence — Node/Bun only (not imported by browser UI).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
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

/** Commit-time mirror path for static export (Pass B). Disk digest-last.json remains truth. */
export function digestCadenceTsPath(deskRoot: string) {
  return resolve(deskRoot, "src/data/digest-cadence.ts");
}

/** Newest pack stamp under artifacts/sage/packs/*.json (lexicographic = chronological for packStamp). */
export function newestPackStamp(deskRoot: string): string | null {
  const dir = digestPacksDir(deskRoot);
  if (!existsSync(dir)) return null;
  const ids = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((id) => /^\d{4}-\d{2}-\d{2}T\d{2}/.test(id))
    .sort();
  return ids.length ? ids[ids.length - 1]! : null;
}

/** Render digest-cadence.ts from a DigestLast snapshot. */
export function renderDigestCadenceTs(last: DigestLast): string {
  return (
    `/** Snapshot of artifacts/sage/digest-last.json — regenerate via bun run digest:tick. */\n` +
    `export const DIGEST_CADENCE = {\n` +
    `  "last_at": ${JSON.stringify(last.last_at)},\n` +
    `  "next_at": ${JSON.stringify(last.next_at)},\n` +
    `  "pack_id": ${JSON.stringify(last.pack_id)},\n` +
    `} as const;\n`
  );
}

/** Write src/data/digest-cadence.ts from the given last (Pass B emit-on-WROTE). */
export function writeDigestCadenceTs(deskRoot: string, last: DigestLast) {
  const path = digestCadenceTsPath(deskRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderDigestCadenceTs(last), "utf8");
  return path;
}

export type SyncCadenceResult =
  | { status: "wrote"; last: DigestLast; path: string }
  | { status: "soft"; reason: string };

/**
 * Mirror disk digest-last.json → digest-cadence.ts.
 * Soft-fail if missing/unreadable: keep last committed module, do not invent timestamps.
 */
export function syncDigestCadenceFromDisk(deskRoot: string): SyncCadenceResult {
  const last = readDigestLast(deskRoot);
  if (!last) {
    return { status: "soft", reason: "missing or unreadable digest-last.json" };
  }
  const path = writeDigestCadenceTs(deskRoot, last);
  return { status: "wrote", last, path };
}

/** Parse DIGEST_CADENCE fields from the committed TS module (for coherence). */
export function readDigestCadenceModule(deskRoot: string): DigestLast | null {
  const path = digestCadenceTsPath(deskRoot);
  if (!existsSync(path)) return null;
  try {
    const src = readFileSync(path, "utf8");
    const last_at = src.match(/"last_at":\s*"([^"]+)"/)?.[1];
    const next_at = src.match(/"next_at":\s*"([^"]+)"/)?.[1];
    const pack_id = src.match(/"pack_id":\s*"([^"]+)"/)?.[1];
    if (!last_at || !next_at) return null;
    return { last_at, next_at, pack_id: pack_id ?? "" };
  } catch {
    return null;
  }
}

/**
 * Pass B coherence: module last_at must equal disk; pack_id must equal newest pack when packs exist.
 * Returns list of failure strings (empty = ok). Soft: missing disk → no hard fail (caller may soft-meter).
 */
export function digestCadenceCoherenceFails(deskRoot: string): string[] {
  const fails: string[] = [];
  const disk = readDigestLast(deskRoot);
  const mod = readDigestCadenceModule(deskRoot);
  if (!disk) {
    // Soft-fail path — do not invent; no hard gate when disk missing.
    return fails;
  }
  if (!mod) {
    fails.push("DIGEST_CADENCE module missing while digest-last.json present");
    return fails;
  }
  if (mod.last_at !== disk.last_at) {
    fails.push(`DIGEST_CADENCE.last_at ${mod.last_at} ≠ digest-last.json.last_at ${disk.last_at}`);
  }
  if (mod.next_at !== disk.next_at) {
    fails.push(`DIGEST_CADENCE.next_at ${mod.next_at} ≠ digest-last.json.next_at ${disk.next_at}`);
  }
  if (mod.pack_id !== disk.pack_id) {
    fails.push(`DIGEST_CADENCE.pack_id ${mod.pack_id} ≠ digest-last.json.pack_id ${disk.pack_id}`);
  }
  const newest = newestPackStamp(deskRoot);
  if (newest && disk.pack_id && disk.pack_id !== newest) {
    fails.push(`digest-last pack_id ${disk.pack_id} ≠ newest pack ${newest}`);
  }
  if (newest && mod.pack_id && mod.pack_id !== newest) {
    fails.push(`DIGEST_CADENCE.pack_id ${mod.pack_id} ≠ newest pack ${newest}`);
  }
  return fails;
}
