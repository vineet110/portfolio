import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageSquareText, Plus } from "lucide-react"
import { SectionLabel } from "../components/SectionLabel"
import { TypedText } from "../animations/TypedText"
import { MagneticButton } from "../animations/MagneticButton"
import { faqs } from "../data/faq"
import { openChat } from "../lib/scroll"

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative scroll-mt-24 bg-bg-raised py-20 md:py-28">
      <div className="container-studio grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index="05" label="faq" className="mb-6" />
            <h2 className="font-display text-balance text-4xl font-bold leading-[1.02] tracking-tight text-ink sm:text-5xl">
              <TypedText text="Good questions." speed={0.03} cursor={false} />
            </h2>
            <p className="mt-6 max-w-sm text-balance font-mono text-sm leading-relaxed text-ink-dim">
              The things people usually ask before a first conversation.
              Something else on your mind? The assistant answers instantly.
            </p>
            <MagneticButton
              onClick={() => openChat()}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <MessageSquareText size={14} />
              ask the assistant
            </MagneticButton>
          </div>
        </div>

        <div className="lg:col-span-8">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-border first:border-t"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    data-testid={`faq-toggle-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="group flex w-full items-center gap-5 py-6 text-left"
                  >
                    <span className={`font-mono text-xs transition-colors ${isOpen ? "text-accent" : "text-ink-faint"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 font-display text-lg font-bold tracking-tight transition-colors sm:text-xl ${
                        isOpen ? "text-ink" : "text-ink-dim group-hover:text-ink"
                      }`}
                    >
                      {item.q}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen ? "rotate-45 border-accent bg-accent text-ink-inverse" : "border-border text-ink-dim group-hover:border-ink-dim"
                      }`}
                    >
                      <Plus size={15} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pl-10 text-balance text-sm leading-relaxed text-ink-dim sm:text-base">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
