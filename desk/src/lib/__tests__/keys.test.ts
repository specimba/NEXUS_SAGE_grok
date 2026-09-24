import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isTypingTarget, KEY_MAP, matchesFilter, resolveKey, SHIFT_OK, stepSelection } from "@/lib/keys";

const k = (key: string, mods: Partial<Record<"ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "isComposing", boolean>> = {}) => ({ key, ...mods });

describe("Beat 9 keys — bindings", () => {
  test("1–6 switch lanes in LANES order", () => {
    expect(resolveKey(k("1"))).toEqual({ t: "lane", lane: "brief" });
    expect(resolveKey(k("2"))).toEqual({ t: "lane", lane: "pulse" });
    expect(resolveKey(k("4"))).toEqual({ t: "lane", lane: "papers" });
    expect(resolveKey(k("6"))).toEqual({ t: "lane", lane: "governance" });
    expect(resolveKey(k("7"))).toBeNull();
    expect(resolveKey(k("0"))).toBeNull();
  });

  test("j/k, g g, G, Enter, o, Esc, /, ?", () => {
    expect(resolveKey(k("j"))).toEqual({ t: "next" });
    expect(resolveKey(k("k"))).toEqual({ t: "prev" });
    expect(resolveKey(k("g"))).toEqual({ t: "g" });
    expect(resolveKey(k("g"), { pendingG: true })).toEqual({ t: "first" });
    expect(resolveKey(k("G", { shiftKey: true }))).toEqual({ t: "last" });
    expect(resolveKey(k("Enter"))).toEqual({ t: "enter" });
    expect(resolveKey(k("o"))).toEqual({ t: "open" });
    expect(resolveKey(k("Escape"))).toEqual({ t: "escape" });
    expect(resolveKey(k("/"))).toEqual({ t: "filter" });
    expect(resolveKey(k("?", { shiftKey: true }))).toEqual({ t: "keymap" });
    expect(resolveKey(k("x"))).toBeNull();
  });

  test("Enter on an element that activates itself (row button, link) is left to that element", () => {
    expect(resolveKey(k("Enter"), { targetActivates: true })).toBeNull();
  });

  test("key map open: only ? and Esc act", () => {
    expect(resolveKey(k("?", { shiftKey: true }), { keymapOpen: true })).toEqual({ t: "keymap" });
    expect(resolveKey(k("Escape"), { keymapOpen: true })).toEqual({ t: "escape" });
    expect(resolveKey(k("2"), { keymapOpen: true })).toBeNull();
    expect(resolveKey(k("j"), { keymapOpen: true })).toBeNull();
  });
});

describe("Beat 9 keys — REVIEWER GATE: modifiers", () => {
  const keys = ["1", "2", "6", "j", "k", "g", "G", "Enter", "o", "Escape", "/", "?"];
  for (const mod of ["ctrlKey", "metaKey", "altKey"] as const) {
    test(`${mod} held ⇒ every desk key ignored (Ctrl+1 / Cmd+1 / Alt+1 stay with the browser)`, () => {
      for (const key of keys) expect(resolveKey(k(key, { [mod]: true }))).toBeNull();
      expect(resolveKey(k("1", { [mod]: true, shiftKey: true }))).toBeNull();
    });
  }
  test("Ctrl/Cmd/Alt ignored even in the filter prompt and with the key map open", () => {
    expect(resolveKey(k("Escape", { ctrlKey: true }), { typing: true, inFilter: true })).toBeNull();
    expect(resolveKey(k("?", { metaKey: true, shiftKey: true }), { keymapOpen: true })).toBeNull();
  });
  test("Shift only where the character needs it (?, G, / on TR layout)", () => {
    expect([...SHIFT_OK].sort()).toEqual(["/", "?", "G"]);
    expect(resolveKey(k("Enter", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("Escape", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("J", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("j", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("1", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("!", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("o", { shiftKey: true }))).toBeNull();
    expect(resolveKey(k("?", { shiftKey: true }))).toEqual({ t: "keymap" });
    expect(resolveKey(k("G", { shiftKey: true }))).toEqual({ t: "last" });
  });
  test("IME composition ignored", () => {
    expect(resolveKey(k("j", { isComposing: true }))).toBeNull();
    expect(resolveKey(k("Escape", { isComposing: true }), { typing: true, inFilter: true })).toBeNull();
  });
});

describe("Beat 9 keys — REVIEWER GATE: typing targets", () => {
  test("input / textarea / select / contenteditable are typing targets; buttons and rows are not", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
    expect(isTypingTarget({ tagName: "SELECT" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
  test("while typing every key is ignored — including Esc outside the filter prompt", () => {
    for (const key of ["1", "2", "j", "k", "g", "G", "Enter", "o", "/", "?", "Escape"])
      expect(resolveKey(k(key, { shiftKey: key === "?" || key === "G" }), { typing: true })).toBeNull();
  });
  test("Esc in the filter prompt clears it; other keys type normally", () => {
    expect(resolveKey(k("Escape"), { typing: true, inFilter: true })).toEqual({ t: "escape" });
    for (const key of ["1", "j", "/", "Enter"]) expect(resolveKey(k(key), { typing: true, inFilter: true })).toBeNull();
  });
});

describe("Beat 9 keys — helpers + wiring", () => {
  test("selection step clamps; first press selects the first/last row", () => {
    expect(stepSelection(-1, 5, 1)).toBe(0);
    expect(stepSelection(-1, 5, -1)).toBe(4);
    expect(stepSelection(0, 5, -1)).toBe(0);
    expect(stepSelection(4, 5, 1)).toBe(4);
    expect(stepSelection(2, 5, 1)).toBe(3);
    expect(stepSelection(0, 0, 1)).toBe(-1);
  });
  test("filter matches headline / source / lab substrings, case-insensitive", () => {
    expect(matchesFilter("anthropic", ["Claude discovers", "HN", "Anthropic"])).toBe(true);
    expect(matchesFilter("ENZYME", ["Claude discovers a novel enzyme"])).toBe(true);
    expect(matchesFilter("nvidia", ["Claude", null, undefined])).toBe(false);
    expect(matchesFilter("  ", ["x"])).toBe(true);
  });
  test("key map lists every binding", () => {
    expect(KEY_MAP.map(([key]) => key)).toEqual(["1–6", "j / k", "Enter", "o", "Esc", "/", "?", "g g / G"]);
  });
  test("exactly one global keydown listener, removed on unmount; drawer Esc does not double-fire", () => {
    const tsx = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(tsx.match(/addEventListener\(\s*"keydown"/g)?.length).toBe(1);
    expect(tsx.match(/removeEventListener\(\s*"keydown"/g)?.length).toBe(1);
    expect(tsx).toContain("e.stopPropagation(); // the desk's global Esc must not close twice");
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* Beat 9 — keyboard control"));
    expect(/#[0-9a-f]{3,8}\b/i.test(block)).toBe(false);
    const keymap = block.slice(block.indexOf(".desk-keymap-row dd"), block.indexOf(".desk-keycap"));
    expect(keymap).toContain("var(--muted-foreground)");
    expect(block).not.toMatch(/color:\s*var\(--muted\)/);
  });
});
