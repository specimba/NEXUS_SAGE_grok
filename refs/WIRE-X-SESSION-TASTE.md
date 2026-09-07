# X session taste — APPROVE-ready contract (NO paid API)

**Architect cut:** 2026-09-07 ~06:08Z  
**Trigger:** Canberk — paid API DENY does **not** ban X; VM has his logged-in X profile (bookmarks · likes · home feed) for AI-news taste.  
**Status:** **CONTRACT ONLY** — no land until Director GO + Reviewer FAIL-list + first dry-run  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · `briefEligible: false` · no `004` · Brief pins never from this pipe

## Distinction (hard)

| Path | Status |
|------|--------|
| Paid X API / bearer / Ads / `api.x.com` hydrate | **DENY** (unchanged) |
| Bluesky | **DENY** (unchanged) |
| Nitter / scrape farms / stolen cookies minted as API tokens | **DENY** |
| **Box browser, Canberk’s already-logged-in X session** — read bookmarks, likes, home/Following for AI-news priority | **CANDIDATE** (this contract) |

## Intent

Learn **operator taste** (what Canberk bookmarks/likes/sees) → Pulse “respectful AI news” ranking / watchlist hints — **never** Brief lead, never invent cycle.

## Surfaces (read-only)

1. Bookmarks (AI-relevant only)  
2. Likes (recent, AI-filtered)  
3. Home / Following feed slice (top N, AI-filtered)  

**Never:** post, like, retweet, DM, change settings, export credentials, dump cookies to disk for reuse as API keys.

## Implementation shape (when APPROVED)

- Driver: box **Chrome** via existing Chrome DevTools / computerUse — session already present  
- Output: `artifacts/sage/x-taste-last.json` (+ stamp in ingest-last) — ids, URLs, text snippets, labels `bookmark|like|feed`, `briefEligible:false`  
- Cadence: weekday Istanbul window only (same spirit as A1–A3) — not overnight firehose  
- Soft-fail: login wall / challenge / empty → stamp skipped, desk still boots  
- Filter: keyword/allowlist for AI/ML/security research (Scout supplies list)

## Done-when (Reviewer)

| # | Pass |
|---|------|
| 1 | No bearer / no `api.x.com` / no cookie-to-token |
| 2 | Read-only (no write actions on X) |
| 3 | `briefEligible:false` · Brief pins / `003` / `hf-incident` unchanged |
| 4 | Soft-fail stamped if session dead |
| 5 | Dual-home unaffected unless we explicitly pack taste file (optional) |
| 6 | Weekday window only |

## Non-goals

Paid API · Bluesky · replacing HN/HF · Voice/Digest land · automated posting

## Architect hold

No implement until Director GO. Prefer **after** first A2 unattended WROTE (~09:58 Istanbul) so Track A stays clean.
