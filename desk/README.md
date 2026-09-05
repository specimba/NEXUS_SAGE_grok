# SAGE desk — operator README

NEXUS SAGE desk is the Director pulse console for cycle briefs: Brief · Pulse · Digest · Papers · Voice · Governance. It is a Next.js + Bun app under `/workspace/nexus-sage/desk`.

## Locks (do not invent around these)

| Lock | Value |
|------|--------|
| Cycle | **`003`** only — never invent `004` |
| Brief lead | **`hf-incident`** |
| Sol ≠ Astra | DENY flatten — Astra is companion, not the HF attacker |
| Brief pins | Never from new feeds (HF/arXiv/HN/lab RSS/security RSS stay off lead/companion pins) |
| Providers | **Free only** — no paid X / `api.x.com` / bearer tokens |

Contracts and wire specs live in **`/workspace/nexus-sage/refs/`** (FREE-PROVIDERS, WIRE-*, SKIN-V2-PHOSPHOR, P2-EXPORT-IMPORT, etc.).

## Skin V2 — phosphor

**Operator note:** If UI looks like 90s gray pills / amber frontpage → stale `:3000` server; kill it, `bun run build && bun run start`. Footer health chip shows `.next/BUILD_ID` + server boot ISO (`data-sage-build`) so a stale process is obvious.

Boot theme is **green phosphor primary** (`data-theme="phosphor"`). Primary chrome uses `--phosphor` / `--phosphor-bright`; amber is a scarce ops accent; cyan/magenta are tiny cyber sparks (edges, not fills). Do **not** introduce new hex tokens in components — use existing CSS variables / Tailwind token classes. See `refs/SKIN-V2-PHOSPHOR.md`.

## Commands

```bash
bun run check:current   # cycle / CURRENT.json gate (also predev/prebuild/prestart)
bun run dev             # Next turbopack on 0.0.0.0:3000
bun run ingest          # free providers → papers / pulse / shelf / stamp
bun run digest:tick     # 6h Digest organism refresh → artifacts/sage/packs/
bun test                # src/lib/__tests__
bun run build           # production build
bun run pack:export     # snapshot pack under desk/packs + ../packs
bun run pack:import -- <pack.tar.gz>
bun run brand-check     # P4 brand / OG gate
bun run visual:check    # live :3000 phosphor + lane chrome guard
```

## Free providers (ingest)

| Source | Role |
|--------|------|
| Hugging Face `daily_papers` | Papers lane (gen/sim displacement) |
| arXiv Atom | Enrich abstracts/links; search → shelf |
| HN Algolia | Pulse chatter only |
| Lab blog RSS | OpenAI / DeepMind / Google AI / HF → Pulse + shelf |
| Security lab RSS | Trail of Bits + Project Zero (`projectzero.google/feed.xml`) → Pulse + shelf + Digest refs (**never Brief**). NCC/Fox-IT out. |
| GitHub unauth search | `search/repositories` → toolkit **shelf only** via `classifyUrl` (**never Brief / never Pulse lead**). ≤1 search/ingest · 24h cache · soft-fail 403/429. Zero credentials. |
| Toolkit URL list | Shelf scoring via `classifyUrl` |

**No paid X.** Watchlist queries are curation plan only.

## Digest cadence

Disk truth: `artifacts/sage/digest-last.json` (not browser `localStorage`).  
When due (~every 6h), `bun run digest:tick` rebuilds Digest from free-ingest snapshots into `artifacts/sage/packs/YYYY-MM-DDTHH.{json,md}` and refreshes `digest-003.json/md`. Second run within the window logs **HOLD** and exits 0.

Example cron:

```cron
0 */6 * * * cd /workspace/nexus-sage/desk && bun run digest:tick
```

Force rebuild: `bun run digest:tick -- --force`

## Pack wipe drill

Acceptance wipe/restore is documented in [`packs/WIPE-DRILL.md`](packs/WIPE-DRILL.md). Export → wipe artifacts/data → import → expect cycle `003` / lead `hf-incident`.

## Layout quick map

- `src/components/sage/desk.tsx` — lanes UI
- `src/data/cycle.ts` — pins + exec (locked)
- `src/lib/rss-labs.ts` / `rss-security.ts` / `hn-pulse.ts` / `arxiv-enrich.ts` — free ingest
- `artifacts/sage/CURRENT.json` — cycle stamp
- `scripts/ingest.ts` — `bun run ingest`
