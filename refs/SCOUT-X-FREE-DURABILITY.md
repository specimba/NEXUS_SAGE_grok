# Scout — X-free AI-news pulse durability report

**Audience:** Architect · Director · Canberk  
**Date:** 2026-09-07 · cycle `003` · lead `hf-incident` · Sol≠Astra · no `004`  
**Locks:** free only · Brief pins never from pulse · paid X **DENY** · Voice/Digest **PARKED**  
**Status:** Report ready · **Bluesky DENY** (Canberk 2026-09-07) · no `WIRE-*` until Architect APPROVES after Track A + free-pulse rank.

**Veto update:** Bluesky is **not** a wire candidate. Free-pulse deepen = **HN · HF · Lab/Sec RSS · OpenAlex · GitHub shelf** only. Steal patterns from trend-pulse/harken; do not steal Bluesky/X paths.

---

## 1. Verdict table (X-shaped paths)

| Path | Durability | Cost / auth | Scout call | Notes |
|------|------------|-------------|------------|-------|
| **Skip-X (recommended default)** | **5 / 5** | zero | **DEFAULT** | Double down HN · HF · lab/sec RSS · OpenAlex/Crossref · GitHub shelf. Honest, already wired. |
| **Allowlisted accounts via free mirrors** | **2 / 5** | zero–low | **HOLD / notes-only** | Nitter-class mirrors: X C&D Aug 2026, instances flapped, RSS often disabled. Not a foundation. |
| **X bearer later** | **1 / 5** (policy) | paid / DENY | **DENY** | Paid X expensive. Canberk + Director: **DENY**. No `X_BEARER_TOKEN`, no `api.x.com`. |

**Architect lean confirmed by live research:** (1) Skip-X + deepen free stack · (2) allowlist only if a *stable first-party* free surface appears (it has not) · never build desk on scrapers that die weekly.

---

## 2. Repo ratings — trend-pulse & harken

Live README + project pages fetched 2026-09-07. GitHub REST API rate-limited from this box; stars/forks from public pages; activity = CI badges + fresh README surface (both present).

### `claude-world/trend-pulse`

| Dimension | Finding |
|-----------|---------|
| What | Agentic trend aggregator: CLI + library + MCP + dashboard. Claims **20 zero-auth built-ins** + **17 plugins**. MIT. ~**58★**. |
| Free-first? | **Partial.** Built-ins advertised zero-auth (HN, Mastodon, Bluesky, Google Trends/News RSS, arXiv, Lobsters, Wikipedia, …). Plugins include scrapes (Threads, TikTok, Weibo, PTT, GitHub HTML trending) + **`x_trending` optional bearer**. |
| X dependence | **Optional plugin only** — not required for core. Still documents X bearer for “improved limits.” |
| Auth needs | Core: none. Optional: Cloudflare browser render, Anthropic for LLM scoring, X bearer plugin. |
| Scrape fragility | **High on plugins.** GitHub trending = HTML scrape; Reddit listed as built-in JSON — **Reddit unauth `.json` → 403 since May 2026** (matches our FREE-PROVIDERS BLOCKED). PTT/Weibo/Threads-class scrapes = weekly-break risk. |
| Soft-fail honesty | Good shape: `sources_ok` / `sources_error` in JSON (e.g. Wikipedia 429). |
| License | MIT |
| Last activity | CI badge live; README current (PyPI + uvx MCP path). Small project; treat as **pattern library**, not production dependency. |
| **Durability** | **3 / 5** |
| **Steal-or-skip** | **Steal patterns · skip product.** Steal: free-source allowlist mindset, soft-fail merge, Bluesky/Mastodon/Google News RSS as *candidates*. Skip: wholesale install, scrape plugins, Reddit JSON assumption, content-factory MCP surface, any X plugin. |

### `VladUZH/harken`

| Dimension | Finding |
|-----------|---------|
| What | Self-hosted social listening: keyword → HN / Bluesky / SO / RSS (+ Reddit OAuth, Mastodon token, **X bearer**, YouTube key). Sentiment + themes → SQLite dashboard. MIT. ~**19★**. |
| Free-first? | **Yes (defaults).** `HARKEN_SOURCES` default = `hackernews,bluesky`. `harken demo` / `harken track` work with **no API key**. |
| X dependence | **Explicit BYO bearer** (`HARKEN_X_BEARER_TOKEN`). Documented as needs developer plan — aligns with our DENY. |
| Auth needs | Defaults: none. Reddit: OAuth (anon JSON “no longer reliable” — matches 2026 reality). Mastodon: usually instance token. X/YouTube: keys. |
| Scrape fragility | **Low on defaults** (public HN Algolia + Bluesky AppView). Higher if operator enables fragile sources. |
| Soft-fail honesty | Strong: failed source does not stop others; retries + `Retry-After`; per-source metrics. |
| License | MIT |
| Last activity | CI badge live; README extensive (watch/backfill/alerts/RBAC). Smaller ★ count; operator-grade honesty > hype. |
| **Durability** | **4 / 5** (for pattern steal on free defaults) |
| **Steal-or-skip** | **Steal patterns · skip wholesale.** Steal: keyword allowlist watch shape, free-default source set, soft-fail + backoff, “X is keyed / optional / never required.” Skip: adopting Harken as parallel desk product; wiring X/YouTube/Reddit OAuth into SAGE ingest. |

### Side-by-side

| | trend-pulse | harken |
|--|-------------|--------|
| Durability | **3** | **4** |
| X-dependence | Optional plugin | Optional keyed source (honest DENY path) |
| Free-first | Claimed 20; some claims stale (Reddit) | Defaults truly free |
| Steal-or-skip | Steal allowlist + soft-fail; skip scrapes | Steal watchlist + backoff; skip SaaS-shaped full port |
| Fit for SAGE | Inspiration for Track B deepen | Closer to “respectful AI news” keyword watch |

---

## 3. Recommended free-stack deepen order (post A1–A3)

Director order: **Track A automation first**, then this report, then free pulse deepen. Voice/Digest stay parked.

### Already wired (do not re-invent)

| Source | Role | Never |
|--------|------|-------|
| HF `daily_papers` | Papers primary | Brief lead |
| arXiv Atom | Papers enrich / shelf | Brief lead |
| OpenAlex | Papers enrich | Brief lead · hard-fail |
| Crossref | DOI enrich | Brief lead |
| HN Algolia | Pulse chatter | Brief lead |
| Lab RSS | Lab signal | Brief lead |
| Security RSS | Sec signal | Brief lead |
| GitHub unauth search | Toolkit shelf | Brief / Pulse lead |
| Wikidata | DENY grounding only | Brief / Pulse lead |

### Next deepen candidates (after A1–A3 · Architect APPROVE each)

| # | Candidate | Why | Durability | Soft-fail notes |
|---|-----------|-----|------------|-----------------|
| 1 | **Bluesky public AppView** `api.bsky.app` `searchPosts` | Open AT Protocol; no key for public read; AI discourse migrated here. | **4** | Use `api.bsky.app` not `public.api.bsky.app` (403 on search). Unauth **cursor pagination 403 since mid-2026** — paginate with `sort=latest` + `until=` timestamp; dedupe `uri`. Bound pages/tick. |
| 2 | **OpenAlex backoff harden** | Already wired; **429 often** (last ingest soft-fail). | n/a (ops) | Exponential backoff + `Retry-After` · never displace HF keeps · A4 health rail. |
| 3 | **More first-party lab RSS** | Extend only where stable Atom/RSS exists. | **4–5** | Anthropic/Meta still **no** stable first-party RSS — skip inventing scrapes. |
| 4 | **HF blog / Spaces changelog RSS** (if not already in lab set) | First-party; fits HF-lead world. | **4** | `brief=false` · shelf/pulse only. |
| 5 | **Mastodon public trends** (pick 1–2 instances) | Public trending tags/links; zero auth on many instances. | **3** | Instance policy churn; rate ~300/5min; soft-fail; never Brief. |
| 6 | **Google News RSS** `news.google.com/rss?q=` | Zero key; common free pattern 2026. | **2–3** | Unofficial · no SLA · format can change — soft-fail only, never sole lead. |
| 7 | **Lobsters / dev.to public JSON** (optional spice) | trend-pulse lists as zero-auth. | **3** | Nice-to-have after core free stack; not blocking. |

**Not next:** TrendsMCP / paid free-tier SaaS keys · Reddit (BLOCKED) · Semantic Scholar without key (429 deferred) · Nitter / XCancel mirrors as ingest deps.

---

## 4. What to NEVER wire

| Ban | Why |
|-----|-----|
| **Paid X / Twitter API / bearer token** | Canberk DENY · Director DENY · expensive · FREE-PROVIDERS banned |
| **Scrapers that die weekly** | GitHub HTML trending farms, Threads/TikTok/Weibo scrapes, Nitter-class X mirrors (C&D Aug 2026; flapping) |
| **Brief promotion from pulse** | Locks: never invent Brief pins · `briefEligible:false` on all pulse pipes · cycle stays `003` / `hf-incident` |
| **Reddit unauth JSON** | 403 since May 2026 · already BLOCKED |
| **Login-wall / credentialed social listening SaaS** | BuzzSumo · Meltwater · Brandwatch · TrendsMCP keyed tiers |
| **Wholesale trend-pulse / harken as desk product** | Steal patterns only; SAGE owns ingest contract |

---

## 5. Soft-fail / rate-limit honesty

| Provider | Pattern | Contract |
|----------|---------|----------|
| **OpenAlex** | **HTTP 429 often** (desk snapshot soft-fail) | Soft-fail · stamp crawl anyway · never hard-fail ingest · never displace HF keeps · backoff + jitter |
| Crossref | 429 / 5xx / 404 | Soft-fail · non-destructive vs OpenAlex |
| GitHub unauth | 403 / 429 · **10 req/h** | ≤1/ingest · 24h cache · soft-fail |
| Bluesky (if wired) | 403 on bad host / cursor; admin load shedding | Soft-fail · time-page · bound pages |
| Mastodon | 429 per instance | Soft-fail · one instance fail ≠ all fail |
| Google News RSS | silent format break | Soft-fail · empty ≠ crash |
| HN Algolia | Generous; rare 5xx | Existing ≤1/2s · 30m cache |
| Paid X | — | **Skipped / DENY** — report as skipped, not soft-fail-success |

Ingest must keep working with **zero credentials**. Partial provider failure is normal, not a ship block.

---

## 6. Scout ranking (aligned with Director)

| Rank | Work | Status |
|------|------|--------|
| **(1)** | Track A automation **A1–A3** (cron harden · STALE auto-ingest · Digest DUE dual-home export) | **First** — freeze lift = automation only |
| **(2)** | This X-free durability report | **DONE** (this file) |
| **(3)** | Free pulse deepen (OpenAlex backoff → lab/HF RSS → … · **no Bluesky**) | **After** Architect APPROVED wire picks |
| — | Voice / Digest L·mid·R parity | **PARKED** |
| — | Paid X | **DENY** |
| — | Brief UI | **SHIP-for-now** (Canberk) |

---

## 7. One-page recommendation — Architect APPROVED wire pick (later)

**Ship order when freeze lifts for Track B:**

1. **Do not wire X.** Path = Skip-X. Paid bearer stays DENY. Nitter mirrors stay notes-only.
2. **Do not vendor trend-pulse or harken.** Steal: soft-fail merge, free-default source honesty, keyword-allowlist *shape* for respectful watchlists. Skip Bluesky/X paths entirely.
3. **First pulse deepen (when APPROVED):** **no new social network.** Harden what we have — OpenAlex 429 backoff + health rail · extra first-party lab/HF RSS only · Google News RSS as optional soft spice.  
4. **Never:** Bluesky · paid X · Nitter · Reddit unauth · scrape farms.  
5. **Optional spice only (APPROVED later):** Mastodon allowlisted instances — not a substitute for HN/HF/RSS.
6. **Gates unchanged:** Architect signs each fetcher · Reviewer stamp-truth · no cycle `004` · no Brief pins from trends · Sol≠Astra · lead stays `hf-incident`.

**Top recommendation in one line:**  
**Skip-X · finish A1–A3 · deepen free pulse only on HN/HF/Lab+Sec RSS/OpenAlex/GitHub — steal harken free-first honesty + trend-pulse soft-fail merge; never Bluesky, never paid X, never scrapers.**

---

## Research stamps

| Item | Evidence |
|------|----------|
| trend-pulse README | https://github.com/claude-world/trend-pulse · MIT · zero-auth table · X plugin optional · Reddit/scrape plugins fragile |
| harken README | https://github.com/VladUZH/harken · MIT · defaults HN+Bluesky · X bearer BYO · Reddit OAuth |
| Bluesky 2026 | `public.api.bsky.app` search 403; use `api.bsky.app`; unauth cursor 403 → `until=` pagination |
| Nitter 2026 | X C&D ~2026-08-24; project paused then “will continue”; **not durable ingest** |
| Reddit 2026 | Unauth `.json` → 403 (May 2026) — confirms our BLOCKED |
| Google News RSS | Free/no key; unofficial/no SLA — soft-fail only |

**Scout:** Gürok worker · NEXUS SAGE · 2026-09-07


## Architect / Canberk veto — 2026-09-07
Canberk: **Bluesky DENY** — not a respected AI-news platform for this desk. Strike Scout “Bluesky as sole net-new social.” Free pulse deepen = **HN · HF · Lab+Sec RSS · OpenAlex · GitHub shelf** only. Paid X remains DENY. Scout will not propose Bluesky again.
