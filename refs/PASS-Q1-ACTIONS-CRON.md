# Pass Q1 — Quota-smart pipeline on GitHub Actions

**Architect cut:** 2026-10-09 · Canberk (via Grok Bot): quota-smart first · audit `refs/QUOTA-SMART-ROUTINES.md` (#1, #3, #4)  
**Status:** PASS MARK · Coder builds · Reviewer PASS after **2 green scheduled runs**  
**Free only.** Public repo → standard runners free. DENY: paid runners · paid APIs · LLM calls in the pipeline · Gmail/X credentials in Actions · cycle `004`.

## Goal

Crawl, digest tick and Pages publish run with no agent awake. Quota running out can't drop crawls again (Oct 8–9 lost 5 fires). Publish only when the reader would see a change, and keep the freshness stamp honest.

## 1. Workflow `.github/workflows/sage-crawl.yml`

| Item | Rule |
|------|------|
| Schedule | `cron: "11 23,3,7,11,15,19 * * *"` (UTC) = same 02:11/06:11/10:11/14:11/18:11/22:11 TRT slots. Add `workflow_dispatch` for manual runs. |
| Concurrency | `group: sage-crawl`, `cancel-in-progress: false` (never two crawls at once). |
| Checkout | Shallow (`fetch-depth: 1`) main; gh-pages via a separate shallow checkout or worktree at push time. |
| Steps | setup bun (pinned) → `bun install --frozen-lockfile` → ingest → rank/digest → `a2:tick` → hash gate (§2) → PAGES build + asset/font/coherence checks → push gh-pages → commit data to main `[skip ci]`. |
| Auth | `GITHUB_TOKEN` with `permissions: contents: write` only. No PAT, no other secrets. |
| Timeout | `timeout-minutes: 20`. Per-source timeouts stay soft (Lab RSS: tighten to ≤15 s per feed). |
| Lead pick | 06:11 TRT lead pick (B4) must tolerate a late run. If Actions starts late, pick on the first run at or after 06:11 that day, never twice a day. |
| Drop on box | Retire the Grok Bot crawl routine and the publish follow-up turn **after** Reviewer PASS. Keep `a1-stale-ingest.mjs` + `pages-publish.sh` as a manual box fallback. Drop `:3000` rebuild and per-crawl ref-doc stamps from the scheduled path; write one `logs/crawl.log` line instead. |

## 2. Skip publish when nothing reader-visible changed

- Compute `reader_hash` = sha256 over the generated reader data (`desk/src/data/*` that feeds the page) **with these fields stripped**: `CRAWL_AT`, pack stamps (`PACK_AT`, `pack_id`, `last_at`, `next_at`), build stamps, `captured_at`/`stamped_at`, fetch timings, soft-fail ms.
- Store the last published hash in `artifacts/sage/reader-hash.json` (committed).
- **Hash unchanged** → skip Pages build and gh-pages push. Commit only `artifacts/sage/last-checked.json` (`checked_at`, `reader_hash`, `published_at` of the live build).
- **Hash changed** → full build + publish, update both files.
- **Honest freshness:** the live page reads `last-checked.json` at runtime (small static JSON fetched client-side from gh-pages, so a skipped publish still updates it). The crawl chip shows `checked HH:MM · data HH:MM`. STALE logic uses `checked_at`. A quiet news day must not look stale.
- Code changes (non-crawl commits) still publish through the normal path. Batch per pass group, one publish per land.

## 3. One watchdog, failure-only

- `desk/scripts/watchdog.ts` (plain bun, no LLM), run as the last job in the same workflow **and** on its own cron `41 */4 * * *` UTC.
- Fails (exit 1) when: `checked_at` older than **8h**; gh-pages build crawl ≠ main crawl after a changed-hash run; last two runs both soft-failed ≥ half the sources; or the hash gate errored.
- Healthy → exit 0, silent. Failure → the workflow fails, GitHub emails the repo owner (free), and the job opens or updates one issue `sage-watchdog` (closed automatically on the next green run). No room posts, no agent wakes.
- Bots stop doing "verify live" passes on routine crawls. Visual proofs only for code passes.

## 4. Pack backup gap (box dual-home)

- Each run uploads `artifacts/sage/packs/` (new pack only) + `digest-last.json` + `reader-hash.json` via `actions/upload-artifact`, `retention-days: 30`, name `sage-pack-{pack_id}`.
- The box `pack:export` dual-home stays as an **optional** manual/box job; Q1 does not depend on it.
- Restore path documented: `gh run download -n sage-pack-<id>` → `pack:import`.

## 5. Sources that can't run in the cloud

| Source | In Actions |
|--------|-----------|
| Gmail news (F) | **No credentials in Actions.** Read the committed Gmail snapshot/cache only. If none, soft meter `gmail · box-only`. Refresh stays on the box with Canberk's connector. |
| X session taste (E) | Committed `x-taste.ts` only; soft **taste stale** as today. No cookies in Actions. |
| All other free sources | Run as today. |

**Privacy note (needs Canberk):** the repo and Pages are public, so committed Gmail subjects/snippets are public too. Q1 doesn't make this worse, but Canberk should confirm that's OK or move Gmail rows to box-only display.

## Pass marks (Reviewer)

1. Two consecutive **scheduled** (not manual) runs green, on the TRT slots, with no agent turn involved.
2. At least one run publishes (hash changed) and live Pages matches main crawl; if a run skips (hash unchanged), `last-checked.json` on gh-pages updates and the live chip shows the new check time.
3. Forced fixture: stamp-only diff → hash equal → no gh-pages commit. Item/lead diff → hash differs → publish.
4. Watchdog: forced stale `checked_at` → job fails + issue opens; next green run closes it. Healthy run posts nothing.
5. Artifact `sage-pack-*` present on a run with a new pack; restore dry-run with `pack:import` works.
6. No secrets beyond `GITHUB_TOKEN`; secret-gate passes; no Gmail/X creds in the workflow.
7. Brief lead / cycle `003` / unlock behaviour unchanged; 185 kB gate holds (note: only 60 B headroom today, so free headroom before adding the `last-checked` fetch).
8. Box crawl routine retired only after 1–7 pass.

## Out of scope

Director pulse cadence (#2), stale one-shot cleanup (#5), Scout digest cadence: owner-side routine changes, not repo code.
