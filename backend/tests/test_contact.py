import httpx

from app.db.database import SessionLocal
from app.models.contact import Contact

from .conftest import VALID_PAYLOAD


def _configure_email(monkeypatch: "pytest.MonkeyPatch") -> None:
    monkeypatch.setenv("EMAIL_PROVIDER", "resend")
    monkeypatch.setenv("EMAIL_API_KEY", "test-key")
    monkeypatch.setenv("EMAIL_FROM", "studio@example.com")
    monkeypatch.setenv("NOTIFICATION_EMAIL", "owner@example.com")


def _count_contacts_for(email: str) -> int:
    db = SessionLocal()
    try:
        return db.query(Contact).filter_by(email=email).count()
    finally:
        db.close()


def test_valid_contact_submission_succeeds(client):
    payload = {**VALID_PAYLOAD, "email": "valid-submission@example.com"}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Your enquiry has been received.",
    }


def test_invalid_email_is_rejected(client):
    payload = {**VALID_PAYLOAD, "email": "not-an-email"}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 422


def test_valid_submission_is_persisted_to_the_database(client):
    payload = {**VALID_PAYLOAD, "email": "persistence-check@example.com"}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    db = SessionLocal()
    try:
        row = db.query(Contact).filter_by(email="persistence-check@example.com").one()
        assert row.name == payload["name"]
        assert row.company == payload["company"]
        assert row.project_type == payload["project_type"]
        assert row.message == payload["message"]
        assert row.created_at is not None
    finally:
        db.close()


def test_email_provider_configured_notification_is_attempted(client, monkeypatch):
    _configure_email(monkeypatch)

    calls = []

    def fake_post(url, headers=None, json=None, timeout=None):
        calls.append({"url": url, "headers": headers, "json": json})

        class FakeResponse:
            def raise_for_status(self):
                return None

        return FakeResponse()

    monkeypatch.setattr("app.services.email_service.httpx.post", fake_post)

    payload = {**VALID_PAYLOAD, "email": "notify-attempted@example.com"}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert len(calls) == 1
    assert calls[0]["json"]["to"] == ["owner@example.com"]
    assert calls[0]["headers"]["Authorization"] == "Bearer test-key"


def test_email_provider_unavailable_does_not_lose_the_enquiry(client, monkeypatch):
    _configure_email(monkeypatch)

    def failing_post(*args, **kwargs):
        request = httpx.Request("POST", "https://api.resend.com/emails")
        raise httpx.ConnectError("connection failed", request=request)

    monkeypatch.setattr("app.services.email_service.httpx.post", failing_post)

    email = "provider-unavailable@example.com"
    payload = {**VALID_PAYLOAD, "email": email}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Your enquiry has been received.",
    }
    assert _count_contacts_for(email) == 1


def test_email_provider_not_configured_submission_still_succeeds(client, monkeypatch):
    def unexpected_post(*args, **kwargs):
        raise AssertionError("email should not be sent when the provider is not configured")

    monkeypatch.setattr("app.services.email_service.httpx.post", unexpected_post)

    email = "no-provider-configured@example.com"
    payload = {**VALID_PAYLOAD, "email": email}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert _count_contacts_for(email) == 1


def test_notification_failure_does_not_cause_data_loss(client, monkeypatch):
    _configure_email(monkeypatch)

    def error_response_post(url, headers=None, json=None, timeout=None):
        request = httpx.Request("POST", url)
        response = httpx.Response(401, request=request, json={"message": "invalid api key"})

        class FakeResponse:
            def raise_for_status(self):
                raise httpx.HTTPStatusError("unauthorized", request=request, response=response)

        return FakeResponse()

    monkeypatch.setattr("app.services.email_service.httpx.post", error_response_post)

    email = "notification-failure@example.com"
    payload = {**VALID_PAYLOAD, "email": email}
    response = client.post("/api/contact", json=payload)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert _count_contacts_for(email) == 1
