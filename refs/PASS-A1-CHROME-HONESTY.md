# Pass A1 — Chrome honesty when Digest unlock is live

**Architect cut:** 2026-10-07 · Canberk (via Grok Bot): desk still feels Sep 10 after A  
**Status:** PASS MARK · tiny follow-up · **not** an A rewrite  
**Owners:** Coder builds · UX signs off · Reviewer gates  
**Prefer free.** DENY: cycle `004` · inventing titles · paid X · taste re-scrape (separate) · reopening closed archive fold by default.

## Goal

When `DIGEST_UNLOCK` is active (Beam / today's lead), chrome stops advertising Sep-era window, pack, and pack-source. One desk, one clock.

## Punch list (Coder)

| Surface | Today (lie) | After A1 |
|---------|-------------|----------|
| **Topbar ingest line `pack …`** | `PACK_AT` = Sep 6 (`digest-pack.ts`) | Show **`DIGEST_CADENCE.last_at` / `pack_id`** (same truth as Pass B meters / `digest-last.json`). Drop or stop importing `PACK_AT` for display. |
| **Header `CYCLE.window`** | Always `2026-08-31 → 2026-09-03` | When unlock active: mute the Sep window **or** reword to pick window (e.g. `unlock · pick {DIGEST_UNLOCK.pickDate}` / `lead frozen {HH:MM}`). Cycle **id** stays `003`. |
| **Digest footer `PACK_SOURCE`** | `fancyTWEETS 02 Sep list + live ingest 03 Sep…` | When unlock active: mute **or** replace with unlock stamp (`unlock · {leadId} · pick {pickDate}`). Do not keep fancyTWEETS as live provenance. |
| **Archive fold** | — | Stays **closed** by default (PASS-A chrome). Do not auto-expand. |
| **Corroboration / Moved (`hf-swarm`)** | Rank alias still maps `hf-incident` ↔ `hf-swarm`; Moved can surface Sep HF swarm while Brief is Beam | When unlock active: Moved/corroboration lead pin follows **`DIGEST_UNLOCK.leadId` / `LEAD_TODAY`**, not `hf-swarm`. Keep `hf-swarm` only inside the closed archive / curated digest-pack history — never as the live Moved lead row. |

## Soft-fail

- Missing `DIGEST_UNLOCK` / HELD path → existing A fallback (`archive · 003`); Sep chrome may show only in that archive mode.
- Missing `digest-last` → keep last cadence module; do not invent today's pack id.

## Out of scope

- Taste X re-scrape (session-only, separate land when Canberk session is live)
- Topbar-only Sep pack was noted after B; A1 **closes** that soft follow-up
- Voice/Digest layout parity · Beats 13/14

## Pass marks (Reviewer)

1. Topbar `pack` timestamp/id matches Digest meters / `digest-last.json` (not Sep 6).
2. With unlock live, no visible `Aug 31 → Sep 3` window and no `fancyTWEETS 02 Sep` as live provenance.
3. Archive fold starts closed; Beam (or current unlock lead) is the only headline chrome.
4. Moved / corroboration does not pin `hf-swarm` as live lead while Brief/Digest show unlock lead.
5. Cycle chip still `003`; Brief lead unchanged for the same crawl.
6. Tests: unlock-active chrome fixture; archive-mode may still show Sep copy; coherence with cadence.
7. 185 kB / font / 390 scroll Digest lead into frame.

## Proof

`refs/VISUAL-PROOF-pass-a1-chrome-{topbar,digest}-{before,after}-{1280,390}.png` → Grok Bot.

## Land order

Coder lands **A1 alone** after A is stamped (or immediately if A already live). Do not bundle taste re-scrape.
