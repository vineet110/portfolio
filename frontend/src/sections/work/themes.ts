/**
 * Every project brings its own palette and type, taken from the product
 * itself. `tile` dresses the project's card; `takeover` is what the whole
 * section turns into while that project is hovered or focused.
 */
export type WorldTheme = {
  tile: { bg: string; fg: string; accent: string }
  takeover: { bg: string; fg: string }
  /** font family class for the project's name / headings */
  font: string
}

/** The section's resting state: graphite, continuing the dark site — the work brings the colour. */
export const RESTING: WorldTheme["takeover"] = { bg: "#18171f", fg: "#f3f0ea" }

export const WORLDS: Record<string, WorldTheme> = {
  tufger: {
    tile: { bg: "#0f2a1c", fg: "#eef7d8", accent: "#c6f432" },
    takeover: { bg: "#123323", fg: "#eef7d8" },
    font: "font-grotesk",
  },
  jewellery: {
    tile: { bg: "#4a1528", fg: "#f7efe6", accent: "#d4b06a" },
    takeover: { bg: "#5a1a31", fg: "#f7efe6" },
    font: "font-serif",
  },
  chinar: {
    tile: { bg: "#0b3a75", fg: "#f2f6fb", accent: "#e0b90f" },
    takeover: { bg: "#0d4489", fg: "#f2f6fb" },
    font: "font-sans",
  },
  whatsapp: {
    tile: { bg: "#0b1a17", fg: "#dcfce7", accent: "#25d366" },
    takeover: { bg: "#0f2a22", fg: "#dcfce7" },
    font: "font-sans",
  },
  "spark-erp": {
    tile: { bg: "#eef2fb", fg: "#1b2340", accent: "#6d8bf2" },
    takeover: { bg: "#dfe6fa", fg: "#1b2340" },
    font: "font-grotesk",
  },
  "threat-accordme": {
    tile: { bg: "#f4f2ff", fg: "#241b4d", accent: "#7c3aed" },
    takeover: { bg: "#e4defe", fg: "#241b4d" },
    font: "font-display",
  },
  ctf: {
    tile: { bg: "#0d0b1f", fg: "#e7e3ff", accent: "#8b5cf6" },
    takeover: { bg: "#1a1438", fg: "#e7e3ff" },
    font: "font-mono",
  },
}
