#!/usr/bin/env bash
# PASS-Q1 §3: keep exactly one open "sage-watchdog" issue while unhealthy; close it on the next green run. CI only (gh + GITHUB_TOKEN).
#   bash scripts/watchdog-issue.sh open <report.md> | close
set -euo pipefail
TITLE="sage-watchdog"
num="$(gh issue list --state open --search "in:title $TITLE" --json number,title --jq ".[] | select(.title==\"$TITLE\") | .number" | head -1)"
run="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
case "${1:-}" in
  open)
    body="$(printf 'Watchdog failed at %s\n\n%s\n\nRun: %s\n' "$(date -u +%FT%TZ)" "$(cat "${2:-/dev/null}" 2>/dev/null)" "$run")"
    if [ -n "$num" ]; then gh issue comment "$num" --body "$body"; else gh issue create --title "$TITLE" --body "$body"; fi ;;
  close)
    [ -z "$num" ] || gh issue close "$num" --comment "Green run: $run" ;;
  *) echo "usage: watchdog-issue.sh open <report> | close" >&2; exit 2 ;;
esac
