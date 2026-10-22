#!/usr/bin/env bash
# Tile frames of a rendered video at the given seconds into one review sheet.
#   scripts/vsheet.sh out/draft.mkv out/vsheet.jpg 1.5 3 4.5 6 [cols=3 via COLS env]
set -euo pipefail
in="$1"; out="$2"; shift 2
cols="${COLS:-3}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
i=0
for t in "$@"; do
  ffmpeg -y -v error -ss "$t" -i "$in" -frames:v 1 -vf "scale=640:360" "$tmp/$(printf %03d $i).png"
  i=$((i+1))
done
ffmpeg -y -v error -pattern_type glob -i "$tmp/*.png" -vf "tile=${cols}x$(( (i + cols - 1) / cols ))" -frames:v 1 "$out"
echo "$out"
