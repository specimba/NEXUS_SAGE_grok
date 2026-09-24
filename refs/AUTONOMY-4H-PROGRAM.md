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

## Reviewer gate — Beat 2 (7fed53c) — FAIL (2026-09-25 00:24 Istanbul)
- PASS: source-health ledger (10 sources, OpenAlex 429 streak_fail 1 recorded), STALE guard 6h wired (FRESH/STALE chip), locks 003 / hf-incident / free-only hold.
- FAIL: dedupe multi_source 0 (171 items became 170 clusters). The title rule already exists (Jaccard ≥ 0.6, min-token gate), so it is too strict for real cross-source headlines. Need at least 3 real clusters spanning 2+ sources, with the numbers.
- FAIL: NEW marker has no UI in desk.tsx, and new_items=171 means everything is "new" on the first seen-index run. Must show NEW only for items first seen after the previous crawl, proven on a second run.

## Reviewer gate — Beat 2 re-land (b8bd279) — PASS (2026-09-25 00:35 Istanbul)
- Dedupe v2: 218 items became 207 clusters, 3 real multi-source (Private AI Compute DeepMind+HN, Gemini 3.8 TTS DeepMind+HN, Transformers llama.cpp quants HF+HN). All three are genuine same-story pairs. Near-miss guards look right (Gemini 3.8 family launches correctly kept apart).
- NEW: run 2 gives 0 of 245, so no false flags. bun 271/0 re-run by Reviewer. Locks 003 / hf-incident hold.
- Soft: the Transformers pair is about 30h apart (HF feed has date-only 00:00 stamps), just past the 24h window, so an identical title seems to override the window. Acceptable, but document it.
- Soft: the positive NEW case must show on the 02:11 crawl; if it doesn't, re-open.

## Beats 4–6 (added Sep 25 00:35, after Beat 2 PASS b8bd279)

### Beat 4 — Corroboration ranking (Coder; Reviewer gate)
- Rank below the lead: score = base × (1 + 0.15 × (sources − 1)), capped at ×1.45.
- Lead is pinned to `hf-incident`; boost applies only to slots below the lead.
- Brief under-lead rows show a sources count (e.g. `3 SRC`) using existing tokens, no new hex.
- Digest gains a "Moved since last crawl" block: new entries, rank up/down vs previous pack.
- GATE (Reviewer): lead unchanged across two crawls; zero `briefEligible:false` items in Brief or Digest; at least one row visibly reordered by corroboration, shown in proof `refs/VISUAL-PROOF-beat4-corroboration.png`.

### Beat 5 — Google News joins clusters (Coder; Reviewer gate)
- Likely cause of zero matches: GNews titles end in " - Publisher". Strip that suffix before matching and take the publisher from the `<source>` element.
- Widen GNews from 8 items: add AI topic and lab-name queries (free RSS only).
- Document the rule that an identical normalised title may override the 24h window (Transformers pair, ~30h, date-only HF feed).
- GATE: at least 1 real GNews cross-source merge; every multi-source cluster pasted; any wrong merge = FAIL.

### Beat 6 — Voice chip parity + Papers density (UX craft, Coder builds)
- `[01]` Brief and `[05]` Voice chips share one style.
- Papers tab density check against Pulse V5 table rhythm.
- Proof `refs/VISUAL-PROOF-beat6-voice-papers.png`.

Order: 4, 5, 6. Beat 5 matching can be coded while Beat 4 is under gate. Land-or-FAIL messages only.
