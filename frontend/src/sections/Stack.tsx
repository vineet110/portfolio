import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { Accessibility, Gauge, ShieldCheck, TestTubeDiagonal } from "lucide-react"
import { SectionLabel } from "../components/SectionLabel"
import { WindowChrome } from "../components/WindowChrome"
import { Spotlight } from "../components/Spotlight"
import { TypedText } from "../animations/TypedText"
import { api } from "../services/api"

/**
 * This site's own, real stack — the honest version of a "tech we use"
 * section: everything listed here is what this page is actually built with
 * (see docs/goal.md "Tech direction"). No hosting/vendor names — the
 * chatbot's knowledge base keeps infrastructure private, so this does too.
 */
const STACK = [
  { layer: "interface", items: ["React 19", "TypeScript", "Tailwind CSS", "Framer Motion"] },
  { layer: "api", items: ["FastAPI", "Pydantic", "SQLAlchemy"] },
  { layer: "data", items: ["PostgreSQL"] },
  { layer: "assistant", items: ["LLM + retrieval over curated knowledge"] },
  { layer: "quality", items: ["Playwright", "pytest", "oxlint"] },
]

const PRINCIPLES = [
  {
    icon: Gauge,
    title: "Fast by default",
    body: "Motion runs on the GPU, images lazy-load, and nothing heavy ships that the page doesn't use.",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    body: "Keyboard-navigable throughout, real labels on every control, and every animation respects reduced motion.",
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    body: "Secrets live server-side only. Inputs are validated at the API, and the assistant is rate limited.",
  },
  {
    icon: TestTubeDiagonal,
    title: "Tested",
    body: "Browser tests cover layout, images, forms, and the assistant; API tests cover every endpoint.",
  },
]

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

export function Stack() {
  const terminalRef = useRef<HTMLDivElement>(null)
  // The health ping only fires once the terminal is actually on screen.
  const inView = useInView(terminalRef, { once: true, amount: 0.4 })
  const prefersReducedMotion = useReducedMotion()
  const status = useApiStatus(inView)

  const statusText =
    status.state === "online"
      ? `online · ${status.ms}ms`
      : status.state === "offline"
        ? "offline"
        : status.state === "checking"
          ? "checking…"
          : "—"
  const statusColor =
    status.state === "online" ? "text-char-green" : status.state === "offline" ? "text-amber" : "text-ink-faint"

  return (
    <section id="stack" className="relative scroll-mt-24 border-t border-border bg-bg py-20 md:py-28">
      <div className="container-studio">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionLabel index="04" label="under the hood" className="mb-6" />
            <h2 className="font-display max-w-xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-ink sm:text-5xl md:text-6xl">
              <TypedText text="This site is the demo." speed={0.03} cursor={false} />
            </h2>
            <p className="mt-6 max-w-md text-balance font-mono text-sm leading-relaxed text-ink-dim">
              Everything you're scrolling through — the motion, the assistant,
              the contact form — is a real, working product. Same team, same
              standards as client work.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-bg"
                >
                  <Spotlight className="h-full p-5">
                    <Icon size={18} className="relative text-accent" />
                    <h3 className="relative mt-4 font-display text-base font-bold tracking-tight text-ink">{title}</h3>
                    <p className="relative mt-1.5 text-sm leading-relaxed text-ink-dim">{body}</p>
                  </Spotlight>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            ref={terminalRef}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 lg:pt-16"
          >
            <WindowChrome label="studio — stack.sh" className="rounded-xl shadow-2xl shadow-black/50">
              <div data-testid="stack-terminal" className="overflow-x-auto px-5 py-6 font-mono text-[13px] leading-7 sm:px-7">
                <p className="text-ink-faint">
                  <span className="text-accent">studio</span>@web:~$ cat stack.json
                </p>
                <div className="mt-2">
                  <span className="text-ink-dim">{"{"}</span>
                  {STACK.map((row, i) => (
                    <motion.div
                      key={row.layer}
                      initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.25 + i * 0.12 }}
                      className="pl-5"
                    >
                      <span className="text-amber">"{row.layer}"</span>
                      <span className="text-ink-faint">: [</span>
                      {row.items.map((item, j) => (
                        <span key={item}>
                          <span className="text-ink">"{item}"</span>
                          {j < row.items.length - 1 && <span className="text-ink-faint">, </span>}
                        </span>
                      ))}
                      <span className="text-ink-faint">]{i < STACK.length - 1 ? "," : ""}</span>
                    </motion.div>
                  ))}
                  <span className="text-ink-dim">{"}"}</span>
                </div>

                <p className="mt-5 text-ink-faint">
                  <span className="text-accent">studio</span>@web:~$ curl /api/health
                </p>
                <p data-testid="api-status" className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      status.state === "online" ? "bg-char-green" : status.state === "offline" ? "bg-amber" : "bg-ink-faint"
                    } ${status.state === "checking" ? "animate-pulse" : ""}`}
                  />
                  <span className="text-ink-dim">api:</span>
                  <span className={statusColor}>{statusText}</span>
                  <span className="ml-1 text-ink-faint">// live request from your browser</span>
                </p>

                <p className="mt-5 text-ink-faint">
                  <span className="text-accent">studio</span>@web:~$ <span className="animate-cursor-blink inline-block h-4 w-2 translate-y-0.5 bg-ink" />
                </p>
              </div>
            </WindowChrome>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
