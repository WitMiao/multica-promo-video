#!/usr/bin/env bash
# One-time setup: Node deps, Python venv, fonts, brand images, grain, sound.
set -euo pipefail
cd "$(dirname "$0")/.."

npm install --no-fund --no-audit
[ -x audio/.venv/bin/python ] || python3 -m venv audio/.venv
audio/.venv/bin/pip install -q numpy scipy soundfile pedalboard numba fonttools brotli pillow

# Open-licence fonts (OFL) from the google/fonts repository.
mkdir -p .cache/fonts public/fonts public/images
fetch() { [ -s ".cache/fonts/$2" ] || curl -sfL -o ".cache/fonts/$2" "https://github.com/google/fonts/raw/main/ofl/$1"; }
fetch "notoserifsc/NotoSerifSC%5Bwght%5D.ttf" NotoSerifSC-VF.ttf
fetch "notosanssc/NotoSansSC%5Bwght%5D.ttf" NotoSansSC-VF.ttf
fetch "instrumentserif/InstrumentSerif-Regular.ttf" InstrumentSerif-Regular.ttf
fetch "instrumentserif/InstrumentSerif-Italic.ttf" InstrumentSerif-Italic.ttf
fetch "inter/Inter%5Bopsz,wght%5D.ttf" Inter-VF.ttf
fetch "geistmono/GeistMono%5Bwght%5D.ttf" GeistMono-VF.ttf
cp .cache/fonts/{InstrumentSerif-Regular.ttf,InstrumentSerif-Italic.ttf,Inter-VF.ttf,GeistMono-VF.ttf} public/fonts/
audio/.venv/bin/python scripts/subset-fonts.py

# Brand illustrations come straight from the landing page.
cp ../apps/web/public/images/landing-bg.webp ../apps/web/public/images/feature-bg-4.webp public/images/

audio/.venv/bin/python scripts/noise.py
audio/.venv/bin/python audio/sfx.py
audio/.venv/bin/python audio/music.py
