import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { services } from "../data/services"
import { SectionLabel } from "../components/SectionLabel"
import { TypedText } from "../animations/TypedText"
import { Spotlight } from "../components/Spotlight"

const STYLES = {
  accent: { text: "text-accent", bar: "bg-accent", tint: "bg-accent/15" },
  amber: { text: "text-amber", bar: "bg-amber", tint: "bg-amber/15" },
  mono: { text: "text-ink", bar: "bg-ink-dim", tint: "bg-ink/10" },
} as const

const SPOT_COLORS = {
  accent: "rgba(124, 92, 255, 0.12)",
  amber: "rgba(255, 176, 32, 0.09)",
  mono: "rgba(243, 240, 234, 0.07)",
} as const

function ServiceModule({
  service,
  isOpen,
  onToggle,
}: {
  service: (typeof services)[number]
  isOpen: boolean
  onToggle: () => void
}) {
  const style = STYLES[service.color]

  return (
    <Spotlight className="border-b border-border first:border-t" color={SPOT_COLORS[service.color]}>
      <button
        type="button"
        data-testid={`service-toggle-${service.id}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group relative flex w-full items-center gap-4 py-6 text-left transition-colors md:gap-6 md:py-8"
      >
        <ChevronRight
          size={16}
          className={`shrink-0 transition-transform duration-300 ${style.text} ${isOpen ? "rotate-90" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <span className={`block font-mono text-[11px] uppercase tracking-[0.1em] ${isOpen ? style.text : "text-ink-faint"}`}>
            $ service --{service.id}
          </span>
          <h3 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 sm:text-3xl md:text-4xl">
            {service.name}
          </h3>
        </div>
        <span className="font-mono text-xs text-ink-faint">{service.index}/03</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
            data-testid={`service-detail-${service.id}`}
          >
            <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-12 md:gap-10 md:pl-10">
              <div className="md:col-span-6">
                <p className="text-lg font-medium leading-snug text-ink">{service.summary}</p>
                <p className="mt-3 max-w-md text-balance text-sm leading-relaxed text-ink-dim">{service.detail}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 font-mono text-sm text-ink-dim">
                      <ArrowUpRight size={13} className={style.text} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group/img relative aspect-[16/10] overflow-hidden md:col-span-6">
                <img
                  src={service.image.src}
                  alt={service.image.alt}
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/img:scale-105"
                  loading="lazy"
                />
                <div className={`absolute inset-0 mix-blend-multiply ${style.tint}`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Spotlight>
  )
}

export function Services() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="services" className="relative scroll-mt-24 bg-bg-raised py-20 md:py-28">
      <div className="container-studio">
        <SectionLabel index="02" label="services" className="mb-6" />
        <h2 className="font-display max-w-2xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-ink sm:text-5xl md:text-6xl">
          <TypedText text="Three modules. No bloat." speed={0.028} cursor={false} />
        </h2>
        <p className="mt-6 max-w-lg text-balance font-mono text-sm leading-relaxed text-ink-dim">
          No giant service list, no packages. Every project starts as a
          conversation, scoped to what it actually needs.
        </p>

        <div className="mt-10">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <ServiceModule
                service={service}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex((v) => (v === i ? -1 : i))}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
