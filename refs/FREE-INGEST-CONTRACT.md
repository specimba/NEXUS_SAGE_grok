# Free-ingest contract (no cycle 004)

**Owner:** Architect · **Implement:** Coder `bun run ingest` · **Scout:** source list in `FREE-PROVIDERS.md`  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · phosphor Skin V2 · **free providers only**

## In scope

| Job | Source | Rule |
|-----|--------|------|
| Papers | HF public `daily_papers` | Sort/merge by upvotes; gen/sim tops **never** displace kept agent papers |
| Shelf | Local curation URL lists | Toolkit / scanner / OWASP → shelf only — **off Brief** |
| Stamp | Ingest success path | Updates `CRAWL_AT` + CURRENT crawl fields so Pulse clears STALE |
| STALE | `crawlAgeHours` > 18 | `.sage-stale` banner — no paid refresh required |

## Out of scope (hard)

- Paid X / Twitter API, bearer-token live search, Zapier classify, paid firehoses
- Inventing or compiling cycle **`004`** (needs new primary + unlock — not this contract)
- Promoting Astra / Grok / Muse over HF lead
- Missed-DNA-as-news, civilizations copy, announced-deal language

## Watchlist role

`x-watchlist` + semantic query builders = **curation plan / operator log only**.  
`ingest` may print planned queries. It must **not** call `api.x.com`.

## Pass criteria (Reviewer)

- [x] `bun run ingest` works without any paid credential
- [x] HF path tested; displacement rule tested
- [x] Toolkit URLs never appear as Brief pins
- [x] STALE >18h proven; stamp clears after ingest
- [x] No cycle id bump; lead stays `hf-incident`

### Reviewer stamp — 2026-09-04T06:07Z

**FREE-INGEST PASS** (+ HN Pulse-pollution PASS).

Evidence:
- `bun test` → 62/62
- `bun run ingest` → `artifacts/sage/ingest-last.json` shows `arxiv.brief=false`, `hn.brief=false`, `hn.pulse_only=true`, `cycle=003`, `lead_id=hf-incident`
- Brief pins unchanged: lead `hf-incident`, companion `astra-depth`, rest `aisle-curl`
- Paid X remains disabled

RSS labs wired (`rss-labs.ts`): OpenAI + DeepMind + Google AI + HF blog — Pulse/shelf, `rss.brief=false`. Anthropic/Meta HTML deferred. Reddit not wired.

## Scout extension hook

Next free signals land only via `FREE-PROVIDERS.md` (RSS/public HTML/HF/arXiv/etc.). Architect must approve before Coder wires a new live fetcher.
