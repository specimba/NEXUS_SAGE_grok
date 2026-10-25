# UX-NEXT-4: five new upgrades you can see

UX Gürok · 2026-10-25 TRT · captured live gh-pages at 21:21 TRT (crawl 21:20), 1280×800 and 390×844@2x.
Mockups are live pages with injected markup that uses only Skin V2 variables (`--phosphor*`, `--line`, `--bg-deep`, `--muted-foreground`, `--pip-amber`). There are no new hex values. Injector: `refs/ux-next-4/mock-inject.js`. Mock copy and numbers marked *(illustrative)* are placeholders, not crawl data.
None of these repeats landed work (clearance plate, day tape, patch bay, PASS-L/N/F2/W/S1/A2/C2, Brief V5).

**First Load budget.** The gate is `desk/scripts/first-load.cjs`, with a cap of 185,000 B. The PASS-N §N6 working cap is 182,000 B, against a recorded base of 180,247 B (refs/PASS-N-NEW-TICKS.md). I did not rebuild, so I have no fresh live number. Ideas 1–5 add about +1.15 kB to `/` combined, which leaves about 600 B of headroom under 182,000 B. Ideas 3 and 4 live in lazy chunks and cost about 0 on First Load.

| # | Idea | Lane | First Load Δ |
|---|---|---|---|
| 1 | Lane counter rail | all, mostly 390 | +0.35 kB |
| 2 | Pulse scan strip | Pulse | +0.45 kB |
| 3 | Papers shelf + upvote spines | Papers | ~0 (lazy) |
| 4 | Voice cue sheet | Voice | ~0 (lazy part) / +0.1 kB |
| 5 | Governance verdict ledger | Governance | +0.25 kB |

---

## 1. Lane counter rail (each lane shows its count, one row at 390)
**Problem.** At 390 the six `[0N] NAME` tabs take two rows, about 105 px, and the lane content starts near y≈400 of 844. The tabs also say nothing about what is inside each lane.
**Proposal.** One six-cell rail. Each cell shows its short name (GOV at <768) and a live count: Brief `+N overnight`, Pulse `+N new since`, Digest `HOLD`/`DUE`, Papers row count, Voice `READY`, Gov deny count. The active cell is solid `--phosphor`, inactive cells use `--muted-foreground`, and it is sticky at the top on scroll. At 390 the INGEST line folds into the existing ▾ details.
**Creative upside.** The tab bar becomes a morning dashboard, so you can see where things changed before you open a lane. It works with PASS-N ticks by reusing their counts.
**Build (one pass).** `desk.tsx` lane nav map, `globals.css` `.lane-rail`, `.lane-rail-count`, `position:sticky`. Counts come from existing `DESK_VIEW` fields (new-since, digest status, papers length, governance deny length).
**Acceptance.** All six cells fit on one row at 390 with no wrap past x=390. The active cell uses phosphor and inactive cells use `--muted-foreground`. Sticky holds when scrolled. Lane content moves up by at least 50 px at 390. The 1280 layout is unchanged apart from the counts.
**Mocks.** `refs/ux-next-4/pair-lanes-390.png`, `pair-lanes-1280.png`.

## 2. Pulse scan strip (source health as an instrument, not error text)
**Problem.** The source grid prints raw errors such as `TIMEOUT AFTER 30000MS BUDGET · LAST GOOD: 0 CACHED…` in amber. At 390 one cell is eight lines tall and pushes the grid to about 450 px. Amber is the rarest color on the skin, and here it is spent on plumbing.
**Proposal.** Replace the grid with a one-panel SCAN strip. It has a header (`SCAN · 21:20 · 7/9 SOURCES LIVE`), one amber chip for the off sources (`2 OFF · LAB ARX ▸`, with the full reasons in `<details>`), a bar-per-source histogram of today's counts, and a MOVERS line built from the heat windows (the biggest ▲/▼ first, plus a dim "quiet" source).
**Creative upside.** Pulse reads as a radar sweep at a glance, and amber shows up exactly once, when it matters.
**Build.** `desk.tsx` `Pulse()` source-row block, `globals.css` `.pulse-scan`, `.pulse-scan-bar` (height from count). Data: existing source counts and `soft_fail_reason`. No new crawl field.
**Acceptance.** At 390 the strip is 280 px or less. No error string is visible before the chip is opened. At most one amber element is in the strip. The histogram labels don't overlap at 390. Overflow-390 stays clean.
**Mocks.** `pair-pulse-390.png`, `pair-pulse-1280.png`.

## 3. Papers shelf + upvote spines
**Problem.** Papers is a 27-row flat table. The UP number is the only signal, and nothing tells you what to read first.
**Proposal.** Put a "today's 3" shelf above the table: cards with rank, topic tag, `▲N`, a full-width phosphor bar scaled to the top score, a wrapped title (never clamped), and ABS/PDF links. In the table, the UP number gets a thin inline spine bar so the falloff in scores is visible.
**Creative upside.** Discovery replaces bookkeeping. At 390 the shelf stacks as three cards, which reads like a reading list.
**Build.** `Papers()` in `desk.tsx` (lazy chunk `desk-view-papers`, so 0 on First Load). Add `.papers-shelf` and `.papers-spine` to `globals.css`. The topic tag uses an existing badge or category if present; otherwise drop the tag.
**Acceptance.** Shelf titles wrap fully at 390 and 1280. The bar width is proportional to UP. Table rows keep `data-row-clamp`. Shelf cards stay inside x=390.
**Mocks.** `pair-papers-390.png`, `pair-papers-1280.png`.

## 4. Voice cue sheet (script as a timed rundown)
**Problem.** In SCRIPT · STORY, TAKE repeats the headline word for word, and MOVE is cut off with `truncate` at 390 ("Digest/Voice follow Brief lead…"). It doesn't read like something you would say out loud.
**Proposal.** Show the script as a cue sheet: HOOK / TAKE / WHY / MOVE rows, each with an estimated timestamp (words ÷ 2.6 w/s), a word count, a total runtime, and a segment bar under it. TAKE is required to differ from the headline; if it is the same, show `TAKE = HEADLINE` as a dim warning.
**Creative upside.** Voice becomes a producer's rundown, and the duplicate TAKE becomes visible.
**Build.** `Voice()` in `desk.tsx` around L2584: drop `truncate` on `voice-move`, wrap it, and add a `.voice-cue` grid. Durations are computed client-side from `script.*`, so no data change.
**Acceptance.** MOVE wraps fully at 390. Timestamps don't wrap. Total words equal the sum of the rows. The bar segments are proportional.
**Mocks.** `pair-voice-1280.png`, `pair-voice-390.png`. Script lines in the mock are *(illustrative)*.

## 5. Governance verdict ledger
**Problem.** ALLOW / DENY / OPEN are three equal boxes of bare phrases. It isn't clear how much the desk refused, or why.
**Proposal.** Add a ledger header: a stacked bar (phosphor allow / pip-amber deny / outline open), the counts, and the Wikidata tally. Under it go the top deny and top open, each with its rule or wait reason in dim text. The three boxes stay below as detail.
**Creative upside.** Governance becomes a single verdict line you can read in about 2 seconds.
**Build.** `Governance` block in `desk.tsx` around L2700, plus `.gov-ledger` in `globals.css`. Counts come from existing arrays. Rule and reason text need a short optional `why` field. Without it, show only the counts.
**Acceptance.** The bar is proportional to the counts. It uses only the existing amber token. The header is 200 px or less at 390. If `why` is missing, nothing is invented.
**Mocks.** `pair-governance-390.png`, `pair-governance-1280.png`. The rule and wait text are *(illustrative)*.

---
Suggested order: 1 → 2 → 4 → 3 → 5. Each is one Coder pass, and Reviewer gates each with visual:check, overflow-390 and first-load.cjs.
