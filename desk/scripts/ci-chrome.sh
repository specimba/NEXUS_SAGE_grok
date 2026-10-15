#!/usr/bin/env bash
# On-demand headless Chrome for the GitLab job (node:22.12-bookworm ships none). pages-publish.sh calls this ONLY when the
# overflow-390 gate must run (SAGE_OVERFLOW_390=auto + code changed since the last publish); data-only crawls never get here.
#   bash scripts/ci-chrome.sh      → last stdout line = absolute path of a working chrome-headless-shell; logs on stderr
# Cheapest reliable path (measured 2026-10-16 in a node:22.12-bookworm rootfs): Chrome for Testing chrome-headless-shell
# zip (124 MB from storage.googleapis.com, ~1 s download + ~2 s unzip) + the 13 shared libs it lacks (20 debs, 3.5 MB, apt).
# vs `apt-get install chromium --no-install-recommends`: 125 debs / 182 MB + ~23 s of dpkg even from a warm deb cache.
# No GitLab cache on purpose: a cache is pulled (and pushed) on EVERY run, so all ~120 runs/month would pay to save
# seconds on the few code-change runs. Pinned version: bump SAGE_CHROME_VERSION deliberately (box runs google-chrome).
# Fails closed (exit ≠ 0) on any download / sha256 mismatch / unzip / apt / missing-lib / --version error; pages-publish.sh turns that into
# a CHECK FAIL, so nothing is published unchecked.
set -euo pipefail
VER="${SAGE_CHROME_VERSION:-155.0.8059.79}"
DIR="${SAGE_CHROME_DIR:-${CI_PROJECT_DIR:-${TMPDIR:-/tmp}}/.chrome-hs}"
# sha256 of the pinned zip (Chrome for Testing publishes none; computed 2026-10-16; the download matched GCS x-goog-hash md5).
# Bump together with SAGE_CHROME_VERSION. Mismatch = FAIL (nothing unpacked, nothing published).
SHA="${SAGE_CHROME_SHA256:-4cea4c32b501aa43cc2b81eb45734af991a6a82feded48380d6dfaf96642a1c1}"
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
  got="$(sha256sum "$DIR/$VER/hs.zip" | cut -d' ' -f1)"
  [ "$got" = "$SHA" ] || { rm -f "$DIR/$VER/hs.zip"; die "sha256 mismatch for $URL: got $got, pinned $SHA"; }
  unzip -q -o "$DIR/$VER/hs.zip" -d "$DIR/$VER" || die "unzip failed ($DIR/$VER/hs.zip)"
  rm -f "$DIR/$VER/hs.zip"
  [ -x "$BIN" ] || die "no chrome-headless-shell binary in the zip ($BIN)"
  log "chrome-headless-shell $VER unpacked ($(( $(date +%s) - t0 ))s)"
fi

if ldd "$BIN" 2>/dev/null | grep -q 'not found'; then
  [ "$(id -u)" = 0 ] || die "missing shared libs and not root (no apt): $(ldd "$BIN" | grep 'not found' | awk '{print $1}' | tr '\n' ' ')"
  t1=$(date +%s)
  export DEBIAN_FRONTEND=noninteractive
  # Debian's signed repos (apt verifies the Release signatures); dpkg chatter goes to $DIR/apt.log, its tail on failure.
  apt-get update -qq > "$DIR/apt.log" 2>&1 || die "apt-get update failed: $(tail -2 "$DIR/apt.log" | tr '\n' ' ')"
  apt-get install -y -qq --no-install-recommends "${LIBS[@]}" >> "$DIR/apt.log" 2>&1 \
    || die "apt-get install of chrome libs failed: $(tail -2 "$DIR/apt.log" | tr '\n' ' ')"
  log "shared libs installed ($(( $(date +%s) - t1 ))s)"
  missing="$(ldd "$BIN" | grep 'not found' | awk '{print $1}' | tr '\n' ' ' || true)"
  [ -z "$missing" ] || die "still missing after apt: $missing"
fi

v="$("$BIN" --version 2>/dev/null)" || die "$BIN --version failed"
log "$v · bin sha256 $(sha256sum "$BIN" | cut -c1-12) · ready in $(( $(date +%s) - t0 ))s"
echo "$BIN"
