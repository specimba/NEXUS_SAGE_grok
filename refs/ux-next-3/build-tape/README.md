# UX-NEXT-3 idea 2: morning edition day tape (build proof)

Branch `ux-day-tape`, base origin/main 66dec6b. Built 2026-10-16 00:45–00:50 UTC+3 (outside :05–:35). The build ran `PAGES_BUILD_ONLY=1 bash scripts/pages-publish.sh` with PAGES=1 under /NEXUS_SAGE_grok. Shots were taken with headless Chrome (`scripts/lane-shot.ts`) against a local serve of out-pages, with the page clock pinned to 2026-10-15 21:40 UTC+3 for both before and after.

## Gates
| gate | before | after |
|---|---|---|
| tests (`bun test src/lib/__tests__`) | 702 pass / 0 fail (`tests-before.txt`) | 722 pass / 0 fail (`tests-after.txt`); new `day-tape.test.ts` adds 20 (`tests-day-tape.txt`) |
| First Load `/` | 178,603 B | 179,369 B (+766 B; target ≤182,000 B; cap 185,000 B) (`first-load.txt`) |
| font-check (browser, pages-publish 2g) | OK | OK (`font-check-after.txt`) |
| overflow-390, 6 lanes + setup | n/a | OK (`overflow-390-after.txt`) |
| visual:check | n/a | OK (`visual-check-after.txt`) |
| desk-view --check | n/a | in sync (`crawl-tape-backfill.txt`) |

## Shots
- `before-brief-{1280,390}.png`, `after-brief-{1280,390}.png`, `pair-before-after-{1280,390}.png`
- `pair-mockup-vs-build-{1280,390}.png`: left is UX's `after-tape-*.png`, right is this build.
- `after-brief-390-you.png`: the Beat 10 baseline set to 17:00 UTC+3, so `▲ you` sits under 16:22.
- `fixture-held-{1280,390}.png`: **tape-only fixture**. The HELD DayTape markup (same real crawls, the 06:21 entry HELD, page at the 11:21 crawl, next try 14:11) was injected into the built page with scripts stripped. The plate below it is still the real picked plate.

## Data (no invented values)
- **New crawl field** `desk/artifacts/sage/crawl-tape.json`: `{schema:1, crawls:[{at, new}]}`, the newest 16. `new` is the number of Pulse clusters whose `first_seen` equals that crawl's stamp (`is_new`). Ingest writes it on every crawl, and ci-state.sh persists it with artifacts/sage on changed=true runs. It is seeded from git history by `scripts/day-tape-backfill.ts` (each pulse-clusters.ts commit: its PULSE_CLUSTERS_AT and its `"is_new":true` count).
- **New desk field** `DAY_TAPE` in `src/data/desk-view.ts`: yesterday's last crawl plus today's crawls (≤5), with `pick: "pick" | "held"` on the crawl that made LEAD_TODAY (matched on `crawl_at`). NOW's count always comes from the current crawl. reader-hash ignores the DAY_TAPE line, so a crawl whose only change is the tape still skips publishing.
