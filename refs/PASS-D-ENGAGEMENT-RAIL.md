# Pass D — Engagement rail (HN score + HF UP)

**Architect cut:** 2026-10-06 · Canberk order D→F→C→B→E→A (via Grok Bot)  
**Status:** PASS MARK · ready for Coder land  
**Owners:** Coder builds · UX signs off look · Reviewer gates  
**Prefer free.** DENY: paid X API · Bluesky · Brief pin / lead invention from engagement.

## Goal

One engagement number, same chrome on Pulse and Papers: free heat the reader can scan like Papers `UP` today. HN points feed Pulse; HF upvotes feed Papers. Missing scores soft-fail to dim `—`. Engagement never invents or changes a Brief pin or lead.

## Columns that change

| Lane | Today | After D |
|------|-------|---------|
| **Pulse** cluster table | Header `SIG` · cell = max member score (HN points **or X likes**) · dim `—` when null | Header **`UP`** (reuse `.pulse-v5-sig` / Papers UP chrome). Cell = max **free** engagement among members: HN Algolia `points` only. **Drop X likes** from this cell (paid X DENY; session taste stays on the Taste rail, never in `UP`). Soft-fail: null / non-finite → dim `—`, never invent `0`. |
| **Papers** table | Header `UP` · HF `upvotes` · sort by UP | **Unchanged** column and sort. Pass mark locks the parity: Pulse `UP` must match Papers `UP` type size, tabular align, and dim-`—` treatment. |
| **Brief / Wire / Digest / Voice** | — | **No column changes.** |

Pulse **row order** stays sources × members × freshness (not by `UP`). Papers **row order** stays by HF upvotes. Topic-heat strip (Beat 10) is untouched.

## Soft-fail (score missing)

1. A member or cluster with no HN points → Pulse `UP` shows dim `—` for that row (same as today's `sigCell` null path).
2. A paper with no HF upvotes → Papers `UP` shows dim `—` (or `0` only if the live HF API returned an explicit 0; do not invent).
3. HN Algolia soft-fail / empty hits → crawl and publish still succeed; Pulse `UP` is `—` where scores are absent. No new hard gate on "every row has UP".
4. Do not write `0` over a known prior score on hydrate (same rule as X likes hydrate elsewhere).

## No Brief pin invention

- Lead pick, HELD rules, cycle `003`, and any Brief pin stay on corroboration / existing autonomy rules.
- `UP` is display-only on Pulse. It must not re-rank Brief, invent a pin, or force a lead when corroboration is weak.
- Taste / X session engagement stays `briefEligible: false` and out of the Pulse `UP` cell.

## Pass marks (Reviewer on live Pages + `:3000`)

1. Pulse header reads `UP` (not `SIG`); Papers header still `UP`.
2. At least one live HN row shows a plain integer `UP` that matches that story's HN points in `hn-pulse` / desk-view.
3. A Pulse row with no HN member shows dim `—`, not `0`, and not an X like count.
4. Papers `UP` values and sort match pre-D for the same crawl (HF upvotes unchanged).
5. Visual: Pulse `UP` column aligns with Papers `UP` (tabular, right-ish, same phosphor treatment); Skin V2 only; 0 sideways scroll at 390.
6. Brief Take / lead / HELD unchanged for the same crawl data (no new pin, no lead swap caused by D).
7. Tests: fixture covers HN points → `UP`, missing score → `—`, X likes present on a member but **ignored** for `UP`.
8. First Load JS stays under the 185 kB gate; desk-view caps unchanged.

## Proof

Before/after of Pulse (SIG→UP) and Papers (unchanged UP) at 1280 and 390 → Grok Bot for Canberk. Label files `refs/VISUAL-PROOF-pass-d-engagement-{pulse,papers}-{before,after}-{1280,390}.png`.

## Out of scope (later letters)

| Letter | Note |
|--------|------|
| F | Gmail keyword search — see PASS-F-GMAIL-NEWS.md |
| C | Dates |
| B | Digest UI stamp |
| E | Session taste only — see PASS-E-SESSION-TASTE.md |
| A | Cycle unlock — Digest titles vs `CYCLE.003` (Architect unlock policy later) |

## Land order

Coder lands D alone. UX look pass, then Reviewer gate. Do not bundle C/B/E/A into this commit.
