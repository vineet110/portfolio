import { AnimatePresence, motion } from "framer-motion"

const LINES = [
  { text: "$ ship --production", tone: "text-ink-dim" },
  { text: "✓ build", tone: "text-char-green" },
  { text: "✓ tests", tone: "text-char-green" },
  { text: "✓ deploy", tone: "text-char-green" },
  { text: "● live — you're looking at it.", tone: "text-amber" },
]

/** The Launch stage's terminal: one more line per step of scroll. */
export function DeployLog({ step }: { step: number }) {
  return (
    <AnimatePresence>
      {step > 0 && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: 16, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-[22%] right-[-2%] sm:bottom-[30%] z-30 w-[min(300px,62%)] border border-border bg-bg/95 shadow-2xl shadow-black/60 backdrop-blur sm:w-[min(320px,38%)]"
        >
          <div className="border-b border-border px-3 py-1.5 font-mono text-[10px] text-ink-faint">deploy.log</div>
          <ul className="space-y-1 px-3 py-2.5 font-mono text-[11px] sm:text-xs">
            {LINES.slice(0, step).map((l) => (
              <motion.li
                key={l.text}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={l.tone}
              >
                {l.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
