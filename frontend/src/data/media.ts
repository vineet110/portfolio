/**
 * Centralized media registry.
 *
 * Every image used in the site is declared here — never hardcode an image
 * URL inside a component. This lets imagery be swapped later (real project
 * shots, commissioned photography, brand assets) without touching layout.
 *
 * Images are served as local static assets from public/images/ rather than
 * hotlinked from a remote CDN — see docs/memory.md for why (broken image
 * QA pass, Phase 2.5) and for the source of each file (mostly Wikimedia
 * Commons, some proxied Unsplash originals — all public-domain or
 * openly-licensed, chosen to avoid recognizable brands, logos, faces, or
 * artwork).
 */

export type MediaAsset = {
  src: string
  source: "Unsplash" | "Wikimedia Commons"
  credit?: string
  alt: string
}

const local = (file: string) => `/images/${file}`

export const media = {
  /**
   * V3 hero: floating "app windows" built from the same project images
   * used in the Work section below — the hero previews the real work
   * directly (via `data/projects.ts`) rather than a separate image set.
   */
  projects: {
    aiWorkspace: {
      src: local("project-ai-workspace.webp"),
      source: "Unsplash" as const,
      alt: "Macro detail of a computer circuit board representing an intelligent systems interface",
    },
    maison: {
      src: local("project-maison.webp"),
      source: "Wikimedia Commons" as const,
      alt: "Minimal symmetrical hotel lobby interior with soft directional light",
    },
    pulse: {
      src: local("project-pulse.webp"),
      source: "Wikimedia Commons" as const,
      alt: "Nighttime satellite view of a dense city's illuminated street network, evoking live financial data",
    },
    atlas: {
      src: local("project-atlas.webp"),
      source: "Wikimedia Commons" as const,
      alt: "Aerial view of a coastal resort skyline suggesting travel and hospitality",
    },
    flow: {
      src: local("project-flow.webp"),
      source: "Unsplash" as const,
      alt: "Overhead view of a triple-monitor developer workstation, symmetrical and dark",
    },
  },

  capabilities: {
    web: {
      src: local("capability-web.webp"),
      source: "Unsplash" as const,
      alt: "Modern architectural structure with strong angular geometric lines",
    },
    applications: {
      src: local("capability-applications.webp"),
      source: "Unsplash" as const,
      alt: "Macro shot of source code displayed on a dark screen",
    },
    design: {
      src: local("capability-design.webp"),
      source: "Unsplash" as const,
      alt: "Two people reviewing an interface design together over a laptop",
    },
    mobile: {
      src: local("capability-mobile.webp"),
      source: "Wikimedia Commons" as const,
      alt: "Close-up of hands holding a mobile phone with a dark camera app interface",
    },
    ai: {
      src: local("capability-ai.webp"),
      source: "Wikimedia Commons" as const,
      alt: "Macro detail of a green circuit board, abstract and technical",
    },
    ongoing: {
      src: local("capability-ongoing.webp"),
      source: "Unsplash" as const,
      alt: "Modern architectural structure with strong angular geometric lines",
    },
  },

  team: {
    src: local("approach-team.webp"),
    source: "Unsplash" as const,
    alt: "Small group of specialists working together on laptops around a table",
  },
} satisfies Record<string, MediaAsset | MediaAsset[] | Record<string, MediaAsset | MediaAsset[]>>
