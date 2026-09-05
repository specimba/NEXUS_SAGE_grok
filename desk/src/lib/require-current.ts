import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type CurrentLock = {
  schema: number;
  id: string;
  compiled_at?: string;
  crawled_at?: string;
  note?: string;
};

export class MissingCurrentError extends Error {
  readonly path: string;
  constructor(path: string, reason: string) {
    super(reason);
    this.name = "MissingCurrentError";
    this.path = path;
  }
}

export function currentPath(): string {
  return process.env.SAGE_CURRENT_PATH
    ? resolve(process.env.SAGE_CURRENT_PATH)
    : resolve(process.cwd(), "artifacts/sage/CURRENT.json");
}

/** Hard-refuse: throws if CURRENT.json is missing or invalid. No soft-fallback. */
export function requireCurrent(): CurrentLock {
  const path = currentPath();
  if (!existsSync(path)) {
    throw new MissingCurrentError(
      path,
      `SAGE HARD GATE: missing artifacts/sage/CURRENT.json at ${path}`,
    );
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as CurrentLock;
    if (!data?.id || typeof data.id !== "string") {
      throw new MissingCurrentError(path, `SAGE HARD GATE: CURRENT.json missing cycle id at ${path}`);
    }
    return data;
  } catch (err) {
    if (err instanceof MissingCurrentError) throw err;
    throw new MissingCurrentError(path, `SAGE HARD GATE: unreadable CURRENT.json at ${path}`);
  }
}
