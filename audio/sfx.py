"""Synthesise the film's sound-effect library into public/sfx/*.wav.

    audio/.venv/bin/python audio/sfx.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

from dsp import (
    RNG, SR, adsr, delay, exp_decay, fade, midi_hz, noise, normalize, place, reverb, saw, sine,
    square, svf, to_stereo,
)

OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)


def N(sec: float) -> int:
    return int(round(sec * SR))


def save(name: str, x: np.ndarray, peak_db: float = -3.0) -> None:
    x = to_stereo(x)
    x = fade(x, 0.0005, 0.02)
    sf.write(OUT / f"{name}.wav", normalize(x, peak_db).T, SR, subtype="PCM_24")


def blank(sec: float) -> np.ndarray:
    return np.zeros((2, N(sec)))


# ------------------------------------------------------------------ building blocks


def keyclick(strength: float = 1.0) -> np.ndarray:
    n = N(0.05)
    click = svf(noise(n), RNG.uniform(2500, 4500), 1.2, "bp") * exp_decay(n, 0.004)
    thock = sine(np.linspace(260, 150, n), n) * exp_decay(n, 0.012) * 0.6
    return (click * 1.4 + thock) * strength


def typing(sec: float, rate: tuple[float, float] = (0.05, 0.13)) -> np.ndarray:
    buf = blank(sec + 0.1)
    t = 0.02
    while t < sec:
        k = keyclick(RNG.uniform(0.5, 1.0))
        place(buf, to_stereo(k, RNG.uniform(-0.3, 0.3)), t)
        t += RNG.uniform(*rate)
        if RNG.random() < 0.08:
            t += 0.18  # a little pause between words
    return reverb(buf, size=0.2, wet=0.08, dry=1.0, tail=0.2)


def bell(m: float, dur: float, bright: float = 1.0) -> np.ndarray:
    n = N(dur)
    f = midi_hz(m)
    mod = sine(f * 2.0, n) * f * 1.6 * bright * exp_decay(n, dur * 0.25)
    car = sine(f + mod, n)
    partial = sine(f * 3.01, n) * 0.18 * exp_decay(n, dur * 0.15)
    return (car + partial) * exp_decay(n, dur * 0.32) * adsr(n, 0.002, 0.05, 1, 0.01)


def whoosh(sec: float, f0: float, f1: float, f2: float, pan_from: float = -0.8, pan_to: float = 0.8, q: float = 1.4) -> np.ndarray:
    n = N(sec)
    t = np.linspace(0, 1, n)
    cutoff = np.where(t < 0.55, f0 * (f1 / f0) ** (t / 0.55), f1 * (f2 / f1) ** ((t - 0.55) / 0.45))
    x = svf(noise(n), cutoff, q, "bp") * 1.6
    x += svf(noise(n), cutoff * 0.5, 0.8, "lp") * 0.5
    env = np.sin(np.pi * t ** 0.8) ** 2
    x *= env
    pan = pan_from + (pan_to - pan_from) * t
    p = (pan + 1) / 2
    st = np.stack([x * np.cos(p * np.pi / 2), x * np.sin(p * np.pi / 2)])
    return reverb(st, size=0.6, wet=0.18, dry=1.0, tail=0.6)


def sub_boom(sec: float, f_start: float, f_end: float, tau: float) -> np.ndarray:
    n = N(sec)
    f = f_end + (f_start - f_end) * np.exp(-np.arange(n) / SR / 0.08)
    return sine(f, n) * exp_decay(n, tau) * adsr(n, 0.001, 0.01, 1, 0.05)


# ------------------------------------------------------------------ library


def build() -> None:
    save("type_short", typing(0.7, (0.08, 0.14)), -6)
    save("type_long", typing(2.2), -6)

    # pops / blips
    n = N(0.12)
    pop = sine(np.geomspace(950, 380, n), n) * exp_decay(n, 0.035)
    pop += svf(noise(n), 3000, 1, "bp") * exp_decay(n, 0.004) * 0.3
    save("pop", reverb(pop, size=0.3, wet=0.12, tail=0.3), -4)
    pop2 = sine(np.geomspace(620, 300, n), n) * exp_decay(n, 0.045)
    save("pop_soft", reverb(pop2, size=0.4, wet=0.15, tail=0.4), -5)
    n = N(0.09)
    blip = sine(1320, n) * exp_decay(n, 0.03) + sine(1980, n) * exp_decay(n, 0.015) * 0.3
    save("blip", reverb(blip, size=0.4, wet=0.18, tail=0.4), -6)
    n = N(0.025)
    tick = sine(2200, n) * exp_decay(n, 0.005) + svf(noise(n), 5000, 2, "bp") * exp_decay(n, 0.002) * 0.5
    save("tick", tick, -1)

    # cascade: accelerating ascending ticks
    buf = blank(0.9)
    t = 0.0
    for i in range(14):
        n = N(0.04)
        m = 72 + i * 1.3
        tk = sine(midi_hz(m), n) * exp_decay(n, 0.012)
        place(buf, to_stereo(tk, -0.6 + i * 0.09), t, 0.6 + i * 0.03)
        t += 0.055 * (0.93 ** i)
    save("cascade", reverb(buf, size=0.5, wet=0.2, tail=0.5), -6)

    # crt off: falling zap + static
    n = N(0.32)
    zap = sine(np.geomspace(2400, 60, n), n) * exp_decay(n, 0.09)
    stat = svf(noise(n), 6000, 0.7, "hp") * exp_decay(n, 0.05) * 0.35
    save("crt_off", zap + stat, -6)

    # wipe: memory being cleared
    n = N(0.7)
    tt = np.linspace(0, 1, n)
    w = svf(noise(n), 6000 * (80 / 6000) ** tt, 2.5, "bp") * np.sin(np.pi * tt) ** 1.5
    w += sine(np.geomspace(900, 90, n), n) * 0.25 * (1 - tt)
    save("wipe", reverb(w, size=0.7, wet=0.25, tail=0.8), -5)

    # stamp: thud + slap
    n = N(0.5)
    thud = sub_boom(0.5, 140, 55, 0.12)
    slap = svf(noise(n), 1800, 0.9, "bp") * exp_decay(n, 0.02)
    save("stamp", reverb(thud + slap * 0.8, size=0.4, wet=0.15, tail=0.5), -3)

    # notifications
    buf = blank(1.0)
    place(buf, bell(88, 0.7), 0.0, 0.8)
    place(buf, bell(83, 0.9), 0.11, 0.7)
    save("notify", reverb(buf, size=0.5, wet=0.2, tail=0.6), -6)

    # whooshes
    save("whoosh_soft", whoosh(0.55, 400, 2200, 700, -0.5, 0.5), -6)
    save("whoosh", whoosh(0.5, 300, 3500, 900, 0.8, -0.8, 1.8), -4)
    save("whoosh_big", whoosh(1.1, 150, 2600, 300, -0.9, 0.9, 1.1), -3)
    save("swoosh", whoosh(0.45, 500, 4000, 1200, -0.7, 0.7, 2.0), -5)
    save("mouse_move", whoosh(0.4, 900, 1600, 900, -0.2, 0.2, 3.0) * 0.4, -18)

    # impacts
    n = N(4.0)
    boom = sub_boom(4.0, 110, 32, 1.1)
    crack = svf(noise(n), np.geomspace(9000, 300, n), 0.8, "lp") * exp_decay(n, 0.25) * 0.7
    body = saw(np.geomspace(90, 40, n), n) * exp_decay(n, 0.2) * 0.25
    hit = to_stereo(boom * 1.1 + crack + svf(body, 400, 0.7))
    shimmer = blank(4.0)
    for i, m in enumerate([72, 79, 84, 88, 91]):
        place(shimmer, to_stereo(bell(m, 2.5, 0.6), -0.6 + i * 0.3), 0.02 + i * 0.015, 0.12)
    save("impact_big", reverb(hit + shimmer, size=0.92, wet=0.35, dry=0.9, tail=2.0), -1)

    n = N(2.5)
    soft = sub_boom(2.5, 90, 38, 0.6) + svf(noise(n), np.geomspace(4000, 200, n), 0.7, "lp") * exp_decay(n, 0.15) * 0.4
    save("impact_soft", reverb(soft, size=0.85, wet=0.3, tail=1.5), -3)

    n = N(6.0)
    fin = to_stereo(sub_boom(6.0, 120, 30, 1.6) * 1.1 + svf(noise(n), np.geomspace(12000, 200, n), 0.7, "lp") * exp_decay(n, 0.4) * 0.6)
    chord = blank(6.0)
    for i, m in enumerate([60, 67, 71, 74, 76, 84]):
        place(chord, to_stereo(bell(m, 5.0, 0.5), -0.7 + i * 0.28), 0.01 * i, 0.16)
    save("impact_final", reverb(fin + chord, size=0.95, wet=0.4, dry=0.9, tail=3.0), -1)

    # shimmer sparkle
    buf = blank(2.2)
    for i, m in enumerate([84, 88, 91, 95, 96, 100]):
        place(buf, to_stereo(bell(m, 1.4, 0.4), -0.8 + i * 0.32), i * 0.06, 0.5)
    save("shimmer", reverb(delay(buf, 0.375, 0.3, 0.3, tail=1.0), size=0.9, wet=0.4, tail=1.5), -8)

    # clicks / selection
    n = N(0.06)
    c1 = svf(noise(n), 4200, 1.5, "bp") * exp_decay(n, 0.003) + sine(1800, n) * exp_decay(n, 0.004) * 0.4
    buf = blank(0.12)
    place(buf, c1, 0.0)
    place(buf, c1 * 0.6, 0.045)
    save("click", buf, -4)
    buf = blank(0.5)
    place(buf, bell(84, 0.3, 0.3), 0.0, 0.7)
    place(buf, bell(91, 0.4, 0.3), 0.07, 0.7)
    save("select", reverb(buf, size=0.4, wet=0.2, tail=0.4), -6)

    # land: soft card drop
    n = N(0.25)
    land = sub_boom(0.25, 180, 70, 0.06) + svf(noise(n), 900, 0.8, "lp") * exp_decay(n, 0.02) * 0.6
    save("land", land, -5)

    # ding, success, chime, error, send
    save("ding", reverb(bell(81, 1.2, 0.5), size=0.6, wet=0.25, tail=0.8), -6)
    buf = blank(2.0)
    for i, m in enumerate([72, 76, 79, 84]):
        place(buf, to_stereo(bell(m, 1.4, 0.45), -0.4 + i * 0.27), i * 0.075, 0.6)
    save("success", reverb(buf, size=0.7, wet=0.3, tail=1.2), -4)
    buf = blank(2.5)
    place(buf, bell(79, 1.8, 0.7), 0.0, 0.8)
    place(buf, bell(84, 2.0, 0.7), 0.3, 0.8)
    save("chime", reverb(buf, size=0.8, wet=0.3, tail=1.5), -4)
    n = N(0.22)
    err = (square(196, n) + square(208, n)) * 0.5 * adsr(n, 0.005, 0.05, 0.6, 0.08)
    save("error", svf(err, 1400, 0.7, "lp"), -10)
    n = N(0.25)
    send = sine(np.geomspace(380, 1700, n), n) * np.sin(np.linspace(0, np.pi, n)) ** 2
    send += svf(noise(n), np.geomspace(800, 6000, n), 1.5, "bp") * np.sin(np.linspace(0, np.pi, n)) * 0.4
    save("send", reverb(send, size=0.4, wet=0.15, tail=0.3), -6)

    # table checks climb the C major scale
    for i, m in enumerate([72, 74, 76, 79, 81, 84]):
        n = N(0.06)
        tk = svf(noise(n), 5000, 1.5, "bp") * exp_decay(n, 0.003) * 0.6
        buf = blank(0.7)
        place(buf, tk, 0)
        place(buf, bell(m, 0.6, 0.35), 0.0, 0.8)
        save(f"check_{i + 1}", reverb(buf, size=0.5, wet=0.2, tail=0.4), -6)

    print(f"wrote {len(list(OUT.glob('*.wav')))} files to {OUT}")


if __name__ == "__main__":
    build()
