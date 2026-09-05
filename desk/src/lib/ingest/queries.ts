/**
 * Watchlist query builders — per-handle (weight ≥ 3) + six class semantic queries.
 * Standing search must not include incident nouns.
 * Free-provider lock: no live api.x.com / X_BEARER_TOKEN (curation plan only).
 */

import { ingestHandles, type WatchHandle } from "@/data/x-watchlist";

/** Six standing classes (product lock). `memory` is a tag seed only — not a standing class. */
export const SEMANTIC_CLASSES = [
  "agents",
  "safety",
  "openweights",
  "papers",
  "cyber",
  "capital",
] as const;

export type SemanticClass = (typeof SEMANTIC_CLASSES)[number];

/** Nouns banned from standing semantic queries (incident file stays cycle-locked). */
export const INCIDENT_NOUNS = [
  "artifactory",
  "production rce",
  "hf swarm",
  "cluster-admin",
  "eval board",
  "persistent-sol",
  "metr wave",
] as const;

export function sinceDay(now = new Date()): string {
  const d = new Date(now.getTime() - 24 * 3_600_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Per-handle recent search — weight ≥ 3 by default. Plan-only (no live X fetch). */
export function handleSearchQuery(handle: string, since: string): string {
  const h = handle.replace(/^@/, "");
  return `from:${h} -filter:replies since:${since}`;
}

export function buildHandleQueries(
  minWeight = 3,
  since = sinceDay(),
  handles: WatchHandle[] = ingestHandles(minWeight),
): { handle: string; weight: number; query: string }[] {
  return handles.map((w) => ({
    handle: w.handle,
    weight: w.weight,
    query: handleSearchQuery(w.handle, since),
  }));
}

/**
 * Six class semantic queries without incident nouns.
 * Classes are positive filters only — incident nouns are asserted absent.
 */
export function buildSemanticQueries(
  since = sinceDay(),
  classes: readonly SemanticClass[] = SEMANTIC_CLASSES,
): { class: SemanticClass; query: string }[] {
  return classes.map((c) => {
    const query = `(${c}) -filter:replies since:${since}`;
    assertNoIncidentNouns(query);
    return { class: c, query };
  });
}

export function assertNoIncidentNouns(query: string): void {
  const q = query.toLowerCase();
  for (const n of INCIDENT_NOUNS) {
    if (q.includes(n.toLowerCase())) {
      throw new Error(`standing search must not include incident noun: ${n}`);
    }
  }
}

/**
 * Free-provider lock (Canberk): no paid X / Zapier / social listening.
 * Watchlist queries remain plan-only curation. See refs/FREE-PROVIDERS.md.
 */
export function xIngestEnv(): {
  bearer: string | null;
  ready: boolean;
  docs: string;
} {
  return {
    bearer: null,
    ready: false,
    docs:
      "Free providers only — no X_BEARER_TOKEN / api.x.com / Zapier. " +
      "Watchlist is curation (buildHandleQueries + SEMANTIC_CLASSES plan-only). " +
      "Live ingest: HF daily_papers + arXiv Atom enrich + HN Algolia Pulse + lab RSS + security RSS + GitHub unauth shelf + toolkit shelf. See refs/FREE-PROVIDERS.md.",
  };
}
