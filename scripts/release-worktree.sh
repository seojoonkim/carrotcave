#!/usr/bin/env bash
# Deploy a pushed commit from a dedicated, persistent release worktree.
# Usage: scripts/release-worktree.sh <sha> [log]
#   RELEASE_DIR overrides the worktree path (default: ../carrotcave-release, never /tmp).
#   PREFLIGHT_ONLY=1 checks/repairs the worktree and exits without deploying.
set -uo pipefail

SHA="${1:?usage: release-worktree.sh <sha> [log]}"
LOG="${2:-/tmp/cc-release-$(date +%Y%m%d-%H%M%S).log}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${RELEASE_DIR:-$(dirname "$REPO")/carrotcave-release}"

case "$DIR" in
  /tmp/*|/private/tmp/*) echo "release-worktree: refusing $DIR (macOS cleans /tmp; use a persistent path)" >&2; exit 2 ;;
esac

git -C "$REPO" fetch -q origin || { echo "release-worktree: fetch failed" >&2; exit 3; }
git -C "$REPO" cat-file -e "$SHA^{commit}" 2>/dev/null || { echo "release-worktree: unknown commit $SHA" >&2; exit 3; }

healthy() {
  [ -d "$1" ] && [ "$(git -C "$1" rev-parse --show-toplevel 2>/dev/null)" = "$(cd "$1" && pwd -P)" ]
}

if ! healthy "$DIR"; then
  echo "release-worktree: $DIR is missing or not a git worktree; recreating" >&2
  git -C "$REPO" worktree prune
  if [ -e "$DIR" ]; then
    mv "$DIR" "$DIR.broken-$(date +%s)" || { echo "release-worktree: cannot move broken $DIR" >&2; exit 4; }
  fi
  git -C "$REPO" worktree add -q --detach "$DIR" "$SHA" || { echo "release-worktree: worktree add failed" >&2; exit 4; }
fi

git -C "$DIR" checkout -q --detach "$SHA" || { echo "release-worktree: checkout failed" >&2; exit 5; }

STAMP="$DIR/node_modules/.lock-sha"
LOCK_SHA="$(shasum -a 256 "$DIR/package-lock.json" | cut -d' ' -f1)"
if [ -L "$DIR/node_modules" ] || [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$LOCK_SHA" ]; then
  rm -rf "$DIR/node_modules"
  (cd "$DIR" && npm ci --no-audit --no-fund >/dev/null 2>&1) || { echo "release-worktree: npm ci failed" >&2; exit 6; }
  echo "$LOCK_SHA" > "$STAMP"
fi

healthy "$DIR" || { echo "release-worktree: worktree still unhealthy" >&2; exit 7; }
echo "release-worktree: ready $DIR @ $(git -C "$DIR" rev-parse --short HEAD)"
[ "${PREFLIGHT_ONLY:-0}" = "1" ] && exit 0

(cd "$DIR" && HOME=/Users/gimseojun npm run release:production) > "$LOG" 2>&1
rc=$?
echo "EXIT $rc" >> "$LOG"
exit $rc
