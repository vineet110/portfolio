import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion"
import { WORLDS } from "../themes"

type Node = { id: string; label: string; kind: string; x: number; y: number }

/** positions are fractions of the free space (canvas minus one node) */
const NODES: Node[] = [
  { id: "lead", label: "New lead", kind: "trigger", x: 0.02, y: 0.5 },
  { id: "ai", label: "AI · classify", kind: "step", x: 0.47, y: 0.5 },
  { id: "notify", label: "Notify team", kind: "action", x: 0.98, y: 0.12 },
  { id: "crm", label: "Update records", kind: "action", x: 0.98, y: 0.88 },
]
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
]
const NODE_W = 124
const NODE_H = 44

type Placed = { bx: number; by: number; x: MotionValue<number>; y: MotionValue<number> }

function Edge({ a, b, color, live }: { a: Placed; b: Placed; color: string; live: boolean }) {
  const d = useTransform([a.x, a.y, b.x, b.y], ([ax, ay, bx, by]: number[]) => {
    const x1 = a.bx + ax + NODE_W
    const y1 = a.by + ay + NODE_H / 2
    const x2 = b.bx + bx
    const y2 = b.by + by + NODE_H / 2
    const c = Math.max(30, Math.abs(x2 - x1) / 2)
    return `M${x1} ${y1}C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`
  })
  return (
    <>
      <motion.path d={d} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="3 11"
        strokeLinecap="round"
        className={live ? "animate-flow-dash" : ""}
      />
    </>
  )
}

/**
 * Flow: a visual tool for composing business logic. The nodes are real —
 * drag them around and the wires follow; signals keep running along them.
 */
export function FlowMini({ live }: { live: boolean }) {
  const t = WORLDS.flow.tile
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One pair of drag offsets per node (hooks in a fixed-length list).
  const offsets = [
    { x: useMotionValue(0), y: useMotionValue(0) },
    { x: useMotionValue(0), y: useMotionValue(0) },
    { x: useMotionValue(0), y: useMotionValue(0) },
    { x: useMotionValue(0), y: useMotionValue(0) },
  ]
  const placed: Placed[] = NODES.map((n, i) => ({
    bx: n.x * Math.max(size.w - NODE_W, 0),
    by: n.y * Math.max(size.h - NODE_H, 0),
    ...offsets[i],
  }))

  return (
    <div className="flex h-full flex-col font-grotesk" style={{ background: t.bg, color: t.fg }}>
      <div className="flex items-center justify-between border-b px-4 py-2 text-[11px]" style={{ borderColor: `${t.fg}22` }}>
        <span className="font-bold">flow / lead-routing</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: t.accent }}>
          ▶ running
        </span>
      </div>
      <div
        ref={ref}
        className="relative flex-1 overflow-hidden"
        style={{ backgroundImage: `radial-gradient(${t.fg}26 1px, transparent 1px)`, backgroundSize: "16px 16px" }}
      >
        {size.w > 0 && (
          <>
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
              {EDGES.map(([a, b]) => (
                <Edge key={`${a}-${b}`} a={placed[a]} b={placed[b]} color={t.accent} live={live} />
              ))}
            </svg>
            {NODES.map((n, i) => (
              <motion.div
                key={n.id}
                drag
                dragMomentum={false}
                dragConstraints={ref}
                dragElastic={0.05}
                whileDrag={{ scale: 1.06, rotate: -2 }}
                style={{
                  x: offsets[i].x,
                  y: offsets[i].y,
                  left: placed[i].bx,
                  top: placed[i].by,
                  width: NODE_W,
                  height: NODE_H,
                  borderColor: t.fg,
                  color: t.fg,
                }}
                className="absolute flex cursor-grab touch-none flex-col justify-center rounded-lg border-2 bg-white px-2.5 shadow-[3px_3px_0_0] active:cursor-grabbing"
              >
                <span className="text-[9px] uppercase tracking-[0.15em] opacity-60">{n.kind}</span>
                <span className="text-[12px] font-bold leading-tight">{n.label}</span>
              </motion.div>
            ))}
          </>
        )}
        <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] opacity-60">drag the nodes ↔</span>
      </div>
    </div>
  )
}
