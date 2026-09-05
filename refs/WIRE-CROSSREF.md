# Wire-spec #7 — Crossref DOI enrich (APPROVED)

**Architect approve:** YES · **Director pick this pulse** · HF `/papers` HTML stays notes-only  
**Implement:** Coder · **Scout:** samples in `SCOUT-CROSSREF-DEEPEN.md`  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **Papers enrich only** · **never Brief** · **never Pulse lead** · **never displace HF keeps** · **no cycle `004`**

## Goal

Validate / attach Crossref DOI + issued date + type onto Papers rows (pairs OpenAlex/arXiv). Complements OpenAlex. Does not change Brief pins.

## Endpoint (zero credentials)

Prefer:

```
GET https://api.crossref.org/works?filter=doi:{doi}&rows=1
GET https://api.crossref.org/works?query.bibliographic={title}&rows=2
```

**Do not** rely on `GET /works/{arxiv-doi}` — Scout saw `10.48550/arxiv…` → **404**. Match by title / OpenAlex id / registered DOI when arXiv DOI misses.

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; crossref; mailto:local@nexus-sage.invalid)`

## Rate / soft-fail

- ≤1 Crossref call / ingest tick  
- Cache 24h under `artifacts/sage/crossref-cache/<hash>.json`  
- Soft-fail **429** / **5xx** / 404: log, skip, continue ingest + stamp  
- No paid keys

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/crossref-enrich.ts` | filter/search, map, mergeOntoPapers |
| ingest hook | After OpenAlex; DOI/title merge |
| `__tests__/crossref-enrich.test.ts` | fixtures + soft-fail + Brief=false |

## Schema

```ts
type CrossrefEnrichment = {
  doi: string
  title: string
  issued: string | null
  type: string | null
  url: string | null
  source: "crossref"
  papersEnrichOnly: true
  briefEligible: false
  pulseLeadEligible: false
  displaceHfKeep: false
}
```

## Placement

| Lane | Allowed |
|------|---------|
| Papers | YES — DOI/issued/type enrich |
| Digest refs | optional `support` |
| Pulse lead / Brief | **NO** |

## Done when

- [x] Fixtures HuggingGPT + agent survey map · `briefEligible: false`
- [x] Soft-fail 429 path tested
- [x] `ingest-last.json` → `crossref.brief=false`
- [x] Pins stay `003` / `hf-incident` · HF keeps not displaced
- [x] Zero credentials

### Reviewer stamp — 2026-09-04T08:42Z (Reviewer Gürok)

**WIRE-CROSSREF PASS**

Evidence:
- `bun test` → 136/136 (soft-fail 429/404 · non-destructive vs OpenAlex · Brief=false · HF keeps)
- `ingest-last.json` → `crossref.brief=false`, `pulse_lead=false`, `papers_enrich_only=true`
- pins `003` / `hf-incident` · HF HTML still not wired · FREE-PROVIDERS Allowed refreshed

## Explicit non-goals

- HF Hub `/papers` HTML fallback (notes until next Architect cut)
- Reddit · cycle `004`
