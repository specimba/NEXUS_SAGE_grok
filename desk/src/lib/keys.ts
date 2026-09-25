/**
 * Beat 9 — keyboard control (refs/UX-BEAT8-9-DRAWER-KEYS.md). Pure key → action resolver.
 * Reviewer gate: never act with Ctrl / Cmd (Meta) / Alt held (browser owns Ctrl+1, Cmd+1, Alt+←…);
 * never act while typing in input / textarea / select / contenteditable — except Esc in the filter
 * prompt; ignore IME composition. Shift only where the character itself needs it.
 */
import { LANES, type Lane } from "@/lib/lanes";

export type KeyLike = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
};

export type KeyCtx = {
  /** Focus is in input / textarea / select / contenteditable. */
  typing?: boolean;
  /** Focus is the `/` filter prompt input. */
  inFilter?: boolean;
  /** Focus is on something that activates itself on Enter (row button, link, button). */
  targetActivates?: boolean;
  keymapOpen?: boolean;
  /** A lone `g` was pressed just before (for `g g`). */
  pendingG?: boolean;
};

export type KeyAction =
  | { t: "lane"; lane: Lane }
  | { t: "next" }
  | { t: "prev" }
  | { t: "first" }
  | { t: "last" }
  | { t: "g" }
  | { t: "enter" }
  | { t: "open" }
  | { t: "escape" }
  | { t: "filter" }
  | { t: "since" }
  | { t: "keymap" };

/**
 * Characters that need Shift to be typed at all: `?` and `G` (spec), and `/` because on the
 * Turkish Q layout it is Shift+7. Everything else with Shift held is ignored (Shift+Enter, Shift+1…).
 */
export const SHIFT_OK = new Set(["?", "G", "/"]);

export type TargetLike = { tagName?: string; isContentEditable?: boolean } | null | undefined;

export function isTypingTarget(el: TargetLike): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName ?? "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function resolveKey(e: KeyLike, ctx: KeyCtx = {}): KeyAction | null {
  if (e.isComposing) return null;
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (ctx.typing) return e.key === "Escape" && ctx.inFilter && !e.shiftKey ? { t: "escape" } : null;
  if (e.shiftKey && !SHIFT_OK.has(e.key)) return null;
  if (ctx.keymapOpen) {
    if (e.key === "?") return { t: "keymap" };
    if (e.key === "Escape") return { t: "escape" };
    return null;
  }
  if (/^[1-6]$/.test(e.key)) return { t: "lane", lane: LANES[Number(e.key) - 1]! };
  switch (e.key) {
    case "j":
      return { t: "next" };
    case "k":
      return { t: "prev" };
    case "g":
      return ctx.pendingG ? { t: "first" } : { t: "g" };
    case "G":
      return { t: "last" };
    case "Enter":
      return ctx.targetActivates ? null : { t: "enter" };
    case "o":
      return { t: "open" };
    case "Escape":
      return { t: "escape" };
    case "/":
      return { t: "filter" };
    case "u":
      return { t: "since" };
    case "?":
      return { t: "keymap" };
    default:
      return null;
  }
}

/** Clamp a selection step inside [0, n-1]; -1 = nothing selected yet. */
export function stepSelection(cur: number, n: number, dir: 1 | -1): number {
  if (n <= 0) return -1;
  if (cur < 0) return dir === 1 ? 0 : n - 1;
  return Math.max(0, Math.min(n - 1, cur + dir));
}

/** Case-insensitive substring match over any of the given fields (headline / source / lab). */
export function matchesFilter(q: string, fields: ReadonlyArray<string | null | undefined>): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(needle));
}

export const KEY_MAP: ReadonlyArray<readonly [string, string]> = [
  ["1–6", "switch lane"],
  ["j / k", "next / previous row"],
  ["Enter", "open drawer · expand row"],
  ["o", "open lead link"],
  ["Esc", "close drawer / filter / key map"],
  ["/", "filter rows"],
  ["?", "toggle this key map"],
  ["g g / G", "first / last row"],
  ["u", "jump to first row since your last visit"],
];
