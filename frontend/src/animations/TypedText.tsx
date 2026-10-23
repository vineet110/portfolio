import { motion, useReducedMotion, type Variants } from "framer-motion"

type TypedTextProps = {
  text: string
  as?: "h1" | "h2" | "span" | "p"
  className?: string
  delay?: number
  /** seconds between each character appearing */
  speed?: number
  /** show a blinking block cursor after the text once typing completes */
  cursor?: boolean
}

const container: Variants = {
  hidden: {},
  visible: (args: { delay: number; speed: number }) => ({
    transition: { staggerChildren: args.speed, delayChildren: args.delay },
  }),
}

const char: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
}

/**
 * A terminal-style typing reveal — characters appear one at a time (a hard
 * cut, not a fade), like a command being typed, with an optional blinking
 * block cursor. Used for every section headline to reinforce the "Studio
 * OS" concept (the site presents itself as a small software workspace).
 *
 * Each character renders in its own inline span, but the space character
 * is left as a plain, ordinary space (not swapped for a non-breaking one)
 * so the browser can still wrap the line normally at word boundaries.
 */
export function TypedText({ text, as = "span", className = "", delay = 0, speed = 0.035, cursor = true }: TypedTextProps) {
  const Tag = motion[as as "span"]
  const prefersReducedMotion = useReducedMotion()
  const chars = text.split("")

  if (prefersReducedMotion) {
    return (
      <Tag className={className} aria-label={text}>
        {text}
        {cursor && <span aria-hidden="true" className="ml-1 inline-block h-[0.85em] w-[0.5em] translate-y-[0.1em] bg-current align-middle" />}
      </Tag>
    )
  }

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
        variants={container}
        custom={{ delay, speed }}
        aria-hidden="true"
        style={{ overflowWrap: "break-word" }}
      >
        {chars.map((c, i) => (
          <motion.span key={i} variants={char}>
            {c}
          </motion.span>
        ))}
      </motion.span>
      {cursor && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + chars.length * speed, duration: 0.1 }}
          className="animate-cursor-blink ml-1 inline-block h-[0.85em] w-[0.5em] translate-y-[0.1em] bg-current align-middle"
        />
      )}
    </Tag>
  )
}
