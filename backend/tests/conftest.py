"""Test setup: an isolated SQLite database, never the real Neon database.

Environment variables are set before any `app.*` module is imported so that
`app.core.config.Settings` (and the SQLAlchemy engine built from it) picks
up the test database instead of whatever is in `backend/.env`.
"""

import atexit
import os
import tempfile

_db_fd, _db_path = tempfile.mkstemp(suffix=".db", prefix="portfolio-test-")
os.close(_db_fd)

os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"
os.environ["ENVIRONMENT"] = "test"
for _var in (
    "EMAIL_PROVIDER",
    "EMAIL_API_KEY",
    "EMAIL_FROM",
    "NOTIFICATION_EMAIL",
    "LLM_PROVIDER",
    "LLM_API_KEY",
    "LLM_MODEL",
):
    # Empty rather than unset: an unset variable would be read from
    # backend/.env instead, and tests must never call a real LLM or email API.
    os.environ[_var] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.db.database import engine  # noqa: E402
from app.main import app  # noqa: E402


def _cleanup_test_db() -> None:
    engine.dispose()
    if os.path.exists(_db_path):
        os.remove(_db_path)


atexit.register(_cleanup_test_db)

VALID_PAYLOAD = {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Acme Co",
    "project_type": "website",
    "message": "We would like to discuss a new product build for our company.",
}


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Settings are lru_cache'd; clear so per-test env var changes apply."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _clear_rate_limit_state():
    """The chat rate limiter keeps in-memory state across the whole test
    process; clear it per test so one test's requests never count against
    another's limit."""
    from app.core import rate_limit

    rate_limit._request_log.clear()
    yield
    rate_limit._request_log.clear()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client
