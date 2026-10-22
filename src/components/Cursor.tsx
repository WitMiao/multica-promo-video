import React from "react";
import { interpolate } from "remotion";
import { CLAMP, ease } from "../lib/anim";

export type CursorKey = { f: number; x: number; y: number };

/** Piecewise eased cursor path; `clicks` are frames that dip the pointer. */
export const cursorAt = (f: number, keys: CursorKey[]) => {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = interpolate(f, [a.f, b.f], [0, 1], { ...CLAMP, easing: ease.inOut });
      // a gentle arc reads as a hand, not a robot
      const arc = Math.sin(t * Math.PI) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - arc };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y };
};

export const Pointer: React.FC<{
  x: number;
  y: number;
  f: number;
  clicks?: number[];
  opacity?: number;
  size?: number;
}> = ({ x, y, f, clicks = [], opacity = 1, size = 26 }) => {
  let press = 0;
  for (const c of clicks) {
    const d = f - c;
    if (d >= 0 && d < 12) press = Math.max(press, Math.sin((d / 12) * Math.PI));
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, zIndex: 50, pointerEvents: "none" }}>
      {clicks.map((c) => {
        const d = f - c;
        if (d < 0 || d > 22) return null;
        const t = d / 22;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: -26 * (0.4 + t),
              top: -26 * (0.4 + t),
              width: 52 * (0.4 + t),
              height: 52 * (0.4 + t),
              borderRadius: "50%",
              border: `2px solid rgba(76,141,246,${1 - t})`,
              background: `rgba(76,141,246,${0.18 * (1 - t)})`,
            }}
          />
        );
      })}
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 20 25"
        style={{
          transform: `scale(${1 - press * 0.14})`,
          transformOrigin: "2px 2px",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))",
        }}
      >
        <path d="M2 1.5 L2 19.5 L6.6 15.3 L9.8 22.6 L13 21.2 L9.9 14.1 L16.2 14 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const easeOut = ease.out;
