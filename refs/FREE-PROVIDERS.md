# Free providers lock (Canberk)

SAGE desk ingest uses **public/free sources only**. No paid social listening.  
**Scout refresh:** 2026-09-04 (post-Wikidata DENY wire · Crossref live · Digest cadence live · HF HTML deferred · S2 deferred)

**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · never invent `004` · zero credentials.

## Allowed (live)

| Source | URL / path | Notes |
|--------|------------|-------|
| **HF `daily_papers`** | `https://huggingface.co/api/daily_papers` | Primary Papers JSON. Upvote merge; gen/sim never displaces agent keeps. |
| **Toolkit shelf** | local URLs → `scoreUrlList` / `classifyUrl` | OWASP / scanners / GitHub toolkits → shelf only (never Brief). |
| **Curation URL list** | `fancyTWEETScuration0209.txt` (if present) | Offline scoring — no paid API. |
| **arXiv Atom** | `https://export.arxiv.org/api/query` | Papers enrich + shelfOnly search. Never Brief. ≤1/3s · 24h cache. |
| **HN Algolia** | `https://hn.algolia.com/api/v1/search` | Pulse chatter + `classifyPost`/DENY. Never Brief. ≤1/2s · 30m cache. |
| **Lab blog RSS** | OpenAI news · DeepMind · Google AI · HF blog | First-party GET. Pulse/shelf · `brief=false`. Anthropic/Meta: no first-party RSS. |
| **Security RSS** | ToB + Fox-IT + Project Zero (`feed.xml`) | Pulse/Digest-refs/shelf · `rss_security.brief=false`. NCC skip. Stream-cap PZ. |
| **GitHub unauth search** | `https://api.github.com/search/repositories` | Toolkit shelf via `classifyUrl`. Never Brief/Pulse lead. ≤1/ingest · 24h cache · soft-fail 403/429 · **10 req/h** unauth. |
| **OpenAlex** | `https://api.openalex.org/works` | Papers enrich (id/year/DOI). Soft-fail 429. Never displace HF keeps. |
| **Crossref** | `https://api.crossref.org/works` | Papers DOI via `filter=doi:` / bibliographic (not direct arXiv DOI GET). Soft-fail 429/5xx/404. Non-destructive vs OpenAlex. |
| **Wikidata** | `https://www.wikidata.org/w/api.php` (`wbsearchentities`) | DENY / flatten grounding only. Curated seeds + allow/reject. Never Brief / never Pulse lead. ≤3 seeds/tick · ≤1/2s · 24h cache · soft-fail 429/5xx. |

## Watchlist (curation only — not live X)

- `x-watchlist` + query builders = operator log / plan
- **No** `api.x.com` · **No** `X_BEARER_TOKEN`

## Explicitly banned

- Paid X / Twitter API, Grok paid firehose, BuzzSumo, Meltwater, Brandwatch
- Zapier classify / paid social listening
- Login-wall scrapes
- Using any source to bump cycle to `004` or change lead off `hf-incident`

## Deferred / blocked (do not wire)

| Source | Status | Why |
|--------|--------|-----|
| **HF `/papers` HTML** | **DEFERRED** (Director) | Ids-only harvest; ranking ≠ `daily_papers`. See `SCOUT-HF-PAPERS-HTML-FALLBACK.md`. JSON primary stays. |
| **Reddit `.json`** | **BLOCKED** | r/LocalLLaMA → HTTP **403** to bot UA. Notes-only. |
| **Semantic Scholar** | notes | Live probe **429** without key. Soft-fail if ever cut. |
| **NCC Group RSS** | skip | First-party feeds return HTML/404. |
| **Anthropic / Meta RSS** | skip | No stable first-party feed. |

## Stamp / STALE

`bun run ingest` stamps `CRAWL_AT` + `CURRENT.json` so Pulse `.sage-stale` clears (stamp even if one provider soft-fails).

## Docs hook

`xIngestEnv()` reports `ready: false` (paid X) and points here.

## Next (Architect must APPROVE before Coder)

1. Optional later: Semantic Scholar soft-fail-only if zero-cred usable (still **429** without key — deferred)
2. HF HTML fallback only if Director re-opens after JSON outages
3. No new paid / credentialed providers

**Wired this pulse:** Wikidata DENY grounding (`WIRE-WIKIDATA-DENY.md`) · Digest cadence already live · Crossref live

Architect signs each new fetcher. Ingest must keep working with **zero** credentials.

### Architect freeze 2026-09-04T10:05Z
**Next HTTP wires FROZEN** until desk visual stays green one full pulse. See `DESK-HARDEN-VISUAL.md`. S2/HF HTML remain deferred.
