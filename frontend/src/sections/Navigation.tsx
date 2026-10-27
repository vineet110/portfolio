import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Command, Menu, X } from "lucide-react"
import { whatsappUrl } from "../data/contact"
import { openPalette } from "../lib/scroll"

const links = [
  { label: "work", href: "#work" },
  { label: "services", href: "#services" },
  { label: "process", href: "#process" },
  { label: "contact", href: "#contact" },
]

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  // Whichever linked section currently spans the middle of the viewport
  // is "active" — drives the sliding pill behind the dock links.
  useEffect(() => {
    // Observe every section (not just the linked ones), so scrolling into
    // an unlinked section like FAQ clears the pill instead of leaving a
    // stale one behind.
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`)
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    sections.forEach((el) => observer.observe(el))
    const onTop = () => {
      if (window.scrollY < window.innerHeight * 0.5) setActiveSection(null)
    }
    window.addEventListener("scroll", onTop, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onTop)
    }
  }, [])

  const highlighted = hovered ?? activeSection

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 md:top-5">
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0, scale: scrolled ? 0.97 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`flex w-full max-w-2xl items-center justify-between gap-2 rounded-full border border-border bg-bg-raised/85 px-2.5 py-2 backdrop-blur-md transition-[box-shadow,backdrop-filter] duration-500 md:w-auto md:justify-start ${
            scrolled ? "shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl" : ""
          }`}
        >
          <a href="#top" className="font-display shrink-0 px-2.5 text-sm font-bold lowercase tracking-tight text-ink">
            sapvy<span className="text-accent">.</span>
          </a>

          <span className="hidden h-4 w-px bg-border md:block" aria-hidden="true" />

          <ul className="hidden items-center gap-0.5 md:flex" onMouseLeave={() => setHovered(null)}>
            {links.map((link) => (
              <li key={link.href} className="relative">
                {highlighted === link.href && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-bg-line"
                  />
                )}
                <a
                  href={link.href}
                  onMouseEnter={() => setHovered(link.href)}
                  aria-current={activeSection === link.href ? "true" : undefined}
                  className={`relative block rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:text-ink ${
                    activeSection === link.href ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            title="Command palette (Ctrl/⌘ K)"
            className="hidden shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1.5 font-mono text-[10px] text-ink-faint transition-colors hover:border-accent/60 hover:text-ink md:flex"
          >
            <Command size={11} />K
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-inverse transition-colors hover:bg-accent-dim md:flex"
          >
            let's connect
          </a>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-full p-2 text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-center bg-bg px-8 md:hidden"
          >
            <ul className="flex flex-col gap-6">
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-4xl font-bold lowercase tracking-tight text-ink"
                  >
                    <span className="font-mono text-lg text-accent">0{i + 1}/</span> {link.label}
                  </a>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * links.length, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="pt-4"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-[0.1em] text-ink-inverse"
                >
                  let's connect
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
