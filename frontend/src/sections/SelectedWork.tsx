import { useCallback, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { projects, type Project } from "../data/projects"
import { RESTING, WORLDS } from "./work/themes"
import { CaseOverlay } from "./work/CaseOverlay"
import { AiWorkspaceMini } from "./work/minis/AiWorkspaceMini"
import { MaisonMini } from "./work/minis/MaisonMini"
import { PulseMini } from "./work/minis/PulseMini"
import { AtlasMini } from "./work/minis/AtlasMini"
import { FlowMini } from "./work/minis/FlowMini"

/** bento placement: desktop is a 12 × 2 collage, tablet two columns */
const SPAN: Record<string, string> = {
  "ai-workspace": "md:row-span-2 lg:col-span-4 lg:row-span-2",
  maison: "lg:col-span-5",
  pulse: "lg:col-span-3",
  atlas: "lg:col-span-3",
  flow: "lg:col-span-5",
}

/** each tile lands from a slightly different angle, like pinned prints */
const LAND_ROTATION = [-4, 3, -2, 4, -3]

function Mini({ id, live }: { id: string; live: boolean }) {
  switch (id) {
    case "ai-workspace":
      return <AiWorkspaceMini live={live} />
    case "maison":
      return <MaisonMini />
    case "pulse":
      return <PulseMini live={live} />
    case "atlas":
      return <AtlasMini />
    default:
      return <FlowMini live={live} />
  }
}

function Tile({
  project,
  order,
  reduced,
  dimmed,
  onHover,
  onOpen,
  children,
}: {
  project: Project
  order: number
  reduced: boolean
  dimmed: boolean
  onHover: () => void
  onOpen: () => void
  children: ReactNode
}) {
  const w = WORLDS[project.id]
  return (
    <motion.article
      data-testid={`work-tile-${project.id}`}
      onPointerEnter={onHover}
      onFocusCapture={onHover}
      initial={reduced ? false : { opacity: 0, y: 60, rotate: LAND_ROTATION[order] }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: order * 0.08 }}
      style={{ background: w.tile.bg, color: w.tile.fg }}
      className={`track-snap relative flex h-[30rem] w-[86vw] max-w-md shrink-0 flex-col overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] transition-[filter,opacity] duration-500 md:h-auto md:w-auto md:max-w-none ${
        SPAN[project.id]
      } ${dimmed ? "opacity-60 saturate-50" : ""}`}
    >
      <header className="flex items-center gap-2.5 border-b px-3.5 py-2.5" style={{ borderColor: `${w.tile.fg}1f` }}>
        <span className="font-mono text-[10px] opacity-50">{project.index}</span>
        <h3 className={`${w.font} truncate text-sm font-bold tracking-tight`}>{project.name}</h3>
        <span
          data-testid={`work-status-${project.id}`}
          className="-rotate-3 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ background: w.tile.fg, color: w.tile.bg }}
        >
          {project.status}
        </span>
        <button
          type="button"
          onClick={onOpen}
          data-testid={`work-open-${project.id}`}
          aria-label={`Open the ${project.name} case`}
          className="group/open ml-auto flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
          style={{ borderColor: `${w.tile.fg}40` }}
        >
          open case
          <ArrowUpRight size={12} className="transition-transform group-hover/open:-translate-y-0.5 group-hover/open:translate-x-0.5" />
        </button>
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </motion.article>
  )
}

/**
 * Selected Work — five concept products, five completely different worlds,
 * all on one screen. Every tile is a small working interface (not a
 * screenshot), and hovering one lets that product take over the section.
 */
export function SelectedWork() {
  const ref = useRef<HTMLElement>(null)
  const reduced = Boolean(useReducedMotion())
  const inView = useInView(ref, { amount: 0.15 })
  const live = inView && !reduced
  const [hovered, setHovered] = useState<string | null>(null)
  const [open, setOpen] = useState<Project | null>(null)
  const closeCase = useCallback(() => setOpen(null), [])
  const theme = hovered ? WORLDS[hovered].takeover : RESTING
  const hoveredProject = projects.find((p) => p.id === hovered)

  return (
    <motion.section
      id="work"
      ref={ref}
      animate={{ backgroundColor: theme.bg, color: theme.fg }}
      initial={false}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden py-14 sm:py-16"
    >
      <div aria-hidden="true" className="halftone pointer-events-none absolute inset-0" />

      <div className="container-studio relative">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
          <span>
            <span className="opacity-60">01 //</span> work — made by our team
          </span>
          <span className="opacity-70">studio concepts &amp; experiments · not real client work</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(2.6rem,5.6vw,5rem)] leading-[0.88] tracking-tight">
            <span className="font-serif italic">Five</span> <span className="font-mono text-[0.72em] uppercase">ideas,</span>
            <br />
            <span className="font-grotesk font-bold">five</span>{" "}
            <span className="font-display font-bold">
              worlds<span className="text-accent">.</span>
            </span>
          </h2>
          <div className="h-12 min-w-56 font-mono md:text-right text-xs uppercase tracking-[0.15em]">
            <AnimatePresence mode="wait">
              <motion.p
                key={hoveredProject?.id ?? "none"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {hoveredProject ? (
                  <>
                    <span className="opacity-60">now inside</span>
                    <span className="block text-base font-bold normal-case tracking-normal">{hoveredProject.category}</span>
                  </>
                ) : (
                  <span className="opacity-70">
                    <span className="hidden md:inline">hover a world — each one is live ↘</span>
                    <span className="md:hidden">each one is live — swipe for more →</span>
                  </span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div
          onPointerLeave={() => setHovered(null)}
          className="track-scroll -mx-[clamp(1.25rem,5vw,4rem)] mt-6 flex gap-3 overflow-x-auto px-[clamp(1.25rem,5vw,4rem)] pb-2 md:mx-0 md:grid md:auto-rows-[21rem] md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:h-[clamp(30rem,calc(100svh-17rem),40rem)] lg:auto-rows-auto lg:grid-cols-12 lg:grid-rows-2"
        >
          {projects.map((p, i) => (
            <Tile
              key={p.id}
              project={p}
              order={i}
              reduced={reduced}
              dimmed={hovered !== null && hovered !== p.id}
              onHover={() => setHovered(p.id)}
              onOpen={() => setOpen(p)}
            >
              <Mini id={p.id} live={live} />
            </Tile>
          ))}
        </div>
      </div>

      <AnimatePresence>{open && <CaseOverlay project={open} onClose={closeCase} />}</AnimatePresence>
    </motion.section>
  )
}
