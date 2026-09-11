# P2 home 2b drill-log — operator off-box

**UTC refreshed:** 2026-09-11T13:09Z  
**Pack id:** `sage-pack-003-20260911T130832Z`  
**Cycle / lead:** `003` / `hf-incident`  

## Homes

| Home | Path | Status |
|------|------|--------|
| 1 · VM primary | `/workspace/nexus-sage/packs/sage-pack-003-20260911T130832Z.tar.gz` | OK |
| 2a · desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260911T130832Z.tar.gz` | OK |
| 2b · operator PC | `C:\Users\speci.000\Downloads\nexus-sage-packs\sage-pack-003-20260911T130832Z.tar.gz` | PENDING (no re-ask) |

## Checksums (VM)

```
sha256  cafe4821fbbbb80bfeed27974a510017a26dc628d239c4071dd6ebe8734de54c
```

## Notes
- Post-P5 P2 fail-closed + freeze wipe-drill (Pulse 13:02Z) — re-drill on later dual-home after F1–F5 proofs
- Dual-home pack `sage-pack-003-20260911T130832Z` identical both homes (7665 B)
- Wipe→import OK · rollback `rollback-20260911T130842Z` · `check:current` OK · bun **205** pass / 0 fail
- `visual:check` OK · crawl `2026-09-11T09:29:29Z` · freeze-safe (no re-ingest)
- Prior drill pack `sage-pack-003-20260911T130710Z` also dual-homed (sha256 `95d28436…973712`)
- F1–F5 fail-closed evidenced in `refs/P2-ACCEPT-EVIDENCE.md`
- Freeze ON · cycle 003 / hf-incident · no digest 004 · P6 HOLD · no new free-pulse WIRE · no paid X
- Manifest sha256 `98954fae7a6091e10368d7763e2762c71e7a117f0d7031a06f43cc9c76867667`
- Cron-less: drill does not require host crontab
- Reviewer stamp pending (Coder factual only)
