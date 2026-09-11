# WIRE — Lab / HF RSS extend (FREE-PULSE P2 · APPROVED TO LAND)

**Architect approve:** YES · **Director ASSIGN** 2026-09-11 ~11:14Z · continue default 1→2  
**Companion:** `WIRE-RSS-LABS.md` (already PASS) · `FREE-PULSE-DEEPEN.md` P2 · Scout candidate notes  
**Owners:** Coder land · Scout URL verify · Reviewer FAIL-gate · UX optional shelf chrome only if asked  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · Pulse/shelf only · `briefEligible:false` · never Brief lead · no `004`  
**DENY:** Anthropic/Meta HTML scrape · Reddit · paid X · Bluesky · scrape farms · inventing mirrors

## Goal

Extend **first-party** lab/HF Atom/RSS coverage and harden soft-fail — more Pulse shelf items without Brief pollution. Does **not** invent Anthropic/Meta feeds.

## Phase A — harden existing (must land)

Already-wired first-party (from `WIRE-RSS-LABS` / FREE-PROVIDERS):

| Lab | Feed |
|-----|------|
| OpenAI | `openai.com/news/rss.xml` (blog fallback) |
| DeepMind | `deepmind.google/blog/rss.xml` |
| Google AI | `blog.google/technology/ai/rss/` |
| Hugging Face Blog | `huggingface.co/blog/feed.xml` |

Required harden:
1. Soft-fail per-feed (403/404/HTML/empty) — one dead feed ≠ kill ingest  
2. UA + 6h cache honesty (stamp which feeds soft-failed)  
3. `briefEligible:false` · classifyPost hygiene · Sol≠Astra  
4. Empty feed ≠ crash  

## Phase B — new first-party feeds only

Coder may **add** a feed **iff** Scout pastes a verified first-party Atom/RSS URL into `refs/SCOUT-P2-RSS-CANDIDATES.md` (or a table below) before land — tagged `source: "rss-lab"`, no HTML scrape.

| Candidate (Scout fills) | URL | Verified? |
|-------------------------|-----|-----------|
| HF changelog / Spaces / Hub blog extras | *Scout* | wait |
| Additional lab with stable first-party RSS | *Scout* | wait |

**If Scout table empty at land time:** ship **Phase A only** — still counts as P2 PASS (extend = harden + optional adds).

## Explicit skip

| Target | Why |
|--------|-----|
| Anthropic News | No first-party RSS |
| Meta AI Blog | No stable first-party RSS |
| NCC / scrape mirrors | Already DENY / HTML |

## Done-when (Reviewer)

- [x] Phase A harden landed · per-feed soft_fail stamped  
- [x] Bun tests green · `briefEligible === false` for all lab items  
- [x] Locks `003` / `hf-incident` · Brief pins unchanged  
- [x] `visual:check` OK · A4 meters still honest  
- [x] Any Phase B URL is first-party verified (or Phase B skipped cleanly)  
- [x] No Anthropic/Meta HTML scrape in diff  

## Non-goals

P3 HN deepen · FREE-PULSE P5 Google News · Voice/Digest · cycle `004` · overnight firehose

## Architect HOLD

**P3 HN deepen** stays HOLD until P2 Reviewer PASS + Director/Canberk continue.


### Coder land stamp — 2026-09-11T11:22Z (FREE-PULSE P2)

**WIRE-LAB-HF-RSS-P2 PASS** — **Phase A only** (Phase B skipped: no `refs/SCOUT-P2-RSS-CANDIDATES.md`).

Landed:
- Per-feed soft_fail (403/404/HTML/empty/bad XML) — one dead feed ≠ kill ingest
- `looksLikeHtml` · `fetchImpl` · UA + 6h cache honesty · stamp `rss.soft_fail` / `feeds_soft_fail`
- `briefEligible:false` · never Brief · never displace HF · locks `003` / `hf-incident`
- bun **169** · P2 soft_fail unit coverage · no Anthropic/Meta HTML · no Reddit

**P3 HN deepen HOLD.**
