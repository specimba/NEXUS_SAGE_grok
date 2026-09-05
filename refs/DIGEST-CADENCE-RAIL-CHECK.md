# Digest cadence rail-check — 2026-09-04

## Goal
Align Digest chrome with VM-real `digest:tick` cadence (DUE/HOLD + downloads). No token churn. Pins untouched.

## Disk truth
- `artifacts/sage/digest-last.json` → `last_at` / `next_at` / `pack_id`
- Gate: `isDigestDue()` in `src/lib/digest-pack.ts`
- Packs: `artifacts/sage/packs/{pack_id}.{md,json}`

## UI
- Snapshot: `src/data/digest-cadence.ts` (`DIGEST_CADENCE`) — regenerate via `bun run digest:tick`
- Cadence panel: DUE/HOLD chip from disk gate, pack id, last/next Z, lead lock copy
- **Preview report** = browser/localStorage only (not durable)
- **Download report.md** / **Download pack twin** = UI twin; footer points at `bun run digest:tick` + pack path
- Digest never invents Brief pins

## QA
- HOLD when `now < next_at` (current snapshot HOLD until ~15:10Z)
- Pack chip shows `2026-09-04T09`
- Preview does not rewrite disk cadence chip
- No civilizations / Sol=Astra / pin invention in Digest chrome
