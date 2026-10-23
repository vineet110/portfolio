from typing import Literal

from pydantic import BaseModel, Field

ChatRole = Literal["user", "assistant"]
ChatSource = Literal["knowledge", "llm", "fallback"]


class ChatMessage(BaseModel):
    role: ChatRole
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Conversation history is kept on the frontend (V1) and sent along only
    # as needed for LLM context — never persisted server-side.
    history: list[ChatMessage] | None = Field(default=None, max_length=20)
    # When true, the answer is streamed back as server-sent events instead
    # of a single JSON body (see routes/chat.py).
    stream: bool = False


class ChatResponse(BaseModel):
    answer: str
    source: ChatSource
