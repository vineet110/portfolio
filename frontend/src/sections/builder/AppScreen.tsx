import { useEffect, useState, type CSSProperties } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion"
import { Fingerprint } from "lucide-react"
import { LOOKS, rupees, type Business, type FeatureId, type Look, type StyleId } from "./data"

export type Flourish = { id: FeatureId; n: number } | null

type Props = {
  biz: Business
  color: string
  style: StyleId
  features: FeatureId[]
  wide?: boolean
  cols?: number
  flourish?: Flourish
}

const DAYS = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"]
const BARS = [38, 52, 44, 70, 58, 86, 100]
const spring = { type: "spring", stiffness: 260, damping: 20 } as const

function headStyle(L: Look): CSSProperties {
  return {
    fontFamily: L.head,
    fontWeight: L.weight,
    textTransform: L.upper ? "uppercase" : "none",
    fontStyle: L.italic ? "italic" : "normal",
    letterSpacing: L.upper ? "-0.01em" : undefined,
  }
}

/** A number that counts up from zero the first time it appears. */
function CountUp({ value, delay = 0, prefix = "₹" }: { value: number; delay?: number; prefix?: string }) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(reduced ? value : 0)
  const text = useTransform(mv, (v) => `${prefix}${Math.round(v).toLocaleString("en-IN")}`)
  useEffect(() => {
    const c = animate(mv, value, { duration: reduced ? 0 : 1.1, delay: reduced ? 0 : delay, ease: "easeOut" })
    return () => c.stop()
  }, [mv, value, delay, reduced])
  return <motion.span>{text}</motion.span>
}

/** The assistant: a question, three dots, then a reply typed out. */
function Chat({ q, a, L }: { q: string; a: string; L: Look }) {
  const [n, setN] = useState(-14)
  useEffect(() => {
    if (n >= a.length) return
    const id = window.setTimeout(() => setN((v) => v + 1), n < 0 ? 55 : 32)
    return () => window.clearTimeout(id)
  }, [n, a.length])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4, y: 30 }}
      transition={{ type: "spring", stiffness: 380, damping: 20 }}
      style={{ originX: 1, originY: 1 }}
      className="pointer-events-none absolute bottom-14 right-2 z-10 w-[72%] max-w-[200px] space-y-1 text-[9px] leading-snug"
    >
      <p className="ml-auto w-fit rounded-xl rounded-br-sm bg-[#14121e] px-2 py-1 text-white">{q}</p>
      <div className="flex items-end gap-1">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] text-white transition-colors duration-700" style={{ background: "var(--app)" }}>
          ✦
        </span>
        <p className="min-h-[1.5rem] rounded-xl rounded-bl-sm bg-white px-2 py-1 text-[#14121e] shadow-md" style={{ border: `${L.bw}px solid ${L.line}` }}>
          {n < 0 ? (
            <span className="inline-flex gap-0.5 py-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1 w-1 rounded-full bg-[#14121e]/50" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }} />
              ))}
            </span>
          ) : (
            a.slice(0, n)
          )}
        </p>
      </div>
    </motion.div>
  )
}

/** One-off show pieces played inside the phone when a superpower switches on. */
function FlourishLayer({ flourish, L }: { flourish: Flourish; L: Look }) {
  return (
    <AnimatePresence>
      {flourish?.id === "payments" && (
        <motion.div key={`p${flourish.n}`} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20">
          <motion.div
            initial={{ x: "-150%", rotate: -10 }}
            animate={{ x: ["-150%", "-50%", "-50%", "160%"], rotate: [-10, 0, 0, 8] }}
            transition={{ duration: 1.3, times: [0, 0.3, 0.6, 1], ease: "easeInOut" }}
            className="absolute left-1/2 top-[38%] h-[84px] w-[136px] rounded-xl p-2.5 text-white shadow-2xl"
            style={{ background: "linear-gradient(135deg,#14121e,#433d5c)" }}
          >
            <span className="block h-4 w-6 rounded bg-gradient-to-br from-[#ffd36b] to-[#c98600]" />
            <span className="mt-5 block font-mono text-[10px] tracking-[0.15em]">•••• 4242</span>
          </motion.div>
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{ delay: 0.85, type: "spring", stiffness: 420, damping: 15 }}
            className="absolute left-1/2 top-[40%] -ml-[62px] w-[124px] border-4 bg-white/90 py-1 text-center font-mono text-[15px] font-black uppercase"
            style={{ borderColor: "#16a34a", color: "#16a34a", borderRadius: Math.min(L.r, 8) }}
          >
            ₹ Paid ✓
          </motion.div>
        </motion.div>
      )}
      {flourish?.id === "login" && (
        <motion.div
          key={`l${flourish.n}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[#0c0b11]/70 backdrop-blur-[2px]"
        >
          <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.7, repeat: 2 }} className="text-center">
            <Fingerprint size={58} strokeWidth={1.4} style={{ color: "var(--app)", filter: "drop-shadow(0 0 12px var(--app))" }} />
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-2 text-[11px] font-semibold text-white">
              Welcome back, Riya
            </motion.p>
          </motion.div>
          <motion.span
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-x-0 h-[3px]"
            style={{ background: "var(--app)", boxShadow: "0 0 18px 4px var(--app)" }}
          />
        </motion.div>
      )}
      {(flourish?.id === "bookings" || flourish?.id === "dashboard" || flourish?.id === "assistant") && (
        <motion.div
          key={`t${flourish.n}`}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={spring}
          className="pointer-events-none absolute inset-x-3 top-6 z-20 rounded-xl bg-[#14121e] px-3 py-2 text-[10px] font-semibold text-white shadow-xl"
        >
          {flourish.id === "bookings" ? "📅 Bookings switched on" : flourish.id === "dashboard" ? "📊 Owner dashboard added" : "💬 Assistant is online"}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * The app the visitor is building — the same component draws the phone
 * screen and the laptop screen. Changing the business remounts it, which
 * replays the "builds itself" entrance: header drops, banner sweeps,
 * cards are dealt, buttons pop, prices count up.
 */
export function AppScreen({ biz, color, style, features, wide = false, cols = 2, flourish = null }: Props) {
  const L = LOOKS[style]
  const has = (f: FeatureId) => features.includes(f)
  const head = headStyle(L)
  const card: CSSProperties = { borderRadius: L.r, border: `${L.bw}px solid ${L.line}`, background: L.card }
  const total = biz.items[0].price + biz.items[2].price

  return (
    <div
      className="relative h-full w-full overflow-hidden text-[#14121e] transition-[background-color] duration-700"
      style={{ background: L.bg, ["--app" as string]: color }}
    >
      <div key={biz.id + biz.brand} className="flex h-full flex-col">
        {!wide && (
          <div className="flex justify-between px-5 pt-2 text-[8px] font-semibold">
            <span>9:41</span>
            <span>●●● ▮</span>
          </div>
        )}

        {/* header */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.3 }} className={`flex items-center justify-between gap-2 ${wide ? "px-4 py-2.5" : "px-3 py-2"}`}>
          <span style={head} className={wide ? "text-[16px] leading-none" : "text-[15px] leading-none"}>
            {biz.brand}
          </span>
          {wide && (
            <span className="flex gap-3 text-[9px] font-medium text-[#14121e]/60">
              <span>Home</span>
              <span>{biz.nav}</span>
              <span>About</span>
            </span>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {has("login") ? (
              <motion.span key="in" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1 text-[9px] font-semibold">
                <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] text-white transition-colors duration-700" style={{ background: "var(--app)" }}>
                  R
                </span>
                Hi Riya
              </motion.span>
            ) : (
              <motion.span key="out" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="px-2 py-0.5 text-[9px] font-semibold" style={{ border: `${L.bw}px solid ${L.line}`, borderRadius: L.btnR }}>
                Sign in
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* banner */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          style={{ originX: 0, background: "var(--app)", borderRadius: L.r }}
          className={`relative overflow-hidden text-white transition-[background-color,border-radius] duration-700 ${wide ? "mx-4 flex items-center justify-between p-4" : "mx-3 p-3"}`}
        >
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
            <p style={head} className={wide ? "text-[20px] leading-tight" : "text-[17px] leading-tight"}>
              {biz.hero}
            </p>
            <p className="mt-0.5 text-[9px] opacity-85">{biz.sub}</p>
          </motion.div>
          {wide && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14, delay: 1.1 }} className="bg-white px-3 py-1.5 text-[9px] font-bold text-[#14121e]" style={{ borderRadius: L.btnR }}>
              {biz.cta} →
            </motion.span>
          )}
          <motion.span
            aria-hidden="true"
            initial={{ x: "-120%" }}
            animate={{ x: "320%" }}
            transition={{ duration: 1.1, delay: 1, ease: "easeInOut" }}
            className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/30"
          />
        </motion.div>

        <div className={wide ? "mx-4 mt-2 grid grid-cols-2 items-start gap-2 empty:hidden" : "contents"}>
        {/* bookings */}
        <AnimatePresence initial={false}>
          {has("bookings") && (
            <motion.div
              key="cal"
              initial={{ rotateX: -90, opacity: 0, height: 0 }}
              animate={{ rotateX: 0, opacity: 1, height: "auto" }}
              exit={{ rotateX: -90, opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 190, damping: 18 }}
              style={{ originY: 0, transformPerspective: 500 }}
              className={wide ? "" : "mx-3 mt-2"}
            >
              <div className="p-2" style={card}>
                <p className="text-[9px] font-bold">📅 {biz.booking}</p>
                <div className="mt-1 flex gap-1">
                  {DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={`flex-1 py-1 text-center text-[7.5px] font-semibold transition-colors duration-700 ${i === 2 ? "text-white" : ""}`}
                      style={{ background: i === 2 ? "var(--app)" : "rgba(20,18,30,0.05)", borderRadius: Math.min(L.r, 6) }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* dashboard */}
        <AnimatePresence initial={false}>
          {has("dashboard") && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={wide ? "" : "mx-3 mt-2"}
            >
              <div className="flex items-end justify-between gap-2 p-2" style={card}>
                <div>
                  <p className="text-[8px] text-[#14121e]/60">Sales today</p>
                  <p style={head} className="text-[14px] leading-none">
                    <CountUp value={48200} />
                  </p>
                  <p className="text-[8px] font-bold text-[#16a34a]">▲ 12%</p>
                </div>
                <div className={`flex items-end gap-[3px] ${wide ? "h-10" : "h-8"}`}>
                  {BARS.map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.15 + i * 0.07 }}
                      className={`${wide ? "w-3" : "w-2"} transition-colors duration-700`}
                      style={{ background: i === BARS.length - 1 ? "var(--app)" : "rgba(20,18,30,0.15)", borderRadius: Math.min(L.r, 3) }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </div>

        {/* products / services */}
        <div className={`min-h-0 flex-1 overflow-hidden ${wide ? "px-4 pt-2.5" : "px-3 pt-2"}`}>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {biz.items.map((item, i) => (
              <motion.div
                key={item.name}
                layout
                initial={{ opacity: 0, y: 80, x: i % 2 ? 60 : -60, rotate: i % 2 ? 16 : -16 }}
                animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 170, damping: 17, delay: 0.6 + i * 0.12, layout: { type: "spring", stiffness: 300, damping: 26 } }}
                className="flex flex-col p-1.5 transition-[border-radius] duration-500"
                style={card}
              >
                <div
                  className={`grid place-items-center transition-[background-color,border-radius] duration-700 ${wide ? "h-12 text-2xl" : "h-11 text-[22px]"}`}
                  style={{ borderRadius: Math.max(0, L.r - 4), background: "color-mix(in srgb, var(--app) 16%, white)" }}
                >
                  {item.emoji}
                </div>
                <p className="mt-1 truncate text-[9.5px] font-semibold">{item.name}</p>
                <p className="text-[9.5px] font-bold">
                  <CountUp value={item.price} delay={0.9 + i * 0.12} />
                </p>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 13, delay: 1.25 + i * 0.1 }}
                  className="mt-1 py-1 text-center text-[8.5px] font-bold text-white transition-[background-color,border-radius] duration-700"
                  style={{ background: "var(--app)", borderRadius: L.btnR }}
                >
                  {biz.cta}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* checkout */}
        <AnimatePresence initial={false}>
          {has("payments") && (
            <motion.div
              key="pay"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={spring}
              className={`flex shrink-0 items-center justify-between bg-[#14121e] px-3 py-2 text-[9.5px] text-white ${wide ? "mx-4 mb-3" : "mx-3 mb-3"}`}
              style={{ borderRadius: L.btnR === 999 ? 14 : L.btnR }}
            >
              <span>🛒 2 items</span>
              <span className="px-2.5 py-1 font-bold transition-colors duration-700" style={{ background: "var(--app)", borderRadius: L.btnR }}>
                Pay {rupees(total)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {!has("payments") && <div className="h-3 shrink-0" />}
      </div>

      <AnimatePresence>{has("assistant") && <Chat key={`chat-${biz.id}`} q={biz.chat.q} a={biz.chat.a} L={L} />}</AnimatePresence>

      {/* style morph: a quick flash whenever the look changes */}
      <AnimatePresence initial={false}>
        <motion.div key={style} aria-hidden="true" initial={{ opacity: 0.75 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }} className="pointer-events-none absolute inset-0 z-10 bg-white" />
      </AnimatePresence>

      {!wide && <FlourishLayer flourish={flourish} L={L} />}
    </div>
  )
}
