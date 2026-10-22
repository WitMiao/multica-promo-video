import { Easing, interpolate, random, spring } from "remotion";

export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  outSoft: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  expoOut: Easing.bezier(0.19, 1, 0.22, 1),
};

/** Clamped interpolation over a frame window with an easing curve. */
export const tw = (
  f: number,
  start: number,
  dur: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = ease.out,
) => interpolate(f, [start, start + Math.max(1, dur)], [from, to], { ...CLAMP, easing });

/** Fade in at `start` over `inDur`, fade out ending at `end` over `outDur`. */
export const life = (
  f: number,
  start: number,
  end: number,
  inDur = 18,
  outDur = 14,
) => Math.min(tw(f, start, inDur), 1 - tw(f, end - outDur, outDur, 0, 1, ease.in));

export const sp = (
  f: number,
  fps: number,
  delay = 0,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) =>
  spring({
    frame: f - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9, ...config },
  });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random in [lo, hi). */
export const rnd = (seed: string | number, lo = 0, hi = 1) =>
  lo + random(seed) * (hi - lo);

/** Small deterministic camera shake. */
export const shake = (f: number, amount: number, seed = "s") => ({
  x: (random(`${seed}x${Math.floor(f / 2)}`) - 0.5) * 2 * amount,
  y: (random(`${seed}y${Math.floor(f / 2)}`) - 0.5) * 2 * amount,
});
