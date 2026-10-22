import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Feature } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { LogoTile } from "../components/ui";
import { ease, mix, sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

// The 27 CLIs the daemon detects (scripts/agent-cli-command-names.txt).
const PROVIDERS: Array<[string, string]> = [
  ["claude", "Claude Code"],
  ["codex", "Codex"],
  ["cursor", "Cursor"],
  ["copilot", "Copilot"],
  ["opencode", "OpenCode"],
  ["kimi", "Kimi"],
  ["qwen", "Qwen Code"],
  ["grok", "Grok"],
  ["antigravity", "Antigravity"],
  ["kiro", "Kiro"],
  ["codebuddy", "CodeBuddy"],
  ["traecli", "Trae CLI"],
  ["qoder", "Qoder"],
  ["qoderclicn", "Qoder CN"],
  ["dsh", "DeepSeek Harness"],
  ["mcode", "MiniMax Code"],
  ["hermes", "Hermes"],
  ["openclaw", "OpenClaw"],
  ["pi", "Pi"],
  ["omp", "Oh-My-Pi"],
  ["qwenpaw", "QwenPaw"],
  ["reasonix", "Reasonix"],
  ["deveco", "DevEco Code"],
  ["codearts", "CodeArts"],
  ["dim", "Dim"],
  ["muse", "Muse Code"],
  ["zeroclaw", "ZeroClaw"],
];

const COLS = 7;
const TILE = 92;
const GAP_X = 42;
const GAP_Y = 30;

export const FeatProviders: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(mix(0, 27, tw(f, 14, 90, 0, 1, ease.outSoft)));
  // A selection ring hops across the first row: "switching is a dropdown".
  const hop = Math.floor(Math.max(0, f - 120) / 22) % 4;
  const hopOn = f >= 120 && f < 222;
  return (
    <Feature
      index={1}
      kicker="27 款 AGENT CLI"
      title={"不用挑一个，\n[全都招进来]。"}
      body="Claude Code、Codex、Cursor、Kimi、Qwen……Multica 驱动你已经装好的 CLI，换提供方只是一个下拉框。"
      dur={SCENES.providers.dur}
      glowA="#2f55d4"
      glowB="#7a3fd6"
    >
      <div
        style={{
          position: "absolute",
          right: 10,
          top: -30,
          fontFamily: F.display,
          fontSize: 420,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "2px rgba(140,196,255,0.22)",
          opacity: tw(f, 6, 30),
        }}
      >
        {count}
      </div>
      <div style={{ position: "absolute", left: 30, top: 150, perspective: 1600 }}>
        <div style={{ transform: `rotateY(${mix(-24, -12, tw(f, 0, 240, 0, 1, ease.inOut))}deg) rotateX(6deg)`, transformStyle: "preserve-3d" }}>
          {PROVIDERS.map(([p, name], i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const d = col * 3 + row * 5;
            const t = sp(f, fps, 10 + d, { damping: 13, stiffness: 160 });
            const selected = hopOn && row === 0 && col === hop;
            return (
              <div
                key={p}
                style={{
                  position: "absolute",
                  left: col * (TILE + GAP_X),
                  top: row * (TILE + GAP_Y + 28),
                  width: TILE,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  transform: `translateZ(${(1 - t) * -400}px) translateY(${(1 - t) * 40}px) scale(${selected ? 1.12 : 1})`,
                  opacity: Math.min(1, t * 1.5),
                }}
              >
                <LogoTile
                  provider={p}
                  size={TILE}
                  radius={24}
                  style={{
                    boxShadow: selected
                      ? `0 0 0 4px ${C.brand}, 0 0 50px rgba(76,141,246,0.75)`
                      : "0 1px 0 rgba(255,255,255,0.6) inset, 0 14px 34px rgba(0,0,0,0.45)",
                  }}
                />
                <div style={{ fontFamily: F.sans, fontSize: 15, color: selected ? C.ink : C.inkMute, whiteSpace: "nowrap", fontWeight: 500 }}>
                  {name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Sfx at={10} name="cascade" vol={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={120 + i * 22} name="tick" vol={0.45} />
      ))}
    </Feature>
  );
};
