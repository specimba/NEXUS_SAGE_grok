# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-10-04T11:20:11.476Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 3.96h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-10-04T11:19:25Z` disk=`2026-10-04T11:19:25Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20261004T111942Z.tar.gz` sha256 `97b89634e5679e3c1138bb7e494ef218365af197eae44d63bcde51b471f4a33b` |
| 6 soft-fails stamped | openalex=paused_until 2026-10-04T23:20:53Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-10-04T07:21:32Z` → after: `2026-10-04T11:19:25Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
