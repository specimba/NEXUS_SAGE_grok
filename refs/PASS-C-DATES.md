# Pass C — Real dates on Papers / Pulse / Wire

**Architect cut:** 2026-10-06 · Canberk order D→F→C→B→E→A  
**Status:** PASS MARK · land after D  
**Owners:** Coder builds · UX signs off · Reviewer gates  
**Prefer free.** DENY: inventing dates · Brief pin changes · paid X.

## Goal

Readers see when a story or paper actually landed, not only how old it feels. Papers stop showing year-only `YR`. Pulse and Wire keep relative age but also show a calendar date.

## Columns that change

| Lane | Today | After C |
|------|-------|---------|
| **Papers** | Header `YR` · cell = year (`2026` from arXiv id / OpenAlex) | Header **`DATE`**. Cell = published day in Istanbul, tabular: `MM-DD` (e.g. `10-06`). Source priority: HF/arXiv published → OpenAlex `publication_date` → Crossref `issued` → arXiv id `YYMM.xxxxx` as `20YY-MM` first-of-month fallback. Soft-fail: unknown → dim `—` (never invent today's date). |
| **Pulse** | `AGE` only (absolute HH:MM in static HTML → relative after mount) | Keep `AGE`. Add a compact **`DATE`** column (or fold date into the AGE cell as `MM-DD · 2h` after mount / `MM-DD · HH:MM` in static HTML). Use cluster `at` / earliest member `at`. Soft-fail: missing → `—`. |
| **Wire** | Same AGE pattern as Pulse | Same DATE rule as Pulse for each Wire row. |
| **Brief Take / Digest / Voice** | — | **No column changes in C.** (A unlocks content later.) |

Sort order unchanged. Skin V2 only. 390: DATE must not cause sideways scroll (reuse `pulse-v5-age` width or stack under AGE below 768).

## Soft-fail

- Missing / unparseable published time → dim `—`, crawl and publish still succeed.
- Do not write wall-clock "now" as a published date.
- HF date-only midnight stamps stay honest (show the day; do not invent a time).

## Pass marks (Reviewer)

1. Papers header reads `DATE`; at least one live row shows `MM-DD` that matches that paper's arXiv/HF day (not only `2026`).
2. Pulse and Wire each show a calendar day per row alongside age.
3. A row with no usable timestamp shows `—`, not today's date.
4. First Load under 185 kB; desk-view caps unchanged unless a short `d`/`published` field is added (prefer deriving from existing `at` / arXiv id to avoid size growth).
5. 1280 + 390: 0 sideways scroll; visual:check + font-check pass.
6. Brief lead / HELD / cycle `003` unchanged for the same crawl.

## Proof

`refs/VISUAL-PROOF-pass-c-dates-{papers,pulse,wire}-{before,after}-{1280,390}.png` → Grok Bot.

## Out of scope

D engagement · B Digest stamp · A cycle unlock · F feeds · E session taste.
