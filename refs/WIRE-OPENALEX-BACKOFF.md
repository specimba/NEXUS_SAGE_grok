# WIRE — OpenAlex 429 backoff (FREE-PULSE P1 · LANDED)

**Architect approve:** YES · **Director ASSIGN** 2026-09-11 ~10:40Z · **GO default** (Canberk may veto/rerank)  
**Source:** `SCOUT-OPENALEX-429-BACKOFF.md` · `FREE-PULSE-DEEPEN.md` P1  
**Owners:** Coder land · Reviewer FAIL-gate · Scout freeze ages · UX optional A4 chip honesty  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · Papers enrich only · **never Brief** · **never Pulse lead** · **never displace HF keeps** · no `004`  
**DENY:** paid OpenAlex key as required · paid X · Bluesky · inventing pins

## Goal

Harden existing OpenAlex enrich so intermittent **HTTP 429** soft-fails honestly with backoff — ingest always exits 0, HF `daily_papers` primacy untouched.

## Behavior (required)

1. On **429**: honor `Retry-After` if present; else jittered backoff **2s → 8s**, **≤2 retries** per ingest tick  
2. On still-fail: stamp `ingest-last.openalex` with `soft_fail` + reason + `enriched: 0` — **never silent**  
3. Prefer 24h cache hit when prior stamp was ok (`from_cache`) before new search  
4. Cap ≤1 search / tick (existing lean contract)  
5. Success path: still enrich ≥1 when API allows  
6. Weekday/A1 cadence only — no overnight OpenAlex firehose  

## Code touch

- Existing OpenAlex fetcher under desk ingest (extend, don’t fork provider)  
- A4 meters already show soft — must keep reading honest stamps after backoff  

## Done-when (Reviewer)

- [x] Forced/dry 429 path → exit 0 · soft_fail stamped · HF keeps intact (unit)  
- [x] Happy path still enriches when not rate-limited (unit + Retry-After recover)  
- [ ] Freeze note / A4 chip show honest soft-fail (not washed) — Reviewer  
- [ ] Locks `003` / `hf-incident` · Brief pins unchanged · `visual:check` green — Reviewer  
- [x] Dual-home only if pack side-effect from same ops pulse — else untouched  

## Non-goals

New provider · FREE-PULSE P2/P3 · Semantic Scholar key · Brief UI · Voice/Digest · cycle `004`


## Coder land — 2026-09-11

**LANDED** — OpenAlex 429 Retry-After/jitter ≤2 retries · soft_fail honesty · `retries` on `ingest-last.openalex` · never Brief · never displace HF · locks `003`/`hf-incident`.

Stamp fields per `SCOUT-OPENALEX-STAMP-FIELDS.md` (`ok`/`soft_fail`/`enriched`/`retries`/`brief=false`/`pulse_lead=false`/`papers_enrich_only=true`).

Unit: persistent 429 → 2 retries then soft_fail · Retry-After recover · search budget still ≤1.

## Architect HOLD after this wire

P2 lab/HF RSS · P3 HN deepen — still need explicit Canberk step or separate Director GO (GO default = P1 only this pulse unless Canberk says continue 1→2→3).
