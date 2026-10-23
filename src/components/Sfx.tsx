import React, { createContext, useContext } from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { sfxDuck } from "../vo";

/** Film frame at which the enclosing scene starts, so effects can duck under narration. */
export const SceneStart = createContext(0);

// Per-sound trim, measured against the music bed with audio/cues.py so each
// family sits at a consistent level over the score (music plays at 0.6).
const GAIN: Record<string, number> = {
  type_short: 0.65,
  type_long: 0.65,
  pop: 0.39,
  pop_soft: 0.81,
  blip: 1.23,
  tick: 1.74,
  cascade: 0.72,
  crt_off: 0.52,
  wipe: 0.52,
  stamp: 0.43,
  notify: 0.68,
  whoosh_soft: 0.38,
  whoosh: 1.3,
  whoosh_big: 1.06,
  swoosh: 1.06,
  impact_big: 0.48,
  impact_soft: 0.97,
  impact_final: 1,
  shimmer: 0.96,
  click: 1.17,
  select: 0.78,
  land: 0.87,
  ding: 0.57,
  success: 0.67,
  chime: 0.86,
  error: 0.73,
  send: 0.75,
};

const gainFor = (name: string) => (name.startsWith("check_") ? 0.6 : (GAIN[name] ?? 1));

/** One-shot sound effect from public/sfx, placed at a scene-local frame. */
export const Sfx: React.FC<{ at: number; name: string; vol?: number; dur?: number }> = ({
  at,
  name,
  vol = 1,
  dur,
}) => {
  const sceneStart = useContext(SceneStart);
  const from = Math.round(at);
  const base = Math.min(1, vol * gainFor(name));
  return (
    <Sequence from={from} durationInFrames={dur} layout="none" name={`sfx:${name}`}>
      <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={(f) => base * sfxDuck(sceneStart + from + f)} />
    </Sequence>
  );
};
