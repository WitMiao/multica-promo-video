import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ease, mix, tw } from "../lib/anim";
import { C, F } from "../theme";
import { FPS } from "../timeline";
import { VO_LINES, VoLine } from "../vo";

// Narration subtitles for lines the picture does not already spell out.
// Spoken characters light up from the forced-alignment timings.

type Unit = { text: string; spoken: boolean };

// Subtitle convention: no trailing full stop, inner pauses become spaces.
const toUnits = (say: string): Unit[] => {
  const clean = say.replace(/[。.]$/u, "").replace(/[，；：]/gu, "　");
  const out: Unit[] = [];
  for (const m of clean.matchAll(/[一-鿿]|[A-Za-z]+|\d+|./gu)) {
    const text = m[0];
    const prev = out[out.length - 1]?.text ?? "";
    // Chinese typesetting: a space between Han and Latin letters or digits.
    const mixed = (/^[一-鿿]$/u.test(prev) && /^[A-Za-z\d]/u.test(text)) || (/[A-Za-z\d]$/u.test(prev) && /^[一-鿿]$/u.test(text));
    if (mixed) out.push({ text: " ", spoken: false });
    out.push({ text, spoken: /[一-鿿A-Za-z\d]/u.test(text) });
  }
  return out;
};

const HOLD = 0.45;

const Line: React.FC<{ line: VoLine; t: number }> = ({ line, t }) => {
  const units = toUnits(line.say);
  const spoken = units.filter((u) => u.spoken).length;
  const local = t - line.at;
  const aligned = line.tokens.length === spoken;
  const o = Math.min(tw(local, -0.1, 0.16, 0, 1, ease.out), 1 - tw(local, line.dur + HOLD - 0.15, 0.15, 0, 1, ease.in));
  const y = mix(14, 0, tw(local, -0.1, 0.3, 0, 1, ease.expoOut));
  let k = -1;
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        padding: "10px 26px 12px",
        borderRadius: 14,
        background: "rgba(6,9,15,0.74)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        fontFamily: F.sans,
        fontSize: 36,
        fontWeight: 500,
        letterSpacing: "0.04em",
        color: C.ink,
        whiteSpace: "pre",
      }}
    >
      {units.map((u, i) => {
        if (u.spoken) k += 1;
        const lit = aligned
          ? local >= line.tokens[Math.max(0, k)].s - 0.04
          : local >= (line.dur * Math.max(0, k)) / Math.max(1, spoken);
        return (
          <span key={i} style={{ color: lit || !u.spoken ? C.ink : "rgba(245,247,250,0.5)" }}>
            {u.text}
          </span>
        );
      })}
    </div>
  );
};

export const Subtitles: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const active = VO_LINES.filter((l) => l.show === "sub" && t >= l.at - 0.15 && t <= l.at + l.dur + HOLD);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "flex-end", alignItems: "center", paddingBottom: 46 }}>
      {active.map((l) => (
        <Line key={l.id} line={l} t={t} />
      ))}
    </AbsoluteFill>
  );
};
