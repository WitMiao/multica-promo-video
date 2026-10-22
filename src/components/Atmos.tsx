import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { rnd } from "../lib/anim";

/** Animated film grain: a static noise tile jittered every frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const f = useCurrentFrame();
  const x = Math.floor(random(`gx${f}`) * 512);
  const y = Math.floor(random(`gy${f}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("textures/noise.png")})`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundSize: "512px 512px",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Deep space backdrop: base colour, two drifting glows and a faint grid. */
export const Backdrop: React.FC<{
  grid?: number;
  glowA?: string;
  glowB?: string;
  drift?: number;
}> = ({ grid = 0.05, glowA = C.brandDeep, glowB = "#5b3fd6", drift = 1 }) => {
  const f = useCurrentFrame() * drift;
  const ax = 30 + Math.sin(f / 140) * 8;
  const ay = 30 + Math.cos(f / 170) * 6;
  const bx = 72 + Math.cos(f / 160) * 7;
  const by = 72 + Math.sin(f / 130) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${ax}% ${ay}%, ${glowA}33 0%, transparent 42%), radial-gradient(circle at ${bx}% ${by}%, ${glowB}2a 0%, transparent 45%)`,
        }}
      />
      {grid > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,${grid}) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,${grid}) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            backgroundPosition: `${(f * 0.15) % 80}px ${(f * 0.1) % 80}px`,
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Slow-drifting dust motes, deterministic per seed. */
export const Dust: React.FC<{ count?: number; seed?: string; color?: string; speed?: number }> = ({
  count = 60,
  seed = "dust",
  color = "255,255,255",
  speed = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = rnd(`${seed}x${i}`, 0, 1920);
        const y0 = rnd(`${seed}y${i}`, 0, 1080);
        const vx = rnd(`${seed}vx${i}`, -0.25, 0.25) * speed;
        const vy = rnd(`${seed}vy${i}`, -0.5, -0.1) * speed;
        const r = rnd(`${seed}r${i}`, 0.8, 2.6);
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / rnd(`${seed}t${i}`, 20, 60) + i));
        const x = (((x0 + vx * f) % 1920) + 1920) % 1920;
        const y = (((y0 + vy * f) % 1080) + 1080) % 1080;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: `rgba(${color},${0.5 * tw})`,
              boxShadow: `0 0 ${r * 4}px rgba(${color},${0.35 * tw})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Full-bleed illustration with a slow Ken Burns push. */
export const Painting: React.FC<{
  src: string;
  from?: number;
  to?: number;
  dur: number;
  originX?: number;
  originY?: number;
  panX?: number;
  panY?: number;
}> = ({ src, from = 1.06, to = 1.16, dur, originX = 50, originY = 50, panX = 0, panY = 0 }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, f / dur));
  const s = from + (to - from) * t;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${panX * t}px, ${panY * t}px) scale(${s})`,
          transformOrigin: `${originX}% ${originY}%`,
        }}
      />
    </AbsoluteFill>
  );
};
