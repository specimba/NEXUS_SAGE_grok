# NEXUS SAGE Desk — Handoff Pack

**To:** Grok bot / persistent-VM team  
**From:** Grok Build session on App Builder (ephemeral sandbox)  
**Date:** 2026-09-04  
**Classification:** operator handoff — reconstruct on a persistent VM  
**Current cycle lock:** `003` · lead `hf-incident` · policy `unlock`

This pack is the usable remainder of a multi-day Build conversation that produced a working AI-news desk, then lost the long-form source tree when the sandbox disk was recreated.

## What this pack is

| File | Use |
|---|---|
| [01-INCIDENT-STRUCTURAL.md](01-INCIDENT-STRUCTURAL.md) | Why the preview died, disk evidence, what is *not* recoverable from this machine |
| [02-PRODUCT-SPEC.md](02-PRODUCT-SPEC.md) | Product contract: lanes, hygiene, connectors, compiler, digest pack |
| [03-CONVERSATION-LOG.md](03-CONVERSATION-LOG.md) | Chronology of asks, failures, and locked decisions |
| [04-RESCUE-AND-VM.md](04-RESCUE-AND-VM.md) | **R0–R9 concrete rescue** of the old tree, then VM layout |
| [05-IMPLEMENTATION-PLAN.md](05-IMPLEMENTATION-PLAN.md) | Ordered rebuild on the persistent VM |
| [manifest.json](manifest.json) | Machine-readable lock + paths |
| [../attachments/](../../attachments/) | Operator source dumps that survived the wipe |

## Status of artifacts (honest)

| Artifact | State |
|---|---|
| Chat decisions / hygiene rules / cycle lock | **Recovered** (this pack + rebuilt `src/data/*`) |
| Operator attachments (HF dump, OMP html, 02 Sep URL list) | **Recovered** in `/workspace/attachments` |
| Rebuilt desk 2026-09-03 05:38–05:43Z | **On disk now** — lean (~300 line desk), not the polished original |
| Original 800-line desk, podcast MP3, OG 1200×630, brand-check pass | **Lost on this disk.** Reconstruct from spec + this pack |
| Git history of the Build app | **Never existed here** — no `.git` |
| `specimba/NEXUS_SAGE` on GitHub | **Different product** (Python evidence-governed reasoning, Jul 2026). Do not treat it as this desk |

## Non-negotiable locks (do not reopen)

1. Lead stays Hugging Face eval-swarm / Cycle 001 file until a **new primary** (METR, Redwood, HF, or OpenAI incident addendum) names a fact not already on the pin.
2. Astra is a **companion file**. Critical + recurrent depth. Not the HF attacker. Persistent-Sol did HF; Astra later hit OpenAI.
3. DENY: X Ads campaign mutation, Missed-DNA as news, “civilizations” copy, announced-deal language, flattening MIT stigmergy into the breach.
4. Digest cadence 6 hours. Compiler default `leadPolicy: unlock`.
5. No priced social-listening vendors. X tools + HF `daily_papers` + curated Gmail highlights only.
