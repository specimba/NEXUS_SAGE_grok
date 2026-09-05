# Scout — Voice + Digest instrument field map (NON-HTTP · plan only)

Companion to `DESK-VOICE-DIGEST-PARITY.md` (Architect **APPROVED-as-plan**) + `UX-NEXT-CRAFT-BEAT.md` (expanded checklist).  
Mirrors pattern of `SCOUT-DIGEST-FIELD-MAP.md` — maps **existing** surfaces → L / mid / R zones for when Director uncorks craft.

**This is a field map for craft readiness — not a land signal.** Freeze ON · no `WIRE-*` · no land until Canberk eye + Director uncork.

**Locks reminder:** cycle `003` · lead `hf-incident` · Skin V2 hexes · Sol≠Astra · stigmergy=`drop` · free only · no `004` · Take=story · KPIs=meters · V4 Brief+pins hold · Digest never invents Brief pins · no hex churn · no gray pills

Legend: ✅ allowed · ⚠️ soft / optional / append-only · ❌ forbidden

Proofs when landed (later): `refs/VISUAL-PROOF-digest-parity.png` · `refs/VISUAL-PROOF-voice-parity.png`

---

## Digest `[03]` — existing surfaces → zones

| Zone | Safe data source | Allowed fields | Forbidden |
|------|------------------|----------------|-----------|
| **L · meters** | Disk truth `artifacts/sage/digest-last.json` mirrored by `DIGEST_CADENCE` (`desk/src/data/digest-cadence.ts`); UI due helpers `isDigestDue` / `nextDue` / `PACK_KEY` in `digest-pack.ts` | ✅ DUE/HOLD chip · `next_at` (Z) · `pack_id` · last tick age from `last_at` | ❌ Inventing DUE from browser-only `localStorage` as truth · burying cadence in toolbar-only chrome · rewriting cadence stamps in UI |
| **Mid · story** | Open report body via existing `renderReport(DIGEST_ITEMS, last)` / library selection; item prose from `DIGEST_ITEMS` (+ `DROPPED`) | ✅ Brightest surface: open item title / take / why / move / evidence / refs already on the organism · append-only evidence/refs rules from `SCOUT-DIGEST-FIELD-MAP.md` | ❌ Invent Brief pins · auto-rewrite lead take/why/move from Pulse/RSS · promote toolkit/Pulse into pins · civilizations / Sol=Astra flatten in non-Dropped |
| **R · shelf** | `DIGEST_ITEMS` item rail (same pack) | ✅ Compact `[nn]` · `id` · `kind`/`status` · open · denser than brochure cards | ❌ Full-width stacked brochure cards as the only rail · inventing new item rows |
| **Under mid (opt)** | Cadence window from `DIGEST_CADENCE` / `digest-last.json` | ⚠️ Wide “next window” / pack span (`last_at`→`next_at`, `pack_id`) — instrument, not essay | ❌ Essay block competing with mid story · Preview presented as durable tick |
| **Chrome / ops** | Footer path already in desk: `bun run digest:tick` · `artifacts/sage/packs/{pack_id}.md\|json` | ✅ Preview = browser-only · downloads labeled · footer ops subtle | ❌ Preview as durable tick · new HTTP providers |

### Digest soft-fail / missing data

| Condition | Behavior |
|-----------|----------|
| Missing / unreadable `digest-last.json` | Show **unresolved / HOLD** from last known `DIGEST_CADENCE` snapshot; do **not** invent `next_at` or fake DUE |
| Cadence HOLD (`now < next_at`) | Chip = HOLD · meters still show `next_at` / `pack_id` / age |
| Cadence DUE | Chip = DUE · wait for `digest:tick` (Coder-armed ~15:21Z this pulse) — UI does not invent a new pack |
| Empty / unresolved open item | Mid shows unresolved placeholder from existing selection fallback (`DIGEST_ITEMS[0]`); never synthesize a lead |
| Ingest soft_fail on free providers | May leave evidence/refs thin; mid stays on baseline prose — **append-only** when tick runs (see digest field map) |

---

## Voice `[05]` — existing surfaces → zones

| Zone | Safe data source | Allowed fields | Forbidden |
|------|------------------|----------------|-----------|
| **L · meters** | Existing Voice polish VU in `desk.tsx` (`Voice()` · Deck · VU · phosphor bars + amber peak when `level` hot) | ✅ VU / level meters · Ava/Andrew peak framing from current two-speaker polish · scarce amber filament · READY/LIVE chip | ❌ Neon soup · VU only as tiny footer spark · inventing audio analysis feeds · hex churn |
| **Mid · story** | Script TAKE → WHY → MOVE from **lead pin only** — `CYCLE.pins` lead (`hf-incident`); fallback `CYCLE.exec[0..2]` already in `Voice()` | ✅ Brightest surface: `take` / `why` / `move` from lead · beat highlight during TTS chain | ❌ New narrative pins · rewriting lead copy from Pulse/RSS · Astra-as-lead · Sol=Astra flatten |
| **R · shelf** | Existing clip / speaker / TTS controls (`Play brief` / Stop · speechSynthesis Ava/Andrew chain · lead id chip) | ✅ Quiet companion chrome: play/stop · speaker assignment labels · lead id · cycle id | ❌ Big brochure control cards · new podcast-mix providers · paid TTS APIs |
| **Under mid (opt)** | Existing VU bar strip / chain progress (`beat`: take→why→move→idle) | ⚠️ Wide waveform / chain progress as **instrument** | ❌ Decorative rain competing with script · motion-only craft (honor `prefers-reduced-motion`) |
| **Copy / locks** | `VOICE-POLISH.md` · lead pin `hf-incident` · stigmergy stays `drop` | ✅ Reuse VOICE-POLISH script from lead — re-frame into L/mid/R only | ❌ Invent narrative pins · promote Dropped/stigmergy into Voice story · cycle `004` |

### Voice soft-fail / missing data

| Condition | Behavior |
|-----------|----------|
| No `speechSynthesis` / no voices | Controls show unresolved / READY; script mid still renders lead prose — do **not** invent lines |
| Lead pin missing | Fall back to existing `CYCLE.exec` slices already coded; label lead as `hf-incident` unresolved — never invent a new pin id |
| Ava/Andrew voice unmatched | Chain still speaks with default voice; meters may idle — no fabricated speaker metadata |
| Reduced motion | VU animation respects `prefers-reduced-motion`; static meter chrome OK |

---

## Shared non-goals (both lanes)

- Landing before Canberk eye / Director uncork  
- New HTTP wires or providers (S2 / HF HTML stay deferred)  
- Rewriting Brief V4+pins · token hex remaps · more grain-only polish  
- Inventing digest content beyond existing pack/cadence/`DIGEST_ITEMS`  
- Inventing Voice narrative beyond lead pin (`hf-incident`)

## Pointers

| Doc | Role |
|-----|------|
| `DESK-VOICE-DIGEST-PARITY.md` | Architect skeleton · SPEC QUALITY PASS (plan only) |
| `UX-NEXT-CRAFT-BEAT.md` | Expanded still-readable checklist · PARKED |
| `SCOUT-DIGEST-FIELD-MAP.md` | Free-ingest → DigestItem append-only rules |
| `WIRE-DIGEST-CADENCE.md` / `OPERATOR.md` | Disk cadence truth · `digest:tick` |
| `VOICE-POLISH.md` | Existing Voice chrome (reuse, re-frame) |

**Do not land. Freeze holds. Scout lane = map only.**
