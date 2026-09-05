# Wire-spec #8 — Wikidata DENY grounding (APPROVED)

**Architect approve:** YES · **Pick over Semantic Scholar** (live probe **429** without key — deferred, soft-fail only if ever cut)  
**Implement:** Coder after Scout deepen optional · **Gate:** Reviewer  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **never Brief** · **never Pulse lead** · **no cycle `004`** · no HF HTML · no paid X / no S2 key

## Goal

Ground DENY / flatten / Sol≠Astra hygiene with public Wikidata search — **operator evidence for classifyPost**, not news. Prevents wrong-entity pollution by using a curated seed list + label checks.

## Why not S2 this pulse

```
GET https://api.semanticscholar.org/graph/v1/paper/search?query=HuggingGPT&limit=1
→ HTTP 429 (key required for usable rate)
```

S2 stays notes-only / deferred until zero-cred soft-fail path is worth the noise. Prefer Wikidata **200** free.

## Endpoint (zero credentials)

```
GET https://www.wikidata.org/w/api.php
  ?action=wbsearchentities
  &search={q}
  &language=en
  &format=json
  &limit=5
```

UA: `NEXUS-SAGE-desk/0.2 (free-ingest; wikidata; mailto:local@nexus-sage.invalid)`

Optional follow-up (≤1 per seed if search hits): `action=wbgetentities&ids=Q…&props=labels|descriptions|aliases&languages=en`

## Curated seeds (only these queries)

| Seed | Intent | Accept hit only if… |
|------|--------|---------------------|
| `Sol` / `Persistent Sol` | flatten guard | description/label suggests **person/agent** in AI/security context — **reject** climate/solar-physics false friends (Scout saw Q34104679 “Persistent solar influence…”) |
| `Astra` | companion ≠ HF attacker | reject pharma (AstraZeneca), cars, etc. unless allowlisted Q-id |
| `Hugging Face` | org grounding | org / company / website |
| `METR` | eval lab | research org |

**Allowlist file:** `desk/src/data/wikidata-deny-seeds.ts` — `{ seed, allowedQids?: string[], rejectLabelRe?: RegExp }`

If no accept hit → return `unresolved` (do not invent entities).

## Rate / soft-fail

- ≤1 Wikidata call / 2s · ≤3 seeds per ingest tick (rotate)  
- Cache 24h under `artifacts/sage/wikidata-cache/<seed>.json`  
- Soft-fail 429/5xx: skip, ingest continues  
- Never write Brief pins from Wikidata

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/wikidata-deny.ts` | search, filter, toDenyHints |
| `desk/src/data/wikidata-deny-seeds.ts` | curated seeds + allow/reject |
| ingest hook | attach hints into `ingest-last.json` → `wikidata` block for hygiene consumers |
| optional | feed `bannedNounsIn` / flatten tests with resolved aliases |
| `__tests__/wikidata-deny.test.ts` | fixture: reject solar-physics Sol · reject AstraZeneca · Brief=false |

## Schema

```ts
type WikidataDenyHint = {
  seed: string
  qid: string | null
  label: string | null
  description: string | null
  status: "matched" | "rejected_false_friend" | "unresolved" | "soft_fail"
  source: "wikidata"
  briefEligible: false
  pulseLeadEligible: false
  denyGroundingOnly: true
}
```

## Placement

| Lane | Allowed |
|------|---------|
| Hygiene / DENY / flatten tests | YES |
| Digest refs | optional `wire` “entity grounding” only |
| Papers / Pulse lead / Brief | **NO** |

## Done when

- [x] Fixtures prove false-friend rejection (solar Sol, AstraZeneca)
- [x] `ingest-last.json` → `wikidata.brief=false`
- [x] Soft-fail path tested
- [x] Pins stay `003` / `hf-incident`
- [x] Zero credentials · no S2 key

## FREE-PROVIDERS Next update

- Wikidata → **WIRED** this pulse (DENY grounding)
- Semantic Scholar → stay deferred (429)
- HF HTML → deferred
- Reddit → blocked

### Reviewer stamp — 2026-09-04T10:07Z (Reviewer Gürok)

**WIRE-WIKIDATA-DENY PASS**

Evidence:
- `bun test src/lib/__tests__/wikidata-deny.test.ts` → 19/19 (solar Sol / AstraZeneca reject · HF/METR allowlist · soft-fail 429/503/403 · reject-before-allowlist · no invent · Brief/PulseLead false)
- `desk/artifacts/sage/ingest-last.json` → `wikidata.brief=false`, `pulse_lead=false`, `deny_grounding_only=true`, cycle=`003`, lead=`hf-incident`
- Scout Q-id SoT: HF=`Q108943604`/`Q131939003`, METR=`Q135185153`, hard `rejectQids`
- pins `003` / `hf-incident` · Sol≠Astra · free only · no `004` · HF HTML deferred
- pack `sage-pack-003-20260904T095538Z` dual-homed (identical bytes)

Next: visual regression watch (gray-pill / stale-stamp). No new HTTP wires.
