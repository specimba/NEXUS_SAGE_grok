# Incident / structural report — SAGE Build sandbox

**Incident ID:** SAGE-BUILD-WIPE-2026-09-03  
**Severity:** loss of long-session application tree (not loss of operator dumps)  
**Environment:** Grok App Builder Linux sandbox, project `01a065c6-2611-78f1-aab9-18fb9d57bd52`  
**Filesystem:** `/dev/vdc` ext4 ~49 GB, created **2026-09-03T05:37:22Z**

## 1. What the user saw

Two stacked failures:

1. Compile turns on 02–03 Sep aborted with “Grok was unable to finish replying” while ingesting `fancyTWEETScuration0209.txt` (~45 URLs). Preview pane: “Preview stopped.”
2. Next session opened a **blank App Builder template**. Restart preview did nothing useful. User asked whether the whole creation was wasted.

Those are different bugs. Mixing them hid the real one.

## 2. Two failure modes

### A. Turn abort (soft)

A single Build turn tried to: fetch many X threads + HF papers + rewrite cycle + voice + tests. The chat runtime killed the turn before writes flushed. Pulse stamp stayed `2026-09-02T04:20:00Z` and looked dead. **Source tree at that moment was still intact on the then-current disk.**

### B. Disk recreate (hard)

A later session landed on a new block device. Evidence taken 2026-09-03T11:51Z:

| Check | Result |
|---|---|
| `/` birth | 2026-09-03 05:37:22Z |
| `/workspace/.git` | absent |
| `/home/workdir` | `/home` empty — that path does not exist here |
| `og.jpg`, `sage-desk.mp3`, original `desk.tsx` ~800 lines | not on disk |
| Skills `sage-digest-pack`, `skill-diagnostics` | absent (template skills only) |
| `.project_id` | minted 05:38:00Z — new Build project |
| Surviving operator files | `/workspace/attachments/*` injected with the chat |

This is the documented App Builder lifecycle (`hibernate-revive.md`): **reboot / recreate may wipe app files back to template.** Preview stays empty unless `startup.sh` exists and binds `:8080`. The wiped tree also had no `startup.sh`, so even a soft revive of the *new* project would have shown black.

## 3. What was rebuilt after the wipe (this disk)

Written 05:38–05:43Z, then `startup.sh` at 11:51Z:

- `src/components/sage/desk.tsx` — 299 lines, hash lanes
- `src/data/cycle.ts`, `digest-pack.ts`, `x-crawl.ts`, `papers.ts`
- `src/lib/digest-pack.ts`
- `src/styles.css` — phosphor/amber terminal tokens
- `artifacts/sage/CURRENT.json` — cycle 003, unlock, no 004
- Smoke 2026-09-03: `#digest` HTTP 200, no hydration errors after hash was moved to `useEffect`

This is a **lean reconstruction**, not the polished Fallout/Matrix desk from the prior days.

## 4. What the original desk contained (reconstructed from conversation — not on disk)

Label: **RECONSTRUCTED**. Do not cite as recovered source.

Stack: TanStack Start + React 19 + Tailwind v4, hash routes `#brief #incident #papers #mail #pulse #digest #voice #governance`.

Notable modules that existed in the lost tree:

- `src/components/sage/desk.tsx` (~800 lines) — terminal chrome, live clock, ingest ticker, pin legend, Brief footer (three-wave chart + ALLOW/DENY)
- `src/data/cycle.ts` — Cycle 003 with pins, podcast turns, bonds, corrections (`Sol ≠ Astra`)
- `src/lib/cycle-compiler.ts` — cluster / rank / `leadPolicy` / `selectPins`
- `src/lib/x-hygiene.ts` — rumor phrases, flatten-risk, banned nouns
- `src/lib/x-pulse.ts` — `applyHydrate` never writes 0 over a live count; watchlist weight × recency × engagement
- `src/data/x-watchlist.ts` — OpenAI, Anthropic, sama, ilyasut, Curran, Palazzolo, dair_ai, Trail of Bits, etc.
- `public/sage-desk.mp3` — Ava/Andrew (edge-tts) mix after Grok Voice “whisper / mechanical” rejects
- `public/og.jpg` 1200×630, `favicon.svg` charcoal lamp, `src/lib/og/site.json` NEXUS SAGE
- Tests: hygiene, compiler, applyHydrate, digest-pack — last known 25–30 passing on the old disk
- Skills: `sage-cycle-compiler`, `sage-digest-pack`, `skill-diagnostics`

Brand-asset subagent `8dcb99cc-…` completed 2026-09-02: OG + favicon + brand-check 0 warnings. Those binaries are gone.

## 5. Connector board (operator-stated, still policy)

| Connector | Status | Rule |
|---|---|---|
| GROSS-AUDITOR | UP | ping / audit id — do not block compile on ping |
| Gmail | UP | highlights only, newsletters 28–30 Aug authorized |
| Hugging Face | PARTIAL | public `daily_papers` only, sort by upvotes. No Zapier classify |
| Voice | UP | podcast register, not ASMR whisper |
| Missed-DNA | FIXTURE | never a news source |
| X Ads | IDLE | no campaign mutation |
| nexus-grok-bridge-v2 | UP | auditor transport |

## 6. Impact

- Product knowledge is recoverable from this pack + attachments + the lean tree.
- Pixel-perfect prior UI, TTS mix, and OG card are **not** on this disk.
- GitHub `specimba/NEXUS_SAGE` is a **different** July 2026 Python governance repo. Rescue path is chat export + attachments + rebuild on the persistent VM, not that repository.

## 7. Immediate containment for the VM team

1. Copy `/workspace/docs/handoff`, `/workspace/src`, `/workspace/attachments`, `/workspace/artifacts` off this sandbox **before another recreate**.
2. `git init` on the VM. This Build workspace never had git.
3. Do not open cycle 004 without a new HF/METR primary.
4. Keep `startup.sh` as the preview/revive contract if you stay on App Builder; on the VM use a normal process manager.
