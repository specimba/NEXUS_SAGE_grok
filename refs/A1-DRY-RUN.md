# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-10-03T15:21:14.685Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 4.07h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-10-03T15:20:35Z` disk=`2026-10-03T15:20:35Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20261003T152044Z.tar.gz` sha256 `8bd6c99421c68bc31a96918a95ca30a1e4fa094447b4677edc23501dab57df61` |
| 6 soft-fails stamped | openalex=paused_until 2026-10-03T19:13:47Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-10-03T11:16:29Z` → after: `2026-10-03T15:20:35Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
