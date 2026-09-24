# Beat 2 re-land — cross-source dedupe v2 (2026-09-24)

## Why v1 missed (0 multi-source / 171 items)
- **Freshness was the real blocker.** HN used Algolia relevance search with no time filter → items from 2017–2026-08 (e.g. 2018 Intel microcode). Top cross-source raw Jaccard on the v1 data was **0.25** — nothing overlapped.
- v1 raw-token Jaccard ≥ 0.6 was also too strict for rewording ("Google Private AI Compute with server-side memory" vs "Advancing Private AI Compute with secure, server-side memory" = 0.55).

## v2
- HN: every Algolia request carries `numericFilters=created_at_i>now-48h`; plus one OR-entity recency sweep (OpenAI/Anthropic/Claude/Gemini/Google/DeepMind/Nvidia/Mistral/Hugging Face/GPT, points ≥ 3, 2 pages × 20). Same free endpoint, no new sources; rotate ≤3 standing queries unchanged.
- Headline normalization: lowercase, NFKD, punctuation/stopwords stripped, publisher + known-outlet suffix stripped, light stem, synonyms (strike/ink/sign, agreement/deal), money (`$11.6 Billion` → `11.6b`) and versions kept, ticker aliases (GOOGL/Alphabet → google).
- Score = ½ IDF-weighted containment + ½ IDF-weighted Jaccard + ≤0.15 shared-entity bonus. Threshold **0.6**.
- Guards: ≥2 shared content tokens (or full containment + ≥1); product-version conflict blocks (GPT-6 ≠ GPT-5.6); 24h published-time window (48h for near-identical ≥0.9); missing time → +0.1 threshold.
- URLs: utm_*/ref/fbclid/gclid/mc_*/ncid/_hsenc/… stripped; legacy Google News blobs decoded offline, encrypted blobs → title-only matching.

## Real runs
| | items | clusters | multi-source | multi-member |
|---|---|---|---|---|
| v1 (21:18Z) | 171 | 170 | 0 | 1 |
| v2 run 1 (21:26:40Z) | 218 | 206 | 3 | 8 |
| v2 run 2 (21:29:34Z) | 218 | 207 | 3 | 8 |

Per source (run 2): hn-algolia 77 · rss-lab 106 · rss-security 27 · gnews-rss 8.

Multi-source clusters (run 2):
1. Advancing Private AI Compute with secure, server-side memory — rss-lab (DeepMind) + HN — score 1 (same URL; title-only score 0.773)
2. Gemini 3.8 text-to-speech says hello — rss-lab (DeepMind) + HN — score 1.0 (title; different URLs)
3. Transformers now runs llama.cpp quants — rss-lab (HF) + HN — score 1 (same URL; identical title, 30.3h apart)

NEW proof: run 1 flagged 75 new keys (all fresh HN); run 2 (HN cache wiped → live refetch) flagged **0** new across 245 seen-index keys.

Caveat: GNews is capped at 8 cards / 2 queries per tick; none of its 8 items had an HN/lab counterpart in-window (the Bloomberg "Anthropic Strikes $12B AI Computing Deal with Akamai" HN post wasn't among the top-40 sweep hits). Top near-misses are in `artifacts/sage/ingest-last.json` → `dedupe.near_misses`.

Reviewer soft note (b8bd279 PASS): identical/near-identical headlines (≥0.9) use the 48h window, not 24h — that is why the Transformers llama.cpp quants HF+HN pair (30.3h apart; HF feed has date-only 00:00 timestamps) merged past 24h. Accepted, documented.

## Beat 5 — Google News joins clusters (2026-09-24T21:43:33Z crawl)
- **Suffix check (real titles):** all 609 probed GNews titles carry `<source>`; `stripPublisherSuffix(title, publisher)` removed the " - Publisher" suffix on every one. Added: publisher fallback from the title suffix when `<source>` is missing, site-brand segments tied to the publisher (" | NVIDIA Technical Blog" from NVIDIA Developer), and leading desk labels ("Exclusive | ", "Opinion | "). Identical normalized headlines made only of names/versions ("Introducing GPT-6 Sol and Luna") are no longer blocked as thin-overlap.
- **Why GNews still matched nothing after the suffix fix:** the 8-card cap kept only the newest items, which were trending finance/deal stories. The lab/HN-overlapping items were older within the day.
- **Wider free queries:** standing ≤2/tick (unchanged) + lab-name allowlist `Google DeepMind · Gemini · NVIDIA AI · Mistral AI · Microsoft Research · Google Research` ≤2/tick, all with `when:2d`. Same 2s throttle and 6h cache; the first HTTP 429 stops further live GNews requests this tick. Display pool is 32 (round-robin per query).
- **Corroborators:** from the whole fetched pool (334 items this run), GNews items whose headline *directly* matches an HN/lab/security item under the unchanged v2 rules (threshold 0.6, 24h/48h window, guards) are attached, ≤3 per anchor (10 this run). GNews stays last in the lead order and is never Brief.
- **HN AI-relevance gate:** HN rows need an AI/ML term, a lab/model name, or an AI-lab domain. Generic Google/Apple/Nvidia/Meta names alone don't count. 16 of 77 HN hits dropped this run (e.g. Antennagate ×3, Java JDK benchmark, Google GDPR fine, Nvidia KVM GPU).
- **Result:** 236 items → 216 clusters, 11 multi-source (6 with GNews), 0 wrong merges on manual review. Per source: HN 61 · lab 106 · security 27 · GNews 42 (32 shown + 10 corroborators).
