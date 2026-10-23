import React from "react";
import { Plus } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { ProviderLogo } from "../brand/provider-logo";
import { F } from "../theme";
import { Spinner } from "./ui";

/**
 * A generic desktop agent client (session sidebar + conversation pane), drawn
 * neutrally rather than as any vendor's exact UI.
 */
export const ClientWindow: React.FC<{
  provider: string;
  title: string;
  sessions: string[];
  prompt: string;
  reply: string;
  width?: number;
  height?: number;
  clock?: number;
  style?: React.CSSProperties;
}> = ({ provider, title, sessions, prompt, reply, width = 720, height = 440, clock = 0, style }) => {
  const f = useCurrentFrame() - clock;
  const replyChars = Math.max(0, Math.floor((f - 24) * 1.2));
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#15171c",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
        fontFamily: F.sans,
        ...style,
      }}
    >
      <div style={{ height: 36, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#1b1e24", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.9 }} />
        ))}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginRight: 50, color: "rgba(255,255,255,0.7)", fontSize: 13.5, fontWeight: 600 }}>
          <div style={{ width: 16, height: 16, color: "#fff" }}>
            <ProviderLogo provider={provider} className="fill" />
          </div>
          {title}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: width * 0.32, background: "#121418", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 8 }}>
            <Plus size={14} /> 新会话
          </div>
          {sessions.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 30,
                padding: "0 10px",
                borderRadius: 7,
                background: i === 0 ? "rgba(255,255,255,0.08)" : "transparent",
                color: i === 0 ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {i < 2 ? <Spinner size={11} color="#f5c46b" /> : <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.3)", margin: "0 2px" }} />}
              {s}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <div style={{ alignSelf: "flex-end", maxWidth: "80%", padding: "9px 13px", borderRadius: 12, background: "rgba(255,255,255,0.09)", color: "#fff", fontSize: 14, lineHeight: 1.5 }}>
            {prompt}
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#111" }}>
              <div style={{ width: 14, height: 14 }}>
                <ProviderLogo provider={provider} className="fill" />
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.55 }}>{reply.slice(0, replyChars)}</div>
          </div>
          <div style={{ marginLeft: 31, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: F.mono, fontSize: 12.5, color: "rgba(255,255,255,0.7)", opacity: f > 60 ? 1 : 0 }}>
            retry.go
            <span style={{ color: "#7ee2a8" }}>+18</span>
            <span style={{ color: "#ff8f87" }}>−4</span>
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 14, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", padding: "0 12px", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            回复…
          </div>
        </div>
      </div>
    </div>
  );
};
