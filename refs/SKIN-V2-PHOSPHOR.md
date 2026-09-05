# Skin V2 — Green phosphor primary (Architect cut)

**Why the rethink:** P0 froze `data-theme="amber"` from classic Pip-Boy *amber* CRTs + `NEXUS_FALLOUT_OS` defaults. That is **not** New Vegas green, and it under-sold Matrix. Canberk called it: Matrix = green, Fallout green phosphor + CRT, add cyberpunk — stop looking like a 90s frontpage.

## Decision (new lock)

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| **Primary phosphor** | `--phosphor` | `#33ff66` | body text, chrome, borders glow |
| Bright | `--phosphor-bright` | `#7dffa6` | hover / emphasis |
| Dim | `--phosphor-dim` | `#1f6b33` | muted labels |
| Deep | `--phosphor-deep` | `#0a1f12` | secondary surfaces |
| Glow | `--phosphor-glow` | `rgba(51,255,102,0.45)` | focus bloom only |
| **Accent (amber, scarce)** | `--accent` | `#ffb000` | warnings, selected ticks, companion pin, hot metrics |
| Accent dim | `--accent-dim` | `#6b4a00` | accent muted |
| Destructive | `--destructive` | `#ff2a6d` | DENY / errors only |
| Magenta (cyber, rare) | `--cyber` | `#ff2bd6` | optional hot-wire / critical — never wallpaper |
| Cyan (cyber, rare) | `--holo` | `#00e5ff` | optional 1px holo edge / link — never fills |
| Background | `--background` | `#050a07` | black-green void |
| Deep | `--bg-deep` | `#020403` | CRT underlay |
| Card | `--card` | `#0a140f` | panels |
| Border | `--border` | `#1a4d2e` | hairlines |
| Brand meta | theme-color | `#07090c` | keep charcoal OG/favicon |

Boot: `<html data-theme="phosphor">` (amber becomes optional nostalgia toggle later).

## What flipped

- **Old:** amber chrome · green = signal only
- **New:** green chrome · amber = scarce ops accent · cyan/magenta = tiny cyber sparks (edges, not fills)

## Cyberpunk touches (classy, not neon soup)

1. Instrument panels — 0 radius, 1px phosphor borders, **amber corner ticks**
2. Block cursor on focus / active lane
3. Terminal syntax chrome — `[01]` / `>` lane prefixes
4. CRT stack — scanlines 0.12–0.18, vignette, bloom; honor reduced-motion
5. Optional ultra-faint Matrix rain behind stage ≤8% opacity (off if reduced-motion)
6. Selected panel may get 1px `--holo` hairline — no cyan fills
7. DENY may flash `--cyber` once — not a theme fill

## Loved references

| Source | Steal |
|--------|--------|
| katagami Phosphor / Command Grid | Green primary, amber ticks, block cursor |
| Pipboy.Avalonia | Default **green** Pip-Boy |
| ghostty-starship-wasteland | Fallout green phosphor + CRT bloom |
| afterglow-crt | Prefer `crt-green` over `crt-amber` |
| SCIFICN/UI SCI-FI theme | Hard-edge HUD, green primary |
| Own NEXUS_FALLOUT_OS | Keep CRT craft; invert green/amber roles |

## Hard bans

- No full-screen rain competing with text
- No cyan/magenta wallpaper or fills
- No Orbitron / glitch-soup / rainbow
- No hero photos
- Hierarchy from brightness + inverse, not rainbow

## Free APIs (Coder)

No paid X. HF public `daily_papers` only; X only if free bearer happens to exist.

## Rollout

1. @UX Gürok — rewrite tokens to phosphor primary; amber ticks on green panels
2. @Coder Gürok — `data-theme="phosphor"`; remap lead pin to inverse/black-on-phosphor (everything is green now)
3. @Reviewer Gürok — fail if amber becomes wallpaper or cyan fills panels

## Done when

Desk reads as a **green CRT ops console with scarce amber/cyan sparks**, not yellow Geocities and not a Matrix screensaver.
