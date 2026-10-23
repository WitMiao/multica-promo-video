import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Dust, Grain, Painting, Vignette } from "../components/Atmos";
import { HL_STYLE } from "../components/Caption";
import { Kinetic } from "../components/Kinetic";
import { BuildMark } from "../components/Logo";
import { Sfx } from "../components/Sfx";
import { ease, mix, rnd, sp, tw } from "../lib/anim";
import { C, F } from "../theme";
import { SCENES } from "../timeline";
import { voWindow } from "../vo";

const SPARKS = Array.from({ length: 46 }, (_, i) => ({
  a: rnd(`sa${i}`, 0, Math.PI * 2),
  v: rnd(`sv${i}`, 6, 22),
  r: rnd(`sr${i}`, 1.5, 4),
  life: rnd(`sl${i}`, 30, 70),
}));

export const S2Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Eight half-arms shoot out in a clockwise sweep.
  const arms = Array.from({ length: 8 }, (_, i) =>
    sp(f, fps, 3 + i * 2.2, { damping: 11, stiffness: 210, mass: 0.6 }),
  );
  const core = sp(f, fps, 0, { damping: 10, stiffness: 260 });
  const flash = Math.max(0, 1 - f / 14);
  const ring = tw(f, 0, 50, 0, 1, ease.out);

  // Lockup: mark settles and the wordmark slides out of it.
  const spin = mix(-90, 0, tw(f, 0, 70, 0, 1, ease.expoOut));
  const word = tw(f, 34, 34, 0, 1, ease.expoOut);
  const lockUp = tw(f, 112, 58, 0, 1, ease.inOut);
  const lockScale = mix(1, 0.52, lockUp);
  const lockY = mix(0, -300, lockUp);

  const paint = tw(f, 100, 70, 0, 1, ease.inOut);
  const exit = tw(f, 336, 24, 0, 1, ease.in);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: paint * 0.85, filter: `blur(${(1 - paint) * 24}px)` }}>
        <Painting src="images/landing-bg.webp" dur={360} from={1.04} to={1.14} originX={50} originY={40} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,6,14,0.55) 0%, rgba(3,6,14,0.35) 40%, rgba(3,6,14,0.82) 100%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: paint }}>
        <Dust count={50} seed="rev" speed={0.6} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `scale(${mix(1, 1.08, exit)})`,
          opacity: 1 - exit,
          filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
        }}
      >
        {/* flash + shockwave */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(170,205,255,${0.9 * flash}) 0%, rgba(76,141,246,${0.45 * flash}) 25%, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 540,
            width: 0,
            height: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -ring * 900,
              top: -ring * 900,
              width: ring * 1800,
              height: ring * 1800,
              borderRadius: "50%",
              border: `${mix(10, 1, ring)}px solid rgba(140,196,255,${0.7 * (1 - ring)})`,
              boxShadow: `0 0 60px rgba(76,141,246,${0.6 * (1 - ring)})`,
            }}
          />
          {SPARKS.map((s, i) => {
            const t = f / s.life;
            if (t >= 1) return null;
            const d = s.v * f * (1 - t * 0.5);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: Math.cos(s.a) * d,
                  top: Math.sin(s.a) * d,
                  width: s.r * 2,
                  height: s.r * 2,
                  borderRadius: "50%",
                  background: "#cfe4ff",
                  opacity: 1 - t,
                  boxShadow: "0 0 12px #8cc4ff",
                }}
              />
            );
          })}
        </div>

        {/* lockup */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: `translateY(${lockY}px) scale(${lockScale})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                transform: `translateX(${mix(0, -10, word)}px) rotate(${spin}deg)`,
                filter: `drop-shadow(0 0 ${mix(60, 24, word)}px rgba(120,180,255,0.75))`,
              }}
            >
              <BuildMark size={190} arms={arms} core={core} />
            </div>
            <div style={{ width: mix(0, 660, word), overflow: "hidden", display: "flex" }}>
              <div
                style={{
                  marginLeft: 48,
                  fontFamily: F.sans,
                  fontWeight: 700,
                  fontSize: 168,
                  letterSpacing: "-0.035em",
                  color: C.ink,
                  transform: `translateX(${mix(-180, 0, word)}px)`,
                  opacity: word,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Multica
              </div>
            </div>
          </div>
        </AbsoluteFill>

        {/* headline */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 170 }}>
          <Kinetic
            text={"让人和 AI 智能体\n成为一支[真正的团队]。"}
            start={voWindow("r2", SCENES.reveal.from).start}
            align="center"
            stagger={2.6}
            dur={30}
            lineGap={0.18}
            style={{
              fontFamily: F.serif,
              fontWeight: 700,
              fontSize: 104,
              color: C.ink,
              letterSpacing: "0.02em",
              lineHeight: 1.12,
              textShadow: "0 10px 50px rgba(0,0,0,0.55)",
            }}
            hlStyle={HL_STYLE}
          />
          <div style={{ height: 40 }} />
          <Kinetic
            text="Agents that show up on the board."
            start={226}
            align="center"
            stagger={1.4}
            style={{
              fontFamily: F.display,
              fontStyle: "italic",
              fontSize: 58,
              color: "rgba(245,247,250,0.86)",
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
              letterSpacing: "0.01em",
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>

      <Vignette strength={0.7} />
      <Grain opacity={0.07} />

      <Sfx at={0} name="impact_big" vol={0.8} />
      <Sfx at={34} name="whoosh_soft" vol={0.25} />
      <Sfx at={150} name="shimmer" vol={0.5} />
    </AbsoluteFill>
  );
};
