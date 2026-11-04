import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, X } from "lucide-react"
import { projects, type Project } from "../data/projects"
import { clients } from "../data/clients"
import { RESTING, WORLDS } from "./work/themes"
import { CaseOverlay } from "./work/CaseOverlay"
import { SitePreview } from "./work/SitePreview"

/** desktop: three live sites across the top, four platforms below */
const SPAN: Record<string, string> = {
  tufger: "lg:col-span-4",
  jewellery: "lg:col-span-4",
  chinar: "lg:col-span-4",
  whatsapp: "lg:col-span-3",
  "spark-erp": "lg:col-span-3",
  "threat-accordme": "lg:col-span-3",
  ctf: "lg:col-span-3",
}

/** each tile lands from a slightly different angle, like pinned prints */
const LAND_ROTATION = [-4, 3, -2, 4, -3, 2, -4]

/** how long the pointer rests on a tile before it opens up full size */
const HOVER_INTENT_MS = 350

/** the opened project's window, in px (header included) — the same size as
 * the browser window in the Services section (32rem square × 68%) */
const STAGE_SIZE = { width: 512, height: 348 }


type Rect = { left: number; top: number; width: number; height: number }

/** hover-to-expand only where there's a real pointer and room for it */
function useCanExpand() {
  const query = "(hover: hover) and (pointer: fine) and (min-width: 1024px)"
  const [ok, setOk] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setOk(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return ok
}

function Tile({
  project,
  order,
  reduced,
  dimmed,
  onEnter,
  onLeave,
  onFocus,
  onOpen,
}: {
  project: Project
  order: number
  reduced: boolean
  dimmed: boolean
  onEnter: (el: HTMLElement) => void
  onLeave: () => void
  /** keyboard focus recolours the section but never covers the grid */
  onFocus: () => void
  onOpen: () => void
}) {
  const w = WORLDS[project.id]
  const live = project.preview.kind !== "image"
  return (
    <motion.article
      data-testid={`work-tile-${project.id}`}
      onPointerEnter={(e) => onEnter(e.currentTarget)}
      onPointerLeave={onLeave}
      onFocusCapture={onFocus}
      initial={reduced ? false : { opacity: 0, y: 60, rotate: LAND_ROTATION[order] }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: order * 0.06 }}
      style={{ background: w.tile.bg, color: w.tile.fg }}
      className={`track-snap group relative flex h-[26rem] w-[86vw] max-w-md shrink-0 flex-col overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] transition-[filter,opacity] duration-500 md:h-auto md:w-auto md:max-w-none ${
        SPAN[project.id]
      } ${dimmed ? "opacity-60 saturate-50" : ""}`}
    >
      <header className="flex items-center gap-2.5 border-b px-3.5 py-2.5" style={{ borderColor: `${w.tile.fg}1f` }}>
        <span className="font-mono text-[10px] opacity-50">{project.index}</span>
        <h3 className={`${w.font} truncate text-sm font-bold tracking-tight`}>{project.name}</h3>
        {project.status === "LIVE" && (
          <span
            data-testid={`work-status-${project.id}`}
            className="-rotate-3 shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ background: w.tile.accent, color: "#111" }}
          >
            {project.status}
          </span>
        )}
        <button
          type="button"
          onClick={onOpen}
          data-testid={`work-open-${project.id}`}
          aria-label={`Open the ${project.name} case`}
          className="group/open ml-auto flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
          style={{ borderColor: `${w.tile.fg}40` }}
        >
          open
          <ArrowUpRight size={12} className="transition-transform group-hover/open:-translate-y-0.5 group-hover/open:translate-x-0.5" />
        </button>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={project.image.src}
          alt={project.image.alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${
            live ? "object-top" : "object-center"
          }`}
        />
        <p
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3.5 pb-2.5 pt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-white/90"
        >
          {project.category}
        </p>
      </div>
    </motion.article>
  )
}

/**
 * The hovered project, grown from its tile into a fixed-size window
 * (STAGE_SIZE) centred on it: the real site (or its full-page shot),
 * scrollable inside.
 */
function Stage({
  project,
  from,
  to,
  reduced,
  onClose,
}: {
  project: Project
  from: Rect
  to: Rect
  reduced: boolean
  onClose: () => void
}) {
  const w = WORLDS[project.id]
  const host = project.url ? new URL(project.url).host : null
  return (
    <motion.div
      data-testid="work-stage"
      role="region"
      aria-label={`${project.name} — full-size preview`}
      onPointerLeave={onClose}
      initial={reduced ? { ...to, opacity: 0 } : { ...from, opacity: 0.6 }}
      animate={{ ...to, opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { ...from, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      style={{ background: w.tile.bg, color: w.tile.fg }}
      className="absolute z-20 flex flex-col overflow-hidden rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]"
    >
      <header className="flex shrink-0 items-center gap-3 border-b px-3 py-1.5" style={{ borderColor: `${w.tile.fg}1f` }}>
        <h3 className={`${w.font} truncate text-sm font-bold tracking-tight`}>{project.name}</h3>
        {host && (
          <span className="hidden truncate rounded-full px-3 py-1 font-mono text-[11px] opacity-70 sm:block" style={{ background: `${w.tile.fg}14` }}>
            {host}
          </span>
        )}
        {project.preview.kind === "scroll" && (
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] opacity-60 xl:block">full-page screenshot · scroll</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ background: w.tile.accent, color: "#111" }}
            >
              visit site <ArrowUpRight size={12} />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-7 w-7 place-items-center rounded-full border transition-transform hover:rotate-90"
            style={{ borderColor: `${w.tile.fg}40` }}
          >
            <X size={14} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <SitePreview project={project} />
      </div>
    </motion.div>
  )
}

/**
 * Selected Work — real projects by the team. Hovering a tile lets that
 * project's colours take over the section; resting on it opens the real
 * site at full size right inside the grid.
 */
export function SelectedWork() {
  const ref = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const reduced = Boolean(useReducedMotion())
  const canExpand = useCanExpand()
  const [hovered, setHovered] = useState<string | null>(null)
  const [stage, setStage] = useState<{ id: string; from: Rect; to: Rect } | null>(null)
  const [open, setOpen] = useState<Project | null>(null)
  const closeCase = useCallback(() => setOpen(null), [setOpen])
  const activeId = stage?.id ?? hovered
  const theme = activeId ? WORLDS[activeId].takeover : RESTING
  const activeProject = projects.find((p) => p.id === activeId)
  const stageProject = projects.find((p) => p.id === stage?.id)

  const cancelIntent = () => window.clearTimeout(timer.current)
  const closeStage = useCallback(() => {
    window.clearTimeout(timer.current)
    setStage(null)
  }, [])

  const enterTile = (id: string, el: HTMLElement) => {
    setHovered(id)
    cancelIntent()
    if (!canExpand || open) return
    timer.current = window.setTimeout(() => {
      const grid = gridRef.current
      if (!grid) return
      const g = grid.getBoundingClientRect()
      const t = el.getBoundingClientRect()
      const from = { left: t.left - g.left, top: t.top - g.top, width: t.width, height: t.height }
      // a fixed-size window centred on the tile, kept inside the grid
      const width = Math.min(STAGE_SIZE.width, g.width)
      const height = Math.min(STAGE_SIZE.height, g.height)
      const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max))
      setStage({
        id,
        from,
        to: {
          left: clamp(from.left + from.width / 2 - width / 2, g.width - width),
          top: clamp(from.top + from.height / 2 - height / 2, g.height - height),
          width,
          height,
        },
      })
    }, HOVER_INTENT_MS)
  }

  useEffect(() => {
    if (!stage) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeStage()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [stage, closeStage])

  useEffect(() => () => window.clearTimeout(timer.current), [])

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
          <span className="opacity-70">3 live sites · 4 platforms</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(2.6rem,5.6vw,5rem)] leading-[0.88] tracking-tight">
            <span className="font-serif italic">Real</span> <span className="font-mono text-[0.72em] uppercase">work,</span>
            <br />
            <span className="font-grotesk font-bold">running</span>{" "}
            <span className="font-display font-bold">
              live<span className="text-accent">.</span>
            </span>
          </h2>
          <div className="h-12 min-w-56 font-mono md:text-right text-xs uppercase tracking-[0.15em]">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeProject?.id ?? "none"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeProject ? (
                  <>
                    <span className="opacity-60">now inside</span>
                    <span className="block text-base font-bold normal-case tracking-normal">{activeProject.category}</span>
                  </>
                ) : (
                  <span className="opacity-70">
                    <span className="hidden lg:inline">rest on a project — it opens full size ↘</span>
                    <span className="lg:hidden">tap open to see it full size →</span>
                  </span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div
          ref={gridRef}
          onPointerLeave={() => {
            cancelIntent()
            setHovered(null)
            setStage(null)
          }}
          className="track-scroll relative -mx-[clamp(1.25rem,5vw,4rem)] mt-6 flex gap-3 overflow-x-auto px-[clamp(1.25rem,5vw,4rem)] pb-2 md:mx-0 md:grid md:auto-rows-[19rem] md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:h-[clamp(30rem,calc(100svh-17rem),40rem)] lg:auto-rows-auto lg:grid-cols-12 lg:grid-rows-2"
        >
          {projects.map((p, i) => (
            <Tile
              key={p.id}
              project={p}
              order={i}
              reduced={reduced}
              dimmed={activeId !== null && activeId !== p.id}
              onEnter={(el) => enterTile(p.id, el)}
              onLeave={cancelIntent}
              onFocus={() => setHovered(p.id)}
              onOpen={() => {
                closeStage()
                setOpen(p)
              }}
            />
          ))}

          <AnimatePresence>
            {stage && stageProject && (
              <Stage key={stage.id} project={stageProject} from={stage.from} to={stage.to} reduced={reduced} onClose={closeStage} />
            )}
          </AnimatePresence>
        </div>

        {/* the people behind the work — each name lights up its project */}
        <div className="mt-8" onPointerLeave={() => setHovered(null)}>
          <div className="flex flex-wrap items-end justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
            <p>
              <span className="opacity-60">clients</span>
              <span className="block text-sm font-bold normal-case tracking-normal">companies we've built for</span>
            </p>
            <p className="flex items-center gap-2 opacity-70">
              <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />
              dot = see their project
            </p>
          </div>
          <ul data-testid="clients" className="mt-4 grid grid-cols-2 border-l border-t border-current/15 sm:grid-cols-3 lg:grid-cols-6">
            {clients.map((c, i) => {
              const project = c.project ? projects.find((p) => p.id === c.project) : undefined
              const on = project !== undefined && activeId === project.id
              const faded = activeId !== null && !on
              const cell = "flex h-full min-h-[4.5rem] w-full flex-col justify-between gap-2 px-4 py-3 text-left"
              const name = (
                <span className="block">
                  <span className="block font-grotesk text-[clamp(1.05rem,1.45vw,1.35rem)] font-bold leading-tight tracking-tight">{c.name}</span>
                  {c.suffix && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.15em] opacity-60">{c.suffix}</span>}
                </span>
              )
              return (
                <motion.li
                  key={c.name}
                  data-testid={`client-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className={`border-b border-r border-current/15 transition-opacity duration-300 ${faded ? "opacity-35" : ""}`}
                >
                  {project ? (
                    <button
                      type="button"
                      aria-label={`${c.name} — see the project`}
                      onPointerEnter={() => setHovered(project.id)}
                      onFocus={() => setHovered(project.id)}
                      onBlur={() => setHovered(null)}
                      onClick={() => {
                        closeStage()
                        setOpen(project)
                      }}
                      className={`group ${cell} transition-colors hover:bg-current/[0.06]`}
                    >
                      <span className="flex w-full items-center justify-between font-mono text-[10px] opacity-60">
                        {String(i + 1).padStart(2, "0")}
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 rounded-full transition-transform duration-300 ${on ? "scale-150" : ""}`}
                          style={{ background: WORLDS[project.id].tile.accent }}
                        />
                      </span>
                      {name}
                    </button>
                  ) : (
                    <div className={cell}>
                      <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                      {name}
                    </div>
                  )}
                </motion.li>
              )
            })}
            <li className="border-b border-r border-current/15">
              <a
                href="#contact"
                data-testid="client-you"
                className="group flex h-full min-h-[4.5rem] flex-col justify-between gap-2 px-4 py-3 transition-colors hover:bg-accent hover:text-white"
              >
                <span className="font-mono text-[10px] opacity-60">{String(clients.length + 1).padStart(2, "0")}</span>
                <span className="flex items-center gap-1 font-serif text-[clamp(1.05rem,1.45vw,1.35rem)] italic leading-tight">
                  your company?
                  <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <AnimatePresence>{open && <CaseOverlay project={open} onClose={closeCase} />}</AnimatePresence>
    </motion.section>
  )
}
