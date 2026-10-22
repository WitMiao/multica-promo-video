// Render several stills of one composition with a single bundle, then tile
// them into out/sheet_<id>.jpg for quick review.
//   node scripts/stills.mjs S-reveal 0,30,90,200 [cols]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const [id, framesArg, colsArg] = process.argv.slice(2);
const frames = framesArg.split(",").map(Number);
const cols = Number(colsArg ?? 2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "out", "stills");
fs.mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
const files = [];
for (const frame of frames) {
  const file = path.join(out, `${id}_${frame}.jpg`);
  await renderStill({ serveUrl, composition, frame, output: file, imageFormat: "jpeg", jpegQuality: 90 });
  files.push(file);
}

const w = 960;
const h = 540;
const inputs = files.flatMap((f) => ["-i", f]);
const scaled = files.map((_, i) => `[${i}]scale=${w}:${h}[v${i}]`).join(";");
const layout = files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join("|");
const sheet = path.join(root, "out", `sheet_${id}.jpg`);
if (files.length === 1) {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", files[0], "-vf", `scale=${w * 2}:-1`, sheet]);
} else {
  execFileSync("ffmpeg", [
    "-y", "-v", "error", ...inputs,
    "-filter_complex", `${scaled};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=black`,
    sheet,
  ]);
}
console.log(sheet);
