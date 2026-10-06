# Pass F — Gmail newsletter / news mail → Pulse

**Architect cut:** 2026-10-06 · Canberk order D→F→C→B→E→A (via Grok Bot)  
**Status:** PASS MARK · land after D (Coder waits on this doc)  
**Owners:** Coder builds · UX signs off look · Reviewer gates  
**Prefer free.** DENY: paid X API · pasted Atom/RSS URL lists as the F source · inventing Brief pins / leads · Bluesky.

## Goal

Pull AI / tech / security / paper news from **Canberk's Gmail** with keyword search (not hand-pasted feeds). Rank by importance × freshness (**quality-in-time**), then land rows on **Pulse** (and Digest refs only if already allowed for shelf-class signals). Never invent or change a Brief pin or lead.

## Query shape (Gmail search)

One OR-group of topic terms + newsletter / digest cues. Close variants allowed; do not invent unrelated topics.

```
(subject:(AI OR "artificial intelligence" OR LLM OR "large language" OR GPT OR Claude OR "machine learning" OR ML)
 OR subject:(newsletter OR digest OR "weekly" OR "daily brief")
 OR subject:(tech OR technology OR hack OR hacking OR security OR CVE OR paper OR arXiv OR research)
 OR "artificial intelligence" OR LLM OR newsletter OR "security advisory")
 newer_than:14d
 -category:spam -category:promotions:low
```

Rules:

1. **Keywords required** (seed set): `AI`, `newsletter`, `tech`, `LLM`, `intelligence`, `HACK` / `hack`, `security`, `paper` — plus close variants above. Coder may tighten with Gmail operators (`subject:`, `from:`, `list:`) after a dry-run, but the seed set stays covered.
2. **Reach related mail** — follow threads / same-from digests that match the seed set; still filter by the same terms (no whole-inbox dump).
3. **No pasted Atom URLs** — F does **not** add first-party RSS/Atom allowlists. Lab/Sec RSS stays on existing WIRE docs. F = Gmail API / connector search only.
4. Cap per crawl: **≤24** messages fetched, **≤12** Pulse rows emitted (dedupe by message-id / canonical link).
5. Pace: ≤1 Gmail list call / crawl (plus ≤1 get-thread only when needed for body/link). Soft timeout 15s.

## Categorize: importance × quality-in-time

Score each hit before emit (display/sort on Pulse shelf only — **not** Brief):

| Factor | Weight | Rule |
|--------|--------|------|
| Topic hit density | high | More seed keywords in subject+snippet → higher |
| Recency | high | Prefer `newer_than` window; decay hard past 72h for Pulse rank |
| Sender trust | med | Known newsletter / lab / publisher From or List-Id (learned from hits, not a hard-coded Atom list) |
| Link quality | med | Prefer single canonical article/paper URL over tracking redirects; drop unsubscribe-only |
| Noise | deny | Pure promo / receipt / calendar / 2FA → drop |

Emit a compact `priority` (`P1` · `P2` · `P3`) and keep raw `qi` score in ingest stamp for Reviewer. Default Pulse row order among Gmail members: `qi` then freshness. Does **not** reorder HN/HF clusters or Papers.

## Pulse vs Brief

| Surface | After F |
|---------|---------|
| **Pulse** | New members with `source: "gmail-news"`, `pulseEligible: true`, `briefEligible: false`, `pulse_only: true`. **Own SRC chip** (e.g. `GML` / `Gmail`) — must **not** read as GNW/GNews. Soft chrome otherwise consistent with Lab/Sec RSS shelf rows. Optional soft-fail meter chip. |
| **Wire** | May mirror the same pulse_only items if Wire already shows shelf-class RSS; otherwise Pulse-only is enough for PASS. |
| **Brief Take / lead / HELD / cycle `003`** | **Unchanged.** Gmail hits never become pins, never force a lead, never bump cycle. |
| **Digest / Voice** | At most Digest **refs** (same as security RSS `digestRefOk`) if Coder already has that path; **no** title unlock (that is **A**). |
| **Papers** | Unchanged (paper *mail* is Pulse signal, not HF Papers UP). |

## Soft-fail (Gmail down / empty)

1. Auth fail · quota · 5xx · timeout → stamp `gmail-news: soft` (or DENY only if policy blocks), crawl + publish **still succeed**.
2. Zero hits → empty emit, meter OK/soft honest, no invented rows.
3. Partial parse (no link) → skip that message; do not invent URLs.
4. Do not fall back to paid X, Bluesky, or scraped HTML mirrors.

## Retention

| Artifact | Keep |
|----------|------|
| Ingest stamp in `ingest-last.json` (`gmail_news`: count, soft/ok, last_query_hash) | Last crawl only (overwrite) |
| Message id → row cache under `artifacts/sage/gmail-news-cache/` | **14d** TTL, then drop |
| Emitted Pulse snapshot in desk-view / pulse data | Same desk-view caps as other Pulse members; oldest Gmail members evict first when over cap |
| Raw full MIME bodies | **Do not** commit. Cache headers + subject + link + snippet only |

## Pass marks (Reviewer on live Pages + `:3000`)

1. Fixture: keyword query → ≥1 Pulse row with `source: gmail-news`, `briefEligible: false`, and a distinct SRC chip (not GNW).
2. Fixture: Gmail timeout / 401 → soft meter, ingest exit 0, Brief pins identical to pre-F crawl.
3. Live (when Gmail connected): at least one real hit in the 14d window shows on Pulse with honest date/age; no new Brief pin.
4. Paid X still DENY strip; no X likes in Pulse `UP` (D).
5. Tests cover: seed keywords present in query builder, qi rank, dedupe by message-id, retention TTL drop, never Brief.
6. First Load under 185 kB; desk-view caps unchanged (Gmail rows count toward existing Pulse member cap).
7. Skin V2; 0 sideways scroll at 390.

## Proof

Before/after Pulse (Gmail rows + soft meter) at 1280 + 390 → Grok Bot.  
`refs/VISUAL-PROOF-pass-f-gmail-{pulse,meter}-{before,after}-{1280,390}.png`

## Out of scope

| Letter | Note |
|--------|------|
| D | Engagement rail — **lands first**; do not bundle F into D |
| C | Dates |
| B | Digest UI stamp |
| E | Session taste only |
| A | Cycle unlock — Digest/Voice titles |

## Land order

Coder lands **D alone first**. Then F against this pass mark (separate commit). UX look · Reviewer gate. Do not wait on C/B/E/A for F.
