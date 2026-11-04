import { useEffect, useRef, useState } from "react"
import type { Project } from "../../data/projects"
import { WORLDS } from "./themes"

/** the width live sites are rendered at, so they show their desktop layout */
const DESKTOP_WIDTH = 1440

/**
 * Fills its parent with the project at full size:
 * - live: the real site in an iframe, rendered at desktop width and scaled
 *   down to fit, scrollable inside;
 * - scroll: a full-page screenshot that scrolls (for sites that refuse to
 *   be embedded);
 * - image: the product shot, shown whole.
 */
export function SitePreview({ project }: { project: Project }) {
  const w = WORLDS[project.id]
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { preview } = project
  const scale = size.w / DESKTOP_WIDTH

  return (
    <div
      ref={box}
      data-lenis-prevent
      data-testid={`work-preview-${project.id}`}
      className="relative h-full w-full overflow-hidden"
      style={{ background: w.tile.bg }}
    >
      {preview.kind === "live" && (
        <>
          <img
            src={project.image.src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          />
          {!loaded && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
              loading live site…
            </span>
          )}
          {size.w > 0 && project.url && (
            <iframe
              src={project.url}
              title={`${project.name} — live site`}
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer-when-downgrade"
              className={`absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ width: DESKTOP_WIDTH, height: size.h / scale, transform: `scale(${scale})` }}
            />
          )}
        </>
      )}

      {preview.kind === "scroll" && (
        <div className="h-full w-full overflow-y-auto overscroll-contain">
          <img src={preview.src} alt={project.image.alt} className="block w-full" />
        </div>
      )}

      {preview.kind === "image" && (
        <>
          <img
            src={project.image.src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <img src={project.image.src} alt={project.image.alt} className="relative h-full w-full object-contain" />
        </>
      )}
    </div>
  )
}
