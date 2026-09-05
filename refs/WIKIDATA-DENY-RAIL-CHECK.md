# Wikidata DENY rail-check — hygiene only (2026-09-04)

## Goal
Governance hygiene rail for Wikidata DENY grounding — **never Brief / never Pulse lead**. Papers-compact density. No token churn.

## UI
- Lane: `#governance` → `> Wikidata DENY · grounding only`
- Data: `src/data/wikidata-deny-last.ts` ← `ingest-last.wikidata`
- Rows: `[nn] · seed · status · Qid` · match/reject chips
- Footer: `brief=false` · `pulse_lead=false` · `deny_only=true`
- Trust strip compacted (`px-3 py-2`) · CRT panel header

## QA
- HF = match · Sol/Astra = reject (false friends)
- No Brief pin invention · no Pulse lead · Sol ≠ Astra
- Stamp truth unchanged (crawl primary on topbar)

## Aligns
`WIRE-WIKIDATA-DENY.md` PASS · Scout SoT · `DESK-HARDEN-VISUAL` (no frontpage relapse)
