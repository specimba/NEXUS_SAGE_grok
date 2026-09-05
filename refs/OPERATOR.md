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

- **Cron every 6h (VM):**
  ```cron
  0 */6 * * * cd /workspace/nexus-sage/desk && /usr/local/bin/bun run digest:tick >> /workspace/nexus-sage/logs/digest-tick.log 2>&1
  ```
  Optional companion ingest: `30 */6 * * *` → `bun run ingest` → `logs/ingest.log` (same `cd`).
- **Install helper:** `desk/scripts/install-cron.sh` **or** `desk/ops/crontab.example` (idempotent; prefer `$(command -v bun)`).
- **Logs:** `/workspace/nexus-sage/logs/` (create if missing).
- **Manual proof:** double `bun run digest:tick` → write then HOLD.

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

*Ops desk · phosphor · keep disk truth · free providers only.*
