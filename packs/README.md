# SAGE packs — wipe-resilience (P2)

Authoritative contract: `refs/P2-CONTRACT.md`.

## Dual homes (export writes both)

| Home | Path |
|------|------|
| Primary | `/workspace/nexus-sage/packs/` |
| Secondary (desk mirror) | `desk/packs/` — or `$SAGE_PACK_HOME` (operator Downloads / Drive) |

## Commands (from `desk/`)

```bash
bun run pack:export
bun run pack:import -- /workspace/nexus-sage/packs/sage-pack-003-<UTC>.tar.gz
```

- Export **FAIL** if `artifacts/sage/CURRENT.json` missing, lock violation, partial archive, or either home write fails.
- Import **FAIL closed** on bad schema / hash / lock; post-restore smoke fail restores `packs/rollback-<ts>/`.

## Locks

Cycle `003` · lead `hf-incident` · Sol≠Astra · no cycle `004` without `locks.new_primary`.

## Wipe drill

See `WIPE-DRILL.md`.
