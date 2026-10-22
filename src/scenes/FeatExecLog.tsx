import React from "react";
import { CornerDownRight, Send } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Feature, Glass } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { AGENTS, Avatar, HUMANS, Spinner } from "../components/ui";
import { mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

type Row = { at: number; ts: string; tool: string; color: string; text: string; tone?: "ok" | "err" | "agent" };

const ROWS: Row[] = [
  { at: 14, ts: "10:42:03", tool: "Read", color: "#8ab4ff", text: "server/internal/webhook/retry.go" },
  { at: 28, ts: "10:42:05", tool: "Grep", color: "#8ab4ff", text: "\"MaxAttempts\" → 3 处匹配" },
  { at: 42, ts: "10:42:07", tool: "Bash", color: "#f5c46b", text: "go test ./internal/webhook/..." },
  { at: 56, ts: "10:42:11", tool: "FAIL", color: "#ff7b72", text: "TestRetryBackoff  expected 5 attempts, got 1", tone: "err" },
  { at: 72, ts: "10:42:15", tool: "Edit", color: "#c4a5ff", text: "retry.go  +18 −4" },
  { at: 88, ts: "10:42:21", tool: "PASS", color: "#7ee2a8", text: "ok  internal/webhook  0.41s", tone: "ok" },
];

const LATE: Row[] = [
  { at: 170, ts: "10:42:40", tool: "Codex", color: "#e9edf5", text: "收到，保留现有迁移，只改重试逻辑。", tone: "agent" },
  { at: 186, ts: "10:42:44", tool: "Bash", color: "#f5c46b", text: "make check" },
];

const LogRow: React.FC<{ r: Row; f: number }> = ({ r, f }) => {
  if (f < r.at) return null;
  const t = tw(f, r.at, 10);
  const chars = Math.floor((f - r.at) * 2.6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 46, opacity: t, transform: `translateX(${(1 - t) * 24}px)`, fontFamily: F.mono, fontSize: 19 }}>
      <span style={{ color: "rgba(255,255,255,0.35)", width: 96 }}>{r.ts}</span>
      {r.tone === "agent" ? (
        <span style={{ display: "flex", alignItems: "center", gap: 8, width: 92 }}>
          <Avatar who={AGENTS.codex} size={24} />
        </span>
      ) : (
        <span
          style={{
            width: 92,
            textAlign: "center",
            padding: "3px 0",
            borderRadius: 7,
            fontSize: 15,
            fontWeight: 700,
            color: r.color,
            background: `${r.color}1f`,
            border: `1px solid ${r.color}44`,
          }}
        >
          {r.tool}
        </span>
      )}
      <span style={{ color: r.tone === "err" ? "#ffb4ae" : r.tone === "ok" ? "#a7f3c9" : r.tone === "agent" ? "#fff" : "#d7dce5", fontFamily: r.tone === "agent" ? F.sans : F.mono, fontSize: r.tone === "agent" ? 21 : 19, whiteSpace: "nowrap" }}>
        {r.text.slice(0, chars)}
      </span>
    </div>
  );
};

export const FeatExecLog: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panel = sp(f, fps, 4, { damping: 18, stiffness: 120 });
  const steer = sp(f, fps, 122, { damping: 14, stiffness: 170 });
  const delivered = tw(f, 146, 10);
  const tokens = Math.round(mix(12.4, 38.2, tw(f, 0, 220)) * 10) / 10;
  const cost = mix(0.13, 0.42, tw(f, 0, 220)).toFixed(2);
  const secs = 31 + Math.floor(f / 60);
  return (
    <Feature
      index={4}
      kicker="执行日志 · 运行中插话"
      title={"每一步，\n都[看得见]。"}
      body="工具调用、命令和报错都带时间戳，可以完整回放；运行中随时插话，消息直接进当前这次运行。花了多少，一目了然。"
      dur={SCENES.execlog.dur}
      glowA="#1f8a5a"
      glowB="#2f55d4"
    >
      <Glass
        style={{
          position: "absolute",
          left: 20,
          top: 60,
          width: 980,
          height: 700,
          padding: 0,
          overflow: "hidden",
          transform: `perspective(1800px) rotateY(${mix(-14, -6, panel)}deg) translateY(${(1 - panel) * 70}px)`,
          opacity: Math.min(1, panel * 1.4),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, height: 72, padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Avatar who={AGENTS.codex} size={32} />
          <div style={{ fontSize: 21, fontWeight: 650 }}>执行日志</div>
          <div style={{ fontSize: 17, color: C.inkMute }}>Codex · NEB-128</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "rgba(242,181,58,0.12)", color: "#f5cf7a", fontSize: 16, fontWeight: 600 }}>
            <Spinner size={14} color="#f5cf7a" /> 运行中 00:{String(secs).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 16, color: C.inkSoft, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>
            {tokens}k tokens · ${cost}
          </div>
        </div>
        <div style={{ padding: "20px 28px" }}>
          {ROWS.map((r) => (
            <LogRow key={r.at} r={r} f={f} />
          ))}
          {f >= 140 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, height: 46, opacity: tw(f, 140, 10), fontSize: 18, color: C.glow, fontFamily: F.sans }}>
              <CornerDownRight size={20} /> 林舟 的消息已送达当前运行
            </div>
          ) : null}
          {LATE.map((r) => (
            <LogRow key={r.at} r={r} f={f} />
          ))}
        </div>
        {/* steer input */}
        <div
          style={{
            position: "absolute",
            left: 28,
            right: 28,
            bottom: 24,
            height: 66,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(140,196,255,${0.2 + 0.4 * steer * (1 - delivered)})`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 18px",
            fontSize: 20,
          }}
        >
          <Avatar who={HUMANS.lin} size={30} />
          <span style={{ color: f >= 122 && f < 146 ? C.ink : C.inkMute, flex: 1 }}>
            {f < 104 ? "给 Codex 发消息…" : f < 146 ? "先别动数据库迁移".slice(0, Math.floor((f - 104) / 2.2)) : "给 Codex 发消息…"}
          </span>
          <Send size={20} color={f >= 140 && f < 150 ? C.brand : C.inkMute} />
        </div>
      </Glass>
      {/* message bubble flying into the log */}
      {f >= 140 && f < 170 ? (
        <div
          style={{
            position: "absolute",
            left: mix(160, 120, tw(f, 140, 20)),
            top: mix(690, 410, tw(f, 140, 20)),
            opacity: 1 - tw(f, 156, 12),
            padding: "10px 18px",
            borderRadius: 14,
            background: C.brandDeep,
            color: "#fff",
            fontSize: 20,
            fontFamily: F.sans,
            boxShadow: "0 0 40px rgba(76,141,246,0.6)",
          }}
        >
          先别动数据库迁移
        </div>
      ) : null}
      <Sfx at={14} name="type_long" vol={0.25} />
      <Sfx at={56} name="error" vol={0.4} />
      <Sfx at={88} name="ding" vol={0.35} />
      <Sfx at={104} name="type_short" vol={0.4} />
      <Sfx at={140} name="send" vol={0.6} />
      <Sfx at={170} name="blip" vol={0.4} />
    </Feature>
  );
};
