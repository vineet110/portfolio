"""Persistence for progressively-captured chatbot leads.

One row per `conversation_id`. Only name/email/phone are ever stored here —
the conversation transcript itself is never written to the database (see
app/services/chat_service.py). A field already saved is never overwritten
with a blank value — the caller only sends the fields it actually captured
this turn.
"""

import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.chat_lead import ChatLead
from app.schemas.chat_lead import ChatLeadUpsert

logger = logging.getLogger(__name__)


class ChatLeadPersistenceError(Exception):
    """Raised when the lead could not be saved to the database."""


def upsert_lead(db: Session, payload: ChatLeadUpsert) -> ChatLead:
    lead = db.query(ChatLead).filter_by(conversation_id=payload.conversation_id).one_or_none()

    if lead is None:
        lead = ChatLead(conversation_id=payload.conversation_id)
        db.add(lead)

    if payload.name is not None:
        lead.name = payload.name
    if payload.email is not None:
        lead.email = payload.email
    if payload.phone is not None:
        lead.phone = payload.phone

    try:
        db.commit()
        db.refresh(lead)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to persist chat lead.")
        raise ChatLeadPersistenceError("Could not save the lead.") from None

    return lead
