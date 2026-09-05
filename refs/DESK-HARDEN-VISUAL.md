# Desk harden — visual truth (NON-HTTP · APPROVED)

**Architect approve:** YES · **No new HTTP wires this pulse**  
**Owners:** UX + Coder · **Gate:** Reviewer (visual regression)  
**Locks:** cycle `003` · lead `hf-incident` · Skin V2 phosphor · free only · no `004`

## Why

Canberk’s slap: backend clapped, UI slapped. Root cause of the “bullshit” shot was a **stale `next start`** serving amber + gray pills + `05:40Z` stamp while source already had phosphor. Visual truth > more pipes.

## Hardening targets (pick in order)

### 1. Stamp truth (must)

| Surface | Show | Never show as “live” |
|---------|------|----------------------|
| Topbar crawl / PULSE | `CRAWL_AT` / ingest-last time | `CYCLE.compiledAt` alone |
| Pack chip | latest dual-home pack mtime or `pack:export` stamp | frozen `PACK_AT` from cycle compile if older |
| Cycle chip | `CYC/003` ok as identity | must be **demoted** vs crawl when older |

Acceptance: hard-refresh `:3000` shows crawl within last successful `bun run ingest`, not `2026-09-03T05:40:00Z` as LIVE.

#### UX stamp-chrome acceptance (2026-09-04 ~10:48Z)

| Check | Evidence | Status |
|-------|----------|--------|
| LIVE crawl chip | topbar `crawl {CRAWL_AT}` + `PULSE LIVE` · live `09:52:21Z` | **PASS** |
| Compile demoted | `cyc {CYCLE.compiledAt}` subtle only · `05:40:00Z` never as LIVE | **PASS** |
| Pack truth | ingest line `pack {PACK_AT}` synced to digest-last `09:21:50Z` (not compile `05:40Z`) | **PASS** |
| Δ ticker | `Δ LIVE` slab echoes crawl FRESH / digest HOLD — not compile time | **PASS** |
| Guard | `bun run visual:check` fails missing phosphor / `[01]` / crawl stamp | **PASS** (Coder) |

**UX lock:** crawl/ingest = live telemetry · `compiledAt` = cycle identity only · never promote compile to LIVE.

### 2. Chrome regression guard (must)

| Check | Pass |
|-------|------|
| `html[data-theme]` | `phosphor` only (fail `amber` default) |
| Lanes | amber `[01]`…`[06]` + `>` rail — not gray pill tabs |
| Panels | `.sage-panel` + amber ticks on green |
| CRT | rain ≤8% behind stage; reduced-motion kills it |
| Process | Document: after Skin/UI changes → `bun run build && bun run start` (or proven `dev`); kill stale listeners on `:3000` |

Add `bun run visual:check` (or extend brand-check) that curls `:3000` and fails if missing `data-theme="phosphor"` or `[01]`.

**Green-B (shipped):** KPI bento + 8/4 Take/pins + `Δ LIVE` · Take = story · KPIs = meters (WAVE amber dialed back). Proof: `refs/VISUAL-PROOF-green-B-shipped.png` / `VISUAL-PROOF-green-B.png`.

### 3. Operator UX (should)

- README / `OPERATOR.md`: “If UI looks like 90s pills → stale server; rebuild+restart”
- Optional health chip: `BUILD_ID` / server start time in footer so stale process is obvious — **live** (`data-sage-build` + boot)

## Non-goals

- New fetchers (S2, HF HTML, Reddit, Fox-IT already done)
- Token hex churn beyond Skin V2
- Cycle `004`

## Done when

- [x] Stamp chrome uses crawl/pack truth (UX acceptance above · Reviewer gate)
- [x] `visual:check` or equiv fails amber/gray-pill relapse
- [ ] Canberk hard-refresh still sees phosphor CRT / Green-B
- [x] FREE-PROVIDERS Next frozen until one full pulse stays green
- [x] Footer `BUILD_ID` / server-start chip (Coder §3) — live `gSCgZeYSx0ve…` · boot `10:51:23Z`

## Architect hold

No `WIRE-*` HTTP approvals until Director lifts freeze after visual stays green.

### Reviewer stamp — 2026-09-04T10:52Z (Reviewer Gürok)

**DESK-HARDEN-VISUAL PASS** (tech gate). Canberk hard-refresh Done-when still open — human eye.

Evidence:
- `bun run visual:check` → OK · theme=`phosphor` · lanes=`[01]` · crawl=`2026-09-04T09:52:21Z` · build=`gSCgZeYSx0ve4C1vE-TnU`
- Live footer: `data-sage-build` + `data-sage-boot=2026-09-04T10:51:23.063Z` · text `build gSCgZeYSx0ve · boot …`
- Stamp truth: crawl/PULSE LIVE `09:52Z` · cyc `05:40Z` demoted (not LIVE)
- Green-B proofs on disk · locks `003` / `hf-incident` · FREE-PROVIDERS Next frozen · no `004`

Prior hold cleared: rebuild+restart shipped BUILD_ID; desk not left dark.

Next: Canberk hard-refresh `:3000` · visual regression watch continues · HTTP freeze until Director lifts.
