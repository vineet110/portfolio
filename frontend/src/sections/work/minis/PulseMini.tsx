import { useEffect, useState } from "react"
import { WORLDS } from "../themes"

type Ticker = { sym: string; price: number; open: number; dir: 0 | 1 | -1 }

// Fictional symbols and prices — this is a concept UI with simulated data.
const START: Ticker[] = [
  { sym: "NVX", price: 182.4, open: 180.1, dir: 0 },
  { sym: "ORB", price: 64.12, open: 65.0, dir: 0 },
  { sym: "KLM", price: 9.87, open: 9.6, dir: 0 },
  { sym: "AUR", price: 412.9, open: 409.3, dir: 0 },
]
const HISTORY = 48

function seedHistory() {
  const h = [180]
  for (let i = 1; i < HISTORY; i++) h.push(h[i - 1] + (Math.random() - 0.45) * 1.6)
  return h
}

/**
 * Pulse: a dense, real-time trading terminal that stays legible — every
 * tick flashes green or red, the chart redraws, and nothing jumps around.
 */
export function PulseMini({ live }: { live: boolean }) {
  const t = WORLDS.pulse.tile
  const [rows, setRows] = useState(START)
  const [history, setHistory] = useState(seedHistory)

  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => {
      setRows((rs) =>
        rs.map((r) => {
          const delta = (Math.random() - 0.48) * r.price * 0.004
          return { ...r, price: r.price + delta, dir: delta >= 0 ? 1 : -1 }
        })
      )
      setHistory((h) => [...h.slice(1), h[h.length - 1] + (Math.random() - 0.45) * 1.6])
    }, 750)
    return () => window.clearInterval(id)
  }, [live])

  const min = Math.min(...history)
  const max = Math.max(...history)
  const pts = history.map((v, i) => `${(i / (HISTORY - 1)) * 100},${36 - ((v - min) / (max - min || 1)) * 32}`)
  const up = history[history.length - 1] >= history[0]

  return (
    <div className="flex h-full flex-col font-mono text-[11px]" style={{ background: t.bg, color: t.fg }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: `${t.fg}22` }}>
        <span>PULSE ▸ MARKETS</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse" : ""}`} style={{ background: t.fg }} />
          LIVE
        </span>
      </div>

      <div className="px-3 pt-2">
        <div className="flex items-baseline justify-between">
          <span className="opacity-60">NVX · 1D</span>
          <span className="text-base font-bold">{rows[0].price.toFixed(2)}</span>
        </div>
        <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="mt-1 h-16 w-full">
          <polygon points={`0,38 ${pts.join(" ")} 100,38`} fill={up ? t.fg : t.accent} fillOpacity={0.12} />
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={up ? t.fg : t.accent}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <table className="mt-auto w-full border-t" style={{ borderColor: `${t.fg}22` }}>
        <tbody>
          {rows.map((r) => {
            const chg = ((r.price - r.open) / r.open) * 100
            return (
              <tr key={r.sym} className="border-b last:border-b-0" style={{ borderColor: `${t.fg}14` }}>
                <td className="px-3 py-1.5">{r.sym}</td>
                <td
                  className="px-1 py-1.5 text-right tabular-nums transition-colors duration-300"
                  style={{ color: r.dir === -1 ? t.accent : t.fg, background: r.dir === 0 ? "transparent" : `${r.dir === 1 ? t.fg : t.accent}14` }}
                >
                  {r.price.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: chg < 0 ? t.accent : t.fg }}>
                  {chg >= 0 ? "+" : ""}
                  {chg.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
