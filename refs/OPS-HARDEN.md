# OPS-HARDEN — VM cadence + wipe drill (APPROVED)

**Architect approve:** YES · **Not a new HTTP wire**  
**Implement:** Coder (cron helper + wipe re-run) · **Scout:** `OPERATOR.md` · **Gate:** Reviewer  
**Locks:** cycle `003` · lead `hf-incident` · free only · no `004` · no HF HTML · no paid X

## Goal

Make Digest cadence survive outside the browser: schedule `digest:tick` every 6h on the VM, keep packs dual-homed, prove wipe→import still restores Brief.

## Cron / schedule (VM-real)

From `desk/` (absolute path on this VM):

```cron
# NEXUS SAGE — Digest organism every 6h (UTC or CRON_TZ=…)
0 */6 * * * cd /workspace/nexus-sage/desk && /usr/local/bin/bun run digest:tick >> /workspace/nexus-sage/logs/digest-tick.log 2>&1
```

Optional companion (off-peak ingest, not required for PASS):

```cron
30 */6 * * * cd /workspace/nexus-sage/desk && /usr/local/bin/bun run ingest >> /workspace/nexus-sage/logs/ingest.log 2>&1
```

### Coder deliverables

| Item | Spec |
|------|------|
| Helper | `desk/scripts/install-cron.sh` **or** `desk/ops/crontab.example` — idempotent install / copy-paste |
| Logs dir | `/workspace/nexus-sage/logs/` (create if missing) |
| Bun path | Detect `$(command -v bun)` in the helper; don’t hardcode if avoidable |
| Docs | Point `OPERATOR.md` cron section at this file + the helper |
| Idempotent | Re-running install must not duplicate identical cron lines |

Manual proof without waiting 6h:

```bash
cd /workspace/nexus-sage/desk
bun run digest:tick          # writes or HOLD
bun run digest:tick          # must HOLD if within window
```

Truth files: `artifacts/sage/digest-last.json` · `artifacts/sage/packs/*.md|json`

## Wipe-drill pointer (re-run once this pulse)

Follow formal checklist:

1. `refs/P2-ACCEPT.md` done-whens  
2. `packs/WIPE-DRILL.md` / `desk/packs/WIPE-DRILL.md`  
3. Append evidence to `refs/P2-ACCEPT-EVIDENCE.md` (timestamp + pack id)

Expect: export → wipe CURRENT/data → `check:current` FAIL → import → `003` / `hf-incident` → tests green.

## Operator order (see also `OPERATOR.md`)

1. `bun run ingest`  
2. `bun run digest:tick`  
3. `bun run pack:export` (dual-home)  
4. On disaster: `bun run pack:import -- <pack>`

## Done when (Reviewer)

- [x] Cron helper or `crontab.example` exists and documents 6h `digest:tick`
- [x] Double `digest:tick` shows write then HOLD (or evidence already in Digest cadence stamp)
- [x] Wipe drill re-run evidenced this pulse
- [x] Locks unchanged · no new HTTP providers · no `004`

### Reviewer stamp — 2026-09-04T09:21Z (Reviewer Gürok)

**OPS-HARDEN PASS**

Evidence:
- `desk/ops/crontab.example` + `desk/scripts/install-cron.sh` (idempotent, bun detect)
- double tick: WROTE then HOLD
- wipe re-run pack `sage-pack-003-20260904T092050Z` evidenced in `P2-ACCEPT-EVIDENCE.md`
- 142/142 · pins `003`/`hf-incident` · no new HTTP providers · no `004`

## Non-goals

- HF `/papers` HTML · Reddit · Fox-IT already done · Skin token churn · inventing Brief pins
