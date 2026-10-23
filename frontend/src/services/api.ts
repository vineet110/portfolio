/**
 * Central API client. No component should call fetch/axios directly —
 * everything the frontend needs from the backend goes through here so the
 * base URL, error handling, and payload shapes live in exactly one place.
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

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
  saveChatLead: (payload: ChatLeadPayload) =>
    request<ChatLeadResponse>("/api/chat-lead", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
