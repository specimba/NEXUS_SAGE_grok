#!/usr/bin/env bash
# PASS-Q1 §2 skip path: reader hash unchanged → no Pages build. Only gh-pages/last-checked.json is refreshed so the live
# chip shows the new check time. One normal commit on top of origin/gh-pages; fast-forward push only, never force.
set -euo pipefail
set +x
DESK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$DESK/.." && pwd)"
WT="${PAGES_WORKTREE:-/workspace/nexus-sage-pages}"
SRC="$DESK/artifacts/sage/last-checked.json"
[ -f "$SRC" ] || { echo "pages-checked-push FAIL: $SRC missing" >&2; exit 1; }
cd "$REPO"
git fetch -q ${PAGES_FETCH_DEPTH:+--depth="$PAGES_FETCH_DEPTH"} origin "+refs/heads/gh-pages:refs/remotes/origin/gh-pages"
if [ ! -e "$WT/.git" ]; then git worktree add -q -B gh-pages "$WT" origin/gh-pages; fi
cd "$WT"
git merge -q --ff-only origin/gh-pages || { echo "pages-checked-push FAIL: local gh-pages diverged — refusing" >&2; exit 1; }
cp "$SRC" last-checked.json
git add -- last-checked.json
if git diff --cached --quiet; then echo "pages-checked-push: no change"; exit 0; fi
git commit -q -m "pages: last-checked $(grep -oE '"checked_at": "[^"]+"' last-checked.json | cut -d'"' -f4) [skip ci]"
git push -q origin gh-pages:gh-pages
echo "pages-checked-push: pushed $(git rev-parse --short HEAD)"
