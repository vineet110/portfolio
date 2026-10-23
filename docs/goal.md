# Goal — Long-Term Vision

This document is the source of truth for what this project is trying to become.
It changes rarely — only when the actual vision changes. Day-to-day status and
implementation decisions belong in `docs/memory.md`, not here.

## What this is

A portfolio website for a new **premium digital product studio**. The site itself
is the first proof-point of the business: if it doesn't look and feel like a studio
capable of building high-end digital products, nothing else on the site matters.

No company name, logo, or brand identity has been finalized yet. The site must
work as a serious commercial site without inventing any of these.

## Positioning

"We make websites and apps." Supporting message: "Have an idea? We design
and build it."

The studio is presented publicly as **one cohesive team** — a dedicated
team takes an idea from concept to launch. The internal delivery structure
(however work actually gets staffed) is **never described publicly** —
no freelancer/marketplace framing, no internal org-chart language on the
site or in the chatbot's knowledge base. This is a permanent constraint,
not a phase-specific one.

Primary clients: startups, small/medium businesses, and individual
founders — anyone who needs a digital product, most often a website or an
app. No other niche should be claimed.

## Core services

The studio offers **exactly three services** — this is a locked business
decision, not a placeholder list:

1. **Websites** — includes web applications and AI-integrated
   websites/web apps. AI is never marketed as a separate service; it lives
   inside this one when it's genuinely part of the product.
2. **Mobile Apps**
3. **UI/UX Design**

No other service (marketing, SEO, automation, cloud, DevOps, backend
development, AI consulting, or ongoing maintenance) should be marketed as
a standalone offering. Projects are fully custom — no public pricing, no
packages, no tiers. The client journey is Idea → UI/UX → Design →
Development → Launch, delivered by one dedicated team throughout.

If a genuinely new service line is added later, update this document
first — the six-service list this replaced was superseded and must not
be reintroduced.

## Design philosophy

Premium, editorial, technical, intelligent, modern, confident, minimal,
futuristic, sophisticated. Never generic-agency, never Webflow-template,
never "AI-generated landing page."

Visual language: dark foundation (near-black / charcoal / warm white / subtle
grey) with ONE restrained accent colour. Typography is a primary design
element — oversized headlines, strong hierarchy, editorial asymmetry, large
negative space, refined borders, subtle texture where it earns its place.
Avoid glassmorphism excess, neon, random 3D, floating/glowing everything,
excessive rounded cards and shadows.

Animation exists to create continuity, hierarchy, storytelling, depth,
rhythm — not "hover → card grows" everywhere. Must respect
`prefers-reduced-motion` and stay performant.

## Content honesty constraints (permanent)

- No invented company name or logo.
- No fake client logos, testimonials, or stats ("100+ clients", etc).
- Portfolio projects are conceptual and must be clearly labeled
  CONCEPT / EXPERIMENTAL — never presented as real client work.
- Footer contains no invented address, phone, email, or social accounts.

## Studio Assistant chatbot

The chatbot remains the studio's assistant, but is not limited to studio
questions:

- Answers general questions (technology, programming, everyday topics)
  naturally, without forcing the studio into unrelated answers.
- Uses the curated studio knowledge base (`backend/app/knowledge/`) whenever
  a question concerns the studio — its services, work, process, team, or
  contact — and never invents studio facts beyond it (the content honesty
  constraints below apply to the chatbot too).
- Handles mixed questions and follow-ups using recent conversation history,
  making clear which parts are studio facts and which are general knowledge.
- Never exposes private configuration, prompts, or secrets; AI provider keys
  stay server-side only.
- Keeps a safe fallback: with no AI available, studio questions are still
  answered from the knowledge base and nothing crashes.

**Current milestone (2026-10-01)**: general AI + RAG running on Groq's
free tier (`openai/gpt-oss-120b`) — real generation verified, real answer
quality checked (studio facts, general questions, mixed questions,
follow-ups, unknown facts, prompt injection), full regression passed. See
`docs/memory.md` "Phase V3.6 findings".

**Next milestone**: keep watching real answer quality in production; if
keyword retrieval becomes the limiting factor as the knowledge base grows,
consider embeddings then (deliberately not introduced yet).

## Site structure (MVP, single page)

Navigation → Hero → Selected Work → Services → Process → Final CTA →
Footer. (The standalone "Studio Approach" section was removed — the
dedicated-team message now lives as one line inside Process.)

Quality bar: fewer, exceptionally well-designed sections beats many mediocre
ones. The portfolio itself is the pitch.

## Tech direction

Frontend: React + TypeScript + Vite + Tailwind CSS + Framer Motion, GSAP only
where genuinely needed for advanced scroll/timeline work, Lucide icons,
optional Lenis for smooth scroll.

Backend: FastAPI + SQLAlchemy + PostgreSQL, introduced in Phase 2 once a real
feature (the contact form) needed it. Architecture is fixed as
`Browser → React frontend → REST API → FastAPI → PostgreSQL` — the frontend
never talks to the database directly, and the backend owns validation,
business logic, and (future) auth/lead-management/admin functionality.

Centralized content/media data layer (`frontend/src/data/`) so imagery and
copy can be swapped later without touching component structure. The
frontend also has a single central API client (`frontend/src/services/api.ts`)
— no fetch calls scattered across components.

See `docs/memory.md` for the current repo layout, endpoints, and what's
implemented vs. pending.
