# P2 home 2b drill-log — operator off-box

**UTC refreshed:** 2026-09-11T13:09:00Z  
**Pack id:** `sage-pack-003-20260911T130832Z`  
**Cycle / lead:** `003` / `hf-incident`  

## Homes

| Home | Path | Status |
|------|------|--------|
| 1 · VM primary | `/workspace/nexus-sage/packs/sage-pack-003-20260911T130832Z.tar.gz` | OK |
| 2a · desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260911T130832Z.tar.gz` | OK |
| 2b · operator PC | `C:\\Users\\speci.000\\Downloads\\nexus-sage-packs\\sage-pack-003-20260911T130832Z.tar.gz` | PENDING (no re-ask) |

## Checksums (VM)

```
sha256  cafe4821fbbbb80bfeed27974a510017a26dc628d239c4071dd6ebe8734de54c
```

## Notes
- Post-P5 P2 wipe-drill (OPS-P2-FAILCLOSED-WIPE · Director Pulse 13:02Z)
- Latest dual-home `sage-pack-003-20260911T130832Z` identical both homes
- Prior twin this pulse: `sage-pack-003-20260911T130710Z` sha256 `95d28436ba53ae32e3b5687315637ecdd2d90cd4c35f6eebdec602e14b973712`
- Locks: cycle 003 / hf-incident · free only · no 004 · no paid X/Bluesky · P6 HOLD · no new free-pulse WIRE
- Manifest sha256 `98954fae7a6091e10368d7763e2762c71e7a117f0d7031a06f43cc9c76867667`
- `check:current` OK · `bun test` 205 pass / 0 fail · `visual:check` OK
- F1–F5 fail-closed proven (see refs/P2-ACCEPT-EVIDENCE.md)
- Cron-less: drill does not require host crontab
- Reviewer stamp pending (Coder factual only)
