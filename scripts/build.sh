#!/usr/bin/env bash
# Render the film (H.264 + PCM in MKV), then master the audio into the MP4.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.ts MulticaPromo out/render.mkv \
  --codec=h264-mkv --audio-codec=pcm-16 --crf=14 --x264-preset=slow --concurrency=8
scripts/finalize.sh out/render.mkv out/multica-promo.mp4
