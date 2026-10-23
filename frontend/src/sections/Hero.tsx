import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { TypedText } from "../animations/TypedText"
import { MagneticButton } from "../animations/MagneticButton"
import { WindowChrome } from "../components/WindowChrome"
import { projects } from "../data/projects"
import { whatsappUrl } from "../data/contact"

const windowImages = [projects[0], projects[1], projects[2], projects[3]]

type FloatingWindow = {
  project: (typeof projects)[number]
  className: string
  rotate: number
  fromX: number
  fromY: number
  delay: number
  speed: "back" | "mid" | "fore"
}

const WINDOWS: FloatingWindow[] = [
  {
    project: windowImages[0],
    className: "absolute left-[2%] top-[14%] w-[42vw] max-w-64 sm:left-[5%] sm:w-[24vw]",
    rotate: -3,
    fromX: -70,
    fromY: -40,
    delay: 0.5,
    speed: "back",
  },
  {
    project: windowImages[1],
    className: "absolute right-[3%] top-[10%] hidden w-[20vw] max-w-56 sm:block",
    rotate: 2,
    fromX: 70,
    fromY: -30,
    delay: 0.65,
    speed: "mid",
  },
  {
    project: windowImages[2],
    className: "absolute bottom-[6%] left-[6%] hidden w-[26vw] max-w-52 md:block",
    rotate: 2.5,
    fromX: -60,
    fromY: 50,
    delay: 0.8,
    speed: "fore",
  },
  {
    project: windowImages[3],
    className: "absolute bottom-[12%] right-[5%] hidden w-[18vw] max-w-48 lg:block",
    rotate: -2,
    fromX: 60,
    fromY: 40,
    delay: 0.95,
    speed: "mid",
  },
]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })

  const yBack = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "36%"])
  const yFore = useTransform(scrollYProgress, [0, 1], ["0%", "55%"])
  const speedMap = { back: yBack, mid: yMid, fore: yFore }

  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bg pt-24 md:pt-28"
    >
      {/* ambient signature glow — replaces "plain black" with intent */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[40vh] w-[40vh] rounded-full bg-amber/10 blur-[120px]" />
      </div>

      {/* floating project windows — the work itself, present from the first frame */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { scale: stageScale }}
        className="pointer-events-none absolute inset-0 opacity-90"
      >
        {WINDOWS.map((w, i) => (
          <motion.div
            key={i}
            style={prefersReducedMotion ? undefined : { y: speedMap[w.speed] }}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: w.fromX, y: w.fromY, rotate: 0, scale: 0.9 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0, y: 0, rotate: w.rotate, scale: 1 }
            }
            transition={{ duration: 1, delay: w.delay, ease: [0.16, 1, 0.3, 1] }}
            className={w.className}
          >
            <WindowChrome label={`${w.project.id}.app`} className="shadow-2xl shadow-black/50">
              <img
                src={w.project.image.src}
                alt={w.project.image.alt}
                className="aspect-[4/3] w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </WindowChrome>
          </motion.div>
        ))}
      </motion.div>

      {/* content — the terminal window is the interface */}
      <motion.div
        style={prefersReducedMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        className="container-studio relative z-10 flex flex-col items-center px-4 text-center"
      >
        <WindowChrome
          label="studio — zsh"
          className="w-full max-w-2xl text-left shadow-2xl shadow-black/60"
        >
          <div className="px-5 py-8 sm:px-8 sm:py-10">
            <p className="font-mono text-xs text-ink-faint sm:text-sm">
              <span className="text-accent">studio</span>@web:~$ init
            </p>

            <h1 className="font-display mt-4 text-balance text-[clamp(1.9rem,7vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-ink">
              <TypedText text="We make websites and apps." speed={0.032} />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.6 }}
              className="mt-4 font-mono text-sm text-ink-dim sm:text-base"
            >
              <span className="text-amber">//</span> Have an idea? We design and build it —
              start to finish, by one dedicated team.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <MagneticButton
                as="a"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 font-mono text-xs font-medium uppercase tracking-[0.1em] text-ink-inverse transition-colors hover:bg-accent-dim"
              >
                let's connect
                <ArrowUpRight size={15} />
              </MagneticButton>
              <a
                href="#work"
                className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-dim transition-colors hover:text-ink"
              >
                view work
                <span className="h-px w-6 bg-ink-dim transition-all group-hover:w-9 group-hover:bg-ink" />
              </a>
            </motion.div>
          </div>
        </WindowChrome>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">scroll</span>
        <ArrowDown size={14} className="animate-bounce text-ink-faint" />
      </motion.div>
    </section>
  )
}
