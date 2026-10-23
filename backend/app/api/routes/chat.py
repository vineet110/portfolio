import json
import logging
from collections.abc import Iterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.rate_limit import enforce_rate_limit
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


def _event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _sse(payload: ChatRequest) -> Iterator[str]:
    try:
        for event in chat_service.stream_answer(payload.message, payload.history):
            yield _event(event)
    except Exception:
        logger.exception("Unexpected error streaming a chat response.")
        yield _event({"done": True, "answer": chat_service.FALLBACK_MESSAGE, "source": "fallback"})


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(enforce_rate_limit)])
def chat(payload: ChatRequest) -> ChatResponse | StreamingResponse:
    if payload.stream:
        return StreamingResponse(
            _sse(payload),
            media_type="text/event-stream",
            # no proxy buffering, so pieces reach the browser as they're made
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    try:
        answer, source = chat_service.answer_question(payload.message, payload.history)
    except Exception:
        logger.exception("Unexpected error handling a chat request.")
        answer, source = chat_service.FALLBACK_MESSAGE, "fallback"
    return ChatResponse(answer=answer, source=source)
