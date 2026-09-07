# State + tooling wishlist — Architect cut 2026-09-07 ~01:45Z

## Where we are (plain)

| Layer | State |
|-------|--------|
| **Brief UI** | **SHIPPED** (V4+pins). Soft stills ≈ VM resolution — not a Skin miss. |
| **Automation** | **A1–A3 STANDING** — Istanbul Mon–Fri 09–16: STALE ingest + digest DUE export + window-open catch-up. Overnight firehose dead. |
| **Next A2 proof** | First unattended WROTE ~Mon 09:00 Istanbul (HOLD that sat overnight). |
| **News / X** | Paid X **DENY**. **Bluesky DENY** (Canberk). Free-pulse = HN/HF/RSS/OpenAlex/GitHub only — WAIT rank + `WIRE-*`. |
| **Voice/Digest craft** | **PARKED** |
| **Wipe home** | Remote `specimba/NEXUS_SAGE_grok` @ `v0.1.0` / `main` |
| **Locks** | `003` · `hf-incident` · Sol≠Astra · free only · no `004` |

**Ball:** Canberk ranks free-pulse order when ready. Until then we run automation + keep desk green.

## Plugins already present (checked)

### Connected / usable
GitHub · Chrome DevTools · Context7 · Lovable · Aikido · Azure · Gmail · Google Drive · Google Calendar

### Installed but needsAuth (high value to unlock)
| Plugin | Who it helps | Why |
|--------|--------------|-----|
| **Mobbin** | UX | Real UI/UX refs for Pulse mocks / phosphor peers |
| **Notion** | All | Specs, briefs, freeze notes off-box |
| **Supabase** / **Prisma Remote** | Coder | If DB path returns |
| **Atlassian** | Director/Architect | Jira/Confluence if we want tickets |
| **Higgsfield** / **Mem0** | optional | gen / memory — only if you want |

### Broken / fix first
| Plugin | Issue |
|--------|-------|
| **Tavily** | timeout / OAuth — Scout research |
| **Slack** | failed_to_load |
| **Browser** (Browserbase) | path bug `${CURSOR_PLUGIN_ROOT}` |
| **Prisma-Local** | missing `effect` module |
| **Aws-mcp** / Awsknowledge | creds / load fail |

### Not installed — recommend
| Plugin | Who | Why |
|--------|-----|-----|
| **Playwright** (`48677659`) | UX + Reviewer | Reliable stills / visual regression beyond Chrome DevTools |
| **Magic Patterns** or **Paper** | UX | Canvas mockups for Pulse “respectful news” lane |
| **Sentry** (optional) | Coder | Desk error watch later — not blocking |

## VM packages (web-proven, install when you greenlight)

1. **ImageMagick** (`imagemagick`) — before/after presentation stills (PIL missing today)
2. **Playwright browsers** (`npx playwright install`) — if we add Playwright plugin
3. Keep what we have: bun · Chrome · code · ffmpeg · Tailscale · cloudflared

## Architect ask

1. Canberk: confirm state mental model + rank free-pulse (1–4) when ready  
2. Unlock **Mobbin** + fix **Tavily** / **Slack** first (biggest team leverage)  
3. Greenlight ImageMagick + Playwright plugin if you want sharper UX/Reviewer loops

## Coder must-haves (3) — 2026-09-07

| # | Need | Kind | Why |
|---|------|------|-----|
| 1 | **Playwright** plugin [`48677659`](grokbot://app/v1/plugin/add?id=48677659) | Install plugin | Headless stamp-truth stills for A1/A2 (footer crawl = disk) beyond Chrome DevTools; Reviewer FAIL #1 automation |
| 2 | **ImageMagick** (`imagemagick` apt) | VM package | Before/after composites for PACK/eye evidence; PIL/`convert` missing today — ffmpeg alone isn’t enough for still grids |
| 3 | **HF_TOKEN** in gitignored `.env` (secure card) | Secret | Free HF papers/models/datasets already in ingest path; unlocks richer free-pulse without paid X |

**Already enough for Coder lane:** GitHub (push works) · bun · Chrome DevTools · Context7 · ffmpeg · Tailscale/cloudflared · VS Code.

**Skip / later:** X plugin (DENY) · AWS without creds · Prisma-Local until `effect` fixed · Browserbase until path bug fixed.


## Architect ×3 must-haves

1. **Notion** auth [`404`](grokbot://app/v1/plugin/add?id=404) — durable specs / freeze notes / WIRE cuts off the wipe path
2. **Context7** (already green) + keep it — library truth for Next/Tailwind when cutting contracts
3. **ImageMagick** apt — Architect presentation stills (done/next boards) without guessing

**Veto:** Bluesky (any form) · paid X · TrendsMCP keys as “free”
