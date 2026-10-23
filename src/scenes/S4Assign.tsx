import React from "react";
import { Check, GitPullRequest, Search } from "lucide-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { GitHubMark } from "../brand/github-mark";
import { Backdrop, Grain, Vignette } from "../components/Atmos";
import { Board, Placed, layout } from "../components/Board";
import { Stage3D, focusCam, lerpCam } from "../components/Cam";
import { HL_STYLE, LowerCaption } from "../components/Caption";
import { Pointer, cursorAt } from "../components/Cursor";
import { Kinetic } from "../components/Kinetic";
import { Sfx } from "../components/Sfx";
import {
  AGENTS,
  AppWindow,
  Avatar,
  CardData,
  HUMANS,
  STATUS_META,
  Spinner,
  Status,
  StatusIcon,
  Who,
} from "../components/ui";
import { BOARD_CARDS, COLUMNS, HERO_ID, WORKING_AVATARS } from "../data";
import { ease, mix, sp, tw } from "../lib/anim";
import { C, F } from "../theme";
import { ASSIGN_CAM, toWin } from "./shared";
import { SCENES } from "../timeline";
import { vo, voWindow } from "../vo";

const U = C.ui;

const withHeroAt = (status: Status): CardData[] => {
  const hero = { ...BOARD_CARDS.find((c) => c.id === HERO_ID)!, status };
  const rest = BOARD_CARDS.filter((c) => c.id !== HERO_ID);
  const i = rest.findIndex((c) => c.status === status);
  return [...rest.slice(0, i), hero, ...rest.slice(i)];
};

const S0 = layout(COLUMNS, BOARD_CARDS);
const S1 = layout(COLUMNS, withHeroAt("in_progress"));
const S2 = layout(COLUMNS, withHeroAt("in_review"));
const S3 = layout(COLUMNS, withHeroAt("done"));

const MOVES = [
  { from: S0, to: S1, at: 124, dur: 46 },
  { from: S1, to: S2, at: 332, dur: 40 },
  { from: S2, to: S3, at: 404, dur: 40 },
];

// --------------------------------------------------------------- dropdown

const ROW_H = 36;
const DD_X = 560;
const DD_Y = 252;

const DropRow: React.FC<{ who: Who; hover: number; meta?: string; selected?: boolean }> = ({ who, hover, meta, selected }) => (
  <div
    style={{
      height: ROW_H,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 10px",
      margin: "0 6px",
      borderRadius: 7,
      background: `rgba(228,228,231,${hover})`,
      fontSize: 14.5,
      color: U.text,
    }}
  >
    <Avatar who={who} size={22} />
    <span style={{ flex: 1, fontWeight: 500 }}>{who.name}</span>
    {meta ? <span style={{ fontSize: 12.5, color: U.textFaint }}>{meta}</span> : null}
    {selected ? <Check size={15} color={U.text} /> : null}
  </div>
);

const Dropdown: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const open = sp(f, fps, 42, { damping: 16, stiffness: 260 });
  const close = tw(f, 94, 8, 0, 1, ease.in);
  if (f < 42 || close >= 1) return null;
  const hoverCodex = tw(f, 76, 8);
  const hoverClaude = Math.min(tw(f, 66, 6), 1 - tw(f, 76, 6));
  const label = (t: string) => (
    <div style={{ fontSize: 12, color: U.textFaint, padding: "8px 16px 4px", fontWeight: 500 }}>{t}</div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: DD_X,
        top: DD_Y,
        width: 300,
        transformOrigin: "20px 0",
        transform: `translateY(${(1 - open) * -8}px) scale(${mix(0.94, 1, open)})`,
        opacity: Math.min(1, open * 1.5) * (1 - close),
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${U.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08)",
        padding: "6px 0 8px",
        fontFamily: F.sans,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 16px", borderBottom: `1px solid ${U.border}`, color: U.textFaint, fontSize: 14.5, marginBottom: 4 }}>
        <Search size={15} />
        分配给…
      </div>
      {label("成员")}
      <DropRow who={HUMANS.lin} hover={0} />
      <DropRow who={HUMANS.wang} hover={0} />
      <DropRow who={HUMANS.su} hover={0} />
      {label("智能体")}
      <DropRow who={AGENTS.claude} hover={hoverClaude} meta="MacBook Pro" />
      <DropRow who={AGENTS.codex} hover={hoverCodex} meta="dev-server-01" selected={f >= 90} />
      <DropRow who={AGENTS.cursor} hover={0} meta="MacBook Pro" />
      <DropRow who={AGENTS.kimi} hover={0} meta="cloud-box" />
    </div>
  );
};

// codex row centre, in window coordinates
const CODEX_ROW = { x: DD_X + 90, y: DD_Y + 6 + 39 + 28 + ROW_H * 3 + 28 + ROW_H + ROW_H / 2 };

// --------------------------------------------------------------- detail panel

const StatusChip: React.FC<{ status: Status; pulse?: number }> = ({ status, pulse = 0 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 34,
      padding: "0 13px",
      borderRadius: 9,
      background: STATUS_META[status].tint,
      border: `1px solid ${U.border}`,
      fontSize: 17,
      fontWeight: 550,
      color: U.text,
      boxShadow: pulse > 0 ? `0 0 0 ${4 * pulse}px ${STATUS_META[status].color}33` : undefined,
    }}
  >
    <StatusIcon status={status} size={15} />
    {STATUS_META[status].label}
  </div>
);

const Entry: React.FC<{ at: number; f: number; fps: number; children: React.ReactNode }> = ({ at, f, fps, children }) => {
  if (f < at) return null;
  const t = sp(f, fps, at, { damping: 18, stiffness: 160 });
  return (
    <div style={{ transform: `translateY(${(1 - t) * 24}px)`, opacity: Math.min(1, t * 1.3), marginBottom: 18 }}>{children}</div>
  );
};

const SystemLine: React.FC<{ who: Who; children: React.ReactNode; time: string }> = ({ who, children, time }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, color: U.textMute, paddingLeft: 6 }}>
    <Avatar who={who} size={26} />
    <span>
      <b style={{ color: U.text, fontWeight: 600 }}>{who.name}</b> {children}
    </span>
    <span style={{ color: U.textFaint }}>· {time}</span>
  </div>
);

const Comment: React.FC<{ who: Who; time: string; text: string; typing?: number }> = ({ who, time, text, typing = 1 }) => (
  <div style={{ display: "flex", gap: 12 }}>
    <Avatar who={who} size={40} />
    <div style={{ flex: 1, border: `1px solid ${U.border}`, borderRadius: 14, padding: "13px 18px", background: "#fff" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 17 }}>
        <b style={{ fontWeight: 650, color: U.text }}>{who.name}</b>
        {who.kind === "agent" ? (
          <span style={{ fontSize: 13, padding: "1px 7px", borderRadius: 5, background: "#eef4ff", color: "#2556c4", fontWeight: 600 }}>智能体</span>
        ) : null}
        <span style={{ color: U.textFaint, fontSize: 15 }}>{time}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 20, lineHeight: 1.5, color: "#27272a" }}>
        {text.slice(0, Math.ceil(text.length * typing))}
      </div>
    </div>
  </div>
);

const DetailPanel: React.FC<{ f: number; fps: number; status: Status; statusPulse: number }> = ({ f, fps, status, statusPulse }) => {
  const slide = sp(f, fps, 176, { damping: 20, stiffness: 120 });
  const typing = (at: number, len: number) => tw(f, at + 4, len, 0, 1, (t) => t);
  return (
    <div
      style={{
        position: "absolute",
        left: 1004,
        top: 80,
        width: 860,
        height: 830,
        transform: `translateX(${(1 - slide) * 980}px)`,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 50px 120px rgba(0,0,0,0.6)",
        fontFamily: F.sans,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "26px 34px 18px", borderBottom: `1px solid ${U.border}` }}>
        <div style={{ fontSize: 17, color: U.textMute, fontWeight: 500 }}>Nebula Labs › {HERO_ID}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: U.text, marginTop: 8, letterSpacing: "-0.01em" }}>为 webhook 投递加入指数退避重试</div>
        <div style={{ display: "flex", gap: 30, marginTop: 20, alignItems: "center", fontSize: 17, color: U.textMute }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            状态 <StatusChip status={status} pulse={statusPulse} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            负责人 <Avatar who={AGENTS.codex} size={26} />
            <span style={{ color: U.text, fontWeight: 550 }}>Codex</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            运行时 <span style={{ color: U.text, fontWeight: 550 }}>dev-server-01</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "22px 34px", position: "relative" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: U.textMute, marginBottom: 18 }}>动态</div>
        <Entry at={196} f={f} fps={fps}>
          <SystemLine who={AGENTS.codex} time="刚刚">
            接手了任务 {f < 330 ? <span style={{ display: "inline-block", verticalAlign: "-1px", marginLeft: 4 }}><Spinner size={13} /></span> : null}
          </SystemLine>
        </Entry>
        <Entry at={220} f={f} fps={fps}>
          <Comment who={AGENTS.codex} time="1 分钟前" text="已复现：投递失败后立即重试，撞上了下游限流。" typing={typing(220, 24)} />
        </Entry>
        <Entry at={254} f={f} fps={fps}>
          <Comment who={AGENTS.codex} time="刚刚" text="方案：指数退避 + 随机抖动，最多重试 5 次；补齐了单元测试。" typing={typing(254, 28)} />
        </Entry>
        <Entry at={292} f={f} fps={fps}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: 52, border: `1px solid ${U.border}`, borderRadius: 14, padding: "15px 18px", background: "#fafafa" }}>
            <div style={{ width: 22, height: 22, color: "#111" }}>
              <GitHubMark className="fill" />
            </div>
            <GitPullRequest size={17} color="#2f9e5b" />
            <div style={{ flex: 1, fontSize: 18, color: U.text, fontWeight: 550 }}>
              #128 feat(webhook): exponential backoff
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 17, color: "#2f9e5b" }}>+86</span>
            <span style={{ fontFamily: F.mono, fontSize: 17, color: "#e5484d" }}>−12</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16, color: "#2f9e5b", fontWeight: 600 }}>
              <Check size={15} /> 检查通过
            </span>
          </div>
        </Entry>
        <Entry at={332} f={f} fps={fps}>
          <SystemLine who={AGENTS.codex} time="刚刚">
            将状态改为 <StatusChip status="in_review" />
          </SystemLine>
        </Entry>
        <Entry at={364} f={f} fps={fps}>
          <Comment who={HUMANS.lin} time="刚刚" text="看过了，逻辑清楚。LGTM，合并吧。" typing={typing(364, 18)} />
        </Entry>
        <Entry at={404} f={f} fps={fps}>
          <SystemLine who={HUMANS.lin} time="刚刚">
            将状态改为 <StatusChip status="done" />
          </SystemLine>
        </Entry>
      </div>
    </div>
  );
};

// --------------------------------------------------------------- scene

export const S4Assign: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // board state
  const placed: Record<string, Placed> = {};
  for (const id of Object.keys(S0)) {
    let p = S0[id];
    for (const m of MOVES) {
      const t = tw(f, m.at, m.dur, 0, 1, ease.inOut);
      if (t <= 0) break;
      const a = m.from[id];
      const b = m.to[id];
      const lift = id === HERO_ID ? Math.sin(t * Math.PI) : 0;
      p = {
        ...b,
        x: mix(a.x, b.x, t),
        y: mix(a.y, b.y, t) - lift * 46,
        scale: 1 + lift * 0.06,
        rot: lift * -2.5,
        z: id === HERO_ID ? 10 : 0,
      };
    }
    placed[id] = p;
  }
  const hero = placed[HERO_ID];
  const assigned = f >= 94;
  const status: Status = f >= 404 ? "done" : f >= 332 ? "in_review" : "in_progress";
  placed[HERO_ID] = {
    ...hero,
    who: assigned ? AGENTS.codex : undefined,
    working: f >= 108 && f < 332,
    updated: "刚刚",
    glow: Math.max(tw(f, 94, 10) * (1 - tw(f, 170, 40)), 0),
    workingLabel: "工作中",
  };

  // camera: hold the assign framing, then slide the board left for the panel
  const panel = tw(f, 172, 60, 0, 1, ease.inOut);
  const cam = lerpCam(ASSIGN_CAM, focusCam(1010, 360, 1.12, undefined, 500, 470), panel);

  const heroWin = toWin(S0[HERO_ID].x, S0[HERO_ID].y);
  const assigneeSpot = { x: heroWin.x + 22, y: heroWin.y + 97 - 22 };
  const cur = cursorAt(f, [
    { f: 0, x: 980, y: 700 },
    { f: 36, x: assigneeSpot.x, y: assigneeSpot.y },
    { f: 52, x: assigneeSpot.x + 4, y: assigneeSpot.y + 6 },
    { f: 84, x: CODEX_ROW.x, y: CODEX_ROW.y },
    { f: 100, x: CODEX_ROW.x + 10, y: CODEX_ROW.y + 4 },
    { f: 140, x: 820, y: 620 },
  ]);
  const curO = 1 - tw(f, 130, 20);

  const statusPulse = Math.max(
    tw(f, 332, 8) * (1 - tw(f, 344, 20)),
    tw(f, 404, 8) * (1 - tw(f, 416, 24)),
  );

  const exit = tw(f, 462, 18, 0, 1, ease.in);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bg }}>
      <AbsoluteFill style={{ opacity: 1 - exit, transform: `scale(${mix(1, 0.96, exit)})`, filter: exit > 0 ? `blur(${exit * 12}px)` : undefined }}>
      <Backdrop grid={0.04} />
      <Stage3D cam={cam} filter={panel > 0.01 ? `brightness(${mix(1, 0.55, panel)}) blur(${panel * 2.5}px)` : undefined}>
        <AppWindow>
          <Board
            columns={COLUMNS}
            cards={Object.values(placed)}
            working={[AGENTS.codex, ...WORKING_AVATARS]}
            workingCount={f >= 108 ? 6 : 5}
            columnGlow={{ in_progress: tw(f, 150, 12) * (1 - tw(f, 176, 30)) }}
          />
        </AppWindow>
        <Dropdown f={f} fps={fps} />
        <Pointer x={cur.x} y={cur.y} f={f} clicks={[40, 90]} opacity={curO} size={22} />
      </Stage3D>

      <DetailPanel f={f} fps={fps} status={status} statusPulse={statusPulse} />

      <LowerCaption text={vo("a1").caption} start={voWindow("a1", SCENES.assign.from).start} end={176} size={56} variant="plate" position="top" y={44} />
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <AbsoluteFill
          style={{
            background: "linear-gradient(90deg, rgba(3,5,9,0.85) 0%, rgba(3,5,9,0.55) 38%, transparent 55%)",
            opacity: tw(f, 190, 30) * (1 - tw(f, 464, 16)),
          }}
        />
        <div style={{ position: "absolute", left: 96, bottom: 110 }}>
          <Kinetic
            text={vo("a2").caption}
            start={voWindow("a2", SCENES.assign.from).start}
            end={476}
            stagger={1.8}
            lineGap={0.2}
            style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 60, color: C.ink, lineHeight: 1.2, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}
            hlStyle={HL_STYLE}
          />
        </div>
      </AbsoluteFill>

      <Vignette strength={0.5} />
      </AbsoluteFill>
      <Grain opacity={0.06} />

      <Sfx at={8} name="mouse_move" vol={0.25} />
      <Sfx at={40} name="click" vol={0.8} />
      <Sfx at={44} name="pop_soft" vol={0.45} />
      <Sfx at={90} name="click" vol={0.8} />
      <Sfx at={94} name="select" vol={0.6} />
      <Sfx at={124} name="swoosh" vol={0.6} />
      <Sfx at={168} name="land" vol={0.55} />
      <Sfx at={176} name="whoosh_soft" vol={0.5} />
      {[196, 220, 254, 292, 364].map((a) => (
        <Sfx key={a} at={a} name="blip" vol={0.45} />
      ))}
      <Sfx at={332} name="ding" vol={0.55} />
      <Sfx at={404} name="success" vol={0.8} />
    </AbsoluteFill>
  );
};
