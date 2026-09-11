# Scout — OpenAlex 429 backoff notes (FREE-PULSE P1)

**Audience:** Architect · Coder · Reviewer  
**Date:** 2026-09-07 · Scout Gürok  
**Status:** **NOTES ONLY** — FREE-PULSE **P1** when Canberk ranks + Architect APPROVES. No land now.  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · `briefEligible:false` · never displace HF keeps · no `004`

Companion to `FREE-PULSE-DEEPEN.md` P1 · `OPS-A4-SOFT-FAIL-METERS.md` (health chips) · live stamps in `ingest-last.json`.

---

## Observed behavior (desk)

| Stamp | OpenAlex | Notes |
|-------|----------|-------|
| `2026-09-06T19:00:53Z` | soft_fail **HTTP 429** · enriched **0** | Ingest continued; other providers OK |
| `2026-09-07T01:29:12Z` (A1 FORCE) | **ok** · enriched **3** · searches 1 · not from_cache | Recovered without special backoff code |
| Pattern | Intermittent 429 under unauth / burst | Must never hard-fail ingest or steal HF papers slot |

Crossref often **enrich 0** same ticks — treat as independent soft/empty, not OpenAlex blame.

---

## Recommended harden (when P1 APPROVED)

1. **Honor `Retry-After`** when present; else jittered backoff (e.g. 2s → 8s, ≤2 retries / ingest tick).
2. **Cap searches / tick** (already lean) — prefer cache (`from_cache`) within 24h when prior stamp ok.
3. **Stamp honesty:** always write `soft_fail` + `soft_fail_reason` + `enriched` into `ingest-last.openalex` (never silent wash — Reviewer FAIL #6).
4. **HF keeps primacy:** OpenAlex/Crossref = papers enrich only · never Brief · never displace HF `daily_papers` ranking.
5. **A4 hook:** soft-fail chip on Pulse health rail (`briefEligible:false`) per `OPS-A4-SOFT-FAIL-METERS.md` — optional with P1.
6. **Weekday window:** ride A1 Istanbul cadence; no overnight OpenAlex firehose.

---

## Non-goals

Paid OpenAlex key as required path · inventing Brief pins · replacing HF lead · Bluesky/X API · overnight spam

---

## Done-when (later Reviewer)

- [ ] Repeated 429 in dry-run → ingest exits 0 · stamp soft_fail · HF keeps intact  
- [ ] Success path still enriches ≥1 when API allows  
- [ ] Freeze note / A4 meter (if landed) show honest soft-fail  
- [ ] Locks `003` / `hf-incident` unchanged  

**Scout:** notes for P1 — wait Canberk free-pulse rank.
