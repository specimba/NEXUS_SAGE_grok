#!/usr/bin/env bash
# :3000 build (package.json "build") through the shared build lock desk/.build.lock.
#   bun run build                         gate + build stamp + next build → .next / out (waits for the lock)
# pages-publish.sh takes the SAME flock for its whole .next swap + Pages build, so a :3000 build started meanwhile
# WAITS here instead of compiling into the Pages folder. The wait is bounded (NEXUS_BUILD_LOCK_WAIT, default 900 s):
# on timeout it fails loudly (exit 75), never hangs.
# NEXUS_BUILD_LOCK_HELD=1 (exported by pages-publish.sh while it holds the lock) skips flock, so an indirect
# `bun run build` under the lock cannot deadlock. NEXUS_BUILD_DRY=1: take the lock, report, build nothing (tests).
# The gate + stamp (formerly npm "prebuild") run INSIDE the lock — they rewrite src/data/build-stamp.ts.
set -euo pipefail
DESK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="${NEXUS_BUILD_LOCK_FILE:-$DESK/.build.lock}"
WAIT="${NEXUS_BUILD_LOCK_WAIT:-900}"
cd "$DESK"
build() {
  if [ "${NEXUS_BUILD_DRY:-0}" = "1" ]; then echo "build: DRY — lock ok, not building"; return 0; fi
  bun scripts/check-current.mjs && bun scripts/build-stamp.mjs && "$DESK/node_modules/.bin/next" build "$@"
}
if [ "${NEXUS_BUILD_LOCK_HELD:-0}" = "1" ]; then
  echo "build: NEXUS_BUILD_LOCK_HELD=1 — caller holds $LOCK, not locking again"
  build "$@"; exit $?
fi
if ! command -v flock >/dev/null 2>&1; then
  echo "build: WARNING flock not found — building WITHOUT the build lock" >&2
  build "$@"; exit $?
fi
exec 9>>"$LOCK"
if ! flock -n 9; then
  echo "build: $LOCK is held ($(cat "$LOCK" 2>/dev/null | tail -1 || true)) — waiting up to ${WAIT}s ($(date +%H:%M:%S))"
  flock -w "$WAIT" 9 || { echo "build FAIL: $LOCK still held after ${WAIT}s — not building (another build or pages-publish is stuck?)" >&2; exit 75; }
  echo "build: lock acquired after wait ($(date +%H:%M:%S))"
fi
echo "locked-build pid $$ since $(date -Iseconds)" > "$LOCK"
export NEXUS_BUILD_LOCK_HELD=1
build "$@"
