"""Lightweight retrieval over the curated studio knowledge base.

No vector database, no embeddings — deliberately simple keyword-overlap
scoring over markdown sections in `app/knowledge/`. Isolated behind this
module's `retrieve()` function so it can be swapped for embeddings/vector
search later without touching `chat_service.py`'s contract.
"""

import math
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"

_WORD_RE = re.compile(r"[a-z0-9]+")

_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with",
    "is", "are", "does", "did", "you", "your", "we", "our", "us",
    "i", "what", "how", "can", "it", "its", "this", "that", "be", "have",
    "has", "about", "from", "at", "as", "if", "will", "would", "could",
    "should", "not", "no", "yes", "my", "me", "who", "which", "was", "were",
}


def _tokenize(text: str) -> set[str]:
    return {w for w in _WORD_RE.findall(text.lower()) if w not in _STOPWORDS and len(w) > 1}


@dataclass(frozen=True)
class KnowledgeSection:
    source: str
    title: str
    content: str
    keywords: frozenset[str]


@dataclass(frozen=True)
class KnowledgeMatch:
    section: KnowledgeSection
    score: float


def _parse_markdown(path: Path) -> list[KnowledgeSection]:
    text = path.read_text(encoding="utf-8")
    sections: list[KnowledgeSection] = []
    current_title = path.stem
    current_lines: list[str] = []

    def flush() -> None:
        body = "\n".join(current_lines).strip()
        if body:
            sections.append(
                KnowledgeSection(
                    source=path.name,
                    title=current_title,
                    content=body,
                    keywords=frozenset(_tokenize(f"{current_title} {body}")),
                )
            )

    for line in text.splitlines():
        heading = re.match(r"^#{1,3}\s+(.*)", line)
        if heading:
            flush()
            current_title = heading.group(1).strip()
            current_lines = []
        else:
            current_lines.append(line)
    flush()
    return sections


@lru_cache
def _load_sections() -> tuple[KnowledgeSection, ...]:
    if not KNOWLEDGE_DIR.exists():
        return ()
    sections: list[KnowledgeSection] = []
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        sections.extend(_parse_markdown(path))
    return tuple(sections)


@lru_cache
def _token_weights() -> dict[str, float]:
    """Inverse document frequency of each token across all sections, so a
    word that appears in many sections (e.g. "do", "work") counts for less
    than a distinctive one (e.g. "technology", "pricing")."""
    sections = _load_sections()
    document_frequency: dict[str, int] = {}
    for section in sections:
        for token in section.keywords:
            document_frequency[token] = document_frequency.get(token, 0) + 1
    total = len(sections)
    return {token: math.log((total + 1) / (df + 1)) + 1 for token, df in document_frequency.items()}


def _weight(tokens: set[str], weights: dict[str, float], unseen_weight: float) -> float:
    return sum(weights.get(token, unseen_weight) for token in tokens)


def retrieve(question: str, top_k: int = 3, min_score: float = 0.12) -> list[KnowledgeMatch]:
    """Return the most relevant knowledge sections for `question`, best first.

    Score is Jaccard-style token overlap between the question and a
    section's title+body, with a boost when the overlap includes words
    from the section's own title. Each token is weighted by how rare it is
    across the knowledge base, so generic words can't carry a match alone.
    Sections scoring below `min_score` are dropped — an empty result means
    "no useful studio knowledge exists" for this question.
    """
    query_tokens = _tokenize(question)
    if not query_tokens:
        return []

    sections = _load_sections()
    weights = _token_weights()
    # A query word found in no section is as distinctive as it gets.
    unseen_weight = math.log(len(sections) + 1) + 1
    query_weight = _weight(query_tokens, weights, unseen_weight)

    matches: list[KnowledgeMatch] = []
    for section in sections:
        if not section.keywords:
            continue
        overlap = query_tokens & section.keywords
        if not overlap:
            continue
        # Recall of the query's own words within this section — not a full
        # Jaccard overlap, so a long, genuinely relevant section isn't
        # penalized just for containing many other (also relevant) words.
        body_score = _weight(overlap, weights, unseen_weight) / query_weight

        # Title match matters more than body overlap: a section whose own
        # heading closely matches the query (e.g. the query *is* basically
        # the heading) should outrank a section that merely mentions the
        # same word once in a longer, less-related body.
        title_tokens = _tokenize(section.title)
        title_score = 0.0
        if title_tokens:
            title_overlap = query_tokens & title_tokens
            if title_overlap:
                title_score = _weight(title_overlap, weights, unseen_weight) / _weight(
                    query_tokens | title_tokens, weights, unseen_weight
                )

        score = (0.4 * body_score) + (0.6 * title_score)
        matches.append(KnowledgeMatch(section=section, score=score))

    matches.sort(key=lambda m: m.score, reverse=True)
    return [m for m in matches[:top_k] if m.score >= min_score]
