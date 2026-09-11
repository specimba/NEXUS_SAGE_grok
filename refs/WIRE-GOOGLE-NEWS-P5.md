# WIRE — Google News RSS spice (FREE-PULSE P5 · LANDED)

**Architect approve:** YES · **Director GO** 2026-09-11 ~12:25Z · Scout notes `SCOUT-P5-GOOGLE-NEWS-RSS.md` @12:33Z  
**Owners:** Coder land · Reviewer FAIL-gate · UX shelf chrome per `UX-P5-GOOGLE-NEWS-SHELF.md` · Scout freeze ages  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · **Pulse shelf spice only** · `briefEligible:false` · `pulseLeadEligible:false` · **never sole lead** · no `004`  
**DENY:** paid X · Bluesky · Reddit · scrape farms · incident-noun standing queries · inventing topic IDs

## Goal

Optional Google News RSS **spice** beside Lab/HN — quiet shelf cards · soft-fail on format break · never Brief · never sole Pulse lead.

## Endpoint

```
GET https://news.google.com/rss/search?q={QUERY}&hl=en-US&gl=US&ceid=US:en
```

- Always emit `hl` · `gl` · `ceid` (do not rely on redirect injection)  
- UA polite (NEXUS-SAGE / Scout-compatible)  
- Prefer **search** templates — not opaque `/rss/topics/CAAq…` IDs  

## Queries (Scout allowlist)

Standing ≤6 · **rotate ≤2 / ingest tick**:

1. `Hugging+Face` · `OpenAI`  
2. `Anthropic` · `large+language+model`  
3. `AI+agent` · `open+weights`  

EXCLUDE: Sol/Astra/incident nouns · Bluesky · crypto spam.

Cap display **6–8** cards · newest by `pubDate` · de-dupe `guid` / title+source.

## Soft-fail (required)

| Failure | Behavior |
|---------|----------|
| 403 / 429 / timeout | soft_fail stamp · continue ingest |
| HTML instead of RSS / parse break | soft_fail · empty OK |
| Empty items | soft_fail / empty · A4 chip honesty |
| Never | hard-fail ingest · Brief pin · sole Pulse lead |

Cache raw XML **6h** under `artifacts/sage/gnews-cache/`.

## Schema / placement

- `source: "gnews-rss"` · `briefEligible: false` · `pulseLeadEligible: false`  
- Pulse **quiet shelf** sibling (UX-P5) — below Lab/HN primacy  
- Links may be Google redirect URLs — OK for shelf; do not invent publisher unwrap this wire  

## Done-when (Reviewer)

- [x] ≤2 queries/tick · soft_fail on break · never Brief / never sole lead  
- [x] Locks `003`/`hf-incident` · bun green · `visual:check` OK  
- [x] A4 honesty if soft · display cap ≤8  
- [x] No topic-ID invent · no scrape of article HTML  

## Non-goals

P6 Lobsters/dev.to · Voice/Digest · cycle `004` · overnight firehose · replacing first-party lab RSS

## Coder land — 2026-09-11

**LANDED** — Google News RSS spice (Scout `SCOUT-P5-GOOGLE-NEWS-RSS`) · standing ≤6 · rotate ≤2/tick · soft_fail on format-break/empty/403/429 · A4 chip path · Pulse quiet shelf sibling · `briefEligible:false` · `pulseLeadEligible:false` · never sole lead · never Brief · locks `003`/`hf-incident` · no `004` · paid X/Bluesky DENY · cache 6h `gnews-cache/` · display cap ≤8 · search template only (no topic-ID invent).

Standing: Hugging Face · OpenAI · Anthropic · large language model · AI agent · open weights.

Unit: rotate ≤2 · HTML/empty/429/403 soft_fail · Sol/Astra/jailbreak/Bluesky blocked · bun green · `visual:check` OK.

## Architect HOLD after P5

**P6** HOLD until explicit Canberk/Director GO.
