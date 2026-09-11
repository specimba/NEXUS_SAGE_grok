# P2 home 2b drill-log — operator off-box

**UTC refreshed:** 2026-09-11T13:08:09Z  
**Pack id:** `sage-pack-003-20260911T130710Z`  
**Cycle / lead:** `003` / `hf-incident`  

## Homes

| Home | Path | Status |
|------|------|--------|
| 1 · VM primary | `/workspace/nexus-sage/packs/sage-pack-003-20260911T130710Z.tar.gz` | OK |
| 2a · desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260911T130710Z.tar.gz` | OK |
| 2b · operator PC | `C:\\Users\\speci.000\\Downloads\\nexus-sage-packs\\sage-pack-003-20260911T130710Z.tar.gz` | PENDING (no re-ask) |

## Checksums (VM)

```
sha256  95d28436ba53ae32e3b5687315637ecdd2d90cd4c35f6eebdec602e14b973712
```

## Notes
- Post-P5 P2 wipe-drill (OPS-P2-FAILCLOSED-WIPE · Director Pulse 13:02Z)
- Dual-home pack `sage-pack-003-20260911T130710Z` identical both homes
- Freeze-safe: wiped sage/snapshots/src/data → import OK → reattached disk-only caches
- Locks: cycle 003 / hf-incident · free only · no 004 · no paid X/Bluesky · P6 HOLD · no new free-pulse WIRE
- Manifest sha256 `bbd4f16a66964f24638e21604665d4f52a165ab4101499728d2c7ba8e7cf9dee`
- Rollback: `rollback-20260911T130809Z`
- `check:current` OK · `bun test` 205 pass / 0 fail · `visual:check` OK
- F1–F5 fail-closed proven (see refs/P2-ACCEPT-EVIDENCE.md)
- Cron-less: drill does not require host crontab
- Reviewer stamp pending (Coder factual only)
