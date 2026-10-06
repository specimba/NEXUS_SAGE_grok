/**
 * Pass E — X-session taste disk ↔ module mirror (Node/Bun only; not imported by browser UI).
 * Disk `artifacts/sage/x-taste-last.json` is truth after a successful capture WROTE.
 * Soft-fail: login_wall / skipped / empty / missing → keep last honest module, never invent cards.
 * Stale: captured_at older than 14d → soft meter `taste stale` without inventing items.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { XTasteItem, XTasteSnap } from "@/data/x-taste";
import {
  TASTE_STALE_MS,
  TASTE_VISIBLE_CAP,
  tasteIsStale,
  tasteSoftMeter,
} from "@/lib/x-taste-meter";

export { TASTE_STALE_MS, TASTE_VISIBLE_CAP, tasteIsStale, tasteSoftMeter };

export type XTasteDiskItem = {
  id?: string;
  url?: string;
  author?: string;
  handle?: string;
  text: string;
  surface: "bookmark" | "like" | "feed";
  at?: string;
  keyword?: string;
};

export type XTasteDisk = {
  schema?: number;
  captured_at: string;
  stamped_at?: string;
  source?: string;
  run?: number;
  briefEligible: false;
  pulseLeadEligible: false;
  paidApi: false;
  items: XTasteDiskItem[];
  skipped: boolean;
  soft_fail?: boolean;
  soft_fail_reason?: string | null;
  land?: string;
  counts?: { seen: number; kept: number; surfaces?: Record<string, number>; filtered?: number };
  session_alive?: boolean;
};

export function tasteSageDir(deskRoot: string) {
  return resolve(deskRoot, "artifacts/sage");
}

export function xTasteLastPath(deskRoot: string) {
  return join(tasteSageDir(deskRoot), "x-taste-last.json");
}

export function xTasteTsPath(deskRoot: string) {
  return resolve(deskRoot, "src/data/x-taste.ts");
}



function statusIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/status\/(\d+)/);
  return m?.[1] ?? null;
}

function handleFromAuthor(author: string | undefined, handle: string | undefined): string | undefined {
  if (handle) return handle.replace(/^@/, "");
  if (author) return author.replace(/^@/, "");
  return undefined;
}

export function normalizeTasteItem(raw: XTasteDiskItem): XTasteItem | null {
  const surface = raw.surface;
  if (surface !== "bookmark" && surface !== "like" && surface !== "feed") return null;
  const text = String(raw.text ?? "").trim();
  if (!text) return null;
  const handle = handleFromAuthor(raw.author, raw.handle);
  const id = String(raw.id ?? statusIdFromUrl(raw.url) ?? "").trim();
  if (!id) return null;
  const item: XTasteItem = { id, text, surface };
  if (raw.url) item.url = raw.url;
  if (handle) item.handle = handle;
  if (raw.at) item.at = raw.at;
  if (raw.keyword) item.keyword = raw.keyword;
  return item;
}

/** Normalize disk JSON → commit-time snap with type locks. Never invents items on skip. */
export function diskToSnap(disk: XTasteDisk): XTasteSnap {
  const skipped = Boolean(disk.skipped);
  const soft_fail = Boolean(disk.soft_fail) || skipped;
  const soft_fail_reason =
    disk.soft_fail_reason != null && disk.soft_fail_reason !== ""
      ? String(disk.soft_fail_reason)
      : soft_fail
        ? "skipped"
        : null;
  const items = skipped ? [] : disk.items.map(normalizeTasteItem).filter((x): x is XTasteItem => !!x);
  const seen = disk.counts?.seen ?? items.length;
  const kept = disk.counts?.kept ?? items.length;
  return {
    captured_at: String(disk.captured_at),
    stamped_at: disk.stamped_at ? String(disk.stamped_at) : String(disk.captured_at),
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
    items,
    skipped,
    soft_fail,
    soft_fail_reason,
    land: String(disk.land ?? (skipped || soft_fail ? "SOFT" : "GO")),
    counts: { seen, kept },
  };
}

export function readXTasteLast(deskRoot: string): XTasteDisk | null {
  const path = xTasteLastPath(deskRoot);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as XTasteDisk;
    if (!raw?.captured_at) return null;
    // Force type locks even if a hand-edit drifted.
    return {
      ...raw,
      briefEligible: false,
      pulseLeadEligible: false,
      paidApi: false,
      items: Array.isArray(raw.items) ? raw.items : [],
      skipped: Boolean(raw.skipped),
    };
  } catch {
    return null;
  }
}

export function writeXTasteLast(deskRoot: string, disk: XTasteDisk) {
  const path = xTasteLastPath(deskRoot);
  mkdirSync(dirname(path), { recursive: true });
  const body: XTasteDisk = {
    schema: disk.schema ?? 1,
    captured_at: disk.captured_at,
    source: disk.source ?? "x-session-readonly",
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
    items: disk.skipped ? [] : disk.items,
    skipped: Boolean(disk.skipped),
    soft_fail: Boolean(disk.soft_fail) || Boolean(disk.skipped),
    soft_fail_reason: disk.soft_fail_reason ?? null,
    counts: disk.counts ?? { seen: 0, kept: 0 },
    session_alive: disk.session_alive ?? false,
  };
  if (disk.stamped_at) body.stamped_at = disk.stamped_at;
  if (disk.run != null) body.run = disk.run;
  if (disk.land) body.land = disk.land;
  writeFileSync(path, JSON.stringify(body, null, 2) + "\n", "utf8");
  return path;
}

function jsString(v: string) {
  return JSON.stringify(v);
}

function renderItem(it: XTasteItem): string {
  const lines = [
    `    {`,
    `      "id": ${jsString(it.id)},`,
    `      "text": ${jsString(it.text)},`,
    `      "surface": ${jsString(it.surface)},`,
  ];
  if (it.url) lines.push(`      "url": ${jsString(it.url)},`);
  if (it.handle) lines.push(`      "handle": ${jsString(it.handle)},`);
  if (it.at) lines.push(`      "at": ${jsString(it.at)},`);
  if (it.keyword) lines.push(`      "keyword": ${jsString(it.keyword)},`);
  lines.push(`    }`);
  return lines.join("\n");
}

/** Render src/data/x-taste.ts — type locks always false. */
export function renderXTasteTs(snap: XTasteSnap): string {
  const itemsBody = snap.items.length ? snap.items.map(renderItem).join(",\n") : "";
  return (
    `/** Snapshot of artifacts/sage/x-taste-last.json — X-session taste shelf. Pulse only; never Brief lead. */\n` +
    `export type XTasteItem = {\n` +
    `  id: string;\n` +
    `  text: string;\n` +
    `  url?: string;\n` +
    `  handle?: string;\n` +
    `  surface: "bookmark" | "like" | "feed";\n` +
    `  at?: string;\n` +
    `  keyword?: string;\n` +
    `};\n` +
    `\n` +
    `export type XTasteSnap = {\n` +
    `  captured_at: string;\n` +
    `  stamped_at?: string;\n` +
    `  briefEligible: false;\n` +
    `  pulseLeadEligible: false;\n` +
    `  paidApi: false;\n` +
    `  items: XTasteItem[];\n` +
    `  skipped: boolean;\n` +
    `  soft_fail: boolean;\n` +
    `  soft_fail_reason: string | null;\n` +
    `  land: string;\n` +
    `  counts: { seen: number; kept: number };\n` +
    `};\n` +
    `\n` +
    `export const X_TASTE: XTasteSnap = {\n` +
    `  "captured_at": ${jsString(snap.captured_at)},\n` +
    `  "briefEligible": false,\n` +
    `  "pulseLeadEligible": false,\n` +
    `  "paidApi": false,\n` +
    `  "items": [\n` +
    (itemsBody ? itemsBody + "\n" : "") +
    `  ],\n` +
    `  "skipped": ${snap.skipped ? "true" : "false"},\n` +
    `  "soft_fail": ${snap.soft_fail ? "true" : "false"},\n` +
    `  "soft_fail_reason": ${snap.soft_fail_reason == null ? "null" : jsString(snap.soft_fail_reason)},\n` +
    `  "land": ${jsString(snap.land)},\n` +
    `  "counts": {\n` +
    `    "seen": ${snap.counts.seen},\n` +
    `    "kept": ${snap.counts.kept}\n` +
    `  },\n` +
    `  "stamped_at": ${jsString(snap.stamped_at ?? snap.captured_at)}\n` +
    `} as const;\n`
  );
}

export function writeXTasteTs(deskRoot: string, snap: XTasteSnap) {
  const path = xTasteTsPath(deskRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderXTasteTs(snap), "utf8");
  return path;
}

export type SyncTasteResult =
  | { status: "wrote"; snap: XTasteSnap; path: string }
  | { status: "soft"; reason: string };

/**
 * Mirror disk x-taste-last.json → x-taste.ts.
 * Soft-fail if missing/unreadable: keep last committed module, do not invent cards.
 */
export function syncXTasteFromDisk(deskRoot: string): SyncTasteResult {
  const disk = readXTasteLast(deskRoot);
  if (!disk) {
    return { status: "soft", reason: "missing or unreadable x-taste-last.json" };
  }
  const snap = diskToSnap(disk);
  const path = writeXTasteTs(deskRoot, snap);
  return { status: "wrote", snap, path };
}

/**
 * Successful taste capture WROTE: write disk + mirror module (Pass E emit-on-WROTE).
 * Caller supplies honest capture; skipped/login_wall must set skipped + empty items (no invent).
 */
export function emitXTasteOnWrote(deskRoot: string, disk: XTasteDisk): { snap: XTasteSnap; diskPath: string; tsPath: string } {
  const locked: XTasteDisk = {
    ...disk,
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
  };
  const diskPath = writeXTasteLast(deskRoot, locked);
  const snap = diskToSnap(locked);
  const tsPath = writeXTasteTs(deskRoot, snap);
  return { snap, diskPath, tsPath };
}

/** Parse committed X_TASTE ids/counts/captured_at for coherence (no eval). */
export function readXTasteModule(deskRoot: string): {
  captured_at: string;
  ids: string[];
  kept: number;
  seen: number;
  briefEligible: boolean;
  pulseLeadEligible: boolean;
  paidApi: boolean;
  skipped: boolean;
} | null {
  const path = xTasteTsPath(deskRoot);
  if (!existsSync(path)) return null;
  try {
    const src = readFileSync(path, "utf8");
    const captured_at = src.match(/"captured_at":\s*"([^"]+)"/)?.[1];
    if (!captured_at) return null;
    const ids = [...src.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]!);
    const kept = Number(src.match(/"kept":\s*(\d+)/)?.[1] ?? NaN);
    const seen = Number(src.match(/"seen":\s*(\d+)/)?.[1] ?? NaN);
    const skipped = /"skipped":\s*true/.test(src);
    return {
      captured_at,
      ids,
      kept: Number.isFinite(kept) ? kept : ids.length,
      seen: Number.isFinite(seen) ? seen : ids.length,
      briefEligible: /"briefEligible":\s*true/.test(src),
      pulseLeadEligible: /"pulseLeadEligible":\s*true/.test(src),
      paidApi: /"paidApi":\s*true/.test(src),
      skipped,
    };
  } catch {
    return null;
  }
}

/**
 * Pass E coherence: after a successful capture, module ids/counts/captured_at must match disk.
 * Soft: missing disk → no hard fail. Type locks must stay false.
 */
export function xTasteCoherenceFails(deskRoot: string): string[] {
  const fails: string[] = [];
  const disk = readXTasteLast(deskRoot);
  const mod = readXTasteModule(deskRoot);
  if (!disk) return fails;
  if (!mod) {
    fails.push("X_TASTE module missing while x-taste-last.json present");
    return fails;
  }
  if (mod.briefEligible) fails.push("X_TASTE.briefEligible must be false");
  if (mod.pulseLeadEligible) fails.push("X_TASTE.pulseLeadEligible must be false");
  if (mod.paidApi) fails.push("X_TASTE.paidApi must be false");
  if (mod.captured_at !== disk.captured_at) {
    fails.push(`X_TASTE.captured_at ${mod.captured_at} ≠ disk ${disk.captured_at}`);
  }
  const snap = diskToSnap(disk);
  const diskIds = snap.items.map((i) => i.id);
  if (mod.ids.length !== diskIds.length || mod.ids.some((id, i) => id !== diskIds[i])) {
    fails.push(`X_TASTE ids [${mod.ids.join(",")}] ≠ disk [${diskIds.join(",")}]`);
  }
  if (mod.kept !== snap.counts.kept) {
    fails.push(`X_TASTE.counts.kept ${mod.kept} ≠ disk ${snap.counts.kept}`);
  }
  if (mod.skipped !== snap.skipped) {
    fails.push(`X_TASTE.skipped ${mod.skipped} ≠ disk ${snap.skipped}`);
  }
  return fails;
}
