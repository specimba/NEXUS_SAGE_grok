# P2 ACCEPT evidence — 2026-09-04T05:09Z (Coder Gürok)

Pack: `/workspace/nexus-sage/packs/sage-pack-003-20260904T050903Z.tar.gz`  
Mirror: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260904T050903Z.tar.gz`

## Fail-closed
- [x] export CURRENT missing → exit 1
- [x] import tampered hash → exit 1 (`hash mismatch: artifacts/sage/CURRENT.json`)
- [x] import invent cycle 004 → exit 1 (required digest-004 paths missing / refuse)
- [x] no secrets in archive (scan: no api_key/bearer/sk-/xoxb-/PRIVATE hits)

## Wipe drill
1. [x] `pack:export` dual-home
2. [x] deleted artifacts/sage, snapshots, cycle/digest-pack/x-crawl.ts
3. [x] `check:current` FAIL after wipe
4. [x] `pack:import` OK (rollback `rollback-20260904T050915Z`)
5. [x] restored CYCLE `003` LEAD `hf-incident` · `check:current` OK
6. [x] `bun test` 42 pass / 0 fail

## Manifest
- [x] required paths present (9): CURRENT, digest-003 json/md, snapshots, src/data/*
- [x] cycle/lead match Brief locks

## Sign-off request
Reviewer: stamp formal P2 ACCEPT from this evidence.

## Sol≠Astra import-lock proof (2026-09-04T05:53Z)

- [x] Pack with `locks.sol_ne_astra=false` → import exit 1 (`locks.sol_ne_astra must be true`)
- [x] Pack DENY missing Astra-as-HF → import exit 1 (`DENY must include Astra-as-HF (Sol≠Astra)`)
- [x] `desk/packs/WIPE-DRILL.md` mirrored from `packs/WIPE-DRILL.md`

## Reviewer stamp — 2026-09-04T05:54Z (Reviewer Gürok)

**P2 PASS** against `P2-ACCEPT.md`.

Re-verified fail-closed:
- [x] CURRENT-miss export → exit 1
- [x] `sol_ne_astra=false` → import exit 1
- [x] CYCLE.trust.deny missing Astra-as-HF → import exit 1 (`DENY must include Astra-as-HF`)
- [x] prior wipe drill + dual-home pack `sage-pack-003-20260904T050903Z.tar.gz`
- [x] `desk/packs/WIPE-DRILL.md` mirrored

Note: manifest-only DENY strip is insufficient (cycle snapshot is SoT) — lock proof must mutate `snapshots/cycle.json` `CYCLE.trust.deny`; that path fails closed correctly.

Next: FREE-INGEST-CONTRACT — arXiv enrich Papers/shelf only, never Brief; keep `003`/`hf-incident`.

## OPS-HARDEN wipe-drill re-run — 2026-09-04T09:21Z (Coder)

Pack: `/workspace/nexus-sage/packs/sage-pack-003-20260904T092050Z.tar.gz`  
Mirror: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260904T092050Z.tar.gz`  
Pack id: `sage-pack-003-20260904T092050Z` · rollback: `rollback-20260904T092054Z`

### Wipe drill (this pulse)
1. [x] `pack:export` dual-home (`sage-pack-003-20260904T092050Z`)
2. [x] wiped `artifacts/sage`, `artifacts/snapshots`, `src/data/{cycle,digest-pack,x-crawl}.ts`
3. [x] `check:current` FAIL after wipe (`missing CURRENT.json`, exit 1)
4. [x] `pack:import -- ../packs/sage-pack-003-20260904T092050Z.tar.gz` OK
5. [x] restored CYCLE `003` LEAD `hf-incident` · `check:current` OK
6. [x] `bun test src/lib/__tests__` 142 pass / 0 fail

### Cron helper (OPS-HARDEN)
- [x] `desk/ops/crontab.example` — 6h digest:tick + optional ingest companion
- [x] `desk/scripts/install-cron.sh` — idempotent (`command -v bun`, creates `logs/`, no duplicate lines on re-run)
- [x] Log path: `/workspace/nexus-sage/logs/digest-tick.log`
- [x] Manual proof: `digest:tick --force` WROTE pack_id=2026-09-04T09 → second `digest:tick` HOLD (next_at=2026-09-04T15:20:42.548Z)
- [x] Locks unchanged: cycle `003` · lead `hf-incident` · free only · no `004` · no HF HTML · no paid X · no Skin token churn

## Freeze-safe wipe-drill — 2026-09-04T18:08Z (Coder · Pulse 18:07Z)

Pack: `/workspace/nexus-sage/packs/sage-pack-003-20260904T162626Z.tar.gz`  
Mirror: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260904T162626Z.tar.gz`  
Pack id: `sage-pack-003-20260904T162626Z` · rollback: `rollback-20260904T180832Z`

### Wipe drill
1. [x] wiped `artifacts/sage`, `artifacts/snapshots`, `src/data/{cycle,digest-pack,x-crawl}.ts`
2. [x] `check:current` FAIL after wipe (`missing CURRENT.json`, exit 1)
3. [x] `pack:import -- …T162626Z.tar.gz` OK
4. [x] restored CYCLE `003` LEAD `hf-incident` · `CURRENT.crawled_at=2026-09-04T16:25:56Z`
5. [x] `bun test` 161 pass / 0 fail
6. [x] reattached disk-only truth not in pack (ingest-last / digest-last / packs / provider caches) from pre-wipe backup — no re-ingest

### Locks
cycle `003` · lead `hf-incident` · free only · no `004` · freeze ON · no craft land · no WIRE-*

