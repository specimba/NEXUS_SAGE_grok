#!/usr/bin/env bash
# On-demand headless Chrome for the GitLab job (node:22.12-bookworm ships none). pages-publish.sh calls this ONLY when the
# overflow-390 gate must run (SAGE_OVERFLOW_390=auto + code changed since the last publish); data-only crawls never get here.
#   bash scripts/ci-chrome.sh      → last stdout line = absolute path of a working chrome-headless-shell; logs on stderr
# Cheapest reliable path (measured 2026-10-16 in a node:22.12-bookworm rootfs): Chrome for Testing chrome-headless-shell
# zip (124 MB from storage.googleapis.com, ~1 s download + ~2 s unzip) + the 13 shared libs it lacks (20 debs, 3.5 MB, apt).
# vs `apt-get install chromium --no-install-recommends`: 125 debs / 182 MB + ~23 s of dpkg even from a warm deb cache.
# No GitLab cache on purpose: a cache is pulled (and pushed) on EVERY run, so all ~120 runs/month would pay to save
# seconds on the few code-change runs. Pinned version: bump SAGE_CHROME_VERSION deliberately (box runs google-chrome).
# Fails closed (exit ≠ 0) on any download / unzip / apt / missing-lib / --version error; pages-publish.sh turns that into
# a CHECK FAIL, so nothing is published unchecked.
set -euo pipefail
VER="${SAGE_CHROME_VERSION:-155.0.8059.79}"
DIR="${SAGE_CHROME_DIR:-${CI_PROJECT_DIR:-${TMPDIR:-/tmp}}/.chrome-hs}"
URL="${SAGE_CHROME_URL:-https://storage.googleapis.com/chrome-for-testing-public/$VER/linux64/chrome-headless-shell-linux64.zip}"
LIBS=(libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libdbus-1-3 libxcomposite1 libxdamage1 libxfixes3 libxrandr2
      libgbm1 libxkbcommon0 libasound2 libatspi2.0-0)
BIN="$DIR/$VER/chrome-headless-shell-linux64/chrome-headless-shell"
log() { echo "ci-chrome: $*" >&2; }
die() { echo "ci-chrome FAIL: $*" >&2; exit 1; }
t0=$(date +%s)

if [ ! -x "$BIN" ]; then
  mkdir -p "$DIR/$VER"
  curl -fsSL --retry 2 --max-time 120 -o "$DIR/$VER/hs.zip" "$URL" || die "download failed: $URL"
  unzip -q -o "$DIR/$VER/hs.zip" -d "$DIR/$VER" || die "unzip failed ($DIR/$VER/hs.zip)"
  rm -f "$DIR/$VER/hs.zip"
  [ -x "$BIN" ] || die "no chrome-headless-shell binary in the zip ($BIN)"
  log "chrome-headless-shell $VER unpacked ($(( $(date +%s) - t0 ))s)"
fi

if ldd "$BIN" | grep -q 'not found'; then
  [ "$(id -u)" = 0 ] || die "missing shared libs and not root (no apt): $(ldd "$BIN" | grep 'not found' | awk '{print $1}' | tr '\n' ' ')"
  t1=$(date +%s)
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq >&2 || die "apt-get update failed"
  apt-get install -y -qq --no-install-recommends "${LIBS[@]}" >&2 || die "apt-get install of chrome libs failed"
  log "shared libs installed ($(( $(date +%s) - t1 ))s)"
  missing="$(ldd "$BIN" | grep 'not found' | awk '{print $1}' | tr '\n' ' ' || true)"
  [ -z "$missing" ] || die "still missing after apt: $missing"
fi

v="$("$BIN" --version 2>/dev/null)" || die "$BIN --version failed"
log "$v ready in $(( $(date +%s) - t0 ))s"
echo "$BIN"
