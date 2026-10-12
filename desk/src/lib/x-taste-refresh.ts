/**
 * PASS-C2 §3 — weekly box-only X taste refresh (Mon 09:17 TRT). Node/Bun only.
 *
 * The capture itself is one box agent turn that reads Canberk's ALREADY signed-in X session in the box browser
 * (bookmarks · likes · feed slice, read-only, WIRE-X-SESSION-TASTE.md rules) and saves the raw rows to a JSON
 * file. This module takes that file, applies the allowlist + caps, writes artifacts/sage/x-taste-last.json and
 * mirrors src/data/x-taste.ts (Pass E emit-on-WROTE). No X credentials, cookies or tokens are read or stored.
 *
 * Login wall / challenge → honest skip: the last honest shelf stays (never invented, never emptied), a skip stamp
 * is written, one short line for Grok Bot is returned, no retry loop. The `taste stale` meter (>14 d) stays the
 * honest fallback. CI (GitLab) never runs this: it only reads the committed snapshot.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isAiRelevantTitle } from "./ai-relevance";
import { loadSageConfig } from "./sage-config-disk";
import { emitXTasteOnWrote, type XTasteDiskItem } from "./x-taste-disk";
import { renderSageDeskConfigTs } from "./sage-setup";

export const TASTE_REFRESH_STAMP = "artifacts/sage/x-taste-refresh-last.json";
/** Rows kept per capture (Pass E dry-run kept 8; the shelf folds after visible_cap). */
export const TASTE_KEEP_MAX = 24;
const SECURITY_TERMS = /\b(security|cve-\d|exploit|vulnerab\w*|malware|jailbreak|prompt injection|red[- ]team\w*)\b/i;
const LOGIN_LINE = "X session needs login on the box";

export type RefreshInput =
  | { kind: "capture"; items: XTasteDiskItem[]; seen?: number }
  | { kind: "skip"; reason: string };

export type RefreshResult =
  | { status: "wrote"; captured_at: string; kept: number; seen: number; files: string[] }
  | { status: "skipped"; reason: string; notify: string | null; files: string[] }
  | { status: "refused"; reason: string; files: [] };

export function isCiEnv(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.CI || env.GITLAB_CI || env.GITHUB_ACTIONS);
}

export function keepTasteItem(it: XTasteDiskItem): boolean {
  const t = String(it?.text ?? "");
  if (!t.trim()) return false;
  if (it.surface !== "bookmark" && it.surface !== "like" && it.surface !== "feed") return false;
  if (it.url && !/^https:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/.test(it.url)) return false;
  return isAiRelevantTitle(t) || SECURITY_TERMS.test(t);
}

function isoNow(now: number) {
  return new Date(now).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function writeStamp(root: string, body: Record<string, unknown>): string {
  const p = resolve(root, TASTE_REFRESH_STAMP);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(body, null, 2)}\n`);
  return TASTE_REFRESH_STAMP;
}

export function refreshTaste(
  root: string,
  input: RefreshInput,
  opts: { now?: number; env?: Record<string, string | undefined>; pulseTitles?: readonly string[] } = {},
): RefreshResult {
  const now = opts.now ?? Date.now();
  if (isCiEnv(opts.env ?? process.env)) return { status: "refused", reason: "box-only (CI never runs the X taste refresh)", files: [] };
  const cfg = loadSageConfig(root, { write: false });
  const at = isoNow(now);
  if (!cfg.config.sources.x_taste.on) {
    return { status: "skipped", reason: "off (config)", notify: null, files: [writeStamp(root, { at, status: "skipped", reason: "off (config)" })] };
  }
  if (input.kind === "skip") {
    const reason = String(input.reason || "skipped").slice(0, 80);
    const login = /login|challenge|captcha|wall|locked|suspend/i.test(reason);
    return {
      status: "skipped",
      reason,
      notify: login ? LOGIN_LINE : null,
      files: [writeStamp(root, { at, status: "skipped", reason })],
    };
  }
  const raw = Array.isArray(input.items) ? input.items : [];
  const seen = input.seen ?? raw.length;
  const seenIds = new Set<string>();
  const kept: XTasteDiskItem[] = [];
  for (const it of raw) {
    if (!keepTasteItem(it)) continue;
    const id = String(it.id ?? it.url?.match(/status\/(\d+)/)?.[1] ?? "");
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    kept.push({ ...it, text: String(it.text).trim().slice(0, 280) });
    if (kept.length >= TASTE_KEEP_MAX) break;
  }
  if (!kept.length) {
    // Session alive but nothing on the allowlist: honest skip, keep last shelf.
    return { status: "skipped", reason: "empty after allowlist", notify: null, files: [writeStamp(root, { at, status: "skipped", reason: "empty after allowlist", seen })] };
  }
  const { snap } = emitXTasteOnWrote(root, {
    schema: 1,
    captured_at: at,
    stamped_at: at,
    source: "x-session-readonly",
    briefEligible: false,
    pulseLeadEligible: false,
    paidApi: false,
    items: kept,
    skipped: false,
    soft_fail: false,
    soft_fail_reason: null,
    land: "GO",
    counts: { seen, kept: kept.length },
    session_alive: true,
  });
  const stamp = writeStamp(root, { at, status: "wrote", kept: kept.length, seen });
  // New snapshot ⇒ re-emit the desk knob so taste.weight's index order points at the new items.
  const deskCfg = "src/data/sage-desk-config.ts";
  writeFileSync(resolve(root, deskCfg), renderSageDeskConfigTs(cfg, { items: snap.items, pulseTitles: opts.pulseTitles ?? [] }));
  return { status: "wrote", captured_at: at, kept: kept.length, seen, files: ["artifacts/sage/x-taste-last.json", "src/data/x-taste.ts", deskCfg, stamp] };
}

export function readCaptureFile(path: string): RefreshInput {
  if (!existsSync(path)) return { kind: "skip", reason: "capture file missing" };
  const j = JSON.parse(readFileSync(path, "utf8")) as { items?: XTasteDiskItem[]; seen?: number; skipped?: boolean; reason?: string };
  if (j.skipped) return { kind: "skip", reason: String(j.reason ?? "skipped") };
  return { kind: "capture", items: j.items ?? [], seen: j.seen };
}
