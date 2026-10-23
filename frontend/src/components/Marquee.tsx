import { useRef } from "react"
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion"

type MarqueeProps = {
  items: string[]
  className?: string
  /** base drift, in % of one copy per second (negative = leftward) */
  baseVelocity?: number
}

/**
 * Infinite horizontal ticker that reacts to scrolling: it speeds up with
 * scroll velocity and flips direction when the visitor scrolls back up.
 * Transform-only, so it stays on the GPU; static for reduced motion.
 */
export function Marquee({ items, className = "", baseVelocity = -2.2 }: MarqueeProps) {
  const prefersReducedMotion = useReducedMotion()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false })
  const direction = useRef(1)

  // Four copies; wrapping at -25% (one copy) makes the loop seamless.
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`)

  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return
    let moveBy = direction.current * baseVelocity * (delta / 1000)
    const vf = velocityFactor.get()
    if (vf < 0) direction.current = -1
    else if (vf > 0) direction.current = 1
    moveBy += direction.current * moveBy * vf
    baseX.set(baseX.get() + moveBy)
  })

  const track = [...items, ...items, ...items, ...items]

  return (
    <div className={`overflow-hidden border-y border-border ${className}`}>
      <motion.div style={{ x }} className="flex w-max py-4">
        {track.map((item, i) => (
          <span
            key={i}
            className="mx-6 flex items-center gap-6 font-mono text-sm lowercase tracking-[0.05em] text-ink-dim"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}
