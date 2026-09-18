# Pack dual-home — latest export

**UTC:** 20260918T093848Z  
**Pack:** `sage-pack-003-20260918T093848Z.tar.gz`

| Home | Path |
|------|------|
| Primary (VM) | `/workspace/nexus-sage/packs/sage-pack-003-20260918T093848Z.tar.gz` |
| Desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260918T093848Z.tar.gz` |
| Operator | Windows `Downloads\\nexus-sage-packs\\` or Drive — see `P2-EXPORT-IMPORT.md` |

**Locks:** cycle `003` · lead `hf-incident` · `sol_ne_astra` · no `004` without primary  

**Digest cadence:** A2 WROTE · pack_id `2026-09-18T09`  

**Crawl / ingest:** `2026-09-12T04:40:16Z`  

**sha256 (archive):** `99b40e9137720780a20adee1c0a35a2a8eeeb760917bf397d3a6d7eb9033af96`  
**manifest sha256:** `see archive`  

**Commands:** `bun run pack:export` · `bun run a2:tick` · `bun run digest:tick` · `bun run ingest`

**A2 note:** unattended DUE→WROTE→dual-home · Istanbul weekday window (+09:00 catch-up) · no overnight  

**Soft-fails:** (see ingest-last / freeze note — A2 does not ingest)

### Reviewer stamp — pending

(Factual dual-home above from Coder A2 auto-export. Reviewer owns PASS/FAIL stamp.)


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

### Reviewer stamp — 2026-09-11T13:12Z (Reviewer Gürok)

**PACK-DUAL-HOME PASS** — wipe-drill pack `sage-pack-003-20260911T130832Z` · sha256 `cafe4821…` dual-home identical · locks `003`/`hf-incident`.

### Reviewer stamp — 2026-09-11T15:29Z (Reviewer Gürok)

**Fri A2 FORCE-WINDOW PASS** · **PACK-DUAL-HOME PASS** (`152745Z`) vs FAIL 1–8.

Evidence:
- Log: SKIP outside 09–16 → `A2_FORCE_WINDOW=1` WROTE `pack_id=2026-09-11T15` → dual-home
- Pack `sage-pack-003-20260911T152745Z.tar.gz` · sha256 `ab73aab0ebe55a3ae48fd136b6070a10e562178c3dbd924d8369846c0293165d` identical both homes
- Locks `003`/`hf-incident` · crawl unchanged `09:29:29Z` · OpenAlex soft `429` honest
- `visual:check` OK · brand OK · next_at `21:27:45Z` (Mon catch-up for standing)
- One-shot only — not overnight firehose

**P6 / new WIRE HOLD.**

### Reviewer stamp — 2026-09-11T16:58Z (Reviewer Gürok)

**Flake-fix RECONFIRM PASS** (`56c7df1`) + **FAIL 1–8 still green on `152745Z`**.

Evidence:
- Full `bun test` **205/205** after timeout bumps (failclosed 60s · gnews 30s) · timeouts only · no product/WIRE change
- Pack `sage-pack-003-20260911T152745Z` dual-home sha256 `ab73aab0…` unchanged · locks `003`/`hf-incident`
- OpenAlex soft `429` honest · `visual:check` OK · brand OK · crawl `09:29:29Z`

**P6 / new WIRE HOLD.** Mon catch-up path stands.

### Reviewer stamp — 2026-09-11T18:02Z (Reviewer Gürok)

**rss-security flake RECONFIRM PASS** (`a978633`) + **FAIL 1–8 still green on `152745Z`**.

Evidence:
- Tip timeouts-only · Coder prove **205/205** · Project Zero / parseRssOrAtomCapped / fetchRssSecurity @ 30s
- Pack `152745Z` dual-home sha256 `ab73aab0…` · locks `003`/`hf-incident` · OpenAlex soft `429` honest
- `visual:check` OK · brand OK · crawl `09:29:29Z`

**P6 / new WIRE HOLD.** Weekend quiet → Mon catch-up.

### Reviewer stamp — 2026-09-12T04:46Z (Reviewer Gürok)

**WEEKEND STALE CATCH-UP PASS** · **PACK-DUAL-HOME PASS** (`044233Z`) vs FAIL 1–8.

Evidence:
- Pack `sage-pack-003-20260912T044233Z.tar.gz` · sha256 `7c412e6503b8a2bb756a11afc3df9fda901eb299067c27a3e6b60f111584ba66` dual-home identical
- Crawl LIVE `2026-09-12T04:40:16Z` FRESH = CURRENT + `visual:check` + footer
- Digest WROTE `pack_id=2026-09-12T04` · next_at `10:40:16Z`
- Locks `003`/`hf-incident` · OpenAlex soft `429` honest · GNews spice 8 · `brief=false`/`pulse_lead=false`
- brand OK · further Sat firehose HOLD → Mon window

**P6 / new WIRE / Voice / `004` HOLD.**
