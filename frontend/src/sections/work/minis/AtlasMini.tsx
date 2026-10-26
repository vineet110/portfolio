import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Heart, X } from "lucide-react"
import { media } from "../../../data/media"
import { WORLDS } from "../themes"

// Fictional stays for a concept booking app.
const STAYS = [
  { name: "Casa Lumen", place: "Lisbon · 2 nights", img: media.projects.atlas, tint: "" },
  { name: "Hotel Sable", place: "Copenhagen · 3 nights", img: media.projects.maison, tint: "" },
  { name: "Villa Ora", place: "Amalfi · 4 nights", img: media.projects.atlas, tint: "hue-rotate-[140deg] saturate-150" },
]

const SWIPE = {
  out: (dir: number) => ({ x: dir * 160, rotate: dir * 18, opacity: 0, transition: { duration: 0.3 } }),
}

/**
 * Atlas: a phone-first booking app built around discovery. Swipe a stay
 * away (or use the buttons) and the next one rises from the stack.
 */
export function AtlasMini() {
  const t = WORLDS.atlas.tile
  const [top, setTop] = useState(0)
  const [exitDir, setExitDir] = useState(1)

  const dismiss = (dir: number) => {
    setExitDir(dir)
    setTop((i) => (i + 1) % STAYS.length)
  }

  return (
    <div className="flex h-full items-center justify-center gap-4 px-3 font-grotesk" style={{ background: t.bg, color: t.fg }}>
      <div className="relative flex h-[92%] aspect-[9/17] flex-col overflow-hidden rounded-[22px] border-[5px] border-[#1d0f0b] bg-[#fff3e6] shadow-[0_18px_40px_-12px_rgba(29,15,11,0.6)]">
        <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-[#1d0f0b]" />
        <p className="px-3 pt-2 text-[13px] font-bold leading-tight">Where to next?</p>
        <div className="relative mx-2 mt-2 flex-1">
          <AnimatePresence initial={false} custom={exitDir}>
            {[2, 1, 0].map((depth) => {
              const i = (top + depth) % STAYS.length
              const s = STAYS[i]
              const isTop = depth === 0
              return (
                <motion.div
                  key={`${s.name}-${top + depth}`}
                  custom={exitDir}
                  drag={isTop ? "x" : false}
                  dragSnapToOrigin
                  onDragEnd={(_, info) => Math.abs(info.offset.x) > 60 && dismiss(Math.sign(info.offset.x))}
                  initial={{ scale: 0.9, y: 14, opacity: 0 }}
                  animate={{ scale: 1 - depth * 0.05, y: depth * 7, opacity: 1, zIndex: 3 - depth }}
                  variants={SWIPE}
                  exit="out"
                  className={`absolute inset-0 overflow-hidden rounded-2xl bg-[#1d0f0b] ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <img src={s.img.src} alt={s.img.alt} loading="lazy" draggable={false} className={`h-full w-full object-cover ${s.tint}`} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-white">
                    <p className="text-[12px] font-bold">{s.name}</p>
                    <p className="text-[10px] opacity-80">{s.place}</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-3 py-2">
          <button type="button" aria-label="Skip this stay" onClick={() => dismiss(-1)} className="grid h-7 w-7 place-items-center rounded-full border border-[#1d0f0b]/20 bg-white">
            <X size={13} />
          </button>
          <button type="button" aria-label="Save this stay" onClick={() => dismiss(1)} className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: t.bg }}>
            <Heart size={13} />
          </button>
        </div>
      </div>
      <p className="hidden max-w-[7rem] text-[clamp(1.1rem,1.6vw,1.5rem)] font-bold leading-[0.95] tracking-tight xl:block">
        Stay somewhere worth the trip.
        <span className="mt-2 block text-[10px] font-normal tracking-normal opacity-70">← swipe the cards</span>
      </p>
    </div>
  )
}
