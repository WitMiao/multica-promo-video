"""Measure how far each narration line sits above the bed (music + effects).

Rebuilds the narration stem from public/vo and src/vo-timing.json, subtracts
it from a rendered mix, and compares speech-weighted levels per line.

    audio/.venv/bin/python audio/vo_check.py out/audio_only.wav [vo_gain]
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
mix, sr = sf.read(sys.argv[1])
gain = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
if mix.ndim == 1:
    mix = np.stack([mix, mix], axis=1)
stem = np.zeros_like(mix)
lines = json.loads((ROOT / "src" / "vo-timing.json").read_text())["lines"]
# start times come from the script, which may be retimed without re-rendering
starts = {l["id"]: l["at"] for l in json.loads((ROOT / "src" / "narration.json").read_text())["lines"]}
for l in lines:
    l["at"] = starts[l["id"]]
for l in lines:
    x, vsr = sf.read(ROOT / "public" / "vo" / f"{l['id']}.wav")
    assert vsr == sr, (vsr, sr)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    a = int(round(l["at"] * 60)) / 60 * sr
    a = int(round(a))
    b = min(len(stem), a + len(x))
    stem[a:b] += x[: b - a] * gain
bed = mix - stem


def speech_db(x):
    h = int(sr * 0.05)
    n = len(x) // h
    f = x[: n * h].mean(axis=1).reshape(n, h)
    db = 20 * np.log10(np.sqrt((f**2).mean(axis=1)) + 1e-9)
    return float(np.median(np.sort(db)[len(db) // 2 :]))


worst = []
for l in lines:
    a = int(l["at"] * sr)
    b = int((l["at"] + l["dur"]) * sr)
    v = speech_db(stem[a:b])
    m = speech_db(bed[a:b])
    worst.append((v - m, l["id"]))
    print(f"{l['id']:3s} {l['at']:6.2f}s  voice {v:6.1f}  bed {m:6.1f}  margin {v - m:+5.1f} dB")
print("min margin", round(min(worst)[0], 1), "at", min(worst)[1], "| mix peak", round(20 * np.log10(np.abs(mix).max()), 2))
