# Changelog

All notable changes to NEXUS SAGE desk are documented in this file.

## [0.1.0] — 2026-09-05

### First deployment cut

- Skin V2 phosphor primary chrome and V4 Brief pins layout
- Free-ingest pipeline: HF / arXiv / OpenAlex / Crossref / HN / RSS / GitHub / Wikidata DENY
- Digest cadence via `digest:tick` (~6h)
- Dual-home pack export/import (`desk/packs` + root `packs/`)
- `visual:check` live phosphor/lane guard
- `CURRENT.json` hard gate (`check:current` on predev/prebuild/prestart)
- Locks: cycle `003`, lead `hf-incident`; no cycle `004`
- Non-goals parked: paid X, HF HTML fallback, S2, Voice/Digest parity

### Meta

- Desk package version set to **0.1.0** for first professional git ship
- Root `.gitignore`, `RELEASE-0.1.0.md`, annotated tag `v0.1.0`
