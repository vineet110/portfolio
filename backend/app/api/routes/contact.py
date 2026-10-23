from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.contact import ContactCreate, ContactResponse
from app.services.contact_service import ContactPersistenceError, submit_contact

router = APIRouter(tags=["contact"])


@router.post("/contact", response_model=ContactResponse)
def submit_contact_route(payload: ContactCreate, db: Session = Depends(get_db)) -> ContactResponse:
    try:
        submit_contact(db, payload)
    except ContactPersistenceError:
        raise HTTPException(
            status_code=500, detail="Could not save your enquiry. Please try again."
        ) from None
    return ContactResponse(success=True, message="Your enquiry has been received.")
