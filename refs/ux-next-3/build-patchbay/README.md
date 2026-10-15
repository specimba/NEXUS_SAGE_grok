# UX-NEXT-3 idea 3 (Setup patch bay) + PASS-C3 (Setup editor, Option B): build proof

The branch `ux-patch-bay` was cut from origin/main b4c8f44. Everything here was built on the box with `PAGES_BUILD_ONLY=1 bash scripts/pages-publish.sh`, with no builds between :05 and :35. Shots use `--now 2026-10-15T18:40:00Z`.

## Numbers
- **`/` First Load:** 178,593 B before (b4c8f44) → 178,680 B after, **+87 B**. That is within C3.4's ±200 B and under the 182,000 B ceiling. Logs: `build-before.txt`, `build-after.txt`.
- **Setup chunks** (`chunks-and-secret-gate.txt`). The baseline C2 setup chunk was 4,814 B.
  - The patch-bay chunk (`setup-view` + `setup-bay` + SAGE_SETUP) is 10,824 B raw, 3,960 B gz.
  - The editor chunk (`setup-editor` + `setup-draft` + `sage-config-rules`) is its own lazy chunk at 11,900 B raw, 4,702 B gz. That is **≤ 12 kB**.
  - The C3.1 SAGE_SETUP fields (`limits`, `config`, `file_hash`) add about 1,633 B (minified) to the patch-bay chunk. A shared `D` const deduplicates the repeated defaults.
  - No chunk contains `lead-pick`, `gmail-news`, `rss-labs`, `api.github.com`, `XMLHttpRequest` or `fetch(`. `secret-gate.sh out-pages` passes.
- **Tests:** 702 → 746 pass, 0 fail (`tests-before.txt`, `tests-after.txt`). The PASS-C2 tests are unchanged. The new files are `sage-config-rules.test.ts` and `setup-draft.test.ts`.
- **tsc:** the only new errors are the existing `bun:test` / `import.meta.dir` pattern in the two new test files, which is the same as every other test file (`tsc-diff-vs-main.txt`).
- **Parity against the pre-C3 validator** (`parity-vs-pre-c3-validator.txt`): 20 of 23 fixtures are identical, including the ok flag, error strings and merged config. The 3 that differ are the intended new rules: `ai{` fails the iu lint, and removing a politics or AI baseline term is rejected.

## Gates
- **visual:check:** OK, covering the font check, all lanes, and overflow-390 on 6 lanes plus `?view=setup` plus `?view=setup&edit=1` (`visual-check-after.txt`, `overflow-390-after.txt`, `font-check-after.txt`).
- **Max-size config fixture (11a):** `bun scripts/setup-max-fixture.ts <scratch>` builds a fixture with every source on, every cap at its ceiling, and every wired feed. It holds 4 × 200 terms (KEYWORD_LIST_MAX), including one term of exactly KEYWORD_LEN_MAX = 120 chars (imported from code) and long unbroken terms, plus 6-digit row counts, a soft-fail, and 8 invalid errors of 160 chars.
  - The fixture was copied over `src/data/sage-setup.ts`, built, and then the live file was restored byte-for-byte (`desk-view --check` passes).
  - The build had to skip publish's coherence pre-check, because the fixture is deliberately not what desk-view generates. A scratch copy of pages-publish was used with only line 48 commented, then deleted. The post-build coherence check fails on the fixture for the same reason. The output was still built and served.
  - overflow-390 is OK on `?view=setup` and `&edit=1` with 800 chips open (`overflow-390-maxfix.txt`, `maxfix-build.txt`, `maxfix-*.png`).

## Shots
- before-setup-{1280,390}.png: origin/main b4c8f44, the C2 table stacked above the Brief.
- after-setup-{1280,390}.png and after-setup-390-carts.png: the patch bay, read-only.
- after-edit-{1280,390}.png and after-edit-390-carts.png: `&edit=1` with 2 edits (gnews off, github cap 5→4) and 1 error (`fine-(tun`). They show the green Δ edges, the amber error list and chip, and the sticky draft bar `1 error` with copy/open disabled.
- pair-mockup-vs-build-{1280,390}.png: the mockup `refs/ux-next-3/after-setup-*` next to the build.
- pair-before-after-{1280,390}.png.
- maxfix-setup-390.png and maxfix-edit-390.png: the max-size fixture.
