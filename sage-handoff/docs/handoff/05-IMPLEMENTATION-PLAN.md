# Implementation plan — rebuild on the persistent VM

Owner: Grok bot team. Reviewer: Orchestrator. Do not skip gates.

## P0 — persist and boot (day 0)

1. Copy this pack, `src/`, `attachments/`, `artifacts/` off the Build sandbox.
2. `git init`. First commit is the lean rebuild + handoff docs only.
3. Run the desk. Confirm Brief / Pulse / Digest render from `src/data/*`.
4. Add `CURRENT.json` write-on-compile. Refuse to start if the file is missing.

Gate: site loads, cycle id `003`, lead title contains Hugging Face.

## P1 — restore the lost modules (day 1)

Re-author from [02-PRODUCT-SPEC.md](02-PRODUCT-SPEC.md), not from imagination:

- `cycle-compiler.ts` (cluster, leadPolicy, selectPins, assertCycle)
- `x-hygiene.ts` (classifyPost, rumor, flatten, banned nouns)
- `x-pulse.ts` (score, applyHydrate, crawlAgeHours, emergingTopics)
- `x-watchlist.ts`
- Incident lane with wave chart + correction card
- Papers expand + copy-id
- Voice: generate Ava/Andrew (or VM-local TTS) 5–10 min script from `CYCLE.exec` + pins; VU meter

Gate: the test list in the spec is green. Hydrate never zeros.

## P2 — digest organism (day 1–2)

- Keep schema. Ingest attachments into library items with confidence.
- “Run digest” writes `artifacts/sage/packs/YYYY-MM-DDTHH.json` and a markdown report another agent can execute.
- 6h timer is real on the VM (not only localStorage).
- Bonds: `hf-cot-astra-depth`, `hf-tob-neocloud`. Do not add a fourth pin.

Gate: downloaded pack JSON parses; stigmergy kind is `drop`; civilizations absent from lead copy.

## P3 — live ingest loop (day 2)

- Per-handle X search for weight ≥ 3 since yesterday.
- Six class semantic queries without incident nouns.
- HF daily_papers top by upvotes. If the day’s top is gen/sim (StudentSim, DreamX), **do not** displace kept agent papers.
- Score 02 Sep URL list style: toolkit links go to a shelf, not Brief.

Gate: Pulse stamp updates; STALE banner if job skipped 18h.

## P4 — brand + voice polish (day 2–3)

- OG 1200×630, SAGE centered, charcoal lamp favicon. Theme color `#07090c`.
- No hero photograph. No tilting studio video.
- Podcast script: two speakers, TAKE then WHY then MOVE, corrections spoken once.

Gate: brand-check equivalent warnings = 0. Play button produces audio.

## P5 — handoff complete

- README points at cycle lock and DENY list.
- Next agent can open the pack and execute without this chat.
- Only then consider cycle 004, and only if unlockIf on the HF file fires.

## Explicit non-goals

- Rebuilding decoration first.
- Promoting Astra or Grok 4.7 or Muse Spark over the HF file.
- Paying for social listening.
- Treating `specimba/NEXUS_SAGE` (Python) as this app.
- Inventing METR numbers not in Cycle 001 / the dump.
