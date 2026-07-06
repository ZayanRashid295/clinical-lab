#!/usr/bin/env bash
# Copy program landing carousel + resource images into public (run from repo root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/frontend-next/public/images/landing-v2/shared"
mkdir -p "$DEST"
cp "$ROOT/scoller 2.jpeg" "$DEST/scroller-2.jpeg"
cp "$ROOT/scroller 3.jpeg" "$DEST/scroller-3.jpeg"
cp "$ROOT/per answer explanation.jpeg" "$DEST/per-answer-explanation.jpeg"
cp "$ROOT/dd.jpeg" "$DEST/dd.jpeg"
cp "$ROOT/image.jpeg" "$DEST/visual-explanations.jpeg"
echo "Synced landing v2 shared images to $DEST"
ls -la "$DEST"
