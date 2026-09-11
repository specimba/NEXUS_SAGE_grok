# WIRE — GitHub shelf tighten (FREE-PULSE P4 · LANDED)

**Architect approve:** YES · **Director Pulse 11:36Z** continue-default after P3 PASS  
**Companion:** `WIRE-GITHUB-SHELF.md` (baseline APPROVED) · `FREE-PULSE-DEEPEN.md` P4  
**Owners:** Coder land · Scout rate/cache notes · Reviewer FAIL-gate · UX honesty only  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · **toolkit shelf only** · `briefEligible:false` · `pulseLeadEligible:false` · never Brief · never Pulse lead · no `004`  
**DENY:** GitHub App / PAT as required path · scrape HTML trending · paid X · Bluesky

## Goal

Tighten existing unauth GitHub repo search so scarce **≤10 req/h** budget never storms, soft-fails honestly, and stays on the **toolkit shelf rail** only.

## Required tighten (vs baseline shelf wire)

1. **Hard cap:** ≤ **1** `search/repositories` call **per ingest tick** (prefer 24h cache hit first)  
2. **Cache:** `artifacts/sage/github-cache/<hash>.json` TTL **24h** — count cache hit as success without network  
3. **Preflight:** if `X-RateLimit-Remaining: 0` (from last response stamp) → skip call · soft_fail stamped  
4. **Soft-fail:** HTTP **403** / **429** / empty body → log + `ingest-last.github` soft_fail · continue ingest · never retry-storm  
5. **Rotate** curated queries (existing 4 or Scout-tightened) — still **one** query string per tick  
6. Placement: **shelf only** — not Pulse chatter · not Brief  
7. Schema unchanged: `shelfOnly: true` · `briefEligible: false` · `pulseLeadEligible: false`

## Code touch

- `desk/src/lib/github-shelf.ts` (+ tests) — enforce cache-first · remaining-0 skip · soft_fail stamp fields  
- ingest hook — no new provider; tighten call site only  

## Done-when (Reviewer)

- [x] Fixture/dry: 403/429 → exit 0 · soft_fail stamped · HF/HN/RSS untouched  
- [x] Cache hit within 24h skips network (test or evidence)  
- [x] ≤1 search/ingest proven · bun green · never Brief/Pulse lead  
- [x] Locks `003` / `hf-incident` · `visual:check` OK · A4 honesty if GitHub soft  

## Non-goals

P5 Google News · P6 Lobsters/dev.to · new auth token · Voice/Digest · overnight firehose · HTML trending scrape

## Coder land — 2026-09-11

**LANDED** — GitHub unauth shelf tighten (Scout `SCOUT-GITHUB-P4-RATE.md`) · ≤1 `search/repositories`/ingest · 24h cache-first (`from_cache` · `searches:0`) · Remaining-0 preflight via `github-cache/_rate-limit.json` (1h window) · soft_fail 403/429/empty · toolkit shelf only · never Brief · never Pulse lead · locks `003`/`hf-incident` · no `004` · no PAT.

Curated rotate (keep existing 4): LLM agent eval harness · OWASP LLM · agent sandbox escape · LLM red team toolkit.

Unit: cache hit skips network · Remaining-0 skip · 403/429 soft_fail stamp · ≤1 search/tick · bun green · `visual:check` OK (no UI rebuild).

## Architect HOLD after P4

**P5–P6 spice** HOLD until explicit Canberk/Director GO.

### Reviewer stamp — 2026-09-11T11:43Z (Reviewer Gürok)

**WIRE-GITHUB-TIGHTEN-P4 PASS** (`1c78d9f`).

Evidence:
- cache-first 24h · ≤1 search/tick · Remaining-0 skip · 403/429 soft_fail (unit)
- toolkit shelf only · `brief=false` · `pulse_lead=false` · bun **183**
- Live stamp: searches=1 · shelf=2 · locks `003`/`hf-incident` · `visual:check` OK

**FREE-PULSE core 1→4 CLOSED.** P5–P6 spice HOLD until Canberk/Director GO.
