export const C = {
  bg: "#05070b",
  bg2: "#0a0e16",
  ink: "#f5f7fa",
  inkSoft: "rgba(245,247,250,0.72)",
  inkMute: "rgba(245,247,250,0.48)",
  line: "rgba(255,255,255,0.10)",
  brand: "#4c8df6",
  brandDeep: "#2563eb",
  glow: "#8cc4ff",
  claude: "#d97757",
  amber: "#f2b53a",
  green: "#2fb36d",
  red: "#ef5350",
  violet: "#8b7cf6",
  // Light product UI (mirrors packages/ui/styles/tokens.css light theme)
  ui: {
    canvas: "#ffffff",
    sidebar: "#f4f4f5",
    column: "#f7f7f8",
    card: "#ffffff",
    border: "#ececef",
    text: "#18181b",
    textMute: "#71717a",
    textFaint: "#a1a1aa",
    accent: "#ebebee",
    warning: "#e2a52b",
    success: "#2f9e5b",
    info: "#3b7be8",
    danger: "#e5484d",
  },
} as const;

export const F = {
  // Chinese copy is set entirely in Noto Serif SC so mixed Latin words share
  // its proportions; Instrument Serif (the landing page's display face) is
  // reserved for English-only lines.
  serif: '"Noto Serif SC", serif',
  display: '"Instrument Serif", "Noto Serif SC", serif',
  sans: '"Inter", "Noto Sans SC", "PingFang SC", sans-serif',
  mono: '"Geist Mono", "Noto Sans SC", ui-monospace, monospace',
} as const;
