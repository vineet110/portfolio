from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat_lead import ChatLeadResponse, ChatLeadUpsert
from app.services.chat_lead_service import ChatLeadPersistenceError, upsert_lead

router = APIRouter(tags=["chat-lead"])


@router.post("/chat-lead", response_model=ChatLeadResponse)
def upsert_chat_lead_route(payload: ChatLeadUpsert, db: Session = Depends(get_db)) -> ChatLeadResponse:
    try:
        lead = upsert_lead(db, payload)
    except ChatLeadPersistenceError:
        raise HTTPException(status_code=500, detail="Could not save your details. Please try again.") from None
    return ChatLeadResponse(
        success=True,
        conversation_id=lead.conversation_id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
    )
