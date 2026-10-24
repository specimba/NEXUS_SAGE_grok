import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SAGE_CONFIG_PATH } from "../sage-config";
import type { SageLimits } from "../sage-config-rules";
import {
  addTerm,
  committedBase,
  copyText,
  DRAFT_KEY,
  GITHUB_EDIT_URL,
  humanDiff,
  listVal,
  loadStored,
  removable,
  removeTerm,
  setTaste,
  setupRoute,
  srcVal,
  stepCap,
  storeText,
  tasteVal,
  toggleFeed,
  toggleOn,
  validateDraft,
} from "../setup-draft";
import { SAGE_SETUP } from "@/data/sage-setup";

const desk = resolve(import.meta.dir, "../../..");
const L = SAGE_SETUP.limits as SageLimits;
const FILE_RAW = readFileSync(resolve(desk, SAGE_CONFIG_PATH), "utf8");
/** Intel privacy: the page payload never carries keywords.gmail_senders (count only), so the editor's copy is the
 * committed file minus that list — the editor says so next to copy JSON. */
const FILE = (() => {
  const j = JSON.parse(FILE_RAW);
  delete j.keywords.gmail_senders;
  return JSON.stringify(j, null, 2) + "\n";
})();
const base = () => committedBase(SAGE_SETUP.config, L);
const HASH = SAGE_SETUP.file_hash as string;
const changedLines = (a: string, b: string) => {
  const A = a.split("\n");
  const B = b.split("\n");
  return { sameLen: A.length === B.length, n: A.filter((l, i) => l !== B[i]).length };
};

describe("PASS-C3 editor draft model (setup-draft.ts)", () => {
  test("4 no edits → copy JSON is byte-identical to desk/config/sage-sources.json", () => {
    expect(copyText(base(), L)).toBe(FILE);
    expect(humanDiff(base(), base(), L)).toEqual([]);
  });
  test("4 one toggle → exactly one changed line; human diff names it", () => {
    const d = toggleOn(base(), "gnews", L);
    const out = copyText(d, L)!;
    expect(changedLines(FILE, out)).toEqual({ sameLen: true, n: 1 });
    expect(humanDiff(base(), d, L)).toEqual(["gnews.on true→false"]);
  });
  test("2 ceilings: the gnews.cap stepper stops at the ceiling (and 1 at the bottom; timeout_s 3…15)", () => {
    let d = base();
    for (let i = 0; i < 100; i++) d = stepCap(d, "gnews", "cap", 1, L);
    expect(srcVal(d, "gnews", "cap", L)).toBe(L.ceilings.gnews!.cap);
    expect(validateDraft(d, L).ok).toBe(true);
    for (let i = 0; i < 200; i++) d = stepCap(d, "gnews", "cap", -1, L);
    expect(srcVal(d, "gnews", "cap", L)).toBe(1);
    let t = base();
    for (let i = 0; i < 30; i++) t = stepCap(t, "lab_rss", "timeout_s", -1, L);
    expect(srcVal(t, "lab_rss", "timeout_s", L)).toBe(3);
    for (let i = 0; i < 30; i++) t = stepCap(t, "lab_rss", "timeout_s", 1, L);
    expect(srcVal(t, "lab_rss", "timeout_s", L)).toBe(15);
  });
  test("3 box-only toggles never reach the output — even from a tampered localStorage draft", () => {
    expect(toggleOn(base(), "gmail", L)).toEqual(base());
    expect(stepCap(base(), "x_taste", "visible_cap", 1, L)).toEqual(base());
    const tampered = JSON.parse(JSON.stringify(base()));
    tampered.sources.gmail.on = false;
    tampered.sources.gmail.fetch_cap = 48;
    tampered.sources.x_taste = { on: false, visible_cap: 1 };
    tampered.sources.hn.cap = 21;
    const got = loadStored(storeText(tampered, HASH), HASH, base(), L)!;
    const diff = humanDiff(base(), got.draft, L);
    expect(diff).toEqual(["hn.cap 20→21"]);
    expect(diff.join(" ")).not.toMatch(/gmail|x_taste/);
    expect(copyText(got.draft, L)).not.toBeNull();
  });
  test("3 feeds: only wired ids toggle; re-adding keeps the committed order", () => {
    const off = toggleFeed(base(), "lab_rss", "deepmind", base(), L);
    expect(humanDiff(base(), off, L)).toEqual(['lab_rss.feeds -"deepmind"']);
    expect(toggleFeed(off, "lab_rss", "deepmind", base(), L)).toEqual(base());
    expect(toggleFeed(base(), "lab_rss", "anthropic", base(), L)).toEqual(base());
  });
  test("5 bad regex fine-(tun → error names the term; copy/open blocked", () => {
    const d = addTerm(base(), "ai_terms", "fine-(tun", L);
    const v = validateDraft(d, L);
    expect(v.ok).toBe(false);
    expect(!v.ok && v.errors.join(" ")).toContain('"fine-(tun"');
    expect(copyText(d, L)).toBeNull();
  });
  test("cartridges: add/remove, baseline lead terms have no × (removeTerm refuses), hn_sweep/gmail_seed free", () => {
    expect(removable("politics_deny", "maga", L)).toBe(false);
    expect(removable("ai_terms", "rag", L)).toBe(false);
    expect(removeTerm(base(), "politics_deny", "maga", L)).toEqual(base());
    const added = addTerm(base(), "politics_deny", "filibuster", L);
    expect(removable("politics_deny", "filibuster", L)).toBe(true);
    expect(removeTerm(added, "politics_deny", "filibuster", L)).toEqual(base());
    expect(humanDiff(base(), addTerm(base(), "ai_terms", "mixture of experts", L), L)).toEqual(['ai_terms +"mixture of experts"']);
    const hn = removeTerm(base(), "hn_sweep", "GPT", L);
    expect(validateDraft(hn, L).ok).toBe(true);
    expect(listVal(hn, "hn_sweep", L)).not.toContain("GPT");
    expect(addTerm(base(), "hn_sweep", "  OpenAI ", L)).toEqual(base()); // duplicate after trim
  });
  test("6 taste: 0.35 → 0.3 (dial + stored draft); the label text is unchanged", () => {
    expect(tasteVal(setTaste(base(), 0.35, L), L)).toBe(0.3);
    const t = JSON.parse(JSON.stringify(base()));
    t.taste.weight = 0.35;
    expect(tasteVal(loadStored(storeText(t, HASH), HASH, base(), L)!.draft, L)).toBe(0.3);
    expect(readFileSync(resolve(desk, "src/components/sage/setup-bay.tsx"), "utf8")).toContain("· pulse shelf only · never lead");
  });
  test("7 stale draft: base_hash ≠ file_hash → stale (banner), the draft is kept as-is — never silently rebased", () => {
    const d = toggleOn(base(), "hn", L);
    const got = loadStored(storeText(d, "0".repeat(64)), HASH, base(), L)!;
    expect(got.stale).toBe(true);
    expect(got.draft).toEqual(d);
    expect(loadStored(storeText(d, HASH), HASH, base(), L)!.stale).toBe(false);
    const ed = readFileSync(resolve(desk, "src/components/sage/setup-editor.tsx"), "utf8");
    expect(ed).toContain("the committed config changed since this draft");
    expect(ed).toContain("reset to live");
    expect(ed).toContain("keep draft");
    expect(DRAFT_KEY).toBe("sage-setup-draft-v1");
  });
  test("8d stale without a crawl: same config_hash, new file_hash (a fixture) → still the banner", () => {
    // a whitespace-only / key-order commit keeps config_hash but changes the file bytes
    const fixtureFileHash = "f".repeat(64);
    expect(loadStored(storeText(base(), HASH), fixtureFileHash, base(), L)!.stale).toBe(true);
    expect(loadStored("{not json", HASH, base(), L)).toBeNull();
    expect(loadStored(JSON.stringify({ base_hash: HASH }), HASH, base(), L)).toBeNull();
  });
  test("8e popstate: push edit=1, back → read-only bay, back again → Brief (fake history over setupRoute)", () => {
    const stack = ["?view=setup", "?view=setup&edit=1"];
    const at = (i: number) => setupRoute(stack[i]!);
    expect(at(1)).toEqual({ setup: true, edit: true });
    expect(at(0)).toEqual({ setup: true, edit: false });
    expect(setupRoute("")).toEqual({ setup: false, edit: false });
    expect(setupRoute("?edit=1")).toEqual({ setup: false, edit: false });
    // both readers listen on popstate (not only on mount)
    const view = readFileSync(resolve(desk, "src/components/sage/setup-view.tsx"), "utf8");
    const deskSrc = readFileSync(resolve(desk, "src/components/sage/desk.tsx"), "utf8");
    expect(view).toMatch(/addEventListener\("popstate", read\)/);
    expect(view).toContain("setupRoute(window.location.search).edit");
    expect(view).toContain("history.pushState");
    expect(deskSrc).toMatch(/if \(v === SETUP_VIEW\) loadSetup\(\)[^\n]*\n\s*else setSetup\(null\)/);
    expect(deskSrc).toMatch(/addEventListener\("popstate", read\)/);
  });
});

describe("PASS-C3 browser chunk hygiene (sources of the lazy setup chunks)", () => {
  const files = [
    "src/components/sage/setup-view.tsx",
    "src/components/sage/setup-bay.tsx",
    "src/components/sage/setup-editor.tsx",
    "src/lib/setup-draft.ts",
    "src/lib/setup-route.ts",
    "src/lib/sage-config-rules.ts",
  ].map((f) => [f, readFileSync(resolve(desk, f), "utf8")] as const);
  test("8 no network / no token: no fetch, XHR, api.github.com, storage of secrets; no ingest-lib imports", () => {
    for (const [f, s] of files) {
      expect([f, /fetch\(|XMLHttpRequest|api\.github\.com|sendBeacon|WebSocket/.test(s)]).toEqual([f, false]);
      expect([f, /from "[^"]*(lead-pick|gmail-news|rss-labs|ai-relevance|sage-config"|sage-config-disk|hn-pulse)/.test(s)]).toEqual([f, false]);
    }
    const ed = files.find(([f]) => f.endsWith("setup-editor.tsx"))![1];
    expect(GITHUB_EDIT_URL).toBe("https://github.com/specimba/NEXUS_SAGE_grok/edit/main/desk/config/sage-sources.json");
    expect(ed).toContain('target="_blank" rel="noopener noreferrer"');
    expect(ed).toContain("1 copy JSON · 2 select all in GitHub's editor and paste · 3 Commit changes → Create a new branch… and start a pull request · 4 merge");
    expect(ed).toContain("navigator.clipboard.writeText");
    expect(ed).toMatch(/<textarea[^>]*readOnly/);
  });
  test("10 keyboard: real <button>s (in no <form>) with aria-pressed toggles; Esc in the add field cancels", () => {
    const ed = files.find(([f]) => f.endsWith("setup-editor.tsx"))![1];
    expect(ed).toContain('e.key === "Escape"');
    expect((ed.match(/aria-pressed=/g) ?? []).length).toBeGreaterThanOrEqual(2); // on toggles + feed chips
    expect(ed).toContain('"box-only · edit by commit"');
    expect(ed).toContain("disabled={box}");
    expect(ed).not.toMatch(/tabIndex=\{?-1/);
    expect(ed).toContain('type="range"');
    expect(ed).toContain("step={0.05}");
    expect(ed).not.toMatch(/<form/);
  });
  test("desk.tsx: setup takes over the lane (rail label, no tab lit, lane body hidden), still one lazy import", () => {
    const s = readFileSync(resolve(desk, "src/components/sage/desk.tsx"), "utf8");
    expect(s).toContain("&gt; lane · {Setup ? SETUP_VIEW : lane}");
    expect(s).toContain("active: active && !Setup");
    expect(s).toContain("{Setup ? <Setup /> : (");
    expect((s.match(/import\("@\/components\/sage\/setup-view"\)/g) ?? []).length).toBe(1);
    expect(s).not.toMatch(/setup-editor|setup-draft|sage-config-rules/);
    const v = readFileSync(resolve(desk, "src/components/sage/setup-view.tsx"), "utf8");
    expect(v).toContain('href="./#brief"');
    expect(v).toContain('import("./setup-editor")');
  });
});
