#!/usr/bin/env bash
# PASS-Q1G state persistence across fresh depth-1 CI clones. Run from desk/.
#   ci-state.sh seed            → if last-checked.json is missing on main, take it from origin/gh-pages (fallback only)
#   ci-state.sh stage <changed> → selective `git add` of the cross-run state (never -A). changed=true: src/data + artifacts/sage + public/feed.xml + public/feed.atom (F2.3c) + public/watch.xml (PASS-W)
#                                 (+ force-added publish-proof.json).
#                                 changed=false: drop the crawl's data churn but KEEP the fresh last-checked.json
#                                 (a plain `git checkout -- artifacts/sage` would revert it and checked_at would never advance).
#                                 PASS-S1.3: releases-seen.json (release bump baseline) is kept the same way, so a seed or
#                                 an emitted bump is never lost to a no-change run (else every run would re-seed).
set -euo pipefail
LC=artifacts/sage/last-checked.json
RH=artifacts/sage/reader-hash.json
PP=artifacts/sage/publish-proof.json   # written by pages-publish.sh on a publish attempt (PASS-D D6 / Q1G §2)
FEED=public/feed.xml                   # PASS-D D1; own pathspec so a missing feed never voids the src/data / artifacts add/revert
RS=artifacts/sage/releases-seen.json
ATOM=public/feed.atom                  # PASS-F2.3c: byte-identical feed.xml copy (Atom MIME), same rules as FEED
WATCH=public/watch.xml                 # PASS-W W4: own pathspec (missing file safe), same rules as FEED
WS=artifacts/sage/watch-seen.json      # PASS-W W4: watch dedupe store (under artifacts/sage, so it also rides the src/data/artifacts add/revert)
case "${1:-}" in
  seed)
    [ -f "$LC" ] && exit 0
    if git fetch -q --depth 1 origin gh-pages 2>/dev/null && git show FETCH_HEAD:last-checked.json > "$LC.tmp" 2>/dev/null; then
      mv "$LC.tmp" "$LC"; echo "ci-state: seeded last-checked.json from gh-pages"
    else rm -f "$LC.tmp"; echo "ci-state: no persisted last-checked.json (cold start)"; fi ;;
  stage)
    if [ "${2:-}" = "true" ]; then
      git add -- src/data artifacts/sage
      [ -e "$FEED" ] && git add -- "$FEED"   # PASS-D D1: the feed rides with its snapshot store
      [ -e "$ATOM" ] && git add -- "$ATOM"   # PASS-F2.3c
      [ -e "$WATCH" ] && git add -- "$WATCH"   # PASS-W W4: watch.xml rides with watch-seen.json
      [ -e "$WS" ] && git add -- "$WS"
    else
      keep="$(mktemp)"; cp "$LC" "$keep"
      keep_rs=""; if [ -f "$RS" ]; then keep_rs="$(mktemp)"; cp "$RS" "$keep_rs"; fi
      git checkout -- src/data artifacts/sage 2>/dev/null || true
      git checkout -- "$ATOM" 2>/dev/null || true   # PASS-F2.3c (safe: reader-hash covers feed.atom too)
      git checkout -- "$FEED" 2>/dev/null || true   # PASS-D D1 (safe: reader-hash covers the feed, so a feed change ⇒ changed=true)
      git checkout -- "$WATCH" 2>/dev/null || true  # PASS-W W4 (safe: reader-hash covers watch.xml too)
      git checkout -- "$WS" 2>/dev/null || true
      cp "$keep" "$LC"; rm -f "$keep"
      if [ -n "$keep_rs" ]; then cp "$keep_rs" "$RS"; rm -f "$keep_rs"; fi
      git add -- "$LC"
    fi
    git add -f -- "$LC"; [ -f "$RH" ] && git add -f -- "$RH"; [ -f "$PP" ] && git add -f -- "$PP"; [ -f "$RS" ] && git add -f -- "$RS"; true ;;
  *) echo "usage: ci-state.sh seed | stage <true|false>" >&2; exit 2 ;;
esac
