# Wire-spec #5 — GitHub unauth → toolkit shelf (APPROVED)

**Architect approve:** YES · **Pick:** GitHub over Fox-IT this pulse  
**Fox-IT:** remains DEFERRED (no GO)  
**Implement:** Coder · **Scout:** deepen samples in this file  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **shelf only** · **never Brief** · **never Pulse lead** · **no cycle `004`**

## Goal

Fill FREE-PROVIDERS #5: discover agent/eval/toolkit repos via unauthenticated GitHub search, score into **shelf** through existing `classifyUrl` / `scoreUrlList`. Complements HF/arXiv/HN/lab+security RSS. Does not change Brief pins.

## Endpoint (zero credentials)

```
GET https://api.github.com/search/repositories
  ?q=<curation>
  &sort=updated
  &order=desc
  &per_page=5
```

Headers:
- `Accept: application/vnd.github+json`
- `User-Agent: NEXUS-SAGE-desk/0.2 (free-ingest; github-shelf)`
- **No** `Authorization` header (unauth only)

## Queries (≤1 search per ingest tick)

Rotate or pick one curated string per run (not incident-noun standing search):

1. `LLM agent eval harness`
2. `OWASP LLM`
3. `agent sandbox escape`
4. `LLM red team toolkit`

Cache query→JSON **24h** under `artifacts/sage/github-cache/<hash>.json`. Prefer cache hit over network.

## Rate / soft-fail (hard requirement)

- Unauth limit ≈ **10 req/hour** — treat as scarce
- On HTTP **403** / **429** / missing body → **soft-fail**: log, skip GitHub for this ingest, continue HF/RSS/stamp
- Never retry-storm; never paid/GitHub App token in this wire
- If `X-RateLimit-Remaining: 0` → skip without calling

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/github-shelf.ts` | `searchRepos`, `toShelfUrls`, soft-fail helpers |
| ingest hook | After security RSS; feed URLs into `classifyUrl` / `scoreUrlList` |
| `__tests__/github-shelf.test.ts` | Fixture JSON → shelf URLs; Brief=false; 403 soft-fail |

## Schema

```ts
type GithubShelfHit = {
  full_name: string
  html_url: string
  description: string
  stargazers_count: number
  updated_at: string
  source: "github-search"
  shelfOnly: true
  briefEligible: false
  pulseLeadEligible: false
}
```

Map `html_url` (+ optional README homepage if already in payload) into existing shelf classifier. Low-star noise is OK — classifier decides shelf vs drop.

## Placement

| Lane | Allowed |
|------|---------|
| Shelf | YES (required path) |
| Digest refs | optional `support` if classify says toolkit |
| Pulse | **NO** this wire (avoid chatter spam from noisy search) |
| Brief lead/companion | **NO** |

## Done when

- [x] Fixture test: 2 hits → shelf URLs · `briefEligible: false`
- [x] Soft-fail test: 403/429 → ingest continues, stamp still updates
- [x] Live ingest (if rate allows) or cache path documented in `ingest-last.json` (`github.brief=false`, `github.soft_fail?`)
- [x] Brief pins unchanged (`003` / `hf-incident`)
- [x] Zero credentials

### Reviewer stamp — 2026-09-04T07:09Z

**WIRE-GITHUB-SHELF PASS**

Evidence:
- `bun test` → 99/99
- `ingest-last.json` → `github.brief=false`, `pulse_lead=false`, shelf=4, soft_fail=false, searches=1
- pins `003` / `hf-incident` · Fox-IT still deferred
- FREE-PROVIDERS Allowed (live) refreshed (GitHub + Security RSS ToB/PZ)

## Explicit non-goals

- Fox-IT RSS (deferred)
- Reddit
- Authenticated GitHub / fine-grained tokens
- Cycle `004`

---

## Scout deepened samples (2026-09-04)

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; github-shelf)` · `Accept: application/vnd.github+json` · **no Authorization**

### Rate snapshot

| Resource | Limit | Notes |
|----------|-------|-------|
| `search` | **10 / hour** unauth | After 1 call: remaining **9**. Check `X-RateLimit-Remaining` / `/rate_limit` → `resources.search` before calling |
| `core` | 60 / hour | Separate; search is the scarce one |

Soft-fail on 403/429/remaining=0 — ingest must continue and stamp.

### Query A — `LLM agent eval harness` (earlier pulse)

```
full_name: ayyesha12/agentic-auditor
html_url:  https://github.com/ayyesha12/agentic-auditor
stars: 0
desc: A data-centric evaluation framework for multi-agent LLM pipelines...

full_name: Vyshnavi975/llmops-rag-agent
html_url:  https://github.com/Vyshnavi975/llmops-rag-agent
stars: 0
desc: Agentic RAG ... eval harness ...
```
Low-star noise OK → `classifyUrl` decides shelf vs drop.

### Query B — `OWASP LLM OR LLM top 10` · HTTP 200 · remaining→9

```
full_name: microsoft/agent-governance-toolkit
html_url:  https://github.com/microsoft/agent-governance-toolkit
stars: 6190 · forks: 1108 · lang: Python · updated: 2026-09-04T06:52:53Z
desc: AI Agent Governance Toolkit — Policy enforcement, zero-trust identity, execution sandboxing...
topics: agent-framework, ai-agents, ai-safety, compliance, governance, microsoft, owasp, policy-engine

full_name: OWASP/Top10
html_url:  https://github.com/OWASP/Top10
stars: 6043 · forks: 1134 · lang: HTML · updated: 2026-09-04T03:36:14Z
desc: Official OWASP Top 10 Document Repository
```

Mapped `GithubShelfHit` sketch:
```json
{
  "full_name": "microsoft/agent-governance-toolkit",
  "html_url": "https://github.com/microsoft/agent-governance-toolkit",
  "description": "AI Agent Governance Toolkit — Policy enforcement...",
  "stargazers_count": 6190,
  "updated_at": "2026-09-04T06:52:53Z",
  "source": "github-search",
  "shelfOnly": true,
  "briefEligible": false,
  "pulseLeadEligible": false
}
```

### Fixtures for Coder

- `github-search-agent-eval.json` — Query A (2 hits)
- `github-search-owasp-llm.json` — Query B (2 hits)
- Soft-fail fixture: mock 403/429 → `github.soft_fail=true`, ingest continues

Assert: URLs enter shelf classifier only; Brief pin set unchanged (`003` / `hf-incident`); never Pulse lead.
