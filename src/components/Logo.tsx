import React from "react";

// The Multica mark (apps/web/public/favicon.svg) is the union of four 10x100
// bars crossing at the centre of a 100x100 box, at 0/45/90/135 degrees.
export const MARK_POINTS =
  "45,62.1 45,100 55,100 55,62.1 81.8,88.9 88.9,81.8 62.1,55 100,55 100,45 62.1,45 88.9,18.2 81.8,11.1 55,37.9 55,0 45,0 45,37.9 18.2,11.1 11.1,18.2 37.9,45 0,45 0,55 37.9,55 11.1,81.8 18.2,88.9";

export const MulticaMark: React.FC<{
  size: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size, color = "#fff", style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <polygon fill={color} points={MARK_POINTS} />
  </svg>
);

/**
 * The mark assembled arm by arm. `progress` per arm is 0..1 of its half-length;
 * each of the eight half-arms grows outward from the centre.
 */
export const BuildMark: React.FC<{
  size: number;
  arms: number[]; // 8 values, 0..1
  color?: string;
  core?: number; // 0..1 scale of the centre hub
  style?: React.CSSProperties;
}> = ({ size, arms, color = "#fff", core = 1, style }) => {
  const angles = [-90, -45, 0, 45, 90, 135, 180, 225];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
      <g transform="translate(50 50)">
        {angles.map((a, i) => {
          const len = 50 * Math.max(0, Math.min(1, arms[i] ?? 0));
          if (len <= 0.01) return null;
          return (
            <rect
              key={a}
              x={0}
              y={-5}
              width={len}
              height={10}
              fill={color}
              transform={`rotate(${a})`}
            />
          );
        })}
        {core > 0 ? (
          <polygon
            fill={color}
            transform={`scale(${core})`}
            points="-5,-12.1 5,-12.1 12.1,-5 12.1,5 5,12.1 -5,12.1 -12.1,5 -12.1,-5"
          />
        ) : null}
      </g>
    </svg>
  );
};
