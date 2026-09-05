# Candidates — Semantic Scholar vs Wikidata (Director pulse ask — CLOSED)

**Scout refresh:** 2026-09-04T09:52Z · **Architect:** Wikidata already APPROVED · this note closes the S2/WD candidates ask

| Source | Live HTTP | Verdict | Pointers |
|--------|-----------|---------|----------|
| **Semantic Scholar** `GET /graph/v1/paper/search?query=HuggingGPT&limit=1` | **429** (message asks for API key) | **SKIPPED** this wire — not usable zero-cred; Papers enrich only if key later; soft-fail-only if ever cut; **do not propose wiring S2 now** | Stay notes / deferred in `FREE-PROVIDERS.md` |
| **Wikidata** `wbsearchentities` / `wbgetentities` | **200** (empty UA → **403**) | **APPROVED** path — DENY / flatten / hygiene grounding only | Contract: `WIRE-WIKIDATA-DENY.md` · Scout deepen: `SCOUT-WIKIDATA-DENY-QIDS.md` |

## False friends (probe-confirmed)

- `Persistent Sol` → solar-climate paper `Q34104679` (reject)
- `Astra` → AstraZeneca `Q731938` / Opel Astra `Q1350` (reject); OpenAI Astra product → **0** hits
- `METR` bare → metre; full name → `Q135185153`
- `Project Zero` → Fatal Frame games unless allowlist `Q18859887`
- `Trail of Bits` → **no** Wikidata item (`unresolved`)

## Locks

cycle `003` · lead `hf-incident` · Sol≠Astra · never Brief · no `004` · free only · HF HTML deferred · no S2 key
