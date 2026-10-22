import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ease, mix, tw } from "../lib/anim";
import { C, F } from "../theme";
import { Backdrop, Grain, Vignette } from "./Atmos";
import { HL_STYLE } from "./Caption";
import { Kinetic } from "./Kinetic";
import { Sfx } from "./Sfx";

export const FEATURE_COUNT = 7;

/**
 * Shared frame for the seven feature beats: kicker, serif headline and body on
 * the left, a live visual on the right. Every beat is 240 frames (two bars);
 * content slides in from the right and leaves to the left so consecutive beats
 * read as one continuous pan.
 */
export const Feature: React.FC<{
  index: number; // 1-based
  kicker: string;
  title: string;
  body: string;
  dur: number;
  glowA?: string;
  glowB?: string;
  children: React.ReactNode;
}> = ({ index, kicker, title, body, dur, glowA, glowB, children }) => {
  const f = useCurrentFrame();
  const inT = tw(f, 0, 26, 0, 1, ease.expoOut);
  const outT = tw(f, dur - 18, 18, 0, 1, ease.in);
  const x = mix(140, 0, inT) - outT * 160;
  const blur = (1 - inT) * 12 + outT * 14;
  const o = Math.min(1, inT * 1.4) * (1 - outT);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.035} glowA={glowA} glowB={glowB} />
      <AbsoluteFill style={{ transform: `translateX(${x}px)`, opacity: o, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 700, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: F.sans, opacity: tw(f, 4, 16) }}>
            <span style={{ fontFamily: F.mono, fontSize: 22, color: C.brand, fontWeight: 600, letterSpacing: "0.06em" }}>
              {String(index).padStart(2, "0")}
            </span>
            <span style={{ width: mix(0, 44, tw(f, 6, 20)), height: 2, background: C.brand, opacity: 0.7 }} />
            <span style={{ fontSize: 24, color: C.inkSoft, letterSpacing: "0.18em", fontWeight: 500 }}>{kicker}</span>
          </div>
          <div style={{ height: 30 }} />
          <Kinetic
            text={title}
            start={8}
            stagger={2}
            lineGap={0.14}
            exit="none"
            style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 80, lineHeight: 1.16, color: C.ink, letterSpacing: "0.01em" }}
            hlStyle={HL_STYLE}
          />
          <div style={{ height: 34 }} />
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 27,
              lineHeight: 1.62,
              color: C.inkSoft,
              maxWidth: 620,
              opacity: tw(f, 30, 24),
              transform: `translateY(${mix(18, 0, tw(f, 30, 30, 0, 1, ease.expoOut))}px)`,
            }}
          >
            {body}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 820,
            top: 90,
            width: 1020,
            height: 900,
            transform: `scale(${mix(0.97, 1.03, f / dur)})`,
            transformOrigin: "40% 50%",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, bottom: 64, display: "flex", gap: 10 }}>
        {Array.from({ length: FEATURE_COUNT }, (_, i) => {
          const active = i + 1 === index;
          const done = i + 1 < index;
          return (
            <div
              key={i}
              style={{
                width: active ? 56 : 22,
                height: 4,
                borderRadius: 2,
                background: active ? C.brand : done ? "rgba(140,196,255,0.45)" : "rgba(255,255,255,0.14)",
                overflow: "hidden",
              }}
            >
              {active ? <div style={{ width: `${(f / dur) * 100}%`, height: "100%", background: C.glow }} /> : null}
            </div>
          );
        })}
      </div>
      <Vignette strength={0.6} />
      <Grain opacity={0.06} />
      <Sfx at={0} name="whoosh" vol={0.55} />
    </AbsoluteFill>
  );
};

/** Frosted dark card used by the feature visuals. */
export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: "linear-gradient(180deg, rgba(22,28,40,0.92) 0%, rgba(13,17,26,0.92) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 20,
      boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      fontFamily: F.sans,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);
