# P2 Contract — pack export / import (locked)

**Owner:** Architect · **Implement:** Coder (`pack:export` / `pack:import`) · **Gate:** Reviewer  
**Companion:** `P2-EXPORT-IMPORT.md` (patterns) · **No new product scope.**

## CLI

| Script | Command | Fail closed when |
|--------|---------|------------------|
| Export | `bun run pack:export` | `artifacts/sage/CURRENT.json` missing / unreadable; lock violation; archive missing required paths |
| Import | `bun run pack:import -- <path-to-sage-pack-*.tar.gz>` | bad/missing arg; unpack fail; manifest hash mismatch; lock violation; post-restore CURRENT gate or smoke fail |

Exit non-zero on any fail. No partial “success.”

## Archive name

`sage-pack-<cycleId>-<UTC>.tar.gz`  
Example: `sage-pack-003-20260904T043000Z.tar.gz`

## Dual homes (export must write both)

1. Primary: `/workspace/nexus-sage/packs/`
2. Desk mirror: `desk/packs/` (or documented operator Downloads/Drive copy — second home required)

## Archive layout (required paths)

```
manifest.json
artifacts/sage/CURRENT.json
artifacts/sage/digest-<cycleId>.json
artifacts/sage/digest-<cycleId>.md
snapshots/cycle.json
snapshots/x-crawl.json
src/data/cycle.ts
src/data/digest-pack.ts
src/data/x-crawl.ts
```

Optional (allowed, not required for P2 PASS): `attachments/` allowlist, `refs/` theme lock hash notes.

**Forbidden in pack:** `node_modules/`, `.next/`, `.env*`, tokens, cookies, API keys, live `*.db`/`-wal`/`-shm`.

## `manifest.json` fields (schema 1)

```json
{
  "schema": 1,
  "pack_id": "sage-pack-<cycleId>-<UTC>",
  "created_at": "<ISO-8601 UTC>",
  "cycle": "003",
  "lead_id": "hf-incident",
  "lead_policy": "unlock",
  "app": { "name": "nexus-sage-desk", "version": "0.2.0" },
  "locks": {
    "lead_id": "hf-incident",
    "sol_ne_astra": true,
    "deny": ["string"],
    "new_primary": false,
    "no_cycle_004_without_primary": true
  },
  "files": [
    { "path": "artifacts/sage/CURRENT.json", "sha256": "<hex>" }
  ],
  "homes": {
    "primary": "/workspace/nexus-sage/packs/",
    "secondary": "<path or 'operator-prompt'>"
  }
}
```

Rules:
- `files[]` must cover **every required path** above; import verifies each sha256.
- `cycle` must equal `CURRENT.id`.
- `lead_id` must equal Brief lead pin id and stay `hf-incident` while `new_primary` is false.
- Inventing cycle `004` without `locks.new_primary: true` + documented primary → **import FAIL**.

## Import algorithm (ordered)

1. Unpack to temp.
2. Read `manifest.json` — fail if `schema !== 1` or required fields missing.
3. `verifyManifestHashes` — fail on any mismatch / missing file.
4. `validateLocks` against CURRENT + cycle snapshot (HF lead, Sol≠Astra, DENY).
5. Snapshot current desk to `packs/rollback-<ts>/`.
6. Atomic restore of required paths into desk.
7. Run `check-current` + smoke (`bun test` hydrate/hygiene/compiler subset or full `__tests__`).
8. Only then print OK. On any step fail: restore rollback, exit non-zero.

## Export algorithm (ordered)

1. `requireCurrentFile` — fail if missing.
2. Validate locks on live desk.
3. Stage required paths + build `manifest.json` with hashes.
4. `tar.gz` → verify listing contains expected paths.
5. `writeDualHome` — both homes must succeed or export FAIL.

## Locks (unchanged)

- Cycle `003` · lead `hf-incident` · Sol ≠ Astra · no cycle `004` without new primary.

## Reviewer fail checklist (P2)

- [ ] Export without CURRENT → exit ≠ 0
- [ ] Manifest missing any required path → export/import fail
- [ ] Tampered file hash → import fail
- [ ] Lock violation (wrong lead / cycle 004 invent) → import fail
- [ ] Wipe drill: delete desk data → import → Brief still `003` / HF lead
- [ ] No secrets in archive
- [ ] Pack UI (if any) uses `.sage-panel`; green = `--signal` only
