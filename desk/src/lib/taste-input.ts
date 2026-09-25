/**
 * Taste input for ingest's URL scoring = the committed X-session taste snapshot (src/data/x-taste.ts).
 * Identical on the box and in a clean clone / cloud build: no filesystem reads, no box-only attachment.
 * Taste is Pulse-only (x-status lane); briefEligible/pulseLeadEligible stay false in the snapshot.
 * The toolkit shelf keeps coming from the committed src/data/shelf.ts (ingest's existing fallback).
 */
import { X_TASTE, type XTasteSnap } from "@/data/x-taste";

export function tasteUrls(snap: XTasteSnap = X_TASTE): string[] {
  const out: string[] = [];
  for (const i of snap.items) {
    const url = i.url ?? (i.handle && i.id ? `https://x.com/${i.handle}/status/${i.id}` : null);
    if (url && !out.includes(url)) out.push(url);
  }
  return out;
}
