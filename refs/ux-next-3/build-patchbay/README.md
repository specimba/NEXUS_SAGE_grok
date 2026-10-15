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

## Architect ruling (follow-up commit on ux-patch-bay)
Built on the box 01:55 +03 (`build-ruling.txt`, `chunks-ruling.txt`); no builds between :05 and :35.
- **Lazy budget waiver (1), for the PR:** combined editor budget = editor chunk **11,945 B** raw (4,732 B gz) + editor data in the bay chunk (C3.1 `limits` / `config` / `file_hash`, minified) **1,633 B** = **13,578 B ≤ 14 kB**. The bay chunk itself is unchanged at 10,824 B (same content hash).
- **First Load:** **178,679 B** (b516be1: 178,680 B; origin/main b4c8f44: 178,593 B) → **+86 B vs main**, within ±200 B.
- **8c (2):** asserts `fileJson(JSON.parse(committed))` is byte-equal (Buffer compare, same length) to the committed blob `git show HEAD:desk/config/sage-sources.json`, and to the working-tree file. `config_hash` is still sha256(canonicalJson) — asserted.
- **Box publish config sync (3):** `pages-publish.sh` step 0a runs `bun scripts/desk-view.ts --sync-config` before the 0b coherence `--check`. If desk/config's file_hash moved and only `src/data/sage-setup.ts` is stale, it writes like CI does (desk-view write mode). If other generated files are stale too, it refuses and dies with the exact command (`cd <desk> && bun run rank:snapshot && bun scripts/desk-view.ts --check`). A write error or an empty output also dies with a command. Tests: `pages-publish-config-sync.test.ts`. Live proof (edit config → write → `--check` + coherence OK; plus the refuse case), restored afterwards: `config-sync-proof.txt`.
- **timeout_s floor (4):** `TIMEOUT_MIN_S = 3` / `fieldMin()` in `sage-config-rules.ts`. The CI validator and the stepper (`setup-draft` `TIMEOUT_MIN`, `capBounds`) use it. Parity test: for every ceilinged field and every value 0…ceiling+1, CI ok ⇔ browser ok ⇔ within the stepper's bounds, with identical errors. `timeout_s = 2` → `sources.lab_rss.timeout_s must be ≥ 3`.
- **crawl.log suffix (5):** the PASS-D D6 single format `feed=<sha8|same|skipped> ov390=<skipped|pass|fail> fl=<bytes|->`. pages-publish uses the PASS-D `ov390` vocabulary (`skipped|ran-pass|ran-fail`) and the same `fl_bytes` grep. It writes `feed=skipped …`, since this branch has no feed, and the proof file is removed at the start of each run. The gitlab-ci `echo … changed=$changed $proof ${dur}s$slow` line is byte-identical to beat13-on-chrome's. Only the `proof=` source line differs (on merge, take PASS-D's `publish-proof.ts suffix`). Tests: `crawl-log-suffix.test.ts`.
- **8e (6):** unchanged.
- **Tests:** 746 → **756 pass**, 0 fail (`tests-after.txt`). visual:check was not rerun: no rendered UI changed. The stepper floor was already 3 and the bay chunk is byte-identical.
