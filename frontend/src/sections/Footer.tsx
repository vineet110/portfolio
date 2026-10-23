import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ArrowUp, ArrowUpRight } from "lucide-react"
import { whatsappUrl } from "../data/contact"
import { openPalette, scrollToTarget } from "../lib/scroll"

const links = [
  { label: "work", href: "#work" },
  { label: "services", href: "#services" },
  { label: "process", href: "#process" },
  { label: "faq", href: "#faq" },
  { label: "contact", href: "#contact" },
]

const WORDMARK = "let's build."

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] })
  const wordY = useTransform(scrollYProgress, [0, 1], ["40%", "0%"])

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-border bg-bg pt-12 md:pt-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="container-studio"
      >
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div>
            <a href="#top" className="font-display text-2xl font-bold lowercase tracking-tight text-ink">
              studio<span className="text-accent">.</span>
            </a>
            <p className="mt-4 max-w-xs font-mono text-xs leading-relaxed text-ink-dim">
              we make websites and apps. have an idea? we design and build it.
            </p>
            <button
              type="button"
              onClick={openPalette}
              className="mt-5 hidden items-center gap-2 font-mono text-[11px] text-ink-faint transition-colors hover:text-ink md:inline-flex"
            >
              press <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">ctrl</kbd>
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">k</kbd> to navigate
            </button>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim transition-colors hover:text-accent"
            >
              let's connect
              <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <button
              type="button"
              aria-label="Back to top"
              onClick={() => scrollToTarget(0)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink-dim transition-all hover:-translate-y-1 hover:border-accent hover:text-accent"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 font-mono text-[11px] text-ink-faint md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} — all rights reserved.</span>
          <span>designed &amp; built by the studio itself.</span>
        </div>
      </motion.div>

      {/* Oversized closing wordmark — rises into place as the page ends. */}
      <div aria-hidden="true" className="pointer-events-none mt-10 select-none overflow-hidden">
        <motion.p
          style={prefersReducedMotion ? undefined : { y: wordY }}
          className="font-display whitespace-nowrap text-center text-[clamp(3.5rem,12.5vw,15rem)] font-bold leading-[0.8] tracking-tighter"
        >
          <span className="text-outline">{WORDMARK.slice(0, -1)}</span>
          <span className="text-accent">.</span>
        </motion.p>
      </div>
    </footer>
  )
}
