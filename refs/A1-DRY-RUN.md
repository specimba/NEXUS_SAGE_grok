# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-09-11T09:30:28.452Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 0 · **pre-age:** 104.00h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-09-11T09:29:29Z` disk=`2026-09-11T09:29:29Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20260911T093002Z.tar.gz` sha256 `271313533c19216016bbd9ab6d1e6ddd8e8a4e7b0350b710325eb0f50c410ba2` |
| 6 soft-fails stamped | openalex=HTTP 429 |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-09-07T01:29:12Z` → after: `2026-09-11T09:29:29Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
