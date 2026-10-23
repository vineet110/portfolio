import logging

from fastapi import APIRouter, Depends

from app.core.rate_limit import enforce_rate_limit
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(enforce_rate_limit)])
def chat(payload: ChatRequest) -> ChatResponse:
    try:
        answer, source = chat_service.answer_question(payload.message, payload.history)
    except Exception:
        logger.exception("Unexpected error handling a chat request.")
        answer, source = chat_service.FALLBACK_MESSAGE, "fallback"
    return ChatResponse(answer=answer, source=source)
