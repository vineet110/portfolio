import { useEffect, useState } from "react"
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

const INTERACTIVE = "a, button, [role=button], input, select, textarea, label, [data-cursor]"

/**
 * A trailing ring that follows the real cursor (the native cursor stays —
 * this is decoration, never a replacement). It swells over anything
 * interactive and shows a short label for elements that set
 * `data-cursor="view"` etc. Mounted only for fine pointers, and skipped
 * entirely for reduced-motion users.
 */
export function CustomCursor() {
  const prefersReducedMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [label, setLabel] = useState<string | null>(null)
  const [pressed, setPressed] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 420, damping: 34, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 420, damping: 34, mass: 0.5 })

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)")
    const update = () => setEnabled(mq.matches && !prefersReducedMotion)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE) as HTMLElement | null
      setHovering(Boolean(target))
      setLabel(target?.dataset.cursor ?? null)
    }
    const onLeave = () => setVisible(false)
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    window.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const size = label ? 72 : hovering ? 44 : 26

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]">
      <motion.div
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: visible ? 1 : 0 }}
        className="absolute left-0 top-0"
      >
        <motion.div
          animate={{ width: size, height: size, scale: pressed ? 0.85 : 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-200 ${
            label
              ? "border-accent bg-accent text-ink-inverse"
              : hovering
                ? "border-accent/70 bg-accent/10"
                : "border-ink/30"
          }`}
        >
          <AnimatePresence>
            {label && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="font-mono text-[10px] font-medium uppercase tracking-[0.15em]"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      <motion.div
        style={{ x, y }}
        animate={{ opacity: visible && !hovering ? 1 : 0 }}
        className="absolute left-0 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
      />
    </div>
  )
}
