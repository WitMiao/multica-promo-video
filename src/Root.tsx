import React from "react";
import { Composition } from "remotion";
import "./global.css";
import { loadFonts } from "./fonts";
import { FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./timeline";
import { Promo, SCENE_COMPONENTS } from "./Promo";

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="MulticaPromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {(Object.keys(SCENE_COMPONENTS) as Array<keyof typeof SCENE_COMPONENTS>).map((k) => (
      <Composition
        key={k}
        id={`S-${k}`}
        component={SCENE_COMPONENTS[k]!}
        durationInFrames={SCENES[k].dur}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </>
);
