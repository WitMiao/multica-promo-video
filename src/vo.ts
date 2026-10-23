import script from "./narration.json";
import timing from "./vo-timing.json";
import { FPS } from "./timeline";

// Narration script (src/narration.json) joined with what audio/vo.py actually
// rendered (src/vo-timing.json): real durations and per-character timings.

export type VoToken = { t: string; s: number; e: number };
export type VoLine = {
  id: string;
  at: number; // seconds, film time
  dur: number; // seconds of rendered speech
  say: string;
  caption: string; // on-screen wording, [..] marks highlights
  show: "caption" | "sub" | "none";
  tokens: VoToken[];
};

type ScriptLine = { id: string; at: number; end: number; say: string; caption?: string; show: string };
type TimingLine = { id: string; dur: number; tokens: VoToken[] };

const rendered = new Map<string, TimingLine>((timing.lines as TimingLine[]).map((t) => [t.id, t]));

export const VO_LINES: VoLine[] = (script.lines as ScriptLine[]).map((l) => {
  const t = rendered.get(l.id);
  return {
    id: l.id,
    at: l.at,
    dur: t?.dur ?? l.end - l.at,
    say: l.say,
    caption: l.caption ?? l.say,
    show: l.show as VoLine["show"],
    tokens: t?.tokens ?? [],
  };
});

const byId = new Map(VO_LINES.map((l) => [l.id, l]));

export const vo = (id: string): VoLine => {
  const l = byId.get(id);
  if (!l) throw new Error(`unknown narration line ${id}`);
  return l;
};

/** Scene-local frame window a line occupies, with an optional hold after speech. */
export const voWindow = (id: string, sceneFrom: number, hold = 0.35) => {
  const l = vo(id);
  return {
    start: Math.round(l.at * FPS) - sceneFrom,
    end: Math.round((l.at + l.dur + hold) * FPS) - sceneFrom,
  };
};

/** Seconds from the line start at which the first token containing `text` begins. */
export const tokenTime = (id: string, text: string): number | undefined =>
  vo(id).tokens.find((t) => t.t.includes(text))?.s;

const DUCK_ATTACK = 0.18;
const DUCK_RELEASE = 0.55;

/** Music gain multiplier at a film frame: dips under every narration line. */
export const musicDuck = (frame: number): number => duck(frame, -9);

/** Effects dip less than music so the picture still has its punctuation. */
export const sfxDuck = (frame: number): number => duck(frame, -7);

const duck = (frame: number, depthDb: number): number => {
  const t = frame / FPS;
  const low = 10 ** (depthDb / 20);
  let g = 1;
  for (const l of VO_LINES) {
    const a = l.at;
    const b = l.at + l.dur;
    let depth = 0;
    if (t >= a && t <= b) depth = 1;
    else if (t < a && t > a - DUCK_ATTACK) depth = 1 - (a - t) / DUCK_ATTACK;
    else if (t > b && t < b + DUCK_RELEASE) depth = 1 - (t - b) / DUCK_RELEASE;
    if (depth > 0) {
      const eased = depth * depth * (3 - 2 * depth);
      g = Math.min(g, 1 - (1 - low) * eased);
    }
  }
  return g;
};
