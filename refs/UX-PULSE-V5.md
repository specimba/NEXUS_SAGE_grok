# UX PULSE V5 — craft mock for Beat 3 (UX Gürok → Coder land)

Gate: build only after Beat 2 lands (ledger `artifacts/sage/source-health.json`, cluster `sources[]`, `first_seen`).
Locks: Skin V2 tokens only (`--phosphor`, `--phosphor-bright`, `--pip-amber`, `--bg-deep`, `--card`, `--border`, `--muted`, `--primary-foreground`). No new hex. Green = signal, amber = hot/warn only.
Arm's-length test: today Pulse = 2-col grid of tall cards, one section per source. V5 = ONE terminal table of clusters. If a squint still shows a card grid, FAIL.

## Layout (top to bottom, L/mid/R grammar)

1. **Health strip** (full width, 1 row, 28px): replaces the "soft-fail meters" panel and moves it to the TOP.
   One cell per source from ledger: `HN ▮▮▮▮▯ 12` = label · 5-tick 7-day ok streak · items this crawl.
   Cell states: ok = phosphor, soft = pip-amber, fail/deny = muted + strike. Right end: `FRESH 1.2h` or amber-plate `STALE 6.4h` (reuse `.sage-stale`).
2. **Main grid** `grid-template-columns: 1fr 260px` on md+.
   - **Left/mid: cluster table** (`.pulse-v5-table`), monospace, row height 34px, zebra via `--card` at every 2nd row, 1px `--border` rules.
     Columns: `#` (2ch) · `NEW` (4ch) · `AGE` (5ch, right-aligned, `2h`/`41m`) · `HEADLINE` (flex, phosphor-bright, 1 line truncate) · `SRC` (badge stack) · `SIG` (score/pts, tabular, right).
     - NEW = inverse micro-plate (phosphor bg, `--bg-deep` text) when `first_seen > previous crawled_at`; blank otherwise.
     - SRC badges: 3-letter mono chips `HN` `GNW` `OAI` `ANT` `DMD` `HF` `SEC`; first = lead source (solid outline), rest = "also" (dim). `+2` overflow.
     - Lead cluster (row 1, most sources × freshest) gets a 2-line expanded row: headline + "also covered by" line listing publisher names (Techmeme move). Only one expanded row by default; click a row toggles its expansion (reuse `openSecId` pattern → `openClusterId`).
     - Row hover: left 2px phosphor bar, no glow.
     - Max 24 rows, then "show all N" text button (h-11 hit target).
   - **Right rail: Taste shelf** (`.pulse-v5-taste`), quiet: `pin-card-quiet`, text-sm muted, max 6 items, header `TASTE · X-session · never lead`. Skip state keeps current copy, one line.
3. **Footer ledger line** (kicker, subtle): `DENY · paid X · Bluesky · scrape farms · briefEligible=false` — the deny/eligibility copy leaves every row and lives here once.

## Removed noise
- Per-card "never Brief · never sole lead" repeated on every item → once in footer.
- Hero images in Pulse cards (`p.media` h-40) → gone from table; lead expanded row may show a 64px thumb on the right if present.
- Separate HN / Lab / GNews / Security sections → merged into the table; `SEC` badge + amber `SIG` for security items keeps them findable.

## Mobile (<768px)
Table collapses to 2-line rows: line 1 `NEW AGE SRC`, line 2 headline. Taste rail drops below table. Health strip scrolls horizontally, no wrap.

## Class names for Coder
`.pulse-v5` · `.pulse-v5-health` `.pulse-v5-health-cell` `[data-state=ok|soft|fail]` `.pulse-v5-ticks` · `.pulse-v5-table` `.pulse-v5-row` `[data-open]` `.pulse-v5-new` `.pulse-v5-age` `.pulse-v5-src` `.pulse-v5-src-lead` `.pulse-v5-also` · `.pulse-v5-taste` · `.pulse-v5-foot`

## Proof
`refs/VISUAL-PROOF-pulse-v5.png` at 1280×800, Pulse tab, no hover, table + health strip + Taste rail all in first viewport.

## Addendum after Beat 2 gate (2026-09-25 00:22)
- **NEW noise guard:** if more than 40% of rows would be NEW (first crawl / reset seen-index), render no NEW plates and show `BASELINE · first crawl` in the health strip instead. NEW only means something when it is rare.
- **Single-source rows must still read as a table:** a one-badge row shows its lone badge dim-outlined, no "also" line. Only multi-source clusters get the solid lead badge + "also covered by" expansion, so real merges visibly stand out.
