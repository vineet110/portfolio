import { useEffect, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react"
import { api, ApiError, type ChatHistoryMessage, type ChatSource } from "../services/api"
import { OPEN_CHAT_EVENT } from "../lib/scroll"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  source?: ChatSource
  /** true while the answer is still arriving */
  streaming?: boolean
}

type PendingCapture = "name" | "email" | null

const GREETING =
  "Hi — I'm the Studio Assistant. Ask me about our services, work, process, or how we can help."

const QUICK_PROMPTS = [
  "What do you offer?",
  "How can I start a project?",
  "What kind of products do you build?",
  "Can I work with your team?",
]

const MAX_HISTORY_MESSAGES_SENT = 10

// Ask for name before answering the 3rd user message, email before the 5th
// — never interrupt the first two messages, never ask twice.
const NAME_CAPTURE_AT_MESSAGE = 3
const EMAIL_CAPTURE_AT_MESSAGE = 5

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// A voluntarily-shared phone number in an ordinary message — long enough
// run of digits/separators that it isn't just a stray number in a sentence.
const PHONE_RE = /(\+?\d[\d\s().-]{7,14}\d)/
const DECLINE_PHRASES = ["skip", "prefer not to say", "no thanks", "not now", "rather not", "pass", "don't want"]

function createId(): string {
  return Math.random().toString(36).slice(2)
}

function createConversationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `conv-${Date.now()}-${createId()}`
}

function isDecline(text: string): boolean {
  const t = text.trim().toLowerCase()
  return DECLINE_PHRASES.some((p) => t === p || t.includes(p))
}

export function ChatWidget() {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Lead-capture state — kept client-side; only name/email/phone are ever
  // sent to the backend (POST /api/chat-lead), never the conversation itself.
  const conversationIdRef = useRef(createConversationId())
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [leadName, setLeadName] = useState<string | null>(null)
  const [nameCaptured, setNameCaptured] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const phoneCapturedRef = useRef(false)
  const [pendingCapture, setPendingCapture] = useState<PendingCapture>(null)
  const pendingMessageRef = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  // Other parts of the page (FAQ, command palette) can open the assistant.
  useEffect(() => {
    const onOpen = (e: Event) => {
      setIsOpen(true)
      const prefill = (e as CustomEvent<{ prefill?: string }>).detail?.prefill
      if (prefill) setInput(prefill)
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen)
  }, [])

  function addMessage(role: Message["role"], content: string, source?: ChatSource) {
    setMessages((prev) => [...prev, { id: createId(), role, content, source }])
  }

  function saveLead(fields: { name?: string; email?: string; phone?: string }) {
    void api.saveChatLead({ conversation_id: conversationIdRef.current, ...fields }).catch(() => {
      // Best-effort — a failed lead save must never break the conversation.
    })
  }

  function maybeCapturePhone(text: string) {
    if (phoneCapturedRef.current) return
    const match = text.match(PHONE_RE)
    if (!match) return
    phoneCapturedRef.current = true
    saveLead({ phone: match[0].trim() })
  }

  /** Actually calls the chat API and renders the assistant's answer. */
  async function deliverAnswer(text: string, historyBase: Message[], prefix?: string) {
    const history: ChatHistoryMessage[] = historyBase
      .slice(-MAX_HISTORY_MESSAGES_SENT)
      .map((m) => ({ role: m.role, content: m.content }))

    setIsLoading(true)
    // The answer bubble is created on the first streamed piece (until then
    // the "Thinking…" indicator shows), then updated in place as it grows.
    let streamingId: string | null = null
    const withPrefix = (t: string) => `${prefix ?? ""}${t}`
    try {
      const response = await api.streamChatMessage({ message: text, history }, (soFar) => {
        if (!streamingId) {
          const id = createId()
          streamingId = id
          setIsLoading(false)
          setMessages((prev) => [...prev, { id, role: "assistant", content: withPrefix(soFar), streaming: true }])
        } else {
          const id = streamingId
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: withPrefix(soFar) } : m)))
        }
      })
      if (streamingId) {
        const id = streamingId
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: withPrefix(response.answer), source: response.source, streaming: false } : m
          )
        )
      } else {
        addMessage("assistant", withPrefix(response.answer), response.source)
      }
    } catch (err) {
      if (streamingId) {
        const id = streamingId
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)))
      }
      setError(
        err instanceof ApiError && err.status === 0
          ? "Could not reach the assistant. Please try again shortly."
          : "Something went wrong. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCaptureReply(trimmed: string) {
    const capture = pendingCapture
    const original = pendingMessageRef.current ?? ""
    const userMessage: Message = { id: createId(), role: "user", content: trimmed }
    const historyBase = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage])
    setError(null)

    if (isDecline(trimmed)) {
      if (capture === "name") setNameCaptured(true)
      if (capture === "email") setEmailCaptured(true)
      setPendingCapture(null)
      pendingMessageRef.current = null
      addMessage("assistant", "No problem — let's carry on.")
      await deliverAnswer(original, historyBase)
      return
    }

    if (capture === "name") {
      setNameCaptured(true)
      setLeadName(trimmed)
      saveLead({ name: trimmed })
      setPendingCapture(null)
      pendingMessageRef.current = null
      await deliverAnswer(original, historyBase, `Thanks, ${trimmed}. `)
      return
    }

    if (capture === "email") {
      if (!EMAIL_RE.test(trimmed)) {
        addMessage("assistant", "That email doesn't look quite right. Could you check it?")
        return
      }
      setEmailCaptured(true)
      saveLead({ email: trimmed })
      setPendingCapture(null)
      pendingMessageRef.current = null
      await deliverAnswer(original, historyBase, leadName ? `Thanks — got it, ${leadName}. ` : "Thanks — got it. ")
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setInput("")

    if (pendingCapture) {
      await handleCaptureReply(trimmed)
      return
    }

    maybeCapturePhone(trimmed)

    const nextCount = userMessageCount + 1
    const userMessage: Message = { id: createId(), role: "user", content: trimmed }
    const historyBase = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage])
    setError(null)
    setUserMessageCount(nextCount)

    if (nextCount === NAME_CAPTURE_AT_MESSAGE && !nameCaptured) {
      pendingMessageRef.current = trimmed
      setPendingCapture("name")
      addMessage("assistant", "Before I answer that, what should I call you?")
      return
    }

    if (nextCount === EMAIL_CAPTURE_AT_MESSAGE && !emailCaptured) {
      pendingMessageRef.current = trimmed
      setPendingCapture("email")
      addMessage("assistant", "One more thing — what's the best email to reach you at?")
      return
    }

    await deliverAnswer(trimmed, historyBase)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void sendMessage(input)
  }

  function handleClear() {
    setMessages([])
    setError(null)
    setUserMessageCount(0)
    setLeadName(null)
    setNameCaptured(false)
    setEmailCaptured(false)
    phoneCapturedRef.current = false
    setPendingCapture(null)
    pendingMessageRef.current = null
    conversationIdRef.current = createConversationId()
  }

  return (
    <>
      {!isOpen && (
        <motion.button
          type="button"
          data-testid="chat-launcher"
          aria-label="Open Studio Assistant"
          onClick={() => setIsOpen(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-ink text-bg shadow-lg transition-colors hover:bg-accent md:bottom-8 md:right-8"
        >
          {/* Decorative presence ring — a separate element (not the button
              itself), so the button's own bounding box never changes and
              stays instantly clickable/stable. Pure CSS animation, so it
              already respects prefers-reduced-motion via the global rule
              in index.css with no extra branching needed. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-accent/50 animate-ping [animation-duration:2.4s]"
          />
          <MessageCircle size={22} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-testid="chat-panel"
            role="dialog"
            aria-label="Studio Assistant chat"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed inset-x-0 bottom-0 z-40 flex h-[80vh] flex-col border-t border-border bg-bg-raised shadow-2xl md:inset-x-auto md:bottom-8 md:right-8 md:h-[min(70vh,640px)] md:w-[400px] md:border"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                  <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                </span>
                studio-assistant
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Clear conversation"
                  onClick={handleClear}
                  className="text-ink-faint transition-colors hover:text-ink"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  data-testid="chat-close"
                  aria-label="Close chat"
                  onClick={() => setIsOpen(false)}
                  className="text-ink-faint transition-colors hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div data-testid="chat-messages" data-lenis-prevent className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <p data-testid="chat-greeting" className="text-sm leading-relaxed text-ink-dim">
                {GREETING}
              </p>

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] whitespace-pre-wrap border border-border px-4 py-3 text-sm leading-relaxed text-ink"
                      : "max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-ink-dim"
                  }
                >
                  {m.content}
                  {m.streaming && (
                    <span
                      aria-hidden="true"
                      className="animate-cursor-blink ml-0.5 inline-block h-[1em] w-[0.45em] translate-y-[0.15em] bg-accent"
                    />
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <div data-testid="chat-loading" className="flex items-center gap-2 text-xs text-ink-faint">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking…
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-accent">
                  {error}
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && (
              <div
                data-testid="chat-quick-prompts"
                className="flex shrink-0 flex-wrap gap-2 border-t border-border px-5 py-4"
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="border border-border px-3 py-2 text-xs text-ink-dim transition-colors hover:border-accent hover:text-ink"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-3 border-t border-border px-5 py-4">
              <input
                type="text"
                aria-label="Message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  pendingCapture === "name"
                    ? "Your name…"
                    : pendingCapture === "email"
                      ? "you@example.com…"
                      : "Ask a question…"
                }
                maxLength={2000}
                className="flex-1 border-b border-border bg-transparent py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink text-bg transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
