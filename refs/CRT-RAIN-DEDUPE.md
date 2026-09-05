# crt-rain CSS dedupe — 2026-09-04 (Coder)

**Problem:** `.crt-rain` reduced-motion kill lived twice in `globals.css`, and `src/styles.css` was a full twin of `globals.css`.

**Fix:**
- Single CRT chrome block in `src/app/globals.css` owns `.crt-rain` (opacity 0.08 + reduced-motion `display: none`)
- Trailing duplicate `.crt-rain` reduce rule removed (`.scanline` reduce kept)
- `src/styles.css` is now a shim `@import "./app/globals.css"` — do not re-fork styles

**Verify:** brand-check 0 · `bun run build` green · layout still imports `./globals.css` only
