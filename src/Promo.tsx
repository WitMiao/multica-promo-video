import React from "react";
import { LightLeak } from "@remotion/light-leaks";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { SCENES } from "./timeline";
import { S1Problem } from "./scenes/S1Problem";
import { S2Reveal } from "./scenes/S2Reveal";
import { S3Board } from "./scenes/S3Board";
import { S4Assign } from "./scenes/S4Assign";
import { FeatProviders } from "./scenes/FeatProviders";
import { FeatRuntimes } from "./scenes/FeatRuntimes";
import { FeatTeam } from "./scenes/FeatTeam";
import { FeatExecLog } from "./scenes/FeatExecLog";
import { FeatAutopilot } from "./scenes/FeatAutopilot";
import { FeatReview } from "./scenes/FeatReview";
import { FeatOwnIt } from "./scenes/FeatOwnIt";
import { S6CompareIntro, S6CompareTable, S6Orchestrate } from "./scenes/S6Compare";
import { S7EndCard, S7Slogan, S7Stats } from "./scenes/S7Outro";

export const SCENE_COMPONENTS: Partial<Record<keyof typeof SCENES, React.FC>> = {
  problem: S1Problem,
  reveal: S2Reveal,
  board: S3Board,
  assign: S4Assign,
  providers: FeatProviders,
  runtimes: FeatRuntimes,
  team: FeatTeam,
  execlog: FeatExecLog,
  autopilot: FeatAutopilot,
  review: FeatReview,
  ownit: FeatOwnIt,
  compareIntro: S6CompareIntro,
  compareTable: S6CompareTable,
  orchestrate: S6Orchestrate,
  stats: S7Stats,
  slogan: S7Slogan,
  endcard: S7EndCard,
};

// Light leaks straddle the biggest cuts: centred on the cut frame, screened
// over both scenes.
const LEAKS: Array<{ at: number; seed: number; hue: number; opacity: number }> = [
  { at: SCENES.board.from, seed: 3, hue: 200, opacity: 0.3 },
  { at: SCENES.stats.from, seed: 7, hue: 200, opacity: 0.34 },
  { at: SCENES.endcard.from, seed: 11, hue: 20, opacity: 0.3 },
];
const LEAK_DUR = 56;

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
    <Html5Audio src={staticFile("audio/music.wav")} volume={0.6} />
    {(Object.keys(SCENE_COMPONENTS) as Array<keyof typeof SCENES>).map((k) => {
      const C = SCENE_COMPONENTS[k]!;
      return (
        <Sequence key={k} from={SCENES[k].from} durationInFrames={SCENES[k].dur} name={k}>
          <C />
        </Sequence>
      );
    })}
    {LEAKS.map((l) => (
      <Sequence key={l.at} from={l.at - LEAK_DUR / 2} durationInFrames={LEAK_DUR} name={`leak@${l.at}`}>
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: l.opacity }}>
          <LightLeak seed={l.seed} hueShift={l.hue} durationInFrames={LEAK_DUR} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </AbsoluteFill>
);
