from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

_PHONE_RE = r"^\+?[0-9 ()-]{7,20}$"


class ChatLeadUpsert(BaseModel):
    """All fields except `conversation_id` are optional and nullable —
    the lead is captured progressively over the conversation, never all
    at once."""

    conversation_id: str = Field(min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=32)

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        import re

        if value is None:
            return value
        value = value.strip()
        if not value:
            return None
        if not re.match(_PHONE_RE, value):
            raise ValueError("That phone number doesn't look valid.")
        return value


class ChatLeadResponse(BaseModel):
    success: bool
    conversation_id: str
    name: str | None
    email: str | None
    phone: str | None


class ChatLeadRead(BaseModel):
    id: int
    conversation_id: str
    name: str | None
    email: str | None
    phone: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
