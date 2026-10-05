#!/usr/bin/env bash
# GitHub Pages publish — build the desk under /NEXUS_SAGE_grok and fast-forward the gh-pages branch.
#   bun run pages:publish            (= bash scripts/pages-publish.sh)
#   PAGES_NO_PUSH=1 bun run pages:publish   build + verify + commit locally, skip the push
# Steps: PAGES=1 next build → desk/out-pages/ · .nojekyll · verify (fail closed, exit≠0, nothing pushed) ·
# copy into the gh-pages worktree (default /workspace/nexus-sage-pages) · one normal commit on top of the previous
# gh-pages commit (the first run starts the branch) · git push origin gh-pages. Never force, never rewrite.
# Verify: every root-relative asset reference starts with /NEXUS_SAGE_grok/ · .nojekyll present · no .env* ·
# no token-like strings / secret values · no /home/box or /workspace paths · only known build files ·
# per-HTML font classes defined in its linked CSS + no missing _next/static (scripts/pages-asset-check.ts) ·
# headless font-check on a local serve of out-pages under the basePath. Build starts from a wiped .next + out-pages.
# Auth: plain `origin` + the git credential helper. Identity from GIT_AUTHOR_* / GIT_COMMITTER_* (defaults below).
set -euo pipefail
set +x

DESK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$DESK/.." && pwd)"
BASE="/NEXUS_SAGE_grok"
OUT="$DESK/out-pages"
WT="${PAGES_WORKTREE:-/workspace/nexus-sage-pages}"
BRANCH="gh-pages"
export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-Canberk Karaerkek}" GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-Canberk Karaerkek}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-specimba@users.noreply.github.com}" GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-specimba@users.noreply.github.com}"
t0=$(date +%s)
log() { echo "pages-publish: $*"; }
die() { echo "pages-publish FAIL: $*" >&2; exit 1; }

# ── 0. one build at a time ──
if pgrep -f '[n]ext build' >/dev/null 2>&1; then die "another 'next build' is running — one build at a time"; fi

# ── 0b. one crawl: header CRAWL_AT must equal the Wire / Pulse / heat snapshot (skipped postingest stays off Pages) ──
( cd "$DESK" && bun scripts/pages-coherence.ts ) || die "data incoherent — header crawl ≠ Wire snapshot; nothing built or pushed"

# ── 1. build ──
log "build PAGES=1 → $OUT"
# Clean build every time. next 15 `output:"export"` still compiles into desk/.next (distDir only moves the EXPORT to
# out-pages), so the :3000 build and the Pages build share .next/cache/webpack. On 2026-10-06 02:41 (gh-pages f286e1c)
# the server compile re-ran next/font (JetBrains → __variable_0466e9) while the client compile restored the CSS +
# layout chunk from that cache (__variable_210582) ⇒ HTML used a class its CSS never defined ⇒ Times New Roman.
# desk/out (what :3000 serves) is NOT touched: the Pages build never writes it, and :3000 reads only desk/out.
rm -rf "$OUT" "$DESK/.next"
( cd "$DESK" && PAGES=1 bun run build ) > /tmp/pages-publish-build.log 2>&1 || { tail -30 /tmp/pages-publish-build.log >&2; die "PAGES build failed (log /tmp/pages-publish-build.log)"; }
[ -f "$OUT/index.html" ] || die "$OUT/index.html missing after build"
: > "$OUT/.nojekyll"

# ── 2. verify (fail closed) ──
fails=()
( cd "$DESK" && bun scripts/pages-coherence.ts "$OUT" ) >/dev/null 2>&1 || fails+=("built header CRAWL ≠ Wire crawl (bun scripts/pages-coherence.ts $OUT)")
[ -f "$OUT/.nojekyll" ] || fails+=(".nojekyll missing")
envs="$(find "$OUT" -name '.env*' -print)"; [ -z "$envs" ] || fails+=(".env file(s) in output: $envs")
# 2a. root-relative refs in HTML attributes / CSS url() must carry the base path.
badrefs="$(grep -rhoE '(href|src|content|action|poster|srcset)="/[^"]*"' --include='*.html' "$OUT" | grep -vE "=\"$BASE/" | grep -vE '="//' || true)"
badcss="$(grep -rhoE 'url\(["'"'"']?/[^)]*\)' --include='*.css' "$OUT" | grep -vE "url\\([\"']?$BASE/" || true)"
# RSC payload / inline JSON: asset paths must not start at the domain root.
badrsc="$(grep -rhoE '"/(_next/static|favicon|og\.)[^"]*"' --include='*.txt' --include='*.html' "$OUT" | sort -u || true)"
[ -z "$badrefs" ] || fails+=("unprefixed HTML refs: $(echo "$badrefs" | sort -u | head -5 | tr '\n' ' ')")
[ -z "$badcss" ] || fails+=("unprefixed CSS url(): $(echo "$badcss" | sort -u | head -5 | tr '\n' ' ')")
[ -z "$badrsc" ] || fails+=("unprefixed asset paths in payload: $(echo "$badrsc" | head -5 | tr '\n' ' ')")
grep -qE "(src|href)=\"$BASE/_next/static/" "$OUT/index.html" || fails+=("index.html has no $BASE/_next/static/ asset")
grep -qE 'localhost:3000|127\.0\.0\.1' -r "$OUT" --include='*.html' --include='*.txt' && fails+=("localhost URL in Pages output")
# 2b. local paths.
lp="$(grep -rIlE '/home/box|/workspace/' "$OUT" || true)"; [ -z "$lp" ] || fails+=("local paths in: $(echo "$lp" | head -5 | tr '\n' ' ')")
# 2c. token-like strings (patterns only, matches never printed).
tok="$(grep -rIlE 'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,}|hf_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{32,}|-----BEGIN [A-Z ]*PRIVATE KEY|Bearer [A-Za-z0-9._~+/-]{24,}' "$OUT" || true)"
[ -z "$tok" ] || fails+=("token-like string in: $(echo "$tok" | head -5 | tr '\n' ' ')")
# 2d. secret VALUES from the env and the gitignored .env (grep -F, values never printed).
secret_hits="$(
  set +x
  if [ -f "$REPO/.env" ]; then set -a; . "$REPO/.env" >/dev/null 2>&1 || true; set +a; fi
  for n in GH_TOKEN GITHUB_TOKEN HF_TOKEN HUGGINGFACE_HUB_TOKEN VYCE_API_KEY GH_PUSH_TOKEN OPENALEX_API_KEY CF_API_TOKEN DEPLOY_HOOK_URL X_BEARER_TOKEN; do
    v="${!n:-}"; [ "${#v}" -ge 8 ] || continue
    grep -rIqF -- "$v" "$OUT" && echo "$n"
  done; true
)"
[ -z "$secret_hits" ] || fails+=("secret value(s) present: $(echo "$secret_hits" | tr '\n' ' ') (values redacted)")
bash "$DESK/scripts/secret-gate.sh" "$OUT" >/dev/null 2>&1 || fails+=("scripts/secret-gate.sh failed on $OUT")
# 2e. only known build files: _next/static/**, the exported pages, app favicon, and tracked desk/public files.
public_list="$(cd "$REPO" && git ls-files desk/public | sed 's#^desk/public/##')"
extra="$(cd "$OUT" && find . -type f | sed 's#^\./##' | while read -r f; do
  case "$f" in
    _next/static/*|index.html|index.txt|404.html|favicon.ico|.nojekyll) ;;
    _not-found.html|_not-found.txt|_not-found/*) ;;
    *) grep -qxF -- "$f" <<<"$public_list" || echo "$f" ;;
  esac
done)"
[ -z "$extra" ] || fails+=("unexpected files (not build output / tracked public): $(echo "$extra" | head -8 | tr '\n' ' ')")

# 2f. asset integrity: per HTML, every __variable_* class it (and its linked JS) uses is defined in the CSS that HTML
#     links, and every hashed _next/static URL in HTML / RSC payload / linked CSS+JS exists in $OUT (basePath stripped).
( cd "$DESK" && bun scripts/pages-asset-check.ts "$OUT" "$BASE" ) > /tmp/pages-asset-check.log 2>&1 \
  || fails+=("asset/font-class integrity: $(grep -E '^ - ' /tmp/pages-asset-check.log | head -3 | tr '\n' ' ')")
# 2g. real-browser font-check against a local static serve of $OUT under $BASE (same check as the live gate).
if [ "${#fails[@]}" -eq 0 ] && [ "${PAGES_SKIP_LOCAL_FONTCHECK:-0}" != "1" ]; then
  fport=$(( 3900 + RANDOM % 90 ))
  bun "$DESK/scripts/serve-out.ts" --host 127.0.0.1 --port "$fport" --root "$OUT" --base "$BASE" > /tmp/pages-serve-local.log 2>&1 &
  spid=$!
  for _ in $(seq 1 50); do curl -fs -o /dev/null "http://127.0.0.1:$fport$BASE/" && break; sleep 0.1; done
  ( cd "$DESK" && bun scripts/font-check.ts "http://127.0.0.1:$fport$BASE/" ) > /tmp/pages-font-check-local.log 2>&1 \
    || fails+=("local font-check on $OUT under $BASE failed: $(head -4 /tmp/pages-font-check-local.log | tr '\n' ' ')")
  kill "$spid" 2>/dev/null || true; wait "$spid" 2>/dev/null || true
fi

if [ "${#fails[@]}" -gt 0 ]; then
  for f in "${fails[@]}"; do echo "pages-publish CHECK FAIL: $f" >&2; done
  die "${#fails[@]} check(s) failed — nothing committed or pushed"
fi
nfiles=$(find "$OUT" -type f | wc -l); size=$(du -sh "$OUT" | cut -f1)
log "verify OK — $nfiles files, $size, all refs under $BASE/"

# ── 3. gh-pages worktree (fast-forward only) ──
cd "$REPO"
git fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" 2>/dev/null || true
remote_has=0; git rev-parse -q --verify "refs/remotes/origin/$BRANCH" >/dev/null && remote_has=1
if [ ! -e "$WT/.git" ]; then
  if [ "$remote_has" = 1 ]; then
    git show-ref -q --verify "refs/heads/$BRANCH" || git branch -q --track "$BRANCH" "origin/$BRANCH"
    git worktree add -q "$WT" "$BRANCH"
  elif git show-ref -q --verify "refs/heads/$BRANCH"; then
    git worktree add -q "$WT" "$BRANCH"
  else
    log "first publish — starting $BRANCH as an orphan branch"
    git worktree add -q --orphan -b "$BRANCH" "$WT"
  fi
fi
cd "$WT"
[ "$(git symbolic-ref --short HEAD 2>/dev/null)" = "$BRANCH" ] || die "$WT is not on $BRANCH"
if [ "$remote_has" = 1 ]; then
  if git rev-parse -q --verify HEAD >/dev/null; then
    git merge -q --ff-only "origin/$BRANCH" || die "local $BRANCH diverged from origin/$BRANCH — refusing (no force, no rewrite)"
  else
    die "worktree has no commit but origin/$BRANCH exists — remove $WT and rerun"
  fi
fi

# Replace the tree with the verified output; stage exactly those paths (+ deletions of tracked files).
find "$WT" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$OUT/." "$WT/"
# The worktree must now equal the verified output (no stale leftovers) and pass the same asset gate.
diff -rq --exclude=.git "$OUT" "$WT" >/dev/null || die "worktree $WT differs from $OUT after copy — nothing committed"
( cd "$DESK" && bun scripts/pages-asset-check.ts "$WT" "$BASE" ) >/dev/null 2>&1 || die "asset gate failed on worktree $WT — nothing committed"
if git rev-parse -q --verify HEAD >/dev/null; then git add -u -- .; fi
( cd "$OUT" && find . -type f -print0 ) | git add --pathspec-from-file=- --pathspec-file-nul
if git diff --cached --quiet 2>/dev/null && git rev-parse -q --verify HEAD >/dev/null; then
  log "no changes vs $(git rev-parse --short HEAD)"
else
  src_sha="$(git -C "$REPO" rev-parse --short HEAD)"
  crawl_at="$(grep -oE 'CRAWL_AT = "[^"]+"' "$DESK/src/data/x-crawl.ts" | cut -d'"' -f2 || echo unknown)"
  git commit -q -m "pages: publish main@$src_sha · crawl $crawl_at [skip ci]"
  log "committed $(git rev-parse --short HEAD) on $BRANCH"
fi
if [ "$remote_has" = 1 ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCH")" ]; then
  log "origin/$BRANCH already at $(git rev-parse --short HEAD) — nothing to push ($(( $(date +%s) - t0 ))s)"
  exit 0
fi

# ── 4. push (plain origin, fast-forward only) ──
if [ "${PAGES_NO_PUSH:-0}" = "1" ]; then
  log "PAGES_NO_PUSH=1 — not pushing ($(( $(date +%s) - t0 ))s)"
  exit 0
fi
git push -q origin "$BRANCH:$BRANCH" || die "push of $BRANCH rejected (non-fast-forward?) — nothing forced"
log "pushed $BRANCH $(git rev-parse --short HEAD) → https://specimba.github.io$BASE/ ($(( $(date +%s) - t0 ))s)"
