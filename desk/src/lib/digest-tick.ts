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
  syncDigestCadenceFromDisk,
  writeDigestCadenceTs,
  writeDigestLast,
  writeDigestPackFiles,
} from "@/lib/digest-pack-disk";
import { refreshDigest } from "@/lib/digest-refresh";
import { DIGEST_UNLOCK } from "@/data/digest-unlock";
import { LEAD_HELD, LEAD_TODAY } from "@/data/lead-pick";
import { resolveUnlock, unlockToDigestItems } from "@/lib/digest-unlock";

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
    // Pass B: HOLD must not invent wall-clock stamps; may mirror disk → module if drifted.
    syncDigestCadenceFromDisk(deskRoot);
    return { status: "HOLD", next_at: due.nextAt, last };
  }

  const current = readCurrentCycle(deskRoot);
  const refreshed = refreshDigest({
    now,
    deskRoot,
    cycleId: current.id,
    leadId: "hf-incident",
  });

  // Pass A: pack carries unlocked titles (cycle label stays 003; archive baseline kept as drops).
  const unlockView = resolveUnlock({
    held: LEAD_HELD,
    today: LEAD_TODAY,
    lastGood: DIGEST_UNLOCK,
  });
  const unlockedItems = unlockToDigestItems(unlockView, refreshed.items);
  const packLeadId = unlockView.leadId ?? refreshed.leadId;

  const packId = packStamp(now);
  const paths = writeDigestPackFiles(deskRoot, {
    cycleId: refreshed.cycleId,
    leadId: packLeadId,
    at: refreshed.at,
    source: `${refreshed.source} · unlock:${unlockView.stamp}`,
    items: unlockedItems,
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
  // Pass B: commit-time mirror for static export — emit only on real WROTE.
  writeDigestCadenceTs(deskRoot, digestLast);

  return {
    status: "WROTE",
    pack_id: packId,
    last_at,
    next_at: nextAt,
    paths,
    cycleId: refreshed.cycleId,
    leadId: packLeadId,
  };
}
