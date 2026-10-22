import React from "react";
import { Globe, Monitor, Smartphone, Terminal } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { siDocker, siForgejo, siGitea, siGithub, siGitlab, siHelm, siKubernetes } from "simple-icons";
import { DingTalkMark } from "../brand/dingtalk-mark";
import { LarkMark } from "../brand/lark-mark";
import { SlackMark } from "../brand/slack-mark";
import { TelegramMark } from "../brand/telegram-mark";
import { WecomMark } from "../brand/wecom-mark";
import { Feature } from "../components/Feature";
import { Sfx } from "../components/Sfx";
import { sp, tw } from "../lib/anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

const Si: React.FC<{ icon: { path: string } }> = ({ icon }) => (
  <svg viewBox="0 0 24 24" className="fill" fill="currentColor">
    <path d={icon.path} />
  </svg>
);

type Chip = { label: string; icon: React.ReactNode };

const ROWS: Array<{ title: string; chips: Chip[] }> = [
  {
    title: "自托管",
    chips: [
      { label: "Docker Compose", icon: <Si icon={siDocker} /> },
      { label: "Kubernetes", icon: <Si icon={siKubernetes} /> },
      { label: "Helm", icon: <Si icon={siHelm} /> },
    ],
  },
  {
    title: "代码托管",
    chips: [
      { label: "GitHub", icon: <Si icon={siGithub} /> },
      { label: "GitLab", icon: <Si icon={siGitlab} /> },
      { label: "Gitea", icon: <Si icon={siGitea} /> },
      { label: "Forgejo", icon: <Si icon={siForgejo} /> },
    ],
  },
  {
    title: "聊天渠道",
    chips: [
      { label: "Slack", icon: <SlackMark className="fill" /> },
      { label: "飞书", icon: <LarkMark className="fill" /> },
      { label: "钉钉", icon: <DingTalkMark className="fill" /> },
      { label: "企业微信", icon: <WecomMark className="fill" /> },
      { label: "Telegram", icon: <TelegramMark className="fill" /> },
    ],
  },
  {
    title: "随处可用",
    chips: [
      { label: "Web", icon: <Globe className="fill" strokeWidth={1.6} /> },
      { label: "桌面端", icon: <Monitor className="fill" strokeWidth={1.6} /> },
      { label: "iPhone / iPad", icon: <Smartphone className="fill" strokeWidth={1.6} /> },
      { label: "CLI / API", icon: <Terminal className="fill" strokeWidth={1.6} /> },
    ],
  },
];

export const FeatOwnIt: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let n = 0;
  return (
    <Feature
      index={7}
      kicker="源码公开 · 可自托管"
      title={"整套，\n[都归你]。"}
      body="跑在你自己的基础设施上，接你的 Git 服务；在团队本来就在聊天的地方派活。你的机器、你的规矩。"
      dur={SCENES.ownit.dur}
      glowA="#2f55d4"
      glowB="#b5541f"
    >
      <div style={{ position: "absolute", left: 30, top: 40, display: "flex", flexDirection: "column", gap: 46 }}>
        {ROWS.map((row, ri) => (
          <div key={row.title}>
            <div style={{ fontFamily: F.sans, fontSize: 20, letterSpacing: "0.2em", color: C.inkMute, marginBottom: 16, opacity: tw(f, 8 + ri * 14, 14) }}>
              {row.title}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "nowrap" }}>
              {row.chips.map((chip) => {
                const i = n++;
                const t = sp(f, fps, 12 + i * 3.4, { damping: 13, stiffness: 190 });
                return (
                  <div
                    key={chip.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      height: 78,
                      padding: "0 28px 0 22px",
                      borderRadius: 20,
                      background: "linear-gradient(180deg, rgba(30,37,52,0.95), rgba(16,20,30,0.95))",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                      fontFamily: F.sans,
                      fontSize: 25,
                      fontWeight: 550,
                      color: C.ink,
                      transform: `translateY(${(1 - t) * 40}px) scale(${0.85 + 0.15 * t})`,
                      opacity: Math.min(1, t * 1.5),
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ width: 32, height: 32, color: "#e9eef7" }}>{chip.icon}</div>
                    {chip.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {ROWS.flatMap((r) => r.chips).filter((_, i) => i % 2 === 0).map((_, i) => (
        <Sfx key={i} at={12 + i * 6.8} name="tick" vol={0.3} />
      ))}
    </Feature>
  );
};
