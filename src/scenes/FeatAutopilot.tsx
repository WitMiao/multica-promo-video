import React from "react";
import { CalendarClock, Zap } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Feature, Glass } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { AGENTS, Avatar, IssueCard, StatusIcon } from "../components/ui";
import { mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

const DAYS = ["周一", "周二", "周三", "周四", "周五"];
const PAST = ["10/22 站会摘要", "10/21 站会摘要", "10/20 站会摘要"];

export const FeatAutopilot: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = sp(f, fps, 6, { damping: 16, stiffness: 140 });
  // Clock ticks 08:59:5x → 09:00:00 at frame 84.
  const fire = 84;
  const sec = Math.min(60, 52 + Math.floor(f / 10.5));
  const time = f < fire ? `08:59:${String(Math.min(59, sec)).padStart(2, "0")}` : "09:00:00";
  const pulse = tw(f, fire, 6) * (1 - tw(f, fire + 6, 40));
  const spawn = sp(f, fps, fire + 4, { damping: 13, stiffness: 150 });
  const week = (i: number) => tw(f, 140 + i * 9, 10);

  return (
    <Feature
      index={5}
      kicker="AUTOPILOT"
      title={"日报、巡检、周报，\n[到点自己跑]。"}
      body="按 cron 定时触发智能体：每天早上自动整理站会摘要、夜里巡检依赖。不用有人提醒，也不会忘。"
      dur={SCENES.autopilot.dur}
      glowA="#b5741f"
      glowB="#2f55d4"
    >
      <Glass
        style={{
          position: "absolute",
          left: 40,
          top: 40,
          width: 560,
          height: 300,
          padding: "28px 30px",
          boxSizing: "border-box",
          transform: `translateY(${(1 - card) * 60}px)`,
          opacity: Math.min(1, card * 1.4),
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${pulse * 80}px rgba(242,181,58,${pulse * 0.7})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(242,181,58,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={24} color={C.amber} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 650, flex: 1 }}>每日站会摘要</div>
          <div style={{ width: 54, height: 30, borderRadius: 15, background: C.green, position: "relative" }}>
            <div style={{ position: "absolute", right: 3, top: 3, width: 24, height: 24, borderRadius: "50%", background: "#fff" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, fontSize: 19, color: C.inkSoft }}>
          <CalendarClock size={20} color={C.inkMute} /> 工作日 09:00
          <span style={{ fontFamily: F.mono, fontSize: 16, color: C.inkMute, padding: "3px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)" }}>0 9 * * 1-5</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 19, color: C.inkSoft }}>
          <Avatar who={AGENTS.claude} size={26} /> 交给 Claude · 汇总昨天的提交、评论与阻塞
        </div>
        <div style={{ position: "absolute", right: 30, bottom: 24, fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: f >= fire ? C.amber : C.ink, letterSpacing: "0.02em" }}>
          {time}
        </div>
      </Glass>

      {/* spawned issue */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 70,
          zIndex: 2,
          transformOrigin: "0 50%",
          transform: `translateX(${(1 - spawn) * -260}px) scale(${mix(0.4, 1.32, spawn)})`,
          opacity: Math.min(1, spawn * 1.6),
        }}
      >
        <IssueCard
          card={{ id: "NEB-141", title: "10/23 站会摘要", status: "in_progress", who: AGENTS.claude, working: f < 200, priority: 2, lines: 1, updated: "刚刚" }}
          glow={tw(f, fire + 4, 8) * (1 - tw(f, fire + 30, 40))}
        />
      </div>
      {PAST.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: 640 + (i + 1) * 9,
            top: 70 + (i + 1) * 16,
            zIndex: -1 - i,
            transformOrigin: "50% 0",
            transform: `scale(${(1.32 - (i + 1) * 0.06) * Math.min(1, 0.6 + 0.4 * spawn)})`,
            opacity: tw(f, 20 + i * 6, 16) * (0.7 - i * 0.18),
            filter: `brightness(${0.75 - i * 0.12})`,
          }}
        >
          <IssueCard card={{ id: `NEB-${138 - i * 3}`, title: t, status: "done", who: AGENTS.claude, priority: 2, lines: 1, updated: `${i + 1} 天前` }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 650, top: 250, fontFamily: F.sans, fontSize: 18, color: C.inkMute, opacity: tw(f, fire + 20, 20) }}>
        自动创建任务 · 已连续运行 23 天
      </div>
      {/* week strip */}
      <Glass style={{ position: "absolute", left: 40, top: 560, width: 940, height: 190, padding: "26px 30px", boxSizing: "border-box", opacity: tw(f, 120, 20) }}>
        <div style={{ fontSize: 17, color: C.inkMute, marginBottom: 18 }}>本周运行记录</div>
        <div style={{ display: "flex", gap: 16 }}>
          {DAYS.map((d, i) => {
            const on = i <= 3 ? week(i) : 0;
            const today = i === 4;
            return (
              <div
                key={d}
                style={{
                  flex: 1,
                  height: 74,
                  borderRadius: 14,
                  border: `1px solid ${today ? "rgba(242,181,58,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: today ? "rgba(242,181,58,0.10)" : `rgba(47,179,109,${0.14 * on})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 19,
                  color: C.inkSoft,
                }}
              >
                {d}
                {today ? (
                  <span style={{ color: C.amber, fontSize: 16 }}>运行中</span>
                ) : (
                  <span style={{ opacity: on, transform: `scale(${mix(0.5, 1, on)})`, display: "flex" }}>
                    <StatusIcon status="done" size={20} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Glass>
      <Sfx at={20} name="tick" vol={0.3} />
      <Sfx at={50} name="tick" vol={0.3} />
      <Sfx at={fire} name="chime" vol={0.6} />
      <Sfx at={fire + 4} name="pop" vol={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={140 + i * 9} name="blip" vol={0.3} />
      ))}
    </Feature>
  );
};
