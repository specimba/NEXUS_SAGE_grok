# PASS-S1 — Scout's top-5 sources (code pass, then config)

Owner: Coder builds · Reviewer gates · Architect spec. Free only, no new credentials, no new CI minutes beyond fetch time inside the 6m job.
Inputs: `refs/SCOUT-SOURCES-OCT16.md` (scored table), `refs/scout-sources/` (Coder's proof that the C2 validator rejects these as config-only; 7 feed URLs return 200; HN title queries checked).
**Why a code pass:** the C2 contract says JSON can't add providers, feed ids or lists. That's still right, so each item below adds code (registry, ceiling, validator id) first. After that, the C3 editor can turn them on, off and cap them like any other source.
**Out of scope / locks kept:** Reddit stays **DENY** (WIRE-LAB-HF-RSS-P2), and paid X and Bluesky stay DENY. METR, CISA and Scout's other rows are deferred, not denied: they can come in a later pass. No source in this pass may become a Brief lead on its own.

## S1.1 — Analyst feeds: Simon Willison and Latent Space (new kind, not "lab")
- `rss-labs.ts` stays **first-party only**. Add a sibling registry `ANALYST_FEEDS` in `src/lib/rss-analyst.ts`, reusing the RSS fetch/parse/timeout helpers. Entries: `simonw` → `https://simonwillison.net/atom/everything/`, and `latent-space` → `https://www.latent.space/feed`.
- New config block `analyst_rss: { on, cap_per_feed, timeout_s, feeds[] }`. Defaults: on, `cap_per_feed: 6`, with ceiling 12. `timeout_s` follows the lab ceiling (≤15). Feed ids are restricted to the registry.
- Pulse SRC chip **`ANL`**, green, the same style as LAB.
- **Lead rule:** analyst items count as publishers for Wire/Pulse corroboration, but a lead needs **at least one non-analyst, non-GNews publisher** in its group. Two analysts alone (Simon plus an AINews recap) can't make a lead. This is enforced in `lead-pick.ts` next to `nonGnewsPublishers`, with a reason string `analyst-only` in `excluded[]`.
- AINews daily recaps (title starts `[AINews]`) are kept as one item each and never split into sub-stories.

## S1.2 — Embrace The Red (security)
- One `SECURITY_FEEDS` entry: `embracethered` → `https://embracethered.com/blog/index.xml`. It's added to the wired sec ids, so `sec_rss.feeds` may then list it. Same `cap_per_feed` rules. No other change.

## S1.3 — Release feeds (new source type `releases_atom`)
- Registry `RELEASE_FEEDS` in `src/lib/releases-atom.ts`: `llama.cpp`, `ollama`, `vllm` and `claude-code`, with GitHub `releases.atom` URLs (public, no token, no API quota).
- Config block `releases_atom: { on, cap_per_feed, feeds[] }`. Default `cap_per_feed: 2`, ceiling 4. Default **on** for `ollama`, `vllm`, `llama.cpp`; `claude-code` is **off** (patch churn) until the filter proves quiet.
- **Filter (code, per feed; not configurable):**
  1. Only tags matching semver `^v?(\d+)\.(\d+)(?:\.(\d+))?$`. This drops `b11671`-style build tags, `-rc`, `-alpha`, `-beta`, `-dev` and `nightly`.
  2. Emit only a **minor-or-major bump** against the last emitted version for that feed, stored in `artifacts/sage/releases-seen.json` (backup-allowlisted, staged by `ci-state.sh` with artifacts/sage). A first run seeds silently with no emit.
  3. At most **1 item per feed per 24h**.
- Pulse chip **`REL`**. Items are single-publisher (github.com), so they can never lead (existing ≥2-publisher rule) and never join Brief.

## S1.4 — HN title-scoped queries
- `hnSearchUrl(..., { titleOnly: true })` adds `restrictSearchableAttributes=title`, `numericFilters=created_at_i>{now-48h},points>=10`.
- New keyword list `keywords.hn_title_queries` (default = Scout's 5: `agent`, `open weights`, `prompt injection`, `Qwen`, `local model`). Limits are ≤8 terms, each ≤40 chars, and plain text (no regex). One request per term per crawl.
- The results merge into the **existing `hn` cap** (deduped by objectID against the watchlist/sweep). There's no new cap and no new SRC chip.
- It is **not** a lead list, so it's freely editable in C3 (not additions-only).

## S1.5 — Gmail sender trust list
- New list `keywords.gmail_senders`: exact addresses only (validated as `local@domain`), ≤20. Default: `hello@newsletters.venturebeat.com`, `takaramono@tldr.takara.ai`.
- `senderTrust(from)` returns **2** for a listed sender (raises VentureBeat from 1.5). Code max stays 2. The list can't lower any built-in trust.
- `GMAIL_QUERY` gains `OR from:(<senders>)`, built from the list. **No `TLDR` seed term.**
- Sponsored drop (code rule): subjects matching `/\b(webinar|learn how|sponsored|partner content)\b/i` are dropped for any sender.
- Gmail-news stays `briefEligible:false` with the GML chip, and no Gmail credentials go in CI (unchanged).

## S1.6 — Validator, config, C3
- `sage-config.ts` limits gain the new block ids, the feed ids and the two lists. **The committed `sage-sources.json` adds the new blocks and lists in the same PR**, seeded with the defaults above, so output on old sources is identical and the file stays canonical (C3 test 8c).
- C3 editor: the new modules and cartridges appear through `SAGE_SETUP.limits` automatically, with no editor code change. `gmail_senders` chips use the address format check.

## S1.7 — Acceptance tests
1. **Validator**: the new config is accepted; an unknown analyst/release id, `cap_per_feed` over the ceiling, a regex in `hn_title_queries`, or a malformed sender address is rejected in both paths (C3 parity).
2. **Old sources unchanged**: run on a fixture crawl with the new blocks `on:false`; cluster ids, Wire and the lead are byte-identical to before.
3. **Analyst lead rule**: a cluster made of only simonw plus latent-space is not lead, with `excluded` reason `analyst-only`. The same cluster plus one lab/news publisher is eligible.
4. **Release filter**: a llama.cpp fixture with `b11671 … b11680` and `v0.7.0` (prior `v0.6.4`) gives exactly one item `v0.7.0`. `v0.7.1` the next day gives none (patch). `v0.32.0rc2` gives none. First run gives none and seeds.
5. **Release rate**: two minor bumps in 24h give 1 item.
6. **HN title**: the URL contains `restrictSearchableAttributes=title` and `points>=10`. A hit already in the watchlist is not duplicated, and the total stays ≤ the hn cap.
7. **Gmail**: a VentureBeat mail gets trust 2, a "Learn how…" subject is dropped, a TLDR mail from a non-listed sender keeps its old trust, and the query string contains both `from:` addresses.
8. **Soft-fail**: each new feed timing out gives a soft-fail meter, not a crawl failure, and the job still finishes inside the 6m timeout (the job log time is recorded in crawl.log).
9. **Box live check**: one crawl with everything on shows ANL, SEC (embracethered) and REL rows in Pulse within caps, HN title hits merged, and the GML VentureBeat row. The 390 overflow check passes with the two new chips. First Load is within ±200 B (chip CSS only).

## Order
S1.2 and S1.4 are small and can land first. S1.1, S1.3 and S1.5 follow. One PR or several is fine, but each lands with its config seed and tests.

## S1.8 — Architect rulings on the build (Oct 16, after Coder's pass-s1 build)
- **Accepted additions (part of the spec now):** (a) analyst items need an AI-relevant title (`ai_terms` match); `[AINews]` recaps are exempt. (b) Release-led groups stay off the Wire and out of Digest titles. (c) Releases never count toward the 2-publisher rule. (d) Emitted releases stay in Pulse for 7 days, within the REL caps.
- **HN cap reading:** title queries add **at most `hn.cap` (20) new rows after dedupe**. Existing HN volume is unchanged. Test 6 asserts the added count, not the total.
- **Empty lists:** `hn_title_queries` and `gmail_senders` may be empty, and empty means off. Lead lists (`ai_terms`, `politics_deny`) still can't be empty and stay additions-only (C3).
- **Test 9 (partial OK):** ANL, Embrace The Red and HN title rows need live proof. REL passes by fixture now, and live proof follows at the first real minor bump (a Reviewer follow-up). GML passes by fixture (test 7), since the box has no Gmail fetch and CI has no Gmail credentials.
- **Empty Gmail bug (`[ , ]` → rank:snapshot crash):** this is already on main, so it is **not part of S1**. Ship it as a separate hotfix commit before S1, with a test where empty Gmail writes `[]` and rank:snapshot passes.
