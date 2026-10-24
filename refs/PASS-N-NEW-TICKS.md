# PASS-N — "New since your last visit" ticks

Option 2 from the Oct 23 shortlist. One Coder pass. Page change, so the full page gates apply: Chrome check, overflow-390 clean, **First Load within ±200 B** of the branch base (currently 180,341 B). No CI config change, no data/crawl change, no new network call. Merge is Canberk's step; Reviewer verifies.

## N1 State (browser only)
- `localStorage["sage.lastVisit.v1"]` = `{ seen_at: ISO, keys: string[] }`. `keys` = the row keys (canonical URL, row id fallback — same key as PASS-W) on screen at the previous visit, capped at 400, newest first.
- Missing, unparsable or wrong-shape value → treated as first visit: **no ticks at all** (never tick everything).
- localStorage unavailable (private mode, throws) → no ticks, no error, page renders as today.

## N2 Rule
- A row gets NEW when its key is not in `keys` **and** its first-seen time is after `seen_at`. Both conditions; a re-dated old story never ticks.
- Applies to the Wire, papers and releases rows. Not to the Brief lead (lead rules unchanged), not to Gmail/X rows.
- State is written once per visit, after first render (`requestIdleCallback`/`setTimeout` fallback), so the ticks shown on this visit stay visible until reload.
- Re-reads on popstate like the Setup view; switching views doesn't rewrite state.
- Clock skew: `seen_at` later than now + 10 min → reset to first-visit behaviour.

## N3 Look
- A small `NEW` text tick using existing chip styles (no new font, image or CSS file). Screen readers get "new since your last visit" via visually-hidden text.
- No layout shift: the tick sits in the existing chip row; at 390 px width the row wraps, never overflows.
- Code lives in one small client module; no new dependency.

## Acceptance tests
1. Empty storage → zero ticks; state written after render.
2. Second visit with 3 new keys after `seen_at` → exactly those 3 ticked.
3. Key new but first-seen before `seen_at` → no tick.
4. Corrupt JSON / wrong shape → zero ticks, state replaced cleanly.
5. localStorage throws → page renders, zero ticks, no console error.
6. `keys` capped at 400, newest kept.
7. Lead, Gmail and X rows never ticked.
8. Ticks unchanged after view switch / popstate within the same visit.
9. `seen_at` in the future (>10 min) → treated as first visit.
10. overflow-390 clean with 20 ticked rows; Chrome check passes.
11. First Load within ±200 B of base; record before/after bytes in the PR note and `publish-proof.json`.
12. Accessible text present on each tick.

## N4 Rulings (Oct 23, after Coder's pre-build questions) — these override N1–N3 where they differ
1. **Reuse Beat 10.** No new `sage.lastVisit.v1` key. Beat 10's stored last-seen time is the baseline (`seen_at`). Its record gains an optional `keys` array (same cap 400, same row key as PASS-W), read-compatible: an old record without `keys` = "no ticks this visit, write keys". The amber divider stays as-is; ticks sit alongside it.
2. **Label/style:** a small amber dot (the Beat 10 divider's colour token, no new CSS) before the title, with visually-hidden text "new since your last visit". No text label, so it can't be confused with the existing NEW (latest-crawl) chip. A row can show both.
3. **Papers:** qualify on key-not-in-`keys` alone (no first-seen check, no data change). Rows that have first-seen times keep both conditions.
4. **Scope:** every Wire and Pulse row (incl. HN, RSS, ANL, REL) plus papers. Never the Brief lead, never Gmail or X rows.
5. **Test 11:** the PR note with before/after First Load bytes is enough; no publish-proof change. Base is now 180,247 B.

## N5 Rulings (Oct 23, after build ff2432e)
1. **First Load waiver:** the ±200 B rule is waived for PASS-N to a hard cap of **180,950 B** First Load (live/CI build). This is the same kind of recorded waiver as the C2 Mark 5 waiver. The waiver covers the page-side context, key hook, dot and old-record fallback only; tick logic and URL canonicalisation stay in the lazy chunk. Over 180,950 B means cut scope: drop the old-record fallback first (an old record then simply resets), then the papers lane.
2. **Base:** measure the delta against a local build of the branch base on the same machine (180,325 B, so +611 B). Report both the delta and the absolute number; the absolute cap above is what binds.
3. **Buffer through globalThis:** accepted. Every target browser has `atob`, so the Buffer path only runs in Node/tests. Add a one-line comment saying so; no polyfill on the page.
4. **Papers keys:** written add-only when the papers lane first opens. Accepted. Never remove keys on view changes; the 400 cap trims oldest.

## N6 Cap change (Oct 24 2026, 14:37 TRT)
Canberk raised the PASS-N First Load hard cap from 180,950 B to **181,050 B** (Pages/CI build). Old-record fallback cut per §N5.1; papers lane kept. Measured at push: Pages build 180,889 B.
