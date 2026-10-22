"""Small synthesis toolkit: oscillators, envelopes, filters, effects."""

from __future__ import annotations

import numpy as np
from numba import njit
from pedalboard import Chorus, Compressor, Delay, HighpassFilter, Limiter, LowpassFilter, Pedalboard, Reverb

SR = 48000
RNG = np.random.default_rng(20261023)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def midi_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ oscillators


def _poly_blep(phase: np.ndarray, dt: np.ndarray) -> np.ndarray:
    out = np.zeros_like(phase)
    m = phase < dt
    t = phase[m] / dt[m]
    out[m] = t + t - t * t - 1.0
    m2 = phase > 1.0 - dt
    t2 = (phase[m2] - 1.0) / dt[m2]
    out[m2] = t2 * t2 + t2 + t2 + 1.0
    return out


def phase_of(freq: np.ndarray | float, n: int, start: float | None = None) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph0 = RNG.random() if start is None else start
    return (ph0 + np.cumsum(f) / SR) % 1.0


def saw(freq, n: int, start: float | None = None) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph = phase_of(f, n, start)
    return 2.0 * ph - 1.0 - _poly_blep(ph, f / SR)


def square(freq, n: int, pw: float = 0.5) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph = phase_of(f, n)
    dt = f / SR
    s = np.where(ph < pw, 1.0, -1.0)
    s += _poly_blep(ph, dt)
    s -= _poly_blep((ph + 1 - pw) % 1.0, dt)
    return s


def sine(freq, n: int, start: float = 0.0) -> np.ndarray:
    return np.sin(2 * np.pi * phase_of(freq, n, start))


def tri(freq, n: int) -> np.ndarray:
    ph = phase_of(freq, n)
    return 4 * np.abs(ph - 0.5) - 1


def noise(n: int) -> np.ndarray:
    return RNG.uniform(-1, 1, n)


def supersaw(freq: float, n: int, voices: int = 7, detune_cents: float = 14.0, stereo: bool = True):
    spread = np.linspace(-1, 1, voices)
    left = np.zeros(n)
    right = np.zeros(n)
    for i, s in enumerate(spread):
        f = freq * 2 ** (s * detune_cents / 1200)
        w = saw(f, n)
        pan = 0.5 + 0.45 * s if stereo else 0.5
        amp = 1.0 if i == voices // 2 else 0.75
        left += w * amp * np.cos(pan * np.pi / 2)
        right += w * amp * np.sin(pan * np.pi / 2)
    g = 1 / np.sqrt(voices)
    return np.stack([left * g, right * g])


# ------------------------------------------------------------------ envelopes


def adsr(n: int, a: float, d: float, s: float, r: float, gate: float | None = None) -> np.ndarray:
    """gate = seconds the note is held (defaults to whole length minus release)."""
    env = np.zeros(n)
    total = n / SR
    gate = total - r if gate is None else gate
    t = np.arange(n) / SR
    a = max(a, 1e-4)
    d = max(d, 1e-4)
    att = t < a
    env[att] = t[att] / a
    dec = (t >= a) & (t < a + d)
    env[dec] = 1 - (1 - s) * (t[dec] - a) / d
    sus = (t >= a + d) & (t < gate)
    env[sus] = s
    # level at release start
    if gate < a:
        lvl = gate / a
    elif gate < a + d:
        lvl = 1 - (1 - s) * (gate - a) / d
    else:
        lvl = s
    rel = t >= gate
    env[rel] = lvl * np.clip(1 - (t[rel] - gate) / max(r, 1e-4), 0, 1)
    return env


def exp_decay(n: int, tau: float) -> np.ndarray:
    return np.exp(-np.arange(n) / SR / tau)


def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.01) -> np.ndarray:
    n = x.shape[-1]
    a = min(n, int(fin * SR))
    b = min(n, int(fout * SR))
    env = np.ones(n)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if b:
        env[-b:] *= np.linspace(1, 0, b)
    return x * env


# ------------------------------------------------------------------ filters


@njit(cache=True)
def _svf(x, cutoff, q, mode):
    n = x.shape[0]
    out = np.zeros(n)
    ic1 = 0.0
    ic2 = 0.0
    k = 1.0 / q
    for i in range(n):
        fc = cutoff[i]
        if fc > 20000.0:
            fc = 20000.0
        if fc < 15.0:
            fc = 15.0
        g = np.tan(np.pi * fc / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            out[i] = v2
        elif mode == 1:
            out[i] = x[i] - k * v1 - v2
        else:
            out[i] = v1
    return out


def svf(x: np.ndarray, cutoff, q: float = 0.707, mode: str = "lp") -> np.ndarray:
    """Zero-delay state-variable filter with per-sample cutoff; works on mono or stereo."""
    m = {"lp": 0, "hp": 1, "bp": 2}[mode]
    if x.ndim == 2:
        return np.stack([svf(ch, cutoff, q, mode) for ch in x])
    c = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape).copy()
    return _svf(x.astype(np.float64), c, float(q), m)


# ------------------------------------------------------------------ stereo / fx


def to_stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
    if x.ndim == 2:
        return x
    p = (pan + 1) / 2
    return np.stack([x * np.cos(p * np.pi / 2), x * np.sin(p * np.pi / 2)]) * np.sqrt(2)


def place(buf: np.ndarray, x: np.ndarray, at: float, gain: float = 1.0) -> None:
    """Mix stereo x into stereo buf starting at `at` seconds."""
    x = to_stereo(x)
    i = int(round(at * SR))
    if i >= buf.shape[1]:
        return
    j = min(buf.shape[1], i + x.shape[1])
    if i < 0:
        x = x[:, -i:]
        j = min(buf.shape[1], x.shape[1])
        i = 0
    buf[:, i:j] += x[:, : j - i] * gain


def fx(x: np.ndarray, board: Pedalboard, tail: float = 0.0) -> np.ndarray:
    x = to_stereo(x).astype(np.float32)
    if tail > 0:
        x = np.concatenate([x, np.zeros((2, int(tail * SR)), dtype=np.float32)], axis=1)
    return board(x, SR).astype(np.float64)


def reverb(x, size=0.85, wet=0.3, dry=0.8, damp=0.5, width=1.0, tail=2.5):
    return fx(x, Pedalboard([Reverb(room_size=size, wet_level=wet, dry_level=dry, damping=damp, width=width)]), tail)


def delay(x, seconds, feedback=0.35, mix=0.3, tail=1.5):
    return fx(x, Pedalboard([Delay(delay_seconds=seconds, feedback=feedback, mix=mix)]), tail)


def normalize(x: np.ndarray, peak_db: float = -1.0) -> np.ndarray:
    p = np.max(np.abs(x))
    if p < 1e-9:
        return x
    return x * (10 ** (peak_db / 20) / p)


__all__ = [
    "SR", "RNG", "t_axis", "midi_hz", "saw", "square", "sine", "tri", "noise", "supersaw",
    "adsr", "exp_decay", "fade", "svf", "to_stereo", "place", "fx", "reverb", "delay", "normalize",
    "Pedalboard", "Reverb", "Delay", "Chorus", "Compressor", "Limiter", "HighpassFilter", "LowpassFilter",
]
