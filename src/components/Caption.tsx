import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { ease, mix, tw } from "../lib/anim";
import { Kinetic } from "./Kinetic";

export const HL_STYLE: React.CSSProperties = {
  backgroundImage: `linear-gradient(100deg, #ffffff 0%, #b9dbff 40%, ${C.brand} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/**
 * Serif caption line. "band" darkens the bottom of the frame (for dark
 * scenes), "plate" sits the line on a frosted dark capsule (for light UI
 * underneath), "none" is bare text.
 */
export const LowerCaption: React.FC<{
  text: string;
  start: number;
  end: number;
  size?: number;
  y?: number;
  band?: boolean;
  variant?: "band" | "plate" | "none";
  position?: "bottom" | "top";
  hl?: React.CSSProperties;
}> = ({ text, start, end, size = 62, y = 150, band = true, variant, position = "bottom", hl = HL_STYLE }) => {
  const f = useCurrentFrame();
  const mode = variant ?? (band ? "band" : "none");
  const o = Math.min(tw(f, start - 6, 20), 1 - tw(f, end - 10, 14, 0, 1, ease.in));
  const plateIn = tw(f, start - 8, 22, 0, 1, ease.expoOut);
  const kinetic = (
    <Kinetic
      text={text}
      start={start}
      end={end}
      align="center"
      stagger={1.8}
      style={{
        fontFamily: F.serif,
        fontSize: size,
        fontWeight: 600,
        color: C.ink,
        letterSpacing: "0.02em",
        textShadow: mode === "plate" ? undefined : "0 6px 30px rgba(0,0,0,0.6)",
      }}
      hlStyle={hl}
    />
  );
  const anchor: React.CSSProperties = position === "bottom" ? { bottom: y } : { top: y };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {mode === "band" ? (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, transparent 52%, rgba(3,5,9,0.78) 78%, rgba(3,5,9,0.92) 100%)",
            opacity: o,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, ...anchor, display: "flex", justifyContent: "center" }}>
        {mode === "plate" ? (
          <div
            style={{
              padding: `${size * 0.32}px ${size * 0.7}px`,
              borderRadius: size * 0.42,
              background: `rgba(8,11,18,${0.84 * o})`,
              border: `1px solid rgba(255,255,255,${0.12 * o})`,
              boxShadow: `0 24px 60px rgba(0,0,0,${0.45 * o})`,
              backdropFilter: `blur(${16 * o}px)`,
              transform: `scale(${mix(0.94, 1, plateIn)})`,
            }}
          >
            {kinetic}
          </div>
        ) : (
          kinetic
        )}
      </div>
    </AbsoluteFill>
  );
};
