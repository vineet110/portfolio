import { media } from "./media"

export type Project = {
  id: string
  index: string
  name: string
  category: string
  status: "CONCEPT" | "EXPERIMENTAL"
  description: string
  tags: string[]
  /** Decorative page labels shown in the project's browser-chrome preview —
   * not real navigable pages (these are concept explorations, not live
   * sites), just part of the visual presentation. */
  pages: string[]
  image: (typeof media.projects)[keyof typeof media.projects]
}

/**
 * Conceptual portfolio projects. These are studio-authored explorations,
 * not real client engagements — always labeled CONCEPT / EXPERIMENTAL in UI,
 * never given a fake "live site" link. Names are placeholders and can be
 * replaced once real work exists.
 */
export const projects: Project[] = [
  {
    id: "ai-workspace",
    index: "01",
    name: "AI Workspace",
    category: "AI Product · Web App",
    status: "CONCEPT",
    description: "An operations console that turns scattered business data into one conversational workspace.",
    tags: ["Web App", "AI-Integrated", "UI/UX"],
    pages: ["Home", "Workspace", "Reports"],
    image: media.projects.aiWorkspace,
  },
  {
    id: "maison",
    index: "02",
    name: "Maison",
    category: "Commerce · Website",
    status: "CONCEPT",
    description: "A quiet, confident storefront for a heritage goods house — pacing over pop-ups.",
    tags: ["Website", "E-commerce", "Art Direction"],
    pages: ["Home", "Shop", "Story"],
    image: media.projects.maison,
  },
  {
    id: "pulse",
    index: "03",
    name: "Pulse",
    category: "Fintech · Web App",
    status: "EXPERIMENTAL",
    description: "A trading interface that keeps dense, real-time data legible under pressure.",
    tags: ["Web App", "Data-Heavy UI", "UX"],
    pages: ["Dashboard", "Markets", "Portfolio"],
    image: media.projects.pulse,
  },
  {
    id: "atlas",
    index: "04",
    name: "Atlas",
    category: "Travel · Mobile App",
    status: "CONCEPT",
    description: "A booking app for boutique stays, built around discovery rather than a checkout funnel.",
    tags: ["Mobile App", "Booking", "UI/UX"],
    pages: ["Explore", "Stay", "Trip"],
    image: media.projects.atlas,
  },
  {
    id: "flow",
    index: "05",
    name: "Flow",
    category: "Automation · Web App",
    status: "EXPERIMENTAL",
    description: "A visual tool for non-technical teams to compose their own business logic, AI-assisted.",
    tags: ["Web App", "AI-Integrated", "Internal Tool"],
    pages: ["Canvas", "Runs", "Settings"],
    image: media.projects.flow,
  },
]
