# PASS-W — Watch feed (`watch.xml`)

Canberk's pick (Oct 23 2026, option 1). One Coder pass. Data-only: **no CI config change** (`.gitlab-ci.yml`, `ci/` untouched), **no page-component change**, First Load unchanged (±0 B; ±200 B rule still applies). Free only; no Gmail/X in the feed. Coder needs Canberk's go in Coder's chat before pushing code.

## W1 Config
- New list `keywords.watch_terms: string[]` in `desk/config/sage-sources.json` (and `sage-config-types.ts`, `sage-config-rules.ts` limits).
- Default `[]` = feature off (no `watch.xml` written; an existing one is left as-is).
- Ceiling 20 terms, each ≤ KEYWORD_LEN_MAX; same lint as other keyword lists (plain substring, case-insensitive; regex compiled with `i`, `iu` lint). Freely editable (not additions-only).
- Setup editor (`?view=setup&edit=1`) must show it through the existing generic keyword-list path. If that needs a `setup-bay.tsx` edit, stop and ask Architect — don't patch the page.

## W2 Match
- Candidates: rows of the crawl's Wire + papers + releases (already-public, already-deduped data). Never Gmail rows, never X rows.
- Match on title (+ summary when present), case-insensitive, any term.
- Dedupe key = the row's existing dedupe id (canonical URL); a key already in `artifacts/sage/watch-seen.json` is skipped. Seen store keeps 14 days, pruned on write.
- **Cap 10 new entries per crawl**, newest first; overflow is dropped (not queued) and counted.

## W3 Output
- `desk/scripts/atom-feed.ts` writes a second feed `desk/public/watch.xml` in the same step and same soft-fail (`|| echo "atom-feed: crashed (soft)"`). No new yml step.
- One entry per matched row: title, link, `published` = row's first-seen time, `<category>` = matched term(s). Same escaping as PASS-D. Keep the last 50 entries, ≤64 KB. Stable `<id>` = tag URI from dedupe key. Write only when bytes change.
- Feed `<id>`/self link: `https://specimba.github.io/NEXUS_SAGE_grok/watch.xml`.

## W4 Plumbing (scripts, not CI config)
- `ci-state.sh`: stage/revert `public/watch.xml` + `artifacts/sage/watch-seen.json` alongside feed.xml (own pathspec, missing file safe).
- `reader-hash.ts`: hash `public/watch.xml` when present.
- `pages-publish.sh` §2h: add `':(exclude)desk/public/watch.xml'`.
- `backup-allowlist.txt`: add `desk/public/watch.xml`.
- crawl.log suffix appends `watch=<new>/<dropped>`; `publish-proof.json` gains `watch_sha`, `watch_new`, `watch_dropped`.

## Acceptance tests
1. `watch_terms: []` → no watch.xml written, log `watch=off`.
2. One term matching 3 rows → 3 entries, categories correct.
3. 15 matches → 10 written, `watch=10/5`.
4. Rerun same crawl → 0 new, file bytes unchanged.
5. Gmail/X row containing the term → never appears.
6. Title with `& < > "` → exact-string escaped output (as PASS-D tests 11–13).
7. 51st entry evicts the oldest; file ≤64 KB.
8. Term over KEYWORD_LEN_MAX or 21st term → rejected in both browser and CI rules (shared `sage-config-rules.ts`).
9. Generator crash → crawl continues, feed.xml unaffected.
10. Watch-only change publishes (reader-hash) and §2h counts it as data, not code.
11. First Load bytes identical to the branch base; overflow-390 clean.

Merge to main is Canberk's step; Reviewer verifies.
