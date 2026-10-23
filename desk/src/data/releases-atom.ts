/** PASS-S1.3 release feeds Pulse (llama.cpp · Ollama · vLLM · Claude Code) — generated/refreshed by bun run ingest. Pulse only (REL); semver minor/major bumps only; never Wire/Brief; never a lead. */
import type { ReleaseFeedId } from "@/lib/releases-atom";
export type ReleaseAtomRow = {
  id: string;
  feed: ReleaseFeedId;
  title: string;
  link: string;
  published: string;
  tag: string;
  emitted_at: string;
  source: "releases-atom";
  /** Beat 2 seen-index: first crawl stamp this canonical URL appeared. */
  first_seen?: string;
  /** Beat 2: first seen in the current crawl. */
  is_new?: boolean;
  /** Beat 2 cross-source dedupe cluster id (see pulse-clusters.ts). */
  cluster_id?: string;
};

export const RELEASES_ATOM_AT: string | null = "2026-10-23T22:52:03Z";

export const RELEASES_ATOM: ReleaseAtomRow[] = [
];
