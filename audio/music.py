"""Compose and render the score to public/audio/music.wav.

120 BPM, 4/4, 45 bars (90 s) — the same grid as src/timeline.ts, so every
section change lands on a scene cut.

    audio/.venv/bin/python audio/music.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

from pedalboard import HighShelfFilter, LowShelfFilter

from dsp import (
    RNG, SR, Compressor, HighpassFilter, Limiter, Pedalboard, adsr, delay, exp_decay, fade, fx,
    midi_hz, noise, normalize, place, reverb, saw, sine, square, supersaw, svf, to_stereo,
)

OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)

BEAT = 0.5
BAR = 2.0
BARS = 45
TOTAL = BARS * BAR
INTRO_CUT = 700 / 60  # the problem scene smash-cuts to black at frame 700


def N(sec: float) -> int:
    return int(round(sec * SR))


def bar_t(b: float) -> float:
    return b * BAR


def buf() -> np.ndarray:
    return np.zeros((2, N(TOTAL + 4)))


# ------------------------------------------------------------------ harmony

CHORDS = {
    "F": {"bass": 41, "pad": [57, 60, 64, 67]},  # Fmaj9 (A C E G over F)
    "G": {"bass": 43, "pad": [59, 62, 64, 67]},  # G6
    "Am": {"bass": 45, "pad": [60, 64, 67, 71]},  # Am9
    "Em": {"bass": 40, "pad": [59, 62, 64, 67]},  # Em7
    "C": {"bass": 36, "pad": [48, 55, 59, 62, 64]},  # Cmaj9
}
LOOP = ["F", "G", "Am", "Em"]


def chord_at(b: int) -> str:
    if b >= 42:
        return "C"
    return LOOP[(b - 6) % 4]


# melody: (beat offset within bar, midi, length in beats) per bar of the loop
MELODY = [
    [(0, 76, 0.75), (0.75, 77, 0.75), (1.5, 79, 1.5), (3, 72, 1)],
    [(0, 74, 0.75), (0.75, 76, 0.75), (1.5, 74, 1.0), (2.5, 71, 1.5)],
    [(0, 72, 0.75), (0.75, 74, 0.75), (1.5, 76, 1.5), (3, 81, 1)],
    [(0, 79, 1.5), (1.5, 76, 1), (2.5, 74, 0.5), (3, 71, 1)],
    [(0, 76, 0.75), (0.75, 77, 0.75), (1.5, 79, 1), (2.5, 81, 0.5), (3, 84, 1)],
    [(0, 83, 1.5), (1.5, 79, 1), (2.5, 74, 1.5)],
    [(0, 76, 0.75), (0.75, 79, 0.75), (1.5, 81, 2.5)],
    [(0, 79, 1), (1, 76, 1), (2, 71, 2)],
]

# ------------------------------------------------------------------ instruments


def kick(vel: float = 1.0) -> np.ndarray:
    n = N(0.5)
    t = np.arange(n) / SR
    f = 46 + (165 - 46) * np.exp(-t / 0.032)
    body = sine(f, n, 0.0) * exp_decay(n, 0.24)
    click = svf(noise(n), 3500, 0.9, "bp") * exp_decay(n, 0.003) * 0.35
    x = np.tanh(1.6 * (body + click)) / np.tanh(1.6)
    return x * vel


def clap(vel: float = 1.0) -> np.ndarray:
    n = N(0.4)
    out = np.zeros(n)
    for k, off in enumerate([0.0, 0.010, 0.021]):
        i = N(off)
        m = N(0.02)
        out[i : i + m] += svf(noise(m), 1250, 0.9, "bp") * exp_decay(m, 0.006) * (1 - k * 0.15)
    i = N(0.028)
    out[i:] += svf(noise(n - i), 1150, 0.7, "bp") * exp_decay(n - i, 0.11) * 0.8
    return reverb(out * vel, size=0.35, wet=0.22, dry=1.0, tail=0.4)


def snare(vel: float = 1.0) -> np.ndarray:
    n = N(0.18)
    body = sine(np.geomspace(240, 180, n), n) * exp_decay(n, 0.04) * 0.6
    sn = svf(noise(n), 2200, 0.6, "bp") * exp_decay(n, 0.06)
    return (body + sn) * vel


def hat(vel: float = 1.0, open_: bool = False) -> np.ndarray:
    n = N(0.4 if open_ else 0.08)
    x = svf(noise(n), 7500, 0.8, "hp") + svf(noise(n), 11000, 1.5, "bp") * 0.5
    return x * exp_decay(n, 0.22 if open_ else 0.022) * vel


def crash(vel: float = 1.0, dur: float = 2.6) -> np.ndarray:
    n = N(dur)
    x = svf(noise(n), 4200, 0.7, "hp") + svf(noise(n), 8500, 2.0, "bp") * 0.6
    x = x * exp_decay(n, 0.8) * adsr(n, 0.001, 0.02, 1, 0.3)
    st = np.stack([x, svf(noise(n), 4200, 0.7, "hp") * exp_decay(n, 0.8)])
    return reverb(st * vel, size=0.7, wet=0.25, tail=1.0)


def riser(dur: float, vel: float = 1.0) -> np.ndarray:
    n = N(dur)
    t = np.linspace(0, 1, n)
    nz = svf(noise(n), 300 * (7000 / 300) ** t, 1.6, "bp") * 1.4
    tone = saw(220 * 2 ** (t * 2), n) * 0.12 + saw(220 * 2 ** (t * 2) * 1.01, n) * 0.12
    tone = svf(tone, 400 + 5000 * t ** 2, 1.0)
    env = t ** 2.2
    x = (nz + tone) * env
    st = np.stack([x, np.roll(x, 240)])
    return reverb(st * vel, size=0.8, wet=0.3, tail=0.5)


def reverse_cymbal(dur: float, vel: float = 1.0) -> np.ndarray:
    c = crash(1.0, dur)[:, : N(dur)]
    return c[:, ::-1] * vel


def downlifter(dur: float, vel: float = 1.0) -> np.ndarray:
    n = N(dur)
    t = np.linspace(0, 1, n)
    x = svf(noise(n), 6000 * (150 / 6000) ** t, 1.4, "bp") * (1 - t) ** 1.5 * 1.5
    x += sine(np.geomspace(300, 40, n), n) * (1 - t) ** 2 * 0.5
    return reverb(x * vel, size=0.8, wet=0.3, tail=0.8)


def pad_note(m: float, dur: float, cutoff: float | np.ndarray, attack: float = 0.35, release: float = 1.3) -> np.ndarray:
    n = N(dur + release)
    x = supersaw(midi_hz(m), n, voices=5, detune_cents=16)
    x = svf(x, cutoff if np.isscalar(cutoff) else cutoff[:n], 0.6)
    return x * adsr(n, attack, 0.9, 0.8, release, gate=dur)


def pluck(m: float, cutoff_peak: float = 4200, length: float = 0.3) -> np.ndarray:
    n = N(length)
    t = np.arange(n) / SR
    f = midi_hz(m)
    x = saw(f, n) + 0.45 * square(f * 1.004, n, 0.3)
    y = svf(x, 260 + cutoff_peak * np.exp(-t / 0.055), 0.95)
    return y * adsr(n, 0.002, 0.14, 0.22, 0.08)


def lead_note(m: float, dur: float) -> np.ndarray:
    n = N(dur + 0.25)
    t = np.arange(n) / SR
    f = midi_hz(m)
    vib = 1 + 0.0045 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.2) / 0.25, 0, 1)
    x = saw(f * vib, n) * 0.55 + saw(f * vib * 1.0065, n) * 0.55 + square(f * vib * 0.5, n, 0.42) * 0.22
    y = svf(x, 2300 + 1800 * np.exp(-t / 0.12), 0.75)
    y = y * adsr(n, 0.014, 0.25, 0.72, 0.22, gate=dur)
    # glassy octave layer
    b = sine(f * 2 + sine(f * 4, n) * f * 1.2 * np.exp(-t / 0.2), n) * np.exp(-t / 0.5) * 0.22
    return y + b


def bass_note(m: float, dur: float, bright: float = 1.0) -> np.ndarray:
    n = N(dur + 0.06)
    t = np.arange(n) / SR
    f = midi_hz(m)
    sub = sine(f, n)
    mid = svf(saw(f, n), 380 + 900 * bright * np.exp(-t / 0.06), 1.0) * 0.5
    x = np.tanh(1.4 * (sub + mid)) / np.tanh(1.4)
    return x * adsr(n, 0.004, 0.12, 0.85, 0.05, gate=dur)


def bell(m: float, dur: float, bright: float = 0.6) -> np.ndarray:
    n = N(dur)
    f = midi_hz(m)
    mod = sine(f * 2.0, n) * f * 1.5 * bright * exp_decay(n, dur * 0.25)
    return sine(f + mod, n) * exp_decay(n, dur * 0.3) * adsr(n, 0.002, 0.05, 1, 0.01)


# ------------------------------------------------------------------ arrangement


def in_ranges(b: int, ranges: list[tuple[int, int]]) -> bool:
    return any(a <= b < c for a, c in ranges)


def compose() -> np.ndarray:
    drums = buf()
    pads = buf()
    bass = buf()
    arp = buf()
    lead = buf()
    bells = buf()
    fxb = buf()
    intro = buf()
    kicks: list[float] = []

    # ---------------- intro (bars 0-6): tension, cut at INTRO_CUT
    n = N(INTRO_CUT)
    t = np.arange(n) / SR
    cut = np.linspace(150, 900, n) ** 1.0
    drone = supersaw(55.0, n, 5, 22) * 0.8 + supersaw(82.41, n, 5, 18) * 0.5
    drone = svf(drone, cut, 0.9) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.5 * t))
    drone += to_stereo(sine(55.0, n) * 0.5)
    place(intro, drone * np.clip(t / 1.5, 0, 1) * 0.55, 0)
    # clock ticks
    for i in range(int(INTRO_CUT / 0.25)):
        at = i * 0.25
        if at >= INTRO_CUT - 0.05:
            break
        accent = 1.0 if i % 2 == 0 else 0.6
        tn = N(0.03)
        tk = svf(noise(tn), 6000, 2.5, "bp") * exp_decay(tn, 0.004) * accent
        place(intro, to_stereo(tk, 0.35 if i % 2 else -0.35), at, 0.22)
    # heartbeat sub pulses from bar 1
    for b in range(1, 6):
        for off, v in ((0.0, 1.0), (0.32, 0.7)):
            place(intro, kick(0.55 * v) * 0.8, bar_t(b) + off)
            place(intro, kick(0.45 * v) * 0.8, bar_t(b) + 1.0 + off)
    # minor pluck motif from bar 2, slowly opening
    motif = [57, 60, 64, 71, 69, 64, 60, 64]
    for b in range(2, 6):
        for s in range(8):
            at = bar_t(b) + s * 0.25
            if at >= INTRO_CUT:
                break
            pk = pluck(motif[s] + (12 if b >= 4 and s % 4 == 3 else 0), cutoff_peak=900 + 700 * (b - 2), length=0.35)
            place(intro, to_stereo(pk, -0.4 + 0.8 * (s % 2)), at, 0.16)
    # dissonant cluster bars 3-6
    cn = N(INTRO_CUT - bar_t(3))
    ct = np.arange(cn) / SR
    cl = (sine(midi_hz(81), cn) + sine(midi_hz(82), cn) * 0.8 + sine(midi_hz(87), cn) * 0.4)
    cl *= (ct / ct[-1]) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * ct))
    place(intro, reverb(cl, 0.8, 0.4, tail=0.1)[:, :cn] * 0.05, bar_t(3))
    # riser + snare roll into the cut
    place(intro, riser(INTRO_CUT - bar_t(4.5) + 0.05, 0.9)[:, : N(INTRO_CUT - bar_t(4.5))], bar_t(4.5), 0.5)
    roll_t = bar_t(5)
    k = 0
    while roll_t < INTRO_CUT - 0.03:
        place(intro, to_stereo(snare(0.35 + 0.65 * (roll_t - bar_t(5)) / (INTRO_CUT - bar_t(5)))), roll_t, 0.35)
        step = 0.125 if roll_t < bar_t(5) + 1.0 else 0.0625
        roll_t += step
        k += 1
    intro[:, N(INTRO_CUT) :] = 0
    intro[:, N(INTRO_CUT) - N(0.004) : N(INTRO_CUT)] *= np.linspace(1, 0, N(0.004))

    # ---------------- harmony from bar 6
    for b in range(6, BARS):
        ch = CHORDS[chord_at(b)]
        at = bar_t(b)
        if b >= 42:
            if b > 42:
                continue
            for m in ch["pad"]:
                place(pads, pad_note(m, 5.0, 2600, attack=0.08, release=2.6), at, 0.5)
            place(pads, pad_note(ch["pad"][-1] + 12, 5.0, 3000, attack=0.4, release=2.6), at, 0.25)
            continue
        # section-dependent pad colour
        if b < 9:
            cutoff, lvl, attack = 2400, 0.55, 0.9 if b == 6 else 0.4
        elif b < 16:
            cutoff, lvl, attack = 2200, 0.42, 0.35
        elif b < 30:
            cutoff, lvl, attack = 5000, 0.4, 0.3
        elif b < 32:
            cutoff, lvl, attack = 1400, 0.3, 0.5
        elif b < 36:
            cutoff, lvl, attack = 900 + (b - 32) * 900, 0.3 + (b - 32) * 0.05, 0.3
        elif b < 38:
            cutoff, lvl, attack = 4200, 0.6, 0.1
        else:
            cutoff, lvl, attack = 7000, 0.48, 0.12
        hold = 2.0 if not (b == 37) else 1.5
        for m in ch["pad"]:
            place(pads, pad_note(m, hold, cutoff, attack=attack), at, lvl)
        if b >= 16 and b not in (30, 31):
            place(pads, pad_note(ch["pad"][-1] + 12, hold, cutoff, attack=attack), at, lvl * 0.35)

    # ---------------- bass
    for b in range(6, 42):
        ch = CHORDS[chord_at(b)]
        root = ch["bass"]
        at = bar_t(b)
        if b < 9 or b in (30, 31):
            place(bass, to_stereo(bass_note(root, 1.9, bright=0.3)), at, 0.55 if b < 9 else 0.3)
        elif b < 16 or 32 <= b < 36:
            for s in range(4):
                place(bass, to_stereo(bass_note(root, 0.22)), at + s * 0.5 + 0.25, 0.6)
        elif b in (36, 37):
            place(bass, to_stereo(bass_note(root, 0.9)), at, 0.62)
            place(bass, to_stereo(bass_note(root, 0.4 if b == 37 else 0.9)), at + 1.0, 0.62)
        else:
            pattern = [(0.0, 0, 0.2), (0.25, 0, 0.2), (0.5, 12, 0.15), (0.75, 0, 0.2)]
            for beat in range(4):
                for off, oct_, ln in pattern:
                    if beat == 0 and off == 0.0:
                        continue  # leave the downbeat to the kick
                    place(bass, to_stereo(bass_note(root + oct_, ln, bright=1.2 if oct_ else 1.0)), at + beat * 0.5 + off, 0.42)
    # outro sub
    place(bass, to_stereo(bass_note(36, 4.5, bright=0.2)), bar_t(42), 0.55)

    # ---------------- arp
    arp_ranges = [(9, 30), (30, 32), (32, 36), (38, 42)]
    for b in range(9, 42):
        if not in_ranges(b, arp_ranges):
            continue
        ch = CHORDS[chord_at(b)]
        tones = ch["pad"] + [m + 12 for m in ch["pad"]]
        order = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3]
        peak = 4200
        lvl = 0.16
        if b < 16:
            peak, lvl = 2600, 0.14
        if 30 <= b < 32:
            peak, lvl = 900 + (b - 30) * 500, 0.16
        if 32 <= b < 36:
            peak, lvl = 1200 + (b - 32) * 900, 0.15
        for s in range(16):
            vel = 1.0 if s % 4 == 0 else 0.7
            pk = pluck(tones[order[s]], peak, 0.28)
            place(arp, to_stereo(pk, -0.35 if s % 2 else 0.35), bar_t(b) + s * 0.125, lvl * vel)

    # ---------------- lead
    def play_melody(start_bar: int, bars: range, gain: float) -> None:
        for i, mb in enumerate(bars):
            for off, m, ln in MELODY[mb]:
                place(lead, to_stereo(lead_note(m, ln * BEAT * 0.92)), bar_t(start_bar + i) + off * BEAT, gain)

    play_melody(16, range(0, 8), 0.2)
    play_melody(38, range(4, 8), 0.27)
    # offbeat chord stabs lift the final drop
    for b in range(38, 42):
        ch = CHORDS[chord_at(b)]
        for beat in range(4):
            for m in ch['pad']:
                place(lead, pad_note(m + 12, 0.14, 6000, attack=0.003, release=0.12), bar_t(b) + beat * 0.5 + 0.25, 0.07)
    # counter-melody bells for the second half of the features
    for b in range(24, 30):
        ch = CHORDS[chord_at(b)]
        for s, idx in enumerate([3, 2, 1, 2]):
            m = ch["pad"][idx] + 12
            place(bells, to_stereo(bell(m, 1.0), -0.5 + 0.33 * s), bar_t(b) + s * 0.5 + 0.25, 0.1)
    # reveal sparkle
    for i, m in enumerate([84, 88, 91, 93, 96, 93, 91, 88, 84, 86, 88, 91]):
        place(bells, to_stereo(bell(m, 1.2, 0.4), -0.7 + (i % 5) * 0.35), bar_t(7) + i * 0.25, 0.09)
    # outro motif
    for i, m in enumerate([72, 76, 79, 83, 84]):
        place(bells, to_stereo(bell(m, 2.5, 0.45), -0.6 + i * 0.3), bar_t(42) + 0.5 + i * 0.25, 0.14)

    # ---------------- drums
    def kick_at(at: float, v: float = 1.0) -> None:
        place(drums, kick(v), at, 0.9)
        kicks.append(at)

    for b in range(9, 42):
        at = bar_t(b)
        full = 16 <= b < 30 or 38 <= b < 42
        groove_a = 9 <= b < 16
        build = 32 <= b < 36
        half = b in (36, 37)
        if groove_a or full or build:
            for beat in range(4):
                kick_at(at + beat * 0.5, 0.6 if (build and b < 34) else 1.0)
        if half:
            kick_at(at, 1.0)
            kick_at(at + 1.0, 0.9)
        if (10 <= b < 16) or full or 34 <= b < 36:
            for beat in (1, 3):
                place(drums, clap(0.9), at + beat * 0.5, 0.5)
        if half:
            place(drums, clap(1.0), at + 1.0, 0.55)
        if groove_a or full or build:
            for beat in range(4):
                place(drums, to_stereo(hat(0.9), 0.25), at + beat * 0.5 + 0.25, 0.42)
            if full or (build and b >= 34):
                for s in range(16):
                    if s % 2 == 0:
                        place(drums, to_stereo(hat(0.35 + 0.2 * (s % 4 == 0)), -0.25), at + s * 0.125, 0.3)
            if full:
                for beat in range(4):
                    place(drums, to_stereo(hat(0.5, True), 0.3), at + beat * 0.5 + 0.25, 0.17)
    for b in (9, 16, 20, 24, 28, 32, 36, 38, 40):
        place(drums, crash(1.0), bar_t(b), 0.35 if b != 32 else 0.2)

    # fills, risers, transitions
    def roll(start: float, end: float, gain: float) -> None:
        t0 = start
        while t0 < end - 0.02:
            p = (t0 - start) / (end - start)
            place(drums, to_stereo(snare(0.4 + 0.6 * p)), t0, gain)
            t0 += 0.125 if p < 0.5 else 0.0625

    roll(bar_t(15) + 1.0, bar_t(16), 0.32)
    roll(bar_t(35), bar_t(36), 0.32)
    roll(bar_t(37), bar_t(38) - 0.5, 0.34)
    place(fxb, reverse_cymbal(1.5, 0.9), bar_t(9) - 1.5, 0.45)
    place(fxb, riser(2.0), bar_t(16) - 2.0, 0.32)
    place(fxb, downlifter(2.5), bar_t(30), 0.4)
    place(fxb, riser(4.0), bar_t(36) - 4.0, 0.34)
    place(fxb, riser(3.5)[:, : N(3.5)], bar_t(38) - 4.0, 0.42)
    place(fxb, reverse_cymbal(2.0, 1.0), bar_t(42) - 2.0, 0.3)

    # ---------------- buses
    total = drums.shape[1]
    tt = np.arange(total) / SR
    duck = np.ones(total)
    for k in kicks:
        i = N(k)
        seg = tt[i:] - k
        g = 1 - 0.6 * np.exp(-seg / 0.11)
        duck[i:] = np.minimum(duck[i:], g)
    # restore slowly between kicks
    duck_b = 1 - (1 - duck) * 1.15
    duck_b = np.clip(duck_b, 0.2, 1)

    pads_fx = fx(pads, Pedalboard([HighpassFilter(140)]))
    pads_fx = reverb(pads_fx, size=0.92, wet=0.32, dry=0.85, width=1.0, tail=0)[:, :total]
    arp_fx = delay(arp, 0.375, 0.32, 0.28, tail=0)[:, :total]
    arp_fx = reverb(arp_fx, size=0.75, wet=0.22, dry=0.9, tail=0)[:, :total]
    lead_fx = delay(lead, 0.375, 0.28, 0.22, tail=0)[:, :total]
    lead_fx = reverb(lead_fx, size=0.85, wet=0.28, dry=0.9, tail=0)[:, :total]
    bells_fx = reverb(bells, size=0.9, wet=0.4, dry=0.8, tail=0)[:, :total]
    intro_fx = intro  # already shaped, hard cut must stay hard

    mix = (
        drums * 0.95
        + pads_fx * duck * 0.9
        + bass * duck_b * 0.95
        + arp_fx * duck * 0.9
        + lead_fx * (0.6 + 0.4 * duck)
        + bells_fx
        + fxb
        + intro_fx
    )
    # silence gap before the drop (beat 4 of bar 37 is a held breath)
    gap0, gap1 = N(bar_t(38) - 0.5), N(bar_t(38))
    ramp = N(0.03)
    mix[:, gap0 : gap0 + ramp] *= np.linspace(1, 0.15, ramp)
    mix[:, gap0 + ramp : gap1] *= 0.15
    # the end fades to silence
    end0 = N(TOTAL - 2.5)
    mix[:, end0:] *= np.linspace(1, 0, mix.shape[1] - end0) ** 1.5
    mix = mix[:, : N(TOTAL)]

    board = Pedalboard([
        HighpassFilter(28),
        LowShelfFilter(cutoff_frequency_hz=140, gain_db=-1.5),
        HighShelfFilter(cutoff_frequency_hz=5000, gain_db=3.5),
        Compressor(threshold_db=-12, ratio=1.6, attack_ms=25, release_ms=200),
        Limiter(threshold_db=-2.0, release_ms=120),
    ])
    mix = board(normalize(mix, -3).astype(np.float32), SR).astype(np.float64)
    mix *= 10 ** (-4 / 20)  # JUCE's limiter outputs at 0 dBFS; leave room for the effects
    return fade(mix, 0.001, 0.05)


if __name__ == "__main__":
    out = compose()
    sf.write(OUT / "music.wav", out.T, SR, subtype="PCM_24")
    print(f"music.wav: {out.shape[1] / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(out))):.2f} dBFS")
