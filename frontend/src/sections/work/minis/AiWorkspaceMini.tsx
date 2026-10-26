import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { WORLDS } from "../themes"

const QUESTION = "Which region grew fastest last quarter?"
const ANSWER = "The North-East — mostly repeat orders. Here's the split by region:"
const BARS = [
  { label: "N-E", v: 0.96 },
  { label: "West", v: 0.71 },
  { label: "South", v: 0.58 },
  { label: "Central", v: 0.42 },
]

// Demo figures for a concept dashboard.
const KPIS = [
  { label: "Orders", value: "1,284", spark: "0,12 10,10 20,11 30,7 40,8 50,4 60,3" },
  { label: "Revenue", value: "€84k", spark: "0,13 10,12 20,8 30,9 40,6 50,6 60,2" },
  { label: "Returns", value: "2.1%", spark: "0,3 10,5 20,4 30,8 40,9 50,11 60,13" },
]

/** 0 asking · 1 streaming · 2 chart · then loops */
type Phase = 0 | 1 | 2

/**
 * AI Workspace: a conversational ops console. The question lands, the
 * answer streams in word by word, then a chart builds — and it loops while
 * on screen. Demo data inside a concept UI, not a claim about anyone.
 */
export function AiWorkspaceMini({ live }: { live: boolean }) {
  const t = WORLDS["ai-workspace"].tile
  const [phase, setPhase] = useState<Phase>(2)
  const [chars, setChars] = useState(ANSWER.length)

  useEffect(() => {
    if (!live) return
    let cancelled = false
    const timers: number[] = []
    const run = () => {
      if (cancelled) return
      setPhase(0)
      setChars(0)
      timers.push(
        window.setTimeout(() => {
          setPhase(1)
          let n = 0
          const stream = window.setInterval(() => {
            n += 3
            setChars(Math.min(n, ANSWER.length))
            if (n >= ANSWER.length) {
              window.clearInterval(stream)
              setPhase(2)
              timers.push(window.setTimeout(run, 4200))
            }
          }, 45)
          timers.push(stream)
        }, 900)
      )
    }
    run()
    return () => {
      cancelled = true
      timers.forEach((id) => {
        window.clearTimeout(id)
        window.clearInterval(id)
      })
    }
  }, [live])

  return (
    <div className="flex h-full font-sans" style={{ background: t.bg, color: t.fg }}>
      <div className="hidden w-11 shrink-0 flex-col items-center gap-3 border-r border-white/5 py-4 sm:flex">
        {[t.accent, "#ffffff22", "#ffffff22", "#ffffff22"].map((c, i) => (
          <span key={i} className="h-5 w-5 rounded-md" style={{ background: c }} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-[11px] opacity-60">
          <span>Workspace · Q3 review</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} /> synced
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 pt-3">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <p className="text-[10px] opacity-50">{k.label}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">{k.value}</p>
              <svg viewBox="0 0 60 16" className="mt-1 h-4 w-full" aria-hidden="true">
                <polyline points={k.spark} fill="none" stroke={t.accent} strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-4 py-4 text-[13px] leading-snug">
          <div className="hidden max-w-[85%] self-end rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 opacity-50 md:block">
            Summarise this week's orders
          </div>
          <div className="hidden max-w-[92%] rounded-2xl border border-white/10 px-3.5 py-2 opacity-50 md:block">
            Orders are steady; returns dropped after the sizing guide went live.
          </div>
          <motion.div
            key={`q-${phase === 0 ? "new" : "old"}`}
            initial={live ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2"
          >
            {QUESTION}
          </motion.div>

          {phase > 0 || chars > 0 ? (
            <div className="flex max-w-[92%] gap-2.5">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{ background: t.accent, color: t.bg }}
              >
                <Sparkles size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <p>
                  {ANSWER.slice(0, chars)}
                  {phase === 1 && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-middle" style={{ background: t.accent }} />}
                </p>
                {phase === 2 && (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    {BARS.map((b, i) => (
                      <div key={b.label} className="flex items-center gap-2 text-[11px]">
                        <span className="w-12 opacity-60">{b.label}</span>
                        <motion.span
                          className="h-2 rounded-full"
                          style={{ background: i === 0 ? t.accent : "#ffffff30" }}
                          initial={live ? { width: 0 } : false}
                          animate={{ width: `${b.v * 100}%` }}
                          transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-1 pl-9">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-[12px] opacity-70">
          Ask anything about your business…
          <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: t.accent, color: t.bg }}>
            ↵
          </span>
        </div>
      </div>
    </div>
  )
}
