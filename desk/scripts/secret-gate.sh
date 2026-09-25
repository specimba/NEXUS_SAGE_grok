#!/usr/bin/env bash
# B3a secret gate — fail the build if the static export leaks a secret.
#   usage: bash scripts/secret-gate.sh [dir]   (default: out)
# Checks (text files only, grep -I):
#   1. NAMES of secret env vars appear anywhere in <dir>
#   2. VALUES of those env vars (when set, >= 8 chars) appear anywhere in <dir>
#      — values are matched with grep -F and are NEVER printed; only var name + file.
#   3. src/ must not import the build-time curator (scripts/curate*)
# The Vyce base URL (LLM_BASE_URL default) is not a secret per DEPLOY-FREE-LIVE B3a;
# it is reported as a WARN only (set SECRET_GATE_STRICT_URL=1 to make it fatal).
set -euo pipefail
set +x

DIR="${1:-out}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SECRET_NAMES=(VYCE_API_KEY GH_PUSH_TOKEN OPENALEX_API_KEY CF_API_TOKEN DEPLOY_HOOK_URL)
fail=0

if [ ! -d "$DIR" ]; then
  echo "[secret-gate] FAIL: directory '$DIR' not found" >&2
  exit 2
fi

for name in "${SECRET_NAMES[@]}"; do
  hits="$(grep -rIlF -- "$name" "$DIR" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    echo "[secret-gate] FAIL name:$name found in:" >&2
    printf '  %s\n' $hits >&2
    fail=1
  fi
done

for name in "${SECRET_NAMES[@]}"; do
  val="${!name:-}"
  [ -z "$val" ] && continue
  if [ "${#val}" -lt 8 ]; then
    echo "[secret-gate] skip value:$name (shorter than 8 chars)"
    continue
  fi
  hits="$(grep -rIlF -- "$val" "$DIR" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    echo "[secret-gate] FAIL value:$name (value redacted) found in:" >&2
    printf '  %s\n' $hits >&2
    fail=1
  fi
done
unset val

if [ -d "$HERE/src" ]; then
  cur="$(grep -rIlE -- "(from|import\\()[[:space:]]*['\"][^'\"]*scripts/curate" "$HERE/src" 2>/dev/null || true)"
  if [ -n "$cur" ]; then
    echo "[secret-gate] FAIL curator imported from src/:" >&2
    printf '  %s\n' $cur >&2
    fail=1
  fi
fi

url="${LLM_BASE_URL:-https://vyceai.com/v1}"
url_host="$(printf '%s' "$url" | sed -E 's#^[a-z]+://##; s#/.*$##')"
if [ -n "$url_host" ] && grep -rIqF -- "$url_host" "$DIR" 2>/dev/null; then
  if [ "${SECRET_GATE_STRICT_URL:-0}" = "1" ]; then
    echo "[secret-gate] FAIL llm-base-url host found in $DIR" >&2
    fail=1
  else
    echo "[secret-gate] WARN llm-base-url host found in $DIR (not a secret; set SECRET_GATE_STRICT_URL=1 to block)"
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "[secret-gate] BLOCKED — do not deploy $DIR" >&2
  exit 1
fi
echo "[secret-gate] PASS $DIR (names:${#SECRET_NAMES[@]} checked)"
