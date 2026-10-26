import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { Accessibility, Check, Gauge, ShieldCheck, TestTubeDiagonal } from "lucide-react"
import { api } from "../services/api"

/**
 * This site's own, real stack, as an exploded view — the honest version of
 * a "tech we use" section: everything here is what this page is actually
 * built with (see docs/goal.md). No hosting/vendor names — the chatbot's
 * knowledge base keeps infrastructure private, so this does too.
 * Listed top (what you see) to bottom (what holds it up).
 */
const LAYERS = [
  { id: "interface", name: "Interface", items: ["React 19", "TypeScript", "Tailwind CSS", "Framer Motion"], tint: "#7c5cff" },
  { id: "assistant", name: "Assistant", items: ["LLM + retrieval over curated knowledge"], tint: "#ff6fb0" },
  { id: "api", name: "API", items: ["FastAPI", "Pydantic", "SQLAlchemy"], tint: "#4d7bff" },
  { id: "data", name: "Data", items: ["PostgreSQL"], tint: "#ffb020" },
  { id: "quality", name: "Quality", items: ["Playwright", "pytest", "oxlint"], tint: "#3ecf8e" },
] as const

const PRINCIPLES = [
  { icon: Gauge, title: "Fast by default", body: "GPU motion, lazy images, nothing shipped the page doesn't use." },
  { icon: Accessibility, title: "Accessible", body: "Keyboard-friendly, real labels, every animation respects reduced motion." },
  { icon: ShieldCheck, title: "Secure", body: "Secrets stay server-side; inputs validated; the assistant is rate limited." },
  { icon: TestTubeDiagonal, title: "Tested", body: "Browser tests for layout, images, forms and the assistant; API tests for every endpoint." },
]

/** px between layers when fully exploded / collapsed */
const GAP = { open: 76, shut: 8 }
const CYCLE_MS = 2600

type ApiStatus = { state: "idle" | "checking" | "online" | "offline"; ms?: number }

function useApiStatus(enabled: boolean): ApiStatus {
  const [result, setStatus] = useState<ApiStatus | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const started = performance.now()
    api
      .health()
      .then(() => !cancelled && setStatus({ state: "online", ms: Math.round(performance.now() - started) }))
      .catch(() => !cancelled && setStatus({ state: "offline" }))
    return () => {
      cancelled = true
    }
  }, [enabled])

  return result ?? { state: enabled ? "checking" : "idle" }
}

/** What each plane is drawn as — a tiny picture of that layer's job. */
function PlaneArt({ id, tint }: { id: string; tint: string }): ReactNode {
  switch (id) {
    case "interface":
      return (
        <div className="flex h-full flex-col gap-[6%] p-[7%]">
          <div className="flex justify-between">
            <span className="h-2 w-10 rounded-full" style={{ background: tint }} />
            <span className="h-2 w-16 rounded-full bg-white/25" />
          </div>
          <span className="h-[18%] w-[70%] rounded bg-white/80" />
          <span className="h-[8%] w-[50%] rounded bg-white/30" />
          <span className="h-[12%] w-[28%] rounded-full" style={{ background: tint }} />
          <div className="mt-auto grid grid-cols-3 gap-[4%]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="aspect-[4/3] rounded bg-white/15" />
            ))}
          </div>
        </div>
      )
    case "assistant":
      return (
        <div className="flex h-full flex-col justify-center gap-[7%] p-[9%]">
          <span className="ml-auto h-[16%] w-[52%] rounded-full bg-white/25" />
          <span className="h-[16%] w-[70%] rounded-full" style={{ background: tint }} />
          <span className="ml-auto h-[16%] w-[38%] rounded-full bg-white/25" />
        </div>
      )
    case "api":
      return (
        <div className="grid h-full grid-cols-2 content-center gap-[6%] p-[9%] font-mono text-[9px] text-white/80">
          {["/api/chat", "/api/contact", "/api/health", "/api/chat-lead"].map((e) => (
            <span key={e} className="truncate rounded border px-1.5 py-1" style={{ borderColor: `${tint}aa` }}>
              {e}
            </span>
          ))}
        </div>
      )
    case "data":
      return (
        <div className="flex h-full flex-col justify-center gap-[5%] p-[9%]">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="grid grid-cols-[1fr_2fr_1fr] gap-[4%]">
              <span className="h-2 rounded-sm" style={{ background: r === 0 ? tint : `${tint}55` }} />
              <span className="h-2 rounded-sm bg-white/20" />
              <span className="h-2 rounded-sm bg-white/10" />
            </div>
          ))}
        </div>
      )
    default:
      return (
        <div className="grid h-full grid-cols-6 content-center gap-[4%] p-[9%]">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="grid aspect-square place-items-center rounded" style={{ background: `${tint}33` }}>
              <Check className="h-2/3 w-2/3" style={{ color: tint }} />
            </span>
          ))}
        </div>
      )
  }
}

/**
 * Under the hood — this very site, pulled apart into its layers like an
 * engineering drawing. The stack explodes as the section scrolls in; hover
 * or focus a layer and it lifts out, with its real tech beside it.
 */
export function Stack() {
  const ref = useRef<HTMLElement>(null)
  const reduced = Boolean(useReducedMotion())
  const inView = useInView(ref, { amount: 0.3 })
  const seen = useInView(ref, { once: true, amount: 0.3 })
  const status = useApiStatus(seen)
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  // Explosion is driven by scroll, mirrored into a plain motion value so it
  // stays on the JS clock (see the note in Hero.tsx about ViewTimeline).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] })
  const explode = useMotionValue(reduced ? 1 : 0)
  useMotionValueEvent(scrollYProgress, "change", (v) => !reduced && explode.set(v))
  const gap = useTransform(explode, [0.15, 1], [GAP.shut, GAP.open])

  useEffect(() => {
    if (!inView || pinned || reduced) return
    const id = window.setTimeout(() => setActive((i) => (i + 1) % LAYERS.length), CYCLE_MS)
    return () => window.clearTimeout(id)
  }, [inView, pinned, reduced, active])

  const focus = (i: number) => {
    setPinned(true)
    setActive(i)
  }

  const statusText =
    status.state === "online"
      ? `online · ${status.ms}ms`
      : status.state === "offline"
        ? "offline"
        : status.state === "checking"
          ? "checking…"
          : "—"
  const statusDot =
    status.state === "online" ? "bg-char-green" : status.state === "offline" ? "bg-amber" : "bg-ink-faint"

  return (
    <section id="stack" ref={ref} className="blueprint relative scroll-mt-0 overflow-hidden border-t border-border bg-bg py-16 md:py-20">
      <div className="container-studio relative">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
          <span>
            <span className="text-accent">03 //</span> under the hood
          </span>
          <span>fig. 1 — this website, exploded</span>
        </div>

        <h2 className="font-display mt-6 max-w-3xl text-[clamp(2.4rem,5.4vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
          This site is <span className="text-outline">the demo.</span>
        </h2>
        <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-ink-dim">
          Everything you've scrolled through is a real, working product — here it is with the lid off.
        </p>

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* the exploded stack */}
          <div
            aria-hidden="true"
            className="relative mx-auto flex aspect-square w-full max-w-[34rem] items-center justify-center [perspective:1400px]"
            onPointerLeave={() => setPinned(false)}
          >
            <div className="relative h-[52%] w-[52%] [transform-style:preserve-3d] [transform:rotateX(58deg)_rotateZ(-38deg)]">
              {LAYERS.map((layer, i) => (
                <Plane key={layer.id} index={i} gap={gap} lifted={i === active} onEnter={() => focus(i)}>
                  <div
                    className="h-full w-full rounded-xl border bg-[#14131c]/55 transition-[border-color,box-shadow] duration-300"
                    style={{
                      borderColor: i === active ? layer.tint : "rgba(255,255,255,0.12)",
                      boxShadow: i === active ? `0 0 40px -6px ${layer.tint}` : "none",
                    }}
                  >
                    <PlaneArt id={layer.id} tint={layer.tint} />
                  </div>
                </Plane>
              ))}
            </div>
          </div>

          {/* the callouts */}
          <ol className="relative" onPointerLeave={() => setPinned(false)}>
            {LAYERS.map((layer, i) => {
              const on = i === active
              return (
                <li key={layer.id}>
                  <button
                    type="button"
                    data-testid={`stack-layer-${layer.id}`}
                    data-active={on || undefined}
                    aria-pressed={on}
                    onPointerEnter={() => focus(i)}
                    onFocus={() => focus(i)}
                    onClick={() => focus(i)}
                    className="group flex w-full items-start gap-4 border-b border-border py-3.5 text-left first:border-t"
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm transition-transform duration-300"
                      style={{ background: layer.tint, transform: on ? "scale(1.4) rotate(45deg)" : "none" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <h3 className={`font-display text-xl font-bold tracking-tight transition-colors ${on ? "text-ink" : "text-ink-faint"}`}>
                          {layer.name}
                        </h3>
                        <span className="font-mono text-[10px] text-ink-faint">L{LAYERS.length - i}</span>
                      </span>
                      <span className={`mt-1 flex flex-wrap gap-1.5 transition-opacity ${on ? "opacity-100" : "opacity-50"}`}>
                        {layer.items.map((item) => (
                          <span key={item} className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-ink-dim">
                            {item}
                          </span>
                        ))}
                      </span>
                      {layer.id === "api" && (
                        <span data-testid="api-status" className="mt-2 flex items-center gap-2 font-mono text-[11px]">
                          <span className={`inline-block h-2 w-2 rounded-full ${statusDot} ${status.state !== "offline" ? "animate-pulse" : ""}`} />
                          <span className="text-ink-dim">api:</span>
                          <span className="text-ink">{statusText}</span>
                          <span className="text-ink-faint">// live, from your browser</span>
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-bg p-5">
              <span className="flex items-center gap-2">
                <Icon size={15} className="text-accent" />
                <span className="font-display text-sm font-bold text-ink">{title}</span>
              </span>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** One layer of the stack, raised to its height in the explosion. */
function Plane({
  index,
  gap,
  lifted,
  onEnter,
  children,
}: {
  index: number
  gap: MotionValue<number>
  lifted: boolean
  onEnter: () => void
  children: ReactNode
}) {
  // top layer (index 0) sits highest
  const level = LAYERS.length - 1 - index
  const lift = useSpring(0, { stiffness: 260, damping: 22 })
  useEffect(() => {
    lift.set(lifted ? 26 : 0)
  }, [lifted, lift])
  const z = useTransform([gap, lift], ([g, l]: number[]) => (level - (LAYERS.length - 1) / 2) * g + l)
  const transform = useMotionTemplate`translateZ(${z}px)`

  return (
    <motion.div
      onPointerEnter={onEnter}
      style={{ transform }}
      className="absolute inset-0 [transform-style:preserve-3d]"
    >
      {children}
    </motion.div>
  )
}
