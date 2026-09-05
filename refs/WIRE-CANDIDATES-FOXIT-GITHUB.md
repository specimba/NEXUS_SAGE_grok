# Candidate prep — Fox-IT vs GitHub shelf (Scout)

Architect picks **one**. Samples live-fetched 2026-09-04 so the winner can wire same pulse. **No code until APPROVED.** Locks: `003` / `hf-incident` / free only / never Brief / no `004`.

---

## Candidate A — Fox-IT RSS (NCC subsidiary)

| | |
|--|--|
| Feed | `https://blog.fox-it.com/feed/` |
| HTTP | **200** · `application/rss+xml` · ~672KB |
| UA | `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)` |
| Rate | ≤1 req / 2s · cache 6h under `artifacts/sage/rss-sec-cache/fox-it.xml` |
| Placement | Pulse / Digest-refs / shelf · `briefEligible: false` · never lead |
| Lab tag | `fox-it` (or `ncc-foxit`) · `source: "rss-security"` |

### Trimmed items

```
title: RemotePE: The Lazarus RAT that lives in memory
link:  https://blog.fox-it.com/2026/05/22/remotepe-the-lazarus-rat-that-lives-in-memory/
date:  Fri, 22 May 2026 14:55:58 +0000

title: Three Lazarus RATs coming for your cheese
link:  https://blog.fox-it.com/2025/09/01/three-lazarus-rats-coming-for-your-cheese/
date:  Mon, 01 Sep 2025 13:00:00 +0000
```

### Fixture

`desk/src/lib/__tests__/fixtures/rss-foxit-remotepe.xml` (1–2 items)

### Pros / cons

- Pros: real RSS, DFIR signal adjacent to ToB/PZ, fills NCC gap
- Cons: low cadence; subsidiary not first-party NCC; overlaps security lane just shipped

---

## Candidate B — GitHub unauth search → toolkit shelf

| | |
|--|--|
| Endpoint | `GET https://api.github.com/search/repositories?q=...&sort=updated&order=desc&per_page≤5` |
| HTTP | **200** (2026-09-04) |
| Auth | **None** — unauthenticated only |
| Rate | **10 req/hour** unauth (`X-RateLimit-Limit: 10`) — remaining was 9 after 1 call. Cache aggressively (6–24h). ≤1 search / ingest tick. |
| UA / Accept | UA desk string · `Accept: application/vnd.github+json` |
| Placement | **Shelf only** via `classifyUrl` / `scoreUrlList` · never Brief · never Pulse lead |
| Suggested queries | `LLM agent eval harness`, `OWASP LLM`, `agent sandbox escape` — curation nouns, not incident standing search |

### Trimmed hits (q=`LLM+agent+eval+harness`, per_page=2)

```
full_name: ayyesha12/agentic-auditor
html_url:  https://github.com/ayyesha12/agentic-auditor
desc: A data-centric evaluation framework for multi-agent LLM pipelines...

full_name: Vyshnavi975/llmops-rag-agent
html_url:  https://github.com/Vyshnavi975/llmops-rag-agent
desc: Agentic RAG ... eval harness ...
```

Map to shelf URL list → existing `classifyUrl` (toolkit → shelf off Brief).

### Fixture

`desk/src/lib/__tests__/fixtures/github-search-agent-eval.json` (2 hits)

### Pros / cons

- Pros: fills FREE-PROVIDERS #5 gap; reuses shelf classifier; zero creds
- Cons: **brutal** unauth rate limit (10/h) — must fail soft on 403/429; noisy low-star repos need classifyUrl

---

## Scout recommendation (non-binding)

If Architect wants **cyber depth**: Fox-IT. If **toolkit shelf coverage**: GitHub (with hard rate-limit soft-fail). Not both this pulse.

Reddit stays **blocked** (403) — not a candidate.
