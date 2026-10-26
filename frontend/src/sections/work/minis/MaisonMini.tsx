import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { media } from "../../../data/media"
import { WORLDS } from "../themes"

/**
 * Maison: a slow, editorial storefront — cream paper, a serif with
 * italics, an arched product image. The bag actually fills up.
 */
export function MaisonMini() {
  const t = WORLDS.maison.tile
  const [bag, setBag] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const id = window.setTimeout(() => setJustAdded(false), 1400)
    return () => window.clearTimeout(id)
  }, [justAdded])

  return (
    <div className="flex h-full flex-col font-serif" style={{ background: t.bg, color: t.fg }}>
      <div className="grid grid-cols-3 items-center border-b px-5 py-2.5 text-[11px]" style={{ borderColor: `${t.fg}22` }}>
        <span className="italic opacity-70">Shop · Story · Journal</span>
        <span className="text-center text-sm tracking-[0.45em]">MAISON</span>
        <span className="text-right opacity-80">
          Bag (
          <AnimatePresence mode="popLayout">
            <motion.span key={bag} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
              {bag}
            </motion.span>
          </AnimatePresence>
          )
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-60">Autumn edit · Nº 04</p>
            <p className="mt-2 text-[clamp(1.5rem,2.4vw,2.3rem)] leading-[0.95]">
              Made slowly.
              <br />
              <em style={{ color: t.accent }}>Kept forever.</em>
            </p>
          </div>
          <div>
            <p className="text-[12px] opacity-80">The Linen Weekender — €240</p>
            <button
              type="button"
              onClick={() => {
                setBag((b) => b + 1)
                setJustAdded(true)
              }}
              className="mt-2 w-full rounded-full border px-4 py-2 text-[12px] tracking-wide transition-colors"
              style={{
                borderColor: t.fg,
                background: justAdded ? t.fg : "transparent",
                color: justAdded ? t.bg : t.fg,
              }}
            >
              {justAdded ? "Added to bag ✓" : "Add to bag"}
            </button>
          </div>
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-t-full">
          <img
            src={media.projects.maison.src}
            alt={media.projects.maison.alt}
            loading="lazy"
            className="h-full w-full object-cover sepia-[0.25]"
          />
        </div>
      </div>
    </div>
  )
}
