# Scout — HTTP freeze note (FREE-PULSE P1–P5 · 2026-09-11)

**FREE-PULSE core closed green:**  
P1 OpenAlex backoff **PASS** · P2b lab/HF+Scout RSS **PASS** · P3 HN deepen **PASS** · P4 GitHub shelf tighten **PASS** · P5 Google News RSS **LANDED**.  
**P6 spice HOLD** (Lobsters/dev.to) until Canberk or explicit Director GO.

Paid X API **DENY** · Bluesky **DENY** · never Brief · Voice/Digest **PARKED** · X-session taste **LANDED** (Pulse shelf).

| Lane | Status |
|------|--------|
| OpenAlex | P1 PASS · soft=True · HTTP 429 · enriched=0 |
| Lab/HF + Scout RSS | P2b PASS |
| HN | P3 PASS · rotate ≤3/tick |
| GitHub shelf | P4 PASS · cache-first · ≤1 search · soft_fail=False shelf=2 from_cache=False |
| X session | kept 8 · never Brief |
| Google News RSS | P5 **LANDED** · rotate ≤2/tick · soft_fail · never sole lead |
| P6 | **HOLD** |

## Ages @ refresh

| Item | State |
|------|-------|
| Locks | `003` · `hf-incident` · Sol≠Astra · free only · no `004` |
| Crawl | **`2026-09-11T09:29:29Z`** · ≈ **2.26h** |
| Digest | HOLD → **`2026-09-11T15:20:40.008Z`** · `pack_id=2026-09-11T09` · ≈ **3.59h** |
| Soft-fail | **openalex: HTTP 429** |
| bun | 183 · `visual:check` OK |

Scout refs SoT: OpenAlex stamp fields · P2 RSS candidates · HN P3 queries · GitHub P4 rate. **No** unapproved HTTP candidates.


### P5 land line · 2026-09-11T12:45:00Z
`GoogleNews · soft_fail={bool} · queries_ok={n}/{attempted} · items={n}` · never Brief · never sole lead · **P6 HOLD**.
