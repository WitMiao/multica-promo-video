"""Measure each representative cue's level against the music bed.

    audio/.venv/bin/python audio/cues.py out/audio_only.wav
"""
import sys
import numpy as np
import soundfile as sf

CUES = [
    (0.867, "type_long"), (1.867, "pop"), (6.2, "crt_off+wipe"), (9.133, "stamp"), (10.233, "notify"),
    (12.0, "impact_big"), (12.567, "whoosh_soft"), (14.5, "shimmer"), (18.0, "whoosh_big"), (18.433, "cascade"),
    (19.6, "pop_soft"), (24.667, "click"), (25.567, "select"), (26.067, "swoosh"), (26.8, "land"),
    (27.267, "blip"), (29.533, "ding"), (30.733, "success"), (32.0, "whoosh"), (34.0, "tick"),
    (44.933, "error"), (46.333, "send"), (49.4, "chime"), (53.967, "stamp2"), (54.5, "notify2"),
    (64.5, "check_1"), (72.167, "impact_soft"), (76.0, "impact_big2"), (84.0, "impact_final"),
]

mix, sr = sf.read(sys.argv[1])
mus, _ = sf.read("public/audio/music.wav")
mvol = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
n = min(len(mix), len(mus))
mix, mus = mix[:n], mus[:n] * mvol
sfx = mix - mus


def rms(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


for t, name in CUES:
    a = int(t * sr)
    w = int(0.1 * sr)
    s = max(rms(sfx[a + k : a + k + w]) for k in range(0, int(0.8 * sr), w // 2))
    m = rms(mus[max(0, a - int(0.5 * sr)) : a + int(0.5 * sr)])
    print(f"{t:7.3f} {name:13s} sfx {s:6.1f} music {m:6.1f} diff {s - m:+5.1f}")
print("mix peak", round(20 * np.log10(np.abs(mix).max()), 2))
