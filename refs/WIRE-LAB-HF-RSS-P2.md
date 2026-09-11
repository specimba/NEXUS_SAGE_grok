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

| # | Lab | URL | Scout |
|---|-----|-----|-------|
| 1 | Mistral | `https://mistral.ai/rss.xml` | APPROVED P2b |
| 2 | NVIDIA blogs | `https://blogs.nvidia.com/feed/` | APPROVED P2b |
| 3 | NVIDIA developer | `https://developer.nvidia.com/blog/feed` (Atom) | APPROVED P2b |
| 4 | Microsoft Research | `https://www.microsoft.com/en-us/research/blog/feed/` | APPROVED P2b |
| 5 | Google Research | `https://research.google/blog/rss/` | APPROVED P2b |

**Phase A PASS** already (2026-09-11 Reviewer). **Phase B (P2b) Architect APPROVED** — optional land now or after P3; soft_fail per-feed · `briefEligible:false` · never Brief.

**Still DENY HTML scrape:** Anthropic · Meta AI Blog · Cohere · xAI. Meta Research XML deferred (Scout).

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

### Reviewer stamp — 2026-09-11T11:23Z (Reviewer Gürok)

**WIRE-LAB-HF-RSS-P2 PASS** (Phase A only · Phase B skipped cleanly).

Evidence:
- Hygiene tree-clean: `18a1b78` then land `09c5672` · `main` clean
- Per-feed soft_fail harden (403/404/HTML/empty) · bun **169** · `briefEligible:false`
- Live `ingest-last.rss`: openai/deepmind/google-ai/huggingface · `brief=false` · `pulse_only`
- Locks `003`/`hf-incident` · no Anthropic/Meta HTML in diff · `visual:check` OK · brand OK
- A4 meters stay honest (OpenAlex 429)

**P3 HN deepen HOLD** until Director/Canberk continue.


### Coder land stamp — 2026-09-11T11:28Z (FREE-PULSE P2b)

**WIRE-LAB-HF-RSS-P2 Phase B PASS** — first-party RSS×5 wired (Scout §3).

Landed:
- Feeds: `mistral` · `nvidia` · `nvidia-dev` · `ms-research` · `google-research`
- URLs: mistral.ai/rss.xml · blogs.nvidia.com/feed/ · developer.nvidia.com/blog/feed · microsoft.com/…/research/blog/feed/ · research.google/blog/rss/
- Same per-feed soft_fail · `feeds_soft_fail` ingest stamp · `briefEligible:false` · never Brief · never displace HF
- DENY confirmed: Anthropic · Meta AI Blog · Cohere · xAI · HTML scrape · Reddit · paid X · Bluesky
- bun **173** · P2b soft_fail unit coverage · `visual:check` OK (no rebuild)
- Locks `003` / `hf-incident` · no `004`

**P3 HN deepen HOLD** — wait Reviewer PASS + Director continue.

## Architect note — 2026-09-11 ~11:25Z

P2 Phase A = **PASS**. P2b (5 Scout URLs) = **APPROVED optional**. **P3 HOLD** until Director/Canberk continue after this or skip B.

### Reviewer stamp — 2026-09-11T11:29Z (Reviewer Gürok)

**WIRE-LAB-HF-RSS-P2b PASS** (`6c17ea9`).

Evidence:
- +5 first-party: mistral · nvidia · nvidia-dev · MSR · Google Research (Scout URLs exact)
- soft_fail per-feed unit coverage · bun **173** · `briefEligible:false`
- Anthropic/Meta fetch guard · DENY scrape stands · `visual:check` OK
- Locks `003`/`hf-incident` · Phase A PASS stands

**GO** P3 HN deepen per `WIRE-HN-DEEPEN-P3` (Director continue-default). P4+ HOLD.
