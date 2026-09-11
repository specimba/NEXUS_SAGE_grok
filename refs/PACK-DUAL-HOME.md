# Pack dual-home — latest export

**UTC:** 20260911T130832Z  
**Pack:** `sage-pack-003-20260911T130832Z.tar.gz`

| Home | Path |
|------|------|
| Primary (VM) | `/workspace/nexus-sage/packs/sage-pack-003-20260911T130832Z.tar.gz` |
| Desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260911T130832Z.tar.gz` |
| Operator | Windows `Downloads\nexus-sage-packs\` or Drive — see `P2-EXPORT-IMPORT.md` |

**Locks:** cycle `003` · lead `hf-incident` · `sol_ne_astra` · no `004` without primary  

**Digest cadence:** unchanged by P2 wipe-drill (Brief pins / digest tick not mutated)  

**Crawl / ingest:** `2026-09-11T09:29:29Z` (freeze-safe restore, no re-ingest)  

**sha256 (archive):** `cafe4821fbbbb80bfeed27974a510017a26dc628d239c4071dd6ebe8734de54c`  
**manifest sha256:** `98954fae7a6091e10368d7763e2762c71e7a117f0d7031a06f43cc9c76867667`  

**Commands:** `bun run pack:export` · `bun run pack:import -- <path>` · `bun run digest:tick` · `bun run ingest` · `FORCE=1 bun scripts/a1-stale-ingest.mjs`

**P2 wipe-drill note:** post-P5 freeze-safe wipe→import · dual-home bytes identical · F1–F5 fail-closed proven · prior twin `sage-pack-003-20260911T130710Z` also evidenced · cron-less  

**Soft-fails STAMPED:** openalex HTTP 429 (pre-existing; not introduced by drill)

### Reviewer stamp — pending

(Factual dual-home above from Coder A1 auto-ingest. Reviewer owns PASS/FAIL stamp.)


### Reviewer confirm — pending CLEARED (see 2026-09-11T09:24Z)

(Factual dual-home above from Coder A2 auto-export. Reviewer owns PASS/FAIL stamp.)


### Reviewer confirm — 2026-09-07T07:07Z

**Header pending CLEARED** — A2 PASS @07:00 (`065851Z`). Soft-fail: x-session-taste `login_wall` skip-stamped (desk boots · Brief false).


### Reviewer confirm — 2026-09-07T02:07Z

**Header pending CLEARED.** Authoritative stamp is **2026-09-07T01:33Z** (A1 pack `012948Z` PASS). Home 2b operator copy remains PENDING (no re-ask) — not a Reviewer stamp block.


### Reviewer stamp — 2026-09-06T06:46Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS** (archive) · **LIVE crawl soft FAIL** until rebuild.

Evidence:
- Pack `sage-pack-003-20260906T064459Z.tar.gz` dual-homed identical (7677 B)
  - sha256: `dabbe5ac1e913c1252a9e070102a3c79abe9b00cdcb9e0258f17f4bf37bda59b`
  - Primary `/workspace/nexus-sage/packs/…` · Desk `/workspace/nexus-sage/desk/packs/…`
- CURRENT / ingest crawl **`2026-09-06T06:44:31Z` FRESH** · locks `003` / `hf-incident` · Sol≠Astra · no `004`
- Digest HOLD still `pack_id=2026-09-06T06` →`12:42:06Z`
- brand-check OK

**Soft FAIL:** `visual:check` still reports crawl `2026-09-05T18:41:56Z` / build `czLywEBR…` — live `:3000` lagging disk. @Coder Gürok: rebuild+restart so LIVE matches `06:44:31Z`, then I clear.

**Freeze stays ON.**

### Reviewer clear — 2026-09-06T06:49Z (Reviewer Gürok)

**LIVE crawl soft FAIL CLEARED.**

- `visual:check` OK · crawl=`2026-09-06T06:44:31Z` · build=`_RJ0QvYooUJkzB8qwkjnq` · phosphor/`[01]`
- Pack `064459Z` PASS stands
- Eye PNG formal clear waits UX recapture vs this crawl/build

**Freeze stays ON.**

### Reviewer stamp — 2026-09-06T12:50Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS**

Evidence:
- Pack `sage-pack-003-20260906T124832Z.tar.gz`
  - Primary: `/workspace/nexus-sage/packs/sage-pack-003-20260906T124832Z.tar.gz` (7680 B)
  - Desk: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260906T124832Z.tar.gz` (7680 B)
  - sha256 (identical): `0cc70cc28666241ff1ba7607d4793dfa7c8403302ba1d3761e817a146d7d5fac`
- Digest WROTE `pack_id=2026-09-06T12` · HOLD→`18:48:09Z`
- `visual:check` OK · brand-check OK · crawl `06:44:31Z` (~6.1h FRESH) · build `eXLEBCUH_FQesDgUMtOc0`
- Locks `003` / `hf-incident`

**Freeze stays ON.**

### Reviewer stamp — 2026-09-06T18:58Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS**

Evidence:
- Pack `sage-pack-003-20260906T185617Z.tar.gz`
  - Primary: `/workspace/nexus-sage/packs/sage-pack-003-20260906T185617Z.tar.gz` (7672 B)
  - Desk: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260906T185617Z.tar.gz` (7672 B)
  - sha256 (identical): `32aa5afb9d542d65b4d2d2bea579a24978968742597161532215f30ddecef7de`
- Digest WROTE `pack_id=2026-09-06T18` · HOLD→`2026-09-07T00:56:10Z`
- `visual:check` OK · brand-check OK · build `eXLEBCUH_FQesDgUMtOc0`
- Locks `003` / `hf-incident`

**Crawl watch:** still `2026-09-06T06:44:31Z` (~12.3h FRESH) — **STALE risk before 18h**. @Coder freeze-safe ingest after this stamp.

**Freeze stays ON.**

### Reviewer stamp — 2026-09-06T19:04Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS** + **LIVE crawl clear**.

Evidence:
- Pack `sage-pack-003-20260906T190125Z.tar.gz` dual-homed identical (7673 B)
  - sha256: `924152b4b96219e977d68699956c1c1ce6f7595b415a590042169f21135c78d9`
  - Primary `/workspace/nexus-sage/packs/…` · Desk `/workspace/nexus-sage/desk/packs/…`
- Crawl LIVE **`2026-09-06T19:00:53Z` FRESH** = CURRENT + `visual:check` + footer (STALE risk cleared)
- Digest HOLD `pack_id=2026-09-06T18` →`00:56:10Z`
- `visual:check` OK · brand-check OK · build=`o3wXMWl36IdNI5Zp0qZon` · phosphor/`[01]`
- Locks `003` / `hf-incident` · OpenAlex 429 soft-fail only (Coder)

Eye PNG soft PASS @19:43Z (`VISUAL-PROOF-v4-pins-live.png` @19:10 · sha `cec835ef…`) vs crawl `19:00:53Z` / build `Rk0xEraG…`.

**Freeze stays ON.**

### Reviewer stamp — 2026-09-07T01:00Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS**

Evidence:
- Pack `sage-pack-003-20260907T005844Z.tar.gz`
  - Primary: `/workspace/nexus-sage/packs/sage-pack-003-20260907T005844Z.tar.gz` (7675 B)
  - Desk: `/workspace/nexus-sage/desk/packs/sage-pack-003-20260907T005844Z.tar.gz` (7675 B)
  - sha256 (identical): `80c0659a0fb3d2b324c12726531e7f5444792fbb012e611eb10b78122618356d`
- Digest WROTE `pack_id=2026-09-07T00` · HOLD→`06:58:41Z`
- `visual:check` OK · brand-check OK · crawl `19:00:53Z` (~6.0h FRESH) · build `Rk0xEraGQhDXc3X0BbCPE`
- Locks `003` / `hf-incident`

**Freeze stays ON.**

### Reviewer stamp — 2026-09-07T01:33Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS** (A1 dry-run pack).

- Pack `sage-pack-003-20260907T012948Z.tar.gz` · sha256 `22bb3aac6bab79975f55dc53d0ec1fdc329cab2b20b587b325066788c22d9001`
- Crawl LIVE `2026-09-07T01:29:12Z` · build `ytC06pDObmdfZOy3YLDs0`
- Locks `003` / `hf-incident` · A1 dry-run PASS

**Freeze stays ON** for WIRE. Track A automation open.

### Reviewer stamp — 2026-09-07T07:00Z (Reviewer Gürok)

**A2 UNATTENDED PASS** · **PACK-DUAL-HOME PASS** vs FAIL 1–8.

Evidence:
- Pack `sage-pack-003-20260907T065851Z.tar.gz` dual-homed identical (7667 B)
  - sha256: `7fce4d0eb5a4f1c02547ccdd510aa5570bcccb1d87c842612e62a467b927c577`
- Digest WROTE `pack_id=2026-09-07T06` · HOLD→`12:58:51Z` · Istanbul Mon **09:58** (not `0 9` no-op)
- `a2-digest.log`: SKIP outside window → HOLD in-window → WROTE→pack:export→OK
- Crawl unchanged `01:29:12Z` (A2 does not ingest) · `visual:check` OK · brand OK
- Locks `003` / `hf-incident` · Sol≠Astra · no `004` · no X · no FORCE · no WIRE

| FAIL | Result |
|------|--------|
| 1 stamp-truth | PASS (A2 no ingest; crawl honest) |
| 2 Brief pollution | PASS |
| 3 paid X | PASS |
| 4 lock break | PASS |
| 5 dual-home | PASS |
| 6 soft-fail wash | PASS (honest WROTE log) |
| 7 overnight spam | PASS (window SKIP worked; WROTE in 09–16) |
| 8 craft/WIRE | PASS |

**GO** @Coder: X-session dry-run vs FAIL 1–8 + Scout allowlist. Land HOLD until that dry-run PASSes.

### Reviewer stamp — 2026-09-11T09:24Z (Reviewer Gürok)

**A2 PACK-DUAL-HOME PASS** (`092040Z`) vs FAIL 1–8 (archive).

Evidence:
- Pack `sage-pack-003-20260911T092040Z.tar.gz` dual-homed identical (7673 B)
  - sha256: `1e3fd8f2a210131f5d7d31928ce5abe4eceb1059cb398b8c910f80823f4e1a0e`
- Digest WROTE `pack_id=2026-09-11T09` · HOLD→`15:20:40Z`
- Locks `003` / `hf-incident` · Sol≠Astra · no `004`

**SOFT HOLD (post-boot):**
- Crawl disk STALE ~104h (`2026-09-07T01:29:12Z`) — A1 natural STALE owed after `:3000` returns
- `visual:check` / live=disk deferred until Coder `bun install` + start
- Host `crontab` missing — ops via pulse/Bot until cron returns (`OPS-CRONLESS-DURABILITY`)

**X-session:** Canberk login **done** noted — dry-run #2 after desk green + A1. Full land still HOLD until that PASS.

**FREE-PULSE rank** (not Bluesky): 1 OpenAlex backoff · 2 lab/HF RSS · 3 HN deepen · 4 skip — or say **GO default** 1→2→3.

### Reviewer stamp — 2026-09-11T09:33Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS** + **LIVE=DISK PASS** (post-revive A1).

Evidence:
- Pack `sage-pack-003-20260911T093002Z.tar.gz` dual-homed identical (7665 B)
  - sha256: `271313533c19216016bbd9ab6d1e6ddd8e8a4e7b0350b710325eb0f50c410ba2`
- Crawl LIVE `2026-09-11T09:29:29Z` FRESH = CURRENT + `visual:check` + footer (cleared ~104h STALE)
- `visual:check` OK · brand OK · build=`s2-ECK6b9Hd1O6b_ve6KS` · phosphor/`[01]`
- Locks `003` / `hf-incident` · OpenAlex 429 soft-fail stamped honest · Brief=false
- Digest HOLD `pack_id=2026-09-11T09` →`15:20:40Z`
- Host `crontab` missing — Bot-routine cron-less OK for now

Prior `092040Z` archive PASS stands. **Armed for X dry-run #2** gate (login done).
