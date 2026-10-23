"""Optional external LLM integration for the Studio Assistant. When
configured, it answers every chat message — general questions from its own
knowledge, studio questions grounded in the retrieved studio knowledge that
`chat_service.py` puts in the system prompt. Entirely optional: the app and
`/api/chat` work correctly with none of LLM_PROVIDER / LLM_API_KEY /
LLM_MODEL set.

Isolated behind `is_configured()` / `ask()` so a different provider can be
added later without changing `chat_service.py`'s contract. The API key is
only ever read from server-side settings and sent in the Authorization
header — never logged, never returned.
"""

import json
import logging
import time
from collections.abc import Iterator

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

_REQUEST_TIMEOUT_SECONDS = 25.0
_MAX_RESPONSE_TOKENS = 600
# Reasoning models (gpt-oss) count their hidden reasoning tokens against the
# completion budget, so give them headroom or the visible answer gets cut off.
_MAX_RESPONSE_TOKENS_REASONING = 1200
# One retry on a rate limit, only when the provider says it clears quickly —
# a chat request should never hang waiting on a long cool-down.
_MAX_RATE_LIMIT_WAIT_SECONDS = 2.0

# Every supported provider speaks the OpenAI chat-completions format; only
# the endpoint differs. Gemini and Groq via their OpenAI-compatible endpoints.
_PROVIDER_ENDPOINTS = {
    "openai": "https://api.openai.com/v1/chat/completions",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    "groq": "https://api.groq.com/openai/v1/chat/completions",
}


def is_configured(settings: Settings) -> bool:
    return bool(settings.llm_provider and settings.llm_api_key and settings.llm_model)


def ask(
    settings: Settings,
    system_prompt: str,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Ask the configured LLM a question. Raises on any failure — callers
    are expected to catch and fall back, never to let this crash a request."""
    if not is_configured(settings):
        raise RuntimeError("LLM is not configured.")

    if settings.llm_provider not in _PROVIDER_ENDPOINTS:
        raise ValueError(f"Unsupported LLM_PROVIDER '{settings.llm_provider}'.")

    return _ask_openai_compatible(settings, system_prompt, message, history or [])


def ask_stream(
    settings: Settings,
    system_prompt: str,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> Iterator[str]:
    """Like `ask()`, but yields the answer in pieces as the provider
    generates it. Raises on any failure — including before the first piece,
    so callers can still fall back cleanly when nothing has been sent yet."""
    if not is_configured(settings):
        raise RuntimeError("LLM is not configured.")
    if settings.llm_provider not in _PROVIDER_ENDPOINTS:
        raise ValueError(f"Unsupported LLM_PROVIDER '{settings.llm_provider}'.")

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history or [])
    messages.append({"role": "user", "content": message})
    body = _request_body(settings, messages)
    body["stream"] = True

    with httpx.stream(
        "POST",
        _PROVIDER_ENDPOINTS[settings.llm_provider],
        headers={"Authorization": f"Bearer {settings.llm_api_key}"},
        json=body,
        timeout=_REQUEST_TIMEOUT_SECONDS,
    ) as response:
        response.raise_for_status()
        produced = False
        for line in response.iter_lines():
            if not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if data == "[DONE]":
                break
            choices = json.loads(data).get("choices") or []
            if not choices:
                continue
            piece = (choices[0].get("delta") or {}).get("content")
            if piece:
                produced = True
                yield piece
            if choices[0].get("finish_reason") == "length":
                logger.warning("LLM answer hit the token limit and may be truncated.")
        if not produced:
            raise RuntimeError("LLM returned no answer.")


def _is_reasoning_model(settings: Settings) -> bool:
    return settings.llm_provider == "groq" and (settings.llm_model or "").startswith("openai/gpt-oss")


def _request_body(settings: Settings, messages: list[dict[str, str]]) -> dict:
    body: dict = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": _MAX_RESPONSE_TOKENS,
    }
    if _is_reasoning_model(settings):
        # Low effort keeps latency and free-tier token use down; the
        # reasoning text itself is never shown, so don't return it.
        body["max_tokens"] = _MAX_RESPONSE_TOKENS_REASONING
        body["reasoning_effort"] = "low"
        body["include_reasoning"] = False
    return body


def _post(settings: Settings, body: dict) -> httpx.Response:
    return httpx.post(
        _PROVIDER_ENDPOINTS[settings.llm_provider],
        headers={"Authorization": f"Bearer {settings.llm_api_key}"},
        json=body,
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )


def _retry_after_seconds(response: httpx.Response) -> float | None:
    try:
        return float(response.headers.get("retry-after", ""))
    except ValueError:
        return None


def _ask_openai_compatible(
    settings: Settings,
    system_prompt: str,
    message: str,
    history: list[dict[str, str]],
) -> str:
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})
    body = _request_body(settings, messages)

    response = _post(settings, body)
    if response.status_code == 429:
        wait = _retry_after_seconds(response)
        if wait is not None and wait <= _MAX_RATE_LIMIT_WAIT_SECONDS:
            logger.warning("LLM provider rate-limited the request; retrying once in %.1fs.", wait)
            time.sleep(wait)
            response = _post(settings, body)
    response.raise_for_status()

    choice = response.json()["choices"][0]
    content = (choice["message"].get("content") or "").strip()
    if not content:
        raise RuntimeError(f"LLM returned no answer (finish_reason={choice.get('finish_reason')!r}).")
    if choice.get("finish_reason") == "length":
        logger.warning("LLM answer hit the token limit and may be truncated.")
    return content
