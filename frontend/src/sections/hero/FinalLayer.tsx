import { ArrowUpRight, Menu } from "lucide-react"
import { projects } from "../../data/projects"
import { services } from "../../data/services"
import { whatsappUrl } from "../../data/contact"
import { place, type Blueprint } from "./blueprint"

const heroImage = projects[0].image

/**
 * The finished hero — real, accessible content (the page's h1 and primary
 * CTAs live here). It occupies the same blueprint boxes as the sketch, so
 * when it floods in, every element lands exactly where it was drawn.
 * Sizes are in cqw so the whole artboard scales as one picture.
 */
export function FinalLayer({ bp }: { bp: Blueprint }) {
  const t = bp.type
  const barPct = `${(bp.bar / bp.height) * 100}%`

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.2cqw] border border-border bg-bg-raised">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 flex items-center gap-[0.8cqw] border-b border-border px-[1.6cqw]"
        style={{ height: barPct }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="aspect-square w-[1.1cqw] min-w-1.5 rounded-full" style={{ background: c }} />
        ))}
        <span className="ml-[1cqw] font-mono text-ink-faint" style={{ fontSize: `${t.ui}cqw` }}>
          studio.app
        </span>
      </div>

      <span
        aria-hidden="true"
        className="font-display absolute flex items-center font-bold lowercase tracking-tight text-ink"
        style={{ ...place(bp, bp.logo), fontSize: `${t.logo}cqw` }}
      >
        studio<span className="text-accent">.</span>
      </span>

      {bp.nav && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-between font-mono uppercase tracking-[0.12em] text-ink-dim"
          style={{ ...place(bp, bp.nav), fontSize: `${t.ui}cqw` }}
        >
          <span>work</span>
          <span>services</span>
          <span>contact</span>
        </span>
      )}

      {bp.nav ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute flex items-center justify-center rounded-full bg-accent font-mono font-medium uppercase tracking-[0.1em] text-ink-inverse"
          style={{ ...place(bp, bp.navCta), fontSize: `${t.ui}cqw` }}
        >
          let's connect
        </a>
      ) : (
        <span aria-hidden="true" className="absolute flex items-center justify-center text-ink" style={place(bp, bp.navCta)}>
          <Menu className="h-[55%] w-auto" />
        </span>
      )}

      <h1
        className="font-display absolute text-balance font-bold leading-[1.02] tracking-tight text-ink"
        style={{ ...place(bp, bp.h1), fontSize: `${t.h1}cqw` }}
      >
        We make websites <span className="text-accent">and apps.</span>
      </h1>

      <p className="absolute leading-snug text-ink-dim" style={{ ...place(bp, bp.sub), fontSize: `${t.sub}cqw` }}>
        Have an idea? We design and build it — start to finish, by one dedicated team.
      </p>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute flex items-center justify-center gap-[0.6cqw] rounded-full bg-accent font-mono font-medium uppercase tracking-[0.1em] text-ink-inverse transition-colors hover:bg-accent-dim"
        style={{ ...place(bp, bp.cta), fontSize: `${t.ui * 1.15}cqw` }}
      >
        let's connect
        <ArrowUpRight className="h-[1.2em] w-[1.2em]" />
      </a>

      <a
        href="#work"
        className="group absolute flex items-center gap-[0.8cqw] font-mono uppercase tracking-[0.1em] text-ink-dim transition-colors hover:text-ink"
        style={{ ...place(bp, bp.link), fontSize: `${t.ui * 1.15}cqw` }}
      >
        view work
        <span className="h-px w-[2.4cqw] bg-current transition-all group-hover:w-[3.6cqw]" />
      </a>

      <figure className="absolute m-0 overflow-hidden rounded-[0.8cqw] border border-border" style={place(bp, bp.image)}>
        <img src={heroImage.src} alt={heroImage.alt} className="h-full w-full object-cover" />
        <figcaption
          className="absolute left-[4%] top-[5%] rounded-full bg-bg/80 px-[1cqw] py-[0.3cqw] font-mono uppercase tracking-[0.15em] text-amber backdrop-blur"
          style={{ fontSize: `${t.ui * 0.85}cqw` }}
        >
          {projects[0].status.toLowerCase()} · {projects[0].name}
        </figcaption>
      </figure>

      {services.map((s, i) => {
        const c = bp.cards[i]
        return (
          <div
            key={s.id}
            className="absolute flex gap-[1.2cqw] overflow-hidden rounded-[0.8cqw] border border-border bg-bg p-[1.2cqw]"
            style={place(bp, c)}
          >
            <img
              src={s.image.src}
              alt={s.image.alt}
              className="aspect-square h-full max-w-[32%] shrink-0 rounded-[0.4cqw] object-cover"
            />
            <div className="min-w-0">
              <p className="font-display truncate font-bold text-ink" style={{ fontSize: `${t.card}cqw` }}>
                {s.name}
              </p>
              {bp.name === "landscape" && (
                <p className="mt-[0.4cqw] leading-snug text-ink-dim" style={{ fontSize: `${t.card * 0.72}cqw` }}>
                  {s.summary}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CODE = `export function Hero() {
  return (
    <Section id="top" pinned>
      <Nav sticky cta="let's connect" />
      <h1 className="display">
        {copy.headline}
      </h1>
      <p lead>{copy.lead}</p>
      <Button href={whatsapp} primary />
      <Link href="#work">view work</Link>
      <Image src={project.cover} ratio="4:3" />
      {services.map((s) => <ServiceCard {...s} />)}
    </Section>
  )
}`

/**
 * What the X-ray lens sees under the finished UI: the component tree, a
 * dashed layout box per element, and the source behind it all. It sits
 * beneath FinalLayer and is only ever visible through the lens hole.
 */
export function CodeLayer({ bp }: { bp: Blueprint }) {
  const t = bp.type
  const boxes: { b: (typeof bp)["h1"]; tag: string }[] = [
    { b: bp.logo, tag: "<Logo />" },
    ...(bp.nav ? [{ b: bp.nav, tag: "<NavLinks />" }] : []),
    { b: bp.navCta, tag: bp.nav ? "<Button sm />" : "<Burger />" },
    { b: bp.h1, tag: "<h1 display>" },
    { b: bp.sub, tag: "<p lead>" },
    { b: bp.cta, tag: "<Button primary>" },
    { b: bp.link, tag: "<Link>" },
    { b: bp.image, tag: "<Image 4:3 />" },
    ...bp.cards.map((b) => ({ b, tag: "<ServiceCard />" })),
  ]

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[1.2cqw] bg-[#0f0e16] [background-image:linear-gradient(rgba(124,92,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.08)_1px,transparent_1px)] [background-size:2.4cqw_2.4cqw]">
      <pre
        className="absolute inset-0 m-0 whitespace-pre-wrap p-[3cqw] pt-[8cqw] font-mono leading-relaxed text-accent/70"
        style={{ fontSize: `${t.ui * 1.1}cqw` }}
      >
        {CODE}
      </pre>
      {boxes.map(({ b, tag }, i) => (
        <div key={i} className="absolute border border-dashed border-accent bg-accent/[0.06]" style={place(bp, b)}>
          <span
            className="absolute -top-[1.7em] left-0 whitespace-nowrap bg-accent px-[0.5em] font-mono text-ink-inverse"
            style={{ fontSize: `${t.ui * 0.9}cqw` }}
          >
            {tag}
          </span>
        </div>
      ))}
    </div>
  )
}
