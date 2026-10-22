// The whole film sits on a 120 BPM grid at 60 fps: one beat is 30 frames and
// one 4/4 bar is 120 frames. The score (audio/music.py) is written on the same
// grid, so every scene boundary below lands on a downbeat of the music.
export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BEAT = 30;
export const BAR = 120;

export const bars = (n: number) => Math.round(n * BAR);
export const beats = (n: number) => Math.round(n * BEAT);

const scene = (fromBar: number, lengthBars: number) => ({
  from: bars(fromBar),
  dur: bars(lengthBars),
});

export const SCENES = {
  problem: scene(0, 6),
  reveal: scene(6, 3),
  board: scene(9, 3),
  assign: scene(12, 4),
  providers: scene(16, 2),
  runtimes: scene(18, 2),
  team: scene(20, 2),
  execlog: scene(22, 2),
  autopilot: scene(24, 2),
  review: scene(26, 2),
  ownit: scene(28, 2),
  compareIntro: scene(30, 2),
  compareTable: scene(32, 4),
  orchestrate: scene(36, 2),
  stats: scene(38, 2),
  slogan: scene(40, 2),
  endcard: scene(42, 3),
} as const;

export const TOTAL_FRAMES = bars(45);
