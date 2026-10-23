import type { ReactNode } from "react"

type WindowChromeProps = {
  label: string
  className?: string
  headerClassName?: string
  children?: ReactNode
}

/**
 * The shared "app window" visual language for the Studio OS concept —
 * traffic-light dots + a mono label bar. Reused by the hero's floating
 * windows, the Work section's project windows, and the chatbot panel, so
 * the metaphor reads consistently everywhere it appears.
 */
export function WindowChrome({ label, className = "", headerClassName = "", children }: WindowChromeProps) {
  return (
    <div className={`border border-border bg-bg-raised ${className}`}>
      <div className={`flex items-center gap-2 border-b border-border px-3 py-2 ${headerClassName}`}>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1 truncate font-mono text-[11px] text-ink-faint">{label}</span>
      </div>
      {children}
    </div>
  )
}
