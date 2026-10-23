import Lenis from "lenis"

/**
 * One shared Lenis instance for the whole page. Everything that scrolls
 * programmatically goes through `scrollToTarget()` so it eases the same way
 * as wheel scrolling — and still works (natively) when Lenis is off for
 * reduced-motion or touch users.
 */
let lenis: Lenis | null = null

export function startSmoothScroll(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduced || lenis) return () => {}

  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // Lenis already honours each target's CSS scroll-margin-top (the
    // sections' scroll-mt-*), so no extra offset here — adding one would
    // count the nav clearance twice.
    anchors: true,
  })

  let frame = 0
  const raf = (time: number) => {
    lenis?.raf(time)
    frame = requestAnimationFrame(raf)
  }
  frame = requestAnimationFrame(raf)

  return () => {
    cancelAnimationFrame(frame)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTarget(target: HTMLElement | number | string) {
  if (lenis) {
    lenis.scrollTo(target)
    return
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth"
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior })
    return
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target
  el?.scrollIntoView({ behavior, block: "start" })
}

/** Cross-component events (command palette / FAQ → chat widget). */
export const OPEN_CHAT_EVENT = "studio:open-chat"
export const OPEN_PALETTE_EVENT = "studio:open-palette"

export function openChat(prefill?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { prefill } }))
}

export function openPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))
}
