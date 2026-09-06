#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "GH_TOKEN (or GITHUB_TOKEN) is empty. Fill .env or use the secure card." >&2
  exit 1
fi

REPO_NAME="${REPO_NAME:-NEXUS_SAGE_grok}"
OWNER="${GITHUB_OWNER:-specimba}"
VISIBILITY="${REPO_VISIBILITY:-private}"

export GH_TOKEN="$TOKEN"
export GITHUB_TOKEN="$TOKEN"

echo "$TOKEN" | gh auth login --with-token
gh auth setup-git

if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo exists: https://github.com/$OWNER/$REPO_NAME"
else
  gh repo create "$OWNER/$REPO_NAME" --"$VISIBILITY" --description "NEXUS SAGE desk (Grok Bot) v0.1.0"
  echo "Created: https://github.com/$OWNER/$REPO_NAME"
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"

git push -u origin main
git push origin v0.1.0

echo "DONE: https://github.com/$OWNER/$REPO_NAME"
echo "Tag: v0.1.0"
