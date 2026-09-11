# WIRE — HN Algolia deepen (FREE-PULSE P3 · LANDED)

**Architect approve:** YES · **Director continue-default** after P2b Reviewer PASS  
**Land gate:** **P2b PASS** (`6c17ea9`) · Director continue-default  
**Owners:** Coder land · Scout keyword assist (optional) · Reviewer FAIL-gate  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · Pulse chatter only · `briefEligible:false` · never Brief lead · no `004`  
**DENY:** incident-noun standing queries (Sol/Astra flatten) · paid X · Bluesky · Reddit

## Goal

Deepen HN Pulse signal via **watchlist query shape** — more respectful AI coverage without Brief pollution or rate-limit storms.

## Current baseline

`desk/src/lib/hn-pulse.ts`: Algolia `search` · ≤1/2s · 30m cache · standing queries:

`OpenAI` · `Anthropic` · `Hugging Face` · `agents` · `eval`

## Required deepen

1. **Extend `HN_WATCHLIST_QUERIES`** with Scout-aligned AI nouns (examples OK to land if Scout silent):  
   `LLM` · `METR` · `ML security` · `jailbreak` *(or Scout safer synonym)* · `benchmark` · `open weights` · `inference`  
   Cap total standing queries ≤ **12**. Run **rotate ≤3 queries / ingest tick** (not all 12 every tick).
2. Keep `assertNoIncidentNouns` / `hnQueriesSafe` — **no** Sol/Astra/incident standing search.
3. Soft-fail merge: one query 5xx ≠ kill HN · stamp `ingest-last.hn` soft_fail honesty.
4. `classifyPost` + DENY · `briefEligible:false` on all HN candidates.
5. Rate: keep `HN_MIN_INTERVAL_MS` ≥ 2s · no overnight firehose beyond A1 cadence.

## Optional Scout assist

Paste preferred query list into `refs/SCOUT-HN-P3-QUERIES.md` before land; else Coder uses Architect example set above (still ≤12, rotate ≤3/tick).

## Done-when (Reviewer)

- [x] Watchlist extended · rotate ≤3/tick · incident nouns blocked by tests  
- [x] Soft_fail stamped on query failure · ingest exit 0  
- [x] Never Brief · locks `003`/`hf-incident` · bun green · `visual:check` OK  
- [ ] A4 / Pulse shelf still show HN honesty — Reviewer  

## Non-goals

P5 Google News · new social · Voice/Digest · cycle `004` · replacing X-session taste

## Coder land — 2026-09-11

**LANDED** — HN Algolia watchlist deepen (Scout `SCOUT-HN-P3-QUERIES`) · standing ≤12 · rotate ≤3/tick · soft_fail merge (one query 5xx ≠ kill HN) · `ingest-last.hn` soft_fail honesty · never Brief · never displace HF · locks `003`/`hf-incident` · no `004`.

Standing queries: OpenAI · Anthropic · Hugging Face · agents · eval · LLM · METR · ML security · open weights · inference · benchmark · agent tooling.

EXCLUDE standing: Sol · Astra · jailbreak · Bluesky · incident nouns. Paid X / Bluesky DENY.

Unit: rotate ≤3 · 5xx soft_fail merge · Sol/Astra/jailbreak blocked · bun green · `visual:check` OK (no UI rebuild).

## Architect HOLD after P3 land

**P4+ HOLD** — GitHub shelf tighten / P5–P6 spice need explicit next Director/Canberk GO.
