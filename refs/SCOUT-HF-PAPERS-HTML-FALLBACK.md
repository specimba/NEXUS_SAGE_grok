# Scout deepen — HF Hub `/papers` HTML fallback

**Status:** notes only — **not approved to wire** until Architect cuts after Crossref PASS.  
Fetched 2026-09-04. Reddit still blocked. Locks if ever wired: same as HF JSON — never Brief lead · gen/sim never displaces agent keeps · no `004` · keep `hf-incident`.

## Primary vs fallback

| Path | URL | HTTP | Role |
|------|-----|------|------|
| **Primary (live)** | `GET https://huggingface.co/api/daily_papers` | **200** · ~280KB JSON · 50 rows | Prefer always |
| **Fallback** | `GET https://huggingface.co/papers` | **200** · HTML ~325KB · title `Daily Papers - Hugging Face` | Only if JSON flakes |
| Date URL | `https://huggingface.co/papers/date/2026-09-04` | **200** HTML | Same page family; not richer JSON |

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; hf-html-fallback)`

## What HTML gives you

- Unique `/papers/<id>` hrefs — **22** ids this fetch (e.g. `2609.03796`, `2609.01507`, `2609.04098`, …)
- **No** `__NEXT_DATA__`, no `application/ld+json`, no `data-paper` hooks
- Titles/upvotes **not** reliably in plain text near hrefs — treat HTML as **id harvest**, then enrich via existing arXiv/OpenAlex/Crossref paths

## Critical mismatch (why fallback is last resort)

First-6 HTML ids vs first-6 `daily_papers` API ids this pulse: **zero overlap**.

```
HTML: 2609.03796, 2609.01507, 2609.04098, …
API:  2609.04201, 2609.01072, 2609.04199, …  (has paper.upvotes, title, summary)
```

So HTML order ≠ API upvote sort. Fallback must **not** pretend to be the same ranking as `daily_papers`. Use it only to avoid a total Papers blackout, then re-merge when JSON returns.

## Suggested algorithm (for future wire)

1. Try `daily_papers` JSON
2. On hard fail only → GET `/papers` once (cache 1h)
3. Regex `/papers/(\d+\.\d+)` · unique · cap ≤25
4. Map ids → stub Papers rows → run existing enrich (arXiv/OpenAlex/Crossref)
5. Apply gen/sim displacement + Brief=false locks
6. Stamp `hf_html_fallback.used=true` · `brief=false`

## Fixtures (when Architect approves)

- `hf-papers-fallback.html` — trimmed snippet with ≥3 `/papers/NNNN.NNNNN` links
- Soft-fail: JSON ok → HTML path never called; JSON 5xx → HTML harvest · Brief pins unchanged

## Explicit bans

- No login / cookie scrape
- No inventing upvotes from HTML
- No cycle `004` from HTML ordering
- Reddit **403** still blocked
- Do not replace primary JSON while it works

## Cross-links

- Candidate pack: `WIRE-CANDIDATES-CROSSREF-HF-HTML.md`
- Crossref deepen: `SCOUT-CROSSREF-DEEPEN.md`
- Live primary: FREE-PROVIDERS Allowed · HF `daily_papers`
