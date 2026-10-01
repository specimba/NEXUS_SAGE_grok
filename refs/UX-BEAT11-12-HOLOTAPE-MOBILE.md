# UX Beats 11 + 12 — Lead log holotape + 390px phone layout (UX Gürok → Coder land)

Locks: Skin V2 tokens only, no new hex. Green = signal, amber = hot/warn only.

## Beat 11 — Lead log (Pip-Boy holotape)
Entry: "Yesterday" line on Brief becomes a link `YESTERDAY · … → log`; also a `l` key (add to `?` map). Route `?view=leadlog` inside Brief (no new lane tab; tabs stay 6).
- **Header:** `HOLOTAPE · LEAD LOG · N days` kicker, amber tape-reel glyph ▣ at left (CSS only, no image).
- **Day rows** (newest first), pulse-v5-table grammar, 40px:
  `DATE` · `PICK` (06:11 / HELD) · `LEAD HEADLINE` (phosphor-bright, 1 line) · `PUBS` (count + first 3 publisher names, dim) · `SIG`.
  HELD days: whole row muted with `HELD · no qualifying story`, previous lead name in dim.
- **Expand a day** (click / Enter): "tape playback" block on `--bg-deep`, mono, lines appear with a 40ms per-line stagger (reduced-motion = instant):
  `> CANDIDATES 4`
  `  ✓ LEAD   UN AI-safety CEOs · 2 PUB · SIG 3`
  `  ✗ AGE    Claude enzyme · first seen 28h`
  `  ✗ POLIT  Trump allies … Anthropic CEO`
  `  ✗ LIST   5 AI Semiconductor Stocks`
  Reason codes fixed width (AGE / POLIT / LIST / TASTE / SRC<2 / FILTER), ✗ codes in muted-foreground, ✓ in phosphor. No amber unless the pick was a tie-break (`TIE` in amber).
- Source of truth `artifacts/sage/lead-history.json`; view renders from it only (Director's rebuild rule).
Proof: `VISUAL-PROOF-beat11-leadlog.png` with one day expanded.

## Beat 12 — Phone layout, 390×844
Pass: `document.documentElement.scrollWidth <= 390` on all 6 lanes + open drawer + key map. No sideways scroll anywhere.
- **Header:** CYC title one line, status ticker becomes a single horizontally scrolling chip row inside its own container (only allowed scroller, `overflow-x:auto`, scrollbar hidden) — it must not widen the page.
- **Lane tabs:** 6 tabs in a 3×2 grid, numbers kept, 44px tall.
- **Brief:** stack Take → Wire → pip rail as a horizontal 3-gauge row → pins. Take plate headline clamps to 3 lines.
- **Wire rows:** 2 lines: `NEW AGE N SRC` then headline.
- **Pulse table:** 3 columns `AGE · HEADLINE · SRC` (SRC shows lead badge + `+N`); NEW becomes the 2px edge marker; SIG hidden. Health strip and heat strip scroll horizontally inside their own containers.
- **Drawer:** bottom sheet, 88vh max, 16px top radius-free (keep square CRT edges), drag handle bar 32×4 phosphor-deep, swipe down or Esc closes, table not visible behind (full dim).
- **Papers:** `UP · TITLE` + badges on line 2.
- **Keyboard hints / `? keys`** hidden below 768px.
- Hit targets 44px minimum for every link/button.
Proofs: `VISUAL-PROOF-beat12-{brief,pulse,drawer}-390.png` + a log of scrollWidth per lane.
