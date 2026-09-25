/**
 * SAGE hard gate — shared by scripts/check-current.mjs (predev/prebuild/prestart) and next.config.ts
 * (build-time CURRENT lock → inlined env; the page never reads the filesystem at request time).
 *
 * Repo-only: resolves everything relative to the desk root (or SAGE_CURRENT_PATH). No box paths,
 * no dual-home dirs, no .env. Fails CLOSED when the committed data is missing, unreadable,
 * inconsistent, or stale.
 *
 *   - CURRENT.json exists, parses, has a cycle id and a parseable crawled_at
 *   - crawled_at is not in the future (>10 min skew) and not older than SAGE_MAX_DATA_AGE_H (default 72h)
 *   - crawled_at === PULSE_CLUSTERS_AT in src/data/pulse-clusters.ts (lock and data from the same crawl)
 *   - the generated data modules the page imports are present
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DEFAULT_MAX_DATA_AGE_H = 72;
export const REQUIRED_DATA = [
  "src/data/pulse-clusters.ts",
  "src/data/lead-pick.ts",
  "src/data/wire.ts",
  "src/data/topic-heat.ts",
  "src/data/corroboration-rank.ts",
];

export function currentPathFor(deskRoot, env = process.env) {
  return env.SAGE_CURRENT_PATH ? resolve(env.SAGE_CURRENT_PATH) : resolve(deskRoot, "artifacts/sage/CURRENT.json");
}

/** @returns {{ ok: boolean, path: string, lock: any, errors: string[], ageH: number | null }} */
export function checkCurrent({ deskRoot, env = process.env, now = Date.now() }) {
  const path = currentPathFor(deskRoot, env);
  const errors = [];
  let lock = null;
  let ageH = null;
  if (!existsSync(path)) {
    return { ok: false, path, lock, ageH, errors: [`missing CURRENT.json at ${path}`] };
  }
  try {
    lock = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { ok: false, path, lock: null, ageH, errors: [`cannot read/parse CURRENT.json at ${path}`] };
  }
  if (!lock || typeof lock.id !== "string" || !lock.id) errors.push(`CURRENT.json at ${path} has no cycle id`);
  const crawled = Date.parse(lock?.crawled_at ?? "");
  if (!Number.isFinite(crawled)) {
    errors.push(`CURRENT.json crawled_at missing/unparseable (${lock?.crawled_at ?? "—"})`);
  } else {
    ageH = (now - crawled) / 3_600_000;
    const maxH = Number(env.SAGE_MAX_DATA_AGE_H) > 0 ? Number(env.SAGE_MAX_DATA_AGE_H) : DEFAULT_MAX_DATA_AGE_H;
    if (ageH < -10 / 60) errors.push(`crawled_at ${lock.crawled_at} is in the future`);
    if (ageH > maxH) errors.push(`data stale: crawled_at ${lock.crawled_at} is ${ageH.toFixed(1)}h old (> ${maxH}h, SAGE_MAX_DATA_AGE_H)`);
  }
  for (const rel of REQUIRED_DATA) {
    if (!existsSync(resolve(deskRoot, rel))) errors.push(`missing generated data ${rel}`);
  }
  const pulsePath = resolve(deskRoot, "src/data/pulse-clusters.ts");
  if (existsSync(pulsePath) && Number.isFinite(crawled)) {
    const at = readFileSync(pulsePath, "utf8").match(/PULSE_CLUSTERS_AT\s*=\s*"([^"]+)"/)?.[1];
    if (!at) errors.push("src/data/pulse-clusters.ts has no PULSE_CLUSTERS_AT");
    else if (at !== lock.crawled_at) errors.push(`CURRENT.crawled_at ${lock.crawled_at} ≠ PULSE_CLUSTERS_AT ${at} (lock and data from different crawls)`);
  }
  return { ok: errors.length === 0, path, lock, ageH, errors };
}
