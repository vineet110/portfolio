/**
 * The hero's single source of geometry. The same boxes are drawn three
 * ways — as a pencil sketch, as a grey wireframe (SketchLayer) and as the
 * real interface (FinalLayer) — so every element sits in exactly the same
 * place as it changes fidelity. Coordinates are in artboard units; the
 * artboard is `width × height` and scales to fit the screen.
 */

export type Box = { x: number; y: number; w: number; h: number }

export type Blueprint = {
  name: "landscape" | "portrait"
  width: number
  height: number
  /** height of the window title bar */
  bar: number
  logo: Box
  /** absent on narrow screens, which show a burger instead */
  nav?: Box
  navCta: Box
  h1: Box
  sub: Box
  cta: Box
  link: Box
  image: Box
  cards: Box[]
  /** font sizes in cqw (percent of artboard width) */
  type: { h1: number; sub: number; ui: number; logo: number; card: number }
  /** the handwritten headline, split to fit the sketch */
  scribble: string[]
}

export const LANDSCAPE: Blueprint = {
  name: "landscape",
  width: 1000,
  height: 640,
  bar: 40,
  logo: { x: 40, y: 62, w: 110, h: 26 },
  nav: { x: 520, y: 66, w: 240, h: 18 },
  navCta: { x: 812, y: 58, w: 148, h: 34 },
  h1: { x: 40, y: 128, w: 540, h: 150 },
  sub: { x: 40, y: 296, w: 470, h: 60 },
  cta: { x: 40, y: 388, w: 190, h: 52 },
  link: { x: 252, y: 400, w: 130, h: 28 },
  image: { x: 610, y: 128, w: 350, h: 312 },
  cards: [
    { x: 40, y: 476, w: 290, h: 128 },
    { x: 355, y: 476, w: 290, h: 128 },
    { x: 670, y: 476, w: 290, h: 128 },
  ],
  type: { h1: 5.2, sub: 1.75, ui: 1.15, logo: 2.2, card: 1.5 },
  scribble: ["We make websites", "& apps!!"],
}

export const PORTRAIT: Blueprint = {
  name: "portrait",
  width: 400,
  height: 720,
  bar: 34,
  logo: { x: 24, y: 54, w: 90, h: 24 },
  navCta: { x: 322, y: 52, w: 54, h: 28 },
  h1: { x: 24, y: 104, w: 352, h: 150 },
  sub: { x: 24, y: 266, w: 340, h: 66 },
  cta: { x: 24, y: 346, w: 172, h: 48 },
  link: { x: 214, y: 356, w: 130, h: 28 },
  image: { x: 24, y: 418, w: 352, h: 168 },
  cards: [
    { x: 24, y: 606, w: 108, h: 90 },
    { x: 146, y: 606, w: 108, h: 90 },
    { x: 268, y: 606, w: 108, h: 90 },
  ],
  type: { h1: 10.5, sub: 4, ui: 3, logo: 5, card: 3.2 },
  scribble: ["We make", "websites", "& apps!!"],
}

/** Box → absolute CSS position in percent of the artboard. */
export function place(bp: Blueprint, b: Box) {
  return {
    left: `${(b.x / bp.width) * 100}%`,
    top: `${(b.y / bp.height) * 100}%`,
    width: `${(b.w / bp.width) * 100}%`,
    height: `${(b.h / bp.height) * 100}%`,
  }
}

export type Stage = {
  id: string
  phase: string
  title: string
  /** what the designer scribbles above the artboard at this stage */
  note: string
  description: string
}

/** The studio's process, told by the hero itself (replaces the old Process section). */
export const STAGES: Stage[] = [
  {
    id: "idea",
    phase: "01",
    title: "Idea",
    note: "have an idea?",
    description: "You bring the idea, even a rough one. We ask the questions that shape it into a real plan.",
  },
  {
    id: "uiux",
    phase: "02",
    title: "UI/UX",
    note: "give it structure",
    description: "We map how it should work — flows, structure, and the decisions that make it easy to use.",
  },
  {
    id: "design",
    phase: "03",
    title: "Design",
    note: "now make it beautiful",
    description: "The interface takes shape — the look, the feel, the details that make it feel considered.",
  },
  {
    id: "development",
    phase: "04",
    title: "Development",
    note: "build it for real",
    description: "We build it — a real, working website or app, tested as it comes together.",
  },
  {
    id: "launch",
    phase: "05",
    title: "Launch",
    note: "ship it!",
    description: "It goes live, and we stay close after — a dedicated team, not a one-off handoff.",
  },
]

/**
 * Scroll timeline, as fractions of the pinned scroll (0 = hero top,
 * 1 = hero fully scrolled). Kept together so the choreography can be
 * retimed in one place.
 */
export const T = {
  stageStarts: [0, 0.2, 0.4, 0.6, 0.8],
  /** sketch wobble settles into straight wireframe lines */
  straighten: [0.2, 0.34],
  handwritingOut: [0.22, 0.3],
  wireIn: [0.27, 0.36],
  /** paper → dark */
  ink: [0.42, 0.52],
  /** finished design floods in */
  flood: [0.47, 0.6],
  codeLabels: [0.6, 0.66],
  /** x-ray lens opens, holds, closes */
  lens: [0.62, 0.68, 0.78, 0.83],
  /** deploy log lines appear at these points */
  deploy: [0.8, 0.84, 0.87, 0.9, 0.94],
} as const

export const COLORS = {
  paper: "#f1ece2",
  board: "#faf7f0",
  pencil: "#2f2b26",
  wire: "#9b9488",
  ink: "#0c0b11",
  boardDark: "#15141d",
  lineDark: "#3b3850",
  accent: "#7c5cff",
  inkText: "#f3f0ea",
} as const
