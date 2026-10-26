import { useEffect, useRef } from "react"
import { COLORS } from "./blueprint"

/** how long (ms) a graphite mark lingers before it has fully faded */
const LIFETIME = 1100
const MAX_POINTS = 120

type Point = { x: number; y: number; t: number }

/**
 * A faint graphite line that follows the mouse while the hero is still on
 * paper, fading out behind it. Mouse only (never touch/pen), and the
 * animation loop only runs while there is something left to draw.
 */
export function PencilTrail({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !active) return

    const points: Point[] = []
    let frame = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const draw = () => {
      const now = performance.now()
      while (points.length && now - points[0].t > LIFETIME) points.shift()
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.lineCap = "round"
      ctx.strokeStyle = COLORS.pencil
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        if (b.t - a.t > 80) continue // a pause lifts the pencil
        const life = 1 - (now - b.t) / LIFETIME
        ctx.globalAlpha = 0.38 * life
        ctx.lineWidth = 1.1 + life * 0.8
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      frame = points.length ? requestAnimationFrame(draw) : 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const rect = canvas.getBoundingClientRect()
      // a touch of jitter so it reads as graphite, not a vector line
      points.push({
        x: e.clientX - rect.left + (Math.random() - 0.5) * 0.8,
        y: e.clientY - rect.top + (Math.random() - 0.5) * 0.8,
        t: performance.now(),
      })
      if (points.length > MAX_POINTS) points.shift()
      if (!frame) frame = requestAnimationFrame(draw)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(frame)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}
