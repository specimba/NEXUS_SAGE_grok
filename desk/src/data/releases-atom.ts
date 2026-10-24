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

export const RELEASES_ATOM_AT: string | null = "2026-10-24T18:20:30Z";

export const RELEASES_ATOM: ReleaseAtomRow[] = [
  { id: "rel:hf-tencent:tencent/Hy-Nomas-Diffusers", feed: "hf-tencent" as const, title: "tencent/Hy-Nomas-Diffusers", link: "https://huggingface.co/tencent/Hy-Nomas-Diffusers", published: "2026-10-24T05:45:20Z", tag: "Hy-Nomas-Diffusers", emitted_at: "2026-10-24T08:20:32Z", source: "releases-atom" as const, first_seen: "2026-10-24T08:20:26Z", is_new: false, cluster_id: "cl:rel:hf-tencent:tencent/Hy-Nomas-Diffusers" },
];
