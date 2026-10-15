# UX-NEXT-3 §1 — Clearance plate: build proof (branch ux-clearance, base origin/main fbd9be8)

**What shipped.** The picked plate's grey meta line is replaced by a **gate rail** (`N SRC ≥2` · `<pub> own publisher` ·
`<24h fresh` + dashed `sig N`) and a **time bar** (`picked 06:21 ▮▮▮▯▯ next pick 06:11 · 5h 55m`, fill = elapsed/total).
HELD and stale days get the **SIGNAL HOLD** test card: reason line, closest candidate (or the carried lead when stale),
its rail with exactly one amber gate (the one that failed), a retry bar (`held 06:11 … next try 10:11`), and
`last pick · <date> → log` (≥44px tap, opens the lead log).

**New crawl fields** (lead-pick → lead-history.json → src/data/lead-pick.ts → desk-view.ts)
- `excluded[].sources`, `excluded[].age_h`, `excluded[].pub`: N SRC, whole hours of story age, own-publisher label of each ruled-out group (and in `attempts[].excluded`).
- `entry.pub`: own-publisher label of the picked story (desk-view falls back to the live group, then the lead item named by the cluster id, never a GNews item).
- `LEAD_LAST_PICK` (lead-pick.ts, from `lastPickDate(history)`): date of the latest real pick, skipping HELD entries.
- `LEAD_CLOSEST` (desk-view.ts, HELD days only): first ruled-out record of the latest attempt, `{headline, reason, sources?, age_h?, pub?, at}`. Never Gmail / X / Taste.

**Shots** (headless Chrome, `--now` fakes the page clock)
| state | data | before | after |
|---|---|---|---|
| picked | real crawl 21:21, now 00:16 UTC+3 | before-picked-{1280,390}.png | after-picked-{1280,390}.png |
| HELD (GNW only) | real-crawl HELD fixture, now 08:39 UTC+3 | before-held-{1280,390}.png | after-held-{1280,390}.png |
| stale (>48h) | real crawl, now 15:00 UTC+3 | before-stale-{1280,390}.png | after-stale-{1280,390}.png |
| HELD (age ≥36h) | real-crawl HELD fixture | — | after-held-age-{1280,390}.png |
| HELD (nothing ≥2 SRC) | real-crawl HELD fixture | — | after-held-none-{1280,390}.png |

Mockup pairs: pair-mock-vs-build-{picked,held}-{1280,390}.png (mock left, build right).

**HELD fixture = real data.** `src/lib/__tests__/fixtures/lead-hold.ts` runs the real picker on the real crawl
(PULSE_CLUSTERS 2026-10-15T18:21Z) with its eligible stories taken out, attempted the day after the real last pick
(LEAD_TODAY 2026-10-15). Every headline, N SRC, age and reason comes from the real groups (fixtures.txt).
`bun scripts/lead-hold-fixture.ts [gnw|age|none]` writes it into desk-view.ts for a proof build; `bun scripts/desk-view.ts` restores.

**Logs.** test-full.txt (733 pass) · test-clearance-plate.txt (31 new) · tsc.txt · eslint.txt · desk-view-check.txt ·
visual-check-after.txt / visual-check-held-gnw.txt (font-check + overflow-390 on 6 lanes + setup) ·
overflow-390-{stale,held-age,held-none,held-gnw-0839}.txt · build-*.txt · first-load.txt (178603 → 179189 B).
