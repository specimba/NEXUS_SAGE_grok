# Rescue paths and persistent-VM layout

## Reality check

The polished App Builder tree is **not** in GitHub `specimba/NEXUS_SAGE`. That repo is a July 2026 Python evidence/governance product. Code search on 2026-09-04 for `applyHydrate`, `CRAWL_AT`, `sage-desk`, `filename:cycle.ts user:specimba` returned **zero** hits. The desk was never pushed.

Closest public aesthetic cousin: `specimba/NEXUS_FALLOUT_OS`. Steal tokens, not news logic.

Netlify connector on this account can list teams/user, not a site inventory without a site id. Do not assume a published SAGE site exists.

---

## Specific rescue of the *old* creation

Do these in order. Stop when a layer produces files. Log each miss in `artifacts/sage/rescue-log.md`.

### R0 — Copy what this sandbox still has (do first, 10 min)

From the Build workspace, take off-box:

```
docs/handoff/
src/components/sage/desk.tsx
src/data/cycle.ts
src/data/digest-pack.ts
src/data/x-crawl.ts
src/data/papers.ts
src/lib/digest-pack.ts
src/styles.css
artifacts/sage/CURRENT.json
attachments/
```

This is the lean 03 Sep rebuild plus operator dumps. It is not the 800-line desk. It is the only guaranteed tree.

### R1 — Windows workstation `speci.000` (highest chance of binaries)

App Builder never synced to this PC unless the operator downloaded a preview asset or a pack. Search anyway.

PowerShell (run as the operator):

```powershell
$names = @(
  'sage-desk.mp3','sage-brief.mp3','og.jpg','favicon.svg',
  'desk.tsx','cycle.ts','x-crawl.ts','x-hygiene.ts','cycle-compiler.ts',
  'digest-pack.ts','x-watchlist.ts','CURRENT.json','sage-digest-003.json',
  'sage-digest-003.md','site.json','x-crawl.json'
)
Get-ChildItem -Path C:\Users\speci.000, D:\, E:\ -Recurse -ErrorAction SilentlyContinue -Include $names |
  Select-Object FullName, Length, LastWriteTime |
  Export-Csv $env:USERPROFILE\Desktop\sage-rescue-hits.csv -NoTypeInformation
```

Also search by content (slower, Documents + Downloads + Desktop only):

```powershell
rg -l "applyHydrate|leadPolicy|SAGE://DESK|hf-cot-astra-depth" `
  $env:USERPROFILE\Documents, $env:USERPROFILE\Downloads, $env:USERPROFILE\Desktop
```

**What a hit means**

| File | Treat as |
|---|---|
| `desk.tsx` > 600 lines with pin legend + wave footer | **canonical UI** — replace the lean 299-line desk |
| `cycle-compiler.ts` + `x-hygiene.ts` + tests | **canonical logic** |
| `sage-desk.mp3` | remount to `public/` — do not regenerate unless corrupt |
| `og.jpg` 1200×630 | remount — brand pass already passed once |
| `sage-digest-003.json` | freeze pack numbers; do not re-invent counts |

If the CSV is empty, mark R1 MISS and continue. Do not spend a day on deeper drives.

### R2 — Browser downloads from the Grok preview pane

The preview chrome had a download control on Digest (“Download report / Download pack”). Check:

- `Downloads\sage-digest-003.json`
- `Downloads\sage-digest-003.md`
- any `*.tar.gz` / `handoff` from 02–04 Sep 2026

If found, those JSON packs beat reconstructed pin copy.

### R3 — Grok web chat export (recovers *text* of lost source, not git)

Export these conversations from grok.com (share or “copy conversation” if export is missing):

- Project folder **NEXUS SAGE digest LANE**
- Chat **GROK DAILY DIGEST**
- Any sibling titled SAGE / cycle 003 / voice desk

In the export, search for fenced blocks that start with:

```
export const CYCLE
export const CRAWL_AT
export function applyHydrate
export function classifyPost
export function leadPolicy
```

Save every fenced TypeScript block into `rescue/from-chat/` with the filename guessed from the first export line. Concatenate later; do not edit while extracting.

Also save image attachments named `cycle-003-brief.png` and voice-player screenshots. They are layout oracles.

### R4 — Grok Imagine / artifacts side-channel

Old brand pass wrote:

- `public/og.jpg` (1200×630, SAGE centered on `sage-hero.jpg`)
- `public/favicon.svg` (charcoal lamp)
- `src/lib/og/site.json` — name NEXUS SAGE, theme `0c1018` / later `07090c`

If Imagine history on the operator account still lists “SAGE brand-asset pass” (subagent `8dcb99cc-3090-4d66-9ba9-a438cd4f26fb`, 2026-09-02), re-download those images. They are not the app, but they skip a day of art.

Voice files were mounted as `public/sage-desk.mp3` (~293 KB edge-tts Ava/Andrew). Check Voice connector history / local TTS cache for `003.mp3` or `sage-brief.mp3`.

### R5 — Zo computer / Docker MCP / Modal

Only if that machine ever pulled an App Builder snapshot (unlikely). On Zo:

```bash
find /home /opt /var/lib/docker -iname '*sage-desk*' -o -iname 'cycle-compiler.ts' 2>/dev/null | head
docker ps -a --format '{{.Names}}' | rg -i 'sage|nexus'
```

MISS is the expected result. Record it.

### R6 — Hosted copies (Netlify / Vercel / Box / Drive)

- **GitHub:** already searched. No desk source under `user:specimba` for the unique symbols. Do not clone `NEXUS_SAGE` expecting `desk.tsx`.
- **Vercel / Netlify:** list projects/sites. A hit must contain `SAGE://DESK` or `cyc/003` in the HTML. View-source that URL and save `og.jpg` / `sage-desk.mp3` from `/public` paths if they still 200.
- **Google Drive / Box / Notion:** search `sage-digest-003`, `CURRENT.json`, `NEXUS SAGE`. Operator sometimes archives via Notion/MCP.

If a live URL still serves the old JS bundle, download it. The minified bundle is a last-resort decompile, not a preferred source.

### R7 — Reconstruct from this pack when R1–R6 miss

Use [02-PRODUCT-SPEC.md](02-PRODUCT-SPEC.md) + the lean tree + attachments. That is a **rebuild**, not a restore. Rules:

1. Keep `src/data/cycle.ts` lead `hf-incident`. Do not invent a prettier lead.
2. Re-author missing modules to the spec’s test list. Port names exactly (`applyHydrate`, `leadPolicy`, `classifyPost`) so a later R1 hit can drop in.
3. Do not regenerate podcast audio until R4 is MISS.
4. Three-wave footer numbers stay METR/OpenAI split. Do not blend scopes.

### R8 — Acceptance test that you rescued the *old* desk, not a cousin

All must be true:

- Pin 1 take still says Persistent-Sol did HF; Astra later hit OpenAI
- Digest has `unlockIf` on the lead file
- `applyHydrate` exists and refuses 0-over-live
- Pulse items include Curran `2094958903167680875` and Fort `2095107971433017510`
- Voice is a two-speaker mix, not `speechSynthesis` only
- `desk.tsx` has a pin legend and a wave footer (lean rebuild currently does **not** — if those are missing, you are still on the 03 Sep skeleton)

### R9 — After a successful rescue

```
git init
git add -A
git commit -m "sage-desk: rescued pre-wipe tree + handoff pack"
git tag v0.2.0-rescued
```

Keep the lean rebuild on a branch `rebuild-2026-09-03` so you can diff.

---

## Attachments that must travel with this pack

| File | Why |
|---|---|
| `openAIandHFsandboxOUTincidentCHATGPT56SOLconvo14.txt` | 1.2 MB dump that became Digest library |
| `openAIandHFsandboxOUTincidentCHATGPT56SOLconvo14grokLANE.txt` | Grok-lane cut of same incident |
| `omp-session-2026-09-01T01-05-28-060Z_….html` | OMP / Gemini-side digest automation log |
| `fancyTWEETScuration0209.txt` | 02 Sep URL list |
| `chrome_*.png` | Proof of aborted turns / stopped preview |

## Recommended VM layout

```
nexus-sage-desk/
  README.md
  docs/handoff/
  rescue/from-chat/          ← R3 extractions
  rescue/from-windows/       ← R1 copies
  attachments/
  artifacts/sage/
  src/
  public/og.jpg
  public/favicon.svg
  public/sage-desk.mp3
  skills/
```

## Process on the VM

- Compiler every 6h. Human locks numbers and hrefs.
- Ingest: X tools + HF `daily_papers`. No X Ads. No Missed-DNA-as-news.
- `startup.sh` is App Builder only. On the VM use systemd or a process manager.
- Persist `CURRENT.json` and crawl snapshots in git.

## What “done” looks like

- Brief: 3 labeled pins, wave footer, ALLOW/DENY, two open questions
- Pulse stamp < 18h, media present, rumor tags visible
- Digest plan executable
- Voice plays with a volume meter
- Hygiene + compiler + hydrate + cadence tests green
- Cycle 004 does not exist until the HF `unlockIf` fires
