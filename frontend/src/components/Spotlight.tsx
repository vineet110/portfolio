import { useRef, type ReactNode } from "react"

type SpotlightProps = {
  children: ReactNode
  className?: string
  /** CSS colour of the glow */
  color?: string
  size?: number
}

/**
 * A soft glow that follows the pointer across a surface, plus a lit border
 * under the pointer. Driven by two CSS custom properties written straight
 * to the element (no React re-render per mouse move).
 */
export function Spotlight({ children, className = "", color = "rgba(124, 92, 255, 0.14)", size = 420 }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el || e.pointerType !== "mouse") return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`)
    el.style.setProperty("--spot-o", "1")
  }

  function onLeave() {
    ref.current?.style.setProperty("--spot-o", "0")
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`spotlight relative ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: "var(--spot-o, 0)",
          background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  )
}

/**
 * The hero's interactive dot grid: a faint field of dots everywhere, and a
 * brighter accent field revealed only in a circle around the pointer. The
 * parent writes --spot-x / --spot-y / --spot-o (see Hero.tsx).
 */
export function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <div className="dot-grid-base absolute inset-0" />
      <div className="dot-grid-lit absolute inset-0 transition-opacity duration-500" />
    </div>
  )
}
