# OPERATOR — NEXUS SAGE cheat-sheet

**OPS-HARDEN · cycle `003` · lead `hf-incident` · Sol≠Astra · stigmergy=`drop` · free only · no `004`**

Run all commands from `desk/` (`/workspace/nexus-sage/desk`).

---

## 1. Quick start (pipeline order)

| # | Script | Command |
|---|--------|---------|
| 1 | free ingest | `bun run ingest` |
| 2 | digest cadence | `bun run digest:tick` |
| 3 | pack export | `bun run pack:export` |

Restore: `bun run pack:import -- <path-to-sage-pack-*.tar.gz>`

---

## 2. Ingest

- **What:** Free providers only (HF `daily_papers`, arXiv, HN, lab RSS, security RSS, GitHub shelf, OpenAlex, Crossref, **Wikidata DENY grounding**). See `FREE-PROVIDERS.md` / `WIRE-WIKIDATA-DENY.md`. Never Brief / never Pulse lead.
- **Soft-fail:** One provider fail (429/403/5xx) does **not** abort — stamp still writes; check soft_fail flags in last stamp.
- **Stamp / truth:** `desk/artifacts/sage/ingest-last.json` (+ patches `CURRENT.json` / `CRAWL_AT`).
- **Never:** paid X, Reddit, HF `/papers` HTML, inventing Brief pins or cycle `004`.

---

## 3. digest:tick

| State | Rule | Action |
|-------|------|--------|
| **HOLD** | `now < next_at` in `digest-last.json` | exit 0 no-op |
| **DUE** | overdue / missing due file | rebuild organism → write packs + update due file |

**Outputs (VM-real):**

| Path | Role |
|------|------|
| `desk/artifacts/sage/packs/YYYY-MM-DDTHH.{json,md}` | machine plan + human report |
| `desk/artifacts/sage/digest-003.{json,md}` | cycle digest twin (for pack:export) |
| `desk/artifacts/sage/digest-last.json` | cadence truth (`last_at` / `next_at` / `pack_id`) — **not** localStorage |

**Locks tick must not break:** lead=`hf-incident` · cycle=`003` · stigmergy=`drop` · no civilizations in non-Dropped · Brief pins unchanged · append-only evidence/refs from Scout field map (`SCOUT-DIGEST-FIELD-MAP.md`).

---

## 4. Pack export

| Item | Spec |
|------|------|
| Name | `sage-pack-<cycle>-<UTC>.tar.gz` e.g. `sage-pack-003-20260904T091125Z.tar.gz` |
| Primary | `/workspace/nexus-sage/packs/` |
| Desk mirror | `/workspace/nexus-sage/desk/packs/` |
| Operator off-wipe | Windows `Downloads\nexus-sage-packs\` or Drive — see `P2-EXPORT-IMPORT.md` |

Dual-home required (sandbox-only = FAIL). Import/restore + wipe-drill: `P2-EXPORT-IMPORT.md` · `P2-CONTRACT.md` · `desk/packs/WIPE-DRILL.md`.

---

## 5. Hygiene (one-liner)

Banned nouns / Brief pin lock: Digest **never invents Brief pins**; scrub civilizations · Sol=Astra flatten · MIT stigmergy-as-breach · toolkit-as-pin — details in `SCOUT-DIGEST-FIELD-MAP.md`.

---

## 6. Ops pointers

Source of truth: **`OPS-HARDEN.md`** (Architect APPROVED).

- **Stale desk chrome:** If UI looks like 90s gray pills / amber frontpage → stale `:3000` server; kill it, `bun run build && bun run start`.
  Guard: `bun run visual:check` (fails amber theme / missing `[01]` lanes).

- **Standing cron (A1–A3):** see **§8 A1–A3 automation** below · `refs/OPS-A1-A3-AUTOMATION.md`.
- **Install helper:** `desk/scripts/install-cron.sh` (idempotent; backups under `logs/cron-backups/`) · example `desk/ops/crontab.example`.
- **Logs:** `/workspace/nexus-sage/logs/` (`a1-stale.log` · `a2-digest.log`).
- **Manual proof:** double `bun run digest:tick` → write then HOLD · `bun run a2:tick` for DUE→export path.

**Stale server / build chip:** Footer shows `.next/BUILD_ID` + boot ISO (`data-sage-build` / `data-sage-boot`). If UI looks like gray pills or crawl stamp is stuck → kill `:3000`, `bun run build && bun run start`, then `bun run visual:check`. Dual-home latest: see `PACK-DUAL-HOME.md`.
- **Wipe-drill (this pulse):** `P2-ACCEPT.md` done-whens → `desk/packs/WIPE-DRILL.md` → append evidence to `P2-ACCEPT-EVIDENCE.md`. Also `P2-EXPORT-IMPORT.md` § restore-drill.
- **Cadence wire:** `WIRE-DIGEST-CADENCE.md`.

---

## 7. Out of scope / NEVER

- Cycle **`004`** (needs new primary — not this desk)
- HF `/papers` HTML wire (deferred)
- Paid X / Twitter API / bearer firehose
- Reddit live (blocked 403)
- Inventing Brief pins from Pulse/RSS/shelf
- Changing Skin tokens / Sol=Astra flatten / civilizations in lead+companion+rest

---

## 8. A1–A3 standing automation (Europe/Istanbul)

**Source of truth:** `OPS-A1-A3-AUTOMATION.md` · install via `desk/scripts/install-cron.sh`.

| Track | Window | Cron (Istanbul) | Command | Notes |
|-------|--------|-----------------|---------|-------|
| **A1** STALE ingest | Mon–Fri ~09–17 | `*/30 9-16 * * 1-5` | `bun scripts/a1-stale-ingest.mjs` | **No FORCE** on standing cron · natural STALE≥12h gate only · dual-home on ingest |
| **A2** Digest DUE | Mon–Fri ~09–17 | `*/6 9-16 * * 1-5` | `bun run a2:tick` | `digest:tick` then `pack:export` **only if WROTE** |
| **A3** Harden | — | — | `install-cron.sh` | Idempotent · CRON_TZ · backups · this section |

```cron
CRON_TZ=Europe/Istanbul
*/30 9-16 * * 1-5 cd /workspace/nexus-sage/desk && bun scripts/a1-stale-ingest.mjs >> /workspace/nexus-sage/logs/a1-stale.log 2>&1
*/6 9-16 * * 1-5 cd /workspace/nexus-sage/desk && bun run a2:tick >> /workspace/nexus-sage/logs/a2-digest.log 2>&1
```

### FORCE dry-run (A1 operator only — never on crontab)

```bash
cd /workspace/nexus-sage/desk
DRY_RUN=1 FORCE=1 bun scripts/a1-stale-ingest.mjs   # plan only
FORCE=1 bun scripts/a1-stale-ingest.mjs             # bypass age gate once
```

Standing cron must **omit** `FORCE=1` / `--force`.

### Pause / uninstall

```bash
crontab -l > /workspace/nexus-sage/logs/cron-backups/manual-pause.bak
# edit out A1/A2 lines, or: crontab -r   # nuclear — removes ALL user cron
# re-install later: desk/scripts/install-cron.sh
```

### FAIL bans (Reviewer list = Architect lock)

1 stamp-truth lag · 2 Brief pollution · 3 paid X · 4 lock break · 5 dual-home miss · 6 silent soft-fail · 7 overnight spam · 8 craft/WIRE creep

**Hard bans:** no paid X · no new `WIRE-*` · no Brief pin invent · no overnight `@every` · no weekend standing firehose · no cycle `004`.


## 9. Cron-less durability (VM gap · 2026-09-11)

**Host fact:** `crontab` binary **missing** · `cron` package not installed · apt **Candidate: (none)** on this Agent Computer. Standing A1/A2 crontab cannot install.

**Fallback:** Director/Coder **ops pulse** or Grok Bot routine (`CRON_TZ=Europe/Istanbul`, Mon–Fri 09–16, `@every 30m`) — see `OPS-CRONLESS-DURABILITY.md`.

| Job | Pulse action |
|-----|--------------|
| A1 | age ≥12h → `bun scripts/a1-stale-ingest.mjs` (**no FORCE**) |
| A2 | `next_at` ≤ now → `bun run a2:tick` |
| visual | after rebuild → `bun run visual:check` |

When `crontab` returns: `desk/scripts/install-cron.sh` · example `desk/ops/crontab.example`.

**Fri afternoon / outside A2 window:** If `next_at` lands after Istanbul 16:00 on a weekday (or weekend), A2 stays HOLD until the next in-window tick — typically **Mon morning catch-up**. Bot routines cover A1/A2 while host cron is missing. Evidence: 2026-09-11T12:29:52Z dry `a2:tick` → HOLD (`next_at=2026-09-11T15:20:40Z` within cadence; due time Fri ~18:20 Istanbul → Mon catch-up). See `OPS-CRONLESS-DURABILITY.md`.

**Tooling note:** ImageMagick is apt (`imagemagick` / `convert`). Playwright screenshot plugin is a **Grok Bot plugin**, not apt.


*Ops desk · phosphor · keep disk truth · free providers only.*
