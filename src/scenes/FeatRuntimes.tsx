import React from "react";
import { Cloud, Laptop, Server, ShieldCheck } from "lucide-react";
import { getLength, getPointAtLength } from "@remotion/paths";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Feature, Glass } from "../components/Feature";
import { MulticaMark } from "../components/Logo";
import { Sfx } from "../components/Sfx";
import { LogoTile } from "../components/ui";
import { ease, mix, rnd, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

const HUB = { x: 120, y: 440 };
const MACHINES = [
  { name: "MacBook Pro", os: "macOS · 林舟的笔记本", icon: Laptop, clis: ["claude", "codex", "cursor"], y: 110, at: 26 },
  { name: "dev-server-01", os: "Ubuntu 24.04 · 机房", icon: Server, clis: ["codex", "opencode", "kimi", "copilot"], y: 370, at: 40 },
  { name: "gpu-box", os: "云主机 · 自己的 VPC", icon: Cloud, clis: ["qwen", "claude", "grok"], y: 630, at: 54 },
];
const CARD_X = 430;
const CARD_W = 560;
const CARD_H = 200;

const pathTo = (y: number) => {
  const sx = HUB.x + 70;
  const ex = CARD_X;
  const ey = y + CARD_H / 2;
  return `M ${sx} ${HUB.y} C ${sx + 140} ${HUB.y}, ${ex - 140} ${ey}, ${ex} ${ey}`;
};

export const FeatRuntimes: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hub = sp(f, fps, 6, { damping: 12, stiffness: 150 });
  const shield = sp(f, fps, 150, { damping: 12, stiffness: 180 });
  return (
    <Feature
      index={2}
      kicker="运行时"
      title={"它们的工位，\n就是[你的机器]。"}
      body="守护进程跑在你的笔记本、服务器或云主机上，自动发现本机装好的 CLI。代码不出门。"
      dur={SCENES.runtimes.dur}
      glowA="#1f7a8c"
      glowB="#2f55d4"
    >
      <svg width={1020} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="wire" x1="0" x2="1">
            <stop offset="0" stopColor={C.brand} stopOpacity={0.9} />
            <stop offset="1" stopColor={C.glow} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        {MACHINES.map((m, i) => {
          const d = pathTo(m.y);
          const len = getLength(d);
          const draw = tw(f, m.at, 34, 0, 1, ease.inOut);
          const packets = Array.from({ length: 4 }, (_, k) => {
            const period = 64;
            const phase = (f - m.at - 30 - k * 16 + rnd(`ph${i}`, 0, 20)) / period;
            if (phase < 0) return null;
            const back = k % 2 === 1;
            const u = phase % 1;
            const p = getPointAtLength(d, len * (back ? 1 - u : u));
            if (!p) return null;
            return (
              <circle
                key={k}
                cx={p.x}
                cy={p.y}
                r={back ? 5 : 6}
                fill={back ? "#5fe3a1" : "#9fd0ff"}
                opacity={Math.sin(u * Math.PI)}
                style={{ filter: `drop-shadow(0 0 8px ${back ? "#5fe3a1" : "#4c8df6"})` }}
              />
            );
          });
          return (
            <g key={m.name}>
              <path d={d} stroke="url(#wire)" strokeWidth={2.5} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
              <path d={d} stroke={C.brand} strokeOpacity={0.15} strokeWidth={10} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
              {packets}
            </g>
          );
        })}
      </svg>

      {/* hub */}
      <div
        style={{
          position: "absolute",
          left: HUB.x - 70,
          top: HUB.y - 70,
          width: 140,
          height: 140,
          borderRadius: 36,
          background: "linear-gradient(160deg, #1c2536 0%, #0b0f17 100%)",
          border: "1px solid rgba(140,196,255,0.35)",
          boxShadow: `0 0 ${mix(20, 70, (Math.sin(f / 14) + 1) / 2)}px rgba(76,141,246,0.45), 0 30px 60px rgba(0,0,0,0.5)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${hub})`,
        }}
      >
        <MulticaMark size={70} />
      </div>
      <div style={{ position: "absolute", left: HUB.x - 90, top: HUB.y + 86, width: 180, textAlign: "center", fontFamily: F.sans, fontSize: 18, color: C.inkMute, opacity: tw(f, 20, 20) }}>
        Multica 服务
      </div>

      {MACHINES.map((m) => {
        const t = sp(f, fps, m.at + 10, { damping: 15, stiffness: 150 });
        const Icon = m.icon;
        return (
          <Glass
            key={m.name}
            style={{
              position: "absolute",
              left: CARD_X,
              top: m.y,
              width: CARD_W,
              height: CARD_H,
              padding: "24px 28px",
              boxSizing: "border-box",
              transform: `translateX(${(1 - t) * 80}px)`,
              opacity: Math.min(1, t * 1.4),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(76,141,246,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} color={C.glow} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 650 }}>{m.name}</div>
                <div style={{ fontSize: 16, color: C.inkMute, marginTop: 2 }}>{m.os}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "#7ee2a8" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#3ddc84", boxShadow: "0 0 10px #3ddc84", opacity: 0.6 + 0.4 * Math.sin(f / 8) }} />
                在线
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
              <span style={{ fontFamily: F.mono, fontSize: 15, color: C.inkMute, marginRight: 6 }}>daemon · 已发现</span>
              {m.clis.map((p, k) => {
                const tk = sp(f, fps, m.at + 30 + k * 6, { damping: 12, stiffness: 200 });
                return <LogoTile key={p} provider={p} size={40} radius={10} style={{ transform: `scale(${tk})` }} />;
              })}
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 34 }}>
                {Array.from({ length: 12 }, (_, k) => (
                  <div
                    key={k}
                    style={{
                      width: 5,
                      borderRadius: 2,
                      height: 6 + 26 * Math.abs(Math.sin((f + k * 9 + m.y) / 17)),
                      background: "rgba(140,196,255,0.55)",
                    }}
                  />
                ))}
              </div>
            </div>
          </Glass>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: CARD_X + 120,
          top: 850,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 22px",
          borderRadius: 999,
          background: "rgba(47,179,109,0.14)",
          border: "1px solid rgba(94,227,161,0.45)",
          color: "#a7f3c9",
          fontFamily: F.sans,
          fontSize: 22,
          fontWeight: 600,
          transform: `scale(${shield})`,
          opacity: Math.min(1, shield),
        }}
      >
        <ShieldCheck size={24} />
        代码只在你的机器上运行
      </div>
      {MACHINES.map((m) => (
        <Sfx key={m.name} at={m.at + 10} name="pop_soft" vol={0.45} />
      ))}
      <Sfx at={150} name="ding" vol={0.4} />
    </Feature>
  );
};
