import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Dust, Grain, Painting, Vignette } from "../components/Atmos";
import { HL_STYLE } from "../components/Caption";
import { Kinetic } from "../components/Kinetic";
import { MulticaMark } from "../components/Logo";
import { Sfx } from "../components/Sfx";
import { ease, mix, rnd, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

// ------------------------------------------------------------ stats

const STATS: Array<{ n: number; suffix: string; label: string; sub: string }> = [
  { n: 27, suffix: "", label: "款 Agent CLI", sub: "Claude Code · Codex · Cursor…" },
  { n: 3, suffix: "", label: "端同步", sub: "Web · 桌面 · 移动" },
  { n: 5, suffix: "", label: "个聊天渠道", sub: "Slack · 飞书 · 钉钉 · 企微 · Telegram" },
  { n: 100, suffix: "%", label: "源码公开", sub: "Docker Compose / Helm 自托管" },
];

const Streaks: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    {Array.from({ length: 26 }, (_, i) => {
      const y = rnd(`sy${i}`, 0, 1080);
      const speed = rnd(`ss${i}`, 30, 70);
      const len = rnd(`sl${i}`, 200, 600);
      const x = ((rnd(`sx${i}`, 0, 2600) + f * speed) % 2600) - 600;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: len,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(140,196,255,${rnd(`so${i}`, 0.15, 0.5)}), transparent)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

export const S7Stats: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.stats.dur;
  const out = tw(f, dur - 14, 14, 0, 1, ease.in);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.04} glowA="#2f6ff4" glowB="#7a3fd6" drift={3} />
      <Streaks f={f} />
      <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center" }}>
          <Kinetic
            text="一个工作区，装下[整支 AI 团队]。"
            start={2}
            align="center"
            stagger={1.6}
            exit="none"
            style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 70, color: C.ink }}
            hlStyle={HL_STYLE}
          />
        </div>
        <div style={{ position: "absolute", left: 120, right: 120, top: 420, display: "flex", justifyContent: "space-between" }}>
          {STATS.map((s, i) => {
            const at = 14 + i * 30;
            const t = sp(f, fps, at, { damping: 13, stiffness: 150 });
            const count = Math.round(mix(0, s.n, tw(f, at, 40, 0, 1, ease.outSoft)));
            return (
              <div
                key={s.label}
                style={{
                  width: 390,
                  padding: "34px 30px",
                  boxSizing: "border-box",
                  borderRadius: 26,
                  background: "linear-gradient(180deg, rgba(30,38,56,0.75), rgba(12,16,26,0.75))",
                  border: "1px solid rgba(140,196,255,0.22)",
                  boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
                  transform: `translateY(${(1 - t) * 90}px) scale(${mix(0.85, 1, t)})`,
                  opacity: Math.min(1, t * 1.5),
                  fontFamily: F.sans,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: F.display, fontSize: 150, lineHeight: 0.9, color: C.ink, ...HL_STYLE }}>
                    {count}
                    {s.suffix}
                  </span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 650, color: C.ink, marginTop: 14 }}>{s.label}</div>
                <div style={{ fontSize: 19, color: C.inkMute, marginTop: 10, whiteSpace: "nowrap" }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Grain opacity={0.06} />
      <Sfx at={0} name="impact_big" vol={1} />
      {STATS.map((_, i) => (
        <Sfx key={i} at={14 + i * 30} name="pop" vol={0.5} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ slogan

export const S7Slogan: React.FC = () => {
  const f = useCurrentFrame();
  const dur = SCENES.slogan.dur;
  const inT = tw(f, 0, 30, 0, 1, ease.out);
  const out = tw(f, dur - 18, 18, 0, 1, ease.in);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: inT * (1 - out) }}>
        <Painting src="images/feature-bg-4.webp" dur={dur} from={1.12} to={1.02} originX={70} originY={40} panX={-30} />
        <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(3,6,14,0.82) 0%, rgba(3,6,14,0.5) 45%, rgba(3,6,14,0.1) 75%)" }} />
        <Dust count={40} seed="slogan" speed={0.5} color="255,230,200" />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - out }}>
        <div style={{ position: "absolute", left: 140, top: 330 }}>
          <Kinetic
            text={"你的下一批员工，\n[不是人类]。"}
            start={10}
            stagger={3}
            dur={34}
            lineGap={0.16}
            exit="none"
            style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 116, color: C.ink, lineHeight: 1.14, textShadow: "0 10px 50px rgba(0,0,0,0.5)" }}
            hlStyle={{
              backgroundImage: "linear-gradient(100deg, #ffffff 0%, #ffd9b8 45%, #ff9e6b 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          />
          <div style={{ height: 40 }} />
          <Kinetic
            text="Your next 10 hires won't be human."
            start={70}
            stagger={1.2}
            exit="none"
            style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 54, color: "rgba(245,247,250,0.82)" }}
          />
        </div>
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <Grain opacity={0.07} />
      <Sfx at={10} name="shimmer" vol={0.45} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ end card

export const S7EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.endcard.dur;
  const mark = sp(f, fps, 0, { damping: 14, stiffness: 120 });
  const word = tw(f, 10, 34, 0, 1, ease.expoOut);
  const fade = tw(f, dur - 70, 70, 0, 1, ease.inOut);
  const glow = 0.5 + 0.5 * Math.sin(f / 20);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 45% at 50% 46%, rgba(47,111,244,${0.22 + 0.06 * glow}) 0%, transparent 70%)` }} />
      <Dust count={50} seed="end" speed={0.4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - fade }}>
        <div style={{ display: "flex", alignItems: "center", transform: `translateY(-70px) scale(${mix(1.25, 1, mark)})` }}>
          <div style={{ transform: `rotate(${mix(-120, 0, mark)}deg)`, filter: `drop-shadow(0 0 ${30 + 20 * glow}px rgba(120,180,255,0.7))` }}>
            <MulticaMark size={150} />
          </div>
          <div style={{ width: mix(0, 560, word), overflow: "hidden" }}>
            <div
              style={{
                marginLeft: 40,
                fontFamily: F.sans,
                fontWeight: 700,
                fontSize: 138,
                letterSpacing: "-0.035em",
                color: C.ink,
                lineHeight: 1,
                transform: `translateX(${mix(-140, 0, word)}px)`,
                whiteSpace: "nowrap",
              }}
            >
              Multica
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Kinetic
            text="让人和 AI 智能体，成为一支真正的团队。"
            start={40}
            align="center"
            stagger={1.4}
            exit="none"
            style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 44, color: C.inkSoft, letterSpacing: "0.04em" }}
          />
          <div
            style={{
              display: "flex",
              gap: 28,
              alignItems: "center",
              fontFamily: F.mono,
              fontSize: 28,
              color: C.ink,
              opacity: tw(f, 90, 24),
              transform: `translateY(${mix(16, 0, tw(f, 90, 30, 0, 1, ease.expoOut))}px)`,
            }}
          >
            <span>multica.ai</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.brand }} />
            <span>github.com/multica-ai/multica</span>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 22, color: C.inkMute, letterSpacing: "0.16em", opacity: tw(f, 120, 24) }}>
            源码公开 · 可自托管 · 支持 27 款 Agent CLI
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <Grain opacity={0.07} />
      <Sfx at={0} name="impact_final" vol={1} />
    </AbsoluteFill>
  );
};
