/**
 * The Process section's scroll-driven character cast — one production 3D
 * character per phase (see frontend/src/assets/process/), sharing one
 * consistent illustration style so they read as one character family, not
 * five unrelated images. Centralized here so the cast (assets, colors,
 * copy) can be edited or replaced without touching the scroll/rendering
 * logic in Process.tsx / ProcessCharacter.tsx.
 */

import planning from "../assets/process/process-planning.webp"
import uiux from "../assets/process/process-uiux.webp"
import design from "../assets/process/process-design.webp"
import development from "../assets/process/process-development.webp"
import launch from "../assets/process/process-launch.webp"

export type ProcessCharacter = {
  id: string
  phase: string
  image: string
  alt: string
  /** outfit color token, see index.css --color-char-* */
  color: "char-blue" | "char-green" | "char-pink" | "char-purple" | "char-orange"
  title: string
  description: string
}

export const processCharacters: ProcessCharacter[] = [
  {
    id: "idea",
    phase: "01",
    image: planning,
    alt: "3D character in a blue hoodie, thinking with a hand on their chin beside a glowing idea lightbulb",
    color: "char-blue",
    title: "Idea",
    description: "You bring the idea, even a rough one. We ask the questions that shape it into a real plan.",
  },
  {
    id: "uiux",
    phase: "02",
    image: uiux,
    alt: "3D character in a green outfit arranging interface layout blocks",
    color: "char-green",
    title: "UI/UX",
    description: "We map how it should work — flows, structure, and the decisions that make it easy to use.",
  },
  {
    id: "design",
    phase: "03",
    image: design,
    alt: "3D character in a pink outfit in a creative design posture",
    color: "char-pink",
    title: "Design",
    description: "The interface takes shape — the look, the feel, the details that make it feel considered.",
  },
  {
    id: "development",
    phase: "04",
    image: development,
    alt: "3D character in a purple outfit coding at a laptop",
    color: "char-purple",
    title: "Development",
    description: "We build it — a real, working website or app, tested as it comes together.",
  },
  {
    id: "launch",
    phase: "05",
    image: launch,
    alt: "3D character in an orange outfit celebrating a launch",
    color: "char-orange",
    title: "Launch",
    description: "It goes live, and we stay close after — a dedicated team, not a one-off handoff.",
  },
]
