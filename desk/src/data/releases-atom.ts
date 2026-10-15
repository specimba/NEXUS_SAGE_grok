/** PASS-S1.3 release feeds Pulse (llama.cpp · Ollama · vLLM · Claude Code) — generated/refreshed by bun run ingest. Pulse only (REL); semver minor/major bumps only; never Wire/Brief; never a lead. */
export type ReleaseAtomRow = {
  id: string;
  feed: "llama.cpp" | "ollama" | "vllm" | "claude-code";
  title: string;
  link: string;
  published: string;
  tag: string;
  emitted_at: string;
  source: "releases-atom";
  /** Beat 2 seen-index: first crawl stamp this canonical URL appeared. */
  first_seen?: string;
  /** True when first_seen equals this crawl's stamp. */
  is_new?: boolean;
  /** Beat 2 dedupe: the Pulse cluster this row belongs to. */
  cluster_id?: string;
};

export const RELEASES_ATOM_AT: string | null = null;

export const RELEASES_ATOM: ReleaseAtomRow[] = [];
