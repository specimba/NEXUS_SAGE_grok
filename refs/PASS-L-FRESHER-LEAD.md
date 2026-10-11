# Pass L — Fresher lead (fewer HELD days, no mid-window churn)

**Architect cut:** 2026-10-11 · Canberk approved (via Grok Bot)  
**Status:** PASS MARK · Coder builds **after phase 2 polish lands** · then C (feed/taste controls) → D (Beat 13 morning Atom)  
**Free only.** No new providers. No extra GitLab runs: uses the existing 4 slots (06:11 / 11:11 / 16:11 / 21:11 TRT). DENY: cycle `004` · mid-window swaps of a live lead · inventing leads.

## Why it goes HELD today (from `lead-pick.ts`)

Two separate 24h rules stack up:

1. **Pick gate:** a candidate must be under 24h old (earliest item) at the 06:11 pick. Good stories from yesterday morning miss it, so the result is `age>=24h` and HELD.
2. **Render rule:** `leadIsStale` shows HELD once the picked story passes 24h of age. A lead picked at 06:11 whose first item is 20h old flips to HELD around 10:00 the same morning.

Rule 2 causes most of the HELD time. It ages out a lead that was valid when picked.

## Policy

| # | Rule |
|---|------|
| L1 | **Pick window 36h.** Candidates qualify under 36h old (earliest item). They're ranked in two tiers: under 24h first, then 24–36h. Inside a tier, the existing order applies (sources → SIG → newer). ≥2 SRC and the Wire gate stay unchanged. |
| L2 | **Freeze from pick time, not story age.** A picked lead stays the lead until the next day's pick. It never goes HELD just because the story ages. `leadIsStale` becomes: no pick for today **or** story age > **48h** (a safety net, not the normal path). |
| L3 | **16:11 recovery pick, HELD days only.** If the date is still HELD at the 16:11 slot, that run picks with the same L1 rules. (Retries already run each slot ≥06:00. L3 just confirms 16:11 as the planned second chance and the last one of the day: 21:11 doesn't retry.) |
| L4 | **No churn.** A date that has a real pick never re-picks (unchanged). Digest/Voice titles change only at a pick event: 06:11, or the 16:11 recovery when the day was HELD. A HELD→picked change is a pick, not churn. |
| L5 | **Honest age.** The Brief Take kicker shows the story's age band (`<24h` / `24–36h`) so a 30h-old lead reads as such, never as "fresh". |

## Budget

0 extra runs or minutes. L3 rides the existing 16:11 slot.

## Pass marks (Reviewer)

1. Fixture: best story 30h old, nothing under 24h → picked (tier 24–36h), not HELD.
2. Fixture: one candidate at 20h and one at 30h with more SRC → the 20h one wins (tier first).
3. Fixture: a lead picked at 06:11 with story age 20h is still the lead at 21:11 (no HELD at 24h). HELD only past 48h.
4. Fixture: HELD at 06:11 and 11:11, a qualifying story at 16:11 → picked at 16:11, and Digest/Voice titles follow. A picked date never re-picks at 16:11 or 21:11.
5. Fixture: a 21:11 crawl on a HELD date does not pick.
6. Kicker shows the age band. The lead log (Beat 11) records the tier and the pick slot.
7. Live: across the first 3 days after the land, HELD time is clearly down vs the week before (Reviewer reads `lead-history.json`). Cycle `003` and the unlock rules stay unchanged.
8. 185 kB gate, overflow-390 and the existing HELD / not-HELD / archive fixtures stay green.

## Out of scope

New sources · more slots · changing ≥2 SRC or the Wire gate · C/D (next in order).
