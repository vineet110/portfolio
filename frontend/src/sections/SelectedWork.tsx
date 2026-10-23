import { useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { projects, type Project } from "../data/projects"
import { WindowChrome } from "../components/WindowChrome"
import { TypedText } from "../animations/TypedText"
import { SectionLabel } from "../components/SectionLabel"

const TAB_TINTS = ["", "mix-blend-multiply bg-accent/15", "mix-blend-multiply bg-amber/15"]
const PROJECT_COUNT = projects.length

function IndexItem({ project, isActive, onSelect }: { project: Project; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      data-testid={`work-index-${project.id}`}
      data-active={isActive}
      onClick={onSelect}
      className={`group flex w-full items-baseline gap-4 border-b border-border py-3 text-left transition-colors first:border-t sm:py-3.5 ${
        isActive ? "text-ink" : "text-ink-faint hover:text-ink-dim"
      }`}
    >
      <span className={`font-mono text-xs ${isActive ? "text-accent" : ""}`}>{project.index}</span>
      <div className="flex-1">
        <h3 className="font-display text-lg font-bold tracking-tight sm:text-xl">{project.name}</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{project.category}</span>
      </div>
      <ArrowUpRight
        size={18}
        className={`shrink-0 transition-all duration-300 ${
          isActive ? "translate-x-0 opacity-100 text-accent" : "-translate-x-1 opacity-0 group-hover:opacity-60"
        }`}
      />
    </button>
  )
}

function ProjectWindow({ project, dominant }: { project: Project; dominant: boolean }) {
  const [activePage, setActivePage] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div data-testid={dominant ? "work-active-window" : undefined}>
      <WindowChrome label={`${project.id}.app — ${project.pages[activePage].toLowerCase()}`}>
        <div className="relative h-[220px] w-full overflow-hidden sm:h-[300px] md:h-[360px]">
          <img src={project.image.src} alt={project.image.alt} className="h-full w-full object-cover" loading="lazy" />
          {prefersReducedMotion ? (
            <div className={`absolute inset-0 ${TAB_TINTS[activePage % TAB_TINTS.length]}`} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`absolute inset-0 ${TAB_TINTS[activePage % TAB_TINTS.length]}`}
              />
            </AnimatePresence>
          )}
          <span
            data-testid={dominant ? "work-status-badge" : undefined}
            className="absolute left-3 top-3 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink"
          >
            {project.status}
          </span>
        </div>

        {dominant && (
          <div className="relative flex border-t border-border">
            {!prefersReducedMotion && (
              <motion.span
                layoutId="work-tab-indicator"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 bg-accent/25"
                style={{ width: `${100 / project.pages.length}%`, left: `${(100 / project.pages.length) * activePage}%` }}
              />
            )}
            {project.pages.map((page, i) => (
              <button
                key={page}
                type="button"
                onClick={() => setActivePage(i)}
                className={`relative z-10 flex-1 border-r border-border py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors last:border-r-0 ${
                  activePage === i ? "text-ink" : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </WindowChrome>
    </div>
  )
}

export function SelectedWork() {
  const trackRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const active = projects[activeIndex]

  // A fixed-height scroll track (not the content's natural height) controls
  // how far the visitor scrolls to move through all five projects — the
  // whole journey stays inside ~2.2 viewport heights on desktop, regardless
  // of how much project copy exists. On mobile there's no explicit height
  // (and no sticky pin below), so it's naturally short.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] })

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(Math.min(PROJECT_COUNT - 1, Math.max(0, Math.floor(v * PROJECT_COUNT))))
  })

  function goToIndex(i: number) {
    setActiveIndex(i)
    const track = trackRef.current
    if (!track) return
    // useScroll's "start start" → "end end" maps v=0 to scrollY===trackTop
    // and v=1 to scrollY===trackTop + (trackHeight - viewportHeight) — the
    // pin range, not the full track height — so the scroll target must use
    // that same denominator or it overshoots/undershoots the intended band.
    const pinRange = track.offsetHeight - window.innerHeight
    if (pinRange <= 0) return // mobile / no pin range — click state alone is enough
    const rect = track.getBoundingClientRect()
    const trackTop = window.scrollY + rect.top
    const fraction = (i + 0.5) / PROJECT_COUNT
    window.scrollTo({ top: trackTop + fraction * pinRange, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }

  const prevProject = projects[(activeIndex - 1 + PROJECT_COUNT) % PROJECT_COUNT]
  const nextProject = projects[(activeIndex + 1) % PROJECT_COUNT]

  return (
    <section id="work" className="relative scroll-mt-24 bg-bg py-16 md:py-24">
      <div className="container-studio">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="01" label="work" className="mb-6" />
            <h2 className="font-display max-w-2xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-ink sm:text-5xl md:text-6xl">
              <TypedText text="Made by our team." speed={0.03} cursor={false} />
            </h2>
            <p className="mt-4 max-w-md text-balance font-mono text-xs leading-relaxed text-ink-dim">
              From early ideas to larger digital products, we design and
              build websites and apps from start to finish.
            </p>
          </div>
          <p className="max-w-sm text-balance font-mono text-xs leading-relaxed text-ink-dim">
            Studio-built concepts and experiments — a look at how we think,
            design, and build. Not real client work. Select one to bring it
            forward.
          </p>
        </div>

        {/* The kinetic project stage — one viewport, five projects, rather
            than five cards stacked down the page. */}
        <div ref={trackRef} className="relative mt-8 md:mt-10 md:h-[220vh]">
          <div className="grid grid-cols-1 gap-8 md:sticky md:top-28 md:grid-cols-12 md:gap-8">
            {/* accessible primary selector — the definitive way to browse,
                on both desktop and mobile, and always keyboard-reachable */}
            <div className="md:col-span-4">
              {projects.map((project, i) => (
                <IndexItem
                  key={project.id}
                  project={project}
                  isActive={i === activeIndex}
                  onSelect={() => goToIndex(i)}
                />
              ))}
            </div>

            <div className="md:col-span-8">
              <div
                className="relative h-[300px] overflow-hidden rounded-2xl border border-border bg-bg-raised sm:h-[400px] md:h-[480px]"
                data-testid="work-stage"
              >
                {/* Secondary windows — depth, not clutter: only the
                    immediate neighbors, well behind and dimmed, never
                    covering the active window's readability. */}
                {!prefersReducedMotion && (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => goToIndex((activeIndex - 1 + PROJECT_COUNT) % PROJECT_COUNT)}
                      aria-label={`Go to ${prevProject.name}`}
                      initial={false}
                      animate={{ opacity: 0.35, scale: 0.82, rotate: -6, x: "-58%", y: "-6%" }}
                      className="absolute left-1/2 top-1/2 z-0 w-[70%] -translate-x-1/2 -translate-y-1/2"
                    >
                      <WindowChrome label={`${prevProject.id}.app`} className="shadow-xl shadow-black/40">
                        <img src={prevProject.image.src} alt={prevProject.image.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </WindowChrome>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => goToIndex((activeIndex + 1) % PROJECT_COUNT)}
                      aria-label={`Go to ${nextProject.name}`}
                      initial={false}
                      animate={{ opacity: 0.4, scale: 0.86, rotate: 6, x: "58%", y: "8%" }}
                      className="absolute left-1/2 top-1/2 z-0 w-[70%] -translate-x-1/2 -translate-y-1/2"
                    >
                      <WindowChrome label={`${nextProject.id}.app`} className="shadow-xl shadow-black/40">
                        <img src={nextProject.image.src} alt={nextProject.image.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </WindowChrome>
                    </motion.button>
                  </>
                )}

                {/* The active project — one application window replacing
                    another, like a creative-software workspace switch. */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24, rotate: -1.5 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -18, rotate: 1.5 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.3 }
                        : { type: "spring", stiffness: 220, damping: 22, mass: 0.6 }
                    }
                    className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6"
                  >
                    <div className="w-full max-w-[560px]">
                      <ProjectWindow project={active} dominant />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-border bg-bg-raised/90 px-4 py-2.5 backdrop-blur-sm">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
                    {active.index}/{String(PROJECT_COUNT).padStart(2, "0")} — {active.name}
                  </span>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {projects.map((p, i) => (
                      <span
                        key={p.id}
                        className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i === activeIndex ? "var(--color-accent)" : "var(--color-border)" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <p className="max-w-md text-balance text-sm leading-relaxed text-ink-dim">{active.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {active.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 font-mono text-xs italic text-ink-faint">// concept exploration — not a live client site</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
