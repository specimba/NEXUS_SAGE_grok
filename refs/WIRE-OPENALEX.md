# Wire-spec #6 — OpenAlex Papers enrich (APPROVED)

**Architect approve:** YES · **Director pick this pulse** · **Fox-IT:** stays deferred  
**Implement:** Coder · **Scout:** deepen live samples here  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **Papers enrich only** · **never Brief** · **never Pulse lead** · **never displace HF keeps** · **no cycle `004`**

## Goal

Enrich Papers lane metadata (title/year/DOI/OpenAlex id) for works related to HF/agent papers already on the desk. Complements arXiv Atom enrich. Does **not** add Brief pins or invent `004`.

## Endpoint (zero credentials)

```
GET https://api.openalex.org/works
  ?search=<curation>
  &per_page=5
  &select=id,title,publication_year,doi,primary_location,authorships
```

Headers / UA:
- `User-Agent: NEXUS-SAGE-desk/0.2 (free-ingest; openalex; mailto:local@nexus-sage.invalid)`
- No API key. Polite mailto in UA per OpenAlex etiquette.

## Queries (≤1 search per ingest tick)

Prefer enrich-by-known ids when possible; else one rotating search:

1. Match DOIs / arXiv ids already on Papers (`filter=doi:...` or search by title fragment) — **preferred**
2. Fallback search: `Hugging Face agent` OR `LLM agent` (cap 5)

Cache 24h under `artifacts/sage/openalex-cache/<hash>.json`.

## Rate / soft-fail (required)

- Soft-fail on **429** / **5xx** / parse error: log, skip OpenAlex, continue ingest + stamp
- No retry storm; never paid Semantic Scholar key as substitute this wire
- S2 stays notes-only (429 without key)

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/openalex-enrich.ts` | fetch, map, mergeOntoPapers |
| ingest hook | After arXiv enrich; merge fields onto paper rows |
| `__tests__/openalex-enrich.test.ts` | Fixture → schema; Brief=false; soft-fail; no HF keep displacement |

## Schema

```ts
type OpenAlexEnrichment = {
  id: string                 // https://openalex.org/W…
  title: string
  year: number | null
  doi: string | null         // https://doi.org/… or bare
  source: "openalex"
  papersEnrichOnly: true
  shelfOnly: false
  briefEligible: false
  pulseLeadEligible: false
  displaceHfKeep: false      // locked semantic: never remove HF agent keeps
}
```

Merge rule: attach OpenAlex id/year/doi onto existing Papers rows by DOI/arXiv/title fuzzy match. New search hits that aren’t already Papers **may** appear as Papers secondary rows tagged enrich-only — **never** Brief, **never** displace gen/sim-protected HF agent keeps (same rule as HF daily_papers).

## Placement

| Lane | Allowed |
|------|---------|
| Papers | YES — metadata enrich / secondary enrich rows |
| Digest refs | optional `support` |
| Shelf | NO required (not toolkit path) |
| Pulse lead | **NO** |
| Brief | **NO** |

## Done when

- [x] Fixture: HuggingGPT / ExpeL-style works map to enrichment · `briefEligible: false`
- [x] Soft-fail 429 path tested
- [x] Live or cache path shows `openalex.brief=false` in `ingest-last.json`
- [x] Brief pins unchanged (`003` / `hf-incident`)
- [x] HF agent keeps not displaced
- [x] Zero credentials

### Reviewer stamp — 2026-09-04T07:57Z

**WIRE-OPENALEX PASS**

Evidence:
- `bun test` → 114/114 (soft-fail 429 · merge never displaces HF keeps · Brief=false)
- `ingest-last.json` → `openalex.brief=false`, `pulse_lead=false`, `papers_enrich_only=true`, HuggingGPT `W4361866031`
- pins `003` / `hf-incident` · Fox-IT deferred · FREE-PROVIDERS Allowed refreshed

## Explicit non-goals

- Fox-IT RSS (deferred)
- Semantic Scholar live (429 / notes)
- Crossref (Scout notes only until next Architect pick)
- Cycle `004`

---

## Scout deepened samples (2026-09-04)

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; openalex; mailto:local@nexus-sage.invalid)`

**API note:** OpenAlex returns `display_name` (not `title`) even when `select=` asks for title — map `display_name → title` in `openalex-enrich.ts`.

### A. Preferred — enrich by known DOI

```
GET https://api.openalex.org/works?filter=doi:10.48550/arxiv.2303.17580&select=id,display_name,publication_year,doi,authorships
→ HTTP 200
```

```
id:    https://openalex.org/W4361866031
title: HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face
year:  2023
doi:   https://doi.org/10.48550/arxiv.2303.17580
```

Merge onto existing Papers row by DOI/arXiv id — **do not** create a Brief pin.

### B. Fallback search — `LLM agent sandbox` · HTTP 200 · `per_page=2`

```
id:    https://openalex.org/W4304195432
title: Distributing Accountability, Not Capability: Phase Separation and the LLM Workflow Quadrant...
year:  2022 · doi: https://doi.org/10.48550/arxiv.2210.03629 · cites: 584
loc:   http://arxiv.org/abs/2210.03629

id:    https://openalex.org/W4393065402
title: A survey on large language model based autonomous agents
year:  2024 · doi: https://doi.org/10.1007/s11704-024-40231-1 · cites: 1513
```

### C. Prior candidate samples (still valid)

- `ExpeL: LLM Agents Are Experiential Learners` · `https://openalex.org/W4393160747`
- `Machine-Speed Intrusion: A Detection Engineering Analysis of the July 2026 Hugging Face Agent Campaign` · `https://openalex.org/W7171717460` · **Papers enrich / Digest support only** — must **never** displace `hf-incident` lead or invent cycle `004`

### Mapped enrichment sketch

```json
{
  "id": "https://openalex.org/W4361866031",
  "title": "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face",
  "year": 2023,
  "doi": "https://doi.org/10.48550/arxiv.2303.17580",
  "source": "openalex",
  "papersEnrichOnly": true,
  "shelfOnly": false,
  "briefEligible": false,
  "pulseLeadEligible": false,
  "displaceHfKeep": false
}
```

### Fixtures

- `openalex-hugginggpt.json` — DOI filter hit (A)
- `openalex-agent-sandbox.json` — search hits (B)
- Soft-fail: mock HTTP 429 → `openalex.soft_fail=true`, ingest continues

### Rate / soft-fail

- ≤1 OpenAlex call / ingest tick · cache 24h
- 429/5xx/parse → skip, stamp still updates
- Never substitute paid Semantic Scholar key this wire

---

## Crossref notes only (not approved to wire)

Probe 2026-09-04:

```
GET https://api.crossref.org/works?query=LLM%20agent&rows=1
→ HTTP 200
DOI 10.1145/3749421.3749436 · ALAS: A Stateful Multi-LLM Agent Framework for Disruption-Aware Planning · issued 2025-12-11
```

Polite UA required. Use later for DOI validation / Papers enrich if Architect cuts `WIRE-CROSSREF.md`. **Do not** implement in #6.
