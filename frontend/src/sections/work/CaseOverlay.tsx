import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import type { Project } from "../../data/projects"
import { WORLDS } from "./themes"

/**
 * Full-screen case view for one concept project, dressed in that project's
 * own world. A real modal dialog: focus moves in, Esc / backdrop / close
 * button leave, and focus returns to whatever opened it.
 */
export function CaseOverlay({ project, onClose }: { project: Project; onClose: () => void }) {
  const w = WORLDS[project.id]
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      opener?.focus()
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-lenis-prevent
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-8"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`case-${project.id}`}
        data-testid="work-case"
        initial={{ y: 40, scale: 0.96, rotate: -1.5 }}
        animate={{ y: 0, scale: 1, rotate: 0 }}
        exit={{ y: 30, scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: w.tile.bg, color: w.tile.fg }}
        className="relative grid max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl md:grid-cols-[1.2fr_1fr]"
      >
        <div className="relative min-h-56 overflow-hidden md:min-h-[28rem]">
          <img src={project.image.src} alt={project.image.alt} className="absolute inset-0 h-full w-full object-cover" />
          <span
            className="absolute left-4 top-4 -rotate-3 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ background: w.tile.fg, color: w.tile.bg }}
          >
            {project.status}
          </span>
        </div>

        <div className="flex flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-xs opacity-60">{project.index} / 05</span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close case"
              className="grid h-9 w-9 place-items-center rounded-full border transition-transform hover:rotate-90"
              style={{ borderColor: `${w.tile.fg}40` }}
            >
              <X size={16} />
            </button>
          </div>
          <h3 id={`case-${project.id}`} className={`${w.font} mt-6 text-5xl font-bold leading-none tracking-tight sm:text-6xl`}>
            {project.name}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] opacity-60">{project.category}</p>
          <p className="mt-6 text-lg leading-relaxed opacity-90">{project.description}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em]"
                style={{ borderColor: `${w.tile.fg}40` }}
              >
                {tag}
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-8 font-mono text-xs italic opacity-60">// concept exploration — not a live client site</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
