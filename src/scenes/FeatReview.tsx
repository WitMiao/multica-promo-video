import React from "react";
import { Check, GitMerge, Inbox, ShieldCheck } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Pointer, cursorAt } from "../components/Cursor";
import { Feature, Glass } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { AGENTS, Avatar, StatusIcon } from "../components/ui";
import { mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

const DIFF: Array<[" " | "+" | "-", string]> = [
  [" ", "func (d *Dispatcher) retry(ctx context.Context, ev Event) error {"],
  ["-", "\treturn d.send(ctx, ev)"],
  ["+", "\tfor attempt := 0; attempt < d.maxAttempts; attempt++ {"],
  ["+", "\t\tif err := d.send(ctx, ev); err == nil {"],
  ["+", "\t\t\treturn nil"],
  ["+", "\t\t}"],
  ["+", "\t\tsleep(ctx, backoff(attempt) + jitter())"],
  ["+", "\t}"],
  [" ", "}"],
];

const APPROVE = 112;

export const FeatReview: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pr = sp(f, fps, 4, { damping: 17, stiffness: 130 });
  const approved = f >= APPROVE + 4;
  const stamp = sp(f, fps, APPROVE + 6, { damping: 10, stiffness: 240 });
  const inbox = sp(f, fps, 150, { damping: 14, stiffness: 160 });
  const cur = cursorAt(f, [
    { f: 40, x: 980, y: 720 },
    { f: 104, x: 812, y: 498 },
    { f: 140, x: 830, y: 512 },
  ]);
  return (
    <Feature
      index={6}
      kicker="审核关卡 · 收件箱"
      title={"上不上线，\n[你说了算]。"}
      body="智能体交付的活先进入「审核中」，不会直接进 main。只有需要你拍板时，收件箱才会提醒你。"
      dur={SCENES.review.dur}
      glowA="#1f8a6a"
      glowB="#2f55d4"
    >
      <Glass
        style={{
          position: "absolute",
          left: 20,
          top: 40,
          width: 900,
          overflow: "hidden",
          transform: `translateY(${(1 - pr) * 70}px)`,
          opacity: Math.min(1, pr * 1.4),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 28px 18px" }}>
          <StatusIcon status="in_review" size={22} />
          <div style={{ fontSize: 22, fontWeight: 650 }}>NEB-128 · 审核中</div>
          <div style={{ flex: 1 }} />
          <Avatar who={AGENTS.codex} size={28} />
          <span style={{ fontSize: 17, color: C.inkMute }}>Codex 提交了 1 个 PR</span>
        </div>
        <div style={{ margin: "0 28px", borderRadius: 14, background: "#0a0d13", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 0", fontFamily: F.mono, fontSize: 17.5, lineHeight: "34px" }}>
          {DIFF.map(([k, line], i) => {
            const t = tw(f, 12 + i * 4, 12);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "0 20px",
                  opacity: t,
                  background: k === "+" ? "rgba(47,179,109,0.13)" : k === "-" ? "rgba(229,72,77,0.14)" : "transparent",
                  color: k === "+" ? "#a7f3c9" : k === "-" ? "#ffb4ae" : "#c9d1dc",
                  whiteSpace: "pre",
                }}
              >
                <span style={{ width: 14, opacity: 0.7 }}>{k}</span>
                {line.replace(/\t/g, "    ")}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 28px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#7ee2a8", fontSize: 17 }}>
            <Check size={18} /> 12 项检查通过
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ height: 50, padding: "0 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", fontSize: 19, color: C.inkSoft }}>
            要求修改
          </div>
          <div
            style={{
              height: 50,
              padding: "0 24px",
              borderRadius: 12,
              background: approved ? C.green : C.brandDeep,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 19,
              fontWeight: 650,
              transform: `scale(${f >= APPROVE && f < APPROVE + 8 ? 0.95 : 1})`,
              boxShadow: approved ? "0 0 30px rgba(47,179,109,0.6)" : "0 0 24px rgba(37,99,235,0.5)",
            }}
          >
            {approved ? <GitMerge size={20} /> : <ShieldCheck size={20} />}
            {approved ? "已合并到 main" : "批准并合并"}
          </div>
        </div>
      </Glass>
      {approved ? (
        <div
          style={{
            position: "absolute",
            left: 520,
            top: 250,
            transform: `rotate(-10deg) scale(${mix(2.2, 1, stamp)})`,
            opacity: Math.min(1, (f - APPROVE - 4) / 4),
            padding: "12px 28px",
            border: `5px solid ${C.green}`,
            borderRadius: 16,
            color: "#7ee2a8",
            fontFamily: F.serif,
            fontWeight: 900,
            fontSize: 52,
            background: "rgba(6,20,12,0.82)",
            boxShadow: "0 0 50px rgba(47,179,109,0.45)",
          }}
        >
          人已验收
        </div>
      ) : null}
      <Pointer x={cur.x} y={cur.y} f={f} clicks={[APPROVE]} opacity={tw(f, 40, 10) * (1 - tw(f, 140, 14))} />

      {/* inbox ping */}
      <Glass
        style={{
          position: "absolute",
          left: 380,
          top: 620,
          width: 600,
          padding: "20px 24px",
          boxSizing: "border-box",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          transform: `translateY(${(1 - inbox) * 60}px)`,
          opacity: Math.min(1, inbox * 1.4),
          border: "1px solid rgba(140,196,255,0.35)",
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(76,141,246,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Inbox size={24} color={C.glow} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, color: C.inkMute }}>收件箱 · 需要你拍板</div>
          <div style={{ fontSize: 21, marginTop: 4, lineHeight: 1.45 }}>Codex：要把 pgx 升级到 v5 吗？涉及 3 个服务。</div>
        </div>
        <div style={{ alignSelf: "center", padding: "8px 16px", borderRadius: 10, background: C.brandDeep, fontSize: 17, fontWeight: 600 }}>回复</div>
      </Glass>
      <Sfx at={APPROVE} name="click" vol={0.8} />
      <Sfx at={APPROVE + 6} name="stamp" vol={1} />
      <Sfx at={APPROVE + 8} name="success" vol={0.5} />
      <Sfx at={150} name="notify" vol={1} />
    </Feature>
  );
};
