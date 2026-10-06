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

## Reviewer gate — Beat 3 Pulse V5 (9ad8451) — PASS (2026-09-25 00:39 Istanbul)
- Proof matches spec: cluster table, health strip with OpenAlex 429 struck, Taste right rail, solid lead + dim badges, plain SIG integers. At arm's length it is clearly not the V4 card grid. :3000 serves 200; Taste briefEligible:false holds.
- Soft: off-topic HN rows leak in (row 05 "Steve Jobs iPhone 4 Antennagate"); the HN entity search needs an AI-relevance filter. Worth folding into Beat 5.

## Reviewer gate — Beat 5 GNews match (13de0bf) — PASS (2026-09-25 00:50 Istanbul)
- Hand-checked all 11 multi-source groups: 0 wrong merges. 3 real GNews cross-outlet groups (UN AI-safety CEOs HN+Mexico Business News; Claude CRISPR enzyme HN+Al Jazeera+Digital Watch; Anthropic bio lab HN+TechCrunch).
- Soft: 5 of 11 are NVIDIA's own blog reposted via GNews (blogs.nvidia.com / NVIDIA Developer), so there are 6 independent groups, not 11. The CRISPR group also carries an Anthropic self-repost. Director's same-company-counts-0 rule fixes this; the multi_source stat should report the independent count.
- Soft: "CONTROL Resonant launches on GeForce NOW" is a game post that got past the AI filter via the NVIDIA lab feed.
- Beat 4 is held for the 02:11 crawl, per Director.

## Reviewer gate — Beat 6 (7e90290) — PASS (2026-09-25 01:00 Istanbul)
- Tabs proof: exactly one filled tab per lane on all 6 lanes. Papers: 14 full rows at 1280x800 (was ~7), table matches Pulse V5.
- Soft: inactive tab numbers are inconsistent. [01]/[02] render dim while [03]-[06] render amber on every lane. Pick one inactive style.
- Soft: 34px rows vs the 44px spec is accepted for desktop density.
- 04a31d5 repost rule: independent groups 6 matches my Beat 5 count. Director's lab-feed filter fix is still open.

## Beats 7–10 (added Sep 25 01:00) — user-visible only
Order 7, 8, 9, 10. Each lands with commit + before/after proof at 1280×800. Locks unchanged (003, hf-incident, Taste Pulse-only, Skin V2 tokens, free sources).

### Beat 7 — Brief Wire strip + "since last crawl" (was 4b; absorbs UX change-strip idea)
- Under the Take: top 3–5 live clusters, ≥2 independent publishers, AI-filtered, briefEligible, never Taste.
- Each row: NEW or ▲/▼ vs previous crawl, age, N SRC. Header line: "crawl hh:mm · +N new · M moved".
- Includes Director's filter fix: lab feeds exempt from the title filter, NVIDIA filtered by URL/category, title filter only on HN + GNews; the 12 dropped posts return except NVIDIA consumer.
- GATE: two crawls, two proofs with different Wire contents, lead unchanged.

### Beat 8 — Story drawer (Techmeme/Ground-News style)
- Click or Enter on a Pulse cluster opens a right drawer: every source headline side by side, publisher, time, SELF struck, links out.
- GATE: drawer opens on a real multi-source cluster (e.g. Claude enzyme); Esc closes; Taste rail untouched.

### Beat 9 — Keyboard terminal
- 1–6 switch lanes; j/k move row focus; Enter opens drawer; `/` opens a filter line (Pip-Boy prompt) over the current table; `?` shows the key map.
- GATE: full lap of all lanes and a filtered Pulse done without the mouse, recorded as proof stills.

### Beat 10 — "Since you were here" + entity heat
- localStorage last-visit stamp; rows that arrived since then get a marker distinct from crawl-NEW.
- Thin heat strip in the Pulse health bar: cluster counts per top entity (Anthropic, OpenAI, Google, NVIDIA, HF…) across the last 6 crawls, from rank snapshots already written.
- GATE: reload after a crawl shows the marker; heat strip reads without hover.

## LOCK CHANGE — Daily lead (Canberk, Sep 25 01:10)
Canberk chose: pick a fresh lead once a day from the strongest live story. The `hf-incident` pin is retired. Cycle label stays 003.
- Pick time: the 06:11 Istanbul crawl. The lead is frozen for 24h; later crawls change only the rows below it.
- Strongest = most independent publishers (SELF reposts count 0), then signal score, then newest; AI-filtered, briefEligible, never Taste.
- Candidates must have at least 2 independent publishers and be under 24h old, measured from the EARLIEST item in the cluster (late reposts do not refresh age). If none qualify, keep yesterday's lead and show "HELD · no qualifying story".
- The previous lead moves to a "Yesterday" line under the Take; `hf-incident` becomes the first archived lead.
- Politics guard (default, from Canberk rejecting Bluesky as political): a cluster whose headlines are mainly partisan or electoral politics cannot become the lead; it may still appear in the Wire strip. Reversible on Canberk's word.
- Written to `artifacts/sage/lead-history.json` (date, cluster id, publishers, score).
- Replaces Beat 4 gate "lead unchanged" with: lead changes only at the daily pick, never mid-day.
- Build order: lands inside Beat 7 (same commit as the Wire strip), with a manual pick run as proof, before the 06:11 crawl.

## Reviewer gate — Beat 8 drawer (8ec1c77) — PASS with 3 fixes (2026-09-25 01:35 Istanbul)
- Real click test (puppeteer, 1280x800): row click opens a 440px dialog, ?story= URL is set, the table stays visible, SELF is struck and last, Esc closes, focus returns to the row. Proof: refs/VISUAL-PROOF-beat8-drawer-click-reviewer.png.
- Fix 1: Pulse AGE column and drawer header use the newest item (enzyme shows 6h) while its earliest item is 28h. Use the earliest item, the same rule as the lead pick.
- Fix 2: the top status bar shows a raw id "LEAD CL:HN:49829670". Show the lead headline or a short label instead.
- Fix 3: "2 SRC" counts source classes, but the drawer shows 3 independent outlets (HN, Al Jazeera, Digital Watch). The lead rule says independent publishers, so the count should be publishers.

## Reviewer gate — Beat 9 (7f30ee5) + drawer fixes (bdb0a71) — PASS (2026-09-25 01:47 Istanbul)
- Beat 9: 21/21 tour steps in beat9-tour.log, including Ctrl/Meta/Alt/Shift+1 ignored and typing in the filter not switching lanes. Deviations accepted (j/k not on Digest, Shift+7 for / on Turkish Q).
- Re-ran my click test on live :3000: the enzyme drawer shows 3 SRC and AGE 28H, and the status bar reads "LEAD Anthropic says it's bio lab has found something big" with no raw id. All three Beat 8 fixes are verified.

## Run 2 — Beats 11–14 (added Sep 25 02:10, at Canberk's request)
Order 11, 12, 13, 14 after Beat 10 passes. Same rules: land = commit + before/after screenshot sent to Canberk; FAIL posted when it happens. Free sources only, Skin V2 tokens, Taste Pulse-only.

### Beat 11 — Lead log (Pip-Boy HOLOTAPES)
- New view from `lead-history.json`: one row per day with headline, publishers, score, and every excluded candidate with its reason (age, politics, listicle).
- The "Yesterday" line on the Brief links here.
- GATE: shows hf-incident (archived) + today's pick with real exclusions; opens with a key from Beat 9's map.

### Beat 12 — Phone layout (390px)
- Brief, Pulse and the drawer work at 390×844: the Wire strip stacks, the Pulse table drops to # / headline / SRC, and the drawer becomes a bottom sheet.
- GATE: screenshots at 390 and 1280 of Brief, Pulse and the open drawer; no sideways scroll.

### Beat 13 — Morning edition feed
- At the 06:11 pick, write `public/feed.xml` (Atom) and `public/morning.html`: the lead, the Wire, and the top 5 papers. Static files, no service.
- GATE: the feed validates (W3C validator or a feed parser test), and morning.html renders in the Skin V2 style.

### Beat 14 — Search across past crawls
- Keep every crawl's clusters in a local SQLite FTS index (bun:sqlite). `/` on Pulse gets an "all crawls" toggle.
- GATE: searching "enzyme" finds the story across crawls with first-seen time; index stays under 50 MB with a pruning rule.

Carry-overs: Scout's partisan-only politics keywords (UN AI-safety and "Newsom AI kill switch order" pass, Axios Trump-allies caught), investing/listicle filter, Beat 7 Wire gate on the 02:11 crawl, Beat 10 heat counts one crawl per 4h window.

## Reviewer gate — Beat 7 Wire from real crawls — PASS (2026-09-25 15:35 Istanbul)
- The 02:15 and 14:16 crawls (commits 2016b72, 0dffa0c) have different Wire contents: 3 of 5 rows changed. The lead stayed on "Anthropic bio lab" all day.
- FAIL-risk: the only 2026-09-25 lead is the forced 01:14 hand pick (the 06:11 pick never ran), and its first item is now ~39h old. The first GitHub Actions run must prove the scheduled pick.
- Soft: OpenAlex has failed 17 times in a row with HTTP 429, so it's effectively dead. Back it off or drop it in the CI crawl.
- Deploy gate I will run: a private window gets the login wall, and the built static output and client JS contain no Vyce key or its env name.

- [Reviewer] 2026-09-25 17:08 UTC+3 — B3a secret gate PASS (940134b): independent scan of out/ clean; cf-build push token header-only from env. [credential-hygiene note redacted for public repo; tracked privately].
- [Reviewer] 2026-09-25 17:25 UTC+3 — HELD retry + LEAD HELD view PASS (55251d1): 496/496; live :3000 status bar + INGEST read LEAD HELD, old headline absent from visible bars, plate outlined (no fill, solid border), kicker NEXT TRY 18:11, 0 hydration/console errors. Pending: real 18:11 retry evidence (attempts[]).
- [Reviewer] 2026-10-01 21:53 UTC+3 — CLOSED: HELD-retry real-crawl evidence PASS. lead-history.json: Sep 25 HELD after 2 attempts, then a real lead picked later the same day; Sep 27 HELD after 5 attempts; a lead was picked every day Sep 28–Oct 1.
- [Reviewer] 2026-10-02 07:57 UTC+3 — History purge PASS: fresh mirror clone (main, v0.1.0 only) has 0 commits touching sage-handoff/attachments and 0 object paths for the 6 files or the handoff tarball; the local working copy has no stale refs, stash or old objects that a push could bring back.
- [Reviewer] 2026-10-02 13:18 UTC+3 — GitHub Pages gate PASS (gh-pages, 6bb0303/5d5722c + font fix 057b3e2): live URL 14 requests, 0 >=400, 0 console errors/warnings, 0 requests outside /NEXUS_SAGE_grok/, 3 woff2 loaded, body JetBrains Mono + headers Share Tech Mono with real faces loaded; :3000 identical. Published tree: no secrets/env names/box paths; 124 x.com status links = same 124 already in repo src. Baseline for Beat 12: 390px still scrolls sideways by 82px. Soft: header CRAWL 08:04 vs Wire CRAWL 06:14.
- [Reviewer] 2026-10-02 13:42 UTC+3 — Beat 11 lead log (2ef1f69, Pages 668881e): PASS on layout — opens from the Take plate link at 1280 and 390, 0 page sideways scroll, 0 elements past the viewport, HELD 09-27 shows a dash for pubs/sig, SEED muted, 0 console errors. FAIL-pending: on a HELD day the Yesterday link (the only tap/click entry, desk.tsx ~L873) is hidden, so phones cannot open the log exactly when it explains the HELD.
- [Reviewer] 2026-10-02 18:52 UTC+3 — Beat 11 PASS (f467ef3): HELD/no-yesterday branch now renders a right-aligned → LOG with the same data-leadlog-link + openLog handler; normal-day branch unchanged; proof at 390 shows the link under the outlined HELD plate. Closes the 13:42 FAIL-pending.
- [Reviewer] 2026-10-03 06:56 UTC+3 — Beat 12 PASS (245b11c, Pages ece904a) at 390x844 touch: 0 sideways scroll and 0 unclipped elements past the edge on all 6 tabs; sticky = .desk-lane only, 90px (11%); 6 tab cells 44px; INGEST button tap/tap/Enter/Space = false>true>false>true>false; 1280 sticky topbar 183px, 0 sideways scroll; 0 console errors. Soft: at 390 the rail board renders above the Take plate, so the lead starts ~650px down.
- [Reviewer] 2026-10-03 13:53 UTC+3 — OPT win 2 PASS (3511c46): 550 tests in 1.93s lib / 2.07s full; git status --porcelain --ignored identical before/after; 0 cache-test dirs in artifacts/sage. Win 3 PASS on numbers per Coder (183 kB); note: page.tsx still passes all of lead-history.json (25 KB raw, 4.5 KB gz, attempts[] grows each crawl) to the page, outside desk-view and any cap.

- 2026-10-03 14:58 TRT · Reviewer · CAP GATE (desk-view + lead-log) PASS @ ff56e0e (gh-pages 7885c8b → 8bdf8c2): lead-history.json sha256 fdf9ac7e…d6eaa2, 25,246 B, unchanged on disk; page reads generated lead-log-view.ts; LEAD_LOG_CAPS (10d/6 passes/8 ✗, headline 140 vs max 118 in data) cuts nothing today; diff-390 shows only edge rails/LEDs; bun test 564 pass 2.89s, tree clean after run; live 200. Note: the byte budget drops 7 old fox-it posts from Pulse (disclosed). Beat 14 search must index the full artifacts, not desk-view.

- 2026-10-06 02:58 TRT · Reviewer · PAGES FONT FIX PASS (live) @ gh-pages dbbc232 / main 270c5ce: HTML uses __variable_0466e9 + __variable_0d0439, both defined in linked 1bbe7e3a70bd29a4.css; live font check body JetBrains Mono, header Share Tech Mono, both loaded (non-Fallback). git-credential-nexus-env reads gitignored .env, 0700, no token in repo or gh-pages. Open: 2 failing tests (desk-view trim, lead-log tape identical) depend on live crawl data and should run on fixtures; Architect's separate Pages distDir still to land.

- 2026-10-06 03:12 TRT · Reviewer · FIXTURE TESTS + PAGES distDir PASS @ main 659734b / gh-pages 231a339: bun test 577 pass 0 fail 3.26s, tree clean after run; live font check body JetBrains Mono + header Share Tech Mono loaded. Open: the flock on desk/.build.lock must sit in package.json "build" itself (every `next build` path, incl. crawl rebuilds), not only in pages-publish.sh.

- 2026-10-06 23:16 TRT · Reviewer · PASS D (engagement rail) PASS @ 0d0b330 (gh-pages cd783bc / build 0d0b330): Pulse+Papers headers UP; live HN UP 1178/786/523/299; GNW-only dim —; X likes ignored (pulse-v5 fixture); LEAD_TODAY still cl:hn:49969183 · 3 SRC · LEAD_HELD=false (live chrome HELD=age>24h); fonts OK; bun test 591 pass 0 fail after settle. Soft: 390 Pulse proof still stops in HEAT. Also confirmed LINK_MAX=2048 + NEXUS_BUILD_LOCK_HELD skip. F gate will require Gmail SRC chip ≠ GNW.

- 2026-10-06 23:40 TRT · Reviewer · PASS F (Gmail→Pulse) PASS @ fd3595a (gh-pages 637718f): live Pulse has 10 distinct GML SRC chips (≠ GNW); ingest gmail_news count=10 soft_fail=false briefEligible=false pulse_only; LEAD still cl:hn:49969183; footer stamp fd3595a; Pulse head still UP (D intact); DENY paid X in soft chrome. Soft: first viewport only showed 1 GML until SHOW ALL — proofs OK per UX. Holding C until UX already cleared + this stamp.

- 2026-10-06 23:55 TRT · Reviewer · PASS C (real dates) PASS @ 1a4ac4a (gh-pages fc437e8): live Papers header DATE with rows MM-DD matching HF/arXiv published (e.g. 2610.03120 → 10-02); Pulse+Wire fold `MM-DD · age` (static `MM-DD · HH:MM`, live relative); AgeCell missing → dim — (not today); LEAD_TODAY cl:hn:49969183 · LEAD_HELD=false · cycle 003; First Load JS ~182 kB (Coder)/under 185; UX look already clear; proofs refs/VISUAL-PROOF-pass-c-dates-*. Clear for B (stamp sync only).

- 2026-10-07 00:05 TRT · Reviewer · PASS B (Digest stamp sync) PASS @ f90b71b (gh-pages 6f38868): live DIGEST_CADENCE last_at=2026-10-06T19:20:17.030Z · next_at→04:20 IST · pack_id=2026-10-06T19 equals digest-last.json + packs/2026-10-06T19.json; Digest meters HOLD · NEXT DUE 04:20 · PACK 2026-10-06T19 · LAST TICK 22:20:17 UTC+3 (was Sep-stale 722h); titles still Eval agents / cycle 003 (no A); pass-b-digest-stamp 5/5 incl. coherence fail-closed; pages-coherence OK; First Load 182 kB per Coder. Soft: topbar ingest pack still shows 2026-09-06 (fancyTWEETS H=) — out of B scope. Clear for E alone.
