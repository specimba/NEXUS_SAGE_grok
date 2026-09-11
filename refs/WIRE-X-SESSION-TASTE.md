# X session taste — APPROVE-ready contract (NO paid API)

**Architect cut:** 2026-09-07 ~06:08Z  
**Trigger:** Canberk — paid API DENY does **not** ban X; VM has his logged-in X profile (bookmarks · likes · home feed) for AI-news taste.  
**Status:** **LAND GO** 2026-09-11 ~09:40Z — dry-run #2 Reviewer PASS · taste cards / data sync now (Pulse shelf only)
**Deps locked:** Scout allowlist `SCOUT-X-TASTE-ALLOWLIST.md` · Reviewer FAIL list 1–8 (in-room) · UX `UX-PULSE-X-TASTE-CARDS.md`  
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


## Architect APPROVE stamp — 2026-09-07 ~06:16Z

**YES** — signed-in VM X session taste (bookmarks · likes · feed), read-only.

| Gate | Status |
|------|--------|
| Scout allowlist | LOCKED (`SCOUT-X-TASTE-ALLOWLIST.md`) |
| Reviewer FAIL 1–8 | LOCKED (in-room) |
| UX Pulse placement | LOCKED (`UX-PULSE-X-TASTE-CARDS.md`) — shelf below HN/RSS · never lead |
| Paid API / Bluesky / cookie→token | DENY |
| **Land** | **HOLD until A2 first WROTE PACK PASS** — then Coder `x-session-taste` dry-run |

Director GO order honored: A2 proof first · then this wire.

## Soft-fail skip stamp — Architect GO 2026-09-07 ~07:04Z

**YES** — land `x-taste-last.json` + ingest soft-fail path for `login_wall` / empty → **skipped**, desk boots, `briefEligible:false`.  
Full scrape still **HOLD** until Canberk X session live + dry-run PASS.  
No cookie dump · no paid API · no X writes · no Brief lead.  
`FREE-PULSE-DEEPEN` + HTTP freeze still wait Canberk rank 1–4.

## Dry-run #2 — 2026-09-11 (Coder)

Session alive · kept 8 after allowlist · `briefEligible=false` · evidence in `X-SESSION-TASTE-DRY-RUN.md`.  
**Land gate:** Reviewer PASS on dry-run #2 → then UX taste cards may land · weekday Bot-routine optional.  
FREE-PULSE deepen still waits Canberk **1–4** or **GO default**.


## Architect LAND GO — taste cards 2026-09-11 ~09:40Z

**YES** — land Pulse taste shelf from dry-run #2 (8 kept · allowlist · never Brief/lead).

| Still HOLD | |
|------------|--|
| FREE-PULSE deepen / new HTTP WIRE | until Canberk **1–4** or **GO default** |
| If GO default | next WIRE = **OpenAlex 429 backoff** (`FREE-PULSE-DEEPEN` P1) |
| Paid X API · Bluesky · cookie→token · Voice/Digest | DENY / PARKED |
