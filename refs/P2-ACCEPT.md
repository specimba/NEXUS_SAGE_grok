# P2 ACCEPT — done-whens (one page)

**Gate:** Reviewer · **Scripts:** `pack:export` / `pack:import` · **Drill:** `packs/WIPE-DRILL.md` · **Law:** `P2-CONTRACT.md`

## Done when (all must be true)

### Fail-closed

- [ ] `bun run pack:export` with CURRENT missing → exit ≠ 0
- [ ] Import with tampered file hash → exit ≠ 0, desk unchanged (or rolled back)
- [ ] Import inventing cycle `004` / wrong lead → exit ≠ 0
- [ ] Import lock violation (Sol=Astra flatten in pack locks) → exit ≠ 0
- [ ] No secrets / `.env` / bearer tokens inside any `sage-pack-*.tar.gz`

### Wipe drill (formal)

From `desk/`, using latest dual-home pack:

1. `bun run pack:export` → pack in `/workspace/nexus-sage/packs/` **and** `desk/packs/`
2. Delete `artifacts/sage`, `artifacts/snapshots`, and `src/data/{cycle,digest-pack,x-crawl}.ts`
3. `bun run check:current` → **FAIL**
4. `bun run pack:import -- <pack>` → OK
5. `check:current` OK · Brief cycle **`003`** · lead **`hf-incident`**
6. `bun test src/lib/__tests__` green

### Dual home

- [ ] Same pack bytes (or verified twin) under VM `packs/` + desk mirror
- [ ] Operator path documented (Downloads / Drive) in `P2-EXPORT-IMPORT.md` — not sandbox-only theater

### Manifest

- [ ] Required paths present (CURRENT, digest json/md, snapshots, `src/data/*`)
- [ ] `manifest.files[].sha256` covers every required path
- [ ] `cycle` / `lead_id` match CURRENT + Brief

## Not done-whens (out of P2)

- Live paid APIs · cycle `004` · Litestream cloud · replacing git tags

## Sign-off

Reviewer stamps **P2 PASS** only when every checkbox above is evidenced in-room (command output or pack path + drill log).
