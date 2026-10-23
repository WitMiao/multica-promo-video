import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Grain, Vignette } from "../components/Atmos";
import { ClientWindow } from "../components/ClientWindow";
import { LowerCaption } from "../components/Caption";
import { Sfx } from "../components/Sfx";
import { TermLine, Terminal } from "../components/Terminal";
import { LogoTile } from "../components/ui";
import { ease, mix, rnd, shake, sp, tw } from "../lib/anim";
import { C, F } from "../theme";

type Win = {
  key: string;
  title: string;
  x: number;
  y: number;
  at: number;
  w?: number;
  h?: number;
  rot?: number;
  close?: number;
  accent?: string;
  lines: TermLine[];
  // Desktop-client windows (session sidebar + chat) instead of a terminal.
  client?: { provider: string; title: string; sessions: string[]; prompt: string; reply: string };
};

const L = (text: string, at: number, cps = Infinity, extra: Partial<TermLine> = {}): TermLine => ({
  text,
  at,
  cps,
  ...extra,
});

const ORANGE = "#e58a66";
const DIM = "rgba(215,220,229,0.45)";
const GREEN = "#7ee2a8";
const BLUE = "#8ab4ff";

const CONTEXT: TermLine[] = [
  L("> 先交代一下背景：后端是 Go + PostgreSQL，", 0, 1.1),
  L("  迁移放在 server/migrations，", 44, 1.1),
  L("  提交前要先跑 make check……", 76, 1.1),
];

const RING1: Win[] = [
  {
    key: "codex",
    title: "codex — ~/nebula/web",
    x: -660,
    y: -300,
    at: 112,
    close: 372,
    accent: "#9aa4b8",
    lines: [
      L("$ codex", 0, 0.6),
      L(">_ OpenAI Codex", 14, Infinity, { bold: true }),
      L("› 给 /v1/issues 接口加上限流", 22, 0.9),
      L("• Running rg \"RateLimit\" server/", 52, Infinity, { color: DIM }),
      L("• Editing middleware/limit.go", 64, Infinity, { color: DIM }),
    ],
  },
  {
    key: "cursor",
    title: "cursor-agent — ~/nebula/desktop",
    x: 650,
    y: -290,
    at: 138,
    close: 398,
    lines: [
      L("$ cursor-agent", 0, 0.7),
      L("Cursor Agent · auto", 14, Infinity, { bold: true }),
      L("→ 重构桌面端的认证中间件", 24, 0.9),
      L("  Reading src/main/auth.ts", 54, Infinity, { color: DIM }),
    ],
  },
  {
    key: "kimi",
    title: "kimi — ~/nebula/docs",
    x: -650,
    y: 300,
    at: 164,
    close: 386,
    lines: [
      L("$ kimi", 0, 0.6),
      L("Kimi Code CLI", 12, Infinity, { bold: true }),
      L("> 把新手引导翻译成英文", 22, 0.9),
      L("  读取 docs/onboarding.zh.md …", 50, Infinity, { color: DIM }),
    ],
  },
  {
    key: "opencode",
    title: "opencode — ~/nebula/server",
    x: 660,
    y: 310,
    at: 190,
    close: 410,
    lines: [
      L("$ opencode", 0, 0.6),
      L("opencode · build", 12, Infinity, { bold: true }),
      L("> 排查 CI 偶发失败", 22, 0.9),
      L("  ▸ bash pnpm test --filter core", 46, Infinity, { color: DIM }),
    ],
  },
];

const RING2: Win[] = [
  { key: "copilot", title: "copilot — ~/nebula/mobile", x: 0, y: -660, at: 252, close: 404, lines: [L("$ copilot", 0, 0.6), L("GitHub Copilot CLI", 12, Infinity, { bold: true }), L("> 补齐移动端单元测试", 20, 0.9)] },
  { key: "qwen", title: "qwen — ~/nebula/infra", x: 20, y: 680, at: 266, close: 392, lines: [L("$ qwen", 0, 0.6), L("Qwen Code", 12, Infinity, { bold: true }), L("> 生成 OpenAPI 文档", 20, 0.9)] },
  {
    key: "claude2",
    title: "Claude",
    x: -1340,
    y: -40,
    at: 280,
    close: 380,
    w: 600,
    h: 360,
    lines: [],
    client: { provider: "claude", title: "Claude", sessions: ["修复移动端上传卡住", "梳理会话恢复协议", "写周报"], prompt: "移动端上传为什么卡住？", reply: "我先看下上传队列的重试逻辑……" },
  },
  {
    key: "codex2",
    title: "Codex",
    x: 1340,
    y: 20,
    at: 294,
    close: 416,
    w: 600,
    h: 360,
    lines: [],
    client: { provider: "codex", title: "Codex", sessions: ["继续昨天的重构", "给 API 加限流", "升级依赖"], prompt: "继续昨天的重构", reply: "昨天的上下文我这里没有，能再说一下吗？" },
  },
];

// The four sessions that get re-briefed with the same context in phase E.
const REBRIEF: Win[] = [
  { key: "r1", title: "codex — 新会话", x: -660, y: -300, at: 486, accent: "#9aa4b8", lines: CONTEXT },
  { key: "r2", title: "cursor-agent — 新会话", x: 650, y: -290, at: 500, lines: CONTEXT },
  { key: "r3", title: "kimi — 新会话", x: -650, y: 300, at: 514, lines: CONTEXT },
];

const CHAOS_TITLES = ["claude", "codex", "cursor-agent", "kimi", "opencode", "copilot", "qwen", "gemini-cli"];
const CHAOS_TASKS = [
  "> 这个仓库用什么包管理器？",
  "> 再说一遍：别动 main 分支",
  "> 上次改到哪儿了？",
  "> 需要你确认：rm -rf dist/",
  "> 上下文已满，请新开会话",
  "> 测试又挂了，帮我看看",
  "> 迁移文件在哪个目录？",
  "> 等待输入……",
];
const CHAOS: Win[] = Array.from({ length: 22 }, (_, i) => ({
  key: `c${i}`,
  title: `${CHAOS_TITLES[i % CHAOS_TITLES.length]} — ~/nebula/${["api", "web", "docs", "infra", "mobile"][i % 5]}`,
  x: rnd(`cx${i}`, -1900, 1900),
  y: rnd(`cy${i}`, -1050, 1050),
  rot: rnd(`cr${i}`, -5, 5),
  at: 600 + i * 4,
  w: 520,
  h: 300,
  lines: [L(`$ ${CHAOS_TITLES[i % CHAOS_TITLES.length]}`, 0, Infinity), L(CHAOS_TASKS[i % CHAOS_TASKS.length], 4, 1.6)],
}));

const HERO_LINES: TermLine[] = [
  L("$ claude", 10, 0.42),
  L("╭───────────────────────────────╮", 34, Infinity, { color: ORANGE }),
  L("│ ✻ Welcome to Claude Code!     │", 34, Infinity, { color: ORANGE }),
  L("╰───────────────────────────────╯", 34, Infinity, { color: ORANGE }),
  L("> 修复 webhook 投递失败后疯狂重试的问题", 52, 0.62),
  L("⏺ Read(server/internal/webhook/retry.go)", 106, Infinity, { color: BLUE }),
  L("⏺ 我先看看现有的重试实现……", 118, 0.8),
  L("⏺ Bash(go test ./internal/webhook/...)", 170, Infinity, { color: BLUE }),
  L("  ✓ ok   internal/webhook  0.41s", 196, Infinity, { color: GREEN }),
];

const RED_HL: React.CSSProperties = {
  backgroundImage: "linear-gradient(100deg, #ffd0c8 0%, #ff6b5e 60%, #ef5350 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const NOTES = [
  { p: "claude", app: "Claude Code", body: "需要你的批准：运行 make migrate？", at: 614 },
  { p: "codex", app: "Codex", body: "等待输入……", at: 630 },
  { p: "cursor", app: "Cursor Agent", body: "上下文已满，请开启新会话", at: 646 },
  { p: "kimi", app: "Kimi Code", body: "任务失败：找不到 .env", at: 660 },
  { p: "opencode", app: "OpenCode", body: "需要确认：覆盖 3 个文件？", at: 674 },
];

const WinView: React.FC<{ win: Win; f: number; fps: number; z: number }> = ({ win, f, fps, z }) => {
  if (f < win.at) return null;
  const w = win.w ?? 560;
  const h = win.h ?? 330;
  const pop = sp(f, fps, win.at, { damping: 14, stiffness: 170 });
  let sx = mix(0.7, 1, pop);
  let sy = sx;
  let o = Math.min(1, (f - win.at) / 6);
  let bright = 1;
  if (win.close !== undefined && f >= win.close) {
    const a = tw(f, win.close, 7, 0, 1, ease.in);
    const b = tw(f, win.close + 7, 8, 0, 1, ease.in);
    sy *= mix(1, 0.012, a);
    sx *= mix(1, 0, b);
    bright = 1 + a * 2.5;
    o *= 1 - b;
    if (o <= 0.001) return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: win.x - w / 2,
        top: win.y - h / 2,
        zIndex: z,
        opacity: o,
        transform: `rotate(${win.rot ?? 0}deg) scale(${sx}, ${sy})`,
        filter: bright > 1.01 ? `brightness(${bright})` : undefined,
      }}
    >
      {win.client ? (
        <ClientWindow {...win.client} clock={win.at} width={w} height={h} />
      ) : (
        <Terminal title={win.title} lines={win.lines} clock={win.at} width={w} height={h} accent={win.accent} />
      )}
    </div>
  );
};

export const S1Problem: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera: pull back as the windows multiply, then lurch during the chaos.
  const s =
    f < 120
      ? mix(1.22, 1.0, tw(f, 0, 120, 0, 1, ease.outSoft))
      : f < 360
        ? mix(1.0, 0.6, tw(f, 120, 240, 0, 1, ease.inOut))
        : f < 480
          ? mix(0.6, 0.92, tw(f, 360, 110, 0, 1, ease.inOut))
          : f < 600
            ? mix(0.92, 0.62, tw(f, 480, 110, 0, 1, ease.inOut))
            : mix(0.62, 0.4, tw(f, 600, 100, 0, 1, ease.in));
  const amp = tw(f, 630, 70, 0, 16, ease.in);
  const sh = shake(f, amp, "p");
  const chaosRed = tw(f, 610, 90, 0, 1, ease.in);
  const blackout = f >= 700 ? 1 : 0;

  const heroWipe = tw(f, 372, 22, 0, 1, ease.in);
  const heroFresh = f >= 430;
  const stamp = sp(f, fps, 548, { damping: 11, stiffness: 260 });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <Backdrop grid={0.035} glowA="#3346a8" glowB="#4a2a7a" />
      <AbsoluteFill
        style={{
          transform: `translate(${960 + sh.x}px, ${540 + sh.y}px) scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        {[...RING1, ...RING2].map((w, i) => (
          <WinView key={w.key} win={w} f={f} fps={fps} z={i + 1} />
        ))}
        {REBRIEF.map((w, i) => (
          <WinView key={w.key} win={w} f={f} fps={fps} z={20 + i} />
        ))}
        {/* hero session, centre */}
        <div
          style={{
            position: "absolute",
            left: -330,
            top: -200,
            zIndex: 30,
            transform: `scale(${mix(0.92, 1, sp(f, fps, 0, { damping: 20 }))})`,
          }}
        >
          <Terminal
            title={heroFresh ? "claude — 新会话 · 上下文 0%" : "claude — ~/nebula/api"}
            lines={heroFresh ? CONTEXT : HERO_LINES}
            clock={heroFresh ? 482 : 0}
            width={660}
            height={400}
            wipe={heroFresh ? 0 : heroWipe}
            accent={ORANGE}
            fontSize={16}
            style={{ boxShadow: "0 0 0 1px rgba(229,138,102,0.35), 0 40px 90px rgba(0,0,0,0.6), 0 0 80px rgba(217,119,87,0.18)" }}
          >
            {f >= 390 && f < 482 ? (
              <div
                style={{
                  position: "absolute",
                  inset: "34px 0 0 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: F.mono,
                  color: "rgba(255,255,255,0.55)",
                  opacity: tw(f, 392, 14),
                }}
              >
                <div style={{ fontSize: 20 }}>[ 会话已结束 ]</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.35)" }}>上下文：0 / 200k tokens</div>
              </div>
            ) : null}
          </Terminal>
          {f >= 548 ? (
            <div
              style={{
                position: "absolute",
                right: -70,
                top: -58,
                transform: `rotate(-9deg) scale(${mix(2.4, 1, stamp)})`,
                opacity: Math.min(1, (f - 548) / 4),
                padding: "10px 22px",
                border: `4px solid ${C.red}`,
                borderRadius: 12,
                color: C.red,
                fontFamily: F.serif,
                fontWeight: 900,
                fontSize: 46,
                background: "rgba(20,6,8,0.75)",
                boxShadow: `0 0 40px rgba(239,83,80,0.35)`,
              }}
            >
              第 4 遍
            </div>
          ) : null}
        </div>
        {CHAOS.map((w, i) => (
          <WinView key={w.key} win={w} f={f} fps={fps} z={40 + i} />
        ))}
      </AbsoluteFill>

      {/* notifications pile up in screen space */}
      <div style={{ position: "absolute", right: 36, top: 36, width: 440, display: "flex", flexDirection: "column", gap: 12, zIndex: 100 }}>
        {NOTES.filter((n) => f >= n.at).map((n) => {
          const t = sp(f, fps, n.at, { damping: 16, stiffness: 200 });
          return (
            <div
              key={n.at}
              style={{
                transform: `translateX(${(1 - t) * 480}px)`,
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 18,
                background: "rgba(36,40,48,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                fontFamily: F.sans,
              }}
            >
              <LogoTile provider={n.p} size={42} radius={10} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 650, fontSize: 16 }}>{n.app}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, marginTop: 2 }}>{n.body}</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>现在</div>
            </div>
          );
        })}
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(160,20,30,${0.55 * chaosRed}) 100%)`,
          pointerEvents: "none",
        }}
      />
      <Vignette strength={0.8} />

      <LowerCaption text="你已经在用 Claude Code、Codex……" start={22} end={230} />
      <LowerCaption text="每一个，都关在自己的窗口里。" start={240} end={352} />
      <LowerCaption text="会话一关，什么都不记得。" start={362} end={472} />
      <LowerCaption text="同一段上下文，今天已经讲到[第 4 遍]。" start={482} end={594} />
      <LowerCaption text="智能体越加越多，[你越忙]。" start={604} end={706} size={72} hl={RED_HL} />

      <Grain opacity={0.08} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackout }} />

      {/* sound — everything stops dead on the smash cut at frame 700 */}
      <Sequence durationInFrames={700} layout="none">
      <Sfx at={10} name="type_short" vol={0.5} />
      <Sfx at={52} name="type_long" vol={0.45} />
      {[...RING1, ...RING2].map((w) => (
        <Sfx key={`p${w.key}`} at={w.at} name="pop" vol={0.5} />
      ))}
      {[...RING1, ...RING2].map((w) => (w.close ? <Sfx key={`c${w.key}`} at={w.close} name="crt_off" vol={0.4} /> : null))}
      <Sfx at={372} name="wipe" vol={0.6} />
      {REBRIEF.map((w) => (
        <Sfx key={`r${w.key}`} at={w.at} name="pop" vol={0.45} />
      ))}
      <Sfx at={482} name="type_long" vol={0.4} />
      <Sfx at={548} name="stamp" vol={0.45} />
      {CHAOS.filter((_, i) => i % 2 === 0).map((w) => (
        <Sfx key={`x${w.key}`} at={w.at} name="pop" vol={0.3} />
      ))}
      {NOTES.map((n) => (
        <Sfx key={`n${n.at}`} at={n.at} name="notify" vol={0.3} />
      ))}
      </Sequence>
    </AbsoluteFill>
  );
};
