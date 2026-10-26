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

export const RELEASES_ATOM_AT: string | null = "2026-10-26T20:46:09Z";

export const RELEASES_ATOM: ReleaseAtomRow[] = [
  { id: "rel:hf-nvidia:nvidia/MotionBricks", feed: "hf-nvidia" as const, title: "nvidia/MotionBricks", link: "https://huggingface.co/nvidia/MotionBricks", published: "2026-10-23T18:49:27Z", tag: "MotionBricks", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-nvidia:nvidia/MotionBricks" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF", published: "2026-10-22T07:44:57Z", tag: "Hy-SimulMT-30B-A3B-Interleave-GGUF", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-FP8", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B-Interleave-FP8", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B-Interleave-FP8", published: "2026-10-22T07:44:47Z", tag: "Hy-SimulMT-30B-A3B-Interleave-FP8", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B-Interleave", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B-Interleave", published: "2026-10-22T07:44:33Z", tag: "Hy-SimulMT-30B-A3B-Interleave", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-GGUF", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B-GGUF", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B-GGUF", published: "2026-10-22T07:29:49Z", tag: "Hy-SimulMT-30B-A3B-GGUF", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-FP8", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B-FP8", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B-FP8", published: "2026-10-22T07:29:37Z", tag: "Hy-SimulMT-30B-A3B-FP8", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
  { id: "rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B", feed: "hf-tencent" as const, title: "tencent/Hy-SimulMT-30B-A3B", link: "https://huggingface.co/tencent/Hy-SimulMT-30B-A3B", published: "2026-10-22T07:29:17Z", tag: "Hy-SimulMT-30B-A3B", emitted_at: "2026-10-26T20:46:15Z", source: "releases-atom" as const, first_seen: "2026-10-26T20:46:09Z", is_new: true, cluster_id: "cl:rel:hf-tencent:tencent/Hy-SimulMT-30B-A3B-Interleave-GGUF" },
];
