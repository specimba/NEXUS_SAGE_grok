# Scout — Digest organism gaps + free-ingest → DigestItem field map

Companion to `WIRE-DIGEST-CADENCE.md`. **Digest never invents Brief pins.** Locks: `003` / `hf-incident` / Sol≠Astra / stigmergy=`drop` / no civilizations in non-Dropped / no `004`.

---

## Organism gaps (why `digest:tick` exists)

| Gap | Risk | Disk fix |
|-----|------|----------|
| Cadence only in browser `localStorage` (`PACK_KEY`) | Wipe / new session → DUE/HOLD lies | `artifacts/sage/digest-last.json` is truth |
| Pack md+json not on VM | Another agent can’t execute the plan | `artifacts/sage/packs/YYYY-MM-DDTHH.{md,json}` |
| Free-ingest fresh, Digest stale | Pulse/Papers move; Digest library frozen at cycle handoff | `digest:tick` refreshes **refs/evidence strings only** from ingest snapshots |
| Lead copy drift from Pulse/RSS | Brief pollution / banned nouns | Lead/companion/rest **copy** stays from `DIGEST_ITEMS` + `cycle.ts` — ingest may append refs/evidence, not rewrite take/why/move unless Architect opens a copy pass |

---

## Safe feeds → DigestItem fields

Legend: ✅ allowed · ⚠️ append-only / filtered · ❌ forbidden

| Free-ingest source | → `evidence[]` | → `refs[]` | → title/take/why/move | → `kind` / `file` / pins |
|--------------------|----------------|------------|------------------------|-------------------------|
| `CURRENT.json` + `cycle.ts` | ✅ unlock / lock lines | ✅ primary cycle refs | ✅ **only** source of lead/companion/rest prose | ✅ lead=`hf-incident` locked |
| Existing `DIGEST_ITEMS` / `DROPPED` | ✅ baseline | ✅ baseline | ✅ baseline organism | ✅ stigmergy stays `kind:"drop"` |
| HF `daily_papers` / Papers keeps | ⚠️ “HF keep still ranked…” fact lines | ✅ `{role:"support"}` paper abs/pdf | ❌ no auto rewrite of lead take | ❌ never new Brief pin |
| arXiv enrich | ⚠️ abstract snippet ≤1 line as evidence | ✅ abs/pdf `support` | ❌ | ❌ |
| OpenAlex / Crossref | ⚠️ year/DOI confirmation lines | ✅ DOI URL `support` | ❌ | ❌ never displace HF keeps |
| HN Algolia (post-`classifyPost`) | ⚠️ only ALLOW / non-DENY | ✅ `{role:"wire"}` story URL | ❌ | ❌ never Brief |
| Lab RSS (OpenAI/DM/GAI/HF) | ⚠️ official announce one-liners | ✅ `{role:"wire"}` | ❌ Astra product posts ≠ lead | ❌ |
| Security RSS (ToB/Fox-IT/PZ) | ⚠️ cyber containment one-liners (relevant to HF agents) | ✅ `{role:"wire"}` | ❌ exploit how-to → DENY/drop | ❌ |
| GitHub shelf | ⚠️ “toolkit on shelf: …” | ✅ `{role:"support"}` + may inform `steps[]` | ❌ | ❌ shelf ≠ Brief |
| `ingest-last.json` | ⚠️ stamp ages / soft_fail counts | ❌ | ❌ | ❌ |

### Role cheat-sheet

- `refs.role: "primary"` — only cycle/CURRENT HF lead materials  
- `"support"` — Papers / DOI / toolkit  
- `"wire"` — Pulse/RSS chatter that survived hygiene  

---

## Must scrub before any Digest write

From `x-hygiene` / product spec — if present in generated evidence/refs labels, **drop or force into Dropped**:

- `civilizations` · announced-deal hype · Missed-DNA-as-news  
- Sol=Astra flatten · Astra-as-HF-attacker  
- MIT stigmergy / Buehler as **HF breach proof** (keep only as explicit `kind:"drop"` / split line)  
- Toolkit URLs promoted as Brief pins  

DENY/rumor HN/RSS items: do not enter `evidence` or non-Dropped `refs`.

---

## Recommended `digest-refresh` algorithm (Scout)

1. Load baseline `DIGEST_ITEMS` (do not delete lead/companion/rest rows).  
2. Load `ingest-last.json` + Papers/Pulse/RSS/shelf snapshots.  
3. For each kept DigestItem, **append** ≤3 new `evidence` lines + ≤5 `refs` from allowed table (dedupe by href).  
4. Reaffirm `DROPPED` / stigmergy drop section.  
5. Run banned-noun scan on lead+companion+rest titles/takes.  
6. Write packs + `digest-003.json/md` + `digest-last.json`.  
7. Assert Brief pin set unchanged (`cycle` pins / `hf-incident`).

---

## Out of scope this wire

- HF `/papers` HTML · paid X · Reddit · inventing cycle `004` · changing Skin tokens · auto-promoting Pulse cards into Brief companion pins
