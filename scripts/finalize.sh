#!/usr/bin/env bash
# Master the rendered mix and mux the deliverable.
#   scripts/finalize.sh out/draft.mkv out/multica-promo.mp4
# 1. pull the PCM mix Remotion rendered (music + every placed effect)
# 2. two-pass EBU R128 normalisation to -14 LUFS / -1 dBTP (linear gain + limiter)
# 3. copy the H.264 stream, encode AAC 320k, faststart for the web
set -euo pipefail

in="$1"
out="$2"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

ffmpeg -y -v error -i "$in" -vn -c:a pcm_s24le -ar 48000 "$tmp/mix.wav"

stats="$(ffmpeg -v info -i "$tmp/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')"
get() { echo "$stats" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }

ffmpeg -y -v error -i "$tmp/mix.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,alimiter=limit=0.82:level=false" \
  -ar 48000 -c:a pcm_s24le "$tmp/master.wav"

ffmpeg -y -v error -i "$in" -i "$tmp/master.wav" -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 320k -movflags +faststart "$out"

ffmpeg -v info -i "$out" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" || true
echo "$out"
