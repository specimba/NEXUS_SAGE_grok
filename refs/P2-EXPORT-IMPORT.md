# P2 — Wipe-resilience: export / import packs

**Owner:** Scout (patterns) → Coder (wire) · **Gate:** Reviewer  
**Why:** SAGE-BUILD-WIPE-2026-09-03 recreated the App Builder disk; operator dumps + `CURRENT.json` survived, the polished desk did not. Sandbox-local state is not durable.

## Hard rules

1. **Local-first, not sandbox-only.** Packs must live off the Build VM (host Downloads / Drive / git tag), not only under `/workspace`.
2. **`CURRENT.json` is the boot spine.** Import without a valid CURRENT refuses desk start (same as P0 `check-current.mjs`).
3. **Never raw-copy live SQLite / WAL.** If P2 grows a DB, use online backup / `VACUUM INTO`, then verify — no `.db` + `-wal`/`-shm` file copies.
4. **Verify before trust.** Manifest checksum + integrity check on import; fail closed on mismatch.
5. **Locks travel with the pack.** HF lead, Sol≠Astra, DENY list, cycle id — pack cannot invent cycle `004` without a new primary.

## Pack shape (proposed)

One versioned archive: `sage-pack-<cycle>-<UTC>.tar.gz` (+ optional `.json` digest twin).

| Path inside pack | Role |
|------------------|------|
| `manifest.json` | cycle, lead id, created_at, content hashes, schema version |
| `artifacts/sage/CURRENT.json` | boot gate |
| `artifacts/sage/digest-*.json` + `.md` | frozen Digest organism numbers |
| `src/data/cycle.ts` (or compiled cycle JSON) | pins / bonds / corrections |
| `src/data/x-crawl.ts` / pulse snapshot | Pulse hydrate baseline (never-zero) |
| `refs/` slice | token sheet hash + panel/theme lock notes (optional) |
| `attachments/` allowlist | operator dumps that underwrote the cycle |

**Out of pack (re-fetch or regenerate):** node_modules, `.next`, secrets, live connector tokens.

## Export (desk / CLI)

- Trigger: Digest “Download pack” + `bun run pack:export` (P2).
- Always include CURRENT + digest JSON/MD + cycle snapshot.
- Write copy to (1) `/workspace/nexus-sage/packs/` and (2) prompt operator path / Drive — **two homes**.
- After write: verify archive lists expected paths; refuse silent partial packs.

## Import (desk / CLI)

1. Unpack to temp → read `manifest.json`.
2. Fail if cycle/lead clash with locks (e.g. lead ≠ `hf-incident` while CURRENT still 003).
3. Atomic replace of `artifacts/sage/*` + data snapshots; keep previous tree on `packs/rollback-<ts>/`.
4. Re-run CURRENT gate + unit smoke (`applyHydrate` / `leadPolicy` / `classifyPost` tests) before marking desk ready.

## Steal from NEXUS family (patterns only)

| Source | Borrow |
|--------|--------|
| `NEXUS-Visual-Weaver` | Governed **evidence packet** idea — versioned export with witness/manifest, not Gradio UI |
| `nexus-evidence-fleet` / `NEXUS_SAGE` (Python) | Sense → propose → witness confidence for Digest refs — **not** as the React desk |
| Handoff `04-RESCUE-AND-VM.md` | Off-box first (R0), pack travels with attachments table |
| Incident `01-INCIDENT-STRUCTURAL.md` | Disk recreate = hard wipe; git tag + pack are the antidote |

## Steal from industry (local-first)

- Prefer **self-contained** snapshots (VACUUM/online backup) over live file copy.
- **Restore drills:** periodic unpack-to-temp + integrity check (Borela/Litestream lesson) — backup that never restores is theater.
- Store packs **outside** the wipe domain (not only inside App Builder `/workspace`).

## P2 acceptance (Reviewer)

- [ ] Export produces manifest + CURRENT + digest + cycle; missing CURRENT → export fail
- [ ] Import refuses bad hash / lock violation
- [ ] After simulated wipe of `/workspace/nexus-sage/desk` data dirs, import restores Brief cycle + HF lead
- [ ] Pack documented path on host or Drive, not sandbox-only
- [ ] No secrets in archive; no green-as-chrome regressions from pack UI

## Non-goals (P2)

- Full Litestream cloud streaming (later)
- Replacing git; packs complement `v0.2.0-rescued`-style tags
- Pulling Python `NEXUS_SAGE` in as the app


## Two homes (concrete paths)

Export **must** succeed on both homes or FAIL (`writeDualHome` — see `P2-CONTRACT.md`).

| Home | Path | Notes |
|------|------|-------|
| **1 — VM primary** | `/workspace/nexus-sage/packs/` | Always written. Name: `sage-pack-<cycle>-<UTC>.tar.gz` |
| **2a — Desk mirror** | `/workspace/nexus-sage/desk/packs/` | Same filename; survives desk-relative tooling |
| **2b — Host Downloads** | `C:\Users\speci.000\Downloads\nexus-sage-packs\` | Operator off-wipe home (Windows). Create dir if missing. |
| **2c — Drive (optional alt)** | Google Drive folder `NEXUS_SAGE/packs/` | Use when host copy is unavailable; same filename + `manifest.json` sidecar note |

**P2 minimum:** home **1** + (**2a** or **2b**). Prefer **1 + 2a + 2b** when local execution is up. Drive (**2c**) counts as the second home if Downloads is blocked.

`manifest.homes.primary` = home 1. `manifest.homes.secondary` = absolute path used for 2a/2b/2c (not the string `operator-prompt` once written).

Sandbox-only packs (home 1 alone) = **FAIL** Reviewer gate.

## Restore-drill checklist

Run after every green `pack:export`, and at least once per session before calling P2 done. Log results in `/workspace/nexus-sage/packs/drill-log.md`.

1. [ ] Confirm dual homes: pack exists at home 1 **and** secondary (2a/2b/2c); sizes match.
2. [ ] `sha256sum` pack file; record in drill-log.
3. [ ] **Negative — missing CURRENT:** move `artifacts/sage/CURRENT.json` aside → `bun run pack:export` → expect exit ≠ 0 → restore CURRENT.
4. [ ] **Negative — tamper:** copy pack, flip one byte in staged `digest-*.json` / re-tar OR mutate a `files[].sha256` → `bun run pack:import -- <bad>` → expect fail-closed, desk unchanged.
5. [ ] **Negative — lock:** craft/import attempt with `lead_id` ≠ `hf-incident` or cycle `004` while `new_primary: false` → expect fail.
6. [ ] **Wipe drill:** snapshot desk → delete `desk` data dirs covered by required pack paths (keep `node_modules` / tooling) → `bun run pack:import -- <good pack from secondary home>` → expect OK.
7. [ ] **Acceptance after restore:** `check-current` pass; Brief shows cycle `003` + lead `hf-incident`; Sol≠Astra still holds; `bun test src/lib/__tests__` green (or hydrate/hygiene/compiler subset).
8. [ ] **Rollback path:** confirm `packs/rollback-<ts>/` was written before restore (or N/A if first empty wipe).
9. [ ] **No secrets:** `tar -tzf` listing has no `.env`, tokens, `*.db`/`-wal`/`-shm`.
10. [ ] Mark drill **PASS** in drill-log with UTC + pack_id; else **FAIL** with step number — do not claim P2 done.

