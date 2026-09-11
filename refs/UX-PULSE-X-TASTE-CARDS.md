# UX — X-session taste cards on Pulse (never lead)

**Date:** 2026-09-07 · **Craft:** PARKED until A2 stamp + Architect APPROVE land  
**Locks:** paid X API DENY · Bluesky DENY · `briefEligible:false` · `pulseLeadEligible:false` · never Brief pin · `003`/`hf-incident`

## Correction (Canberk)

Paid API DENY ≠ no X. **Signed-in VM X** (bookmarks · likes · feed) = operator taste. UI must make that distinction obvious.

## Where it lands (Pulse only)

```
Pulse lane (existing)
├─ header · crawl snap
├─ HN chatter          ← free HTTP (unchanged)
├─ Lab / Sec RSS       ← free HTTP (unchanged)
├─ ★ TASTE · operator X-session   ← NEW shelf (below free feeds)
│    · chips: bookmark | like | feed
│    · source kicker: session · read-only · never lead
│    · empty/soft-fail: “session quiet / login wall” (no fake hits)
└─ shelf / github      ← stays demoted
```

**Not:** Brief Take · pin stack · Pulse “lead” · topbar PULSE LIVE conflated with X hydrate.

## Card anatomy (Skin V2)

- **Quiet panel** (`pin-card-quiet` energy) — denser than Take, dimmer than lead frame  
- **Badge:** `taste · bookmark|like|feed` in mono kicker (amber scarce)  
- **Title:** post text line-clamp-2  
- **Meta:** handle · when · match keyword (from Scout allowlist)  
- **Footer chip:** `briefEligible:false` · `pulseLeadEligible:false`  
- **DENY chrome nearby:** paid API / bearer / Ads — so taste ≠ hydrate

## Hierarchy (still-readable)

1. Free feeds (HN/HF/RSS) = primary Pulse body  
2. Taste shelf = **secondary instrument** — “what Canberk cared about”  
3. Soft-fail meter (future A4) can show `X session skipped` without inventing cards

## Ranking (when Coder lands JSON)

- Allowlist keyword hit → show  
- Bookmark > like > feed (same keyword) for sort  
- Cap ~5–8 visible; rest behind “more taste” fold — no firehose wall

## Done-when (UX + Reviewer)

| # | Pass |
|---|------|
| 1 | Taste cards only under Pulse · never Brief / never pin rail |
| 2 | Visual DENY for paid API still present |
| 3 | Soft empty state when session quiet — no placeholder “AI news” |
| 4 | Skin V2 hexes only · no token soup · no Bluesky affordance |

## Non-goals

Hex churn now · Voice/Digest · inventing Brief pins · cookie jars in UI · overnight taste ticker

## Empty / skip chrome (landed 2026-09-07)

Pulse section **Taste · operator X-session** below Lab RSS:
- `login_wall` / skipped → quiet `pin-card-quiet` panel · `sage-deny` reason · kept 0 · `briefEligible=false` · land HOLD
- Items path ready (cap 8) but full scrape still HOLD until Canberk X **done**
- No hex churn · Skin V2 classes only

### Reviewer stamp — 2026-09-07T07:40Z (Reviewer Gürok)

**Empty/skip taste shelf PASS** — never lead · briefEligible=false · login_wall quiet panel. Full cards HOLD.

## Land (2026-09-11) — dry-run #2 PASS

Synced `src/data/x-taste.ts` from `x-taste-last.json` — kept 8 · skipped false · land GO.
Pulse shelf renders quiet cards (bookmark|like|feed) · never Brief · never lead.

### Reviewer stamp — 2026-09-11T09:44Z (Reviewer Gürok)

**Taste cards LAND PASS** — 8 kept · Pulse shelf · never lead. Dry-run #2 PASS closed.
