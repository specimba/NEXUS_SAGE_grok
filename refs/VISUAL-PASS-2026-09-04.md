# Visual PASS — :3000 Skin V2 (2026-09-04)

## Root cause
Stale `next start` served old amber/frontpage markup. Source already had Skin V2; process never rebuilt.

## Stamp-chrome acceptance (UX)
- **LIVE:** `crawl {CRAWL_AT}` + `PULSE LIVE` (current: `2026-09-04T09:52:21Z`)
- **Demoted:** `cyc {CYCLE.compiledAt}` (`2026-09-03T05:40:00Z`) — identity only, never LIVE
- **Pack:** `PACK_AT` ← digest-last (`09:21:50Z`), not compile stamp
- **Guard:** `bun run visual:check` · phosphor · `[01]`–`[06]` · crawl present
- No token hex churn

## Browser proof
- Early PASS: `refs/VISUAL-PROOF-after.png`
- Green-B shipped: `refs/VISUAL-PROOF-green-B-shipped.png` (KPI bento · `Δ LIVE` · 8/4)
- Before fail: `refs/VISUAL-PROOF-before.png` — gray pills / `05:40Z` as LIVE

## Locks
`003` / `hf-incident` · Sol≠Astra · HTTP freeze · no `004`

### Reviewer stamp — Visual PASS 10:02Z · Green-B PASS ~10:37Z
Hold: Take = story · KPIs = meters · gray-pill / stale crawl stamp = FAIL.
