# UX Beat 6 — lane chip parity + Papers density (UX Gürok → Coder land)

Locks: Skin V2 tokens only, no new hex, no remaps. Reuse Pulse V5 classes where possible.

## 1. Lane chip parity (`nav.desk-lane`, desk.tsx ~L128)
Problem (Reviewer soft note): on the Voice lane, `[01]` renders solid-filled while `[05]` (the active lane) is outlined — the fill follows something other than `aria-current`.
Rule: exactly ONE chip is filled, and it is always the active lane.
- Active = `aria-current="page"`: phosphor fill, `--bg-deep` text, block cursor. Same on every lane.
- Inactive = outline only (`--border`), `lane-prefix` amber, label muted. No fill from `:focus`, `:hover`, or first-child/default selectors.
- Focus = 2px phosphor outline ring (`focus-phosphor`), never a fill.
Check: screenshot each of the 6 lanes; the filled chip index must equal the lane index in all 6.

## 2. Papers density (function `Papers`, ~L910)
Today: stacked `sage-panel` cards with 3–4 buttons each. Target: same table grammar as Pulse V5.
- Wrap in `.pulse-v5-table`; rows `.pulse-v5-row` 34px, zebra, 1px rules.
- Columns: `#` · `UP` (HF upvotes, tabular, right) · `YR` · `TITLE` (phosphor-bright, 1-line truncate) · `SRC` badges (`HF` `ARX` `OAX` `XREF`, dim outline, lit when that enrich hit) · `LINKS` (`abs` `pdf` as text links, sage-signal).
- `exp` and `id` buttons leave the row: click row toggles expansion (abstract + DOI + copy-id inside expanded area). Keep h-11 hit target on the row itself.
- Header panel shrinks to one kicker line: `PAPERS · N rows · never Brief`.
Pass: at 1280×800, at least 14 paper rows visible above the fold (today ~7), and Papers reads as the same instrument family as Pulse.

## Proof
`refs/VISUAL-PROOF-beat6-voice-chip.png` (Voice lane, chip row) and `refs/VISUAL-PROOF-beat6-papers.png` (Papers lane, no hover).
