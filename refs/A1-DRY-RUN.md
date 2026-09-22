# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-09-22T07:24:08.272Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 0 · **pre-age:** 23.99h (threshold 12h)
**Weekday window:** Mon–Fri daytime only (~09:00–17:00 VM/local intent) — no overnight @every firehose; standing cron AFTER Reviewer PASS

## Path exercised

1. Read CRAWL_AT → age gate (FORCE bypass)
2. `bun run ingest`
3. `bun run pack:export` dual-home
4. Compare live :3000 crawl to disk → lag → kill/rebuild/restart/re-verify
5. Stamp soft-fails · update drill-log + PACK-DUAL-HOME factual header

## Results

| Check | Result |
|-------|--------|
| 1 stamp-truth live=disk | live=`2026-09-22T07:21:54Z` disk=`2026-09-22T07:21:54Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20260922T072337Z.tar.gz` sha256 `5a50e2d17fda460f625a821d3d949f4eb922432afba328274d8e6e880d297bb4` |
| 6 soft-fails stamped | openalex=HTTP 429 |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-09-21T07:22:47Z` → after: `2026-09-22T07:21:54Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
