# Candidate prep — Fox-IT vs OpenAlex (Scout)

Architect picks **one**. Samples 2026-09-04. **No code until APPROVED.** Locks: `003` / `hf-incident` / free only / never Brief / no `004`.

---

## Candidate A — Fox-IT RSS (security depth)

| | |
|--|--|
| Feed | `https://blog.fox-it.com/feed/` |
| HTTP | **200** · `application/rss+xml` |
| UA | `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)` |
| Rate | ≤1/2s · cache 6h |
| Placement | Pulse / Digest-refs / shelf · `briefEligible: false` · never lead |
| Prior note | Already in `WIRE-SECURITY-RSS.md` Scout section + deferred GO |

### Trimmed items

```
title: RemotePE: The Lazarus RAT that lives in memory
link:  https://blog.fox-it.com/2026/05/22/remotepe-the-lazarus-rat-that-lives-in-memory/
date:  Fri, 22 May 2026 14:55:58 +0000

title: Three Lazarus RATs coming for your cheese
link:  https://blog.fox-it.com/2025/09/01/three-lazarus-rats-coming-for-your-cheese/
date:  Mon, 01 Sep 2025 13:00:00 +0000
```

Fixture: `rss-foxit-remotepe.xml`

---

## Candidate B — OpenAlex works (Papers enrichment)

| | |
|--|--|
| Endpoint | `GET https://api.openalex.org/works?search=...&per_page≤5` |
| HTTP | **200** (live) |
| Auth | None (polite UA; mailto in UA recommended) |
| Rate | Be polite; cache 24h; soft-fail 429/5xx |
| Placement | **Papers enrich only** (title/year/doi/id) · never Brief · never Pulse lead · never displace HF keeps |
| Prior note | FREE-PROVIDERS enrichment table (ExpeL sample) |

### Trimmed hits (search=`Hugging Face agent`, select id/title/year/doi)

- `https://openalex.org/W4361866031` · 2023 · HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face
  doi: https://doi.org/10.48550/arxiv.2303.17580
- `https://openalex.org/W7171717460` · 2026 · Machine-Speed Intrusion: A Detection Engineering Analysis of the July 2026 Hugging Face Agent Campaign
  doi: https://doi.org/10.5281/zenodo.21686547

Earlier FREE-PROVIDERS sample: `ExpeL: LLM Agents Are Experiential Learners` · `https://openalex.org/W4393160747`

### Suggested schema sketch

```ts
type OpenAlexEnrichment = {
  id: string            // OpenAlex work id URL
  title: string
  year: number | null
  doi: string | null
  source: "openalex"
  shelfOnly: false
  papersEnrichOnly: true
  briefEligible: false
}
```

Fixture: `openalex-hf-agent.json` (1–2 works)

### Soft-fail

429/5xx/parse → skip OpenAlex, continue ingest + stamp. Never invent cycle `004`.

---

## Scout recommendation (non-binding)

- **Fox-IT** if cyber DFIR depth after ToB/PZ
- **OpenAlex** if Papers metadata enrichment (pairs with arXiv; S2 still 429 without key)

Not both this pulse. Semantic Scholar stays notes-only (429).
