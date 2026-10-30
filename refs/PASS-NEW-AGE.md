# PASS-NEW-AGE — Wire NEW never on stale stories

**Proof (live):** build `03e3ec8-202610301821` · Reviewer `/workspace/review-hn-bar-2026-10-30/text.txt` lines 149–153: header `WIRE · … · 3 new · 2 moved` while top row is `NEW` + `10-29 · 31h` ("Le Chonk…").

**FAIL:** Crawl-delta NEW chip (`pulse-v5-new` / `data-status="new"`) marks stories that are **new vs previous crawl** even when published age is **>24h**. Top Wire looks "fresh" while the clock says 31h. HuggingNews does not do that.

**Goal:** NEW on Brief Wire (and the "N new" header count) only for rows whose **publish/age clock is <24h**. Older rows can still appear and can still show ▲ moved — they just are not NEW. Free only. No CI config change. First Load ≤ 185,000 B and ±200 B of local base (likely tiny page logic). overflow-390 clean. One Coder pass.

## Scope
- Brief **Wire** crawl-delta NEW chip and the Wire head count `N new`.
- Same rule on Pulse Wire if it shares the chip (keep one helper).
- Does **not** change PASS-N last-visit amber dots (Beat 10).
- Does **not** hide old rows; only strips NEW / excludes them from the new-count.

## Rule
A row may show NEW (and count toward `N new`) iff:
1. It qualifies as new vs previous crawl (existing logic), **and**
2. Its displayed age basis (`data-age-at` / publish time used for `Xh` / `10-29 · 31h`) is **strictly < 24h** at crawl/render time.

If (1) holds but age ≥ 24h: render without NEW; do not increment `N new`. Moved markers unchanged.

## Proof
- Fixture / live: a row with age 31h that is new-to-crawl → no NEW chip; Wire head `N new` drops by one vs today.
- Rows with age 2h / 6h that are new-to-crawl → still NEW.
- PASS-N amber dots unchanged.
- First Load / overflow-390 / no CI config diff.

## Out of scope
- Changing crawl cadence or seen-index persistence.
- Past-24h TL;DR strip (already age-bounded).
- PASS-WIRE-CLUSTER (separate; merge may remove the 31h duplicate entirely).

## Order
After PASS-NOISE. Prefer after or with PASS-WIRE-CLUSTER (cluster merge may delete the worst offender; this gate still needed for the next stale NEW).
