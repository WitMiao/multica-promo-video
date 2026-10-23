"""Synthesise the narration with a local Qwen3-TTS model and pick the best take.

For every line in src/narration.json:
  1. generate several takes with different seeds,
  2. transcribe each with Qwen3-ASR and compare pinyin (with tones) against the
     script, so mispronunciations are caught without anyone listening,
  3. score takes on pronunciation, how much they must be sped up to fit their
     slot, and stray pauses; keep the best,
  4. clean it up (trim, EQ, compression, level), time-stretch into the slot,
  5. force-align the script to get per-character timings for the subtitles.

Writes public/vo/<id>.wav and src/vo-timing.json.

    audio/.venv-tts/bin/python audio/vo.py            # all lines
    audio/.venv-tts/bin/python audio/vo.py p4 c2      # just these lines
"""

from __future__ import annotations

import gc
import json
import re
import sys
from pathlib import Path

import cn2an
import mlx.core as mx
import numpy as np
import soundfile as sf
from pedalboard import Compressor, HighpassFilter, HighShelfFilter, Limiter, Pedalboard, PeakFilter, time_stretch
from pypinyin import Style, lazy_pinyin
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "src" / "narration.json"
MUSIC = ROOT / "public" / "audio" / "music.wav"
# How the film places voice against music (src/Promo.tsx, src/vo.ts): narration
# at +3 dB over its -17 dBFS level, music at 0.6 and ducked 9 dB under speech.
VO_GAIN = 1.41
MUSIC_UNDER_VO = 0.6 * 10 ** (-9 / 20)
TIMING = ROOT / "src" / "vo-timing.json"
OUT = ROOT / "public" / "vo"
CACHE = ROOT / ".cache" / "vo" / "takes"
SR = 48000
TAKES = 4
MAX_TAKES = 12
MAX_STRETCH = 1.16

OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)


# ------------------------------------------------------------------ text


def units(text: str) -> list[str]:
    """Han characters, Latin words and digit runs, punctuation dropped."""
    return re.findall(r"[一-鿿]|[A-Za-z]+|\d+", text)


def phonemes(text: str) -> list[str]:
    # ASR often spells initialisms out ("C L I", "C.L.I"); join them back up.
    text = re.sub(r"(?<![A-Za-z])([A-Za-z])(?:[\s.]+([A-Za-z])(?![A-Za-z]))+", lambda m: re.sub(r"[\s.]", "", m.group(0)), text)
    out: list[str] = []
    for u in units(text):
        if u.isdigit():
            out += lazy_pinyin(cn2an.an2cn(u), style=Style.TONE3)
        elif re.match(r"[A-Za-z]", u):
            out.append(u.lower())
        else:
            out += lazy_pinyin(u, style=Style.TONE3)
    return out


def edit_distance(a: list[str], b: list[str]) -> int:
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (x != y))
    return d[len(b)]


# ------------------------------------------------------------------ audio


def frames_db(x: np.ndarray, sr: int, hop: float = 0.01) -> np.ndarray:
    h = int(sr * hop)
    n = len(x) // h
    f = x[: n * h].reshape(n, h)
    return 20 * np.log10(np.sqrt((f**2).mean(axis=1)) + 1e-9)


def trim(x: np.ndarray, sr: int) -> np.ndarray:
    db = frames_db(x, sr)
    on = np.where(db > db.max() - 38)[0]
    if len(on) == 0:
        return x
    a = max(0, on[0] * int(sr * 0.01) - int(sr * 0.03))
    b = min(len(x), (on[-1] + 1) * int(sr * 0.01) + int(sr * 0.12))
    return x[a:b]


def longest_pause(x: np.ndarray, sr: int) -> float:
    db = frames_db(x, sr)
    quiet = db < db.max() - 40
    best = run = 0
    for q in quiet:
        run = run + 1 if q else 0
        best = max(best, run)
    return best * 0.01


CHAIN = Pedalboard([
    HighpassFilter(cutoff_frequency_hz=80),
    PeakFilter(cutoff_frequency_hz=220, gain_db=-1.5, q=0.9),  # take out boxiness
    PeakFilter(cutoff_frequency_hz=3200, gain_db=2.5, q=0.8),  # presence
    HighShelfFilter(cutoff_frequency_hz=9000, gain_db=1.5),  # air
    Compressor(threshold_db=-22, ratio=3.0, attack_ms=4, release_ms=90),
    Limiter(threshold_db=-3.0, release_ms=60),
])


def polish(x: np.ndarray, sr_in: int, stretch: float) -> np.ndarray:
    y = resample_poly(x, SR, sr_in) if sr_in != SR else x
    y = y.astype(np.float32)[None, :]
    if stretch > 1.001:
        y = time_stretch(y, SR, stretch_factor=stretch, high_quality=True)
    y = CHAIN(y, SR)[0].astype(np.float64)
    # speech-weighted level: RMS of the loud half of the frames
    db = frames_db(y, SR)
    level = np.median(np.sort(db)[len(db) // 2 :])
    y *= 10 ** ((-17.0 - level) / 20)
    pk = np.abs(y).max()
    if pk > 0.89:
        y *= 0.89 / pk
    fade = int(0.006 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade * 4 :] *= np.linspace(1, 0, fade * 4)
    return y


# ------------------------------------------------------------------ pipeline


def main() -> None:
    script = json.loads(SCRIPT.read_text())
    voice = script["voice"]
    only = set(sys.argv[1:])
    lines = [l for l in script["lines"] if not only or l["id"] in only]
    timing = {t["id"]: t for t in json.loads(TIMING.read_text())["lines"]} if TIMING.exists() else {}

    from mlx_audio.tts.utils import load_model
    from mlx_audio.stt import load as load_stt

    tts = load_model(voice["model"])
    asr = load_stt("mlx-community/Qwen3-ASR-1.7B-8bit")
    chosen: dict[str, tuple[np.ndarray, int, dict]] = {}

    music, msr = sf.read(MUSIC)
    music = music.mean(axis=1) if music.ndim == 2 else music

    def under_music(x: np.ndarray, sr: int, at: float, extra_db: float) -> Path:
        """The take as it will sit in the film: levelled, over the ducked score
        (optionally louder than in the film, to keep only the clearest takes)."""
        y = polish(x, sr, 1.0) * VO_GAIN
        a = int(at * msr)
        bed = music[a : a + len(y)]
        y[: len(bed)] += bed * MUSIC_UNDER_VO * 10 ** (extra_db / 20)
        path = CACHE / "_mixed.wav"
        sf.write(path, y.astype(np.float32), SR)
        return path

    def best_take(text: str, lang: str, instruct: str, slot: float, max_stretch: float, tag: str, at: float, max_takes: int, extra_db: float):
        want = phonemes(text)
        best = None
        seed = 0
        while seed < max_takes:
            for _ in range(TAKES):
                mx.random.seed(1000 + seed)
                res = list(tts.generate_custom_voice(text=text, speaker=voice["speaker"], language=lang, instruct=instruct))
                raw = np.concatenate([np.array(r.audio, dtype=np.float64) for r in res])
                sr = tts.sample_rate
                x = trim(raw, sr)
                path = CACHE / f"{tag}_{seed}.wav"
                sf.write(path, x, sr)
                asr_lang = "English" if lang == "english" else "Chinese"
                heard = asr.generate(str(path), language=asr_lang).text
                err = edit_distance(want, phonemes(heard)) / max(1, len(want))
                if err == 0:
                    # A take must also survive the score it will play over.
                    mixed = asr.generate(str(under_music(x, sr, at, extra_db)), language=asr_lang).text
                    err = edit_distance(want, phonemes(mixed)) / max(1, len(want))
                    if err:
                        heard = f"{heard} / under music: {mixed}"
                dur = len(x) / sr
                stretch = max(1.0, dur / slot)
                pause = longest_pause(x, sr)
                score = err * 12 + max(0.0, stretch - 1.0) * 4 + (8 if stretch > max_stretch else 0) + max(0.0, pause - 0.55) * 3
                info = {"seed": seed, "heard": heard, "err": round(err, 3), "dur": round(dur, 2), "stretch": round(stretch, 3), "pause": pause, "score": round(score, 3)}
                print(tag, info, flush=True)
                # Pronunciation first, then fitting the slot, then the rest.
                rank = (err > 0, stretch > max_stretch, score)
                if best is None or rank < best[3]:
                    best = (x, sr, info, rank)
                seed += 1
            if best[2]["err"] == 0 and best[2]["stretch"] <= max_stretch:
                break
        return best[:3]

    for line in lines:
        slot = line["end"] - line["at"]
        max_stretch = line.get("maxStretch", MAX_STRETCH)
        parts = line.get("parts") or [{"say": line["say"], "lang": line.get("lang", "chinese")}]
        pieces = []
        offset = 0.0
        for i, part in enumerate(parts):
            lang = part.get("lang", "chinese")
            if part.get("instruct") or line.get("instruct"):
                instruct = part.get("instruct") or line["instruct"]
            elif lang == "english":
                instruct = voice["instruct_en"]
            else:
                instruct = voice["instruct"] + ("，" + line["mood"] if line.get("mood") else "")
            # each part gets a share of the slot proportional to its length
            share = slot * len(phonemes(part["say"])) / max(1, len(phonemes(" ".join(p["say"] for p in parts))))
            pieces.append(best_take(part["say"], lang, instruct, share, max_stretch, f"{line['id']}{i}", line["at"] + offset, part.get("maxTakes", line.get("maxTakes", MAX_TAKES)), part.get("robustDb", 0.0)))
            offset += share
        sr = pieces[0][1]
        gap = np.zeros(int(sr * line.get("gap", 0.05)))
        x = np.concatenate([np.concatenate([p[0], gap]) if i < len(pieces) - 1 else p[0] for i, p in enumerate(pieces)])
        dur = len(x) / sr
        info = {
            "heard": " | ".join(p[2]["heard"] for p in pieces),
            "err": round(max(p[2]["err"] for p in pieces), 3),
            "dur": round(dur, 2),
            "stretch": round(min(max_stretch, max(1.0, dur / slot)), 3),
        }
        chosen[line["id"]] = (x, sr, info)
        print(f"==> {line['id']}  err {info['err']}  {dur:.2f}s in {slot:.2f}s slot  x{info['stretch']}  [{info['heard']}]", flush=True)

    # free the generators before loading the aligner
    del tts, asr
    gc.collect()
    mx.clear_cache()
    aligner = load_stt("mlx-community/Qwen3-ForcedAligner-0.6B-8bit")

    for line in lines:
        x, sr, info = chosen[line["id"]]
        stretch = info["stretch"]
        y = polish(x, sr, stretch)
        sf.write(OUT / f"{line['id']}.wav", y.astype(np.float32), SR, subtype="PCM_24")
        tmp = CACHE / f"{line['id']}_final.wav"
        sf.write(tmp, y.astype(np.float32), SR)
        try:
            items = aligner.generate(audio=str(tmp), text=line["say"], language="Chinese")
            tokens = [{"t": it.text, "s": round(float(it.start_time), 3), "e": round(float(it.end_time), 3)} for it in items]
        except Exception as exc:  # alignment is only used for subtitle highlighting
            print("align failed", line["id"], exc)
            tokens = []
        timing[line["id"]] = {
            "id": line["id"],
            "at": line["at"],
            "dur": round(len(y) / SR, 3),
            "stretch": round(stretch, 3),
            "heard": info["heard"],
            "err": info["err"],
            "tokens": tokens,
        }
        print(f"{line['id']}: {len(y) / SR:.2f}s, x{stretch:.3f}, {len(tokens)} tokens", flush=True)

    ordered = [timing[l["id"]] for l in script["lines"] if l["id"] in timing]
    TIMING.write_text(json.dumps({"lines": ordered}, ensure_ascii=False, indent=1) + "\n")
    print("wrote", TIMING)


if __name__ == "__main__":
    main()
