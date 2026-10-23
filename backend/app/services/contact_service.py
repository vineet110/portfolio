import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.schemas.contact import ContactCreate
from app.services.email_service import send_contact_notification

logger = logging.getLogger(__name__)


class ContactPersistenceError(Exception):
    """Raised when the enquiry could not be saved to the database."""


def create_contact(db: Session, payload: ContactCreate) -> Contact:
    contact = Contact(
        name=payload.name,
        email=payload.email,
        company=payload.company,
        project_type=payload.project_type,
        message=payload.message,
    )
    try:
        db.add(contact)
        db.commit()
        db.refresh(contact)
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to persist contact enquiry.")
        raise ContactPersistenceError("Could not save the enquiry.") from None
    return contact


def submit_contact(db: Session, payload: ContactCreate) -> Contact:
    """Persist the enquiry, then best-effort notify the studio by email.

    Database persistence is the primary operation. A notification failure
    is logged and swallowed here — it must never roll back or hide an
    already-saved enquiry, and the caller still returns a normal success
    response.
    """
    contact = create_contact(db, payload)

    try:
        send_contact_notification(contact)
    except Exception:
        logger.exception(
            "Unexpected error while sending the contact notification email for contact id=%s.",
            contact.id,
        )

    return contact
