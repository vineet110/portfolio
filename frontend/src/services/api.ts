/**
 * Central API client. No component should call fetch/axios directly —
 * everything the frontend needs from the backend goes through here so the
 * base URL, error handling, and payload shapes live in exactly one place.
 */

// In production the API is served from the same origin (vercel.json rewrites
// /api/* to the backend), so an unset VITE_API_URL means "same origin".
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "")

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    })
  } catch {
    throw new ApiError("Could not reach the server. Please try again.", 0)
  }

  if (!response.ok) {
    let details: unknown
    try {
      details = await response.json()
    } catch {
      details = undefined
    }
    throw new ApiError("The request could not be completed.", response.status, details)
  }

  return response.json() as Promise<T>
}

export type HealthResponse = {
  status: string
}

export type ProjectType =
  | "website"
  | "web-application"
  | "product-design"
  | "mobile"
  | "ai-automation"
  | "ongoing-development"
  | "other"

export type ContactPayload = {
  name: string
  email: string
  company?: string
  project_type: ProjectType
  message: string
}

export type ContactResponse = {
  success: boolean
  message: string
}

export type ChatRole = "user" | "assistant"

export type ChatHistoryMessage = {
  role: ChatRole
  content: string
}

export type ChatSource = "knowledge" | "llm" | "fallback"

export type ChatRequestPayload = {
  message: string
  history?: ChatHistoryMessage[]
}

export type ChatApiResponse = {
  answer: string
  source: ChatSource
}

export type ChatLeadPayload = {
  conversation_id: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

export type ChatLeadResponse = {
  success: boolean
  conversation_id: string
  name: string | null
  email: string | null
  phone: string | null
}

/**
 * Light Markdown cleanup for text that is still streaming in — the
 * backend's final answer is fully cleaned server-side, this only keeps the
 * live preview from flashing **markers** while it's being written.
 */
function cleanPartial(text: string): string {
  return text
    .replace(/^[ \t]*```[^\n]*\n?/gm, "")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/\*\*|__/g, "")
}

/**
 * Sends a chat message asking for a streamed answer. `onDelta` receives the
 * full answer-so-far each time a new piece arrives; the returned promise
 * resolves with the final, cleaned answer. Also accepts a plain JSON reply
 * (older backend, or a proxy that doesn't stream) — then `onDelta` is
 * simply never called.
 */
async function streamChat(
  payload: ChatRequestPayload,
  onDelta: (answerSoFar: string) => void
): Promise<ChatApiResponse> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, stream: true }),
    })
  } catch {
    throw new ApiError("Could not reach the server. Please try again.", 0)
  }
  if (!response.ok) throw new ApiError("The request could not be completed.", response.status)

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("text/event-stream") || !response.body) {
    return response.json() as Promise<ChatApiResponse>
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let raw = ""
  let final: ChatApiResponse | null = null

  const handleEvent = (block: string) => {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data:")) continue
      const event = JSON.parse(line.slice(5).trim()) as { delta?: string; done?: boolean } & Partial<ChatApiResponse>
      if (event.delta) {
        raw += event.delta
        onDelta(cleanPartial(raw))
      }
      if (event.done && event.answer && event.source) final = { answer: event.answer, source: event.source }
    }
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf("\n\n")
    while (boundary !== -1) {
      handleEvent(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf("\n\n")
    }
  }
  if (buffer.trim()) handleEvent(buffer)

  if (final) return final
  if (raw) return { answer: cleanPartial(raw), source: "llm" }
  throw new ApiError("The assistant returned no answer.", 502)
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  submitContact: (payload: ContactPayload) =>
    request<ContactResponse>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendChatMessage: (payload: ChatRequestPayload) =>
    request<ChatApiResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  streamChatMessage: streamChat,
  saveChatLead: (payload: ChatLeadPayload) =>
    request<ChatLeadResponse>("/api/chat-lead", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
