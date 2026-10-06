#!/usr/bin/env bash
# Stage ONLY the backup allowlist (scripts/backup-allowlist.txt) for the [skip ci] crawl commit.
#   usage: bash scripts/backup-stage.sh <repo_root> [--dry]
# Each allowlist line is an exact path or a one-segment glob; only existing regular files are staged,
# one path at a time (never `git add -A`, `git add .` or a directory). --dry prints the list, stages nothing.
set -euo pipefail
ROOT="${1:?repo root}"
DRY="${2:-}"
LIST="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backup-allowlist.txt"
[ -f "$LIST" ] || { echo "[backup-stage] allowlist missing: $LIST" >&2; exit 2; }

# Pass B — mirror digest-last.json → desk/src/data/digest-cadence.ts before allowlist stage (soft if missing).
# Pass E — mirror x-taste-last.json → desk/src/data/x-taste.ts (soft if missing; never invent cards).
DESK="$ROOT/desk"
if [ -z "${DRY:-}" ] && [ -d "$DESK" ]; then
  ( cd "$DESK" && bun -e 'import { syncDigestCadenceFromDisk } from "./src/lib/digest-pack-disk.ts";
const r = syncDigestCadenceFromDisk(process.cwd());
console.log(r.status === "wrote" ? `[backup-stage] digest-cadence synced pack_id=${r.last.pack_id}` : `[backup-stage] digest-cadence soft — ${r.reason}`);
' ) || echo "[backup-stage] digest-cadence sync soft-failed (continuing)" >&2
  ( cd "$DESK" && bun -e 'import { syncXTasteFromDisk } from "./src/lib/x-taste-disk.ts";
const r = syncXTasteFromDisk(process.cwd());
console.log(r.status === "wrote" ? `[backup-stage] x-taste synced kept=${r.snap.counts.kept}` : `[backup-stage] x-taste soft — ${r.reason}`);
' ) || echo "[backup-stage] x-taste sync soft-failed (continuing)" >&2
fi
shopt -s nullglob
files=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"; line="$(printf '%s' "$line" | tr -d '[:space:]')"
  [ -z "$line" ] && continue
  case "$line" in /*|*..*|*'**'*|*/) echo "[backup-stage] refusing pattern: $line" >&2; exit 2 ;; esac
  for f in "$ROOT"/$line; do
    [ -f "$f" ] && [ ! -L "$f" ] && files+=("${f#"$ROOT"/}")
  done
done < "$LIST"
if [ "${#files[@]}" -eq 0 ]; then echo "[backup-stage] nothing to stage"; exit 0; fi
for f in "${files[@]}"; do
  if [ "$DRY" = "--dry" ]; then echo "would stage $f"; else git -C "$ROOT" add -- "$f"; fi
done
echo "[backup-stage] ${DRY:+(dry) }${#files[@]} allowlisted path(s)"
