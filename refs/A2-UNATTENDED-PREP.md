# A2 first-unattended prep — 2026-09-07

**Owner:** Coder · **Gate:** Reviewer FAIL 1–8 · **Window:** Europe/Istanbul Mon–Fri 09–16 (+ `0 9` catch-up)

## Confirmed ready
- crontab standing (A1/A2/`0 9`) · `cron` daemon up
- `bun run a2:tick` → in-process **Istanbul window guard** (SKIP outside 09–16 unless `A2_FORCE_WINDOW=1`)
- On WROTE: `pack:export` dual-home + factual `PACK-DUAL-HOME.md` + `packs/drill-log.md` (+ desk mirror)
- Digest HOLD `pack_id=2026-09-07T00` → `next_at=2026-09-07T06:58:41Z` → first catch-up **Mon ~09:00 Istanbul** (`0 9` line)
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
