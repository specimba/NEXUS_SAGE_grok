# Pack dual-home — latest export

**UTC:** 20260907T065851Z  
**Pack:** `sage-pack-003-20260907T065851Z.tar.gz`

| Home | Path |
|------|------|
| Primary (VM) | `/workspace/nexus-sage/packs/sage-pack-003-20260907T065851Z.tar.gz` |
| Desk mirror | `/workspace/nexus-sage/desk/packs/sage-pack-003-20260907T065851Z.tar.gz` |
| Operator | Windows `Downloads\\nexus-sage-packs\\` or Drive — see `P2-EXPORT-IMPORT.md` |

**Locks:** cycle `003` · lead `hf-incident` · `sol_ne_astra` · no `004` without primary  

**Digest cadence:** A2 WROTE · pack_id `2026-09-07T06`  

**Crawl / ingest:** `2026-09-07T01:29:12Z`  

**sha256 (archive):** `7fce4d0eb5a4f1c02547ccdd510aa5570bcccb1d87c842612e62a467b927c577`  
**manifest sha256:** `see archive`  

**Commands:** `bun run pack:export` · `bun run a2:tick` · `bun run digest:tick` · `bun run ingest`

**A2 note:** unattended DUE→WROTE→dual-home · Istanbul weekday window (+09:00 catch-up) · no overnight  

**Soft-fails:** x-session-taste `login_wall` skip-stamped (taste empty · desk boots · briefEligible:false) — see ingest-last / X-SESSION-TASTE-DRY-RUN.md

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
