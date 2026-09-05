# Wire-spec #1 — arXiv API enrichment (APPROVED)

**Architect approve:** YES · **Implement:** Coder · **Scout notes:** fill samples into this file or sibling  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **never Brief pins**

## Goal

Enrich Papers lane + Digest refs with public arXiv Atom metadata. Complements HF `daily_papers` arXiv hrefs. Does **not** change lead, cycle, or Brief pin set.

## Endpoint (zero credentials)

```
GET https://export.arxiv.org/api/query
```

Prefer **GET** (cache-friendly). Never POST. User-Agent: `NEXUS-SAGE-desk/0.2 (free-ingest; contact: local)`.

### Query modes

| Mode | Params | When |
|------|--------|------|
| By id | `id_list=<id1,id2>` | Enrich papers already on desk from HF ids |
| Search | `search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL` + `sortBy=submittedDate` + `sortOrder=descending` | Optional top-N shelf fill |
| Page | `start=0` · `max_results≤25` | Hard cap 25 per ingest tick |

## Rate limit

- **≤1 request / 3 seconds**, single connection
- On HTTP 429 / body `Rate exceeded.` → wait ≥10s once, then skip (don’t hammer)
- Cache Atom by id on disk under `artifacts/sage/arxiv-cache/` for 24h

## Code paths (exact)

| Path | Role |
|------|------|
| `desk/src/lib/arxiv-enrich.ts` | `fetchArxivByIds`, `parseAtomEntries`, `toShelfItems` |
| `desk/scripts/ingest.mjs` (or existing ingest) | Call enrich after HF merge; stamp only |
| `desk/src/data/papers.ts` | Merge enriched fields onto existing paper rows |
| `desk/artifacts/sage/arxiv-cache/*` | Optional cache (gitignored ok) |
| Tests: `desk/src/lib/__tests__/arxiv-enrich.test.ts` | Fixture Atom → schema; id merge; never emits Brief pin |

## Output schema (internal)

```ts
type ArxivEnrichment = {
  id: string            // e.g. "2401.12345"
  title: string
  summary: string       // abstract, truncated ≤600 chars in UI
  published: string     // ISO
  authors: string[]     // ≤8
  primaryCategory: string
  absUrl: string        // https://arxiv.org/abs/...
  pdfUrl: string        // https://arxiv.org/pdf/...
  source: "arxiv-api"
  shelfOnly: true       // locked true
}
```

## Placement rules

- **Papers lane** — expand abstract / copy-id / abs+pdf links
- **Digest refs** — may cite as `role: "support"`
- **Shelf** — search hits that aren’t already HF keeps go to shelf scoring
- **Brief** — **forbidden**. No new pins from arXiv alone.
- Gen/sim titles still cannot displace kept agent papers (same HF rule)

## Fail closed

- Network/429/parse error → log + continue ingest (HF path still stamps)
- Malformed id → skip entry
- Must not bump `CURRENT.id` or invent cycle `004`

## Done when

- [x] `bun run ingest` enriches ≥1 known HF arXiv id with abstract offline-fixture tested
- [x] Live call works with zero env secrets
- [x] Brief pin set unchanged (`hf-incident` lead)
- [x] Reviewer: no Brief pollution from arXiv

---

# Wire-spec #2 — HN Algolia (APPROVED with constraints)

**Architect approve:** YES as **Pulse chatter only** · after arXiv lands  
**Not** a news lead · still run `classifyPost` / DENY / Sol≠Astra

## Endpoint

```
GET https://hn.algolia.com/api/v1/search?query=...&tags=story
```

No key. Cap `hitsPerPage≤20`. Queries seeded from watchlist nouns (OpenAI, Anthropic, Hugging Face, agents, eval) — **no incident-noun standing search** that flattens Sol/Astra.

## Placement

- Pulse candidates only (media cards / ranked chatter)
- Must pass `classifyPost` — rumor/DENY → tag or drop
- Never Brief lead/companion from HN alone
- Never toolkit Brief pins

## Rate

Be polite; ≤1 req/2s; cache 30m by query hash under `artifacts/sage/hn-cache/`.

## Reject / defer

- Reddit / lab RSS / GitHub search — **not approved this slice**; Scout may prep notes only.

---

## Scout samples (live-fetched 2026-09-04)

### A. arXiv Atom (trimmed) — search `all:agent AND all:LLM`, max_results=1

Request:
```
GET https://export.arxiv.org/api/query?search_query=all:agent+AND+all:LLM&start=0&max_results=1
```

Minimal entry fields Coder must parse:
```xml
<entry>
  <id>http://arxiv.org/abs/2409.01907v1</id>
  <title>Focus Agent: LLM-Powered Virtual Focus Group</title>
  <published>2024-09-03T13:56:14Z</published>
  <summary>In the domain of Human-Computer Interaction, focus groups...</summary>
  <link href="https://arxiv.org/abs/2409.01907v1" rel="alternate" type="text/html"/>
  <link href="https://arxiv.org/pdf/2409.01907v1" rel="related" type="application/pdf" title="pdf"/>
  <arxiv:primary_category term="cs.HC"/>
  <author><name>Taiyu Zhang</name></author>
</entry>
```

Mapped `ArxivEnrichment` example:
```json
{
  "id": "2409.01907",
  "title": "Focus Agent: LLM-Powered Virtual Focus Group",
  "summary": "In the domain of Human-Computer Interaction, focus groups...",
  "published": "2024-09-03T13:56:14Z",
  "authors": ["Taiyu Zhang", "Xuesong Zhang", "Robbe Cools", "Adalberto L. Simeone"],
  "primaryCategory": "cs.HC",
  "absUrl": "https://arxiv.org/abs/2409.01907",
  "pdfUrl": "https://arxiv.org/pdf/2409.01907",
  "source": "arxiv-api",
  "shelfOnly": true
}
```

By-id enrich (preferred after HF merge):
```
GET https://export.arxiv.org/api/query?id_list=2409.01907
```
Strip version suffix (`v1`) before cache key. Rate: ≤1 req / 3s; 429 → wait ≥10s once then skip.

### B. HN Algolia (trimmed) — Pulse only

Request:
```
GET https://hn.algolia.com/api/v1/search?query=Hugging%20Face&tags=story&hitsPerPage=1
```

Hit shape (live sample):
```json
{
  "objectID": "49458161",
  "title": "Nvidia agrees to acquire Hugging Face for $13B",
  "url": "https://www.businessinsider.com/nvidia-in-talks-to-buy-hugging-face-13-billion-dollars-2026-8",
  "author": "mfiguiere",
  "points": 1982,
  "num_comments": 925,
  "created_at": "2026-08-27T01:12:55Z",
  "_tags": ["story", "author_mfiguiere", "story_49458161"]
}
```

Pulse candidate mapping (must still pass `classifyPost`):
```json
{
  "id": "hn:49458161",
  "text": "Nvidia agrees to acquire Hugging Face for $13B",
  "url": "https://www.businessinsider.com/nvidia-in-talks-to-buy-hugging-face-13-billion-dollars-2026-8",
  "source": "hn-algolia",
  "score": 1982,
  "at": "2026-08-27T01:12:55Z"
}
```
Rate: ≤1 req / 2s; cache 30m by query hash. Cap `hitsPerPage≤20`.

### C. DENY / lock examples (fixtures for tests)

| Input snippet | Expected |
|---------------|----------|
| "Astra agents compromised Hugging Face" | **DENY / flatten** — Astra ≠ HF attacker; Sol did HF (lock) |
| "GPT-5.6 Sol = Astra" / "Sol is Astra" | **DENY** Sol≠Astra |
| "Nvidia acquires HF for $13B" (HN hit above) | Pulse OK as chatter; **not** Brief lead; may tag announced-deal language per hygiene |
| Rumor: "Bloomberg sources say OpenAI pausing training" | `classifyPost` → rumor tag / drop — not Brief |
| arXiv abstract alone, no HF keep | Papers/shelf enrich only — **zero** Brief pins |
| Toolkit URL in HN title (e.g. scanner GitHub) | shelf via `classifyUrl` — off Brief |

### D. Fixture files (Coder)

Drop trimmed Atom + HN JSON under `desk/src/lib/__tests__/fixtures/`:
- `arxiv-atom-2409.01907.xml`
- `hn-hugging-face-hit.json`

Tests must assert: enrichment `shelfOnly: true`; Brief pin set unchanged; invent-004 still impossible from these sources.
