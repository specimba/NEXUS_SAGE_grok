# Pass C2 — Feed and taste setup controls (config by commit)

**Architect cut:** 2026-10-12 · Canberk approved (via Grok Bot) · after A (phase 2 `21b6196` + PASS-L `1206bee`)  
**Status:** PASS MARK · Coder builds · Canberk gets before/after shots  
**Free only.** No server, no admin UI, no new providers. DENY: secrets in config · creds in CI · paid X · lead/Brief rules in config (they stay in code + pass marks).

## Goal

One reviewed file controls what the crawl reads. The desk shows what's active. Changing a feed means editing a commit, not code.

## 1. `desk/config/sage-sources.json` (committed, public)

```json
{
  "schema": 1,
  "sources": {
    "hn":        { "on": true, "cap": 40 },
    "hf_papers": { "on": true, "cap": 30 },
    "lab_rss":   { "on": true, "cap_per_feed": 12, "timeout_s": 10, "feeds": ["openai", "deepmind", "google-ai", "hf-blog", "nvidia", "mistral"] },
    "sec_rss":   { "on": true, "cap_per_feed": 12, "feeds": ["trailofbits", "fox-it", "projectzero"] },
    "gnews":     { "on": true, "cap": 20 },
    "github":    { "on": true, "cap": 10 },
    "openalex":  { "on": true }, "crossref": { "on": true }, "arxiv": { "on": true }, "wikidata": { "on": true },
    "gmail":     { "on": true, "fetch_cap": 24, "emit_cap": 12, "window_days": 14 },
    "x_taste":   { "on": true, "visible_cap": 6 }
  },
  "keywords": {
    "ai_terms": ["…"],
    "hn_sweep": ["…"],
    "gmail_seed": ["AI", "newsletter", "tech", "LLM", "intelligence", "hack", "security", "paper", "…"],
    "politics_deny": ["…"]
  },
  "taste": { "weight": 0.0, "max": 0.3 }
}
```

Rules:
- **Seed it from today's code values** (`AI_TERMS`, `HN_RECENT_SWEEP_TERMS`, `GMAIL_SEED_KEYWORDS`, `POLITICS_LEAD_TERMS`, feed lists, caps). The first land must produce the **same crawl output** as before (no behaviour change).
- Code keeps the defaults. Config can only **turn off, lower caps, or edit keyword lists** inside the existing sources. A feed id not already wired in code is rejected (no new providers by JSON).
- **Hard ceilings in code:** caps can't exceed today's values × 2, and the lab RSS timeout can't go above 15s. This keeps GitLab minutes and desk-view caps safe.
- **`taste.weight`** is the Pulse shelf ordering boost only, clamped to 0–0.3. It never touches Pulse `UP`, Wire, the lead pick, or Brief. Default 0 means no change.
- Validation runs in `bun test` and at crawl start. Invalid config → the crawl uses the last good committed config (`artifacts/sage/config-last-good.json`) and the soft meter shows `config invalid`. It never crashes and never falls back silently.
- The ingest stamp records `config_hash`, so every crawl says which config it ran.

## 2. Read-only Setup view

- A desk view at `?view=setup` (same pattern as the lead log), plus a small `setup` link in the footer.
- It shows the sources table (on/off, caps, last crawl count, soft-fail state), the keyword lists (folded, with counts), the taste weight, `config_hash`, and the commit that last changed the config.
- **Lazy chunk** (same as the archive fold). Zero bytes added to First Load. The gate stays under 185 kB.
- No edit buttons. One muted line reads: `edit desk/config/sage-sources.json by commit`.
- 390 rules apply (overflow-390 check covers the view).

## 3. Weekly X taste refresh (box-only)

- One weekly **box** routine, Monday 09:17 TRT: it reads bookmarks / likes / feed slice from Canberk's signed-in box session (read-only, same allowlist and rules as `WIRE-X-SESSION-TASTE.md`), writes `x-taste-last.json`, mirrors `x-taste.ts` (Pass E), and commits.
- Login wall / challenge → stamp skipped, no retry loop, and one short line to Grok Bot ("X session needs login on the box"). Canberk logs in himself.
- **No X creds, cookies or tokens in CI or the repo.** The GitLab crawl only reads the committed snapshot.
- Cost: 1 agent turn per week. The `taste stale` meter (>14d) stays as the honest fallback.

## Pass marks (Reviewer)

1. The first land with the seeded config gives an identical crawl output hash to the pre-C2 crawl on the same fixture.
2. A fixture config turning a source off → that source is absent and its meter shows `off` (not soft-fail).
3. An unknown feed id, a cap over the ceiling, or bad JSON → rejected, last-good used, `config invalid` meter shown, crawl exit 0.
4. `taste.weight` changes only the Pulse taste shelf order. `UP`, Wire, the lead and Brief are identical under weight 0 vs 0.3.
5. The Setup view matches the committed config and `config_hash`. It loads as a lazy chunk under basePath with a 200. First Load is unchanged ±200 B.
6. The weekly taste routine produces a fresh `captured_at` (or an honest skip) and the stale meter clears after a fresh capture.
7. No secret in the config, repo or CI. secret-gate passes. overflow-390 passes.

## Proof

Before/after for Canberk: `refs/VISUAL-PROOF-pass-c2-{setup,taste}-{before,after}-{1280,390}.png`.

## Next

D (Beat 13 morning Atom feed) after the C2 stamp.
