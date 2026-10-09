# Q1 Actions runbook (PASS-Q1)

- Crawl: `.github/workflows/sage-crawl.yml` — cron `11 23,3,7,11,15,19 * * *` UTC (02/06/10/14/18/22:11 TRT) + `workflow_dispatch`.
- Watchdog: last job of sage-crawl + `.github/workflows/sage-watchdog.yml` (cron `41 */4 * * *` UTC). Failure-only; one `sage-watchdog` issue.
- Hash gate: `bun scripts/reader-hash.ts` → `artifacts/sage/reader-hash.json` (last published) + `artifacts/sage/last-checked.json` (also on gh-pages, read by the live chip `checked HH:MM · data HH:MM`).
- Gmail (F) / X-session (E): box-only. CI sets `SAGE_GMAIL_BOX_ONLY=1` (no Gmail transport, committed snapshot kept, meter `Gmail box-only`); X taste = committed `src/data/x-taste.ts`. No secrets beyond `GITHUB_TOKEN`.
- Pack backup restore: `gh run download <run-id> -n sage-pack-<pack_id>-<run-id>` → `cd desk && bun run pack:import -- <path>/packs/sage-pack-003-<stamp>.tar.gz`.
- Manual box fallback: `FORCE=1 bun scripts/a1-stale-ingest.mjs` + `bun run pages:publish` (unchanged).
- Box crawl + publish routines retire only after Reviewer PASS (2 green scheduled runs, marks 1–7).
