import React from "react";
import { useCurrentFrame } from "remotion";
import { F } from "../theme";

export type TermLine = {
  text: string;
  at: number; // frame (relative to the terminal's own clock) the line starts typing
  cps?: number; // characters per frame; Infinity prints at once
  color?: string;
  dim?: boolean;
  bold?: boolean;
};

export const Terminal: React.FC<{
  title: string;
  lines: TermLine[];
  width?: number;
  height?: number;
  clock?: number; // frame offset subtracted from the current frame
  wipe?: number; // 0..1, fades existing content out (session ended)
  accent?: string;
  cursor?: boolean;
  fontSize?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  title,
  lines,
  width = 560,
  height = 340,
  clock = 0,
  wipe = 0,
  accent = "#8b93a7",
  cursor = true,
  fontSize = 15,
  style,
  children,
}) => {
  const f = useCurrentFrame() - clock;
  let lastVisible = -1;
  const rendered = lines.map((l, i) => {
    const n = l.cps === Infinity ? l.text.length : Math.floor((f - l.at) * (l.cps ?? 1.6));
    if (f < l.at) return null;
    lastVisible = i;
    return { ...l, shown: l.text.slice(0, Math.max(0, n)), done: n >= l.text.length };
  });
  const blink = Math.floor(f / 16) % 2 === 0;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 12,
        background: "linear-gradient(180deg, #11151d 0%, #0b0e14 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          height: 34,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.9 }} />
        ))}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: F.mono,
            fontSize: 12.5,
            color: "rgba(255,255,255,0.55)",
            marginRight: 50,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: "14px 18px",
          fontFamily: F.mono,
          fontSize,
          lineHeight: 1.62,
          color: "#d7dce5",
          opacity: 1 - wipe,
          filter: wipe > 0 ? `blur(${wipe * 6}px)` : undefined,
          overflow: "hidden",
        }}
      >
        {rendered.map((r, i) =>
          r ? (
            <div
              key={i}
              style={{
                whiteSpace: "pre",
                color: r.color ?? (r.dim ? "rgba(215,220,229,0.5)" : "#d7dce5"),
                fontWeight: r.bold ? 650 : 400,
              }}
            >
              {r.shown}
              {cursor && i === lastVisible && (!r.done || blink) ? (
                <span style={{ display: "inline-block", width: fontSize * 0.55, height: fontSize * 1.05, background: accent, verticalAlign: "-2px", marginLeft: 1, opacity: r.done ? 0.85 : 1 }} />
              ) : null}
            </div>
          ) : null,
        )}
      </div>
      {children}
    </div>
  );
};
