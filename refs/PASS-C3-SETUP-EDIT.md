# PASS-C3 — Setup edits: in-page draft editor plus a GitHub edit link (Option B)

Owner: Coder builds · UX look · Reviewer gates · Architect spec. Canberk picked **Option B** (Oct 16). It replaces the sketch's recommendation in `PASS-C3-SETUP-EDIT-SKETCH.md`, which stays as history.
Builds on **PASS-C2** (`desk/config/sage-sources.json`, ceilings, last-good fallback, `config_hash`) and on **UX-NEXT-3 idea 3** (Setup patch bay). Ship the patch bay first or in the same PR; C3 makes its glyphs real controls.

## Hard rules
- **No token, key or write call in the browser.** The page never talks to the GitHub API. The only network action is a plain link to github.com, which Canberk opens while signed in himself.
- **No CI minutes.** No GitHub Actions and no new GitLab job. The merged file is validated by the next scheduled crawl (C2 validator plus last-good fallback), as it is today.
- Free only. No cycle `004`. Lead/Brief rules are not editable; they stay in code and pass marks.
- **First Load for `/` stays within ±200 B** of the pre-C3 build. Everything new lives in the existing lazy setup chunk.
- The **overflow-390** check covers `?view=setup` and `?view=setup&edit=1`.

## C3.1 — Pure rules module shared by the browser and CI
- Split the pure checks out of `src/lib/sage-config.ts` into **`src/lib/sage-config-rules.ts`**, with no imports from ingest libs (`lead-pick`, `gmail-news`, `rss-*`, …). It takes a `limits` object: ceilings, wired feed ids, list/term caps, and the taste max.
- `validateSageConfig` (CI/crawl) becomes `validateWithRules(raw, limitsFromCode())`. Its behaviour stays identical: the C2 tests pass unchanged.
- `scripts/desk-view.ts` emits **`SAGE_SETUP.limits`** (same numbers, from code) plus **`SAGE_SETUP.config`** (the committed JSON, canonical) into `src/data/sage-setup.ts`. The browser validates against those, so its bundle never pulls ingest code.
- **Parity test**: for every fixture in `sage-config.test.ts`, browser-path `validateWithRules(raw, SAGE_SETUP.limits)` and CI-path `validateSageConfig(raw)` return the same ok flag and the same error strings.

## C3.2 — Editor on the patch bay (UX look)
Entry: an `edit` toggle in the Setup summary chip row sets `?view=setup&edit=1`. Without it, the bay is read-only exactly as UX-NEXT-3 idea 3. Controls map 1:1 onto the patch bay parts:
| Bay part | Control in edit mode | Bounds |
|---|---|---|
| Module `on` glyph | real toggle button (`aria-pressed`) | box-only modules (`x_taste`, `gmail` if box-only) show the hollow LED and are **disabled** with the title "box-only · edit by commit" |
| Module caps | stepper (− value +), numeric | 1 … code ceiling; `timeout_s` 3 … 15 |
| Feed list (lab/sec) | chips toggle on/off | only wired ids; can't add new ids |
| Cartridges (keyword lists) | chips with ×, plus one add field per cartridge | ≤ `KEYWORD_LIST_MAX`, each ≤ `KEYWORD_LEN_MAX`, must compile as a regex fragment; `politics_deny` keeps its strike-through style |
| Taste dial | `<input type=range>` styled as the dial, step 0.05 | 0 … 0.3, label stays `pulse shelf only · never lead` |

- Changed controls get a **green** edge and a `Δ` mark. **Amber only for invalid**: inline under the control, plus an error list above the bay (the same slot as C2's `config invalid`).
- A **draft bar** sits at the bottom of the bay: `N changes · valid` / `N errors`, plus `reset`, `copy JSON`, and `open on GitHub`. At 390 it is a sticky bottom bar inside the content width, with buttons wrapping to two rows and no fixed widths.

## C3.3 — Draft, output and the GitHub hand-off
- The draft lives only in `localStorage["sage-setup-draft-v1"]` as `{base_hash, config}`. It is never sent anywhere. If `base_hash` ≠ the live `config_hash`, show "the committed config changed since this draft". The only actions offered are `reset to live` or `keep draft`, with no merge.
- **copy JSON** writes `canonicalJson(draft)` plus a trailing newline: 2-space indent and key order identical to the committed file, so the GitHub diff shows only the edits. Also show a short human diff (`gnews.on true→false`, `ai_terms +"mixture of experts"`) with a `copy summary` button for the commit message.
- **open on GitHub** is a plain `<a target=_blank rel="noopener noreferrer">` to `https://github.com/specimba/NEXUS_SAGE_grok/edit/main/desk/config/sage-sources.json`. GitHub can't prefill an edit, so the steps text reads: "1 copy JSON · 2 select all in GitHub's editor and paste · 3 Commit changes → *Create a new branch… and start a pull request* · 4 merge". Both buttons are **disabled while invalid**.
- Nothing auto-merges. After merge, the next crawl (06:11/11:11/16:11/21:11) loads it. The Setup summary shows `since <sha7>` and the new `config_hash`, and a bad merge still falls back to last-good with the amber `config invalid` meter (C2).

## C3.4 — Size and performance
- `/` First Load: within **±200 B** of the build before C3. The only allowed `desk.tsx` delta is reading `edit=1` into the existing lazy import (no new eager imports). Coder posts both numbers.
- Setup chunk: the editor plus rules add **≤ 12 kB** raw over the patch-bay chunk. The bundle must not contain the strings `lead-pick`, `gmail-news` or `rss-labs`, which the size check greps for.
- No new dependencies. Copying uses `navigator.clipboard.writeText`, falling back to a selected `<textarea readonly>` if blocked.

## C3.5 — Acceptance tests
Unit (`src/lib/__tests__/sage-config-rules.test.ts`, `setup-draft.test.ts`):
1. Parity (C3.1): same ok flag and the same error strings on every C2 fixture.
2. Ceilings: the `gnews.cap` stepper can't exceed the ceiling, and a pasted over-ceiling JSON gives the same error text as CI.
3. Unknown feed id or unknown field gives an error; box-only source toggles are absent from the produced diff even if localStorage is tampered with.
4. Canonical output: no edits gives `copy JSON` **byte-identical** to `desk/config/sage-sources.json`, and one toggle gives exactly one changed line in `diff`.
5. Bad regex `fine-(tun` blocks copy/open, and the error names the term.
6. Taste: 0.35 is clamped/refused to 0.3, and the label text is unchanged.
7. Stale draft: `base_hash` mismatch shows the banner and never silently rebases.
8. No secrets: the built setup chunk and `out-pages` pass `secret-gate.sh`, and there's no `fetch(` / `XMLHttpRequest` to `api.github.com` in the chunk.

Visual and live (Reviewer, box Chrome gate, since this is a page change):
9. 1280 and 390 screenshots of `?view=setup` (read-only) and `&edit=1` with 2 edits and 1 error. overflow-390 passes on both URLs, ids don't break mid-word, and the draft bar stays inside 390.
10. Keyboard: all controls are reachable by Tab, toggles announce state, and `Esc` in the add field cancels.
11. Round-trip on live: make one harmless edit (`github.cap 5→4`), copy JSON, then open on GitHub, open a PR and merge. The next crawl's `ingest-last.json` `config_hash` changes, Setup shows the new value, and nothing else changes. Revert the same way afterwards.
12. First Load for `/` is within ±200 B (both numbers posted), and the setup chunk delta is ≤12 kB.

## Out of scope
Server-side writes, OAuth or GitHub apps in the page, box-side CLI edits (sketch Option A, possible later), editing lead/Brief rules, and X/Gmail credentials anywhere.
