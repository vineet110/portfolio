import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion"
import { useEffect, useId, useRef } from "react"
import { COLORS, T, type Blueprint, type Box } from "./blueprint"

function rect(b: Box, r = 6) {
  const { x, y, w, h } = b
  r = Math.min(r, h / 2, w / 2)
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
}

function line(x1: number, y1: number, x2: number, y2: number) {
  return `M${x1} ${y1}L${x2} ${y2}`
}

/** A loose back-and-forth scribble standing in for a paragraph. */
function scribble(b: Box, rows: number) {
  let d = ""
  for (let r = 0; r < rows; r++) {
    const y = b.y + (b.h / rows) * (r + 0.5)
    const end = b.x + b.w * (r === rows - 1 ? 0.62 : 0.95)
    d += `M${b.x} ${y}`
    for (let x = b.x + 14; x < end; x += 14) d += `Q${x - 7} ${y - 7} ${x} ${y}`
  }
  return d
}

type Shape = { d: string; key: string }
type Note = { text: string; x: number; y: number; size: number; w: number; key: string; anchor?: "middle" }
type Bar = { b: Box; key: string }

/** Everything the sketch draws, derived from the shared blueprint. */
function draft(bp: Blueprint) {
  const { width: W, height: H, bar } = bp
  const outlines: Shape[] = [
    { key: "frame", d: rect({ x: 3, y: 3, w: W - 6, h: H - 6 }, 12) },
    { key: "bar", d: line(3, bar, W - 3, bar) },
    { key: "dots", d: [0, 1, 2].map((i) => circle(22 + i * 16, bar / 2 + 1, 4.5)).join("") },
  ]
  if (bp.nav) {
    const n = bp.nav
    const step = n.w / 3
    outlines.push({
      key: "nav",
      d: [0, 1, 2].map((i) => line(n.x + i * step, n.y + n.h / 2, n.x + i * step + step - 28, n.y + n.h / 2)).join(""),
    })
    outlines.push({ key: "navCta", d: rect(bp.navCta, bp.navCta.h / 2) })
  } else {
    const c = bp.navCta
    outlines.push({
      key: "burger",
      d: [0.25, 0.5, 0.75].map((f) => line(c.x + 12, c.y + c.h * f, c.x + c.w - 12, c.y + c.h * f)).join(""),
    })
  }
  outlines.push(
    { key: "cta", d: rect(bp.cta, bp.cta.h / 2) },
    { key: "link", d: line(bp.link.x, bp.link.y + bp.link.h, bp.link.x + bp.link.w * 0.8, bp.link.y + bp.link.h) },
    { key: "image", d: rect(bp.image, 8) },
    {
      key: "imageX",
      d:
        line(bp.image.x, bp.image.y, bp.image.x + bp.image.w, bp.image.y + bp.image.h) +
        line(bp.image.x + bp.image.w, bp.image.y, bp.image.x, bp.image.y + bp.image.h),
    },
    ...bp.cards.map((c, i) => {
      const t = Math.min(c.h - 24, c.w * 0.32)
      const thumb = { x: c.x + 12, y: c.y + 12, w: t, h: t }
      return { key: `card${i}`, d: rect(c, 8) + rect(thumb, 4) }
    })
  )

  const s = bp.name === "landscape" ? 1 : 0.85
  const lineH = bp.h1.h / bp.scribble.length
  const notes: Note[] = [
    { key: "logo", text: "studio.", x: bp.logo.x, y: bp.logo.y + bp.logo.h * 0.85, size: 30 * s, w: bp.logo.w },
    ...bp.scribble.map((t, i) => ({
      key: `h1-${i}`,
      text: t,
      x: bp.h1.x,
      y: bp.h1.y + lineH * (i + 0.82),
      size: lineH * 0.95,
      w: bp.h1.w,
    })),
    {
      key: "cta",
      text: "let's connect →",
      x: bp.cta.x + bp.cta.w / 2,
      y: bp.cta.y + bp.cta.h * 0.68,
      size: 26 * s,
      w: bp.cta.w,
      anchor: "middle",
    },
    { key: "link", text: "see work", x: bp.link.x, y: bp.link.y + bp.link.h * 0.75, size: 24 * s, w: bp.link.w },
    {
      key: "image",
      text: "big picture here!",
      x: bp.image.x + bp.image.w / 2,
      y: bp.image.y + bp.image.h / 2 - 10,
      size: 30 * s,
      w: bp.image.w,
      anchor: "middle",
    },
    ...["web", "mobile", "design"].map((t, i) => {
      const c = bp.cards[i]
      const tx = c.x + 12 + Math.min(c.h - 24, c.w * 0.32) + 12
      return { key: `card${i}`, text: t, x: tx, y: c.y + 40 * s, size: 26 * s, w: c.x + c.w - tx }
    }),
  ]
  if (bp.nav) {
    notes.push({
      key: "navCta",
      text: "talk!",
      x: bp.navCta.x + bp.navCta.w / 2,
      y: bp.navCta.y + bp.navCta.h * 0.72,
      size: 24,
      w: bp.navCta.w,
      anchor: "middle",
    })
  }

  const scribbles: Shape[] = [{ key: "sub", d: scribble(bp.sub, 2) }]

  const bars: Bar[] = [
    { key: "logo", b: { ...bp.logo, h: bp.logo.h * 0.7, y: bp.logo.y + bp.logo.h * 0.15 } },
    ...bp.scribble.slice(0, 2).map((_, i, arr) => ({
      key: `h1-${i}`,
      b: {
        x: bp.h1.x,
        y: bp.h1.y + (bp.h1.h / arr.length) * i + 10,
        w: bp.h1.w * (i === 0 ? 0.96 : 0.64),
        h: bp.h1.h / arr.length - 24,
      },
    })),
    ...[0, 1].map((i) => ({
      key: `sub-${i}`,
      b: { x: bp.sub.x, y: bp.sub.y + (bp.sub.h / 2) * i + 8, w: bp.sub.w * (i === 0 ? 1 : 0.7), h: 12 },
    })),
    ...bp.cards.flatMap((c, i) => {
      const tx = c.x + 12 + Math.min(c.h - 24, c.w * 0.32) + 12
      const tw = c.x + c.w - 12 - tx
      return [
        { key: `card${i}a`, b: { x: tx, y: c.y + 18, w: tw * 0.7, h: 12 } },
        { key: `card${i}b`, b: { x: tx, y: c.y + 40, w: tw, h: 8 } },
        { key: `card${i}c`, b: { x: tx, y: c.y + 56, w: tw * 0.8, h: 8 } },
      ]
    }),
  ]

  return { outlines, notes, scribbles, bars }
}

/** seconds between pencil strokes in the opening draw-in */
const STROKE_GAP = 0.16
const FIRST_STROKE = 0.45

/**
 * The artboard drawn twice over: first as a wobbly pencil sketch that draws
 * itself on load (with a slight "line boil", like hand-drawn animation),
 * then — as the visitor scrolls — the wobble settles, the handwriting gives
 * way to grey placeholder bars, and the same lines become a wireframe.
 * Purely decorative: the real content lives in FinalLayer.
 */
export function SketchLayer({ bp, progress }: { bp: Blueprint; progress: MotionValue<number> }) {
  const uid = useId().replace(/:/g, "")
  const filterId = `wobble-${uid}`
  const groupRef = useRef<SVGGElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const { outlines, notes, scribbles, bars } = draft(bp)

  const wobble = useTransform(progress, [...T.straighten], [7, 0])
  const handOpacity = useTransform(progress, [...T.handwritingOut], [1, 0])
  const echoOpacity = useTransform(progress, [T.straighten[0], T.handwritingOut[1]], [0.45, 0])
  const wireOpacity = useTransform(progress, [...T.wireIn], [0, 1])
  const stroke = useTransform(
    progress,
    [T.straighten[0], T.straighten[1], T.ink[0], T.ink[1], T.codeLabels[0], T.codeLabels[1]],
    [COLORS.pencil, COLORS.wire, COLORS.wire, COLORS.lineDark, COLORS.lineDark, COLORS.accent]
  )

  // Drive the filter imperatively — SVG filter primitives aren't animatable
  // through style. Below a hair of wobble the filter is dropped entirely so
  // the wireframe renders crisp (and cheap).
  const applyWobble = (v: number) => {
    dispRef.current?.setAttribute("scale", v.toFixed(2))
    if (v < 0.05) groupRef.current?.removeAttribute("filter")
    else groupRef.current?.setAttribute("filter", `url(#${filterId})`)
  }
  useMotionValueEvent(wobble, "change", applyWobble)
  useEffect(() => applyWobble(wobble.get()))

  // Line boil: re-seed the noise a few times a second while it's a sketch.
  useEffect(() => {
    let seed = 1
    const timer = window.setInterval(() => {
      if (wobble.get() < 1 || document.hidden) return
      seed = (seed % 3) + 1
      turbRef.current?.setAttribute("seed", String(seed))
    }, 160)
    return () => window.clearInterval(timer)
  }, [wobble])

  let order = 0
  const next = () => FIRST_STROKE + STROKE_GAP * order++

  return (
    <motion.svg
      aria-hidden="true"
      viewBox={`0 0 ${bp.width} ${bp.height}`}
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ color: stroke }}
    >
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="1" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {notes.map((n) => (
          <clipPath key={n.key} id={`hw-${uid}-${n.key}`}>
            <motion.rect
              x={n.anchor === "middle" ? n.x - n.w / 2 : n.x - 4}
              y={n.y - n.size * 1.1}
              height={n.size * 1.6}
              initial={{ width: 0 }}
              animate={{ width: n.w + 8 }}
              transition={{ duration: 0.7, delay: FIRST_STROKE + 0.9 + STROKE_GAP * notes.indexOf(n), ease: "easeOut" }}
            />
          </clipPath>
        ))}
      </defs>

      <g ref={groupRef} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {outlines.map((s) => (
          <motion.path
            key={s.key}
            d={s.d}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: next(), ease: "easeInOut" }}
          />
        ))}

        {/* second, offset pass — the "drawn twice" look of a quick sketch */}
        <motion.g style={{ opacity: echoOpacity }} transform="translate(1.8 1.4)" strokeWidth={1.2}>
          {outlines.map((s, i) => (
            <motion.path
              key={s.key}
              d={s.d}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: FIRST_STROKE + 0.08 + STROKE_GAP * i, ease: "easeInOut" }}
            />
          ))}
        </motion.g>

        <motion.g style={{ opacity: handOpacity }}>
          {scribbles.map((s) => (
            <motion.path
              key={s.key}
              d={s.d}
              strokeWidth={1.8}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: FIRST_STROKE + 1.6, ease: "easeInOut" }}
            />
          ))}
          <g fill="currentColor" stroke="none" className="font-hand" fontWeight={600}>
            {notes.map((n) => (
              <text
                key={n.key}
                x={n.x}
                y={n.y}
                fontSize={n.size}
                textAnchor={n.anchor ?? "start"}
                clipPath={`url(#hw-${uid}-${n.key})`}
              >
                {n.text}
              </text>
            ))}
          </g>
        </motion.g>

        <motion.g style={{ opacity: wireOpacity }} fill="currentColor" fillOpacity={0.28} stroke="none">
          {bars.map(({ b, key }) => (
            <rect key={key} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(4, b.h / 2)} />
          ))}
        </motion.g>
      </g>
    </motion.svg>
  )
}
