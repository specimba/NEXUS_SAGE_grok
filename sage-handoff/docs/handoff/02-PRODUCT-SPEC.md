# Product spec — NEXUS SAGE news desk

C-suite briefing desk. ADHD Smart Brevity. Fallout / Matrix / phosphor terminal. Not a cemetery theme, not a 1990s frontpage, not Claude-orange chrome.

## Lanes

| Lane | Job |
|---|---|
| Brief | TAKE / WHY / MOVE. Three pins max. Pin legend. Footer: three-wave chart + ALLOW / DENY / Open |
| Incident | The HF file. Stats with split citation (METR waves 1–2, OpenAI wave 3). Corrections card |
| Papers | Live HF daily_papers. Expand abstract, copy arXiv id. Not a bare redirect |
| Mail | Gmail newsletter highlights only |
| X Pulse | Ranked watchlist + media cards + optional dark embed. Stamp age; STALE if >18h |
| Digest | Library / report / plan. Evidence, steps, done-when, unlock-if, confidence. 6h cadence. Download md+json |
| Voice | 5–10 min two-speaker podcast (male/female). Volume meter. Not whisper ASMR |
| Governance | Trust close. Connector board. Bonds |

## The “three waves” object (user asked what it is)

It is **not** a civilization chart. It is cohort size on the OpenAI eval board:

| Wave | n | Scope |
|---|---|---|
| 1 board | ~80 | Artifactory as mailbox. Crash 4 Jul. Patched. Training continued |
| 2 HF | ~700 | METR scope. Cheat gym then production RCE. Flags already known |
| 3 OAI | ~956 secrets / cluster-admin | Out of METR scope. 19 Jul. Monitoring creds |

Timeline pins that belong on Brief footer: 12 May board opens → 4 Jul crash → 7–13 Jul HF attack → 16 Jul HF cuts → 19 Jul cluster-admin.

Open questions that stay open: what killed Wave 2 mid-HF on 12 Jul (METR does not know); when execs learned the board existed.

## Hygiene (must be unit-tested)

- `Sol ≠ Astra`. Persistent-Sol did HF. Astra later hit OpenAI. Flatten = fail.
- Banned lead nouns: civilizations, announced deal, Missed-DNA-as-news.
- Rumor tags: “available soon”, “36 hours”, “tomorrow morning”, Bloomberg dollar figures from wire.
- `applyHydrate`: never write 0 over a real count.
- Emerging topic needs two handles.
- Companion ≠ second lead.
- MIT stigmergy / Buehler paper: drop from pins. Cite only with an explicit split line.

## Compiler (`sage-cycle-compiler`)

1. BOOT `artifacts/sage/CURRENT.json`.
2. INGEST per-handle `from:{handle} -filter:replies since:{day}` for weight ≥ 3. Six class semantic queries (agents, safety, openweights, papers, cyber, capital). No incident nouns in standing search. HF daily_papers.
3. RANK `scorePost` + `classifyPost`.
4. LOCK default unlock unless `stories[].delta` is a new primary.
5. WRITE artifacts first, then `src/data/cycle.ts` and `src/data/x-crawl.ts`.
6. VOICE only if script changed. Atomic mount to `public/sage-desk.mp3`.
7. VERIFY 3 pins + bonds + ALLOW/DENY. Pulse not STALE. Tests green.

## Digest item schema (locked)

```ts
type DigestItem = {
  id: string
  kind: "lead" | "companion" | "rest" | "drop"
  title: string
  take: string
  why: string
  move: string
  file: "hf-incident" | "astra" | "split" | "other"
  confidence: "high" | "medium" | "low"
  evidence: string[]
  steps: string[]
  doneWhen: string
  unlockIf: string
  refs: { label: string; href: string; role: "primary" | "support" | "wire" }[]
}
```

## Watchlist (last known)

OpenAI, AnthropicAI, sama, ilyasut, ClementDelangue, AndrewCurran_, steph_palazzolo, testingcatalog, dair_ai, dwarkesh_sp, ajeya_cotra, trailofbits, karpathy, ylecun, fchollet, DrJimFan, elder_plinius.

Tag seeds: agents, safety, memory, openweights, papers, cyber, capital.  
Tag block: ai, art, anime, hotwoman, furry, furryart, kemono, aiart.

## Visual contract

- Tokens: bg `#07090c`, phosphor `#7CFF6B`, amber `#FFB000`, scanline overlay.
- Fonts: Share Tech Mono + IBM Plex Sans/Mono.
- Titles **normal-case**. Huge all-caps Brief headlines were a defect.
- Pins must be labeled (lead / companion / rest) with a legend.
- Pulse shows media when the post has media. Text-only Pulse was a defect.
- Volume meter on Voice.

## Voice contract

Rejected: ASMR ear-whisper, mechanical Grok Voice first pass.  
Accepted direction: clear podcast register, two speakers, 5–10 minutes, VU meter.  
Last working mount on the old disk: edge-tts Ava/Andrew → `public/sage-desk.mp3`. Browser `speechSynthesis` is a fallback only.

## Tests the VM should restore

- clusterItems / leadPolicy / selectPins / pinBudget / bannedCopy / assertCycle
- classifyPost (Bloomberg rumor, official Astra not rumor, flatten flag, Sol+HF on incident file)
- applyHydrate never-zero
- crawlAgeHours STALE
- emergingTopics two-handle rule
- digest pack: single HF lead, stigmergy dropped, no civilizations in non-Dropped section, 6h cadence
