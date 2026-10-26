import { motion, type MotionValue } from "framer-motion"
import { STAGES } from "./blueprint"

type Props = {
  active: number
  progress: MotionValue<number>
  /** paper (dark text) or ink (light text) */
  onPaper: boolean
}

/**
 * Names the five stages beside the artboard as the scroll builds it — this
 * is the site's Process section now. Desktop shows the full list with the
 * active stage's description; small screens get the compact strip below.
 */
export function StageRail({ active, progress, onPaper }: Props) {
  const tone = onPaper ? "text-[#2f2b26]" : "text-ink"
  const dim = onPaper ? "text-[#8a8377]" : "text-ink-faint"

  return (
    <div className="hidden lg:block">
      <h2 className={`font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${dim}`}>
        One team, five stages.
      </h2>
      <div className="relative mt-6 pl-5">
        <span className={`absolute left-0 top-1 bottom-1 w-px ${onPaper ? "bg-[#d4ccbc]" : "bg-border"}`} />
        <motion.span
          className="absolute left-0 top-1 bottom-1 w-px origin-top bg-accent"
          style={{ scaleY: progress }}
        />
        <ol className="space-y-5">
          {STAGES.map((s, i) => (
            <li key={s.id} data-active={i === active || undefined}>
              <h3
                className={`flex items-baseline gap-2.5 font-display text-lg font-bold tracking-tight transition-colors duration-500 ${
                  i === active ? tone : dim
                }`}
              >
                <span className={`font-mono text-[10px] font-normal ${i === active ? "text-accent" : ""}`}>
                  {s.phase}
                </span>
                {s.title}
              </h3>
              <motion.p
                initial={false}
                animate={{ height: i === active ? "auto" : 0, opacity: i === active ? 1 : 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`overflow-hidden text-sm leading-relaxed transition-colors duration-500 ${
                  onPaper ? "text-[#5d574d]" : "text-ink-dim"
                }`}
              >
                <span className="block pt-1.5">{s.description}</span>
              </motion.p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** Small-screen version: phase counter, a five-segment bar, one line of copy. */
export function StageStrip({ active, onPaper }: Omit<Props, "progress">) {
  const s = STAGES[active]
  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          {s.phase} / 05
        </span>
        <span className={`font-display text-sm font-bold ${onPaper ? "text-[#2f2b26]" : "text-ink"}`}>{s.title}</span>
        <span className="ml-auto flex gap-1" aria-hidden="true">
          {STAGES.map((x, i) => (
            <span
              key={x.id}
              className={`h-1 w-5 rounded-full transition-colors duration-300 ${
                i <= active ? "bg-accent" : onPaper ? "bg-[#d4ccbc]" : "bg-border"
              }`}
            />
          ))}
        </span>
      </div>
      <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${onPaper ? "text-[#5d574d]" : "text-ink-dim"}`}>
        {s.description}
      </p>
    </div>
  )
}
