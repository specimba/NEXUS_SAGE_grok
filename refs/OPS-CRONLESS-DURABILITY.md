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
- [x] A2 continues to WROTE on DUE via pulse or Bot routine
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

## Pulse stamp — 2026-09-11T12:29:52Z (Director Pulse · OPS-CRONLESS)

**Dry `bun run a2:tick` (DESK):**

```
[2026-09-11T12:29:52.426Z] A2 start — Istanbul Fri 15:29 · weekday=true · hour9-16=true
[2026-09-11T12:29:52.476Z]   | digest:tick HOLD — next_at=2026-09-11T15:20:40.008Z (within CADENCE_MS)
[2026-09-11T12:29:52.478Z] A2 HOLD — no pack:export
```

**HOLD reason:** `next_at≈2026-09-11T15:20:40Z` still within `CADENCE_MS` (no export).

**Fri → Mon catch-up:** When that `next_at` arrives (~18:20 Istanbul Fri), it is **outside** the A2 Istanbul weekday hour window (`9–16` Mon–Fri). Standing A2 will not WROTE Fri evening; **Mon morning catch-up** (pulse or Bot routine at next in-window tick) covers DUE. Bot routines continue to cover A1/A2 while host `crontab` is missing.

P5 Google News land remains **HOLD** — do not implement this pulse.


## Fri A2 path — Architect stamp 2026-09-11 ~14:51Z

**Decision: GO one cronless proof tonight** (not Mon-only HOLD).

| When | Action |
|------|--------|
| After digest `next_at` `15:20:40Z` | Coder: `A2_FORCE_WINDOW=1 bun run a2:tick` **or** `digest:tick` then dual-home `pack:export` |
| Why FORCE_WINDOW | Fri 18:20 Istanbul is outside standing 09–16 window — one explicit proof, not overnight firehose |
| After WROTE | Dual-home both packs · Reviewer FAIL 1–8 · Scout freeze ages disk-only |
| Mis-timed Bot routine | Delete/retarget `22 15` (fires before due) — Coder |

**HOLD:** P6 · new free-pulse WIRE · Voice/Digest · cycle `004`

**Mon catch-up:** still valid for normal cadence; tonight’s FORCE is a **one-shot proof** only.

## Pulse stamp — 2026-09-11T15:27:45Z (Director Pulse · A2 FORCE proof)

**`A2_FORCE_WINDOW=1 bun run a2:tick` (DESK · Istanbul Fri 18:27 outside 09–16):**

```
A2 start — A2_FORCE_WINDOW=1
digest:tick WROTE pack_id=2026-09-11T15 · cycle=003 lead=hf-incident
last_at=2026-09-11T15:27:45.877Z · next_at=2026-09-11T21:27:45.877Z
A2 WROTE — pack:export dual-home sage-pack-003-20260911T152745Z.tar.gz
sha256 both homes ab73aab0ebe55a3ae48fd136b6070a10e562178c3dbd924d8369846c0293165d (bytes match)
manifest sha256=9004ca2e6b2c76defee28c6eb9a5a4e18e7e0bafb14dbc0e2d13a0f20c74a126
```

**Gates this pulse:** `check:current` OK · bun test 205 pass · brand-check 0 · visual:check OK (phosphor + lanes + crawl `2026-09-11T09:29:29Z` ~5.97h FRESH + build `XPqMYoP9Pb7bYjoxsvSWX`).

**Next:** Reviewer FAIL 1–8 on `sage-pack-003-20260911T152745Z` · Scout freeze ages disk-only · HOLD P6 / new WIRE / Voice-Digest / `004`. next_at `21:27:45Z` ≈00:27 Istanbul Sat → weekend quiet; Mon catch-up for standing window.


### Reviewer stamp — 2026-09-11T15:29Z (Reviewer Gürok)

**Fri A2 FORCE proof PASS** — pack `152745Z` · FAIL 1–8 green. See `PACK-DUAL-HOME.md`.

## Mon catch-up — Architect note 2026-09-11 ~16:49Z

Standing cadence while host `crontab` missing (Bot / pulse covers):

| Job | Mon Istanbul window | Trigger |
|-----|---------------------|--------|
| **A1** | 10:00 / 13:00 / 16:00 (or when crawl age ≥12h) | Bot A1 routine · natural STALE |
| **A2** | 09–16 `*/30` + `0 9` catch-up | in-window DUE · Fri FORCE was one-shot only |

Sat quiet (`next_at` overnight) → **Mon catch-up** picks digest DUE at window open. No overnight firehose. **HOLD:** P6 · new WIRE · Voice/Digest · cycle `004`.
