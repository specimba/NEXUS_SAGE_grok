# OPS A1–A3 — automation (NON-HTTP · APPROVED)

**Architect approve:** YES · **Director order:** (1) A1–A3 → (2) Scout X-free → (3) free pulse deepen  
**Canberk eye:** Brief SHIP-FOR-NOW · Voice/Digest PARKED · paid X DENY  
**Owners:** Coder land · Reviewer gate (FAIL list 1–8) · Scout freeze-note ages  
**WIRE HOLD:** no new `WIRE-*` until Canberk ranks 1–4 + Architect APPROVED wire pick  
**Timezone for cron windows:** Europe/Istanbul (weekday daytime ~09:00–17:00)

## Scout lock-in

`SCOUT-X-FREE-DURABILITY.md`: Skip-X default · mirrors HOLD · paid bearer DENY · Bluesky later only (never Brief lead)

## A1 — STALE auto-ingest

**Land after Reviewer PASS on dry-run.** Standing cron: weekday daytime only · age ≥ ~12h → ingest + dual-home pack · rebuild `:3000` if footer lags · soft-fails stamped.

| Acceptance | Pass |
|------------|------|
| Live footer = disk `CRAWL_AT` | after any ingest that advanced crawl |
| Brief pins / `003` / `hf-incident` | unchanged |
| Dual-home sha | identical · `PACK-DUAL-HOME` updated |
| Soft-fails | visible in ingest-last / freeze note |
| Window | no overnight `@every` |

Evidence dry-run: `refs/A1-DRY-RUN.md` (FORCE · crawl → `01:29:12Z` · pack `012948Z`) — **Reviewer PASS 2026-09-07T01:33Z** · standing cron landed (Istanbul weekday).

## A2 — Digest DUE auto-export (acceptance locked)

**Land after A1 standing cron is in.**

| Acceptance | Pass |
|------------|------|
| Trigger | fires within ±2m of HOLD `next_at` without human pulse |
| Effect | `digest:tick` WROTE → `pack:export` dual-home → drill-log + PACK-DUAL-HOME updated |
| Rearm | next `next_at` armed automatically |
| Remote | selective push to `specimba/NEXUS_SAGE_grok` after WROTE (no `.env`, no `git add -A`) |
| Locks | `003` / `hf-incident` / no `004` / Brief untouched |
| FAIL if | single-home pack · sha mismatch · tick skipped silently · overnight spam |

Done-when proof: one unattended DUE→WROTE→dual-home cycle + Reviewer PACK stamp.

## A3 — Cron harden (acceptance locked)

**Land with / right after A2.**

| Acceptance | Pass |
|------------|------|
| Install | `desk/scripts/install-cron.sh` installs from `desk/ops/crontab.example` on this VM |
| Entries | A1 weekday STALE watch · A2 digest DUE · documented only — nothing else |
| Logs | `desk/logs/` (or `logs/`) with rotate-friendly names |
| Docs | `OPERATOR.md` lists install, windows, FORCE dry-run, how to pause |
| Wipe-safe | scripts + crontab.example on remote `main` |
| FAIL if | undocumented cron · overnight firehose · craft/WIRE bundled |

## Hard bans (Reviewer FAIL list = Architect lock)

1 stamp-truth lag · 2 Brief pollution · 3 paid X · 4 lock break · 5 dual-home miss · 6 silent soft-fail · 7 overnight spam · 8 craft/WIRE creep

## Done when

- [x] A1 dry-run Reviewer PASS → weekday standing cron installed
- [ ] A2 unattended DUE→WROTE→dual-home + Reviewer PACK PASS *(cron installed; await unattended cycle)*
- [x] A3 install script + OPERATOR.md *(remote push separate)*
- [ ] Canberk ranks 1–4 before any Bluesky/`WIRE-*`

## Not approved yet

Bluesky `searchPosts` · HN/HF deepen beyond existing · Voice/Digest parity · any X-shaped path
