# NEXUS SAGE desk — Release 0.1.0

**Date:** 2026-09-05  
**Tag:** `v0.1.0`  
**Package:** `desk/package.json` → **0.1.0** (first deployment cut; prior workspace label 0.2.0 retired for ship discipline)

## Ship summary

First professional git deployment cut of the Director pulse console (Brief · Pulse · Digest · Papers · Voice · Governance).

### Shipped

| Area | What |
|------|------|
| **Skin V2 phosphor** | Green phosphor primary chrome (`data-theme="phosphor"`); amber scarce ops accent; no new hex tokens in components |
| **V4 Brief** | Canberk Eye V4 Brief skeleton / pins layout held |
| **Free ingest** | HF `daily_papers`, arXiv Atom, OpenAlex, Crossref, HN Algolia, lab + security RSS, GitHub unauth shelf, Wikidata DENY grounding — zero credentials |
| **digest:tick** | ~6h Digest organism cadence → `artifacts/sage/packs/` + `digest-003.*`; HOLD within window |
| **Pack export/import** | Dual-home packs (`desk/packs` + `../packs`); wipe-drill docs kept |
| **visual:check** | Live `:3000` phosphor + lane chrome guard |
| **CURRENT hard gate** | `check:current` / predev / prebuild / prestart refuse bad cycle/lead |

### Locks (immutable this cut)

- Cycle **`003` only** — never invent `004`
- Brief lead **`hf-incident`**
- Sol ≠ Astra (DENY flatten)
- Free providers only

### Non-goals (explicitly out)

- Paid X / `api.x.com` / bearer tokens
- HF `/papers` HTML fallback
- Semantic Scholar (S2) live wire
- Voice/Digest parity polish (parked)
- Cycle **004**

## Verify commands

From `desk/`:

```bash
bun run check:current   # CURRENT hard gate
bun test                # src/lib/__tests__
bun run ingest          # free providers stamp
bun run digest:tick     # Digest cadence (HOLD if within window)
bun run build
bun run pack:export
bun run visual:check    # requires live :3000
```

## Ops notes

- Pack archives (`*.tar.gz`) are gitignored under `packs/` and `desk/packs/`; keep `WIPE-DRILL.md` and `drill-log.md`.
- Provider `*-cache` dirs under `artifacts/sage` are gitignored.
- See `refs/FREE-PROVIDERS.md`, `refs/FREE-INGEST-CONTRACT.md`, `desk/README.md`.
