# Scout — HTTP freeze note (P4 LANDED · P5–P6 HOLD · 2026-09-11)

**FREE-PULSE:** P1 OpenAlex **PASS** · P2b RSS **PASS** · P3 HN **PASS** · **P4 GitHub tighten LANDED** · **P5–P6 HOLD**.  
Paid X API **DENY** · Bluesky **DENY** · never Brief · Voice/Digest **PARKED**.

| Lane | Status |
|------|--------|
| OpenAlex | P1 backoff PASS · soft=True · HTTP 429 |
| Lab/HF + Scout RSS | P2b PASS (Mistral · NVIDIA×2 · MSR · Google Research) |
| HN | P3 PASS · rotate ≤3/tick · `SCOUT-HN-P3-QUERIES.md` |
| GitHub shelf | **P4 LANDED** · ≤1/tick · 24h cache · Remaining-0 skip · `SCOUT-GITHUB-P4-RATE.md` |
| X session taste | LANDED · kept 8 |
| P5–P6 spice | **HOLD** |

## Ages @ refresh

| Item | State |
|------|-------|
| Locks | `003` · `hf-incident` · Sol≠Astra · free only · no `004` |
| Crawl | **`2026-09-11T09:29:29Z`** (ages refresh on next A1) |
| Digest | HOLD → **`2026-09-11T15:20:40.008Z`** · `pack_id=2026-09-11T09` |
| Soft-fail | **openalex: HTTP 429** |
| GitHub | P4 tighten · cache-first · soft_fail honest on 403/429 |

Scout: freeze ages + P4 rate notes · **no** unapproved HTTP · P5–P6 HOLD.
