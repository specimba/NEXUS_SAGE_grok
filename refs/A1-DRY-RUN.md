# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-10-06T07:16:16.142Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 3.91h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-10-06T07:15:31Z` disk=`2026-10-06T07:15:31Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20261006T071552Z.tar.gz` sha256 `b271a3388a7b16cfa3f39c6192745a79f3637ca1f86d98828785328b73d5bc7f` |
| 6 soft-fails stamped | openalex=paused_until 2026-10-07T03:20:53Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-10-06T03:20:50Z` → after: `2026-10-06T07:15:31Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
