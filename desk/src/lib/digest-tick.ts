/**
 * Digest cadence tick — due check · rebuild · write packs · update digest-last.
 * Disk truth under artifacts/sage/ (not browser localStorage).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CADENCE_MS, isDigestDue, type DigestLast } from "@/lib/digest-pack";
import {
  packStamp,
  readDigestLast,
  writeDigestLast,
  writeDigestPackFiles,
} from "@/lib/digest-pack-disk";
import { refreshDigest } from "@/lib/digest-refresh";

export type TickResult =
  | {
      status: "HOLD";
      next_at: string;
      last: DigestLast | null;
    }
  | {
      status: "WROTE";
      pack_id: string;
      last_at: string;
      next_at: string;
      paths: {
        packJsonPath: string;
        packMdPath: string;
        cycleJsonPath: string;
        cycleMdPath: string;
      };
      cycleId: string;
      leadId: string;
    };

export function readCurrentCycle(deskRoot: string): { id: string } {
  const path = resolve(deskRoot, "artifacts/sage/CURRENT.json");
  if (!existsSync(path)) {
    return { id: "003" };
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as { id?: string };
    const id = String(data.id ?? "003");
    if (id !== "003") {
      throw new Error(`CURRENT.json cycle ${id} — digest tick refuses non-003 (no cycle 004)`);
    }
    return { id };
  } catch (err) {
    if (err instanceof Error && /refuses non-003/.test(err.message)) throw err;
    return { id: "003" };
  }
}

export function runDigestTick(opts: {
  deskRoot: string;
  now?: number;
  /** Ignore next_at and rebuild (tests / first force). */
  force?: boolean;
}): TickResult {
  const now = opts.now ?? Date.now();
  const deskRoot = opts.deskRoot;
  const last = readDigestLast(deskRoot);
  const due = isDigestDue(last, now);

  if (!opts.force && !due.due) {
    return { status: "HOLD", next_at: due.nextAt, last };
  }

  const current = readCurrentCycle(deskRoot);
  const refreshed = refreshDigest({
    now,
    deskRoot,
    cycleId: current.id,
    leadId: "hf-incident",
  });

  const packId = packStamp(now);
  const paths = writeDigestPackFiles(deskRoot, {
    cycleId: refreshed.cycleId,
    leadId: refreshed.leadId,
    at: refreshed.at,
    source: refreshed.source,
    items: refreshed.items,
    dropped: refreshed.dropped,
    packId,
  });

  const nextAt = new Date(now + CADENCE_MS).toISOString();
  const last_at = refreshed.at;
  const digestLast: DigestLast = {
    last_at,
    next_at: nextAt,
    pack_id: packId,
  };
  writeDigestLast(deskRoot, digestLast);

  return {
    status: "WROTE",
    pack_id: packId,
    last_at,
    next_at: nextAt,
    paths,
    cycleId: refreshed.cycleId,
    leadId: refreshed.leadId,
  };
}
