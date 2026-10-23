type ProcessCharacterProps = {
  image: string
  alt: string
  colorVar: string
  className?: string
}

/**
 * Renders one production 3D character (frontend/src/assets/process/) inside
 * a shared ambient "stage" glow tinted to that phase's color, so a plain
 * cutout PNG/WebP reads as part of the Studio OS environment rather than a
 * pasted-in illustration. The "settle" on entry (a soft spring overshoot,
 * driven by the parent AnimatePresence transition in Process.tsx) is the
 * only motion the character itself gets — deliberately no infinite/looping
 * idle animation: the brief explicitly asked to avoid continuous bouncing,
 * and a never-settling transform also breaks Playwright's element-stability
 * checks (scrollIntoView/click wait for the element to stop moving).
 */
export function ProcessCharacter({ image, alt, colorVar, className = "" }: ProcessCharacterProps) {
  const color = `var(--color-${colorVar})`

  return (
    <div className={`relative flex h-full w-full items-center justify-center ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 45%, ${color}33 0%, transparent 70%)`,
        }}
      />
      <img
        src={image}
        alt={alt}
        className="relative h-full w-auto max-w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
      />
    </div>
  )
}
