# Scout sources (Oct 16): config-only land STOPPED, code change needed

Branch `scout-sources`, base origin/main 66dec6b. Source doc: `refs/SCOUT-SOURCES-OCT16.md`. It is **not on origin/main**: it's untracked in the shared clone (sha256 d008baeed0491036…, same as Scout's store copy). Probes ran 2026-10-16 ~00:45–00:55 TRT.

## Result
None of the five sources or the two Gmail senders can be added through `desk/config/sage-sources.json` alone. PASS-C2's validator (`desk/src/lib/sage-config.ts`) is strict by design: feed lists are limited to ids wired in code, and new source blocks and new keyword lists are not allowed. A rejected file makes the crawl **fall back to config-last-good**, so pasting Scout's §2 JSON would silently disable every config edit. Scout's own doc says the same in §2 ("registry entry … Coder's job, not a config-only change") and in its Gmail note ("senderTrust() … code change"). Per the task brief, I stopped here. **There is no config diff** (`git diff origin/main -- desk/config` is empty).

Proof: `config-validator-proof.txt` runs the real `validateSageConfig` on each addition:

| Addition | Validator |
|---|---|
| current committed config | ok |
| lab_rss += simonw, latent-space | `feed id(s) not wired in code` |
| sec_rss += embracethered | `feed id(s) not wired in code` |
| releases_atom block (llama.cpp/ollama/vllm/claude-code) | `unknown source "releases_atom" (no new providers by JSON)` |
| keywords.hn_title_queries | `unknown keyword list` |
| keywords.gmail_senders | `unknown keyword list` |

## Feed URL checks (`feed-url-check.json`): all 7 resolve and parse
curl -L -m 10 with the desk RSS UA (the same 10 s as rss-timeout); parsed with ElementTree.

| key | HTTP | format | bytes | s | items | 48h | 7d | newest (TRT) |
|---|---|---|---|---|---|---|---|---|
| simonw | 200 | Atom | 105,241 | 0.7 | 30 | 6 | 21 | 10-15 22:47 |
| latent-space | 200 | RSS 2.0 | 878,428 | 0.3 | 20 | 5 | 12 | 10-15 13:08 |
| llama.cpp | 200 | Atom | 316,438 | 1.3 | 10 | 10 | 10 | 10-16 00:27 (b11671 build tag) |
| ollama | 200 | Atom | 16,787 | 0.6 | 10 | 5 | 10 | 10-15 22:18 |
| vllm | 200 | Atom | 381,563 | 1.8 | 10 | 3 | 5 | 10-15 12:50 (rc) |
| claude-code | 200 | Atom | 177,211 | 0.7 | 10 | 3 | 4 | 10-15 22:22 |
| embracethered | 200 | RSS 2.0 | 311,757 | 0.1 | 233 | 1 | 1 | 10-14 01:00 |

## HN title-only queries (`hn-title-query-check.json`), last 48h, points ≥ 10
| query | title-only hits | full-text hits | top title (pts) |
|---|---|---|---|
| agent | 16 | 24 | LFM2.5-24B-A2B: Built for fast on-device agents (279) |
| open weights | 2 | 4 | Muse Spark Open … Open-Weight Model (71) |
| prompt injection | 1 | 2 | Prompt injection in HTTP headers … (76) |
| Qwen | 3 | 4 | Running Qwen3.8 at 255 tok/s on a single 5090 (15) |
| local model | 1 | 1 | Show HN: Pulse Local … (119) |

## Not done, and why
- **Dry ingest, before vs after:** skipped. With no config change, there is no "after" to compare.
- **Tests:** baseline is 702 pass / 0 fail (`bun test src/lib/__tests__`). Nothing changed, so there is no after run.
- **First Load:** no built output changed, so no build was run.

## What a code pass would touch (for Architect, not implemented)
1. simonw, latent-space: `LabId` + `LAB_FEEDS` + `LAB_HANDLE` in rss-labs.ts. They also need a chip code in `pulse-v5.ts` (lab → "NVD"-style label), which is **visible page text**. Neither is a first-party lab: rss-labs is documented as "first-party only", so this is a scope call.
2. embracethered: `SecurityFeedDef.lab` union + `SECURITY_FEEDS` in rss-security.ts. No streamCap needed (312 KB, but 233 items: the per-feed cap trims it).
3. releases ×4: there is no releases loader. It needs a new provider (`SOURCE_IDS`, `SageConfig` type, ceilings, validator, ingest wiring, and skip-prerelease + "minor+" filtering per Scout). llama.cpp's feed is per-build `bNNNNN` tags (10 in 48h), so "non-rc, minor+" doesn't map onto it. That filter rule needs spec.
4. HN title queries: `hnSearchUrl` has no `restrictSearchableAttributes` option. The existing `hn_sweep` list is a full-text OR sweep at points ≥ 3 over lab names, so adding the terms there would make noise worse (exactly what Scout flagged), not title-scope it.
5. Gmail senders: `senderTrust()` regex in gmail-news.ts. Note that `hello@newsletters.venturebeat.com` already scores trust 1.5 via the existing `newsletter|hello@` rule. Takara is at 1. "Not in cache" is likely the canonical GMAIL_QUERY / fetch_cap, not trust. The only config lever is `gmail_seed` (it adds `subject:(…)` terms, e.g. "TLDR"), which is broader than a sender rule. I did not apply it.
