# UX Beats 8 + 9 — Story drawer + keyboard control (UX Gürok → Coder land)

Locks: Skin V2 tokens only, no new hex. Green = signal, amber = hot/warn only. Reuse `.pulse-v5-*`.

## Beat 8 — Story drawer (Techmeme / Ground News)
Trigger: click a Pulse cluster row, or Enter on the selected row (Beat 9). Replaces the inline row expansion for clusters with 2+ sources; single-source rows keep inline expand.
- **Shape:** right side panel, 440px wide on md+, full-screen sheet on mobile. Slides in 160ms ease-out, no bounce; `prefers-reduced-motion` = instant. Pulse table stays visible and dimmed to 60% on the left; the selected row keeps its 2px phosphor bar.
- **Header (sticky):** cluster headline in phosphor-bright, 2 lines max. Kicker line under it: `N SRC · first seen 21:12 · age 4h · NEW|▲2|▼1`.
- **Coverage list** (Ground News move): one row per source, same headline side by side, sorted earliest first.
  Row = `[badge] publisher · time` then that source's own headline (text-sm) then `open ↗`. The lead source row has the solid badge; others dim outline.
  SELF reposts: whole row at muted, headline struck through, badge `SELF`, caption `company's own post · counts 0`. Always listed last.
- **Footer:** `score contribution ×1.30 (3 SRC)` in kicker so the rank math is visible; `Esc close` hint.
- **Close:** Esc, click on the dimmed table, or an `×` button (44px hit target). Focus returns to the row that opened it. Focus is trapped in the drawer while open; `role="dialog"`, `aria-modal`, `aria-labelledby` = headline.
- **URL:** `?story=<clusterId>` so a drawer can be linked and reloads open.
Pass: proof `refs/VISUAL-PROOF-beat8-drawer.png` on the Claude enzyme cluster (HN + Al Jazeera + 1 + SELF row struck).

## Beat 9 — Keyboard control
Global keys (ignored while typing in an input/textarea):
| key | action |
|---|---|
| `1`–`6` | switch lane |
| `j` / `k` | next / previous row in the current table (Pulse, Papers, Digest, Brief Wire) |
| `Enter` | open drawer (Pulse cluster) or expand row (other lanes) |
| `o` | open the selected row's lead link in a new tab |
| `Esc` | close drawer / filter / key map, in that order |
| `/` | open filter prompt |
| `?` | toggle key map |
| `g g` / `G` | first / last row |

- **Selected row:** 2px phosphor left bar + `--card` background (same as hover, so there is one "you are here" style). Scrolls into view with `block: nearest`. Selection is per lane and remembered when switching back.
- **Filter prompt `/`** (Pip-Boy prompt): a single line pinned at the bottom of the stage, `--bg-deep` field, phosphor text, prefix `> filter:` in amber, blinking block cursor. Live filters rows by headline/source/lab substring; count on the right `12/216`. Enter keeps the filter and returns focus to rows; Esc clears it. Active filter shows as a chip in the lane header `filter: anthropic ×`.
- **Key map `?`:** centered panel over a dimmed desk, two columns of `key → action` in mono, keycaps as outlined 1-char chips. Same dialog accessibility as the drawer.
- **Discoverability:** one kicker in the footer of every lane: `? keys`. Nothing else.
Pass: screen recording or step screenshots of a mouse-free tour: `2` Pulse, `j j`, Enter drawer, Esc, `/anthropic`, Enter, `4` Papers, `j`, Enter, `?`, Esc. Proofs `refs/VISUAL-PROOF-beat9-filter.png` and `beat9-keymap.png`.

### Modifier rule (Reviewer gate, 01:05)
Desk keys fire only with no Ctrl, Cmd (Meta) or Alt held, so Ctrl/Cmd+1..6, Cmd+K, Alt+arrows etc. stay with the browser. Shift is allowed only where the key itself needs it (`G`, `?`). Also ignore when `event.isComposing` or focus is in an input/textarea/contenteditable.
