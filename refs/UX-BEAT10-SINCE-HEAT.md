# UX Beat 10 — "Since you were here" + topic heat (UX Gürok → Coder land)

Locks: Skin V2 tokens only. Green = signal, amber = hot only. Reuse `.pulse-v5-*`.

## 1. Since you were here
- Last visit = `localStorage.sage.lastSeenAt`, written when the tab is hidden/closed (visibilitychange), NOT on load, so a reload doesn't wipe the marker.
- Marker distinct from NEW (NEW = since last crawl, inverse phosphor plate). SINCE = 2px amber left edge on the row + nothing else. Row keeps normal text. One marker style, no second plate.
- Divider row inserted in the Pulse table (and Brief Wire) at the boundary: full-width 1px amber rule with kicker `SINCE YOUR LAST VISIT · 01:14 · 9 new rows` right-aligned. Rows above it = arrived since. If 0 arrived, no divider, just kicker in health strip `nothing since 01:14`.
- First ever visit: no markers, no divider (same logic as the BASELINE rule).
- `u` key (Beat 9 map) jumps selection to the first "since" row; add to `?` map.

## 2. Topic heat strip
- Position: Pulse, directly under the source health strip, same width, 32px tall. Header kicker left `HEAT · 6 crawls`.
- Five cells: ANTHROPIC · OPENAI · GOOGLE · NVIDIA · HF. Each cell = label + 6-bar sparkline (one bar per crawl, oldest left, bar height = cluster count, phosphor) + current count right, tabular.
- Hottest cell (highest latest count, ties = biggest rise) gets its latest bar and count in amber. Only one amber cell.
- Delta vs previous crawl after the count: `▲2` phosphor, `▼1` muted, `=` muted.
- Click (or Enter when focused) on a cell = sets the Beat 9 filter to that company, filter chip appears. Cells are buttons, 44px hit height on the whole cell.
- Fewer than 6 crawls in history: draw missing bars as dotted outline stubs, label `3/6 crawls`.

## Carry-over polish (from Beat 8 review)
- Drawer `open ↗` links: make the whole source row the link target (min 44px), keep `open ↗` as the visible cue.

## Proof
`refs/VISUAL-PROOF-beat10-since.png` (divider + amber-edged rows, simulate lastSeenAt 2h ago) and `beat10-heat.png` (strip with at least 2 real crawls of history). Before/after pair for Canberk.

### Window rule (Reviewer, 01:46)
Bars are 4h windows (02/06/10/14/18/22 slots), not raw crawls: one value per window = the last crawl inside it. Hand runs in the same window collapse to one bar. Windows with no crawl render as the dotted stub; label reads `N/6 windows` until six real windows exist.

### Sixth cell (Scout, 02:11)
Add `OTHER LABS` as cell 6 (xAI, Meta, Mistral, DeepSeek, Qwen, Xiaomi). Same sparkline/count/delta; under the count a dim 1-line list of which labs contributed this window (top 2 + `+N`, e.g. `xAI · Xiaomi`). Eligible for the single amber "hottest" cell. Click filters to the whole group. On 390px the 6 cells scroll inside the strip.
