# SAGE Theme Deep Dive — Fallout × Matrix × classy cyberpunk
**Date:** 2026-09-04 · **Owner:** UX Gürok · **Status:** P0 tokens locked; this is P1+ polish direction only (no hex churn)

## Thesis
Combine Pip-Boy *restraint* (survival clarity, amber CRT) with Matrix *operational density* (one signal hue, hairline grids) — never Netflix neon soup.

## What the research says (keep)

### Fallout / Pip-Boy
- Dual register: mid-century institutional confidence + corroded CRT residue — don’t blend into mush.
- Hierarchy from **brightness / inverse / blink**, not rainbow hue stacks.
- Square corners, monospace (Share Tech Mono), partial border chrome (top+right), phosphor glow on headers only.
- Semantic severity: green = nominal/signal · amber = primary/caution chrome · red = critical.
- Refs: Curio Pip-Boy style guide; Home Assistant Pip-Boy Amber (`#0D0800` warm black — aligns our `#0b0700`); Bethesda CRT projection notes (scanlines, flicker, vertical-hold on mode switch — use sparingly).

### Matrix (restrained)
- Dark-only continuous surface, hairline 1px borders, ~2px radius, mono numerics, **one** green as interaction/signal — not wallpaper.
- Avoid: gratuitous rain, neon overload, gradient mesh, glassmorphism, Orbitron/glitch-everywhere.
- Refs: TypeUI Matrix skill; nika-design “administrative cyberpunk” (GITS/Akira/Eva discipline — Eva uses five colors).

### Classy cyberpunk / amber consoles
- Amber Console: one gas, many intensities — brightness hierarchy law.
- Terminal UI Theme / Neo-Terminal: three grounds (base / raised / surface), glow from `currentColor`, WCAG AA+, JetBrains Mono, corner ticks, no purple.
- Hyperstudio: warm gold + signal-green *punctuation* on obsidian — editorial-tech cousin.

### CRT / a11y
- Scanline opacity ~0.08–0.18; `pointer-events: none` on overlays.
- Prefer: static scanlines always; animate flicker/sweep only under `prefers-reduced-motion: no-preference`.
- Default quality = `subtle`; kill CRT with `html.crt-disabled`.

## Hard bans (align Reviewer)
- No Matrix rain as chrome
- No cyan/magenta surfaces
- No green-as-primary
- No Inter/Geist/Orbitron display
- No gradient text / bounce springs / emoji chrome
- No one-off hexes outside tokens

## P1 component language (for Coder when P0 boots proven)
| Pattern | Spec |
|---------|------|
| Panel | `--card` fill, `--border` 1px, radius `0.125rem`, optional corner ticks |
| Header | Share Tech Mono + soft `--phosphor-glow` text-shadow; partial top+right border |
| Data / pins | JetBrains Mono; numbers tabular |
| ALLOW / live | `--signal` text or dot only |
| DENY / error | `--destructive` |
| Focus | ring = `--phosphor-dim` glow, not thick blue |
| Empty / STALE | dim phosphor + uppercase label, no illustration wallpaper |
| CRT | scanlines opacity 0.18; vignette light; no barrel warp on desk |

## Contrast notes
Amber `#ffb000` on `#0b0700` is strong; muted `#6b4a00` needs check on `#14100a` cards — bump to brighter dim if AA fails on small type.

## Source shortlist
1. `NEXUS_FALLOUT_OS` globals (canonical steal)
2. iosue-iulianus/homeassistant-pipboy-theme (amber variant)
3. DutchDiederik/AmberConsole (hierarchy laws)
4. TypeUI Matrix skill / open-agent-stack neo-terminal
5. designbycurio Pip-Boy style guide

P0 hexes stay. This doc only guides Skin polish after live boot proof.
