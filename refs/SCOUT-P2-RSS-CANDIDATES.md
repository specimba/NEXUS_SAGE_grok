# SCOUT — FREE-PULSE P2 Phase B RSS candidates

**Scout:** Gürok worker · **Stamp:** 2026-09-11T11:24:36Z  
**Wire:** `WIRE-LAB-HF-RSS-P2.md` (Architect APPROVED) · companion `WIRE-RSS-LABS.md`  
**Probe method:** `curl -sS -L` GET · UA `Mozilla/5.0 (compatible; NexusSage-Scout/1.0; +https://example.local/bot)` · live HTTP evidence below  
**Outcome:** Phase B **recommend = 5** · Phase A-only still PASS if Coder skips adds

---

## 1. Locks / never Brief / Phase A vs B

| Lock | Value |
|------|-------|
| Cycle | `003` |
| Lead | `hf-incident` |
| Sol≠Astra | yes |
| Free only | yes |
| Placement | Pulse / shelf only · `briefEligible:false` · **never Brief lead** |
| No cycle | `004` |
| Source tag | `source: "rss-lab"` for any Phase B add |
| Phase A | Harden existing OpenAI / DeepMind / Google AI / HF blog RSS (soft-fail, UA, 6h cache stamp) — **must land** |
| Phase B | **New** first-party Atom/RSS **only** if URL appears in §3 below — Coder may add zero and still PASS |
| DENY | Anthropic / Meta **HTML scrape** · Reddit · paid X · Bluesky · scrape farms · inventing mirrors · rsshub for PASS |

Security RSS (ToB / Fox-IT / Project Zero) stays on its own wire — **not** Phase B unless a separate wire asks.

---

## 2. Already wired (verified 200)

Probed 2026-09-11T11:24:36Z (window ~11:21–11:24Z). Do **not** re-propose as Phase B “new”.

| Lab | URL | HTTP | Content-Type | Type | ~items | Notes |
|-----|-----|------|--------------|------|--------|-------|
| OpenAI News | `https://openai.com/news/rss.xml` | **200** | `text/xml; charset=utf-8` | RSS 2.0 | ~1189 | Stable. `openai.com/blog/rss.xml` **redirects here** (legacy fallback only). |
| Google DeepMind | `https://deepmind.google/blog/rss.xml` | **200** | `text/xml` | RSS 2.0 | ~100 | Channel *Google DeepMind News*. |
| Google AI | `https://blog.google/technology/ai/rss/` | **200** | `application/xml; charset=utf-8` | RSS 2.0 | ~20 | Same payload as `…/innovation-and-ai/technology/ai/rss/` — keep wired URL. |
| Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | **200** | `application/rss+xml; charset=utf-8` | RSS 2.0 | ~861 | Stable first-party. |

All four **LOOKS_LIKE_FEED=yes**. Phase A = harden soft-fail around these; do not swap without cause.

---

## 3. Phase B recommend (new first-party only)

Coder may wire any subset. Prefer sequential ≤1 feed / 2s · 6h cache · per-feed soft-fail.

| URL | Owner | HTTP | Type | ~items | Why |
|-----|-------|------|------|--------|-----|
| `https://mistral.ai/rss.xml` | Mistral AI | **200** | RSS 2.0 (body XML; **CT mislabeled `text/plain`**) | ~86 | Official blog/news. `rel=alternate` on `/news` also points to `https://mistral.ai/news/rss` (same ~86 items). Prefer canonical `/rss.xml`. Parse by sniffing XML, not CT alone. |
| `https://blogs.nvidia.com/feed/` | NVIDIA Blog | **200** | `application/rss+xml` · RSS 2.0 | ~18 | First-party; linked from homepage `rel=alternate`. AI/robotics/product mix suitable for Pulse shelf. |
| `https://developer.nvidia.com/blog/feed` | NVIDIA Technical Blog | **200** | `application/atom+xml` · Atom | ~100 | First-party developer/tech posts (NIM, BioNeMo, etc.). Trailing-slash twin identical. |
| `https://www.microsoft.com/en-us/research/blog/feed/` | Microsoft Research Blog | **200** | `application/rss+xml` · RSS 2.0 | ~10 | First-party MSR. Homepage alternate also lists `…/research/feed/` (same family, ~10 items) — either OK; prefer **blog/feed/** for blog lane. |
| `https://research.google/blog/rss/` | Google Research | **200** | `application/rss+xml` · RSS 2.0 | ~100 | Distinct from wired product *blog.google …/ai/rss/* — research posts (ToolGrad, genomics, etc.). Complements Phase A Google AI feed. |

**Not recommended as “better replacement” for wired feeds:** OpenAI `blog/rss.xml` (== news), Google innovation-path RSS (duplicate of wired AI feed), DeepMind alternate paths (404).

---

## 4. Probed REJECT (no feed / HTML-only / soft-fail / out of scope)

| Target | URL(s) tried | HTTP / result | Verdict |
|--------|--------------|---------------|---------|
| **Anthropic** | `/rss.xml` `/feed.xml` `/feed` `/news/rss` `/news/rss.xml` `/research/rss.xml` `/engineering/rss.xml` (+ bare `anthropic.com`) | All **404** HTML Next error pages | **NO first-party feed** |
| Anthropic HTML discovery | `anthropic.com/` · `/news` | No `link rel=alternate` type rss/atom in page head | Confirm no advertised feed |
| **Meta AI Blog** | `ai.meta.com/blog/rss/` `…/rss.xml` `…/feed/` `…/feed.xml` | All **404** Facebook HTML shells | **NO first-party feed** · DENY HTML scrape |
| Meta AI HTML discovery | `ai.meta.com/blog/` | No alternate feed link | Confirm |
| Meta Research (exists, **defer P2**) | `https://research.facebook.com/feed/` | **200** RSS ~10 items | First-party XML **exists**, but samples skew non-lab-AI (consumer/XR/trees) + Architect Meta-skip posture → **do not wire P2** |
| Meta Engineering | `https://engineering.fb.com/feed/` | **200** RSS ~9 | Infra/proxy/RDMA mix — not lab-AI Pulse; skip P2 |
| `research.facebook.com/blog/rss/` | — | **200** but **HTML** | Not a feed |
| **Cohere** | `cohere.com/blog/rss.xml` `feed.xml` `/feed.xml` `/blog/rss` `/llmu/rss.xml` · `txt.cohere.com/rss/` `/feed/` | 200/404 **HTML** blog shells | **NO first-party feed** |
| **xAI** | `x.ai/blog/rss.xml` `/rss.xml` `/feed.xml` `/news/rss.xml` `grok.x.ai/rss.xml` | **404**/HTML SPA | **NO first-party feed** |
| HF papers feeds | `huggingface.co/papers/feed.xml` `/papers/rss` `papers.rss` | 401/404 HTML | No papers Atom/RSS |
| HF changelog / root / community / datasets feeds | assorted `…/feed.xml` | 400/404 | No |
| HF Discuss forum RSS | `discuss.huggingface.co/latest.rss` (200) · `…/c/announcements/5.rss` (mis-titled Beginners) | Forum noise / wrong category | **Reject** for lab Pulse (not blog) |
| OpenAI research/changelog/index RSS | `openai.com/research/rss.xml` etc. | **404** | No alternate official research feed |
| DeepMind discover/research RSS | `deepmind.google/discover/blog/rss.xml` · `…/research/rss.xml` | **404** | Keep wired blog RSS only |
| Classic `ai.googleblog.com/feeds/posts/default` | — | **404** | Dead |
| `blog.google/technology/ai/rss.xml` | — | **404** | Wired path uses trailing `/rss/` only |
| MS AI blog `blogs.microsoft.com/ai/feed/` | — | **410** | Dead |
| Azure AI topic feed | `azure.microsoft.com/…/ai-machine-learning/feed/` | **404** (empty RSS error body) | Soft-fail — do not wire |
| NVIDIA genAI category feed | `blogs.nvidia.com/blog/category/generative-ai/feed/` | **200** but channel title *Archives Page 1* | Prefer main `blogs.nvidia.com/feed/` over category |

---

## 5. Explicit DENY list

| Deny | Reason |
|------|--------|
| Anthropic News / Research / Engineering **HTML scrape** | No first-party RSS/Atom — Architect DENY |
| Meta AI Blog **HTML scrape** | No first-party RSS/Atom — Architect DENY |
| Invented Anthropic/Meta “mirrors” / rsshub / scrape farms | Not first-party · not PASS-blocking |
| Reddit / paid X / Bluesky | Out of free Pulse lab lane |
| HF Discuss as stand-in for HF blog | Forum · not lab announcement RSS |
| Wiring Meta Research/Eng in P2 without Architect re-open | Exists as XML but out of WIRE Meta-skip intent + weak AI-lab signal |
| Treating `text/plain` Mistral body as hard-fail **without** XML sniff | Would false-reject a valid first-party feed — soft-fail only if body is not RSS/Atom |

---

## 6. Soft-fail expectations for Coder

Per `WIRE-LAB-HF-RSS-P2.md` Phase A (applies to Phase B adds too):

1. **Per-feed soft-fail** — HTTP 403/404/410, empty channel, HTML body, or unparseable XML → stamp that feed failed · continue other feeds · ingest still succeeds.  
2. **Do not trust Content-Type alone** — Mistral returns `text/plain` with valid `<?xml…><rss`. Sniff root `rss`/`feed`/`item`/`entry`.  
3. **HTML-looking 200** (Cohere/Anthropic-style shells) → soft-fail that URL · never fall through to HTML scrape.  
4. **UA + 6h cache** — honest stamp which feeds soft-failed this tick.  
5. **`briefEligible: false`** forever for lab RSS items · `classifyPost` hygiene · Sol≠Astra.  
6. **Empty feed ≠ crash.**  
7. If §3 table unused at land → **ship Phase A only** — still P2 PASS.

---

## Probe log (summary)

| Window | Result |
|--------|--------|
| 2026-09-11T11:24:36Z (±3 min) | Wired 4/4 → HTTP 200 + XML feeds |
| same | Phase B keepers: Mistral, NVIDIA×2, MSR blog, Google Research |
| same | Anthropic / Meta AI Blog / Cohere / xAI → **no first-party feed** |

**Phase B URLs recommended: 5**  
**A-only still PASS:** yes

---

### Coder land stamp — P2b · 2026-09-11T11:28Z

All **5** Phase B recommend URLs wired into `LAB_FEEDS` with per-feed soft_fail.
DENY list respected (Anthropic/Meta/Cohere/xAI HTML · Reddit · paid X · Bluesky).
P3 HN not landed this turn.
