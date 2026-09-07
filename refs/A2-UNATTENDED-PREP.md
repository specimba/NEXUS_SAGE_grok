# A2 first-unattended prep — 2026-09-07

**Owner:** Coder · **Gate:** Reviewer FAIL 1–8 · **Window:** Europe/Istanbul Mon–Fri 09–16 (+ `0 9` catch-up)

## Confirmed ready
- crontab standing (A1/A2/`0 9`) · `cron` daemon up
- `bun run a2:tick` → in-process **Istanbul window guard** (SKIP outside 09–16 unless `A2_FORCE_WINDOW=1`)
- On WROTE: `pack:export` dual-home + factual `PACK-DUAL-HOME.md` + `packs/drill-log.md` (+ desk mirror)
- Digest HOLD `pack_id=2026-09-07T00` → `next_at=2026-09-07T06:58:41Z` (**09:58 Istanbul**). `0 9` catch-up will **no-op** (still HOLD). First A2 WROTE ≈**09:58–10:00 Istanbul** via `*/6` after `next_at`.
- No FORCE overnight · no WIRE · Bluesky/X DENY

## Soft finding (fixed in-script)
Pre-guard logs showed `a2:tick` HOLD runs at ~02:45Z / 03:08Z (Istanbul ~05:45 / 06:08) — `CRON_TZ` may not bind on this host. **Window guard now SKIP** those; cron lines kept as defense-in-depth. Reviewer: FAIL only if DUE sits unpaid past window open after 09:00.

## Selective remote-push checklist (after first WROTE)
```bash
cd /workspace/nexus-sage
# never: git add -A · never .env
git add \
  desk/artifacts/sage/ \
  desk/src/data/digest-cadence.ts \
  desk/src/data/digest-pack.ts \
  desk/scripts/a2-digest-export.mjs \
  packs/drill-log.md \
  desk/packs/drill-log.md \
  refs/PACK-DUAL-HOME.md \
  refs/A2-UNATTENDED-PREP.md \
  refs/SCOUT-HTTP-FREEZE-NOTE.md
git status -sb   # eyeball — no secrets
git commit -m "chore(sage): A2 unattended WROTE + dual-home [skip ci]"
git push origin main
```

## Reviewer stamp pack (after WROTE)
1. live footer crawl unchanged OK (A2 does not ingest)  
2. Brief pins / `003` / `hf-incident` unchanged  
3. dual-home sha identical  
4. PACK header pending → Reviewer PASS  
5. `logs/a2-digest.log` shows WROTE→pack:export→OK  

### Reviewer pre-lock — 2026-09-07T03:14Z (Reviewer Gürok)

**A2 unattended checklist PRE-LOCKED** vs FAIL 1–8. Armed for PACK stamp after first WROTE (≈09:58–10:00 Istanbul via `*/6`; `0 9` catch-up is not the proof).

| # | FAIL gate | A2 unattended PASS iff |
|---|-----------|-------------------------|
| 1 | Stamp-truth lag | A2 does **not** ingest — live crawl may stay `01:29:12Z`; FAIL only if PACK/footer invents a false new crawl or digests without WROTE |
| 2 | Brief pollution | Brief pins / lead `hf-incident` / cycle `003` unchanged; digest body never becomes Brief lead |
| 3 | Paid X sneak | No X/Bearer path in `a2:tick` · Bluesky DENY |
| 4 | Lock break | `sol_ne_astra` · no `004` · Astra-as-HF deny intact on pack import |
| 5 | Dual-home miss | New `sage-pack-003-*` both homes · sha256 identical · PACK + drill-log headers updated |
| 6 | Soft-fail wash | Log shows honest HOLD/WROTE/SKIP; no silent empty pack |
| 7 | Overnight spam | `logs/a2-digest.log` after window guard: SKIP outside Mon–Fri 09–16 (unless catch-up `0 9`); FAIL if DUE unpaid past ≈**10:00 Istanbul** (first `*/6` after `next_at`; 09:00 catch-up alone is not proof) |
| 8 | Craft/WIRE creep | No Voice/Digest land · no new `WIRE-*` bundled with tick |

**Stamp pack when WROTE lands:** bun brand/`visual:check` green · dual-home sha · PACK header PASS · a2 log WROTE→export→OK · Brief locks hold.

### Reviewer stamp — 2026-09-07T07:00Z (Reviewer Gürok)

**A2 first unattended WROTE PASS** — pack `065851Z` · Istanbul 09:58 · FAIL 1–8 green. See `PACK-DUAL-HOME.md`.
