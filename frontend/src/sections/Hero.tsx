import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { setSurface } from "../lib/surface"
import { scrollToTarget } from "../lib/scroll"
import { COLORS, LANDSCAPE, PORTRAIT, STAGES, T, place, type Blueprint } from "./hero/blueprint"
import { SketchLayer } from "./hero/SketchLayer"
import { CodeLayer, FinalLayer } from "./hero/FinalLayer"
import { PencilTrail } from "./hero/PencilTrail"
import { DeployLog } from "./hero/DeployLog"
import { StageRail, StageStrip } from "./hero/StageRail"

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [query])
  return matches
}

function useBlueprint(): Blueprint {
  return useMedia("(max-width: 640px)") ? PORTRAIT : LANDSCAPE
}

/** where the page is left on paper; past this the surface is ink */
const PAPER_UNTIL = 0.47
/** x-ray lens radius as a fraction of the artboard width */
const LENS_SIZE = 0.15

/**
 * The hero is the studio's process, performed: a blank sheet, a pencil
 * sketch that draws itself, a wireframe, the finished design, the code
 * underneath and finally a deploy. With reduced motion it is simply the
 * finished hero plus the five stages.
 */
export function Hero() {
  const bp = useBlueprint()
  return useReducedMotion() ? <StaticHero bp={bp} /> : <BuildHero bp={bp} />
}

function BuildHero({ bp }: { bp: Blueprint }) {
  const ref = useRef<HTMLElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const finePointer = useMedia("(pointer: fine)")
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  // Mirror the scroll into a plain motion value. Framer otherwise hands
  // direct scroll→opacity/colour mappings to a native ViewTimeline, which
  // measures this sticky stage differently and drifts out of step with the
  // JS-driven parts (clip, mask, stage state). One clock for everything.
  const p = useMotionValue(scrollYProgress.get())

  const [stage, setStage] = useState(0)
  const [deployStep, setDeployStep] = useState(0)
  const [onPaper, setOnPaper] = useState(true)

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    p.set(v)
    let s = 0
    T.stageStarts.forEach((start, i) => v >= start && (s = i))
    setStage(s)
    setDeployStep(T.deploy.filter((d) => v >= d).length)
    setOnPaper(v < PAPER_UNTIL)
  })

  useEffect(() => setSurface(onPaper ? "paper" : "ink"), [onPaper])
  useEffect(() => () => setSurface("ink"), [])

  // Paper → ink is an ink spill spreading across the desk (not a colour
  // fade, which passes through mud-grey); the artboard itself stays white
  // until the finished design floods over it.
  const spill = useTransform(p, [...T.ink], [0, 150])
  const spillClip = useMotionTemplate`circle(${spill}% at 50% 62%)`
  const noteColor = useTransform<number, string>(p, [...T.ink], [COLORS.pencil, COLORS.inkText])
  const paperOpacity = useTransform(p, [...T.ink], [1, 0])
  const wireLabels = useTransform(p, [T.wireIn[0], T.wireIn[1], T.ink[0], T.flood[0]], [0, 1, 1, 0])
  const codeOpacity = useTransform(p, [T.codeLabels[0] - 0.02, T.codeLabels[0]], [0, 1])
  const flood = useTransform(p, [...T.flood], [0, 150])
  const clip = useMotionTemplate`circle(${flood}% at 16% 64%)`
  const hintOpacity = useTransform(p, [0, 0.03], [1, 0])

  // ── x-ray lens ─────────────────────────────────────────────────────────
  const boardW = useRef(1000)
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => (boardW.current = e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const lensOpen = useTransform(p, [...T.lens], [0, 1, 1, 0])
  const lensR = useTransform(lensOpen, (v) => v * boardW.current * LENS_SIZE)
  const lensTargetX = useMotionValue(0)
  const lensTargetY = useMotionValue(0)
  const lx = useSpring(lensTargetX, { stiffness: 140, damping: 22 })
  const ly = useSpring(lensTargetY, { stiffness: 140, damping: 22 })
  const lastPointer = useRef(0)
  const mask = useMotionTemplate`radial-gradient(circle ${lensR}px at ${lx}px ${ly}px, transparent 97%, #000 100%)`
  const ringSize = useTransform(lensR, (r) => r * 2)
  const ringOpacity = useTransform(lensOpen, [0, 0.05], [0, 1])

  // With no recent mouse movement (or on touch) the lens wanders by itself.
  useEffect(() => {
    let frame = 0
    const wander = (t: number) => {
      const el = boardRef.current
      if (el && performance.now() - lastPointer.current > 1600) {
        const w = el.clientWidth
        const h = el.clientHeight
        lensTargetX.set(w * (0.5 + 0.32 * Math.sin(t / 1400)))
        lensTargetY.set(h * (0.5 + 0.26 * Math.sin(t / 900)))
      }
      frame = lensOpen.get() > 0 ? requestAnimationFrame(wander) : 0
    }
    const unsub = lensOpen.on("change", (v) => {
      if (v > 0 && !frame) frame = requestAnimationFrame(wander)
    })
    if (lensOpen.get() > 0) frame = requestAnimationFrame(wander)
    return () => {
      unsub()
      cancelAnimationFrame(frame)
    }
  }, [lensOpen, lensTargetX, lensTargetY])

  // Keyboard users can tab onto the CTAs before the design has flooded in;
  // jump the build forward so whatever they focus is actually on screen.
  function onFinalFocus() {
    const el = ref.current
    if (!el || p.get() >= T.flood[1]) return
    scrollToTarget(el.offsetTop + (el.offsetHeight - window.innerHeight) * T.flood[1])
  }

  function onBoardPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return
    const rect = e.currentTarget.getBoundingClientRect()
    lastPointer.current = performance.now()
    lensTargetX.set(e.clientX - rect.left)
    lensTargetY.set(e.clientY - rect.top)
  }

  const ratio = bp.width / bp.height
  const reserve = bp.name === "landscape" ? 250 : 290

  return (
    <section id="top" ref={ref} aria-label="Intro" className="relative h-[520vh]">
      {/* nav "process" lands at the start of the UI/UX stage */}
      <div id="process" className="absolute left-0 h-px w-px" style={{ top: `${T.stageStarts[1] * 420 + 4}vh` }} />

      <div
        style={{ backgroundColor: COLORS.paper }}
        className={`sticky top-0 h-[100svh] overflow-hidden ${onPaper && finePointer ? "cursor-pencil" : ""}`}
      >
        <motion.div aria-hidden="true" style={{ opacity: paperOpacity }} className="paper-grid absolute inset-0" />
        <motion.div aria-hidden="true" style={{ clipPath: spillClip, backgroundColor: COLORS.ink }} className="absolute inset-0" />
        <PencilTrail active={onPaper && finePointer} />

        <div className="container-studio relative z-10 grid h-full grid-cols-1 items-center gap-10 pb-6 pt-24 lg:grid-cols-[220px_1fr] lg:pt-28">
          <StageRail active={stage} progress={p} onPaper={onPaper} />

          <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 sm:gap-4">
            <Note stage={stage} color={noteColor} finePointer={finePointer} />
            <div className="w-full max-w-md lg:hidden">
              <StageStrip active={stage} onPaper={onPaper} />
            </div>

            <div
              ref={boardRef}
              data-testid="hero-artboard"
              onPointerMove={onBoardPointer}
              className="relative [container-type:inline-size]"
              style={{ width: `min(100%, calc((100svh - ${reserve}px) * ${ratio}))`, aspectRatio: `${ratio}` }}
            >
              <div
                aria-hidden="true"
                style={{ backgroundColor: COLORS.board }}
                className="absolute inset-0 rounded-[1.2cqw] shadow-[0_30px_80px_-30px_rgba(47,43,38,0.45)]"
              />
              <SketchLayer bp={bp} progress={p} />
              <WireLabels bp={bp} opacity={wireLabels} />

              <motion.div style={{ opacity: codeOpacity }} className="absolute inset-0">
                <CodeLayer bp={bp} />
              </motion.div>

              <motion.div
                onFocus={onFinalFocus}
                style={{ clipPath: clip, WebkitClipPath: clip, maskImage: mask, WebkitMaskImage: mask }}
                className="absolute inset-0"
              >
                <FinalLayer bp={bp} />
              </motion.div>

              <motion.div
                aria-hidden="true"
                style={{ x: lx, y: ly, width: ringSize, height: ringSize, opacity: ringOpacity }}
                className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent shadow-[0_0_0_6px_rgba(124,92,255,0.15)]"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent px-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-inverse">
                  x-ray
                </span>
              </motion.div>

              <DeployLog step={deployStep} />
            </div>
          </div>
        </div>

        <motion.p
          aria-hidden="true"
          style={{ opacity: hintOpacity, color: noteColor }}
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={{ delay: 3.4, duration: 0.6 }}
          className="font-hand pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-xl sm:text-2xl"
        >
          scroll — watch it get built ↓
        </motion.p>
      </div>
    </section>
  )
}

/** The designer's handwritten note above the artboard; rewritten per stage. */
function Note({ stage, color, finePointer }: { stage: number; color: MotionValue<string>; finePointer: boolean }) {
  const s = STAGES[stage]
  return (
    <motion.div aria-hidden="true" style={{ color }} className="relative flex h-12 items-end justify-center sm:h-16">
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          // negative insets leave room for Caveat's slanted overhang
          initial={{ clipPath: "inset(-30% 100% -30% -8%)", rotate: -2 }}
          animate={{ clipPath: "inset(-30% -12% -30% -8%)", rotate: -2 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
          transition={{ duration: 0.8, delay: stage === 0 ? 0.2 : 0.05, ease: "easeOut" }}
          className="relative"
        >
          <span className="font-hand text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-none">{s.note}</span>
          {s.id === "development" && finePointer && (
            <span className="font-hand ml-3 text-xl opacity-60">(move your mouse over it)</span>
          )}
          <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full">
            <motion.path
              d="M2 10 C 60 2, 120 14, 180 7 S 270 4, 298 9"
              fill="none"
              stroke={stage >= 2 ? COLORS.accent : "currentColor"}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: stage === 0 ? 1 : 0.7 }}
            />
          </svg>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

/** Mono spec labels that appear on the wireframe during UI/UX. */
function WireLabels({ bp, opacity }: { bp: Blueprint; opacity: MotionValue<number> }) {
  const labels = [
    { b: bp.logo, t: "logo" },
    ...(bp.nav ? [{ b: bp.nav, t: "nav × 3" }] : []),
    { b: bp.h1, t: `h1 · ${Math.round(bp.type.h1 * 10)}px` },
    { b: bp.sub, t: "body · lead" },
    { b: bp.cta, t: "button.primary" },
    { b: bp.image, t: "image 4:3" },
    { b: bp.cards[0], t: `card × ${bp.cards.length}` },
  ]
  return (
    <motion.div aria-hidden="true" style={{ opacity }} className="pointer-events-none absolute inset-0">
      {labels.map(({ b, t }) => (
        <div key={t} className="absolute" style={place(bp, b)}>
          <span
            className="absolute -top-[1.6em] left-0 whitespace-nowrap font-mono uppercase tracking-[0.1em] text-[#8a8377]"
            style={{ fontSize: `${Math.max(bp.type.ui * 0.85, 1)}cqw` }}
          >
            {t}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

/** Reduced motion: the finished hero, then the five stages laid out flat. */
function StaticHero({ bp }: { bp: Blueprint }) {
  const ratio = bp.width / bp.height
  return (
    <section id="top" aria-label="Intro" className="relative bg-bg pb-20 pt-28">
      <div className="container-studio">
        <div
          className="relative mx-auto [container-type:inline-size]"
          style={{ width: `min(100%, 1000px)`, aspectRatio: `${ratio}` }}
        >
          <FinalLayer bp={bp} />
        </div>
        <div id="process" className="mx-auto mt-16 max-w-5xl scroll-mt-24">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">One team, five stages.</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((s) => (
              <li key={s.id}>
                <h3 className="font-display flex items-baseline gap-2 text-lg font-bold text-ink">
                  <span className="font-mono text-[10px] font-normal text-accent">{s.phase}</span>
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
