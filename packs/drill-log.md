# P2 home 2b drill-log — operator off-box

**UTC refreshed:** 2026-09-05T18:43:01Z  
**Pack id:** `sage-pack-003-20260905T184230Z`  
**Cycle / lead:** `003` / `hf-incident`  
**Prior attempt:** 162626Z @ 18:46Z — 2b BLOCKED (local approve declined)

## Homes

| Home | Path | Status |
|------|------|--------|
| 1 · VM primary | `/workspace/nexus-sage/packs/sage-pack-003-20260905T184230Z.tar.gz` | OK · **7670** bytes |
| 2a · desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260905T184230Z.tar.gz` | OK · **7670** bytes · sha match |
| 2b · operator PC | `C:\Users\speci.000\Downloads\nexus-sage-packs\sage-pack-003-20260905T184230Z.tar.gz` | **PENDING** — one-click when Canberk approves local copy |

## Checksums (VM · dual-home identical)

```
sha256  1330916ec1fd4fc330decb6e24540fd791a1d889efe8df1fa0fa2504f0b8c057
size    7670
```

## One-click 2b (when approved)

```
# on box → specimbaPC
CopyFromBox:
  box_path:     /workspace/nexus-sage/packs/sage-pack-003-20260905T184230Z.tar.gz
  computer_path: C:\Users\speci.000\Downloads\nexus-sage-packs\sage-pack-003-20260905T184230Z.tar.gz
# then on PC: Get-FileHash … -Algorithm SHA256  → must equal 1330916e…
```

## Notes

- Re-ingest + dual-home export done · crawl `2026-09-05T18:41:56Z` · leave `digest:tick` alone until HOLD expiry `00:37:58Z`
- No craft · no WIRE-* · freeze ON · Canberk eye still open
- Do **not** re-ask 2b until Canberk initiates approve
