import { useEffect, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Loader2, MessageSquareText, PenLine } from "lucide-react"
import { api, ApiError, type ProjectType } from "../services/api"
import { whatsappUrl } from "../data/contact"
import { openChat } from "../lib/scroll"
import { setSurface } from "../lib/surface"

// Labels only — these map to the existing backend `project_type` values
// (see backend/app/schemas/contact.py), worded for the three-service model.
const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "web-application", label: "Web Application" },
  { value: "product-design", label: "UI/UX Design" },
  { value: "mobile", label: "Mobile App" },
  { value: "ai-automation", label: "AI-Integrated Website / App" },
  { value: "other", label: "Something else" },
]

/** What the sheet "notices" in the idea as it's written. */
const SIGNALS = [
  { id: "website", label: "Website", re: /\b(web|website|site|shop|store|landing|blog|portfolio)\b/i },
  { id: "webapp", label: "Web app", re: /\b(web ?app|dashboard|platform|portal|saas|tool|system)\b/i },
  { id: "mobile", label: "Mobile App", re: /\b(apps?|ios|android|iphone|mobile|phone)\b/i },
  { id: "design", label: "UI/UX Design", re: /\b(design|redesign|ux|ui|brand|figma|prototype|look)\b/i },
  { id: "ai", label: "AI inside", re: /\b(ai|chatbot|gpt|assistant|automate|automation|smart)\b/i },
] as const

function suggestType(found: Set<string>): ProjectType | "" {
  if (found.has("ai")) return "ai-automation"
  if (found.has("mobile")) return "mobile"
  if (found.has("webapp")) return "web-application"
  if (found.has("website")) return "website"
  if (found.has("design")) return "product-design"
  return ""
}

const PROMPTS = [
  "an app that books dog walkers in my area…",
  "a website for my bakery, with online orders…",
  "a dashboard so my team stops living in spreadsheets…",
  "a redesign — our app works, but nobody enjoys it…",
]

type Status = "idle" | "submitting" | "success" | "error"

const fieldClasses =
  "w-full border-b border-border bg-transparent py-2.5 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
const labelClasses = "mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim"

/**
 * The last section — the page ends on paper, where it began. The visitor
 * writes their idea onto a notebook sheet, the sheet notices what kind of
 * product it is, and the same words go out by WhatsApp, to the assistant,
 * or as a written enquiry (the real /api/contact form).
 */
export function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const reduced = Boolean(useReducedMotion())
  const inView = useInView(ref, { amount: 0.35 })
  const [idea, setIdea] = useState("")
  const [prompt, setPrompt] = useState(0)
  const [writing, setWriting] = useState(false)
  const [type, setType] = useState<ProjectType | "">("")
  const [typeTouched, setTypeTouched] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const found = new Set(SIGNALS.filter((s) => s.re.test(idea)).map((s) => s.id))
  const words = idea.trim() ? idea.trim().split(/\s+/).length : 0
  const suggested = suggestType(found)
  const projectType = typeTouched ? type : suggested
  const trimmed = idea.trim()
  const waHref = trimmed ? `${whatsappUrl}?text=${encodeURIComponent(`Hi! Here's my idea: ${trimmed}`)}` : whatsappUrl

  // The nav follows us back onto paper while this section is on screen.
  const wasInView = useRef(false)
  useEffect(() => {
    if (inView) setSurface("paper")
    else if (wasInView.current) setSurface("ink")
    wasInView.current = inView
  }, [inView])

  useEffect(() => {
    if (idea || reduced) return
    const id = window.setInterval(() => setPrompt((p) => (p + 1) % PROMPTS.length), 3200)
    return () => window.clearInterval(id)
  }, [idea, reduced])

  function startWriting() {
    setWriting(true)
    // wait a frame for the fields to mount before focusing
    window.setTimeout(() => nameRef.current?.focus(), 60)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    const form = new FormData(e.currentTarget)
    try {
      await api.submitContact({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        company: String(form.get("company") ?? "") || undefined,
        project_type: form.get("project_type") as ProjectType,
        message: String(form.get("message") ?? ""),
      })
      setStatus("success")
    } catch (err) {
      setStatus("error")
      if (err instanceof ApiError && err.status === 422) setErrorMessage("Please check the form — some fields need attention.")
      else if (err instanceof ApiError && err.status === 0) setErrorMessage("Could not reach the server. Please try again shortly.")
      else setErrorMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <section id="contact" ref={ref} className="surface-paper relative scroll-mt-0 overflow-hidden bg-bg py-16 md:py-24">
      <div aria-hidden="true" className="paper-grid pointer-events-none absolute inset-0" />

      <div className="container-studio relative">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
          <span>
            <span className="text-accent">05 //</span> contact
          </span>
          <span>this page started as a sketch. so can yours.</span>
        </div>

        <h2 className="mt-8 text-center">
          <span className="font-hand relative inline-block text-[clamp(3rem,9vw,7.5rem)] font-bold leading-[0.9] text-ink">
            Your idea goes here.
            <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-3 left-[4%] h-4 w-[92%]">
              <motion.path
                d="M2 10 C 60 2, 120 14, 180 7 S 270 4, 298 9"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: reduced ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3 }}
              />
            </svg>
          </span>
          <span className="sr-only"> Have an idea? We design and build it.</span>
        </h2>

        <form onSubmit={handleSubmit} className="mx-auto mt-12 max-w-3xl">
          {/* the notebook sheet */}
          <motion.div
            initial={reduced ? false : { rotate: -3, y: 30, opacity: 0 }}
            whileInView={{ rotate: -0.6, y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="notebook relative rounded-sm bg-bg-raised shadow-[0_30px_70px_-30px_rgba(47,43,38,0.5)]"
          >
            <label htmlFor="message" className="absolute left-14 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint sm:left-20">
              Your idea
            </label>
            <textarea
              id="message"
              name="message"
              required
              minLength={10}
              maxLength={4000}
              rows={6}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={PROMPTS[prompt]}
              data-testid="idea-sheet"
              className="font-hand block min-h-[16.5rem] w-full resize-none bg-transparent pb-6 pl-14 pr-6 pt-[2.75rem] text-[1.75rem] leading-[2.25rem] text-ink placeholder:text-ink-faint/70 focus:outline-none sm:pl-20 sm:pr-10"
            />

            {/* what the sheet noticed */}
            <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border px-5 py-3 sm:pl-20">
              {SIGNALS.map((s) => {
                const on = found.has(s.id)
                return (
                  <motion.span
                    key={s.id}
                    data-testid={`idea-signal-${s.id}`}
                    data-on={on || undefined}
                    animate={on && !reduced ? { scale: [1, 1.18, 1], rotate: [0, -4, 0] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                      on ? "border-accent bg-accent text-white" : "border-border text-ink-faint"
                    }`}
                  >
                    {s.label}
                  </motion.span>
                )
              })}
              <span className="font-hand ml-auto text-lg text-ink-dim" aria-live="polite">
                {words === 0 ? "" : words < 6 ? "keep going…" : words < 25 ? "that's plenty to start ✓" : "love the detail ✓"}
              </span>
            </div>

            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  role="status"
                  initial={{ scale: 2.4, rotate: -24, opacity: 0 }}
                  animate={{ scale: 1, rotate: -12, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="absolute right-6 top-6 rounded-md border-4 border-accent px-4 py-2 text-center font-mono text-lg font-bold uppercase tracking-[0.15em] text-accent"
                >
                  received ✓
                  <span className="block text-[10px] tracking-[0.1em]">we'll come back to you shortly</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* three ways out */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-bg transition-transform hover:-translate-y-0.5"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.15em] opacity-60">fastest</span>
                <span className="font-display block font-bold">Chat on WhatsApp</span>
              </span>
              <ArrowUpRight size={18} className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <button
              type="button"
              onClick={() => openChat(trimmed || undefined)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-ink/80 px-5 py-4 text-left text-ink transition-transform hover:-translate-y-0.5"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-dim">right now</span>
                <span className="font-display block font-bold">Ask the assistant</span>
              </span>
              <MessageSquareText size={18} className="shrink-0" />
            </button>
            <button
              type="button"
              onClick={startWriting}
              aria-expanded={writing}
              aria-controls="enquiry-fields"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-ink/80 px-5 py-4 text-left text-ink transition-transform hover:-translate-y-0.5"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-ink-dim">in writing</span>
                <span className="font-display block font-bold">Start a conversation</span>
              </span>
              <PenLine size={18} className="shrink-0" />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {writing && status !== "success" && (
              <motion.div
                id="enquiry-fields"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-5 rounded-2xl border border-border bg-bg-raised p-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClasses}>
                      Name
                    </label>
                    <input ref={nameRef} id="name" name="name" type="text" required minLength={2} maxLength={120} className={fieldClasses} placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClasses}>
                      Email
                    </label>
                    <input id="email" name="email" type="email" required maxLength={255} className={fieldClasses} placeholder="you@company.com" />
                  </div>
                  <div>
                    <label htmlFor="company" className={labelClasses}>
                      Company <span className="normal-case tracking-normal text-ink-faint">(optional)</span>
                    </label>
                    <input id="company" name="company" type="text" maxLength={160} className={fieldClasses} placeholder="Company name" />
                  </div>
                  <div>
                    <label htmlFor="project_type" className={labelClasses}>
                      Project type
                    </label>
                    <select
                      id="project_type"
                      name="project_type"
                      required
                      value={projectType}
                      onChange={(e) => {
                        setTypeTouched(true)
                        setType(e.target.value as ProjectType)
                      }}
                      className={`${fieldClasses} appearance-none`}
                    >
                      <option value="" disabled>
                        Select one
                      </option>
                      {projectTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {status === "error" && errorMessage && (
                    <p className="text-sm text-accent sm:col-span-2" role="alert">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                    <p className="font-hand text-lg text-ink-dim">
                      {trimmed ? "your idea goes along with it ↑" : "write your idea on the sheet first ↑"}
                    </p>
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-mono text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "submitting" ? (
                        <>
                          sending
                          <Loader2 size={15} className="animate-spin" />
                        </>
                      ) : (
                        <>
                          send enquiry
                          <ArrowUpRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  )
}
