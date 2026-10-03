/**
 * Test-only scratch dirs. Every cache / tmp write a test makes lands under one mkdtemp(os.tmpdir()) root,
 * never in artifacts/sage/ (the live crawl's data folder) or any other tracked dir.
 * The root is removed after the whole run by the global afterAll in ./setup.ts (bunfig.toml [test] preload).
 */
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let root: string | null = null;
let seq = 0;

function tmpRoot(): string {
  if (!root) root = mkdtempSync(join(tmpdir(), "sage-test-"));
  return root;
}

/** Fresh, not-yet-created path under the per-run temp root (the code under test mkdirs it on write). */
export function tmpCache(label = "cache"): string {
  return join(tmpRoot(), `${label}-${++seq}`);
}

/** Like tmpCache, but the directory exists. */
export function tmpDir(label = "dir"): string {
  const d = tmpCache(label);
  mkdirSync(d, { recursive: true });
  return d;
}

/** Fetch options for the paced sources: no real throttle sleep, private cache dir. Spread first; explicit keys win. */
export function fast(): { minIntervalMs: 0; cacheDir: string } {
  return { minIntervalMs: 0, cacheDir: tmpCache("fast") };
}

export function cleanupTmp(): void {
  if (root) rmSync(root, { recursive: true, force: true });
  root = null;
}
