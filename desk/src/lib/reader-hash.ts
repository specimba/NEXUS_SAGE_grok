/**
 * PASS-Q1 §2 — reader_hash: sha256 over the generated reader data (src/data/*) with stamp-only fields stripped,
 * so a crawl whose only change is CRAWL_AT / pack / build / capture stamps / timings hashes equal and skips publish.
 * Pure (no fs) so tests can feed fixtures; scripts/reader-hash.ts walks the files.
 */
import { createHash } from "node:crypto";

/** Generated modules that don't feed the page, or are pure stamps. */
export const READER_HASH_SKIP = new Set(["build-stamp.ts"]);

const STAMP_KEY =
  /\b([A-Z][A-Z0-9_]*_AT|PACK_AT|pack_id|last_at|next_at|captured_at|stamped_at|checked_at|published_at|fetched_at|crawled_at|crawl_at|compiled_at|generated_at|built_at|build_[a-z_]+|[a-z_]*_ms|ms|duration|elapsed|wall_ms|sources_ms)("?\s*[:=]\s*)("[^"]*"|-?[\d.]+(?:e[+-]?\d+)?)/g;
const TIMING = /\b\d+(?:\.\d+)?\s?(?:ms|s)\b/g;

/** Strip stamp fields from one module's text. `crawlAt` (if given) is also blanked wherever it appears verbatim. */
export function stripStamps(src: string, crawlAt?: string | null): string {
  let s = src.replace(STAMP_KEY, (_m, k: string, sep: string) => `${k}${sep}"·"`);
  if (crawlAt) s = s.split(crawlAt).join("·");
  return s.replace(TIMING, "·t");
}

/** files: name → text. Sorted by name so order never matters. */
export function readerHash(files: Record<string, string>, crawlAt?: string | null): string {
  const h = createHash("sha256");
  for (const name of Object.keys(files).sort()) {
    if (READER_HASH_SKIP.has(name)) continue;
    h.update(name).update("\0").update(stripStamps(files[name], crawlAt)).update("\0");
  }
  return h.digest("hex");
}
