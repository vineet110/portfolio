type MarqueeProps = {
  items: string[]
  className?: string
}

/**
 * Infinite horizontal ticker. Pure CSS animation (transform-based, GPU
 * friendly) so it stays performant; paused automatically for
 * prefers-reduced-motion via the global rule in index.css.
 */
export function Marquee({ items, className = "" }: MarqueeProps) {
  const track = [...items, ...items]

  return (
    <div className={`overflow-hidden border-y border-border ${className}`}>
      <div className="flex w-max animate-marquee py-4">
        {track.map((item, i) => (
          <span
            key={i}
            className="mx-6 flex items-center gap-6 font-mono text-sm lowercase tracking-[0.05em] text-ink-dim"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          </span>
        ))}
      </div>
    </div>
  )
}
