/**
 * Server-only boot / build stamps for operator health chip.
 * Module load stamps SERVER_STARTED_AT once per next-server process.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** ISO when this server process first loaded this module (stale process → old stamp). */
export const SERVER_STARTED_AT = new Date().toISOString();

export function readBuildId(): string {
  const path = resolve(process.cwd(), ".next/BUILD_ID");
  if (!existsSync(path)) return "dev";
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw || "unknown";
  } catch {
    return "unknown";
  }
}

/** Short form for footer (full id still on data-sage-build). */
export function shortBuildId(id: string, len = 12): string {
  if (!id || id === "dev" || id === "unknown") return id;
  return id.length <= len ? id : id.slice(0, len);
}
