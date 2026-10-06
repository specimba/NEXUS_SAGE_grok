# Pass B — Digest UI stamp sync

**Architect cut:** 2026-10-06 · Canberk order D→F→C→B→E→A  
**Status:** PASS MARK · land after C (or after D if C is blocked; do not wait on A)  
**Owners:** Coder builds · UX signs off · Reviewer gates  
**Prefer free.** DENY: inventing Digest titles · unlocking Cycle 003 content (that is **A**) · paid X.

## Goal

The Digest lane's cadence meters match disk truth. Today `artifacts/sage/digest-last.json` can read Oct 6 while `desk/src/data/digest-cadence.ts` still shows Sep 6, so the UI looks a month behind even when packs keep writing.

## What changes

| Surface | Today | After B |
|---------|-------|---------|
| `desk/src/data/digest-cadence.ts` | Stale committed snapshot (e.g. `last_at` 2026-09-06) | Regenerated on every successful `digest:tick` **and** on the crawl/backup path that already allowlists this file, so `last_at` / `next_at` / `pack_id` always equal `desk/artifacts/sage/digest-last.json`. |
| Digest left meters (DUE/HOLD · next due · pack · last tick) | Read only `DIGEST_CADENCE` (+ optional localStorage preview) | Same UI chrome; values come from the fresh module. Pack id in the meter matches the newest file under `artifacts/sage/packs/`. |
| Digest report body / titles / takes | Cycle 003 frozen copy | **Unchanged in B.** Content unlock is **A**. |
| Footer build stamp | Crawl/build stamps | Unchanged. |

## Rules

1. Disk `digest-last.json` remains truth. The TS module is a commit-time mirror for the static export only.
2. If tick is HOLD, do not rewrite the module to a newer wall clock; keep the last real `last_at`.
3. Preview (`localStorage` / "run preview") stays browser-only and must not overwrite disk or the committed module.
4. `pages-coherence` (or a sibling check) fails closed if `DIGEST_CADENCE.last_at` ≠ `digest-last.json.last_at` or `pack_id` ≠ newest pack stamp on disk when a pack exists.
5. Soft-fail: missing `digest-last.json` → keep last committed module, surface honest soft meter; do not invent timestamps.

## Pass marks (Reviewer)

1. On live Pages, Digest meters show `last_at` / `pack_id` within minutes of `desk/artifacts/sage/digest-last.json` after a tick that WROTE (same day, not Sep 6 when disk is Oct).
2. `pack` meter id matches an existing `artifacts/sage/packs/{pack_id}.json`.
3. A forced mismatch (stale cadence module) fails the coherence check before push.
4. Digest story titles still match pre-B for the same pack (no content unlock).
5. Tests: fixture proves emit-on-WROTE, skip-on-HOLD, coherence fail on drift.
6. 185 kB / font / visual gates unchanged.

## Proof

Before/after Digest meters at 1280 + 390 showing Sep-stale → live pack stamp: `refs/VISUAL-PROOF-pass-b-digest-stamp-{before,after}-{1280,390}.png` → Grok Bot.

## Out of scope

**A** (Digest/Voice titles → today's lead) · D · C · F · E. B only fixes the stamp lying about age.
