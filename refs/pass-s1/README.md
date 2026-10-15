# PASS-S1 proof (branch pass-s1, base b4c8f44, local only, not pushed)

Rebased per the Architect's §S1.8 ruling: hotfix first, then S1 with S1.2 and S1.4 still early.

| Commit | What |
|---|---|
| 0908c23 | **Hotfix.** Empty Gmail crawl writes `GMAIL_NEWS = []` (was a sparse `[ , ]` that crashed rank:snapshot) |
| 489f43c | **S1.2 early land.** Embrace The Red as one SECURITY_FEEDS entry |
| 3cb1b6d | **S1.4 early land.** HN title queries; empty list = off; test 6 asserts the added count |
| 2f55be6 | S1.1 analyst feeds: ANL chip, `analyst-only` lead rule |
| 419a3c1 | S1.3 `releases_atom`: REL chip, releases-seen.json |
| e8e5004 | S1.5 `keywords.gmail_senders` (empty = off), sponsored-subject drop |
| 55d69bc | S1.7 acceptance tests 1, 2, 8; test 2 switches everything off through the real config |
| (this) | Proof |

Each feature commit seeds its config and regenerates `src/data/sage-setup.ts`. Its `since_commit` is the commit's real parent SHA.

## Tests
- Before (b4c8f44): 702 pass / 0 fail. See `tests-before-b4c8f44.txt`.
- After: 781 pass / 0 fail. See `tests-after.txt`.
- S1 and hotfix files only: 93 pass. See `tests-s1-acceptance.txt`.

| # | Test | File |
|---|---|---|
| 1 | Validator | pass-s1-acceptance (+ per-feature validator blocks) |
| 2 | Old sources byte-identical, all S1 additions off through the real config | pass-s1-acceptance; also `old-sources-byte-identical.txt` |
| 3 | Analyst lead rule | pass-s1-analyst |
| 4, 5 | Release filter and rate | pass-s1-releases |
| 6 | HN title: ≤ hn.cap (20) added after dedupe, existing HN rows unchanged | pass-s1-hn-title |
| 7 | Gmail | pass-s1-gmail-senders |
| 8 | Soft-fail | pass-s1-acceptance |
| 9 | Box live check | Below (partial, accepted by the Architect) |
| Hotfix | Empty Gmail renders `[]`; rank:snapshot runs on it | gmail-empty-hotfix |

## First Load (`node scripts/first-load.cjs .next-pages`, cap 185000, target ≤182000)
- Before (b4c8f44, committed data): **178,598 B**. See `build-before.txt`.
- After (55d69bc, committed data): **178,759 B**, which is **+161 B** and within ±200 B. See `build-after.txt`.
- The pre-§S1.8 build (f57393e) came to 178,756 B.
- The fixture build with live ANL and REL rows came to 178,566 B. See `build-fixture.txt`.

## Dry ingest, live, `--dry-run` (`dry-ingest.txt`)
Per-source rows from the crawl table:

| Source | Rows |
|---|---|
| HF | 50 |
| arXiv | 29 |
| OpenAlex | 3 |
| Crossref | 1 |
| HN | 67 |
| **HN title** | **13** (5 terms; 13 added, 5 dup, ≤ hn cap 20) |
| lab RSS | 104 |
| security RSS | 40 (**embracethered 12**) |
| **analyst RSS** | **9** (simonw 4, latent-space 5; 3 not-ai drops) |
| **releases** | **0** (first run: llama.cpp v0.7.0, ollama v0.40.5 and vllm v0.31.0 all seeded) |
| GNews | 42 |
| GitHub | 0 |
| Wikidata | 3 |

- Gmail soft-failed on this box: no fetcher or cache.
- Wall time was 20.1 s.
- Tracked state written by the dry run (`config-last-good.json`, `source-state.json`) was restored.

## Releases seed-run behaviour (`releases-seed-run.txt`)
This replays the live feeds fetched on 2026-10-16.
- **Run 1:** every feed seeds and no row is emitted.
- **Run 2 (+1h):** no bump on any feed.
- **What-if baselines:** llama.cpp at v0.6.4 emits v0.7.0. ollama at v0.40.1 emits nothing, because a patch-only bump is filtered. vLLM's rc and proto tags are filtered too.

## Shots and visual check (fixture build, on pre-§S1.8 code; no UI changed since)
The fixture build used a real crawl whose `releases-seen.json` had lower baselines, so REL rows were emitted. All fixture data was restored afterwards.
- `shots/pulse-before-{1280,390}.png` were taken on b4c8f44.
- `shots/pulse-after-{1280,390}-{anl,rel}.png` show Pulse with "show all"; the chip is outlined in magenta. Two things to note:
  - The ANL row shown is an AINews recap, kept as one row.
  - The REL row is "vLLM v0.31.0".
- `visual-check-fixture.txt`:
  - visual:check OK
  - font-check OK
  - overflow-390 OK, covering 6 lanes plus the setup view. The ANL and REL health cells appear at 390.

## Test 9: box live check (partial; see report)
Shown live on the box:
- ANL rows (9)
- embracethered SEC rows (12)
- HN title merges (13)
- REL health cell

Not shown live:
- **REL Pulse rows.** A real first run only seeds, so rows appear only after a later minor bump. They are shown through the fixture baselines.
- **GML VentureBeat row.** This box has no Gmail fetcher (soft_fail), so the row cannot be shown. The behaviour is covered by test 7.
