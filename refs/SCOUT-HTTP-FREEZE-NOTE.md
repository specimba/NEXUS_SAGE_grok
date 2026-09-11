# Scout — HTTP freeze note (WIRE-LAB-HF-RSS-P2 PASS · 2026-09-11)

**No new HTTP candidates** beyond APPROVED P1–P2. P3 **HOLD**.

**Brief:** SHIP-for-now. **A4 meters:** PASS. **X-taste:** LANDED (Pulse shelf).  
**FREE-PULSE P1:** OpenAlex backoff PASS. **P2:** lab/HF RSS per-feed soft_fail PASS (Phase A; Phase B skipped — no candidates table).  
**Next:** Canberk continue **→3** (HN deepen) or stop. Paid X API **DENY** · Bluesky **DENY** · Voice/Digest **PARKED**.

| Source | Status |
|--------|--------|
| OpenAlex | **P1 backoff LANDED** · soft_fail=True · enriched=0 · retries=(stamp on next A1) |
| Semantic Scholar | **DEFERRED** |
| HF `/papers` HTML | **DEFERRED** |
| Reddit | **BLOCKED** |
| Paid X API | **DENY** |
| Bluesky | **DENY** |
| X session taste | LANDED · kept 8 · never Brief |
| FREE-PULSE P2 | **PASS** Phase A · Phase B skipped |
| FREE-PULSE P3 | **HOLD** |

## Desk snapshot (ages @ refresh)

| Item | State |
|------|-------|
| Locks | `003` · `hf-incident` · Sol≠Astra · free only · no `004` |
| Crawl | LIVE **`2026-09-11T09:29:29Z`** · age ≈ **1.29h** FRESH |
| Digest | HOLD → **`2026-09-11T15:20:40.008Z`** · `pack_id=2026-09-11T09` · ≈ **4.56h** to DUE |
| Dual-home | `sage-pack-003-20260911T093002Z` · PASS |
| Soft-fail now | **openalex: HTTP 429** |
| bun | 169 · `visual:check` OK |

## Soft-fail / provider table @ `2026-09-11T09:29:29Z`

| Provider | Stamp | Note |
|----------|-------|------|
| HF | count=8 | primacy intact |
| arXiv | enriched=8 shelf=5 | — |
| OpenAlex | ok=False soft_fail=True enriched=0 from_cache=False | HTTP 429 · backoff wired |
| Crossref | enriched=1 | — |
| HN / Lab / Sec RSS | 47 / 48 / 26 | — |
| GitHub / toolkit | 2 / 19 | — |
| Wikidata | {'rejected_false_friend': 1, 'matched': 2} | DENY grounding |
| X API | disabled | DENY |
| X session | kept 8 | Pulse shelf only |

Scout lane: freeze ages refreshed · stamp fields in `SCOUT-OPENALEX-STAMP-FIELDS.md` · **no** new HTTP candidates · P2/P3 wait Canberk.
