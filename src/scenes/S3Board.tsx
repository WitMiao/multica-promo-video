import React from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Grain, Vignette } from "../components/Atmos";
import { Board, colX, layout } from "../components/Board";
import { CamState, Stage3D, lerpCam } from "../components/Cam";
import { LowerCaption } from "../components/Caption";
import { Sfx } from "../components/Sfx";
import { AGENTS, AppWindow, Avatar, HUMANS, Who } from "../components/ui";
import { BOARD_CARDS, COLUMNS, WORKING_AVATARS } from "../data";
import { ease, mix, sp, tw } from "../lib/anim";
import { C, F } from "../theme";
import { ASSIGN_CAM, toWin } from "./shared";

const CAM_IN: CamState = { rx: 52, ry: -12, rz: -10, s: 0.55, tx: 0, ty: 520 };
const CAM_SETTLE: CamState = { rx: 13, ry: -9, rz: -2.5, s: 0.8, tx: 0, ty: -78 };
const CAM_DRIFT: CamState = { rx: 8, ry: 7, rz: -0.8, s: 0.84, tx: 0, ty: -84 };

const Callout: React.FC<{ who: Who; text: string; x: number; y: number; at: number; f: number; fps: number }> = ({
  who,
  text,
  x,
  y,
  at,
  f,
  fps,
}) => {
  const t = sp(f, fps, at, { damping: 13, stiffness: 190 });
  const out = tw(f, 286, 16, 0, 1, ease.in);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateZ(60px) translateY(${(1 - t) * 26}px) scale(${mix(0.8, 1, t) * 1.25})`,
        transformOrigin: "0 50%",
        opacity: Math.min(1, t * 1.4) * (1 - out),
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px 9px 9px",
        borderRadius: 999,
        background: "rgba(12,16,24,0.88)",
        border: "1px solid rgba(140,196,255,0.35)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.45), 0 0 30px rgba(76,141,246,0.25)",
        fontFamily: F.sans,
        fontSize: 19,
        color: C.ink,
        fontWeight: 550,
        whiteSpace: "nowrap",
      }}
    >
      <Avatar who={who} size={30} />
      {text}
    </div>
  );
};

export const S3Board: React.FC = () => {
  const f = useCurrentFrame();
  // Motion blur only while the window flies in; afterwards the camera is slow.
  if (f < 56) {
    return (
      <CameraMotionBlur shutterAngle={200} samples={8}>
        <S3BoardInner />
      </CameraMotionBlur>
    );
  }
  return <S3BoardInner />;
};

const S3BoardInner: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = sp(f, fps, 0, { damping: 22, stiffness: 70, mass: 1.1 });
  let cam = lerpCam(CAM_IN, CAM_SETTLE, enter);
  cam = lerpCam(cam, CAM_DRIFT, tw(f, 70, 230, 0, 1, ease.inOut));
  cam = lerpCam(cam, ASSIGN_CAM, tw(f, 292, 68, 0, 1, ease.inOut));

  const base = layout(COLUMNS, BOARD_CARDS);
  const ids = Object.keys(base);
  const cards = ids.map((id, i) => {
    const t = tw(f, 26 + i * 2.6, 26, 0, 1, ease.expoOut);
    const c = base[id];
    return { ...c, y: c.y + (1 - t) * 40, opacity: t };
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop grid={0.04} />
      <Stage3D cam={cam} opacity={Math.min(1, f / 10)}>
        <AppWindow>
          <Board columns={COLUMNS} cards={cards} working={WORKING_AVATARS} workingCount={5} />
        </AppWindow>
        <Callout who={AGENTS.claude} text="Claude 正在处理" x={toWin(colX(2), 0).x + 60} y={110} at={96} f={f} fps={fps} />
        <Callout who={HUMANS.lin} text="林舟 · 你的队友" x={toWin(colX(1), 0).x + 70} y={400} at={120} f={f} fps={fps} />
        <Callout who={AGENTS.qwen} text="Qwen 提交了审核" x={toWin(colX(3), 0).x + 50} y={360} at={144} f={f} fps={fps} />
      </Stage3D>

      <LowerCaption text="人和智能体，在[同一块看板]上。" start={44} end={292} size={66} y={64} band={false} />
      <Vignette strength={0.55} />
      <Grain opacity={0.06} />

      <Sfx at={0} name="whoosh_big" vol={0.7} />
      <Sfx at={26} name="cascade" vol={0.45} />
      <Sfx at={96} name="pop_soft" vol={0.5} />
      <Sfx at={120} name="pop_soft" vol={0.5} />
      <Sfx at={144} name="pop_soft" vol={0.5} />
      <Sfx at={292} name="whoosh_soft" vol={0.45} />
    </AbsoluteFill>
  );
};
