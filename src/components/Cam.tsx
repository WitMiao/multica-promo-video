import React from "react";
import { AbsoluteFill } from "remotion";

export type CamState = {
  rx: number; // deg
  ry: number;
  rz: number;
  s: number;
  tx: number;
  ty: number;
};

export const lerpCam = (a: CamState, b: CamState, t: number): CamState => ({
  rx: a.rx + (b.rx - a.rx) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  rz: a.rz + (b.rz - a.rz) * t,
  s: a.s + (b.s - a.s) * t,
  tx: a.tx + (b.tx - a.tx) * t,
  ty: a.ty + (b.ty - a.ty) * t,
});

/** Camera that keeps window-space point (px, py) at screen point (sx, sy). */
export const focusCam = (
  px: number,
  py: number,
  s: number,
  win = { w: 1600, h: 900 },
  sx = 960,
  sy = 540,
): CamState => ({
  rx: 0,
  ry: 0,
  rz: 0,
  s,
  tx: (win.w / 2 - px) * s + (sx - 960),
  ty: (win.h / 2 - py) * s + (sy - 540),
});

/** Centres a 1600x900 plane on screen and applies a 3D camera to it. */
export const Stage3D: React.FC<{
  cam: CamState;
  width?: number;
  height?: number;
  perspective?: number;
  opacity?: number;
  filter?: string;
  children: React.ReactNode;
}> = ({ cam, width = 1600, height = 900, perspective = 2600, opacity = 1, filter, children }) => (
  <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 45%", opacity, filter }}>
    <div
      style={{
        position: "absolute",
        left: 960 - width / 2,
        top: 540 - height / 2,
        width,
        height,
        transformStyle: "preserve-3d",
        transform: `translate3d(${cam.tx}px, ${cam.ty}px, 0) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg) scale(${cam.s})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);
