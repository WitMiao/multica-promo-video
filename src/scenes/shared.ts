import { focusCam } from "../components/Cam";

// Board-panel coordinates -> AppWindow coordinates (sidebar 240 + 1px border,
// 8px top margin + 1px border).
export const toWin = (x: number, y: number) => ({ x: x + 241, y: y + 9 });

// Framing shared by the end of the board scene and the start of the assign
// scene, so the cut between them is invisible.
export const ASSIGN_CAM = focusCam(830, 380, 1.5);
