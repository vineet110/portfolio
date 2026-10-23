import { media } from "./media"

export type Service = {
  id: string
  index: string
  name: string
  summary: string
  detail: string
  items: string[]
  /** accent = violet, amber = amber, mono = neutral (no color tint) */
  color: "accent" | "amber" | "mono"
  image: (typeof media.capabilities)[keyof typeof media.capabilities]
}

/**
 * The studio sells exactly three services. Do not add more without an
 * explicit brief change — see docs/goal.md "Core services."
 */
export const services: Service[] = [
  {
    id: "websites",
    index: "01",
    name: "Websites",
    summary: "Sites and web apps that do their job well.",
    detail:
      "From a landing page to a full web application — including AI-integrated experiences when they genuinely help — built fast, built clean, built to work on every screen.",
    items: ["Marketing & business sites", "Web applications", "AI-integrated web experiences"],
    color: "accent",
    image: media.capabilities.web,
  },
  {
    id: "mobile",
    index: "02",
    name: "Mobile Apps",
    summary: "Apps that feel native, not squeezed.",
    detail:
      "iOS and Android, designed and built around how people actually use a phone — not a desktop site shrunk down.",
    items: ["iOS & Android apps", "Cross-platform builds", "App store launch"],
    color: "amber",
    image: media.capabilities.mobile,
  },
  {
    id: "design",
    index: "03",
    name: "UI/UX Design",
    summary: "Design that makes the product make sense.",
    detail:
      "Research, flows, and interfaces that give your idea a clear shape before a single line of code is written.",
    items: ["Product & UI/UX design", "User flows & prototypes", "Design systems"],
    color: "mono",
    image: media.capabilities.design,
  },
]
