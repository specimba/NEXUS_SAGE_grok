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
