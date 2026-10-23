import React from "react";
import { Check, Minus, SquareTerminal, User, Users } from "lucide-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Grain, Vignette } from "../components/Atmos";
import { ClientWindow } from "../components/ClientWindow";
import { Board, layout } from "../components/Board";
import { HL_STYLE } from "../components/Caption";
import { Kinetic } from "../components/Kinetic";
import { MulticaMark } from "../components/Logo";
import { Sfx } from "../components/Sfx";
import { Terminal } from "../components/Terminal";
import { AGENTS, AppWindow, Avatar, HUMANS, LogoTile } from "../components/ui";
import { BOARD_CARDS, COLUMNS, WORKING_AVATARS } from "../data";
import { ease, mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

// ------------------------------------------------------------ intro: one vs team

const SideLabel: React.FC<{ icon: React.ReactNode; title: string; sub: string; o: number; accent: string }> = ({ icon, title, sub, o, accent }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: o, fontFamily: F.sans }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 34, fontWeight: 700, color: C.ink }}>
      <span style={{ display: "flex", color: accent }}>{icon}</span>
      {title}
    </div>
    <div style={{ fontSize: 22, color: C.inkMute, letterSpacing: "0.04em" }}>{sub}</div>
  </div>
);

export const S6CompareIntro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.compareIntro.dur;
  const q = tw(f, 92, 26, 0, 1, ease.inOut); // question moves up
  const split = sp(f, fps, 100, { damping: 18, stiffness: 110 });
  const out = tw(f, dur - 16, 16, 0, 1, ease.in);
  const placed = Object.values(layout(COLUMNS, BOARD_CARDS));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.03} glowA="#2f55d4" glowB="#6d3fd6" />
      <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${mix(0, -380, q)}px) scale(${mix(1, 0.62, q)})` }}>
            <Kinetic
              text={"Claude Code、Codex 的终端和桌面客户端都很强，\n为什么还需要 [Multica]？"}
              start={4}
              align="center"
              stagger={1.8}
              lineGap={0.16}
              exit="none"
              style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 74, color: C.ink, lineHeight: 1.2 }}
              hlStyle={HL_STYLE}
            />
          </div>
        </AbsoluteFill>

        {/* left: one terminal, one person */}
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 330,
            width: 760,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 34,
            transform: `translateX(${(1 - split) * -120}px)`,
            opacity: Math.min(1, split * 1.4),
          }}
        >
          <div style={{ position: "relative", height: 470, width: 720 }}>
            <ClientWindow
              provider="codex"
              title="Codex"
              sessions={["修复 webhook 重试", "给 API 加限流", "整理发布说明", "升级依赖"]}
              prompt="修复 webhook 投递失败后疯狂重试的问题"
              reply="好的，我先看看现有的重试实现，再补上指数退避。"
              clock={100}
              width={600}
              height={372}
              style={{ position: "absolute", left: 0, top: 0 }}
            />
            <Terminal
              title="claude — ~/nebula/api"
              lines={[
                { text: "> 修复 webhook 重试", at: 0, cps: Infinity },
                { text: "⏺ Read(retry.go)", at: 0, cps: Infinity, color: "#8ab4ff" },
                { text: "⏺ 需要你的确认：继续吗？", at: 0, cps: Infinity, color: "#f5c46b" },
              ]}
              clock={100}
              width={430}
              height={230}
              fontSize={16}
              accent="#e58a66"
              style={{ position: "absolute", left: 290, top: 226 }}
            />
          </div>
          <SideLabel icon={<User size={30} />} title="个人工具" sub="终端或桌面客户端 · 自家智能体 · 个人会话" o={tw(f, 130, 20)} accent={C.inkMute} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 930,
            top: 500,
            fontFamily: F.display,
            fontStyle: "italic",
            fontSize: 64,
            color: C.inkMute,
            opacity: tw(f, 120, 20),
          }}
        >
          vs
        </div>

        {/* right: the board */}
        <div
          style={{
            position: "absolute",
            left: 1030,
            top: 330,
            width: 790,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 34,
            transform: `translateX(${(1 - split) * 120}px)`,
            opacity: Math.min(1, split * 1.4),
          }}
        >
          <div style={{ position: "relative", height: 470, width: 790 }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: "scale(0.49)", transformOrigin: "0 0" }}>
              <AppWindow>
                <Board columns={COLUMNS} cards={placed} working={WORKING_AVATARS} workingCount={5} />
              </AppWindow>
            </div>
            <div style={{ position: "absolute", left: 190, top: 396, display: "flex" }}>
              {[AGENTS.claude, AGENTS.codex, HUMANS.lin, AGENTS.cursor, AGENTS.kimi, HUMANS.wang, AGENTS.qwen].map((w, i) => (
                <div key={i} style={{ marginLeft: i ? -12 : 0, transform: `scale(${sp(f, fps, 120 + i * 4, { damping: 12, stiffness: 200 })})` }}>
                  <Avatar who={w} size={54} ring={C.bg} />
                </div>
              ))}
            </div>
          </div>
          <SideLabel icon={<Users size={30} />} title="团队协作" sub="一个工作区 · 跨厂商智能体 · 全队共享" o={tw(f, 140, 20)} accent={C.brand} />
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Grain opacity={0.06} />
      <Sfx at={100} name="whoosh_soft" vol={0.5} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ table

// Fair comparison as of October 2026: the desktop clients already run sessions
// in parallel, isolate them in worktrees and schedule work, so the rows below
// only claim what still separates a team workspace from a personal client.
const ROWS: Array<[string, string, string, string]> = [
  ["工作单元", "一次终端会话", "一串会话 / 线程", "看板上的任务：状态、负责人、审核"],
  ["智能体", "只有自家的，一次一个", "只有自家的，可并行多个", "27 款 CLI 跨厂商混编成队"],
  ["上下文", "留在本地会话", "留在个人会话历史", "挂在任务上，全队都看得到"],
  ["队友", "你和一个智能体", "你和你开的会话", "整个团队的人和智能体"],
  ["运行位置", "本机", "本机或厂商云端", "你自己的任意机器，统一调度"],
  ["平台", "厂商工具", "厂商应用", "源码公开，整套可自托管"],
];
// Each row's Multica cell (and its check) lands on a beat: ROW_AT + 8 = 30 + 60i.
const ROW_AT = (i: number) => 22 + i * 60;
const LABEL_W = 170;
const CLI_W = 360;
const APP_W = 400;
const MULTICA_W = 700;
const ROW_H = 100;

const ColHead: React.FC<{ icon: React.ReactNode; title: string; sub: string; width: number }> = ({ icon, title, sub, width }) => (
  <div style={{ width, display: "flex", alignItems: "center", gap: 14, paddingLeft: 22, boxSizing: "border-box" }}>
    <div style={{ display: "flex", gap: 6 }}>{icon}</div>
    <div style={{ fontFamily: F.sans, lineHeight: 1.25 }}>
      <div style={{ fontSize: 25, color: C.inkSoft, fontWeight: 650 }}>{title}</div>
      <div style={{ fontSize: 16, color: C.inkMute, fontWeight: 500, whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  </div>
);

export const S6CompareTable: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.compareTable.dur;
  const head = sp(f, fps, 4, { damping: 18, stiffness: 120 });
  const out = tw(f, dur - 16, 16, 0, 1, ease.in);
  const colGrow = tw(f, 22, ROWS.length * 60 + 10, 0, 1, ease.inOut);
  const total = LABEL_W + CLI_W + APP_W + MULTICA_W;
  const left = (1920 - total) / 2;
  const top = 250;
  const mx = left + LABEL_W + CLI_W + APP_W;
  const cell = (t: number): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingLeft: 22,
    boxSizing: "border-box",
    fontSize: 25,
    color: "rgba(245,247,250,0.55)",
    opacity: t,
    transform: `translateX(${(1 - t) * 26}px)`,
    whiteSpace: "nowrap",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.03} glowA="#2f55d4" glowB="#3f2fd6" />
      <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${mix(1, 1.04, out)})` }}>
        {/* header */}
        <div style={{ position: "absolute", left, top: top - 112, display: "flex", alignItems: "center", opacity: Math.min(1, head * 1.4), transform: `translateY(${(1 - head) * 30}px)` }}>
          <div style={{ width: LABEL_W }} />
          <ColHead
            width={CLI_W}
            title="终端 CLI"
            sub="Claude Code · Codex CLI"
            icon={
              <div style={{ width: 44, height: 44, borderRadius: 11, background: "#11151d", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SquareTerminal size={24} color={C.inkSoft} />
              </div>
            }
          />
          <ColHead
            width={APP_W}
            title="桌面客户端"
            sub="Claude 桌面端 · Codex App"
            icon={
              <>
                <LogoTile provider="claude" size={44} radius={11} />
                <LogoTile provider="codex" size={44} radius={11} />
              </>
            }
          />
          <div style={{ width: MULTICA_W, display: "flex", alignItems: "center", gap: 16, paddingLeft: 32 }}>
            <div style={{ width: 50, height: 50, borderRadius: 13, background: "#111827", border: "1px solid rgba(140,196,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(76,141,246,0.45)" }}>
              <MulticaMark size={28} />
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 34, color: C.ink, fontWeight: 700, letterSpacing: "-0.02em" }}>Multica</div>
          </div>
        </div>

        {/* multica column highlight */}
        <div
          style={{
            position: "absolute",
            left: mx,
            top: top - 14,
            width: MULTICA_W,
            height: (ROWS.length * ROW_H + 28) * colGrow,
            borderRadius: 24,
            background: "linear-gradient(180deg, rgba(76,141,246,0.16) 0%, rgba(76,141,246,0.06) 100%)",
            border: "1px solid rgba(140,196,255,0.35)",
            boxShadow: "0 0 80px rgba(76,141,246,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        />

        {ROWS.map(([label, cli, app, multica], i) => {
          const t = sp(f, fps, ROW_AT(i), { damping: 18, stiffness: 150 });
          const ta = sp(f, fps, ROW_AT(i) + 4, { damping: 18, stiffness: 150 });
          const tm = sp(f, fps, ROW_AT(i) + 8, { damping: 15, stiffness: 170 });
          return (
            <div key={label} style={{ position: "absolute", left, top: top + i * ROW_H, height: ROW_H, display: "flex", alignItems: "center", fontFamily: F.sans }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "rgba(255,255,255,0.08)", transform: `scaleX(${t})`, transformOrigin: "0 0" }} />
              <div style={{ width: LABEL_W, fontSize: 23, color: C.inkMute, letterSpacing: "0.12em", opacity: t, fontWeight: 500 }}>{label}</div>
              <div style={{ width: CLI_W, ...cell(t) }}>
                <Minus size={18} color="rgba(245,247,250,0.3)" />
                {cli}
              </div>
              <div style={{ width: APP_W, ...cell(ta) }}>
                <Minus size={18} color="rgba(245,247,250,0.3)" />
                {app}
              </div>
              <div style={{ width: MULTICA_W, display: "flex", alignItems: "center", gap: 16, paddingLeft: 32, fontSize: 29, color: C.ink, fontWeight: 600, opacity: Math.min(1, tm * 1.3), transform: `translateX(${(1 - tm) * 40}px)`, whiteSpace: "nowrap" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: `scale(${tm})`, boxShadow: "0 0 18px rgba(76,141,246,0.7)" }}>
                  <Check size={19} color="#fff" strokeWidth={3} />
                </div>
                {multica}
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left, top: top + ROWS.length * ROW_H + 34, fontFamily: F.sans, fontSize: 18, color: "rgba(245,247,250,0.42)", opacity: tw(f, 380, 30) }}>
          客户端能力依据 2026 年 10 月公开资料；Multica 驱动的正是这些智能体的 CLI。
        </div>
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <Grain opacity={0.06} />
      <Sfx at={4} name="whoosh_soft" vol={0.45} />
      {ROWS.map((_, i) => (
        <Sfx key={i} at={ROW_AT(i) + 8} name={`check_${i + 1}`} vol={0.55} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ orchestrate

const ENGINES = ["claude", "codex", "cursor", "kimi", "qwen", "copilot", "opencode", "grok"];

export const S6Orchestrate: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = SCENES.orchestrate.dur;
  const hub = sp(f, fps, 10, { damping: 12, stiffness: 140 });
  const out = tw(f, dur - 14, 14, 0, 1, ease.in);
  const rot = f * 0.35;
  const cx = 960;
  const cy = 560;
  const R = 440;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.03} glowA="#2f55d4" glowB="#7a3fd6" />
      <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${mix(1, 1.25, out)})` }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.42} fill="none" stroke="rgba(140,196,255,0.18)" strokeWidth={2} strokeDasharray="6 10" opacity={tw(f, 20, 30)} />
          {ENGINES.map((e, i) => {
            const a = ((i / ENGINES.length) * 360 + rot) * (Math.PI / 180);
            const x = cx + Math.cos(a) * R;
            const y = cy + Math.sin(a) * R * 0.42;
            const t = tw(f, 40 + i * 6, 24);
            const pulse = ((f - 60 - i * 7) % 50) / 50;
            return (
              <g key={e} opacity={t}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(140,196,255,0.35)" strokeWidth={1.5} />
                {f > 60 + i * 7 ? (
                  <circle cx={mix(cx, x, pulse)} cy={mix(cy, y, pulse)} r={4} fill="#cfe4ff" opacity={Math.sin(pulse * Math.PI)} />
                ) : null}
              </g>
            );
          })}
        </svg>
        {ENGINES.map((e, i) => {
          const a = ((i / ENGINES.length) * 360 + rot) * (Math.PI / 180);
          const depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
          const x = cx + Math.cos(a) * R;
          const y = cy + Math.sin(a) * R * 0.42;
          const t = sp(f, fps, 40 + i * 6, { damping: 12, stiffness: 170 });
          const size = mix(78, 138, depth);
          return (
            <div key={e} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, zIndex: Math.round(depth * 10), transform: `scale(${t})`, filter: `brightness(${mix(0.55, 1, depth)})` }}>
              <LogoTile provider={e} size={size} radius={size * 0.26} />
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: cx - 110,
            top: cy - 110,
            width: 220,
            height: 220,
            zIndex: 6,
            borderRadius: 46,
            background: "linear-gradient(160deg, #1c2536 0%, #0b0f17 100%)",
            border: "1px solid rgba(140,196,255,0.45)",
            boxShadow: `0 0 ${mix(40, 110, (Math.sin(f / 12) + 1) / 2)}px rgba(76,141,246,0.55)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${hub})`,
          }}
        >
          <MulticaMark size={112} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center" }}>
          <Kinetic
            text="不是替代，而是[编排]。"
            start={4}
            align="center"
            stagger={2.4}
            exit="none"
            style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 96, color: C.ink }}
            hlStyle={HL_STYLE}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 110,
            textAlign: "center",
            fontFamily: F.sans,
            fontSize: 30,
            lineHeight: 1.6,
            color: C.inkSoft,
            opacity: tw(f, 70, 24),
            transform: `translateY(${mix(20, 0, tw(f, 70, 30, 0, 1, ease.expoOut))}px)`,
          }}
        >
          Multica 不内置模型——它驱动你已经在用的 Claude Code、Codex，
          <br />
          让它们像一支团队那样接活、协作、交付。
        </div>
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Grain opacity={0.06} />
      <Sfx at={10} name="impact_soft" vol={0.6} />
      {ENGINES.map((_, i) => (
        <Sfx key={i} at={40 + i * 6} name="tick" vol={0.3} />
      ))}
    </AbsoluteFill>
  );
};
