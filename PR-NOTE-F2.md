# PASS-F2 — freshness, 24h TL;DR, plain headlines (PR note)

Spec: refs/PASS-F2-FRESH-TLDR-PLAIN.md (668e5fa). Branch `pass-f2`, base origin/main `668e5fa` (latest crawl on the base: 18:20:31Z Oct 23).

## Recall check

Probed 2026-10-24 ~00:50 TRT (UTC+3), fresh fetch of each new source (no auth), titles matched for the three stories; plus a
`git grep` over this week's committed crawl data (`desk/src/data`, every crawl commit since Oct 17) for the old sources.

| Story | Old sources this week | New source that would surface it | Where it lands |
|---|---|---|---|
| Kimi K3.1 | not seen (only "Moonshot / Kimi K3 HK IPO" context pin) | **The Decoder** (lab_rss `the-decoder`): "Chinese AI model Kimi K3.1 Pro is closing in on Anthropic's Claude Opus 5.5", 2026-10-23 22:00 TRT | Pulse row (LAB). Wire / TL;DR only once a 2nd independent publisher carries it. HF org releases (`hf-moonshotai`): **no** — moonshotai's 10 newest repos have no K3.1 repo (newest Kimi-K3, created 2026-06-13). |
| OpenAI's training pause | not seen | **gap**: none of the 5 Scout feeds, HF trending or HF org releases carries it in what they return today | still would not surface. The Decoder / SecurityWeek return only their 10 newest items (~2 days), so the week can't be replayed from them. |
| Cursor Computer Use | not seen | **gap**: not in any new source (Codex releases are OpenAI's CLI, not Cursor) | still would not surface. No ad-hoc Cursor source added (spec). |

## Commits

| Commit | Piece | First Load (PAGES=1 build) |
|---|---|---|
| F2.1 | freshness: 6h Wire backfill, no bare "0 new", fixed age slot, lead repick after 12h | 180,524 B (+110) |
| F2.2 | 24h TL;DR (server-rendered block, feed.xml entry 1), HF + Scout Oct 23 sources | 180,553 B (+139) |
| F2.3 | plain headlines, labels behind `desk details`, feed.atom | 180,550 B (+136) |

## Gates
- First Load: base 180,414 B · branch 180,550 B (+136 B, inside ±200). Both measured the same way in this worktree:
  `PAGES=1 bun run build` then `node scripts/first-load.cjs .next`; base = origin/main 668e5fa.
- overflow-390: OK (plain) · OK (seeded) — local static serve of out-pages under /NEXUS_SAGE_grok. Seeded = localStorage
  `sage.lastSeenAt` set + `desk details` opened (a /tmp copy of overflow-390-check.ts; the repo script is unchanged).
- No `.gitlab-ci.yml` / `ci/` diff. Cycle label 003 unchanged.
- config_hash 898c7ea45214 → a116c3b25ffb. Keys that moved: `sources.lab_rss.feeds` (+the-decoder),
  `sources.sec_rss.feeds` (+unit42, securityweek, railway), `sources.releases_atom.feeds` (+codex, hf-trending,
  hf-moonshotai, hf-nvidia, hf-tencent). Test 20 recomputes the old hash with those ids removed.

## Sources (F2.2d)
All five Scout Oct 23 feeds were free and reachable without credentials on 2026-10-24 ~00:50 TRT; none skipped.
- unit42, securityweek → sec_rss (SecurityWeek is general security; the Wire's AI gate filters it).
- railway → sec_rss, `streamCap` (4.8 MB) + title filter `security|disclosure|incident`.
- the-decoder → lab_rss.
- codex → releases_atom, tag prefix `rust-` stripped before the semver test; `-alpha` prereleases never match.
- HF trending (cap 3, fixed org allowlist in `src/lib/hf-models.ts`, 72 h window) and HF org releases (moonshotai,
  tencent, nvidia ≤2 with the pipeline_tag/dataset/tool filter) ride the REL lane (`rel:` ids): Pulse only, never the
  lead, never toward the Wire's 2-source rule. Seen repos + last-good rows live in `releases-seen.json` under `hf`.
  The list API has no lastModified without `full=true`, so the 72 h window reads `createdAt`.
  "Plus the existing labs" for org releases is not wired: the spec names no HF org ids for them, so I didn't guess.

## Notes for Reviewer
- Wire and lead headlines are cleaned when rank-snapshot writes the data modules, so the live Wire shows plain
  headlines from the next crawl on; the TL;DR is cleaned now. lead-history.json keeps the raw headline.
- The TL;DR feed entry and feed.atom's TL;DR content appear on the next crawl (`atom-feed.ts`); the committed
  feed.atom is today's feed.xml byte for byte.
- feed.atom is byte-identical, so its `rel="self"` still points at feed.xml.
- The topbar `cyc 003 · pick …` chip still shows "cyc 003" (no slash); CYC/003, Sol≠Astra, the pack id and the lane
  code are inside `desk details`.
- Before/after screenshots: /workspace/f2-shots/ (box).
