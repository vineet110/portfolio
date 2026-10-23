import { motion } from "framer-motion"
import { useRef } from "react"
import { TypedText } from "../animations/TypedText"
import { SectionLabel } from "../components/SectionLabel"
import { ContactForm } from "../components/ContactForm"
import { WhatsAppCta } from "../components/WhatsAppCta"
import { scrollToTarget } from "../lib/scroll"

export function FinalCta() {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    if (formRef.current) scrollToTarget(formRef.current, { offset: -112 })
    window.setTimeout(() => {
      // preventScroll: the eased scroll above is already taking us there
      formRef.current?.querySelector<HTMLInputElement>("#name")?.focus({ preventScroll: true })
    }, 400)
  }

  return (
    <section id="contact" className="relative isolate scroll-mt-24 overflow-hidden bg-bg py-20 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-amber/10 blur-[120px]" />
      </div>

      <span
        aria-hidden="true"
        className="font-mono pointer-events-none absolute left-1/2 top-1/2 -z-10 w-full -translate-x-1/2 -translate-y-1/2 text-center text-[16vw] font-bold leading-none text-ink/[0.04]"
      >
        connect()
      </span>

      <div className="container-studio flex flex-col items-center text-center">
        <SectionLabel index="06" label="contact" className="mb-6" />

        <h2 className="font-display max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
          <TypedText text="Have an idea?" speed={0.03} cursor={false} />
          <span className="mt-2 block text-accent">
            <TypedText text="We design and build it." delay={1} speed={0.03} />
          </span>
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-10 w-full max-w-2xl"
        >
          <WhatsAppCta onStartConversation={scrollToForm} />
        </motion.div>

        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="w-full scroll-mt-28"
        >
          <ContactForm />
        </motion.div>
      </div>
    </section>
  )
}
