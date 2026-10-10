#!/usr/bin/env bash
# PASS-Q1G state persistence across fresh depth-1 CI clones. Run from desk/.
#   ci-state.sh seed            → if last-checked.json is missing on main, take it from origin/gh-pages (fallback only)
#   ci-state.sh stage <changed> → selective `git add` of the cross-run state (never -A). changed=true: src/data + artifacts/sage.
#                                 changed=false: drop the crawl's data churn but KEEP the fresh last-checked.json
#                                 (a plain `git checkout -- artifacts/sage` would revert it and checked_at would never advance).
set -euo pipefail
LC=artifacts/sage/last-checked.json
RH=artifacts/sage/reader-hash.json
case "${1:-}" in
  seed)
    [ -f "$LC" ] && exit 0
    if git fetch -q --depth 1 origin gh-pages 2>/dev/null && git show FETCH_HEAD:last-checked.json > "$LC.tmp" 2>/dev/null; then
      mv "$LC.tmp" "$LC"; echo "ci-state: seeded last-checked.json from gh-pages"
    else rm -f "$LC.tmp"; echo "ci-state: no persisted last-checked.json (cold start)"; fi ;;
  stage)
    if [ "${2:-}" = "true" ]; then
      git add -- src/data artifacts/sage
    else
      keep="$(mktemp)"; cp "$LC" "$keep"
      git checkout -- src/data artifacts/sage 2>/dev/null || true
      cp "$keep" "$LC"; rm -f "$keep"
      git add -- "$LC"
    fi
    git add -f -- "$LC"; [ -f "$RH" ] && git add -f -- "$RH"; true ;;
  *) echo "usage: ci-state.sh seed | stage <true|false>" >&2; exit 2 ;;
esac
