from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment variables / .env.

    Never hardcode credentials or origins here — this class only defines
    where the values come from and their defaults for local development.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg://username:password@localhost:5432/portfolio"

    # Comma-separated in the environment, e.g. "http://localhost:5173,https://example.com"
    allowed_origins: str = "http://localhost:5173"

    # Email notification — all optional. When any is missing, notification
    # sending is skipped (contact submissions still succeed either way).
    email_provider: str | None = None
    email_api_key: str | None = None
    email_from: str | None = None
    notification_email: str | None = None

    # Optional external LLM for the Studio Assistant chatbot's generic-question
    # fallback. All optional — the app and the chat endpoint work fully
    # without any of these set (studio-knowledge questions never need it).
    llm_provider: str | None = None
    llm_api_key: str | None = None
    llm_model: str | None = None

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        """Managed Postgres providers (Neon, Render, Heroku-style) commonly
        hand out bare `postgres://` or `postgresql://` connection strings.
        Without an explicit driver, SQLAlchemy defaults the "postgresql"
        dialect to psycopg2, which this project does not install — it uses
        psycopg (v3). Normalize the scheme so any such URL works as-is."""
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
