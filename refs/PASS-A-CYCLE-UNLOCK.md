# Pass A — Digest / Voice unlock vs `CYCLE.003`

**Architect cut:** 2026-10-07 · Canberk order D→F→C→B→E→A  
**Status:** PASS MARK (unlock policy) · land after E stamp  
**Owners:** Coder builds · UX signs off · Reviewer gates  
**Prefer free.** DENY: cycle `004` · inventing titles/takes · paid X · Brief pins from pulse-only sources (Gmail `GML`, taste, lab/sec RSS, GNews).

## Goal

Digest and Voice stop reading the frozen Sep 3 `CYCLE.003` copy ("Eval agents… HF production swarm") and follow **today's lead** — the same story Brief already shows from `lead-pick` (06:11 Istanbul pick, frozen 24h). One desk, one lead.

## Unlock policy

| Rule | Policy |
|------|--------|
| **Title source** | `LEAD_TODAY` (lead-pick) → Digest/Voice lead title + take. Rows below = top corroborated clusters from the same pack (existing corroboration rank). |
| **Cycle label** | Stays **`003`**. No `004`, no compile of a new cycle file. The label means "desk era", not "frozen content". |
| **When it changes** | Only at the 06:11 pick (or first WROTE pack after it). Later crawls in the 24h window do **not** swap Digest/Voice titles (matches Brief freeze). |
| **HELD** | If `LEAD_HELD` is true or `LEAD_TODAY` is null → keep the **last good** unlocked titles with an honest `HELD` stamp. If none exists yet, fall back to `CYCLE.003` copy marked `archive · 003`. Never invent. |
| **Eligible sources** | Only stories already eligible for the Brief lead (corroborated, `briefEligible` path). `pulse_only` / `briefEligible:false` items (GML, taste, RSS, GNews-only) may appear as Digest **refs**, never as Digest/Voice titles. |
| **`CYCLE.003` static pins** | Kept as an **archive** block (read-only, collapsed), not deleted. Not the live headline. |
| **Voice** | Same lead + same top rows as Digest, text only. No new audio/TTS pipeline in A. If Voice lane is still parked in the UI, A only unblocks its copy; layout parity stays a separate ask. |

## Pass marks (Reviewer on live Pages + `:3000`)

1. Digest lead title equals Brief `LEAD_TODAY` title for the same build (not "HF production swarm" / Sep 3 text).
2. Voice lead equals Digest lead; Voice rows equal Digest top rows.
3. Cycle chip still reads `003`; no `004` anywhere.
4. Forced `LEAD_HELD=true` fixture → last good titles + `HELD` stamp; empty history → `archive · 003` fallback.
5. Fixture: a `GML` / taste / RSS item never becomes a Digest or Voice title.
6. Mid-window crawl (after 06:11) does not change Digest/Voice titles; next pick does.
7. Pass B coherence still green (cadence meters vs `digest-last.json`); pack file carries the unlocked titles.
8. First Load under 185 kB; desk-view caps unchanged; Skin V2; 0 sideways scroll at 390.

## Proof

`refs/VISUAL-PROOF-pass-a-unlock-{digest,voice}-{before,after}-{1280,390}.png` → Grok Bot.

## Out of scope

Topbar Sep 6 ingest pack (soft follow-up) · Voice/Digest layout parity · new providers · Beats 13/14 (parked).

## Land order

Coder lands **A alone** after E stamp. Do not bundle the topbar follow-up.
