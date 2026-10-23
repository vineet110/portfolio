import { motion } from "framer-motion"
import { whatsappUrl } from "../data/contact"

const links = [
  { label: "work", href: "#work" },
  { label: "services", href: "#services" },
  { label: "process", href: "#process" },
  { label: "contact", href: "#contact" },
]

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-bg py-12 md:py-16">
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

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim transition-colors hover:text-accent"
          >
            let's connect →
          </a>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 font-mono text-[11px] text-ink-faint md:flex-row md:items-center md:justify-between">
          <span>© 2026 — all rights reserved.</span>
          <span>designed &amp; built by the studio itself.</span>
        </div>
      </motion.div>
    </footer>
  )
}
