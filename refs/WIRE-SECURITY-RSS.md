# Wire-spec #4 — Security lab RSS (APPROVED)

**Architect approve:** YES · **Fox-IT extend APPROVED 2026-09-04** (clears deferral)  
**Implement:** Coder · **Scout:** samples already in GO pack below  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **never Brief lead** · **never Pulse lead from Fox-IT alone** · **no cycle `004`**

## Goal

Cyber / agent-risk signal for Pulse + Digest support refs + shelf. Pairs with watchlist (`trailofbits`) and HF incident context. Does **not** change Brief pins or invent `004`.

## Feeds (first-party GET only)

| Lab | Feed URL | Status |
|-----|----------|--------|
| Trail of Bits | `https://blog.trailofbits.com/feed/` | **Must-wire** |
| **Fox-IT** | `https://blog.fox-it.com/feed/` | **Must-wire (APPROVED extend)** · `lab: "fox-it"` · NCC subsidiary filling broken NCC RSS gap |
| Google Project Zero | **Use** `https://projectzero.google/feed.xml` (Atom) | **Must-wire** — stream/first N only (~13MB full feed) |
| NCC Group Research | `https://www.nccgroup.com/us/research-blog/feed/` | **Skip** — HTML/404 (soft-fail/log only) |
| Google Security Blog (optional) | TAG/Security Atom if Scout confirms 200 | Optional — not required for PASS |

No login walls. No rsshub. Toolkit product pages still go through `classifyUrl` → shelf (existing rule).

## Rate

- Sequential · ≤1 req / 2s  
- Cache 6h under `artifacts/sage/rss-sec-cache/<lab>.xml`  
- UA: `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)`  
- 429/5xx → skip feed, continue ingest

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/rss-security.ts` | fetch/parse/toItems (reuse rss-labs primitives if clean) |
| ingest hook | After lab RSS; Pulse + shelf + Digest-ref candidates |
| `__tests__/rss-security.test.ts` | Fixtures · DENY · `briefEligible: false` |

## Schema

```ts
type SecurityRssItem = {
  id: string
  lab: "trailofbits" | "fox-it" | "projectzero" | "ncc" | "google-sec"
  title: string
  link: string
  published: string
  summary: string          // ≤400
  source: "rss-security"
  shelfOnly: boolean
  pulseEligible: boolean   // after classifyPost
  briefEligible: false     // locked
  digestRefOk: true        // may appear as Digest support/wire
}
```

## Placement

| Lane | Allowed |
|------|---------|
| Pulse | YES after classify/DENY |
| Digest refs | YES `support` / `wire` |
| Shelf | YES (esp. toolkit-adjacent) |
| Brief lead / companion pins | **NO** |

## Hygiene

- `classifyPost` / banned nouns / flatten (Sol≠Astra)  
- Exploit how-to sensationalism → rumor/DENY tag, still never Brief  
- Never bump `CURRENT.id`

## Done when

- [x] ≥2 of 3 must-wire feeds enrich on `bun run ingest` (NCC out per Director — ToB + Project Zero both live)
- [x] `ingest-last.json` shows `rss_security.brief=false`
- [x] Brief pins unchanged (`003` / `hf-incident`)
- [x] Zero credentials · tests green

### Reviewer stamp — 2026-09-04T06:49Z

**WIRE-SECURITY-RSS PASS** (ToB + Project Zero)

Evidence:
- `bun test` → 87/87 (incl. `rss-security.test.ts` Brief=false · SECURITY_FEEDS = trailofbits + projectzero only)
- `ingest-last.json` → `rss_security.brief=false`, `pulse_only=true`, feeds ToB + PZ
- NCC / Fox-IT not wired · no `004`


## Fox-IT extend — Done when (this pulse)

- [x] `SECURITY_FEEDS` includes `fox-it` → `https://blog.fox-it.com/feed/`
- [x] Fixture `rss-foxit-remotepe.xml` · `briefEligible === false`
- [x] UA/rate/cache parity with ToB/PZ (`NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)` · ≤1/2s · 6h cache)
- [x] Soft-fail 404/5xx on Fox-IT does not fail ingest
- [x] `ingest-last.json` → `rss_security.brief=false` · fox-it present or soft-skipped
- [x] Brief pins unchanged (`003` / `hf-incident`) · no `004`

### Architect stamp — Fox-IT GO 2026-09-04T08:18Z

**APPROVED.** Coder unlocked. NCC stays skip. Crossref notes-only. Reddit blocked.

### Coder stamp — Fox-IT wired 2026-09-04T08:20Z

**PASS.** `SECURITY_FEEDS` = trailofbits + fox-it + projectzero. Fixture `rss-foxit-remotepe.xml`. Ingest fox-it live 10 items. `brief=false`. Pins `003`/`hf-incident`. NCC skip. Pack `sage-pack-003-20260904T082053Z`.

### Reviewer stamp — 2026-09-04T08:21Z (Reviewer Gürok)

**Fox-IT extend PASS**

Evidence:
- `bun test src/lib/__tests__/rss-security.test.ts` → 14/14 (Fox-IT Brief=false · SECURITY_FEEDS = ToB + Fox-IT + P0 · NCC out)
- `ingest-last.json` → `rss_security.brief=false`, fox-it feed count 10, pulse_only
- pins `003` / `hf-incident` · FREE-PROVIDERS Already lists Fox-IT under Allowed

## Explicit defer

- Reddit public JSON — blocked/notes only  
- Crossref — notes-only until Architect cut  
- NCC first-party RSS — skip until XML returns  
- Cycle `004`


---

## Scout live samples (fetched 2026-09-04 · UA `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)`)

### 1. Trail of Bits — `https://blog.trailofbits.com/feed/` · HTTP **200** · RSS

Item A:
```
title: VMs won't contain cyber-capable agents
link:  https://blog.trailofbits.com/2026/08/26/vms-wont-contain-cyber-capable-agents/
date:  Wed, 26 Aug 2026 07:00:00 -0400
```
Item B:
```
title: State divergence enables unauthorized access
link:  https://blog.trailofbits.com/2026/08/25/state-divergence-enables-unauthorized-access/
date:  Tue, 25 Aug 2026 07:00:00 -0400
```
Mapped: `lab:"trailofbits"`, `briefEligible:false`, Pulse/Digest-refs after classifyPost. Highly relevant to SAGE HF/agent containment narrative — still **never Brief lead**.

### 2. Google Project Zero — `https://projectzero.google/feed.xml` · HTTP **200** · Atom

**Do not** rely on `googleprojectzero.blogspot.com/...` as canonical — it redirects to the Google feed (~13.2MB full history).

Trimmed entries:
```
title: A 0-click exploit chain for the Pixel 10: When a Door Closes, a Window Opens
link:  https://projectzero.google/2026/05/pixel-10-exploit.html
date:  2026-05-13T00:00:00-07:00

title: On the Effectiveness of Mutational Grammar Fuzzing
link:  https://projectzero.google/2026/03/mutational-grammar-fuzzing.html
date:  2026-03-05T00:00:00-08:00
```
**Rate/cache:** stream-parse / take first ≤25 entries; cache 6h; never load full 13MB into UI. Exploit how-to tone → DENY/rumor tag allowed; still never Brief.

### 3. NCC Group — first-party RSS **broken** (2026-09-04)

| URL | Result |
|-----|--------|
| `https://www.nccgroup.com/us/research-blog/feed/` | HTTP 404 / HTML |
| `https://research.nccgroup.com/feed/` | HTTP 200 but **HTML page**, not RSS (0 `<item>`) |
| `https://research.nccgroup.com/feed/atom/` | HTML |

**PASS rule still holds:** ≥2 of 3 must-wire → ToB + Project Zero is enough. Skip NCC fetch (log skip) until Scout/Architect re-verify XML.

#### Fox-IT sibling — **APPROVED** (see extend Done-when)

`https://blog.fox-it.com/feed/` · HTTP **200** · `lab:"fox-it"` · `source:"rss-security"` · `briefEligible:false`

### 4. Google TAG / Security Blog optional

`https://blog.google/threat-analysis-group/rss/` → HTTP **404** HTML today. Leave optional off PASS.

### Fixtures for Coder

`desk/src/lib/__tests__/fixtures/`:
- `rss-tob-vms-agents.xml` (trim 1–2 ToB items)
- `rss-pz-pixel10.atom` (1–2 Atom entries — **not** full 13MB dump)

Assert `briefEligible === false`; pin set stays `003` / `hf-incident`.

### Rate / UA reminder

- UA: `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)`
- Sequential ≤1 req / 2s
- Cache 6h under `artifacts/sage/rss-sec-cache/`
- PZ: prefer HEAD/range or early-exit parser — never block ingest on full feed download

---

## Scout Fox-IT GO pack (refreshed 2026-09-04T07:58Z)

**Architect APPROVED** — Coder may wire. Samples below are normative.

| | |
|--|--|
| Feed | `https://blog.fox-it.com/feed/` |
| HTTP | **200** · `application/rss+xml` · ~672KB |
| UA | `NEXUS-SAGE-desk/0.2 (free-ingest; security-rss)` |
| Rate | ≤1 req / 2s · cache 6h `artifacts/sage/rss-sec-cache/fox-it.xml` |
| Lab tag | `fox-it` · `source: "rss-security"` |
| Placement | Pulse / Digest-refs / shelf · `briefEligible: false` · never lead · no `004` |

### Live items (top 3)

```
title: RemotePE: The Lazarus RAT that lives in memory
link:  https://blog.fox-it.com/2026/05/22/remotepe-the-lazarus-rat-that-lives-in-memory/
date:  Fri, 22 May 2026 14:55:58 +0000

title: Three Lazarus RATs coming for your cheese
link:  https://blog.fox-it.com/2025/09/01/three-lazarus-rats-coming-for-your-cheese/
date:  Mon, 01 Sep 2025 13:00:00 +0000
```

### Fixture

`desk/src/lib/__tests__/fixtures/rss-foxit-remotepe.xml` (1–2 items) · assert `briefEligible === false` · pins stay `003` / `hf-incident`

### Still out

- NCC first-party RSS (HTML/404)
- Crossref (notes-only)
