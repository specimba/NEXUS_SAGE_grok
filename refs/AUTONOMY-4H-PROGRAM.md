# AUTONOMY 4H PROGRAM — 2026-09-25 (Canberk GO: autonomous, no theater)

**Orchestration:** Architect (contract + order) · Director (enforce, unblock) · Coder land · UX craft · Reviewer gate · Scout refs  
**Chat rule:** room message ONLY on a land (commit hash + proof) or a FAIL. No acks, no "in flight", no stamps of unchanged state.  
**Locks:** cycle `003` · lead `hf-incident` · free sources only · no paid X / Bluesky · no `004` · Taste Pulse-only

## Beat 0 — Commit what passed (Coder, now)
Brief V5 depth is PASS but uncommitted. Commit + push. Done when: hash on main.

## Beat 1 — Crawl every 4h, 24/7 (Coder)
Host has no `crontab`, so one Bot routine owns it (replace the weekday-only A1 window).
- Schedule: every 4h, all days (e.g. 02/06/10/14/18/22 Istanbul)
- Each fire: `bun run ingest` then `digest:tick` then dual-home pack then rebuild/restart only if build lags
- Failure handling: soft-fail per source (already) · if whole ingest fails, retry once after 10 min · if still failing, ONE room line to Canberk
- Quiet on success. No room message.
- Done when: routine armed, first fire writes fresh `crawled_at`, old weekday A1 routine removed (no double fire)

## Beat 2 — Crawl reliability functions (Coder, Reviewer gates with tests)
1. **Source health ledger** `artifacts/sage/source-health.json`: per source last_ok, last_fail, streak, items. Rolling 7 days.
2. **Dedupe across sources**: same story from HN + GNews + lab RSS collapses into one item with source badges (URL canon + title similarity).
3. **New-since-last-crawl**: each item carries `first_seen`; UI can mark NEW.
4. **Staleness guard**: if crawl age > 6h, desk shows STALE chip (red/amber) instead of FRESH.
Done when: unit tests for dedupe + ledger, `bun test` green, ledger written by real ingest.

## Beat 3 — Pulse V5 UI (UX craft, Coder land)
Pulse is the live news lane and still reads like a list. Inspiration to use, not copy:
- Techmeme: clustered story with "also covered by" sources under a lead headline
- Bloomberg terminal / Pip-Boy: dense instrument rows, tight monospace, status columns
- Hacker News: fast scan, score + age in one line
Target: clusters (from Beat 2 dedupe) with source badges, NEW marker, age column, source health strip at the top (from ledger), Taste shelf stays as its own quiet rail.
Done when: Pulse still clearly different from today at arm's length; proof `refs/VISUAL-PROOF-pulse-v5.png`; `visual:check` green; Reviewer PASS.

## Beat 4 — If time remains
Voice `[01]` solid-fill vs outline tab polish (Reviewer soft note) and Papers lane density check. Only after Beat 3 PASS.

## Order
0 then 1 then 2 then 3. Beat 3 craft (UX mock) may run in parallel with Beat 2 code.
