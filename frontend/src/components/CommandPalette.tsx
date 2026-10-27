import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUp, Briefcase, CornerDownLeft, HelpCircle, Layers, MessageCircle, MessageSquareText, Search, Send, Workflow, Cpu } from "lucide-react"
import { whatsappUrl } from "../data/contact"
import { OPEN_PALETTE_EVENT, openChat, scrollToTarget } from "../lib/scroll"

type Command = {
  id: string
  label: string
  group: "Navigate" | "Connect"
  icon: ReactNode
  hint?: string
  run: () => void
}

/**
 * ⌘K / Ctrl+K command palette — the "Studio OS" metaphor taken literally:
 * jump to any section, open the assistant, or start a conversation from
 * the keyboard. Fully keyboard-driven (↑ ↓ Enter Esc), with focus returned
 * to wherever it was when the palette closes.
 */
export function CommandPalette() {
  const prefersReducedMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(false)

  const commands = useMemo<Command[]>(
    () => [
      { id: "top", label: "Back to top", group: "Navigate", icon: <ArrowUp size={15} />, run: () => scrollToTarget(0) },
      { id: "work", label: "Selected work", group: "Navigate", icon: <Briefcase size={15} />, hint: "01", run: () => scrollToTarget("#work") },
      { id: "services", label: "Services", group: "Navigate", icon: <Layers size={15} />, hint: "02", run: () => scrollToTarget("#services") },
      { id: "process", label: "Process", group: "Navigate", icon: <Workflow size={15} />, hint: "03", run: () => scrollToTarget("#process") },
      { id: "stack", label: "Under the hood", group: "Navigate", icon: <Cpu size={15} />, hint: "04", run: () => scrollToTarget("#stack") },
      { id: "faq", label: "FAQ", group: "Navigate", icon: <HelpCircle size={15} />, hint: "05", run: () => scrollToTarget("#faq") },
      { id: "contact", label: "Contact form", group: "Navigate", icon: <Send size={15} />, hint: "06", run: () => scrollToTarget("#contact") },
      { id: "chat", label: "Ask the Sapvy Assistant", group: "Connect", icon: <MessageSquareText size={15} />, run: () => openChat() },
      {
        id: "whatsapp",
        label: "Chat on WhatsApp",
        group: "Connect",
        icon: <MessageCircle size={15} />,
        hint: "↗",
        run: () => window.open(whatsappUrl, "_blank", "noopener,noreferrer"),
      },
    ],
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.id.includes(q))
  }, [commands, query])

  useEffect(() => {
    const show = () => {
      returnFocusRef.current = document.activeElement as HTMLElement | null
      setQuery("")
      setActive(0)
      setOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (openRef.current) setOpen(false)
        else show()
      }
    }
    const onOpen = () => show()
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    openRef.current = open
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      returnFocusRef.current?.focus?.()
      returnFocusRef.current = null
    }
  }, [open])

  function run(command: Command | undefined) {
    if (!command) return
    setOpen(false)
    // let the palette start closing before the page scrolls underneath it
    window.setTimeout(command.run, 60)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i + 1) % filtered.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      run(filtered[active])
    }
  }

  let lastGroup: string | null = null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-start justify-center bg-bg/70 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            data-testid="command-palette"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKeyDown}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-bg-raised shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={16} className="shrink-0 text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder="Type a command or jump to…"
                aria-label="Search commands"
                className="h-14 flex-1 bg-transparent font-mono text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">esc</kbd>
            </div>

            <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-xs text-ink-faint">no matching command</li>
              )}
              {filtered.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null
                lastGroup = c.group
                return (
                  <li key={c.id} role="option" aria-selected={i === active}>
                    {header && (
                      <p className="px-3 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint first:pt-1">
                        {header}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseMove={() => setActive(i)}
                      onClick={() => run(c)}
                      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        i === active ? "text-ink" : "text-ink-dim"
                      }`}
                    >
                      {i === active && (
                        <motion.span
                          layoutId="palette-active"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          className="absolute inset-0 -z-0 rounded-lg bg-bg-line"
                        />
                      )}
                      <span className={`relative ${i === active ? "text-accent" : "text-ink-faint"}`}>{c.icon}</span>
                      <span className="relative flex-1">{c.label}</span>
                      {i === active ? (
                        <CornerDownLeft size={13} className="relative text-ink-faint" />
                      ) : (
                        c.hint && <span className="relative font-mono text-[10px] text-ink-faint">{c.hint}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
              <span>sapvy — command</span>
              <span className="flex items-center gap-3">
                <span>↑↓ move</span>
                <span>↵ open</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
