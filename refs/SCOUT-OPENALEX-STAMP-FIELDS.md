# Scout — OpenAlex stamp-field assist (FREE-PULSE P1 land)

**For:** Coder (`ingest-last.openalex`) · Reviewer FAIL-gate · A4 meters  
**Wire:** `WIRE-OPENALEX-BACKOFF.md` **APPROVED** · GO default  
**Locks:** never Brief · never Pulse lead · never displace HF · `briefEligible` N/A (enrich only)

## Required `ingest-last.openalex` fields

| Field | Type | On success | On 429 (after ≤2 retries) | On other soft fail |
|-------|------|------------|---------------------------|--------------------|
| `ok` | bool | `true` | `false` | `false` |
| `soft_fail` | bool | `false` | **`true`** | **`true`** |
| `soft_fail_reason` | string\|null | `null` | e.g. `HTTP 429` (+ optional `retry_after=Ns`) | status text |
| `enriched` | number | ≥1 when API allows | **`0`** | `0` |
| `secondary` | number | as today | keep prior / 0 | — |
| `from_cache` | bool | true if 24h cache used | false if live 429 | — |
| `searches` | number | ≤1 / tick | count attempted | — |
| `retries` | number | 0 | 1–2 | — |
| `brief` | bool | **`false`** | **`false`** | **`false`** |
| `pulse_lead` | bool | **`false`** | **`false`** | **`false`** |
| `papers_enrich_only` | bool | **`true`** | **`true`** | **`true`** |
| `url` | string | OpenAlex works URL | same | same |

## A4 meter read

- Soft chip ON iff `soft_fail===true` (or `ok===false` with reason).  
- Never wash 429 to OK without clearing reason.  
- HF meter stays independent — OpenAlex soft must not grey HF keeps.

## Freeze-note line (post-land)

`OpenAlex · soft_fail={bool} · enriched={n} · retries={n} · from_cache={bool}`

## Non-goals

New provider · paid key required · Brief pins · P2/P3 this pulse

**Scout:** stamp-field assist only — freeze ages refresh after Coder land + Reviewer PASS.
