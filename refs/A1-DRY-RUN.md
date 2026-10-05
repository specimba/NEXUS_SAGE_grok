# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-10-05T07:14:39.880Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 3.89h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-10-05T07:13:17Z` disk=`2026-10-05T07:13:17Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20261005T071337Z.tar.gz` sha256 `3e030eb8dd101710a860b97a1df008711221a46cd18bec114820a371b71222f9` |
| 6 soft-fails stamped | openalex=paused_until 2026-10-06T03:20:26Z; google_news=NVIDIA AI:empty_channel |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-10-05T03:20:06Z` → after: `2026-10-05T07:13:17Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).
