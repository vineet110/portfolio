import httpx

from app.services import chat_service


def _configure_llm(monkeypatch: "pytest.MonkeyPatch") -> None:
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("LLM_API_KEY", "test-llm-key")
    monkeypatch.setenv("LLM_MODEL", "gpt-4o-mini")


def test_valid_chat_request_returns_an_answer(client):
    response = client.post("/api/chat", json={"message": "What do you offer?"})

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["answer"], str) and body["answer"]
    assert body["source"] in {"knowledge", "llm", "fallback"}


def test_studio_question_is_answered_from_knowledge(client):
    response = client.post("/api/chat", json={"message": "What do you offer?"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "knowledge"
    assert "Websites" in body["answer"] or "services" in body["answer"].lower()


def test_generic_question_without_llm_returns_the_safe_fallback(client):
    response = client.post("/api/chat", json={"message": "What is the capital of France?"})

    assert response.status_code == 200
    assert response.json() == {
        "answer": chat_service.FALLBACK_MESSAGE,
        "source": "fallback",
    }


def test_missing_llm_configuration_is_handled_gracefully(client, monkeypatch):
    for var in ("LLM_PROVIDER", "LLM_API_KEY", "LLM_MODEL"):
        monkeypatch.setenv(var, "")  # empty, so backend/.env cannot fill it in

    def unexpected_post(*args, **kwargs):
        raise AssertionError("no LLM call should be attempted when unconfigured")

    monkeypatch.setattr("app.services.llm_service.httpx.post", unexpected_post)

    response = client.post("/api/chat", json={"message": "Tell me a fun fact about space."})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["answer"] == chat_service.FALLBACK_MESSAGE


def test_mocked_llm_success_returns_an_llm_answer(client, monkeypatch):
    _configure_llm(monkeypatch)

    def fake_post(url, headers=None, json=None, timeout=None):
        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": "The sky looks blue due to Rayleigh scattering."}}]}

        return FakeResponse()

    monkeypatch.setattr("app.services.llm_service.httpx.post", fake_post)

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "llm"
    assert body["answer"] == "The sky looks blue due to Rayleigh scattering."


def test_mocked_llm_failure_falls_back_gracefully(client, monkeypatch):
    _configure_llm(monkeypatch)

    def failing_post(*args, **kwargs):
        request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
        raise httpx.ConnectError("connection failed", request=request)

    monkeypatch.setattr("app.services.llm_service.httpx.post", failing_post)

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["answer"] == chat_service.FALLBACK_MESSAGE


# Phase V3.1 — locked three-service business definition. Each of these
# questions must be answered from the curated knowledge base (never the
# LLM/fallback), and the answer must reflect the locked business facts.
BUSINESS_DEFINITION_CASES = [
    ("What do you do?", ["websites", "apps"]),
    ("What services do you offer?", ["websites", "mobile apps", "ui/ux design"]),
    ("Do you build web apps?", ["web applications"]),
    ("Do you build AI websites?", ["ai"]),
    ("Do you build mobile apps?", ["mobile"]),
    ("Do you do UI/UX?", ["ui/ux"]),
    ("Who do you work with?", ["startups"]),
    ("Do you offer fixed packages?", ["no"]),
    ("Can I bring just an idea?", ["idea"]),
    ("What is your process?", ["idea", "launch"]),
    ("Do you have a team?", ["dedicated team"]),
    ("Can I see your work?", ["work"]),
    ("Are these real client projects?", ["concept"]),
    ("How can I contact you?", ["contact form"]),
    ("Can I reach you on WhatsApp?", ["whatsapp"]),
    # Phase V3.2 — same business facts, the brief's exact rephrasings.
    ("Do you build AI-integrated websites?", ["ai"]),
    ("Do you offer packages?", ["no"]),
    ("Can I bring only an idea?", ["idea"]),
    ("Do you have a dedicated team?", ["dedicated team"]),
]


def test_business_definition_questions_are_answered_from_knowledge(client):
    for question, expected_fragments in BUSINESS_DEFINITION_CASES:
        response = client.post("/api/chat", json={"message": question})

        assert response.status_code == 200, question
        body = response.json()
        assert body["source"] == "knowledge", f"{question!r} did not match the knowledge base"

        answer_lower = body["answer"].lower()
        for fragment in expected_fragments:
            assert fragment in answer_lower, f"{question!r} answer missing {fragment!r}: {body['answer']!r}"


def test_chatbot_never_claims_a_fourth_service(client):
    response = client.post("/api/chat", json={"message": "What services do you offer?"})

    assert response.status_code == 200
    answer_lower = response.json()["answer"].lower()
    for banned in ("ongoing development", "automation service", "cloud", "devops", "seo"):
        assert banned not in answer_lower


# General-purpose assistant: with an LLM configured, every message goes to
# the LLM, with retrieved studio knowledge in the system prompt.


def _capture_llm_calls(monkeypatch, answer="An LLM answer."):
    calls = []

    def fake_post(url, headers=None, json=None, timeout=None):
        calls.append({"url": url, "json": json})

        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": answer}}]}

        return FakeResponse()

    monkeypatch.setattr("app.services.llm_service.httpx.post", fake_post)
    return calls


def _system_prompt(call):
    return call["json"]["messages"][0]["content"]


def test_general_question_is_answered_by_the_llm_without_forced_studio_context(client, monkeypatch):
    _configure_llm(monkeypatch)
    calls = _capture_llm_calls(monkeypatch, "Python is dynamically typed; Java is statically typed.")

    response = client.post("/api/chat", json={"message": "What is the capital of France?"})

    assert response.json() == {
        "answer": "Python is dynamically typed; Java is statically typed.",
        "source": "llm",
    }
    assert "No studio knowledge matched this message." in _system_prompt(calls[0])


def test_studio_question_goes_to_the_llm_grounded_in_studio_knowledge(client, monkeypatch):
    _configure_llm(monkeypatch)
    calls = _capture_llm_calls(monkeypatch)

    response = client.post("/api/chat", json={"message": "What services do you offer?"})

    assert response.json()["source"] == "llm"
    prompt = _system_prompt(calls[0])
    assert "Studio knowledge:" in prompt
    assert "UI/UX Design" in prompt and "Mobile Apps" in prompt


def test_studio_question_falls_back_to_verbatim_knowledge_when_the_llm_fails(client, monkeypatch):
    _configure_llm(monkeypatch)

    def failing_post(*args, **kwargs):
        raise httpx.ConnectError("connection failed", request=httpx.Request("POST", "https://example.test"))

    monkeypatch.setattr("app.services.llm_service.httpx.post", failing_post)

    response = client.post("/api/chat", json={"message": "What services do you offer?"})

    body = response.json()
    assert body["source"] == "knowledge"
    assert "mobile apps" in body["answer"].lower()


def test_follow_up_sends_history_once_and_keeps_studio_context(client, monkeypatch):
    _configure_llm(monkeypatch)
    calls = _capture_llm_calls(monkeypatch)

    history = [
        {"role": "user", "content": "What services do you offer?"},
        {"role": "assistant", "content": "Websites, mobile apps, and UI/UX design."},
        {"role": "user", "content": "Tell me more about the second one"},
    ]
    response = client.post(
        "/api/chat", json={"message": "Tell me more about the second one", "history": history}
    )

    assert response.json()["source"] == "llm"
    messages = calls[0]["json"]["messages"]
    assert [m["role"] for m in messages] == ["system", "user", "assistant", "user"]
    assert messages[-1]["content"] == "Tell me more about the second one"
    assert "Mobile Apps" in messages[0]["content"]


def test_gemini_provider_uses_its_openai_compatible_endpoint(client, monkeypatch):
    _configure_llm(monkeypatch)
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    calls = _capture_llm_calls(monkeypatch)

    client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert calls[0]["url"] == "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"


def test_unsupported_provider_falls_back_gracefully(client, monkeypatch):
    _configure_llm(monkeypatch)
    monkeypatch.setenv("LLM_PROVIDER", "not-a-provider")

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.json()["source"] == "fallback"


# Groq (free tier, openai/gpt-oss-120b) — the active provider.


def _configure_groq(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_API_KEY", "gsk_test_key_never_real")
    monkeypatch.setenv("LLM_MODEL", "openai/gpt-oss-120b")


def _fake_response(status_code=200, content="A Groq answer.", finish_reason="stop", headers=None):
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    return httpx.Response(
        status_code,
        json={"choices": [{"message": {"role": "assistant", "content": content}, "finish_reason": finish_reason}]}
        if status_code == 200
        else {"error": {"message": "provider error"}},
        headers=headers or {},
        request=request,
    )


def test_groq_provider_uses_its_endpoint_and_reasoning_settings(client, monkeypatch):
    _configure_groq(monkeypatch)
    calls = []

    def fake_post(url, headers=None, json=None, timeout=None):
        calls.append({"url": url, "headers": headers, "json": json})
        return _fake_response()

    monkeypatch.setattr("app.services.llm_service.httpx.post", fake_post)

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.json() == {"answer": "A Groq answer.", "source": "llm"}
    assert calls[0]["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert calls[0]["headers"] == {"Authorization": "Bearer gsk_test_key_never_real"}
    body = calls[0]["json"]
    assert body["model"] == "openai/gpt-oss-120b"
    assert body["reasoning_effort"] == "low"
    assert body["include_reasoning"] is False
    assert body["max_tokens"] >= 1000  # reasoning tokens share the completion budget


def test_groq_rate_limit_is_retried_once_when_it_clears_quickly(client, monkeypatch):
    _configure_groq(monkeypatch)
    monkeypatch.setattr("app.services.llm_service.time.sleep", lambda seconds: None)
    responses = [_fake_response(429, headers={"retry-after": "1"}), _fake_response(content="Retried answer.")]
    monkeypatch.setattr("app.services.llm_service.httpx.post", lambda *a, **k: responses.pop(0))

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.json() == {"answer": "Retried answer.", "source": "llm"}
    assert responses == []


def test_groq_long_rate_limit_falls_back_without_waiting(client, monkeypatch):
    _configure_groq(monkeypatch)

    def no_sleep(seconds):
        raise AssertionError("should not wait out a long rate limit")

    monkeypatch.setattr("app.services.llm_service.time.sleep", no_sleep)
    calls = []

    def fake_post(*args, **kwargs):
        calls.append(1)
        return _fake_response(429, headers={"retry-after": "60"})

    monkeypatch.setattr("app.services.llm_service.httpx.post", fake_post)

    response = client.post("/api/chat", json={"message": "What services do you offer?"})

    body = response.json()
    assert body["source"] == "knowledge"
    assert "mobile apps" in body["answer"].lower()
    assert len(calls) == 1


def test_groq_empty_answer_falls_back(client, monkeypatch):
    _configure_groq(monkeypatch)
    monkeypatch.setattr(
        "app.services.llm_service.httpx.post",
        lambda *a, **k: _fake_response(content="", finish_reason="length"),
    )

    response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.json() == {"answer": chat_service.FALLBACK_MESSAGE, "source": "fallback"}


def test_provider_auth_error_never_leaks_the_key(client, monkeypatch, caplog):
    _configure_groq(monkeypatch)
    monkeypatch.setattr("app.services.llm_service.httpx.post", lambda *a, **k: _fake_response(401))

    with caplog.at_level("DEBUG"):
        response = client.post("/api/chat", json={"message": "Why is the sky blue?"})

    assert response.status_code == 200
    assert response.json()["source"] == "fallback"
    assert "gsk_test_key_never_real" not in response.text
    assert "gsk_test_key_never_real" not in caplog.text


def test_llm_is_not_configured_in_tests_even_with_a_local_env_file():
    from app.core.config import get_settings
    from app.services import llm_service

    assert not llm_service.is_configured(get_settings())


# Retrieval relevance: generic words must not carry a match on their own.


def test_technology_question_retrieves_the_technology_section():
    from app.services import knowledge_service

    matches = knowledge_service.retrieve("What technology do you use?")

    assert matches and "Technology" in matches[0].section.title
    assert "FastAPI" in matches[0].section.content


def test_unrelated_question_sharing_a_generic_word_retrieves_nothing():
    from app.services import knowledge_service

    assert knowledge_service.retrieve("Can you write a short poem about launch day for a rocket?") == []


def test_llm_markdown_is_converted_to_plain_text_for_the_widget(client, monkeypatch):
    _configure_groq(monkeypatch)
    markdown = (
        "### Recursion\n"
        "A **recursive** method calls itself.\n\n"
        "```java\n"
        "int f(int n) { return n <= 1 ? 1 : n * f(n - 1); }\n"
        "```\n"
        "- __Base case__ stops it; 2 * 3 * 4 stays as-is."
    )
    monkeypatch.setattr("app.services.llm_service.httpx.post", lambda *a, **k: _fake_response(content=markdown))

    answer = client.post("/api/chat", json={"message": "Explain recursion"}).json()["answer"]

    assert answer == (
        "Recursion\n"
        "A recursive method calls itself.\n\n"
        "int f(int n) { return n <= 1 ? 1 : n * f(n - 1); }\n"
        "- Base case stops it; 2 * 3 * 4 stays as-is."
    )
