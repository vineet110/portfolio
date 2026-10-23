import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { useRef, useState } from "react"
import { Check } from "lucide-react"
import { processCharacters } from "../data/processCharacters"
import { ProcessCharacter } from "../components/ProcessCharacter"
import { media } from "../data/media"
import { SectionLabel } from "../components/SectionLabel"
import { TypedText } from "../animations/TypedText"

const STEP_COUNT = processCharacters.length

export function Process() {
  // A fixed-height scroll track, not the content's natural height, is what
  // actually controls how far the visitor has to scroll — decoupling scroll
  // length from copy length. ~170vh keeps the full five-phase journey inside
  // roughly 1.5–2 viewport heights, per the brief, regardless of how long
  // any phase's description is.
  const trackRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] })
  const [currentIndex, setCurrentIndex] = useState(0)

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setCurrentIndex(Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(v * STEP_COUNT))))
  })

  const active = processCharacters[currentIndex]

  return (
    <section id="process" className="relative scroll-mt-24 bg-bg py-16 md:py-24">
      <div className="container-studio">
        <SectionLabel index="03" label="process" className="mb-4" />
        <h2 className="font-display max-w-xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-ink sm:text-5xl md:text-6xl">
          <TypedText text="One team, five stages." speed={0.032} cursor={false} />
        </h2>
        <p className="mt-4 max-w-md text-balance font-mono text-sm leading-relaxed text-ink-dim">
          One dedicated team takes your idea from concept to launch — not
          five separate hand-offs.
        </p>

        {/* The scroll track — fixed height on desktop so the whole
            five-phase journey takes a controlled, compact amount of
            scrolling; on mobile it's left to natural (short) content
            height, so no track/pin is needed there at all. */}
        <div ref={trackRef} className="relative mt-10 md:mt-12 md:h-[170vh]">
          <div className="grid grid-cols-1 gap-10 md:sticky md:top-28 md:grid-cols-12 md:gap-12">
            {/* The character stage — one shared "world," only one active
                worker shown at a time. */}
            <div className="md:col-span-5">
              <div
                className="relative h-[360px] overflow-hidden rounded-2xl border border-border bg-bg-raised sm:h-[440px] md:h-[500px]"
                data-testid="process-stage"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 24, rotate: -2 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -20, rotate: 2 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.3 }
                        : { type: "spring", stiffness: 220, damping: 20, mass: 0.6 }
                    }
                    className="absolute inset-0 flex items-center justify-center p-6 pb-16"
                    data-testid="process-active-character"
                    data-phase={active.id}
                  >
                    <ProcessCharacter image={active.image} alt={active.alt} colorVar={active.color} className="max-w-[280px]" />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-bg-raised/90 px-4 py-3 backdrop-blur-sm">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
                    {active.phase}/05 — {active.title}
                  </span>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {processCharacters.map((c, i) => (
                      <span
                        key={c.id}
                        className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: i <= currentIndex ? `var(--color-${c.color})` : "var(--color-border)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* The phase list — all five stay visible at once (this is a
                stepper, not a scroll-past list), only their done/running/
                queued state changes as the same scroll progress that drives
                the character above advances. */}
            <div className="md:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="border-l border-border pl-6 sm:pl-10"
              >
                {processCharacters.map((step, i) => {
                  const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming"
                  return (
                    <div key={step.id} className="relative py-3 transition-opacity duration-300 sm:py-4" style={{ opacity: state === "upcoming" ? 0.5 : 1 }}>
                      <span
                        className={`absolute -left-[calc(1.5rem+5px)] top-5 h-2.5 w-2.5 rounded-full transition-colors duration-300 sm:-left-[calc(2.5rem+5px)] ${
                          state === "upcoming" ? "border border-ink-faint bg-bg" : ""
                        }`}
                        style={state !== "upcoming" ? { backgroundColor: `var(--color-${step.color})` } : undefined}
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-ink-faint">
                        <span>{step.phase}</span>
                        <span style={state !== "upcoming" ? { color: `var(--color-${step.color})` } : undefined}>
                          {state === "done" ? (
                            <span className="inline-flex items-center gap-1">
                              <Check size={12} /> done
                            </span>
                          ) : state === "current" ? (
                            "running"
                          ) : (
                            "queued"
                          )}
                        </span>
                      </div>
                      <h3 className="font-display mt-0.5 text-lg font-bold tracking-tight text-ink sm:text-xl">{step.title}</h3>
                      {state === "current" && (
                        <p className="mt-1 max-w-md text-balance text-sm leading-relaxed text-ink-dim">{step.description}</p>
                      )}
                    </div>
                  )
                })}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex items-center gap-5 border-t border-border pt-6"
              >
                <img
                  src={media.team.src}
                  alt={media.team.alt}
                  className="h-12 w-12 shrink-0 rounded-full object-cover grayscale"
                  loading="lazy"
                />
                <p className="max-w-md text-balance font-mono text-sm leading-relaxed text-ink-dim">
                  <span className="text-amber">//</span> a dedicated team takes your
                  idea from concept to launch, and stays close after.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
