#!/usr/bin/env bash
# NEXUS SAGE — idempotent cron install for digest:tick (OPS-HARDEN)
# Locks: cycle 003 · lead hf-incident · free only · no 004 · no HF HTML · no paid X
set -euo pipefail

ROOT="/workspace/nexus-sage"
DESK="${ROOT}/desk"
LOG_DIR="${ROOT}/logs"
LOG_FILE="${LOG_DIR}/digest-tick.log"
INGEST_LOG="${LOG_DIR}/ingest.log"
MARKER="# NEXUS SAGE — Digest organism every 6h"

BUN="$(command -v bun || true)"
if [[ -z "${BUN}" ]]; then
  echo "error: bun not found on PATH (command -v bun)" >&2
  exit 1
fi

mkdir -p "${LOG_DIR}"

DIGEST_LINE="0 */6 * * * cd ${DESK} && ${BUN} run digest:tick >> ${LOG_FILE} 2>&1"
INGEST_LINE="30 */6 * * * cd ${DESK} && ${BUN} run ingest >> ${INGEST_LOG} 2>&1"

INSTALL_INGEST=0
if [[ "${1:-}" == "--with-ingest" ]]; then
  INSTALL_INGEST=1
fi

existing="$(crontab -l 2>/dev/null || true)"

# Drop prior NEXUS SAGE digest/ingest lines (marker + known patterns) — idempotent
filtered="$(printf '%s\n' "${existing}" | awk '
  $0 ~ /^# NEXUS SAGE — Digest organism every 6h/ { next }
  $0 ~ /^# Optional companion/ { next }
  $0 ~ /^0 \*\/6 \* \* \* cd \/workspace\/nexus-sage\/desk && .* run digest:tick >> \/workspace\/nexus-sage\/logs\/digest-tick\.log 2>&1$/ { next }
  $0 ~ /^30 \*\/6 \* \* \* cd \/workspace\/nexus-sage\/desk && .* run ingest >> \/workspace\/nexus-sage\/logs\/ingest\.log 2>&1$/ { next }
  { print }
')"

# Trim leading/trailing blank lines
filtered="$(printf '%s\n' "${filtered}" | sed -e '/./,$!d' | awk 'NF{p=1} p' | awk 'BEGIN{n=0} {a[++n]=$0} END{ while(n>0 && a[n]=="") n--; for(i=1;i<=n;i++) print a[i] }')"

tmp="$(mktemp)"
{
  if [[ -n "${filtered}" ]]; then
    printf '%s\n\n' "${filtered}"
  fi
  printf '%s\n' "${MARKER}"
  printf '%s\n' "${DIGEST_LINE}"
  if [[ "${INSTALL_INGEST}" -eq 1 ]]; then
    printf '%s\n' "# Optional companion (off-peak ingest)"
    printf '%s\n' "${INGEST_LINE}"
  fi
} > "${tmp}"

crontab "${tmp}"
rm -f "${tmp}"

echo "installed digest:tick cron (bun=${BUN})"
echo "  ${DIGEST_LINE}"
if [[ "${INSTALL_INGEST}" -eq 1 ]]; then
  echo "installed optional ingest companion"
  echo "  ${INGEST_LINE}"
else
  echo "optional ingest skipped (pass --with-ingest to enable)"
fi
echo "log: ${LOG_FILE}"
echo "--- crontab ---"
crontab -l
