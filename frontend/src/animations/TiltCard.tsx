import { useRef, type ReactNode } from "react"
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"

type TiltCardProps = {
  children: ReactNode
  className?: string
  /** maximum rotation in degrees */
  max?: number
  /** show a soft light glare that tracks the pointer */
  glare?: boolean
}

/**
 * Perspective tilt toward the pointer with an optional moving glare —
 * gives a flat screenshot real physical depth. Inert for touch and
 * reduced-motion users (it simply renders its children).
 */
export function TiltCard({ children, className = "", max = 7, glare = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 180, damping: 20, mass: 0.4 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)
  const glareX = useTransform(px, (v) => `${v * 100}%`)
  const glareY = useTransform(py, (v) => `${v * 100}%`)
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 55%)`
  const glareOpacity = useSpring(0, spring)

  if (prefersReducedMotion) return <div className={className}>{children}</div>

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
    glareOpacity.set(1)
  }

  function onLeave() {
    px.set(0.5)
    py.set(0.5)
    glareOpacity.set(0)
  }

  return (
    <div style={{ perspective: 1100 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden="true"
            style={{ background: glareBg, opacity: glareOpacity }}
            className="pointer-events-none absolute inset-0 z-30 mix-blend-overlay"
          />
        )}
      </motion.div>
    </div>
  )
}
