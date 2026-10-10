// Pass A2 — Sep cycle-003 archive payload, loaded ONLY via dynamic import() (archive fold open / ops downloads).
// Keeps the full Sep digest pack + report renderer out of the First Load chunk. Next handles basePath for the chunk.
import { DIGEST_ITEMS, DROPPED } from "@/data/digest-pack";
import { WAVE_TIMELINE } from "@/data/cycle";
import { renderPlan, renderReport } from "@/lib/digest-pack";
import { archiveRowsFromCycle } from "@/lib/digest-unlock";

export { DIGEST_ITEMS, DROPPED, WAVE_TIMELINE, renderPlan, renderReport };
export const archiveFoldRows = () => archiveRowsFromCycle();
