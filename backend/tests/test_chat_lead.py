from app.db.database import SessionLocal
from app.models.chat_lead import ChatLead


def _get_lead(conversation_id: str) -> ChatLead | None:
    db = SessionLocal()
    try:
        return db.query(ChatLead).filter_by(conversation_id=conversation_id).one_or_none()
    finally:
        db.close()


def test_create_lead_with_name(client):
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-name", "name": "Jane Doe"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["name"] == "Jane Doe"
    assert body["email"] is None
    assert body["phone"] is None

    lead = _get_lead("conv-name")
    assert lead is not None
    assert lead.name == "Jane Doe"


def test_update_lead_with_email(client):
    client.post("/api/chat-lead", json={"conversation_id": "conv-email", "name": "Jane Doe"})
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-email", "email": "jane@example.com"})

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Jane Doe"
    assert body["email"] == "jane@example.com"


def test_update_lead_with_phone(client):
    client.post("/api/chat-lead", json={"conversation_id": "conv-phone", "name": "Jane Doe"})
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-phone", "phone": "+91 98765 43210"})

    assert response.status_code == 200
    assert response.json()["phone"] == "+91 98765 43210"


def test_same_conversation_id_updates_the_same_record(client):
    client.post("/api/chat-lead", json={"conversation_id": "conv-same", "name": "Jane Doe"})
    client.post("/api/chat-lead", json={"conversation_id": "conv-same", "email": "jane@example.com"})
    client.post("/api/chat-lead", json={"conversation_id": "conv-same", "phone": "9876543210"})

    db = SessionLocal()
    try:
        rows = db.query(ChatLead).filter_by(conversation_id="conv-same").all()
    finally:
        db.close()

    assert len(rows) == 1
    assert rows[0].name == "Jane Doe"
    assert rows[0].email == "jane@example.com"
    assert rows[0].phone == "9876543210"


def test_invalid_email_rejected(client):
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-bad-email", "email": "not-an-email"})

    assert response.status_code == 422
    assert _get_lead("conv-bad-email") is None


def test_invalid_phone_rejected(client):
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-bad-phone", "phone": "abc"})

    assert response.status_code == 422


def test_optional_phone_accepted_when_absent(client):
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-no-phone", "name": "Jane Doe"})

    assert response.status_code == 200
    body = response.json()
    assert body["phone"] is None


def test_declined_or_empty_optional_fields_handled_correctly(client):
    response = client.post(
        "/api/chat-lead",
        json={"conversation_id": "conv-declined", "name": "Jane Doe", "email": None, "phone": None},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Jane Doe"
    assert body["email"] is None
    assert body["phone"] is None

    # A later, still-declined update must not wipe out the name already saved.
    response = client.post("/api/chat-lead", json={"conversation_id": "conv-declined", "name": None})
    assert response.status_code == 200
    assert response.json()["name"] == "Jane Doe"
