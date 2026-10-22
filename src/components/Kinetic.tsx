import React from "react";
import { useCurrentFrame } from "remotion";
import { ease, tw } from "../lib/anim";

type Token = { text: string; hl: boolean };

// Latin runs stay whole so kerning survives; Han characters animate one by one.
const tokenize = (line: string): Token[] => {
  const out: Token[] = [];
  let hl = false;
  const re = /(\[|\]|[A-Za-z0-9][A-Za-z0-9.\-+/#'’%$]*|\s+|.)/gu;
  for (const m of line.matchAll(re)) {
    const s = m[0];
    if (s === "[") {
      hl = true;
      continue;
    }
    if (s === "]") {
      hl = false;
      continue;
    }
    out.push({ text: s, hl });
  }
  return out;
};

export type KineticProps = {
  text: string; // "\n" breaks lines, [..] marks highlighted runs
  start?: number;
  end?: number; // frame at which the exit finishes
  stagger?: number;
  dur?: number;
  rise?: number;
  blur?: number;
  style?: React.CSSProperties;
  hlStyle?: React.CSSProperties;
  align?: "left" | "center" | "right";
  lineGap?: number;
  exit?: "fade" | "up" | "none";
};

export const Kinetic: React.FC<KineticProps> = ({
  text,
  start = 0,
  end,
  stagger = 2.2,
  dur = 26,
  rise = 38,
  blur = 14,
  style,
  hlStyle,
  align = "left",
  lineGap = 0.12,
  exit = "up",
}) => {
  const f = useCurrentFrame();
  const lines = text.split("\n").map(tokenize);
  let idx = 0;
  const exitT = end === undefined || exit === "none" ? 0 : tw(f, end - 16, 16, 0, 1, ease.in);
  return (
    <div style={{ textAlign: align, ...style }}>
      {lines.map((tokens, li) => (
        <div key={li} style={{ display: "block", marginTop: li ? `${lineGap}em` : 0, whiteSpace: "nowrap" }}>
          {tokens.map((tok, ti) => {
            const isSpace = /^\s+$/.test(tok.text);
            const i = idx;
            if (!isSpace) idx += 1;
            const t = tw(f, start + i * stagger, dur, 0, 1, ease.expoOut);
            const o = t * (1 - exitT);
            const y = (1 - t) * rise - (exit === "up" ? exitT * rise * 0.6 : 0);
            const b = (1 - t) * blur + exitT * blur * 0.6;
            if (isSpace) return <span key={ti} style={{ whiteSpace: "pre" }}>{tok.text}</span>;
            return (
              <span
                key={ti}
                style={{
                  display: "inline-block",
                  opacity: o,
                  transform: `translateY(${y}px)`,
                  filter: b > 0.2 ? `blur(${b}px)` : undefined,
                  ...(tok.hl ? hlStyle : null),
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
