import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useAnimate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion"
import { ArrowRight, Dices, RotateCcw, Rocket, Volume2, VolumeX } from "lucide-react"
import { AppScreen, type Flourish } from "./builder/AppScreen"
import { BUSINESSES, COLORS, FEATURES, LOOKS, ORBIT_IDS, STYLES, customBusiness, estimateWeeks, type BizId, type Business, type FeatureId, type StyleId } from "./builder/data"
import { Swarm } from "./builder/Swarm"
import { blip, fanfare, whoosh } from "./builder/sound"
import { prefillIdea, scrollToTarget } from "../lib/scroll"

type Phase = "build" | "countdown" | "swarm" | "live"
type Point = { x: number; y: number }

/** design-space stage sizes; the stage is drawn at this size and scaled to fit */
const WIDE = { w: 800, h: 600 }
const NARROW = { w: 300, h: 580 }
const PHONE = { w: 262, h: 524 }
const LAPTOP = { left: 250, top: 90, full: 530, min: 240, screen: 370 }

function phoneCenter(wide: boolean, chosen: boolean): Point {
  if (!wide) return { x: NARROW.w / 2, y: NARROW.h / 2 }
  return chosen ? { x: 190, y: 315 } : { x: WIDE.w / 2, y: WIDE.h / 2 }
}

function deviceName(cols: number) {
  return cols >= 4 ? "laptop" : cols >= 2 ? "tablet" : "phone"
}

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

/**
 * 03 — "Your idea, live in ten seconds." The visitor builds a small app:
 * picks a business (it flies into the phone and the app assembles itself),
 * paints it, switches on superpowers, stretches the laptop, then launches
 * it — 10,000 customers stream in. The finale hands their choices straight
 * to the contact form.
 */
export function AppBuilder() {
  const reduced = Boolean(useReducedMotion())
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.2 })
  const outerRef = useRef<HTMLDivElement>(null)
  const designRef = useRef<HTMLDivElement>(null)
  const [scope, animateScope] = useAnimate<HTMLDivElement>()

  const [boxW, setBoxW] = useState(WIDE.w)
  const wide = boxW >= 560
  const G = wide ? WIDE : NARROW
  const scale = Math.min(1, boxW / G.w)

  const [bizId, setBizId] = useState<BizId | null>(null)
  const [custom, setCustom] = useState<Business | null>(null)
  const [customText, setCustomText] = useState("")
  const [colorIdx, setColorIdx] = useState(0)
  const [style, setStyle] = useState<StyleId>("soft")
  const [features, setFeatures] = useState<FeatureId[]>([])
  const [phase, setPhase] = useState<Phase>("build")
  const [count, setCount] = useState(3)
  const [launchId, setLaunchId] = useState(0)
  const [flourish, setFlourish] = useState<Flourish>(null)
  const [meteor, setMeteor] = useState<{ n: number; from: Point; to: Point; emoji: string } | null>(null)
  const [flash, setFlash] = useState(0)
  const [ripple, setRipple] = useState<{ n: number; color: string } | null>(null)
  const [auto, setAuto] = useState(false)
  const [sound, setSound] = useState(false)
  const soundRef = useRef(false)

  const biz = (custom && custom.id === bizId ? custom : BUSINESSES.find((b) => b.id === bizId)) ?? null
  const color = COLORS[colorIdx].hex
  const busy = phase === "countdown" || phase === "swarm"
  // timers (Surprise me) call these later, so they read the latest values from refs
  const bizRef = useRef(bizId)
  const featuresRef = useRef(features)
  useEffect(() => {
    bizRef.current = bizId
    featuresRef.current = features
  }, [bizId, features])
  const center = phoneCenter(wide, Boolean(biz))

  // ── timers: "fx" for effects, "auto" for the Surprise-me run ──────────
  const timers = useRef<{ fx: number[]; auto: number[] }>({ fx: [], auto: [] })
  const later = useCallback((fn: () => void, ms: number, bucket: "fx" | "auto" = "fx") => {
    timers.current[bucket].push(window.setTimeout(fn, ms))
  }, [])
  const clearBucket = useCallback((bucket: "fx" | "auto") => {
    timers.current[bucket].forEach((t) => window.clearTimeout(t))
    timers.current[bucket] = []
  }, [])
  useEffect(() => {
    const t = timers.current
    return () => {
      t.fx.forEach((id) => window.clearTimeout(id))
      t.auto.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  // ── fit the design-size stage into whatever width we have ─────────────
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBoxW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── stretchable laptop ────────────────────────────────────────────────
  const laptopW = useMotionValue(LAPTOP.full)
  const laptopSpring = useSpring(laptopW, { stiffness: 320, damping: 11 })
  const laptopVel = useVelocity(laptopSpring)
  const skew = useTransform(laptopVel, [-1800, 0, 1800], [5, 0, -5], { clamp: true })
  const [cols, setCols] = useState(4)
  const [dragging, setDragging] = useState(false)
  useMotionValueEvent(laptopSpring, "change", (v) => setCols(v >= 420 ? 4 : v >= 310 ? 2 : 1))

  function startStretch(e: ReactPointerEvent<HTMLButtonElement>) {
    e.preventDefault()
    const startX = e.clientX
    const startW = laptopW.get()
    setDragging(true)
    const move = (ev: PointerEvent) => {
      const next = startW + (ev.clientX - startX) / scale
      laptopW.set(Math.max(LAPTOP.min, Math.min(LAPTOP.full + 30, next)))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      setDragging(false)
      laptopW.set(LAPTOP.full) // let go → it bounces back like jelly
      sfx("pop")
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }
  function squishByKeyboard() {
    laptopW.set(LAPTOP.min)
    later(() => laptopW.set(LAPTOP.full), 1300)
  }

  // ── sound ─────────────────────────────────────────────────────────────
  const sfx = useCallback((kind: "pop" | "click" | "whoosh" | "tick" | "go" | "fanfare") => {
    if (!soundRef.current) return
    if (kind === "pop") blip(520, 0.09, "sine")
    else if (kind === "click") blip(880, 0.05, "square", 0.025)
    else if (kind === "whoosh") whoosh()
    else if (kind === "tick") blip(440, 0.12, "triangle", 0.07)
    else if (kind === "go") whoosh(0.9, 0.12)
    else fanfare()
  }, [])

  // ── leaving the finale when anything changes ──────────────────────────
  const leaveLive = useCallback(() => {
    setPhase((p) => (p === "live" ? "build" : p))
    setLaunchId(0)
  }, [])

  const visitors = useMotionValue(0)
  const visitorsText = useTransform(visitors, (v) => Math.round(v).toLocaleString("en-IN"))

  // ── actions ───────────────────────────────────────────────────────────
  const chooseBiz = useCallback(
    (id: BizId, from?: Point, made?: Business) => {
      const b = made ?? BUSINESSES.find((x) => x.id === id)!
      const apply = () => {
        if (made) setCustom(made)
        setBizId(id)
        bizRef.current = id
      }
      leaveLive()
      if (reduced) {
        apply()
        return
      }
      const origin = from ?? (wide ? { x: -30, y: WIDE.h * 0.45 } : { x: NARROW.w / 2, y: NARROW.h + 30 })
      setMeteor({ n: Date.now(), from: origin, to: phoneCenter(wide, Boolean(bizId)), emoji: b.emoji })
      sfx("whoosh")
      later(() => {
        apply()
        setFlash((n) => n + 1)
        setMeteor(null)
        sfx("pop")
      }, 520)
    },
    [bizId, later, leaveLive, reduced, sfx, wide]
  )

  const chooseColor = useCallback(
    (i: number) => {
      leaveLive()
      setRipple({ n: Date.now(), color: COLORS[i].hex })
      setColorIdx(i)
      sfx("click")
    },
    [leaveLive, sfx]
  )

  const chooseStyle = useCallback(
    (s: StyleId) => {
      leaveLive()
      setStyle(s)
      sfx("click")
    },
    [leaveLive, sfx]
  )

  const toggleFeature = useCallback(
    (id: FeatureId, force?: boolean) => {
      leaveLive()
      const was = featuresRef.current.includes(id)
      const on = force ?? !was
      const next = on ? (was ? featuresRef.current : [...featuresRef.current, id]) : featuresRef.current.filter((f) => f !== id)
      featuresRef.current = next
      setFeatures(next)
      if (on && !was) {
        const n = Date.now()
        setFlourish({ id, n })
        later(() => setFlourish((f) => (f?.n === n ? null : f)), id === "assistant" ? 1600 : 1900)
      }
      sfx("pop")
    },
    [later, leaveLive, sfx]
  )

  const shake = useCallback(() => {
    if (scope.current) void animateScope(scope.current, { x: [0, -10, 9, -6, 5, -2, 0], y: [0, 3, -3, 2, 0, 0, 0] }, { duration: 0.42 })
  }, [animateScope, scope])

  const launch = useCallback(() => {
    if (!bizRef.current) return
    setAuto(false)
    clearBucket("auto")
    setFlourish(null)
    if (reduced) {
      visitors.set(10000)
      setPhase("live")
      return
    }
    visitors.set(0)
    setPhase("countdown")
    ;[3, 2, 1].forEach((n, i) =>
      later(() => {
        setCount(n)
        shake()
        sfx("tick")
      }, i * 800)
    )
    later(() => {
      setPhase("swarm")
      setLaunchId((x) => x + 1)
      sfx("go")
      animate(visitors, 10000, { duration: 2.6, ease: [0.2, 0.7, 0.3, 1] })
    }, 2400)
  }, [clearBucket, later, reduced, sfx, shake, visitors])

  const onLanded = useCallback(() => {
    setPhase("live")
    sfx("fanfare")
  }, [sfx])

  const reset = useCallback(() => {
    clearBucket("fx")
    clearBucket("auto")
    setAuto(false)
    setBizId(null)
    setFeatures([])
    featuresRef.current = []
    setColorIdx(0)
    setStyle("soft")
    setPhase("build")
    setLaunchId(0)
    setFlourish(null)
    setMeteor(null)
    visitors.set(0)
  }, [clearBucket, visitors])

  const surprise = useCallback(() => {
    clearBucket("auto")
    setAuto(true)
    setPhase("build")
    setLaunchId(0)
    setFeatures([])
    featuresRef.current = []
    const b = pick(BUSINESSES.filter((x) => x.id !== bizId))
    const c = Math.floor(Math.random() * COLORS.length)
    const s = pick(STYLES.filter((x) => x !== style))
    const extras = [...FEATURES].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3))
    const step = reduced ? 0 : 1
    chooseBiz(b.id)
    later(() => chooseColor(c), 1500 * step, "auto")
    later(() => chooseStyle(s), 2300 * step, "auto")
    extras.forEach((f, i) => later(() => toggleFeature(f.id, true), (3100 + i * 900) * step, "auto"))
    later(() => launch(), (3100 + extras.length * 900 + 900) * step, "auto")
  }, [bizId, chooseBiz, chooseColor, chooseStyle, clearBucket, later, launch, reduced, style, toggleFeature])

  /** a manual click stops a running Surprise-me */
  const manual = (fn: () => void) => {
    if (auto) {
      clearBucket("auto")
      setAuto(false)
    }
    fn()
  }

  function chipOrigin(el: HTMLElement): Point {
    const stage = designRef.current?.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (!stage) return center
    return { x: (r.left + r.width / 2 - stage.left) / scale, y: (r.top + r.height / 2 - stage.top) / scale }
  }

  function buildCustom() {
    const text = customText.trim()
    if (text.length < 2) return
    const made = customBusiness(text)
    manual(() => chooseBiz(made.id, undefined, made))
  }

  function buildForReal() {
    if (!biz) return
    const chosen = FEATURES.filter((f) => features.includes(f.id)).map((f) => f.label.toLowerCase())
    const list = chosen.length > 1 ? `${chosen.slice(0, -1).join(", ")} and ${chosen.at(-1)}` : chosen[0]
    const text = `Hi! I'd like a ${biz.label.toLowerCase()} app like "${biz.brand}" — ${COLORS[colorIdx].name.toLowerCase()} colour, ${LOOKS[style].label.toLowerCase()} style${list ? `, with ${list}` : ""}.`
    const type = features.includes("assistant") ? "ai-automation" : features.includes("dashboard") || features.includes("login") ? "web-application" : "website"
    prefillIdea(text, type)
    scrollToTarget("#contact")
  }

  const weeks = biz ? estimateWeeks(biz, features) : 0
  const live = phase === "live"
  const status = !biz
    ? "Pick a business to start building."
    : live
      ? `${biz.brand} is live. 10,000 visitors, zero crashes. Ready in about ${weeks} weeks.`
      : `${biz.brand}: ${COLORS[colorIdx].name}, ${LOOKS[style].label}${features.length ? `, with ${features.join(", ")}` : ""}.`

  return (
    <MotionConfig reducedMotion="user">
      <section id="build" ref={sectionRef} className="relative scroll-mt-0 overflow-clip border-t border-border bg-bg py-16 md:py-20">
        {/* the section takes on the app's colour */}
        <motion.div
          aria-hidden="true"
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.9 }}
          className="pointer-events-none absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/4 rounded-full opacity-[0.13] blur-[120px]"
        />

        <div className="container-studio relative">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
            <span>
              <span className="text-accent">03 //</span> build your app
            </span>
            <span>any business · no sign-up · 10 seconds</span>
          </div>

          <h2 className="font-display mt-6 max-w-3xl text-[clamp(2.4rem,5.4vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
            Your idea, live in <span className="text-accent">ten seconds.</span>
          </h2>
          <p className="mt-4 max-w-xl text-ink-dim">
            Pick a business, paint it, switch on the extras — then launch it and watch 10,000 customers arrive. This is exactly what we build, for real.
          </p>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,21rem)_1fr] lg:gap-10">
            {/* ── controls ─────────────────────────────────────────── */}
            <div className="order-2 space-y-6 lg:order-1">
              <Step n={1} title="What's your business?">
                <div className="flex flex-wrap gap-1.5">
                  {BUSINESSES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      data-testid={`biz-${b.id}`}
                      aria-pressed={bizId === b.id}
                      disabled={busy}
                      onClick={() => manual(() => chooseBiz(b.id))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 ${
                        bizId === b.id ? "border-transparent bg-ink text-bg" : "border-border text-ink hover:border-ink-faint"
                      }`}
                    >
                      <span>{b.emoji}</span>
                      {b.label}
                    </button>
                  ))}
                </div>
                <form
                  className="mt-2.5 flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    buildCustom()
                  }}
                >
                  <label htmlFor="biz-custom" className="sr-only">
                    Or type your own business
                  </label>
                  <input
                    id="biz-custom"
                    data-testid="biz-custom-input"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={28}
                    autoComplete="off"
                    placeholder="✍️ or type yours, e.g. pet grooming"
                    className={`min-w-0 flex-1 rounded-full border bg-transparent px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none ${
                      biz?.id.startsWith("custom:") ? "border-accent" : "border-border"
                    }`}
                  />
                  <button
                    type="submit"
                    data-testid="biz-custom-go"
                    disabled={busy || customText.trim().length < 2}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition-opacity disabled:opacity-30"
                  >
                    Build
                  </button>
                </form>
              </Step>

              <Step n={2} title="Paint it" off={!biz}>
                <div className="flex flex-wrap items-center gap-2.5">
                  {COLORS.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={`${c.name} colour`}
                      aria-pressed={colorIdx === i}
                      disabled={!biz || busy}
                      onClick={() => manual(() => chooseColor(i))}
                      className={`h-8 w-8 rounded-full transition-transform hover:scale-110 disabled:hover:scale-100 ${colorIdx === i ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : ""}`}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
                <div role="group" aria-label="Style" className="mt-3 inline-flex rounded-full border border-border p-1">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={style === s}
                      disabled={!biz || busy}
                      onClick={() => manual(() => chooseStyle(s))}
                      className="relative rounded-full px-4 py-1.5 text-xs font-medium"
                    >
                      {style === s && <motion.span layoutId="style-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className={`relative ${style === s ? "text-bg" : "text-ink-dim"}`} style={{ fontFamily: LOOKS[s].head, fontStyle: LOOKS[s].italic ? "italic" : undefined, textTransform: LOOKS[s].upper ? "uppercase" : undefined }}>
                        {LOOKS[s].label}
                      </span>
                    </button>
                  ))}
                </div>
              </Step>

              <Step n={3} title="Switch on superpowers" off={!biz}>
                <ul className="space-y-1.5">
                  {FEATURES.map((f) => {
                    const on = features.includes(f.id)
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          data-testid={`feature-${f.id}`}
                          disabled={!biz || busy}
                          onClick={() => manual(() => toggleFeature(f.id))}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${on ? "border-accent/60 bg-accent/10" : "border-border hover:border-ink-faint"}`}
                        >
                          <span className="text-lg">{f.emoji}</span>
                          <span className="flex-1">
                            <span className="block text-sm font-medium text-ink">{f.label}</span>
                            <span className="block text-xs text-ink-faint">{f.says}</span>
                          </span>
                          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}>
                            <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 30 }} className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${on ? "right-0.5" : "left-0.5"}`} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Step>

              <Step n={4} title="Go live">
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    data-testid="launch"
                    disabled={!biz || busy}
                    onClick={() => manual(launch)}
                    whileTap={{ scale: 0.94 }}
                    className={`flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-sm font-bold text-white transition-opacity disabled:opacity-40 ${biz && phase === "build" ? "launch-pulse" : ""}`}
                  >
                    <Rocket size={16} /> Launch
                  </motion.button>
                  <button
                    type="button"
                    data-testid="surprise"
                    disabled={busy}
                    onClick={surprise}
                    className="flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-ink transition-colors hover:border-ink-faint disabled:opacity-40"
                  >
                    <Dices size={16} /> Surprise me
                  </button>
                  <button
                    type="button"
                    aria-pressed={sound}
                    aria-label={sound ? "Sound on" : "Sound off"}
                    onClick={() => {
                      soundRef.current = !sound
                      setSound(!sound)
                      if (!sound) blip(660, 0.08)
                    }}
                    className="grid h-11 w-11 place-items-center rounded-full border border-border text-ink-dim transition-colors hover:text-ink"
                  >
                    {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>
              </Step>

              <Receipt biz={biz} colorIdx={colorIdx} style={style} features={features} weeks={weeks} />
            </div>

            {/* ── the stage ───────────────────────────────────────── */}
            <div ref={outerRef} className="order-1 min-w-0 overflow-hidden lg:sticky lg:top-24 lg:order-2" style={{ height: G.h * scale }}>
              <div
                ref={designRef}
                data-testid="build-stage"
                className="relative origin-top-left"
                style={{ width: G.w, height: G.h, transform: `scale(${scale})`, marginLeft: Math.max(0, (boxW - G.w * scale) / 2) }}
              >
                <div ref={scope} className="absolute inset-0" style={{ perspective: 1400 }}>
                  {/* laptop */}
                  {wide && (
                    <motion.div
                      className="absolute"
                      style={{ left: LAPTOP.left, top: LAPTOP.top, width: laptopSpring, skewX: skew, originX: 0 }}
                      initial={false}
                      animate={biz ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -150, scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 140, damping: 18, delay: biz ? 0.25 : 0 }}
                    >
                      <div className="overflow-hidden rounded-t-[14px] border-[7px] border-[#0d0c12] bg-[#0d0c12] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]" style={{ height: LAPTOP.screen }}>
                        <div className="h-full overflow-hidden rounded-[5px]">
                          {biz && <AppScreen biz={biz} color={color} style={style} features={features} wide cols={cols} />}
                        </div>
                      </div>
                      <div className="-mx-5 h-3 rounded-b-xl bg-gradient-to-b from-[#3a3748] to-[#14121e]" />
                      <p className="mt-3 flex items-center justify-end gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                        <span>
                          showing: <span className="text-ink">{deviceName(cols)}</span>
                        </span>
                        {biz && !dragging && (
                          <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="font-hand text-lg normal-case tracking-normal text-ink-dim">
                            drag the edge to squish it ↗
                          </motion.span>
                        )}
                      </p>
                      {biz && (
                        <button
                          type="button"
                          aria-label="Stretch the laptop to see the app on smaller screens"
                          onPointerDown={startStretch}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " " || e.key === "ArrowLeft") {
                              e.preventDefault()
                              squishByKeyboard()
                            }
                          }}
                          className="group absolute -right-5 top-[120px] flex h-24 w-6 cursor-ew-resize touch-none items-center justify-center"
                        >
                          <span className={`h-16 w-1.5 rounded-full transition-colors ${dragging ? "bg-accent" : "bg-ink-faint group-hover:bg-ink"}`} />
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* orbiting business chips (before anything is chosen) */}
                  <AnimatePresence>
                    {!biz && wide && !meteor && (
                      <motion.div
                        key="orbit"
                        aria-hidden="true"
                        className="absolute"
                        style={{ left: WIDE.w / 2, top: WIDE.h / 2, width: 0, height: 0 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1, rotate: inView && !reduced ? 360 : 0 }}
                        exit={{ opacity: 0, scale: 1.4, transition: { duration: 0.35 } }}
                        transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" }, default: { duration: 0.6 } }}
                      >
                        {BUSINESSES.filter((b) => ORBIT_IDS.includes(b.id)).map((b, i) => {
                          const a = (i / ORBIT_IDS.length) * Math.PI * 2 - Math.PI / 2
                          return (
                            <div key={b.id} className="absolute" style={{ left: Math.cos(a) * 300, top: Math.sin(a) * 270 }}>
                              <motion.button
                                type="button"
                                tabIndex={-1}
                                onClick={(e) => { const from = chipOrigin(e.currentTarget); manual(() => chooseBiz(b.id, from)) }}
                                animate={{ rotate: inView && !reduced ? -360 : 0 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                whileHover={{ scale: 1.15 }}
                                className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-bg-raised/90 px-4 py-2.5 text-sm font-medium text-ink shadow-[0_0_30px_-6px_rgba(124,92,255,0.6)] backdrop-blur"
                              >
                                <span className="text-xl">{b.emoji}</span>
                                {b.label}
                              </motion.button>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* phone */}
                  <motion.div
                    data-testid="app-phone"
                    className="absolute z-10"
                    style={{ width: PHONE.w, height: PHONE.h, marginLeft: -PHONE.w / 2, marginTop: -PHONE.h / 2 }}
                    initial={false}
                    animate={{
                      left: center.x,
                      top: center.y,
                      rotateY: biz ? -6 : inView && !reduced ? [-14, 14] : 0,
                      rotateX: biz ? 3 : 6,
                      scale: phase === "swarm" ? [1, 1.035, 1] : 1,
                    }}
                    transition={{
                      left: { type: "spring", stiffness: 120, damping: 18 },
                      top: { type: "spring", stiffness: 120, damping: 18 },
                      rotateY: biz ? { type: "spring", stiffness: 100, damping: 15 } : { duration: 3.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                      scale: phase === "swarm" ? { duration: 0.35, repeat: Infinity } : { duration: 0.3 },
                    }}
                  >
                    <div
                      className="relative h-full w-full rounded-[40px] border border-[#2a2838] bg-[#0d0c12] p-[7px] transition-shadow duration-700"
                      style={{ boxShadow: biz ? `0 40px 90px -30px rgba(0,0,0,0.9), 0 0 70px -20px ${color}` : "0 40px 90px -30px rgba(0,0,0,0.9)" }}
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[33px]">
                        {biz ? (
                          <AppScreen biz={biz} color={color} style={style} features={features} flourish={flourish} />
                        ) : (
                          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_40%,#1d1a2b,#09080d)] text-center">
                            <div>
                              <motion.span
                                className="mx-auto block h-3 w-3 rounded-full bg-accent"
                                animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1.6, repeat: Infinity }}
                              />
                              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">empty app</p>
                              <p className="font-hand mt-1 text-2xl text-ink">{wide ? "pick a business ✦" : "pick a business ↓"}</p>
                            </div>
                          </div>
                        )}
                        {/* the arrival flash */}
                        <AnimatePresence>
                          {flash > 0 && (
                            <motion.div
                              key={flash}
                              aria-hidden="true"
                              initial={{ opacity: 1, scale: 0.2 }}
                              animate={{ opacity: 0, scale: 2.4 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              className="pointer-events-none absolute inset-0 z-30 rounded-full bg-[radial-gradient(circle,#fff_0%,rgba(255,255,255,0.6)_35%,transparent_70%)]"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="absolute left-1/2 top-[13px] z-40 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#0d0c12]" />
                    </div>
                  </motion.div>

                  {/* paint wave */}
                  <AnimatePresence>
                    {ripple && (
                      <motion.div
                        key={ripple.n}
                        aria-hidden="true"
                        className="pointer-events-none absolute z-20 rounded-full"
                        style={{ left: center.x - 40, top: center.y - 40, width: 80, height: 80, border: `6px solid ${ripple.color}`, background: `${ripple.color}33` }}
                        initial={{ scale: 0.2, opacity: 0.9 }}
                        animate={{ scale: 14, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        onAnimationComplete={() => setRipple((r) => (r?.n === ripple.n ? null : r))}
                      />
                    )}
                  </AnimatePresence>

                  {/* the business flying into the phone */}
                  <AnimatePresence>
                    {meteor && (
                      <motion.div
                        key={meteor.n}
                        aria-hidden="true"
                        className="pointer-events-none absolute z-40 grid h-16 w-16 place-items-center rounded-full text-3xl"
                        style={{ marginLeft: -32, marginTop: -32, background: "radial-gradient(circle, #fff 0%, rgba(124,92,255,0.8) 45%, transparent 70%)", boxShadow: "0 0 60px 20px rgba(124,92,255,0.55)" }}
                        initial={{ left: meteor.from.x, top: meteor.from.y, scale: 0.6, opacity: 0 }}
                        animate={{ left: meteor.to.x, top: meteor.to.y, scale: [0.6, 1.5, 0.3], opacity: [0, 1, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.52, ease: [0.55, 0, 0.75, 0.4] }}
                      >
                        {meteor.emoji}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Swarm launchId={launchId} color={color} target={{ x: center.x / G.w, y: center.y / G.h }} onLanded={onLanded} />

                {/* countdown */}
                <AnimatePresence>
                  {phase === "countdown" && (
                    <motion.div key={count} className="pointer-events-none absolute inset-0 z-40 grid place-items-center" initial={{ opacity: 0, scale: 2.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                      <span className="font-display text-[180px] font-bold leading-none" style={{ color, textShadow: `0 0 60px ${color}` }}>
                        {count}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* live numbers */}
                <AnimatePresence>
                  {(phase === "swarm" || live) && (
                    <motion.div
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -30, opacity: 0 }}
                      className={`absolute left-1/2 top-2 z-40 flex -translate-x-1/2 gap-2 font-mono ${wide ? "text-xs" : "flex-col text-[11px]"}`}
                    >
                      <span className="whitespace-nowrap rounded-full border border-border bg-bg/85 px-3 py-1.5 text-ink backdrop-blur">
                        👥 <motion.span data-testid="visitors">{visitorsText}</motion.span> visitors
                      </span>
                      <span className="whitespace-nowrap rounded-full border border-border bg-bg/85 px-3 py-1.5 text-ink backdrop-blur">💥 0 crashes</span>
                      <span className="whitespace-nowrap rounded-full border border-border bg-bg/85 px-3 py-1.5 text-ink backdrop-blur">⚡ loads in 0.4s</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* the finale */}
                <AnimatePresence>
                  {live && biz && (
                    <motion.div
                      data-testid="launch-card"
                      initial={{ y: 40, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 40, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className={`absolute z-40 rounded-2xl border border-border bg-bg-raised/95 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur ${wide ? "bottom-10 right-4 w-[330px]" : "inset-x-3 bottom-3"}`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color }}>
                        🎉 it's live
                      </p>
                      <p className="font-display mt-1 text-2xl font-bold leading-tight text-ink">{biz.brand} is open.</p>
                      <p className="mt-1 text-sm text-ink-dim">
                        Your {biz.label.toLowerCase()} app, for real — ready in about <span className="font-semibold text-ink">{weeks} weeks</span>.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={buildForReal} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5">
                          Build this for real <ArrowRight size={15} />
                        </button>
                        <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm text-ink-dim transition-colors hover:text-ink">
                          <RotateCcw size={14} /> start over
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {status}
        </p>
      </section>
    </MotionConfig>
  )
}

function Step({ n, title, off = false, children }: { n: number; title: string; off?: boolean; children: ReactNode }) {
  return (
    <div className={`transition-opacity duration-500 ${off ? "opacity-40" : ""}`}>
      <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] text-accent">{n}</span>
        {title}
      </p>
      {children}
    </div>
  )
}

/** A build ticket that prints itself line by line as choices are made. */
function Receipt({ biz, colorIdx, style, features, weeks }: { biz: (typeof BUSINESSES)[number] | null; colorIdx: number; style: StyleId; features: FeatureId[]; weeks: number }) {
  const lines = biz
    ? [
        { k: "biz", l: `${biz.emoji} ${biz.label} app`, r: biz.brand },
        { k: `color-${colorIdx}`, l: "🎨 Colour", r: COLORS[colorIdx].name },
        { k: `style-${style}`, l: "✒️ Style", r: LOOKS[style].label },
        { k: "screens", l: "📱 Phone · tablet · laptop", r: "✓" },
        ...FEATURES.filter((f) => features.includes(f.id)).map((f) => ({ k: f.id, l: `${f.emoji} ${f.label}`, r: "✓" })),
      ]
    : []
  return (
    <div data-testid="receipt" className="relative bg-[#f4efe4] px-4 pb-5 pt-4 font-mono text-[11px] text-[#2f2b26] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex justify-between border-b border-dashed border-[#2f2b26]/30 pb-2 text-[10px] uppercase tracking-[0.15em]">
        <span>sapvy · build ticket</span>
        <span>#0427</span>
      </div>
      <ul className="py-2">
        <AnimatePresence initial={false}>
          {lines.length === 0 && (
            <motion.li key="empty" exit={{ opacity: 0, height: 0 }} className="py-1 text-[#2f2b26]/50">
              waiting for your idea…
            </motion.li>
          )}
          {lines.map((line) => (
            <motion.li
              key={line.k}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <span className="flex justify-between gap-3 py-0.5">
                <span>{line.l}</span>
                <span className="font-bold">{line.r}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="flex justify-between border-t border-dashed border-[#2f2b26]/30 pt-2 font-bold">
        <span>READY IN</span>
        <span data-testid="receipt-weeks">{biz ? `≈ ${weeks} weeks` : "—"}</span>
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-2 h-2"
        style={{ background: "linear-gradient(135deg, #f4efe4 50%, transparent 50%) 0 0 / 10px 8px repeat-x, linear-gradient(225deg, #f4efe4 50%, transparent 50%) 0 0 / 10px 8px repeat-x" }}
      />
    </div>
  )
}
