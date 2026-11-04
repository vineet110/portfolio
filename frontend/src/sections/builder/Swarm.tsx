import { useEffect, useRef } from "react"

const SWARM_MS = 2600
const CONFETTI_MS = 2200
const DOTS = 1500
const PIECES = 170

type Props = {
  /** bump to start a new launch; 0 clears the canvas */
  launchId: number
  color: string
  /** where the customers fly to, as a fraction of the canvas box */
  target: { x: number; y: number }
  onLanded: () => void
}

/**
 * The "go live" moment, drawn on one canvas so thousands of dots stay
 * smooth: customers stream in from every edge into the app, then a burst of
 * confetti in the app's colour.
 */
export function Swarm({ launchId, color, target, onLanded }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const landed = useRef(onLanded)
  useEffect(() => {
    landed.current = onLanded
  }, [onLanded])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!launchId) return

    const tx = target.x * W
    const ty = target.y * H
    const dots = Array.from({ length: DOTS }, () => {
      const side = Math.floor(Math.random() * 4)
      const along = Math.random()
      const sx = side === 0 ? -20 : side === 1 ? W + 20 : along * W
      const sy = side === 2 ? -20 : side === 3 ? H + 20 : along * H
      const dx = tx - sx
      const dy = ty - sy
      const len = Math.hypot(dx, dy) || 1
      return {
        sx,
        sy,
        nx: -dy / len,
        ny: dx / len,
        curve: (Math.random() - 0.5) * 220,
        delay: Math.random() * SWARM_MS * 0.72,
        dur: 650 + Math.random() * 650,
        size: 0.8 + Math.random() * 1.6,
        white: Math.random() < 0.35,
      }
    })
    const palette = [color, "#ffffff", "#ffb020", "#ff6fb0", "#3ecf8e", color]
    const pieces = Array.from({ length: PIECES }, () => {
      const a = Math.random() * Math.PI * 2
      const v = 4 + Math.random() * 11
      return {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 4 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        c: palette[Math.floor(Math.random() * palette.length)],
      }
    })

    const pos = (d: (typeof dots)[number], k: number) => {
      const e = k * k
      const bend = Math.sin(Math.PI * k) * d.curve
      return [d.sx + (tx - d.sx) * e + d.nx * bend, d.sy + (ty - d.sy) * e + d.ny * bend] as const
    }

    let raf = 0
    let didLand = false
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = now - t0
      ctx.clearRect(0, 0, W, H)

      if (t < SWARM_MS + 300) {
        ctx.globalCompositeOperation = "lighter"
        ctx.lineCap = "round"
        for (const d of dots) {
          const k = (t - d.delay) / d.dur
          if (k < 0 || k > 1) continue
          const [x, y] = pos(d, k)
          const [px, py] = pos(d, Math.max(0, k - 0.06))
          ctx.strokeStyle = d.white ? "rgba(255,255,255,0.85)" : color
          ctx.globalAlpha = Math.min(1, k * 6)
          ctx.lineWidth = d.size
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
        // the app glows as it absorbs them
        const pulse = 26 + Math.sin(t / 90) * 6
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, pulse * 3)
        g.addColorStop(0, "rgba(255,255,255,0.35)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.globalAlpha = Math.min(1, t / 600)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(tx, ty, pulse * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }

      if (t >= SWARM_MS) {
        if (!didLand) {
          didLand = true
          landed.current()
        }
        const ct = (t - SWARM_MS) / 1000
        const fade = Math.max(0, 1 - Math.max(0, ct - 1.3) / 0.9)
        ctx.globalAlpha = fade
        for (const p of pieces) {
          const x = tx + p.vx * 60 * ct
          const y = ty + p.vy * 60 * ct + 0.5 * 700 * ct * ct
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(p.rot + p.vr * 60 * ct)
          ctx.fillStyle = p.c
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.restore()
        }
        ctx.globalAlpha = 1
      }

      if (t < SWARM_MS + CONFETTI_MS) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [launchId, color, target.x, target.y])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 h-full w-full" />
}

export const SWARM_DURATION_MS = SWARM_MS
