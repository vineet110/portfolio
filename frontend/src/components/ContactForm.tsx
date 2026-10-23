import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { api, ApiError, type ProjectType } from "../services/api"

// Labels only — these map to the existing backend `project_type` values
// (unchanged, see backend/app/schemas/contact.py) and are worded to match
// the locked three-service model (Websites, Mobile Apps, UI/UX Design)
// rather than implying separate services.
const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "web-application", label: "Web Application" },
  { value: "product-design", label: "UI/UX Design" },
  { value: "mobile", label: "Mobile App" },
  { value: "ai-automation", label: "AI-Integrated Website / App" },
  { value: "other", label: "Something else" },
]

type Status = "idle" | "submitting" | "success" | "error"

const inputClasses =
  "w-full border-b border-border bg-transparent py-3 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"

const labelClasses = "mb-2 block text-xs uppercase tracking-[0.2em] text-ink-dim"

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)

    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? "") || undefined,
      project_type: form.get("project_type") as ProjectType,
      message: String(form.get("message") ?? ""),
    }

    try {
      await api.submitContact(payload)
      setStatus("success")
    } catch (err) {
      setStatus("error")
      if (err instanceof ApiError && err.status === 422) {
        setErrorMessage("Please check the form — some fields need attention.")
      } else if (err instanceof ApiError && err.status === 0) {
        setErrorMessage("Could not reach the server. Please try again shortly.")
      } else {
        setErrorMessage("Something went wrong. Please try again.")
      }
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-10 max-w-lg border border-border px-8 py-10 text-center"
      >
        <p className="font-display text-xl font-medium text-ink">Enquiry received.</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          Thank you — we'll come back to you shortly with next steps.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-lg text-left">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClasses}>
            Name
          </label>
          <input id="name" name="name" type="text" required minLength={2} maxLength={120} className={inputClasses} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input id="email" name="email" type="email" required maxLength={255} className={inputClasses} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="company" className={labelClasses}>
            Company <span className="text-ink-faint">(optional)</span>
          </label>
          <input id="company" name="company" type="text" maxLength={160} className={inputClasses} placeholder="Company name" />
        </div>
        <div>
          <label htmlFor="project_type" className={labelClasses}>
            Project type
          </label>
          <select
            id="project_type"
            name="project_type"
            required
            defaultValue=""
            className={`${inputClasses} appearance-none`}
          >
            <option value="" disabled>
              Select one
            </option>
            {projectTypes.map((type) => (
              <option key={type.value} value={type.value} className="bg-bg text-ink">
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={labelClasses}>
            Tell us about it
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={4}
            className={`${inputClasses} resize-none`}
            placeholder="What are you building, and what would help most right now?"
          />
        </div>
      </div>

      {status === "error" && errorMessage && (
        <p className="mt-4 text-sm text-accent" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-8 inline-flex items-center gap-3 bg-ink px-9 py-5 text-sm font-medium uppercase tracking-[0.2em] text-bg transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            Sending
            <Loader2 size={18} className="animate-spin" />
          </>
        ) : (
          <>
            Send enquiry
            <ArrowUpRight size={18} />
          </>
        )}
      </button>
    </form>
  )
}
