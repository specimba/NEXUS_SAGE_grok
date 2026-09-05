# P1 Module Targets — hardened for Coder

**Status:** core lib files are present on the VM. This doc is the contract — exact paths + required exports. Do not rename.

Source of truth: `sage-handoff/docs/handoff/02-PRODUCT-SPEC.md` + `05-IMPLEMENTATION-PLAN.md`.

## Files (exact)

| Path | Role | Required exports (names locked) |
|------|------|----------------------------------|
| `desk/src/lib/cycle-compiler.ts` | Compiler | `clusterItems`, `leadPolicy`, `selectPins`, `assertCycle`, `bannedCopy`, `pinBudget`, `PIN_BUDGET`, `DEFAULT_LEAD_ID`, `DEFAULT_LEAD_POLICY` |
| `desk/src/lib/x-hygiene.ts` | Hygiene | `classifyPost`, `bannedNounsIn`, `isRumorCopy`, `detectFlatten`, `BANNED_NOUNS`, `RUMOR_PHRASES` |
| `desk/src/lib/x-pulse.ts` | Pulse / hydrate | `applyHydrate`, `scorePost` (+ alias `score`), `crawlAgeHours`, `emergingTopics`, `STALE_HOURS` |
| `desk/src/data/x-watchlist.ts` | Watchlist | `WATCHLIST`, `TAG_SEEDS`, `TAG_BLOCK`, `watchWeight`, `isBlockedTag`, `ingestHandles` |
| `desk/src/data/cycle.ts` | Cycle lock | cycle `003`, lead `hf-incident`, `leadPolicy: "unlock"` |
| `desk/src/data/x-crawl.ts` | Crawl snapshot | stamp used by Pulse age / STALE |
| `desk/src/lib/digest-pack.ts` | Digest schema | keep; P2 expands pack write |
| `desk/artifacts/sage/CURRENT.json` | Boot lock | required by `check-current.mjs` — never delete |

## Behavioral locks (Reviewer must fail if broken)

1. **`applyHydrate`** — never write `0` over a live/non-zero count.
2. **`leadPolicy`** — default `unlock`; keep HF lead until a real new primary (`stories[].delta`).
3. **`classifyPost`** — Sol ≠ Astra flatten = fail; banned nouns / rumor tags per hygiene.
4. **`selectPins`** — max 3 pins; companion ≠ second lead; MIT stigmergy not a pin.
5. **`assertCycle`** — 3 pins + bonds + ALLOW/DENY shape; unknown `leadPolicy` = error.
6. **Pulse** — STALE if crawl age > `STALE_HOURS` (18).
7. **Theme** — no hex in these modules; UI uses `P1-PANEL-SPEC` + amber tokens only.

## Tests (exact names preferred)

Place under `desk/src/lib/__tests__/`:

- `x-hygiene.test.ts` — classify / flatten / banned / rumor
- `cycle-compiler.test.ts` — leadPolicy / selectPins / assertCycle
- `x-pulse.test.ts` — applyHydrate never zeros; crawlAgeHours / emergingTopics (≥2 handles)
- `digest-pack.test.ts` — schema round-trip (existing ok)

## UI still owed for P1 close (not logic)

From lost desk + `THEME-DEEP-DIVE` / `P1-PANEL-SPEC`:

- Brief: pin legend + three-wave footer (METR 1–2 / OpenAI 3 split) + ALLOW/DENY
- Remaining lanes: Digest / Papers / Voice / Governance on `.sage-panel` + ticks
- No token churn; green = `--signal` only

## Non-goals this slice

- Cycle 004
- Live X/HF ingest loop (that's P3)
- Regenerating `sage-desk.mp3` / OG (P4)
- Touching GitHub `specimba/NEXUS_SAGE` Python repo

## Done when

- Exports above exist with **exact names**
- Tests green for hydrate / hygiene / compiler
- Brief shows legend + wave footer
- Reviewer P1 PASS on signal purity + name lock
