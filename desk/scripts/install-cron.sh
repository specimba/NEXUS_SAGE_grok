#!/usr/bin/env bash
# NEXUS SAGE — idempotent cron install for A1–A3 (OPS-A1-A3-AUTOMATION)
# Locks: cycle 003 · lead hf-incident · free only · no 004 · no paid X · no WIRE
# Windows: Europe/Istanbul Mon–Fri ~09–17 · NO overnight · NO weekend · A1 never FORCE
set -euo pipefail

ROOT="/workspace/nexus-sage"
DESK="${ROOT}/desk"
LOG_DIR="${ROOT}/logs"
A1_LOG="${LOG_DIR}/a1-stale.log"
A2_LOG="${LOG_DIR}/a2-digest.log"
BACKUP_DIR="${LOG_DIR}/cron-backups"
MARKER_START="# NEXUS SAGE — A1–A3 standing automation"
MARKER_LEGACY="# NEXUS SAGE — Digest organism every 6h"

BUN="$(command -v bun || true)"
if [[ -z "${BUN}" ]]; then
  echo "error: bun not found on PATH (command -v bun)" >&2
  exit 1
fi

mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"

A1_LINE="*/30 9-16 * * 1-5 cd ${DESK} && ${BUN} scripts/a1-stale-ingest.mjs >> ${A1_LOG} 2>&1"
A2_LINE="*/6 9-16 * * 1-5 cd ${DESK} && ${BUN} run a2:tick >> ${A2_LOG} 2>&1"
A2_OPEN_LINE="0 9 * * 1-5 cd ${DESK} && ${BUN} run a2:tick >> ${A2_LOG} 2>&1"

existing="$(crontab -l 2>/dev/null || true)"

# Backup before mutate
ts="$(date -u +%Y%m%dT%H%M%SZ)"
backup="${BACKUP_DIR}/crontab-${ts}-$$.bak"
if [[ -n "${existing}" ]]; then
  printf '%s\n' "${existing}" > "${backup}"
  echo "backed up crontab → ${backup}"
else
  echo "(no prior crontab; skip backup file body)"
  : > "${backup}"
fi

# Drop prior NEXUS SAGE A1/A2/legacy digest/ingest lines — idempotent
filtered="$(printf '%s\n' "${existing}" | awk '
  # Block markers / section headers
  $0 ~ /^# NEXUS SAGE — A1–A3 standing automation/ { next }
  $0 ~ /^# NEXUS SAGE — Digest organism every 6h/ { next }
  $0 ~ /^# Optional companion/ { next }
  $0 ~ /^# A1 —/ { next }
  $0 ~ /^# A2 —/ { next }
  $0 ~ /^# Windows:/ { next }
  $0 ~ /^# Spec:/ { next }
  $0 ~ /^# Prefer / { next }
  # TZ line we own (re-added below)
  $0 ~ /^CRON_TZ=Europe\/Istanbul$/ { next }
  # Legacy all-days digest / optional ingest
  $0 ~ /cd \/workspace\/nexus-sage\/desk && .* run digest:tick >> \/workspace\/nexus-sage\/logs\/digest-tick\.log/ { next }
  $0 ~ /cd \/workspace\/nexus-sage\/desk && .* run ingest >> \/workspace\/nexus-sage\/logs\/ingest\.log/ { next }
  # A1 / A2 standing lines (any bun path)
  $0 ~ /cd \/workspace\/nexus-sage\/desk && .* scripts\/a1-stale-ingest\.mjs >> \/workspace\/nexus-sage\/logs\/a1-stale\.log/ { next }
  $0 ~ /cd \/workspace\/nexus-sage\/desk && .* run a2:tick >> \/workspace\/nexus-sage\/logs\/a2-digest\.log/ { next }
  $0 ~ /cd \/workspace\/nexus-sage\/desk && .* scripts\/a2-digest-export\.mjs >> \/workspace\/nexus-sage\/logs\/a2-digest\.log/ { next }
  { print }
')"

# Trim leading/trailing blank lines; squeeze internal multi-blanks to one
filtered="$(printf '%s\n' "${filtered}" | sed -e '/./,$!d' | awk '
  BEGIN { prev_blank=0 }
  NF==0 { if (!prev_blank) { print; prev_blank=1 } next }
  { prev_blank=0; print }
' | awk 'BEGIN{n=0} {a[++n]=$0} END{ while(n>0 && a[n]=="") n--; for(i=1;i<=n;i++) print a[i] }')"

tmp="$(mktemp)"
{
  if [[ -n "${filtered}" ]]; then
    printf '%s\n\n' "${filtered}"
  fi
  printf '%s\n' "${MARKER_START}"
  printf '%s\n' "# Spec: refs/OPS-A1-A3-AUTOMATION.md · NO overnight · NO weekend · A1 never FORCE"
  printf '%s\n' "CRON_TZ=Europe/Istanbul"
  printf '%s\n' "# A1 — STALE auto-ingest (STALE≥12h gate only)"
  printf '%s\n' "${A1_LINE}"
  printf '%s\n' "# A2 — Digest DUE→WROTE→dual-home"
  printf '%s\n' "${A2_LINE}"
  printf '%s\n' "# A2 — window-open catch-up (overnight HOLD before 09:00)"
  printf '%s\n' "${A2_OPEN_LINE}"
} > "${tmp}"

crontab "${tmp}"
rm -f "${tmp}"

echo "installed A1–A3 standing cron (bun=${BUN} · CRON_TZ=Europe/Istanbul · Mon–Fri 9–16)"
echo "  A1: ${A1_LINE}"
echo "  A2: ${A2_LINE}"
echo "  A2 open: ${A2_OPEN_LINE}"
echo "logs: ${A1_LOG} · ${A2_LOG}"
echo "backup: ${backup}"
echo "--- crontab ---"
crontab -l
