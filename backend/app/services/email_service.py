"""Best-effort transactional email notifications.

Isolated from the contact route/service so the provider can change later
(Resend today) without touching the `/api/contact` contract. Never raises —
a notification failure must never affect an already-persisted enquiry or
the API response the user sees.
"""

import logging

import httpx

from app.core.config import get_settings
from app.models.contact import Contact

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _build_message(contact: Contact) -> str:
    return (
        "New website enquiry\n\n"
        f"Submission ID: {contact.id}\n"
        f"Name: {contact.name}\n"
        f"Email: {contact.email}\n"
        f"Company: {contact.company or '—'}\n"
        f"Project type: {contact.project_type}\n"
        f"Message:\n{contact.message}\n\n"
        f"Submitted at: {contact.created_at.isoformat()}\n"
    )


def send_contact_notification(contact: Contact) -> bool:
    """Send a notification email for a new contact enquiry.

    Returns True if the email was accepted by the provider, False if
    sending was skipped (not configured / unsupported provider) or failed.
    Never raises.
    """
    settings = get_settings()

    if not all(
        (
            settings.email_provider,
            settings.email_api_key,
            settings.email_from,
            settings.notification_email,
        )
    ):
        logger.warning(
            "Email notification skipped for contact id=%s: email provider not fully configured.",
            contact.id,
        )
        return False

    if settings.email_provider != "resend":
        logger.warning(
            "Email notification skipped for contact id=%s: unsupported EMAIL_PROVIDER '%s'.",
            contact.id,
            settings.email_provider,
        )
        return False

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {settings.email_api_key}"},
            json={
                "from": settings.email_from,
                "to": [settings.notification_email],
                "subject": "New project enquiry",
                "text": _build_message(contact),
            },
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Email notification failed to send for contact id=%s.", contact.id)
        return False

    return True
