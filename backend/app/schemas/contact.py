from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

ProjectType = Literal[
    "website",
    "web-application",
    "product-design",
    "mobile",
    "ai-automation",
    "ongoing-development",
    "other",
]


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: str | None = Field(default=None, max_length=160)
    project_type: ProjectType
    message: str = Field(min_length=10, max_length=4000)


class ContactRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: str | None
    project_type: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactResponse(BaseModel):
    success: bool
    message: str
