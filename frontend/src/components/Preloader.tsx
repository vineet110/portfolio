import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

const BOOT_LINES = [
  "mounting interface",
  "loading selected work",
  "warming up the assistant",
  "ready",
]

const LINE_INTERVAL_MS = 220
const SESSION_KEY = "studio:booted"

function shouldBoot(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1"
  } catch {
    return true
  }
}

/**
 * A short "Studio OS" boot sequence, shown once per browser session. It
 * never blocks the page: the overlay ignores pointer events from the first
 * frame, so anything underneath is already clickable while it fades out.
 */
export function Preloader() {
  const [show, setShow] = useState(shouldBoot)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      // storage blocked — the intro just plays again next time
    }
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      setStep(count)
      if (count > BOOT_LINES.length) {
        window.clearInterval(timer)
        setShow(false)
      }
    }, LINE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [show])

  const progress = Math.min(1, step / BOOT_LINES.length)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden="true"
          data-testid="preloader"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          style={{ clipPath: "inset(0 0 0% 0)" }}
          className="pointer-events-none fixed inset-0 z-[100] flex items-end bg-bg"
        >
          <div className="container-studio w-full pb-12 md:pb-16">
            <div className="flex flex-col gap-1.5 font-mono text-xs text-ink-faint sm:text-sm">
              {BOOT_LINES.slice(0, step).map((line, i) => (
                <motion.p key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  <span className={i === BOOT_LINES.length - 1 ? "text-accent" : "text-ink-dim"}>
                    {i === BOOT_LINES.length - 1 ? "✓" : "›"}
                  </span>{" "}
                  {line}
                </motion.p>
              ))}
            </div>

            <div className="mt-8 flex items-end justify-between gap-6">
              <p className="font-display text-[clamp(3rem,12vw,9rem)] font-bold leading-[0.85] tracking-tighter text-ink">
                studio<span className="text-accent">.</span>
              </p>
              <p className="font-mono text-sm tabular-nums text-ink-dim">{String(Math.round(progress * 100)).padStart(3, "0")}%</p>
            </div>

            <div className="mt-6 h-px w-full bg-border">
              <motion.div
                className="h-px origin-left bg-accent"
                animate={{ scaleX: progress }}
                transition={{ duration: LINE_INTERVAL_MS / 1000, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
