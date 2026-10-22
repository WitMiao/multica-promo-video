import { continueRender, delayRender, staticFile } from "remotion";

const faces: Array<[string, string, FontFaceDescriptors]> = [
  ["Inter", "fonts/Inter-VF.ttf", { weight: "100 900" }],
  ["Instrument Serif", "fonts/InstrumentSerif-Regular.ttf", { weight: "400" }],
  [
    "Instrument Serif",
    "fonts/InstrumentSerif-Italic.ttf",
    { weight: "400", style: "italic" },
  ],
  ["Geist Mono", "fonts/GeistMono-VF.ttf", { weight: "100 900" }],
  // CJK faces are subset to the glyphs the film uses (scripts/subset-fonts.py).
  ["Noto Serif SC", "fonts/NotoSerifSC.woff2", { weight: "200 900" }],
  ["Noto Sans SC", "fonts/NotoSansSC.woff2", { weight: "100 900" }],
];

let started = false;

export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender("Loading fonts");
  Promise.all(
    faces.map(([family, file, desc]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, desc);
      return face.load().then((loaded) => document.fonts.add(loaded));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
