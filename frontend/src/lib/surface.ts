import { useSyncExternalStore } from "react"

/**
 * Which "material" the top of the page is currently on. The hero opens on
 * paper and turns to ink (the dark site) as it builds — anything fixed over
 * it (nav, cursor ring) follows along. Mirrored onto
 * `<html data-surface>` so plain CSS can react too (see index.css).
 */
export type Surface = "paper" | "ink"

let current: Surface = "ink"
const listeners = new Set<() => void>()

export function setSurface(next: Surface) {
  if (next === current) return
  current = next
  document.documentElement.dataset.surface = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSurface(): Surface {
  return useSyncExternalStore(subscribe, () => current)
}
