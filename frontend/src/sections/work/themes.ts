/**
 * Every concept project is its own "world" — its own palette and type —
 * so the Work section reads as many different products side by side.
 * `tile` styles the project's mini-site; `takeover` is what the whole
 * section turns into while that project is hovered or focused.
 */
export type WorldTheme = {
  tile: { bg: string; fg: string; accent: string }
  takeover: { bg: string; fg: string }
  /** font family class for the project's name / headings */
  font: string
}

/** The section's resting state: cobalt, nobody's brand in particular. */
export const RESTING: WorldTheme["takeover"] = { bg: "#1f2bd1", fg: "#f3f0ea" }

export const WORLDS: Record<string, WorldTheme> = {
  "ai-workspace": {
    tile: { bg: "#121019", fg: "#ece9f5", accent: "#9b87ff" },
    takeover: { bg: "#1b1533", fg: "#ece9f5" },
    font: "font-sans",
  },
  maison: {
    tile: { bg: "#efe6d8", fg: "#2a2118", accent: "#8a5a2b" },
    takeover: { bg: "#d8c6aa", fg: "#2a2118" },
    font: "font-serif",
  },
  pulse: {
    tile: { bg: "#030806", fg: "#3dff9a", accent: "#ff4d6d" },
    takeover: { bg: "#06160e", fg: "#c9ffe2" },
    font: "font-mono",
  },
  atlas: {
    tile: { bg: "#ff6b4a", fg: "#1d0f0b", accent: "#fff3e6" },
    takeover: { bg: "#ff8466", fg: "#1d0f0b" },
    font: "font-grotesk",
  },
  flow: {
    tile: { bg: "#e4ff4f", fg: "#11140a", accent: "#2b2bff" },
    takeover: { bg: "#cdea2c", fg: "#11140a" },
    font: "font-grotesk",
  },
}
