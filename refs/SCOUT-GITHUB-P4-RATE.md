# Scout — GitHub P4 rate / cache / query-rotate notes

**Wire:** `WIRE-GITHUB-TIGHTEN-P4.md` **APPROVED** · **Stamp:** 2026-09-11  
**Locks:** toolkit shelf only · never Brief · never Pulse lead · unauth only · no PAT required

## Rate budget

| Rule | Spec |
|------|------|
| Search/tick | **≤1** `GET /search/repositories` |
| Interval | Prefer ride A1 Istanbul cadence · no overnight firehose |
| Unauth ceiling | Treat as **≤10 search/h** scarce — never burn on retries |
| On `X-RateLimit-Remaining: 0` | **Skip** network · soft_fail stamp · exit ingest 0 |
| On 403 / 429 | soft_fail · **no** retry-storm (0–1 polite wait only if `Retry-After` tiny; prefer skip) |

## Cache

| Rule | Spec |
|------|------|
| Path | `artifacts/sage/github-cache/<hash>.json` |
| TTL | **24h** |
| Hit | counts as success · `from_cache: true` · `searches: 0` |
| Miss | one query · write cache · stamp remaining headers if present |

## Query rotate (one string / tick)

Reuse curated shelf queries; rotate round-robin across ticks (examples — Coder may keep existing 4):

1. `LLM agent eval harness`  
2. `AI agent toolkit stars:>50`  
3. `LLM security scanner`  
4. `open source LLM inference`

Hash = query+sort mode. Never rotate into Sol/Astra/incident nouns.

## Stamp fields (`ingest-last.github`)

| Field | Notes |
|-------|-------|
| `ok` / `soft_fail` / `soft_fail_reason` | honest 403/429/skip |
| `shelf` | count of toolkit rows |
| `from_cache` | bool |
| `searches` | 0 or 1 |
| `brief` / `pulse_lead` | **false** |
| `query` | the one string used (or last cache key) |

## Placement

Toolkit **shelf rail only** — not Pulse chatter cards · not Brief pins.

## DENY

GitHub App/PAT as required · HTML trending scrape · paid X · Bluesky · inventing shelf into Brief

**Scout:** notes only · freeze ages after P4 PASS · no unapproved HTTP.

## Coder honor — 2026-09-11

P4 land kept existing curated 4 (Scout allowed) · cache-first · ≤1 search/tick · Remaining-0 skip via `_rate-limit.json` · stamp `rate_limit_remaining` · shelf only.
