import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  strength?: number
  as?: "button" | "a"
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
}

/**
 * A button that subtly pulls toward the cursor within its bounds, and
 * springs back on leave. Disabled entirely for touch/coarse pointers and
 * for reduced-motion users, where it behaves as a plain button.
 */
export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  as = "button",
  href,
  target,
  rel,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 12, mass: 0.3 })
  const springY = useSpring(y, { stiffness: 150, damping: 12, mass: 0.3 })

  const handleMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(pointer: coarse)").matches) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(relX * strength)
    y.set(relY * strength)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Tag = motion[as]

  return (
    <Tag
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </Tag>
  )
}
