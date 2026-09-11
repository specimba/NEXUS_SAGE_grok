# Ops durability without `crontab` (APPROVED · 2026-09-11)

**Architect approve:** YES · **Trigger:** Agent Computer missing `crontab` binary — A1/A2 standing cron not installable  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · no `004` · paid X API / Bluesky DENY  
**Owners:** Coder land · Reviewer gate · Scout ages

## Problem

Standing Istanbul weekday cron (A1 STALE ingest · A2 digest DUE) depends on `cron`/`crontab`. On this VM those binaries are **gone** → silent stall (crawl STALE ~104h, desk down).

## Replacement: pulse-driven ops (until cron returns)

| Job | Old | Cron-less path |
|-----|-----|----------------|
| **A1 STALE ingest** | `*/30 9-16 * * 1-5` | On each Director/Coder **ops pulse** (or @every ≥30m Bot routine weekday Istanbul): if crawl age ≥12h → `bun run ingest` + dual-home pack + rebuild `:3000` if footer lags |
| **A2 digest DUE** | `*/6 9-16` + `0 9` catch-up | Same pulse: if `next_at` ≤ now → `bun run a2:tick` (window guard stays in script) |
| **visual:check** | manual | After every rebuild · Reviewer FAIL if `:3000` down |

Prefer a **Grok Bot routine** (`CRON_TZ=Europe/Istanbul`, Mon–Fri 09–16, `@every 30m` or `*/30 9-16 * * 1-5`) that shells the same scripts — does **not** need host `crontab`.

## Done-when

- [x] Documented in `OPERATOR.md` § cron-less / Bot-routine fallback
- [x] One live A1 natural STALE run (age ≫12h) without FORCE after desk boots
- [ ] A2 continues to WROTE on DUE via pulse or Bot routine
- [ ] When `crontab` returns: reinstall from `desk/ops/crontab.example` · retire Bot fallback or keep dual

## Non-goals

Cycle `004` · FREE-PULSE WIRE · paid X · overnight firehose · Brief UI reopen (P1 Brief **closed** — ship-for-now stands)

## P1 Brief UI

**CLOSED.** V4+pins shipped · Canberk ship-for-now · soft stills = VM chrome. Leftover Brief polish is **not** the next slice — next = **ops harden** (this file + A4 meters + X-session dry-run #2 after login).

## VM probe — 2026-09-11T09:30Z (Coder revive pulse)

| Check | Result |
|-------|--------|
| `which crontab` | **missing** (`type: crontab: not found`) |
| `dpkg -l cron` | `un` (not installed) · **Candidate: (none)** on Debian trixie apt — cannot apt-install host cron here |
| A1 natural STALE | **PASS** · age ~104.00h ≥12h · `FORCE=0` · crawl `2026-09-07T01:29:12Z` → `2026-09-11T09:29:29Z` · pack `sage-pack-003-20260911T093002Z` · sha256 `271313533c19216016bbd9ab6d1e6ddd8e8a4e7b0350b710325eb0f50c410ba2` · live=disk after rebuild · soft-fail openalex 429 stamped |
| ImageMagick | **OK** · `sudo apt-get install -y imagemagick` → ImageMagick 7.1.1-43 · `/usr/bin/convert` |
| Playwright | **Grok Bot / Cursor plugin** — not an apt package; do not expect `apt install playwright` for visual stills |

**Implication:** A1/A2 standing schedules need **ops pulse** or **Grok Bot routine** until a host with `crontab` returns. `desk/scripts/install-cron.sh` will no-op / fail without the binary.

### Done-when progress (this pulse)

- [x] Documented crontab gap here + `OPERATOR.md` §9 cron-less
- [x] One live A1 natural STALE run (age ≫12h) without FORCE after desk boots
- [ ] A2 continues to WROTE on DUE via pulse or Bot routine
- [ ] When `crontab` returns: reinstall from `desk/ops/crontab.example`


## Live proof — 2026-09-11 ~09:30Z

Desk revived · A1 natural STALE PASS (Coder) · ImageMagick installed · `crontab` still MISSING → Bot-routine / pulse fallback remains **required**. Next: X dry-run #2 · Reviewer pack stamp · Canberk free-pulse rank or GO default.
