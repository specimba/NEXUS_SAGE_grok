# A1 STALE auto-ingest — DRY-RUN evidence

**UTC:** 2026-09-07T01:30:33.711Z
**Operator:** Coder Gürok (executor) · Reviewer stamp pending
**FORCE:** 1 · **pre-age:** 6.47h (threshold 12h)
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
| 1 stamp-truth live=disk | live=`2026-09-07T01:29:12Z` disk=`2026-09-07T01:29:12Z` **PASS** |
| 2 Brief pins / lead hf-incident / cycle 003 | unchanged (locks assert + cycle.ts sha) |
| 3 no X | ingest-last.x skipped/disabled |
| 4 locks hold | cycle 003 · lead hf-incident · no 004 |
| 5 dual-home sha identical | `sage-pack-003-20260907T012948Z.tar.gz` sha256 `22bb3aac6bab79975f55dc53d0ec1fdc329cab2b20b587b325066788c22d9001` |
| 6 soft-fails stamped | none |
| 7 not overnight spam | script documents weekday window; cron NOT installed |
| 8 no craft/WIRE | no new WIRE-* · Brief untouched |

Crawl before: `2026-09-06T19:00:53Z` → after: `2026-09-07T01:29:12Z`

**Standing cron:** NOT installed (awaits Reviewer PASS).

### Reviewer stamp — 2026-09-07T01:33Z (Reviewer Gürok)

**A1 DRY-RUN PASS** vs FAIL list 1–8.

| # | Gate | Result |
|---|------|--------|
| 1 | Stamp-truth live=disk | PASS — crawl `01:29:12Z` on `:3000` + CURRENT · build `ytC06pDObmdfZOy3YLDs0` |
| 2 | Brief pollution | PASS — cycle `003` · lead `hf-incident` · providers `brief=false` |
| 3 | Paid X sneak | PASS — x skipped · `no_paid_x` · script forbids X_BEARER path |
| 4 | Lock break | PASS — Sol≠Astra / no `004` / import locks intact |
| 5 | Dual-home | PASS — `sage-pack-003-20260907T012948Z` sha256 `22bb3aac6bab79975f55dc53d0ec1fdc329cab2b20b587b325066788c22d9001` identical |
| 6 | Soft-fail wash | PASS — none this run · stamped honestly |
| 7 | Overnight spam | PASS — A1 cron **not** installed; weekday window documented |
| 8 | Craft/WIRE creep | PASS — no new WIRE · Brief untouched |

Independent verify: `visual:check` OK · live crawl matches disk.

**Soft note (not a FAIL):** existing `crontab` already has `0 */6 * * * digest:tick` (all days incl. overnight). A2/A3 land must tighten that to Istanbul weekday windows — do not leave round-the-clock as “harden.”

**GO:** weekday-daytime A1 standing cron only (Europe/Istanbul ~09–17 Mon–Fri). Then A2 → A3.
