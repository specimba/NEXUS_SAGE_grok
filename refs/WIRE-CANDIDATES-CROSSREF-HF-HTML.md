# Next-pair samples — Crossref + HF Hub `/papers` HTML (Scout)

Fetched 2026-09-04 · **notes / candidate only — not approved to wire.** Reddit stays blocked. Locks if ever wired: `003` / `hf-incident` / free only / never Brief / no `004`.

---

## A. Crossref works API

| | |
|--|--|
| Endpoint | `GET https://api.crossref.org/works?query.bibliographic=<q>&rows≤5` |
| HTTP | **200** |
| UA | `NEXUS-SAGE-desk/0.2 (free-ingest; mailto:local)` |
| Auth | None |
| Placement (if wired) | Papers enrich / DOI validate only · never Brief · never Pulse lead · never displace HF keeps |
| Soft-fail | 429/5xx → skip |

### Live sample (query.bibliographic=`HuggingGPT`, rows=2 → 1 hit)

```
DOI:    10.52202/075280-1657
title:  HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face
issued: 2023
type:   proceedings-article
URL:    https://doi.org/10.52202/075280-1657
```

Earlier note sample: `10.1145/3749421.3749436` · ALAS multi-LLM agent framework.

### Suggested schema sketch

```ts
type CrossrefEnrichment = {
  doi: string
  title: string
  issued: string | null
  type: string | null
  url: string
  source: "crossref"
  papersEnrichOnly: true
  briefEligible: false
  displaceHfKeep: false
}
```

Fixture: `crossref-hugginggpt.json`

**Pairs with:** OpenAlex DOI enrich — Crossref as second DOI authority / type metadata.

---

## B. HF Hub `/papers` HTML fallback

| | |
|--|--|
| URL | `https://huggingface.co/papers` (also `?sort=trending`) |
| HTTP | **200** · `text/html` · ~326KB · title `Daily Papers - Hugging Face` |
| UA | desk free-ingest UA |
| Role | **Fallback only** when `https://huggingface.co/api/daily_papers` flakes |
| Placement | Same rules as HF JSON path — Papers merge · gen/sim never displaces agent keeps · never Brief lead |

### Live excerpt (paper path ids on page)

```
/papers/2609.03796
/papers/2609.01507
/papers/2609.04098
```

No `__NEXT_DATA__` in HTML this fetch — parser should treat as progressive HTML (href harvest + nearby text), not a stable JSON blob.

### Prefer primary

Keep **`GET /api/daily_papers`** as primary (already live). HTML fallback:

1. Soft-fail JSON → try HTML once
2. Extract `/papers/<id>` hrefs (cap ≤25)
3. Resolve titles via existing paper id / arXiv enrich if needed
4. Same displacement + Brief=false locks

Fixture: `hf-papers-fallback.html` (trimmed snippet with 2–3 `/papers/` links)

### Explicit bans

- Do not scrape login walls / likes as auth
- Do not invent cycle `004` from HTML order
- Reddit still **HTTP 403** blocked

---

## Architect pick hint (non-binding)

Crossref = Papers DOI depth after OpenAlex. HF HTML = resilience for daily_papers outages. Not both unless Director opens a resilience slice.

---

Deepened Crossref live notes: [`SCOUT-CROSSREF-DEEPEN.md`](./SCOUT-CROSSREF-DEEPEN.md) (DOI filter works; direct arXiv DOI path may 404).

Deepened HF HTML fallback: [`SCOUT-HF-PAPERS-HTML-FALLBACK.md`](./SCOUT-HF-PAPERS-HTML-FALLBACK.md).
