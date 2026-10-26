import { motion } from "framer-motion"
import { MousePointer2, PenTool, Square, Type } from "lucide-react"
import type { Service } from "../../data/services"

/**
 * The three bodies the Services device can take. Each is a small, live
 * piece of UI — a site that scrolls, an app that gets a notification, a
 * design canvas with a collaborator moving around — so the service is
 * shown being delivered rather than described.
 */

export function WebForm({ service, live }: { service: Service; live: boolean }) {
  return (
    <div className="flex h-full flex-col bg-[#f6f3ee] text-[#16151c]">
      <div className="flex items-center gap-2 border-b border-black/10 bg-white px-3 py-2">
        <span className="flex gap-1.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="mx-auto rounded-md bg-black/5 px-8 py-0.5 font-mono text-[10px] text-black/50">yourbrand.com</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className={live ? "animate-site-scroll" : ""}>
          <div className="flex items-center justify-between px-5 py-3 text-[10px] font-medium">
            <span className="font-display text-sm font-bold">brand.</span>
            <span className="flex gap-4 opacity-60">
              <span>Product</span>
              <span>Work</span>
              <span>About</span>
            </span>
          </div>
          <div className="grid grid-cols-[1.1fr_1fr] items-center gap-4 px-5 pb-5 pt-2">
            <div>
              <p className="font-display text-[clamp(1.2rem,2.2vw,1.9rem)] font-bold leading-[0.95] tracking-tight">
                Your idea,
                <br />
                <span className="text-accent">live.</span>
              </p>
              <p className="mt-2 text-[11px] leading-snug opacity-60">Fast on every screen, built clean from day one.</p>
              <span className="mt-3 inline-block rounded-full bg-[#16151c] px-3 py-1.5 text-[10px] font-semibold text-white">
                Get started →
              </span>
            </div>
            <img src={service.image.src} alt={service.image.alt} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 pb-5">
            {["Fast", "Accessible", "Built to grow"].map((f) => (
              <div key={f} className="rounded-lg border border-black/10 bg-white p-2.5 text-[10px] font-semibold">
                <span className="mb-2 block h-4 w-4 rounded bg-accent/20" />
                {f}
              </div>
            ))}
          </div>
          <div className="mx-5 mb-5 h-24 rounded-lg bg-[#16151c]" />
        </div>
      </div>
    </div>
  )
}

export function MobileForm({ service, live }: { service: Service; live: boolean }) {
  return (
    <div className="relative flex h-full flex-col bg-[#0f0f14] px-3 pb-3 text-white">
      <div className="flex items-center justify-between px-2 pt-2.5 text-[10px] font-semibold">
        <span>9:41</span>
        <span className="h-4 w-16 rounded-full bg-black" />
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1 rounded-sm bg-white" style={{ height: 4 + i * 2 }} />
          ))}
        </span>
      </div>

      <motion.div
        initial={live ? { y: -60, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, type: "spring", stiffness: 260, damping: 22 }}
        className="absolute inset-x-3 top-9 z-10 flex items-center gap-2 rounded-2xl bg-white/15 p-2.5 backdrop-blur-xl"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber text-[11px] font-bold text-black">✓</span>
        <span className="text-[10px] leading-tight">
          <b className="block">Order confirmed</b>
          <span className="opacity-70">Arriving tomorrow, 10–12</span>
        </span>
      </motion.div>

      <p className="mt-[4.25rem] px-1 font-display text-xl font-bold">Today</p>
      <img src={service.image.src} alt={service.image.alt} loading="lazy" className="mt-2 aspect-[16/10] w-full rounded-2xl object-cover" />
      <div className="mt-3 space-y-2">
        {["Track delivery", "Saved items", "Notifications"].map((row, i) => (
          <div key={row} className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2 text-[11px]">
            {row}
            <span className={`flex h-4 w-7 items-center rounded-full p-0.5 ${i !== 1 ? "justify-end bg-accent" : "bg-white/20"}`}>
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-around pt-3 opacity-60">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`} />
        ))}
      </div>
    </div>
  )
}

const LAYERS = ["Frame / Home", "Header", "Hero image", "Button / primary", "Footer"]
const SWATCHES = ["#7c5cff", "#ffb020", "#16151c", "#f3f0ea", "#3ecf8e"]

export function DesignForm({ service, live }: { service: Service; live: boolean }) {
  return (
    <div className="flex h-full flex-col bg-[#1e1d26] text-white">
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {[MousePointer2, PenTool, Square, Type].map((Icon, i) => (
          <span key={i} className={`grid h-6 w-6 place-items-center rounded ${i === 0 ? "bg-accent" : "opacity-60"}`}>
            <Icon size={12} />
          </span>
        ))}
        <span className="ml-auto font-mono text-[9px] opacity-50">home — v3</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-28 shrink-0 border-r border-white/10 p-2 text-[9px] sm:block">
          <p className="mb-1.5 uppercase tracking-[0.15em] opacity-40">Layers</p>
          {LAYERS.map((l, i) => (
            <p key={l} className={`truncate rounded px-1.5 py-1 ${i === 2 ? "bg-accent/30" : "opacity-60"}`}>
              {l}
            </p>
          ))}
        </div>
        <div
          className="relative flex-1 overflow-hidden"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
        >
          <div className="absolute inset-[10%] rounded bg-[#f6f3ee] p-3 text-[#16151c] shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="h-2 w-10 rounded bg-black/70" />
              <span className="h-2 w-16 rounded bg-black/15" />
            </div>
            <div className="relative mt-3 h-[58%]">
              <img src={service.image.src} alt={service.image.alt} loading="lazy" className="h-full w-full rounded object-cover" />
              {/* selection box with handles */}
              <span className="absolute -inset-1 border-[1.5px] border-accent" />
              {["-left-2 -top-2", "-right-2 -top-2", "-bottom-2 -left-2", "-bottom-2 -right-2"].map((pos) => (
                <span key={pos} className={`absolute h-2 w-2 border-[1.5px] border-accent bg-white ${pos}`} />
              ))}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-accent px-1.5 font-mono text-[9px] text-white">
                320 × 200
              </span>
            </div>
            <span className="mt-7 inline-block rounded-full bg-accent px-3 py-1 text-[9px] font-semibold text-white">Button</span>
          </div>

          {/* a collaborator cursor wandering the canvas */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-10"
            initial={{ x: "70%", y: "70%" }}
            animate={live ? { x: ["70%", "40%", "55%", "70%"], y: ["70%", "30%", "55%", "70%"] } : undefined}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "100%", height: "100%" }}
          >
            <span className="absolute left-0 top-0 flex items-start">
              <MousePointer2 size={16} className="fill-amber text-amber" />
              <span className="mt-3 rounded bg-amber px-1.5 text-[9px] font-semibold text-black">designer</span>
            </span>
          </motion.div>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/50 p-1.5">
            {SWATCHES.map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
