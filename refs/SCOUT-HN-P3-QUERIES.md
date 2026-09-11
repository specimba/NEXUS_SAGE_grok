# Scout — HN P3 watchlist query assist

**Wire:** `WIRE-HN-DEEPEN-P3.md` · **Stamp:** 2026-09-11  
**Locks:** Pulse only · `briefEligible:false` · never Brief · no Sol/Astra/incident standing queries · rotate ≤3/tick · total ≤12

## Standing queries (≤12)

Keep baseline, then deepen:

| # | Query | Lane |
|---|-------|------|
| 1 | `OpenAI` | baseline |
| 2 | `Anthropic` | baseline |
| 3 | `Hugging Face` | baseline |
| 4 | `agents` | baseline |
| 5 | `eval` | baseline |
| 6 | `LLM` | deepen |
| 7 | `METR` | deepen · eval lab |
| 8 | `ML security` | deepen · cyber |
| 9 | `open weights` | deepen · OSS |
| 10 | `inference` | deepen · tooling |
| 11 | `benchmark` | deepen |
| 12 | `agent tooling` | deepen · prefer over bare `jailbreak` |

## Rotate (≤3 / ingest tick)

Suggested rounds (weekday A1 cadence):

1. `OpenAI` · `Hugging Face` · `LLM`  
2. `Anthropic` · `METR` · `ML security`  
3. `agents` · `eval` · `open weights`  
4. `inference` · `benchmark` · `agent tooling`

## EXCLUDE from standing queries

`Sol` · `Astra` · `Persistent Sol` · `HF breach` · `jailbreak` as sole firehose noun · Bluesky · crypto spam

Prefer `ML security` / `agent tooling` over exploit-howto bait. Hygiene/`classifyPost` still DENY after fetch.

## Soft-fail

One query 5xx ≠ kill HN · stamp `ingest-last.hn` honesty · never Brief.

**Scout:** optional assist — Coder may land Architect examples if this file lags.

## Coder land — 2026-09-11

Queries wired into `desk/src/lib/hn-pulse.ts` `HN_WATCHLIST_QUERIES` (12) · `pickHnQueriesForTick` rotate ≤3 · soft_fail merge · Sol/Astra/jailbreak standing BAN · never Brief.
