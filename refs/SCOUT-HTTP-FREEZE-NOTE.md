# Scout — HTTP freeze note (A4 meters PASS · FREE-PULSE HOLD)

**No new HTTP candidates.** Visual truth > more pipes.

**Brief:** SHIP-for-now. **A2/PACK:** `093002Z` PASS. **X-session taste:** LANDED. **A4 soft-fail meters:** **PASS** (Pulse FREE FEEDS · OpenAlex 429 soft live · DENY strip).  
**FREE-PULSE deepen:** HOLD for Canberk **1–4** or **GO default** → next WIRE = OpenAlex 429 backoff (`SCOUT-OPENALEX-429-BACKOFF.md` ready).  
Paid X API **DENY** · Bluesky **DENY** · Voice/Digest **PARKED**. Cron-less Bot routines cover A1/A2.

| Source | Status |
|--------|--------|
| Semantic Scholar | **DEFERRED** |
| HF `/papers` HTML | **DEFERRED** |
| Reddit | **BLOCKED** |
| Paid X API | **DENY** |
| Bluesky | **DENY** |
| X session taste | **LANDED** Pulse shelf · kept **8** · `briefEligible=false` |
| FREE-PROVIDERS Next | **FROZEN** until rank / GO default + Architect APPROVE |

## Desk snapshot (ages @ refresh)

| Item | State |
|------|-------|
| Locks | `003` · `hf-incident` · Sol≠Astra · free only · no `004` |
| Crawl | LIVE **`2026-09-11T09:29:29Z`** · age ≈ **0.9h** FRESH |
| Digest | HOLD → **`2026-09-11T15:20:40.008Z`** · `pack_id=2026-09-11T09` · ≈ **4.95h** to DUE |
| Dual-home | `sage-pack-003-20260911T093002Z` · sha256 `27131353…` · PASS |
| Soft-fail | **openalex: HTTP 429** |
| X taste | status=`landed` · paidApi=false · pulseLead=false |

## Soft-fail / provider table @ `2026-09-11T09:29:29Z`

| Provider | Stamp | Note |
|----------|-------|------|
| HF daily_papers | count=8 ok=True | — |
| arXiv | enriched=8 shelf=5 | — |
| OpenAlex | ok=False soft_fail=True enriched=0 | HTTP 429 · P1 backoff notes ready |
| Crossref | enriched=1 | — |
| HN / Lab RSS / Sec RSS | 47 / 48 / 26 | — |
| GitHub shelf / toolkit | 2 / 19 | — |
| Wikidata DENY | {'rejected_false_friend': 1, 'matched': 2} | — |
| X API | disabled | DENY |
| X session taste | kept 8 · Pulse shelf | never Brief |

Scout lane: freeze ages refreshed · OpenAlex P1 ready · **no** new HTTP candidates · waiting your free-pulse **1–4** or **GO default**.

## OpenAlex P1 land (Coder 2026-09-11)

`OpenAlex · soft_fail={bool} · enriched={n} · retries={n} · from_cache={bool}` — Retry-After/jitter ≤2 retries landed; stamp fields in `SCOUT-OPENALEX-STAMP-FIELDS.md`. P2/P3 HOLD.
