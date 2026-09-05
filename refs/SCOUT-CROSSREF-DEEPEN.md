# Scout deepen — Crossref (for WIRE-CROSSREF.md)

Fetched 2026-09-04 · ready for Architect APPROVED paste. Locks: Papers enrich / DOI validate · never Brief · never Pulse lead · never displace HF keeps · soft-fail · no `004`.

## Endpoints that work

| Mode | URL | HTTP |
|------|-----|------|
| Bibliographic search | `GET https://api.crossref.org/works?query.bibliographic=HuggingGPT&rows=2` | **200** |
| Filter by DOI | `GET https://api.crossref.org/works?filter=doi:10.1007/s11704-024-40231-1&rows=1` | **200** |
| Direct `/works/{doi}` for `10.48550/arxiv.2303.17580` | `.../works/10.48550%2Farxiv.2303.17580` | **404** Resource not found |

**Wire tip:** Prefer `filter=doi:` or bibliographic search — do **not** assume every arXiv DOI resolves on Crossref direct GET.

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; crossref; mailto:local@nexus-sage.invalid)`

## Samples

### A. Bibliographic — HuggingGPT

```
DOI:    10.52202/075280-1657
title:  HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face
issued: 2023
type:   proceedings-article
URL:    https://doi.org/10.52202/075280-1657
```

Note: OpenAlex used arXiv DOI `10.48550/arxiv.2303.17580` for same paper — Crossref may carry a **different** registered DOI. Match by title/OpenAlex id, not arXiv DOI alone.

### B. Filter DOI — agent survey (pairs OpenAlex W4393065402)

```
DOI:    10.1007/s11704-024-40231-1
title:  A survey on large language model based autonomous agents
issued: 2024-03-22
type:   journal-article
```

### C. Prior

`10.1145/3749421.3749436` · ALAS: A Stateful Multi-LLM Agent Framework…

## Schema sketch

```ts
type CrossrefEnrichment = {
  doi: string
  title: string
  issued: string | null  // ISO-ish from date-parts
  type: string | null
  url: string | null
  source: "crossref"
  papersEnrichOnly: true
  briefEligible: false
  pulseLeadEligible: false
  displaceHfKeep: false
}
```

## Fixtures

- `crossref-hugginggpt.json` — sample A
- `crossref-agent-survey.json` — sample B
- Soft-fail mock 429 → skip, ingest continues

## Rate

≤1 Crossref call / ingest tick · cache 24h · polite UA with mailto · soft-fail 429/5xx

## Still notes-only

HF `/papers` HTML fallback · Reddit blocked · no cycle `004`
