# OPS — P2 fail-closed + freeze wipe-drill (post-P5 · APPROVED)

**Architect approve:** YES · **Director Pulse 13:02Z**  
**Law:** `P2-ACCEPT.md` · `P2-CONTRACT.md` · dual-home `PACK-DUAL-HOME.md`  
**Owners:** Coder land + evidence · Reviewer FAIL 1–8 gate · Scout freeze ages after restore  
**Locks:** `003` · `hf-incident` · Sol≠Astra · free only · no `004` · paid X/Bluesky DENY  
**Out of scope:** P6 Lobsters/dev.to · new free-pulse WIRE · Voice/Digest · overnight FORCE

## Why now

FREE-PULSE P1→P5 closed. Wipe-resilience must be re-proven on a **fresh** dual-home pack (post taste/A4/P5), not only Sep-era drills.

## A — Fail-closed proofs (must)

| # | Case | Pass |
|---|------|------|
| F1 | Export with `CURRENT.json` missing | exit ≠ 0 |
| F2 | Import with tampered file hash | exit ≠ 0 · desk unchanged / rolled back |
| F3 | Import inventing cycle `004` / wrong lead | exit ≠ 0 |
| F4 | Import Sol=Astra / lock flatten | exit ≠ 0 |
| F5 | Pack contains secrets / `.env` / bearer | FAIL — scrub / ban |

Evidence: command transcripts in `refs/P2-ACCEPT-EVIDENCE.md` (append dated section).

## B — Freeze-safe wipe-drill (must)

Use **latest** dual-home export after hygiene commit (or export fresh first):

1. `bun run pack:export` → bytes identical under `/workspace/nexus-sage/packs/` **and** `desk/packs/`  
2. Delete `artifacts/sage`, `artifacts/snapshots`, and `src/data/{cycle,digest-pack,x-crawl}.ts` (per `P2-ACCEPT`)  
3. `bun run check:current` → **FAIL**  
4. `bun run pack:import -- <pack>` → OK  
5. `check:current` OK · Brief **`003`** · lead **`hf-incident`**  
6. `bun test` (lib tests) green · `visual:check` if `:3000` up  

Append drill log + sha256 both homes to `P2-ACCEPT-EVIDENCE.md` + `packs/drill-log.md`.

## C — Dual-home / operator

- [ ] sha256 match both homes  
- [ ] No secrets in archive  
- [ ] Cron-less note unchanged — drill does not require host `crontab`  

## Done-when (Reviewer)

All F1–F5 + wipe-drill steps evidenced · locks held · **P2 PASS** stamp (or re-stamp) in-room · P6 still HOLD

## Architect HOLD

No FREE-PULSE P6 · no new HTTP WIRE · no cycle `004`
