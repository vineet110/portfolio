import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { services, type Service } from "../data/services"
import { DesignForm, MobileForm, WebForm } from "./services/Device"

/** how long each form holds before the device morphs on its own */
const CYCLE_MS = 5200

/**
 * The device's body per service, as a share of the square stage: a wide
 * browser, a tall phone, an open design canvas. Animating between these
 * is what makes it read as one object changing shape.
 */
const FORMS: Record<string, { w: string; h: string; r: number; word: string }> = {
  websites: { w: "100%", h: "68%", r: 14, word: "WEB" },
  mobile: { w: "48%", h: "96%", r: 34, word: "APPS" },
  design: { w: "100%", h: "80%", r: 6, word: "UI/UX" },
}

function Form({ service, live }: { service: Service; live: boolean }) {
  if (service.id === "mobile") return <MobileForm service={service} live={live} />
  if (service.id === "design") return <DesignForm service={service} live={live} />
  return <WebForm service={service} live={live} />
}

/**
 * Services — one object, three forms. The studio sells exactly three
 * services (see docs/goal.md); picking one morphs a single device between
 * a browser, a phone and a design canvas, each running a small live UI.
 * Cycles on its own while on screen until the visitor takes over.
 */
export function Services() {
  const ref = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduced = Boolean(useReducedMotion())
  const inView = useInView(ref, { amount: 0.35 })
  const [active, setActive] = useState(0)
  const [userPicked, setUserPicked] = useState(false)
  const autoplay = inView && !reduced && !userPicked
  const service = services[active]
  const form = FORMS[service.id]

  useEffect(() => {
    if (!autoplay) return
    const id = window.setTimeout(() => setActive((i) => (i + 1) % services.length), CYCLE_MS)
    return () => window.clearTimeout(id)
  }, [autoplay, active])

  const pick = (i: number) => {
    setUserPicked(true)
    setActive(i)
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (i + delta + services.length) % services.length
    pick(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section id="services" ref={ref} className="relative scroll-mt-0 overflow-hidden bg-bg py-16 md:py-20">
      {/* the giant word behind everything, swapping with the form */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[-0.12em] select-none overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={form.word}
            initial={{ x: "30%", opacity: 0 }}
            animate={{ x: "0%", opacity: 1 }}
            exit={{ x: "-30%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-outline font-display whitespace-nowrap text-right text-[clamp(8rem,26vw,24rem)] font-bold leading-none tracking-tighter"
          >
            {form.word}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="container-studio relative">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
          <span>
            <span className="text-accent">02 //</span> services
          </span>
          <span>one team · three things · no packages</span>
        </div>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-16">
          <div>
            <h2 className="sr-only">Three services, one team.</h2>
            <div role="tablist" aria-label="Services" aria-orientation="vertical" className="flex flex-col">
              {services.map((s, i) => {
                const on = i === active
                return (
                  <button
                    key={s.id}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`service-tab-${s.id}`}
                    aria-selected={on}
                    aria-controls="service-panel"
                    tabIndex={on ? 0 : -1}
                    data-testid={`service-toggle-${s.id}`}
                    onClick={() => pick(i)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className="group relative py-2 text-left sm:py-3"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className={`font-mono text-xs transition-colors ${on ? "text-accent" : "text-ink-faint"}`}>{s.index}</span>
                      <h3
                        className={`font-display text-[clamp(2.4rem,6.4vw,5.6rem)] font-bold leading-[0.95] tracking-tighter transition-all duration-500 ${
                          on ? "translate-x-0 text-ink" : "text-outline group-hover:translate-x-2"
                        }`}
                      >
                        {s.name}
                      </h3>
                    </span>
                    {/* time left before the device morphs on its own */}
                    <span className="ml-8 mt-2 block h-px overflow-hidden bg-border">
                      {on && (
                        <motion.span
                          key={`${active}-${autoplay}`}
                          className="block h-full origin-left bg-accent"
                          initial={{ scaleX: autoplay ? 0 : 1 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: autoplay ? CYCLE_MS / 1000 : 0, ease: "linear" }}
                        />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={service.id}
                data-testid={`service-detail-${service.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="ml-8 mt-8 max-w-lg"
              >
                <p className="text-lg font-medium leading-snug text-ink">{service.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{service.detail}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {service.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-ink-dim"
                    >
                      <ArrowUpRight size={11} className="text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* the shape-shifting device */}
          <div
            id="service-panel"
            role="tabpanel"
            aria-labelledby={`service-tab-${service.id}`}
            className="relative mx-auto flex aspect-square w-full max-w-[32rem] items-center justify-center"
          >
            <motion.div
              data-testid="service-device"
              data-form={service.id}
              initial={false}
              animate={{ width: form.w, height: form.h, borderRadius: form.r }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 18 }}
              className="relative overflow-hidden border border-border bg-bg-raised shadow-[0_40px_120px_-30px_rgba(124,92,255,0.45)]"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="absolute inset-0"
                >
                  <Form service={service} live={inView && !reduced} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
