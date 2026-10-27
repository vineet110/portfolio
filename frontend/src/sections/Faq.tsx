import { useEffect, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion"
import { MessageSquareText, RotateCcw, Sparkles } from "lucide-react"
import { faqs } from "../data/faq"
import { openChat } from "../lib/scroll"

/** how long the studio "types" before an answer lands */
const TYPING_MS = 750

type Turn = { q: number; answered: boolean }

/**
 * FAQ as a conversation. The questions are message chips; tapping one
 * flies it into the thread (a shared layout animation), the studio types,
 * and the answer arrives as a reply. Answers mirror the Studio Assistant's
 * knowledge base (see data/faq.ts), and the full list is always present
 * for screen readers and crawlers.
 */
export function Faq() {
  const reduced = Boolean(useReducedMotion())
  const [turns, setTurns] = useState<Turn[]>([{ q: 0, answered: true }])
  const threadRef = useRef<HTMLDivElement>(null)
  const asked = new Set(turns.map((t) => t.q))
  const remaining = faqs.map((_, i) => i).filter((i) => !asked.has(i))
  const typing = turns.some((t) => !t.answered)

  const ask = (q: number) => {
    if (typing) return
    setTurns((ts) => [...ts, { q, answered: reduced }])
  }

  // Let the studio "type", then land the answer.
  useEffect(() => {
    if (!typing) return
    const id = window.setTimeout(() => setTurns((ts) => ts.map((t) => ({ ...t, answered: true }))), TYPING_MS)
    return () => window.clearTimeout(id)
  }, [typing])

  // Keep the newest message in view inside the thread.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [turns, reduced])

  return (
    <section id="faq" className="relative scroll-mt-0 overflow-hidden bg-bg-raised py-16 md:py-20">
      <div className="container-studio">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
          <span>
            <span className="text-accent">04 //</span> faq
          </span>
          <span>tap a question — we'll answer</span>
        </div>

        <LayoutGroup>
          {/* phones: heading, chat, questions — so an answer appears just above where you tapped */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-0">
            <div>
              <h2 className="font-display text-[clamp(2.4rem,5.4vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
                Ask us <span className="font-hand text-[1.15em] font-bold text-accent">anything.</span>
              </h2>
              <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-ink-dim">
                The things people usually ask before a first conversation.
              </p>
            </div>

            <div className="order-last lg:order-none lg:col-start-1 lg:row-start-2">
              <ul className="lg:mt-8 flex flex-wrap gap-2.5" aria-label="Questions">
                <AnimatePresence initial={false}>
                  {remaining.map((i) => (
                    <motion.li key={i} layout exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <motion.button
                        type="button"
                        layoutId={reduced ? undefined : `faq-q-${i}`}
                        data-testid={`faq-toggle-${i}`}
                        onClick={() => ask(i)}
                        disabled={typing}
                        className="rounded-2xl rounded-br-md border border-border bg-bg px-4 py-2.5 text-left text-sm text-ink-dim transition-colors hover:border-accent hover:text-ink disabled:cursor-wait"
                        whileHover={reduced ? undefined : { y: -2 }}
                        whileTap={reduced ? undefined : { scale: 0.96 }}
                      >
                        {faqs[i].q}
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {remaining.length === 0 && (
                  <li className="font-mono text-xs text-ink-faint">That's every question we usually get.</li>
                )}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openChat()}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-mono text-xs uppercase tracking-[0.1em] text-ink-inverse transition-colors hover:bg-accent-dim"
                >
                  <MessageSquareText size={14} />
                  ask the assistant something else
                </button>
                {turns.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTurns([{ q: 0, answered: true }])}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] text-ink-dim transition-colors hover:text-ink"
                  >
                    <RotateCcw size={13} />
                    start over
                  </button>
                )}
              </div>
            </div>

            {/* the conversation */}
            <div className="flex h-[min(36rem,60svh)] flex-col overflow-hidden rounded-3xl lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[min(36rem,72svh)] border border-border bg-bg shadow-[0_40px_100px_-40px_rgba(124,92,255,0.35)]">
              <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-ink-inverse">
                  <Sparkles size={16} />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-sm font-bold text-ink">sapvy.</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
                    <span className="h-1.5 w-1.5 rounded-full bg-char-green" /> usually replies instantly
                  </span>
                </span>
              </div>

              <motion.div
                ref={threadRef}
                layoutScroll
                data-lenis-prevent
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5"
              >
                <Reply>Hi! Ask us anything about working together — tap a question.</Reply>
                {turns.map((t) => (
                  <div key={t.q} className="flex flex-col gap-3">
                    <motion.p
                      layoutId={reduced ? undefined : `faq-q-${t.q}`}
                      className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-ink-inverse"
                    >
                      {faqs[t.q].q}
                    </motion.p>
                    {t.answered ? (
                      <Reply>{faqs[t.q].a}</Reply>
                    ) : (
                      <span aria-label="sapvy is typing" className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-bg-line px-4 py-3">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            className="h-1.5 w-1.5 rounded-full bg-ink-dim"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.12 }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </motion.div>

              <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-ink-faint">
                {remaining.length ? `${remaining.length} more questions ←` : "all caught up ✓"}
              </div>
            </div>
          </div>
        </LayoutGroup>

        {/* the whole FAQ, always available to screen readers and crawlers */}
        <dl className="sr-only">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Reply({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="max-w-[88%] origin-bottom-left rounded-2xl rounded-bl-md bg-bg-line px-4 py-2.5 text-sm leading-relaxed text-ink"
    >
      {children}
    </motion.p>
  )
}
