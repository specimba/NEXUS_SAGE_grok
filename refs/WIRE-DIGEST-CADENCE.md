# Wire-spec — Digest cadence / organism (APPROVED)

**Architect approve:** YES · **Not a new HTTP provider**  
**Implement:** Coder · **Scout:** free-ingest → DigestItem field map in refs  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **Digest never invents Brief pins** · **no cycle `004`** · no HF HTML · no paid X

## Gap

UI / `localStorage` (`PACK_KEY` / `CADENCE_MS`) is not wipe-proof and not VM-real. Need a desk-adjacent job that every ~6h refreshes the Digest organism from free-ingest outputs and writes executable packs under `artifacts/sage/packs/`.

## Cadence (VM-real)

| Mechanism | Spec |
|-----------|------|
| Primary | `bun run digest:tick` (new script) — idempotent; safe to call from cron or after `ingest` |
| Schedule | Every **6h** wall clock (`CADENCE_MS = 6 * 60 * 60 * 1000`) via host/VM cron **or** ingest-adjacent “if due” check using `artifacts/sage/digest-last.json` (not browser localStorage) |
| Due file | `artifacts/sage/digest-last.json` → `{ "last_at": ISO, "next_at": ISO, "pack_id": "..." }` |
| Rule | If `now < next_at` → exit 0 no-op (log HOLD). If due → rebuild + write packs + update digest-last |

Browser Digest UI may still mirror DUE/HOLD from `digest-last.json` (read-only), but **truth is on disk**.

## Outputs (required)

Under `desk/artifacts/sage/packs/`:

```
YYYY-MM-DDTHH.json   # machine plan (renderPlan shape)
YYYY-MM-DDTHH.md     # human report (renderReport shape)
```

Also refresh `artifacts/sage/digest-<cycleId>.json` + `.md` so `pack:export` keeps shipping Digest with CURRENT.

`kind: "drop"` / stigmergy stays **drop** (MIT stigmergy never a pin). Civilizations / banned nouns **absent** from lead + non-Dropped sections.

## DigestItem schema (locked — product spec)

```ts
type DigestItem = {
  id: string
  kind: "lead" | "companion" | "rest" | "drop"
  title: string
  take: string
  why: string
  move: string
  file: "hf-incident" | "astra" | "split" | "other"
  confidence: "high" | "medium" | "low"
  evidence: string[]
  steps: string[]
  doneWhen: string
  unlockIf: string
  refs: { label: string; href: string; role: "primary" | "support" | "wire" }[]
}
```

## Refresh rules (from free-ingest → organism)

| Source | May feed | Must not |
|--------|----------|----------|
| CURRENT + `cycle.ts` pins | lead/companion/rest copy, unlockIf | invent new Brief pins / cycle `004` |
| HF / arXiv / OpenAlex / Crossref | Papers → Digest `refs` (`support`) + evidence lines | displace HF lead; gen/sim overwrite keeps |
| HN / lab RSS / security RSS | Pulse → Digest `refs` (`wire`) after classify/DENY | Brief lead; civilizations / Sol=Astra flatten |
| GitHub shelf | toolkit `refs` / steps only | Brief pins |

Lead stays **`hf-incident`** until a real new primary (out of scope). Astra remains companion file.

## Code paths

| Path | Role |
|------|------|
| `desk/scripts/digest-tick.mjs` (or `.ts`) | due check · rebuild · write packs · update digest-last |
| `desk/src/lib/digest-pack.ts` | keep `CADENCE_MS`, `renderReport`, `renderPlan`, `nextDue`; add disk helpers |
| `desk/src/lib/digest-refresh.ts` | map free-ingest snapshots → DigestItem[] **without** mutating Brief pin set |
| `package.json` | `"digest:tick": "bun scripts/digest-tick…"` |
| Tests | due/HOLD · pack parse · stigmergy drop · no civilizations in lead · pins untouched |

Optional: cron example in README (`0 */6 * * * cd desk && bun run digest:tick`).

## UI (UX after land)

- Digest lane: DUE vs HOLD from `digest-last.json`
- Download md+json from latest `artifacts/sage/packs/`
- No token churn

## Done when (Reviewer)

- [x] `bun run digest:tick` when overdue writes md+json under `artifacts/sage/packs/`
- [x] Second run within 6h → HOLD no-op
- [x] Pack JSON parses; lead file `hf-incident`; stigmergy/`drop` present; no civilizations in non-Dropped
- [x] Brief pins unchanged (`003` / `hf-incident`)
- [x] Does not require browser localStorage
- [x] Tests green

### Reviewer stamp — 2026-09-04T09:14Z (Reviewer Gürok)

**WIRE-DIGEST-CADENCE PASS**

Evidence:
- `bun test` → 142/142 (incl. no localStorage · append-only refresh)
- packs `artifacts/sage/packs/2026-09-04T09.{json,md}` · `digest-last.json` next_at = last+6h
- second `digest:tick` → HOLD
- lead `hf-incident` · cycle `003` · civilizations absent from non-Dropped · pins untouched

## Explicit non-goals

- Cycle `004` · HF `/papers` HTML wire · paid X · inventing Brief pins from Pulse/RSS · changing Skin tokens
