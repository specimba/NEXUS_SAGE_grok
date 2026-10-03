# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-10-03T07:13:50.201Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 3.93h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-10-03T07:12:59Z` disk=`2026-10-03T07:12:59Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20261003T071320Z.tar.gz` sha256 `4ecaabfec71de5aab5b9c06bd240e21ad1ab0547b84a427c39833d96d098dbee` |
| 6 soft-fails stamped | openalex=paused_until 2026-10-03T19:13:47Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-10-03T03:17:23Z` → after: `2026-10-03T07:12:59Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
