# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-09-26T11:21:11.732Z
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
| 1 stamp-truth live=disk | live=`2026-09-26T11:20:04Z` disk=`2026-09-26T11:20:04Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20260926T112047Z.tar.gz` sha256 `c21d50737020577d241ea67cf1ce90b805e2da11911b1a0e65a19090f770eb6d` |
| 6 soft-fails stamped | openalex=paused_until 2026-09-27T00:00:00Z |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-09-26T07:20:20Z` → after: `2026-09-26T11:20:04Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
