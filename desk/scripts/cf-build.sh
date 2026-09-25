#!/usr/bin/env bash
# B3 · Cloudflare Pages build (refs/DEPLOY-FREE-LIVE.md B3 row).
#   Pages: root directory = desk/, build command = `bash scripts/cf-build.sh`, output = out/
#   Needs: Ubuntu 22.04 image, Bun preinstalled (BUN_VERSION), git. No box paths.
#
# 1 restore crawl caches  2 crawl only if CRAWL_AT >= SAGE_CRAWL_STALE_H (3h):
#   ingest → rank:snapshot → digest:tick → a2:tick, commit locally
# 3 [HOOK] curator  4 [HOOK] embeddings  5 next build (prebuild gate + build stamp)
# 6 secret gate (B3a)  7 per-source table (0 rows = THROTTLED?)  8 save caches
# 9 push `[skip ci] chore(sage): 4h crawl <CRAWL_AT>` with pull --rebase over HTTPS (GH_PUSH_TOKEN).
#
# SHADOW=1 → never pushes (local proof). Secrets are never echoed.
set -euo pipefail

DESK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DESK"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || dirname "$DESK")"
STALE_H="${SAGE_CRAWL_STALE_H:-3}"
SHADOW="${SHADOW:-0}"
# Next.js on Pages persists .next/cache between builds — keep crawl caches under it.
CACHE_DIR="${SAGE_CACHE_DIR:-$DESK/.next/cache/sage-crawl}"
CACHES=(arxiv-cache hn-cache github-cache openalex-cache gnews-cache)
REMOTE_URL="${SAGE_GIT_REMOTE:-https://github.com/specimba/NEXUS_SAGE_grok.git}"
BRANCH="${SAGE_GIT_BRANCH:-main}"

log() { printf '[cf-build %s UTC+3] %s\n' "$(TZ=Europe/Istanbul date +%H:%M:%S)" "$*"; }
die() { log "FAIL — $*"; exit 1; }

log "start · desk=$DESK · shadow=$SHADOW · stale>=${STALE_H}h · bun $(bun --version)"
command -v git >/dev/null || die "git missing"

# ── 0 · deps ────────────────────────────────────────────────────────────────
if [ -f bun.lock ] || [ -f bun.lockb ]; then bun install --frozen-lockfile; else bun install; fi

# ── 1 · restore caches ─────────────────────────────────────────────────────
for c in "${CACHES[@]}"; do
  if [ -d "$CACHE_DIR/$c" ]; then
    mkdir -p "artifacts/sage/$c" && cp -a "$CACHE_DIR/$c/." "artifacts/sage/$c/"
    log "cache restored $c ($(find "artifacts/sage/$c" -type f | wc -l) files)"
  fi
done

# ── 2 · crawl if stale ──────────────────────────────────────────────────────
read -r CRAWL_AT AGE_H < <(bun -e '
  const l = JSON.parse(require("fs").readFileSync("artifacts/sage/CURRENT.json", "utf8"));
  const t = Date.parse(l.crawled_at ?? "");
  console.log(l.crawled_at ?? "none", Number.isFinite(t) ? ((Date.now() - t) / 3.6e6).toFixed(2) : "999");
')
log "CRAWL_AT=$CRAWL_AT age=${AGE_H}h"
CRAWLED=0
CRAWL_PATHS=(desk/artifacts/sage desk/src/data desk/packs/drill-log.md packs/drill-log.md refs/PACK-DUAL-HOME.md)
if awk -v a="$AGE_H" -v s="$STALE_H" 'BEGIN { exit !(a + 0 >= s + 0) }'; then
  log "crawl due (${AGE_H}h >= ${STALE_H}h)"
  export CRAWL_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if bun scripts/ingest.ts && bun run rank:snapshot && bun run digest:tick && bun run a2:tick; then
    NEW_AT="$(bun -e 'console.log(JSON.parse(require("fs").readFileSync("artifacts/sage/CURRENT.json","utf8")).crawled_at)')"
    if [ "$NEW_AT" != "$CRAWL_AT" ]; then
      CRAWL_AT="$NEW_AT"
      CRAWLED=1
      git -C "$REPO_ROOT" config user.name >/dev/null || git -C "$REPO_ROOT" config user.name "${GIT_AUTHOR_NAME:-sage-cf-build}"
      git -C "$REPO_ROOT" config user.email >/dev/null || git -C "$REPO_ROOT" config user.email "${GIT_AUTHOR_EMAIL:-sage-cf-build@users.noreply.github.com}"
      existing=()
      for p in "${CRAWL_PATHS[@]}"; do [ -e "$REPO_ROOT/$p" ] && existing+=("$p"); done
      git -C "$REPO_ROOT" add -- "${existing[@]}"
      git -C "$REPO_ROOT" commit -q -m "[skip ci] chore(sage): 4h crawl $CRAWL_AT" || CRAWLED=0
      [ "$CRAWLED" = 1 ] && export SAGE_CRAWL_COMMIT="$(git -C "$REPO_ROOT" rev-parse HEAD)" && log "crawl committed locally ${SAGE_CRAWL_COMMIT:0:7} · $CRAWL_AT"
    else
      log "crawl ran but CRAWL_AT unchanged — nothing to commit"
    fi
  else
    log "CRAWL FAILED — restoring last good data, building it"
    git -C "$REPO_ROOT" checkout -- desk/artifacts/sage desk/src/data 2>/dev/null || true
  fi
else
  log "crawl SKIP — ${AGE_H}h < ${STALE_H}h (CRAWL_AT $CRAWL_AT)"
fi

# ── 3 · [HOOK] curator (B9) ────────────────────────────────────────────────
if [ -f scripts/curate.ts ]; then
  log "HOOK curator → bun scripts/curate.ts"; bun scripts/curate.ts
else
  log "HOOK curator — not implemented yet (B9, scripts/curate.ts) · skipped"
fi
# ── 4 · [HOOK] embeddings ──────────────────────────────────────────────────
if [ -f scripts/embeddings.ts ]; then
  log "HOOK embeddings → bun scripts/embeddings.ts"; bun scripts/embeddings.ts
else
  log "HOOK embeddings — not implemented yet (scripts/embeddings.ts) · skipped"
fi

# ── 5 · build (prebuild = CURRENT hard gate + build stamp) ─────────────────
bun run build
[ -f out/index.html ] || die "out/index.html missing"
log "out/ $(find out -type f | wc -l) files"

# ── 6 · secret gate (B3a) ──────────────────────────────────────────────────
if [ -f scripts/secret-gate.sh ]; then
  bash scripts/secret-gate.sh out || die "secret gate"
else
  log "secret gate — scripts/secret-gate.sh missing"
fi

# ── 7 · per-source crawl table ─────────────────────────────────────────────
log "per-source crawl (artifacts/sage/ingest-last.json → crawl_sources[])"
bun scripts/crawl-table.ts

# ── 8 · save caches ────────────────────────────────────────────────────────
for c in "${CACHES[@]}"; do
  if [ -d "artifacts/sage/$c" ]; then mkdir -p "$CACHE_DIR/$c" && cp -a "artifacts/sage/$c/." "$CACHE_DIR/$c/"; fi
done

# ── 9 · push the crawl commit ──────────────────────────────────────────────
if [ "$CRAWLED" != 1 ]; then
  log "push — nothing (no new crawl)"
elif [ "$SHADOW" = 1 ]; then
  log "SHADOW=1 — crawl commit ${SAGE_CRAWL_COMMIT:0:7} kept local, NOT pushed"
elif [ -z "${GH_PUSH_TOKEN:-}" ]; then
  die "GH_PUSH_TOKEN not set — cannot push crawl $CRAWL_AT"
else
  # Token rides in a one-shot header passed via GIT_CONFIG_* env (never in argv, the URL, remote config or log).
  AUTH="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$GH_PUSH_TOKEN" | base64 | tr -d '\n')"
  gitp() { GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=http.extraheader GIT_CONFIG_VALUE_0="$AUTH" git -C "$REPO_ROOT" "$@"; }
  pushed=0
  for attempt in 1 2 3; do
    if gitp pull -q --rebase "$REMOTE_URL" "$BRANCH" && gitp push -q "$REMOTE_URL" "HEAD:$BRANCH"; then pushed=1; break; fi
    log "push attempt $attempt failed — retrying"; sleep $((attempt * 5))
  done
  [ "$pushed" = 1 ] || die "push failed after 3 attempts"
  FINAL="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  [ "$FINAL" = "$SAGE_CRAWL_COMMIT" ] || log "note: rebase moved the crawl commit ${SAGE_CRAWL_COMMIT:0:7} → ${FINAL:0:7} (footer shows the pre-rebase hash)"
  log "pushed [skip ci] chore(sage): 4h crawl $CRAWL_AT → $BRANCH (${FINAL:0:7})"
fi
log "done · CRAWL_AT=$CRAWL_AT · crawled=$CRAWLED"
