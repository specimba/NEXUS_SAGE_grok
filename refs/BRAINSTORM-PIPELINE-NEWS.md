# Brainstorm — pipeline automation + AI news pulse (Architect cut)

**Canberk eye @ 2026-09-07:** Brief UI = **ship-for-now** (VM resolution may soften stills; not a craft block). Next = automation + respectful AI news tracking.  
**HTTP freeze:** lift candidate for **freeze-safe automation** + **free pulse wires only** after Director ack — still **no paid X**.

## Locks (unchanged)

`003` · `hf-incident` · Sol≠Astra · Skin V2 · free only · no `004` · Brief pins never from pulse pipes

## Track A — Pipeline automation (prefer first)

| Idea | What | Gate |
|------|------|------|
| A1 VM cron harden | `digest:tick` + optional `ingest` when crawl age > N h | OPS-HARDEN evidence |
| A2 STALE auto-ingest | Detect crawl STALE → `bun run ingest` + rebuild if live lags | Reviewer stamp-truth |
| A3 Digest DUE auto-export | On WROTE → dual-home `pack:export` without waiting for pulse | PACK-DUAL-HOME |
| A4 Soft-fail health | Panel/rail: OpenAlex 429, ToB unresolved, X skipped | briefEligible:false |
| A5 Event triggers | GitHub/Origin listeners later; for now cron is enough | no scope creep |

## Track B — News pulse (free only)

| Source | Role | Never |
|--------|------|-------|
| HN Algolia | Trend / discussion pulse | Brief lead |
| HF daily_papers | Paper shelf | Brief lead |
| Lab + Security RSS | Lab signal | Brief lead |
| OpenAlex / Crossref | Enrichment | Brief lead |
| GitHub unauth search / trending topics | Shelf | Brief lead |
| **X / Twitter** | **Paid API = DENY.** Free paths only if durable (public RSS bridges, lists we control). Soft-fail if fragile. | Brief lead · invent cycles |

### X without paid API (options to debate)

1. **Skip X** — double down HN + HF + RSS (honest, durable)
2. **Operator-curated allowlist** — paste/watch specific accounts via free HTML/RSS if stable
3. **Fragile public mirrors** — Nitter-class / community RSS (high break rate; Scout must rate durability)
4. **Wait for free bearer** — only if it appears; never buy

Architect lean: **(1) + (2)** first. Don’t build the desk on scrapers that die weekly.

## Track C — UI (light only)

- Resolution / density: accept VM desktop limits for now
- Optional: responsive breakpoints + `visual:check` viewport note
- Voice/Digest L·mid·R parity stays **parked** until Canberk asks (ship-for-now said Brief OK)

## Decision ask (Canberk + room)

Pick order for next pulse:
1. Automation A1–A3 only?
2. Pulse shelf deepen (HN/HF) without X?
3. Scout X-free durability report before any X-shaped wire?
4. Uncork Voice/Digest parity anyway?

## Non-goals this brainstorm

Paid X · cycle `004` · inventing Brief pins from trends · hex churn · more grain-only polish

## External refs (Scout to deep-dive)

| Project | Why look | Caution |
|---------|----------|---------|
| [trend-pulse](https://github.com/claude-world/trend-pulse) | Zero-auth multi-source trends (HN, Bluesky, GitHub, Google News RSS…) | X still needs bearer; scrapers fragile |
| [harken](https://github.com/VladUZH/harken) | Keyword watch across HN/Bluesky/RSS free; X needs bearer | Fits “respectful AI news” watchlists |
| TrendsMCP / TrendWatch | Multi-platform alerts | Free tier = third-party key (100/mo) — **not** our free-provider contract unless Canberk allows |
| Our existing FREE-PROVIDERS | Already wired | Deepen before adding SaaS |

Architect: prefer **our stack + Bluesky/Mastodon/HN** over TrendsMCP key or paid X.

## Architect lock — 2026-09-07 ~01:25Z

Director order + Scout verdict accepted.  
**APPROVED:** `OPS-A1-A3-AUTOMATION.md` (A1 first).  
**NOT APPROVED:** any new `WIRE-*` until Canberk ranks 1–4.


## Architect veto — 2026-09-07

**Bluesky = DENY** (Canberk: not a respected AI-news surface / political). Do not wire. Free pulse = HN · HF · Lab/Sec RSS · OpenAlex · GitHub shelf only. Paid X still DENY.
