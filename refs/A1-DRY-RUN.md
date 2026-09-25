# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-09-25T23:13:29.729Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 4.00h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-09-25T23:12:54Z` disk=`2026-09-25T23:12:54Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20260925T231307Z.tar.gz` sha256 `6898ecbe50778b4ca948fab1c661bdac5a9b89acc3f37c4b9920f5772fa45aac` |
| 6 soft-fails stamped | openalex=paused_until 2026-09-26T00:00:00Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-09-25T19:12:50Z` → after: `2026-09-25T23:12:54Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
