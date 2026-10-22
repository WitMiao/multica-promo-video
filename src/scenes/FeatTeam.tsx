import React from "react";
import { BookOpen, Crown, FileText } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Feature, Glass } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { AGENTS, Avatar, HUMANS, Who } from "../components/ui";
import { ease, mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

const MEMBERS: Array<{ who: Who; x: number }> = [
  { who: AGENTS.codex, x: 120 },
  { who: AGENTS.cursor, x: 300 },
  { who: HUMANS.lin, x: 480 },
  { who: AGENTS.kimi, x: 660 },
];

const SKILL_TARGETS: Who[] = [AGENTS.claude, AGENTS.codex, AGENTS.cursor, AGENTS.kimi, AGENTS.qwen];

export const FeatTeam: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const squad = sp(f, fps, 12, { damping: 16, stiffness: 140 });
  // An issue drops onto the leader, then gets routed to Cursor.
  const drop = tw(f, 46, 22, 0, 1, ease.inOut);
  const route = tw(f, 78, 26, 0, 1, ease.inOut);
  const chipX = mix(mix(560, 405, drop), MEMBERS[1].x + 40 - 70, route);
  const chipY = mix(mix(-80, 70, drop), 236, route);
  const chipO = Math.min(tw(f, 40, 8), 1 - tw(f, 108, 10));
  const targetGlow = tw(f, 104, 8) * (1 - tw(f, 130, 30));

  const skill = sp(f, fps, 112, { damping: 15, stiffness: 150 });

  return (
    <Feature
      index={3}
      kicker="小队 · SKILLS"
      title={"组队协作，\n经验[全队复用]。"}
      body="人和智能体混编成小队，leader 负责分派；解决过一次的问题沉淀成 Skill，每个智能体都能直接用。"
      dur={SCENES.team.dur}
      glowA="#6d3fd6"
      glowB="#d64f8a"
    >
      {/* squad */}
      <Glass
        style={{
          position: "absolute",
          left: 60,
          top: 30,
          width: 900,
          height: 400,
          padding: "26px 30px",
          boxSizing: "border-box",
          transform: `translateY(${(1 - squad) * 60}px)`,
          opacity: Math.min(1, squad * 1.4),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 650 }}>
          前端小队
          <span style={{ fontSize: 15, color: C.inkMute, fontWeight: 500 }}>3 个智能体 · 1 位成员</span>
        </div>
        {/* leader */}
        <div style={{ position: "absolute", left: 370, top: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Avatar who={AGENTS.claude} size={84} ring={`rgba(242,181,58,${0.6 + 0.4 * targetGlow})`} />
            <div style={{ position: "absolute", right: -8, top: -10, width: 32, height: 32, borderRadius: 10, background: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={18} color="#3a2500" />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Claude · Leader</div>
        </div>
        <svg width={900} height={400} style={{ position: "absolute", left: 0, top: 0 }}>
          {MEMBERS.map((m, i) => {
            const t = tw(f, 30 + i * 5, 24);
            const active = i === 1 ? targetGlow : 0;
            return (
              <path
                key={i}
                d={`M 412 205 C 412 250, ${m.x + 40} 240, ${m.x + 40} 282`}
                stroke={active > 0.05 ? C.glow : "rgba(255,255,255,0.18)"}
                strokeWidth={active > 0.05 ? 3 : 2}
                fill="none"
                strokeDasharray="300"
                strokeDashoffset={300 * (1 - t)}
              />
            );
          })}
        </svg>
        {MEMBERS.map((m, i) => {
          const t = sp(f, fps, 24 + i * 5, { damping: 13, stiffness: 180 });
          const glow = i === 1 ? targetGlow : 0;
          return (
            <div key={i} style={{ position: "absolute", left: m.x, top: 282, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transform: `scale(${t})` }}>
              <Avatar who={m.who} size={64} ring={glow > 0.05 ? `rgba(76,141,246,${glow})` : undefined} />
              <div style={{ fontSize: 16, color: C.inkSoft }}>{m.who.name}</div>
            </div>
          );
        })}
        {/* routed issue */}
        <div
          style={{
            position: "absolute",
            left: chipX,
            top: chipY,
            opacity: chipO,
            padding: "8px 14px",
            borderRadius: 10,
            background: "#fff",
            color: "#18181b",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
            whiteSpace: "nowrap",
          }}
        >
          NEB-140 · 首页加载优化
        </div>
      </Glass>

      {/* skill */}
      <Glass
        style={{
          position: "absolute",
          left: 60,
          top: 470,
          width: 900,
          height: 236,
          padding: "26px 30px",
          boxSizing: "border-box",
          transform: `translateY(${(1 - skill) * 60}px)`,
          opacity: Math.min(1, skill * 1.4),
        }}
      >
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <div style={{ width: 300, padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: C.inkMute }}>
              <BookOpen size={18} color={C.glow} /> Skill
            </div>
            <div style={{ fontSize: 24, fontWeight: 650, marginTop: 8 }}>部署到预发环境</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontFamily: F.mono, fontSize: 14.5, color: C.inkMute }}>
              <FileText size={15} /> SKILL.md · deploy.sh
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", height: 150 }}>
            {SKILL_TARGETS.map((w, i) => {
              const at = 132 + i * 8;
              const fly = tw(f, at, 18, 0, 1, ease.inOut);
              const got = tw(f, at + 16, 8);
              return (
                <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  {fly > 0 && fly < 1 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: mix(-260 - i * 104, 10, fly),
                        top: mix(20, -10, fly) - Math.sin(fly * Math.PI) * 50,
                        width: 34,
                        height: 42,
                        borderRadius: 6,
                        background: "linear-gradient(180deg,#cfe4ff,#7fb2ff)",
                        boxShadow: "0 0 24px rgba(76,141,246,0.8)",
                        transform: `rotate(${(1 - fly) * -20}deg)`,
                      }}
                    />
                  ) : null}
                  <Avatar who={w} size={58} ring={got > 0 ? `rgba(76,141,246,${got})` : undefined} />
                  <div
                    style={{
                      fontSize: 13,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: `rgba(76,141,246,${0.22 * got})`,
                      color: C.glow,
                      opacity: got,
                      fontFamily: F.mono,
                      whiteSpace: "nowrap",
                    }}
                  >
                    + deploy
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Glass>
      <Sfx at={46} name="swoosh" vol={0.4} />
      <Sfx at={104} name="select" vol={0.45} />
      {SKILL_TARGETS.map((_, i) => (
        <Sfx key={i} at={148 + i * 8} name="blip" vol={0.35} />
      ))}
    </Feature>
  );
};
