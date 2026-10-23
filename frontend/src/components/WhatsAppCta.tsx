import { ArrowUpRight } from "lucide-react"
import { whatsappUrl } from "../data/contact"

type ContactActionsProps = {
  onStartConversation: () => void
}

/**
 * The two primary contact actions, side by side with equal visual weight —
 * WhatsApp for an immediate conversation, or the form below for a written
 * enquiry. Stacks vertically on mobile via the grid's `sm:` breakpoint.
 */
export function WhatsAppCta({ onStartConversation }: ContactActionsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-3 border border-border bg-bg-raised px-6 py-6 text-left transition-colors hover:border-accent"
      >
        <span>
          <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">Fastest</span>
          <span className="font-display mt-1 block text-lg font-bold text-ink">Chat on WhatsApp</span>
        </span>
        <ArrowUpRight size={20} className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
      </a>

      <button
        type="button"
        onClick={onStartConversation}
        className="group flex items-center justify-between gap-3 border border-border bg-bg-raised px-6 py-6 text-left transition-colors hover:border-accent"
      >
        <span>
          <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">In writing</span>
          <span className="font-display mt-1 block text-lg font-bold text-ink">Start a conversation</span>
        </span>
        <ArrowUpRight size={20} className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
      </button>
    </div>
  )
}
