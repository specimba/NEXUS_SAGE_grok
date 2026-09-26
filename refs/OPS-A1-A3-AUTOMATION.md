# OPS A1–A3 — automation (NON-HTTP · APPROVED)

**Architect approve:** YES · **Director order:** (1) A1–A3 → (2) Scout X-free → (3) free pulse deepen  
**Canberk eye:** Brief SHIP-FOR-NOW · Voice/Digest PARKED · paid X DENY  
**Owners:** Coder land · Reviewer gate (FAIL list 1–8) · Scout freeze-note ages  
**WIRE HOLD:** no new `WIRE-*` until Canberk ranks 1–4 + Architect APPROVED wire pick  
**Timezone for cron windows:** Europe/Istanbul (weekday daytime ~09:00–17:00)

## Scout lock-in

`SCOUT-X-FREE-DURABILITY.md`: Skip-X default · mirrors HOLD · paid bearer DENY · **Bluesky DENY** (Canberk)

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
- [x] A2 unattended DUE→WROTE→dual-home + Reviewer PACK PASS — `065851Z` @ 2026-09-07T07:00Z (Istanbul 09:58)
- [x] A3 install script + OPERATOR.md *(remote push separate)*
- [ ] Canberk ranks 1–4 before any new social/`WIRE-*` · **Bluesky DENY**

## Not approved yet

Bluesky (DENY) · HN/HF deepen beyond existing · Voice/Digest parity · any X-shaped path


## Standing crontab — 2026-09-07 ~01:36Z (Coder)

```
CRON_TZ=Europe/Istanbul
*/30 9-16 * * 1-5  … a1-stale-ingest.mjs   # no FORCE
*/6  9-16 * * 1-5  … bun run a2:tick       # DUE→WROTE→dual-home
```

Overnight `*/6` removed. A2 first unattended WROTE gates Reviewer when HOLD fires inside window.

### Reviewer stamp — 2026-09-07T01:37Z (Reviewer Gürok)

**A1–A3 CRONTAB PASS** (standing).

Verified `crontab -l`:
```
CRON_TZ=Europe/Istanbul
*/30 9-16 * * 1-5  … a1-stale-ingest.mjs   # no FORCE
*/6  9-16 * * 1-5  … bun run a2:tick
0    9    * * 1-5  … bun run a2:tick       # window-open catch-up
```

Gates:
- [x] No overnight `*/6 * * * *` firehose
- [x] Weekday only `1-5` · daytime `9-16` Istanbul
- [x] A1 no FORCE on standing line
- [x] A2 window-open `0 9` covers HOLD `06:58Z` unpaid past open
- [x] `cron` daemon up · scripts + `a2:tick` present

**Still open:** first unattended A2 WROTE → PACK stamp (expect Mon ~09:00 catch-up or ~09:58).
**WIRE HOLD** until Canberk ranks.

## Free-pulse deepen contract
`refs/FREE-PULSE-DEEPEN.md` — APPROVE-ready done-whens · **no WIRE** until Canberk ranks · Bluesky DENY.

## A1 dry-run evidence (2026-09-11T09:30Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-07T01:29:12Z` → `2026-09-11T09:29:29Z` · pack `sage-pack-003-20260911T093002Z.tar.gz`
- Dual-home sha `271313533c19…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-22T07:24Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-21T07:22:47Z` → `2026-09-22T07:21:54Z` · pack `sage-pack-003-20260922T072337Z.tar.gz`
- Dual-home sha `5a50e2d17fda…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-23T07:11Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-22T07:21:54Z` → `2026-09-23T07:08:38Z` · pack `sage-pack-003-20260923T071045Z.tar.gz`
- Dual-home sha `8f64466fa291…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-24T21:14Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-24T07:12:29Z` → `2026-09-24T21:12:48Z` · pack `sage-pack-003-20260924T211423Z.tar.gz`
- Dual-home sha `7ad631204f65…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-24T23:17Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-24T22:13:06Z` → `2026-09-24T23:15:44Z` · pack `sage-pack-003-20260924T231725Z.tar.gz`
- Dual-home sha `27a6d7c7672a…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-25T11:18Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-24T23:15:44Z` → `2026-09-25T11:16:08Z` · pack `sage-pack-003-20260925T111817Z.tar.gz`
- Dual-home sha `fedaf96926f4…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-25T15:23Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-25T11:16:08Z` → `2026-09-25T15:22:45Z` · pack `sage-pack-003-20260925T152258Z.tar.gz`
- Dual-home sha `76e84a607c11…` · soft-fails: openalex=paused_until 2026-09-26T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-25T19:13Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-25T15:22:45Z` → `2026-09-25T19:12:50Z` · pack `sage-pack-003-20260925T191331Z.tar.gz`
- Dual-home sha `8f016b577b82…` · soft-fails: openalex=paused_until 2026-09-26T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-25T23:13Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-25T19:12:50Z` → `2026-09-25T23:12:54Z` · pack `sage-pack-003-20260925T231307Z.tar.gz`
- Dual-home sha `6898ecbe5077…` · soft-fails: openalex=paused_until 2026-09-26T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-26T03:24Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-25T23:12:54Z` → `2026-09-26T03:20:25Z` · pack `sage-pack-003-20260926T032350Z.tar.gz`
- Dual-home sha `a3750f10311b…` · soft-fails: openalex=HTTP 429
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-26T07:20Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-26T03:20:25Z` → `2026-09-26T07:20:20Z` · pack `sage-pack-003-20260926T072033Z.tar.gz`
- Dual-home sha `ff8b5ecc4fe0…` · soft-fails: openalex=paused_until 2026-09-27T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-26T11:21Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-26T07:20:20Z` → `2026-09-26T11:20:04Z` · pack `sage-pack-003-20260926T112047Z.tar.gz`
- Dual-home sha `c21d50737020…` · soft-fails: openalex=paused_until 2026-09-27T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**

## A1 dry-run evidence (2026-09-26T15:15Z)

- Script: `desk/scripts/a1-stale-ingest.mjs` · FORCE=1 path exercised
- Crawl `2026-09-26T11:20:04Z` → `2026-09-26T15:14:53Z` · pack `sage-pack-003-20260926T151506Z.tar.gz`
- Dual-home sha `30ec4c2e2d7d…` · soft-fails: openalex=paused_until 2026-09-27T00:00:00Z
- Checklist: see `refs/A1-DRY-RUN.md` · Reviewer stamp pending · **cron not installed**
