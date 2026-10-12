# PASS-C2 — seeded config ⇒ identical crawl output (pass mark 1)

**Method (record / replay, same inputs):** two copies of `desk/` taken from the same pre-crawl state (data at
crawl 2026-10-12T03:21:52Z, same caches). OLD = code at a02863c (no config). NEW = PASS-C2 code + seeded
`desk/config/sage-sources.json`. Both run `bun scripts/ingest.ts` then `bun scripts/rank-snapshot.ts` under
`refs/pass-c2/proof-preload.ts`: a pinned clock base (same T0) and a fetch tape: OLD records every network
response (30 requests), NEW replays them (30/30 used, 0 misses). SAGE_GMAIL_BOX_ONLY=1 (CI mode) for both.

**Result:** 187 of the generated files under `src/data/` + `artifacts/sage/` (caches excluded)
are byte-identical (sha256), including every crawl data module the desk reads:

```
SAME e72a256fd2cd artifacts/sage/CURRENT.json
SAME e986c2382cd9 artifacts/sage/lead-history.json
SAME a2f24bdead95 artifacts/sage/rank-prev.json
SAME cec48096993b artifacts/sage/seen-index.json
SAME 0bded51bc29e artifacts/sage/source-health.json
SAME 460f9ccb4d37 artifacts/sage/source-state.json
SAME 456384f07335 artifacts/sage/topic-heat.json
SAME 88b72da27bc3 artifacts/sage/wire-prev.json
SAME 2e28e6dbd751 src/data/desk-view-papers.ts
SAME 6828ee4e1621 src/data/desk-view.ts
SAME c93052cca00b src/data/digest-unlock.ts
SAME f0c4970df49a src/data/gmail-news.ts
SAME 16898754fc73 src/data/gnews-rss.ts
SAME c8870839a914 src/data/hn-pulse.ts
SAME 32f58fe7a99f src/data/lead-log-view.ts
SAME 7889faccfe2d src/data/lead-pick.ts
SAME ff636fc41ecd src/data/papers.ts
SAME 48ff770783f3 src/data/pulse-clusters.ts
SAME e9126ad94507 src/data/rss-labs.ts
SAME cb5d1595fd5a src/data/rss-security.ts
SAME 0bba8ddeac68 src/data/shelf.ts
SAME 7f1574eb7c71 src/data/soft-fail-meters.ts
SAME c9098112a017 src/data/source-health.ts
SAME 49b0001952f3 src/data/topic-heat.ts
SAME 044fe1bee52a src/data/wikidata-deny-last.ts
SAME 3164bc14d77b src/data/wire.ts
SAME 3352fbdc7e7e src/data/x-crawl.ts
```

The only differences:

| file | difference |
|---|---|
| artifacts/sage/ingest-last.json | + `config_hash: "813e5ce035c3"`, + `config_status: "ok"` (spec §1: the stamp records config_hash); timing fields (crawl_timing, duration_ms, age_check) are wall-clock |
| artifacts/sage/rank-last.json, wire-last.json, src/data/corroboration-rank.ts | `at` millisecond (rank-snapshot's own clock, e.g. …54.018Z vs …54.023Z); content otherwise identical |
| src/data/build-stamp.ts | build stamp from local PAGES builds, not crawl output |
| new files | config-last-good.json, src/data/sage-setup.ts, src/data/sage-desk-config.ts (PASS-C2 outputs) |

Off / invalid fixtures (same tape): `sources.hn.on=false` ⇒ exit 0, hn-pulse.ts has 0 rows, 0 hn-algolia
members in pulse-clusters, meter chip `{ id: "hn", state: "off" }`. `lab_rss.feeds += "anthropic"` and
`gnews.cap=999` ⇒ exit 0, `Config: invalid`, both reasons logged, meter `config invalid`, ingest-last
`config_status: "invalid"`, defaults/last-good used.
