type SectionLabelProps = {
  index: string
  label: string
  className?: string
}

export function SectionLabel({ index, label, className = "" }: SectionLabelProps) {
  return (
    <div className={`flex items-center gap-3 font-mono ${className}`}>
      <span className="text-xs tracking-[0.1em] text-accent">{index}</span>
      <span className="h-px w-8 bg-border" />
      <span className="text-xs uppercase tracking-[0.15em] text-ink-dim">// {label}</span>
    </div>
  )
}
