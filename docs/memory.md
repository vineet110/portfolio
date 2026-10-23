# Memory — Current Project State

This document reflects the actual state of the project right now. See
`docs/goal.md` for the long-term vision this state is working toward.

## Status (2026-10-01): Phase V3.6 — Groq AI chatbot (general AI + portfolio RAG)

- **Provider**: Groq, free tier, model `openai/gpt-oss-120b`
  (`LLM_PROVIDER=groq`, `LLM_MODEL=openai/gpt-oss-120b`, key in
  `LLM_API_KEY` — server-side only, `backend/.env` locally and an encrypted
  Vercel env var in production). Free-plan limits for this model: 30 RPM,
  1K requests/day, 8K tokens/min, 200K tokens/day. Gemini support is kept
  in `llm_service.py` (`LLM_PROVIDER=gemini`) but inactive — its project
  was denied access by Google.
- **Verified**: real Groq authentication, model availability, generation,
  and real answer quality — see "Phase V3.6 findings" below.
- **Production**: live on https://port-front-lake.vercel.app with Groq
  (2026-10-01). `LLM_PROVIDER` / `LLM_MODEL` / `LLM_API_KEY` set in Vercel
  for Production and Preview (`LLM_API_KEY` added as sensitive, via stdin).
- **Commits** (local only, no remote): `cefff20` feat: integrate Groq AI
  chatbot → `a3a14fa` fix: return plain-text chatbot answers → `73f5f43`
  fix: never quote price ranges in studio answers (built on `c414a67`).
  The production deployment is built from `73f5f43`.
- **Regression at `73f5f43`**: backend pytest 38/38, oxlint clean,
  `tsc -b` clean, production build OK, Playwright 49 passed + 3 timing
  flakes that pass when re-run serially (`--workers=1`), production smoke
  passed.

The status sections below are historical snapshots from earlier phases;
where they say a phase was "not deployed" or "nothing committed", later
commits (`e1dab2d` V2, `549dfa2` V3, `f9e6888`) and the 2026-09-15 → 2026-09-20
production deployments supersede them.

## Status (historical): Phase V2 complete locally — creative work-first redesign, NOT YET DEPLOYED

**Important**: production (`https://port-front-lake.vercel.app`) currently
still serves the **Phase 9 design** (dark near-black editorial theme). The
V2 redesign below is complete and fully tested **locally only** — per this
phase's explicit brief ("Do not deploy automatically after the redesign"),
nothing has been deployed. Full details under "Phase V2 findings — creative
work-first redesign" below.

**The site is deployed and working end-to-end in production**:
**https://port-front-lake.vercel.app**. Both the React frontend and the
FastAPI backend run as a single Vercel project using Vercel **Services**
(one project, two services, one shared domain) — no Render, no Docker, no
GitHub. Full details under "Phase 6A/6B findings — Vercel deployment" below.
Short version: `POST /api/contact` on the real production URL was verified
to actually write to real Neon Postgres (checked by an independent query,
not just the HTTP response), then the test row was deleted. The contact
form now calls the backend via a same-origin relative path (`/api/...`),
not a separate hostname.

Phase 7 initialized a local git repository (there had been none through
Phases 1–6) and created the first commit — a "release checkpoint" capturing
the exact state that is live in production. **Nothing has been pushed
anywhere** — this is a local-only checkpoint, per this phase's brief. Full
details, including a real `.gitignore` bug found and fixed during this
phase, are under "Phase 7 findings — local Git" below.

- **First commit**: `97109e1b36a016dced56dbb4035fcae4204ac1df` —
  `chore: production release checkpoint` (82 files, 5720 insertions, no
  parent commit — this is the repository's root commit)
- **Remote**: none configured. Not pushed to GitHub, GitLab, or anywhere
  else, by design.

Phase 8 added two things to the contact flow, both deployed and verified in
production, without changing the visual system, adding the AI chatbot, the
freelancer feature, or any new infrastructure (no Docker, no Redis, no
queues): **(1)** an email notification to the studio owner on every contact
submission — best-effort, via Resend, never able to lose or roll back an
already-persisted enquiry — and **(2)** a direct WhatsApp CTA in the contact
area (`https://wa.me/917382016152`, plain link, no WhatsApp Business API,
no backend integration at all). Full details under "Phase 8 findings —
contact notifications + WhatsApp CTA" below.

Phase 9 added a floating "Studio Assistant" chatbot: a premium launcher +
panel on the frontend, a new `POST /api/chat` endpoint, a curated markdown
knowledge base with lightweight keyword-overlap retrieval (no vector DB),
and an entirely optional external LLM fallback for generic questions (the
app works fully with no LLM key set). No visual redesign, no chat history
persisted to Postgres, no new infrastructure. Full details under "Phase 9
findings — Studio Assistant chatbot" below.

Phase 1 built the approved single-page frontend. Phase 2 restructured the
repo into `frontend/` + `backend/` and added a working FastAPI contact API.
Phase 2.5 added a Playwright UI test suite and used it to find and fix real
bugs — most importantly, every project/capability image was broken in a real
browser despite being correct-looking in code (details under "Phase 2.5
findings"). Phase 3 was a pre-deployment verification pass against the
**real Neon PostgreSQL** database (credentials live only in `backend/.env`,
never read into this document or printed to any log) — full details under
"Phase 3 findings" below. Short version: the app connects, creates its
table, and persists data correctly against real Neon, but one real bug was
found and fixed (a `DATABASE_URL` driver-scheme mismatch that would have
made the app fail to start in production), and two missing pieces of
deployment plumbing (production start command, pinned Python version) were
added. **No visual redesign was done at any phase** — same sections, same
copy, same animation direction throughout; every change has been a targeted
fix for an actual defect.

Both the frontend/backend integration (Phase 2) and the UI test suite
(Phase 2.5) were actually run this session, not just written — see
"Verification performed" and "Phase 2.5 findings" below.

## Repository structure

```
portfolio/
├── frontend/                  — React + TypeScript + Vite + Tailwind + Framer Motion (unchanged app, moved as-is)
│   ├── public/
│   ├── src/
│   │   ├── data/               (media.ts, projects.ts, services.ts, process.ts, contact.ts — new, Phase 8)
│   │   ├── animations/         (RevealText.tsx, MagneticButton.tsx)
│   │   ├── components/         (SectionLabel.tsx, Marquee.tsx, ContactForm.tsx, WhatsAppCta.tsx — Phase 8; ChatWidget.tsx — new, Phase 9)
│   │   ├── services/           (api.ts — central API client; `sendChatMessage()` added Phase 9)
│   │   ├── sections/           (Navigation, Hero, SelectedWork, Services, Approach, Process, FinalCta, Footer)
│   │   ├── vite-env.d.ts       (new: types VITE_API_URL)
│   │   └── App.tsx             (mounts <ChatWidget /> — new, Phase 9)
│   ├── .env.example             (new)
│   ├── package.json, vite.config.ts, tsconfig*.json
│
├── backend/                    — new, FastAPI
│   ├── app/
│   │   ├── api/routes/          health.py, contact.py, chat.py (new, Phase 9)
│   │   ├── core/                config.py (pydantic-settings, env-driven; normalizes DATABASE_URL to +psycopg); rate_limit.py (new, Phase 9 — in-memory sliding-window limiter for /api/chat)
│   │   ├── db/                  database.py (engine/session/init_db), base.py (declarative Base)
│   │   ├── models/contact.py    (SQLAlchemy Contact model)
│   │   ├── schemas/             contact.py (ContactCreate/ContactRead/ContactResponse); chat.py (new, Phase 9 — ChatMessage/ChatRequest/ChatResponse)
│   │   ├── knowledge/           (new, Phase 9 — curated markdown knowledge base: services.md, about.md, capabilities.md, process.md, work.md, faq.md, contact.md)
│   │   ├── services/
│   │   │   ├── contact_service.py   (coordinates DB persistence + email notification)
│   │   │   ├── email_service.py     (Phase 8 — Resend integration, isolated from the route)
│   │   │   ├── chat_service.py      (new, Phase 9 — orchestrates knowledge retrieval → optional LLM → safe fallback; V3.5: LLM-first with retrieved knowledge in the prompt, see "Phase V3.5 findings")
│   │   │   ├── knowledge_service.py (new, Phase 9 — lightweight keyword-overlap retrieval over app/knowledge/*.md, no vector DB)
│   │   │   └── llm_service.py       (new, Phase 9 — optional external LLM call, isolated behind is_configured()/ask(); V3.5: providers `openai` + `gemini`)
│   │   └── main.py              (FastAPI app, CORS, router wiring, lifespan → init_db)
│   ├── tests/                   (Phase 8 — pytest + FastAPI TestClient against an isolated SQLite file, never the real Neon database; test_chat.py added Phase 9)
│   ├── pytest.ini               (Phase 8 — `pythonpath = .` so `app` resolves regardless of cwd)
│   ├── requirements.txt
│   ├── .env                     (real Neon connection string + email config — gitignored, never committed)
│   ├── .env.example
│   ├── Procfile                 (production start command — Render-style, kept as a documented fallback; not used by the Vercel deploy)
│   ├── runtime.txt              (Heroku/Render-style Python pin — not read by Vercel, kept for that fallback path)
│   ├── .python-version          ("3.12" — this IS read by Vercel's Python runtime; see Phase 6B note on why it's "3.12" not "3.12.0")
│   └── README.md
│
├── docs/ (goal.md, memory.md)
├── vercel.json                  (new, Phase 6B — defines the two Vercel Services and top-level routing; lives at repo root, not inside frontend/ or backend/)
├── README.md
└── .gitignore                  (covers node_modules, dist, backend/.venv, __pycache__, *.db, .env/.env.*, .vercel, temp files — `!.env.example` negation, fixed in Phase 7, see "Phase 7 findings"; frontend/ also has its own small .gitignore for its Vercel-CLI-generated files)
```

**Vercel project link**: `.vercel/project.json` now lives at the **repository root** (`portfolio/.vercel/`), linked to the existing project `portfolio-c0d8/port-front`. The old link at `frontend/.vercel/` (from Phase 6A, when the frontend was its own standalone deployment) was **deleted** in Phase 6B — keeping it around would let someone accidentally run `vercel` from inside `frontend/` and redeploy a frontend-only build that silently drops the backend service from that deployment. All deploys now happen from the repo root.

## Backend architecture

- **Stack**: FastAPI, Uvicorn, Pydantic v2 + `pydantic-settings`, SQLAlchemy
  2.0 (declarative `Mapped`/`mapped_column` style), `psycopg` (Postgres v3
  driver), `python-dotenv`.
- **Config** (`app/core/config.py`): a single `Settings` (pydantic-settings)
  class reads `DATABASE_URL`, `ALLOWED_ORIGINS`, `ENVIRONMENT` from the
  environment / `.env`. `cors_origins` property splits the comma-separated
  `ALLOWED_ORIGINS` into a list — CORS is never wildcarded.
- **DB layer** (`app/db/`): `database.py` creates the SQLAlchemy engine +
  `SessionLocal`, exposes `get_db()` as a FastAPI dependency, and `init_db()`
  which calls `Base.metadata.create_all()`. `init_db()` runs automatically in
  `main.py`'s `lifespan` on startup — tables are created on first run, no
  manual migration step for the MVP. **Alembic is intentionally not
  introduced yet** — the brief asked to keep migration architecture in mind
  without adding complexity now; add Alembic when the schema needs a real
  migration (renaming/dropping a column) rather than an additive one.
- **Model** (`app/models/contact.py`): `Contact` — `id, name, email, company
  (nullable), project_type, message, created_at`.
- **Schemas** (`app/schemas/contact.py`): `ContactCreate` validates on the way
  in (name 2–120 chars, `EmailStr`, optional company ≤160 chars,
  `project_type` restricted to a `Literal` of the six service slugs + "other",
  message 10–4000 chars). `ContactResponse` is `{success, message}`.
- **Service layer** (`app/services/`): `contact_service.create_contact()` is
  the only place that writes to the DB; `contact_service.submit_contact()`
  (new, Phase 8) coordinates persistence + a best-effort email notification
  via `email_service.send_contact_notification()`; routes stay thin. See
  "Phase 8 findings" for the exact failure-handling contract.
- **Routes**: `GET /api/health` → `{"status": "ok"}`. `POST /api/contact` →
  validates via `ContactCreate`, persists + notifies via the service layer,
  returns `{"success": true, "message": "Your enquiry has been received."}`
  (200) on a successful save, or a 500 with a generic message if the DB
  write itself fails. The request/response contract is unchanged from
  before Phase 8 — the frontend needed no changes to keep working.
  `POST /api/chat` (new, Phase 9) → `{message, history?}` in,
  `{answer, source}` out (`source` is `knowledge`/`llm`/`fallback`); rate
  limited (see "Phase 9 findings"); never returns a non-200 for a chat
  failure — see "Phase 9 findings" for the original orchestration and
  "Phase V3.5 findings" for the current general AI + RAG flow.

## Frontend ↔ backend communication

- `frontend/src/services/api.ts` is the **only** place that calls `fetch`.
  It reads `import.meta.env.VITE_API_URL` (falls back to
  `http://localhost:8000` for local dev), wraps errors in an `ApiError`
  (network failures get `status: 0`; non-2xx responses carry the parsed JSON
  body as `details`), and exposes `api.health()` / `api.submitContact()` /
  `api.sendChatMessage()` (new, Phase 9).
- `frontend/src/components/ContactForm.tsx` (new) is the actual contact form,
  mounted inside `FinalCta.tsx` in place of the old `mailto:` button. It has
  name / email / company (optional) / project type (select, matching the six
  service slugs) / message fields, and renders idle → submitting (spinner) →
  success (confirmation panel, replaces the form) → error (inline message,
  form stays filled in) states. Styling reuses the existing premium
  typographic system (uppercase tracked labels, bottom-border inputs, no new
  visual language introduced).
- Types (`ProjectType`, `ContactPayload`, `ContactResponse`) are declared once
  in `api.ts` and shared by the form — no ad hoc shapes in components.
- `frontend/src/components/ChatWidget.tsx` (new, Phase 9) is the Studio
  Assistant — a fixed launcher button (`MessageCircle` icon, hidden while
  open to avoid overlapping the panel) that opens a panel: full-width bottom
  sheet on mobile, a fixed 400px right-side panel from `md:` up. Holds its
  own conversation state (messages, input, loading, error) entirely in
  React state — nothing is persisted, and a page refresh clears it. Calls
  `api.sendChatMessage({ message, history })` on submit or on a quick-prompt
  click, sending up to the last 10 messages as `history` for LLM context
  only (see "Phase 9 findings"). No new `VITE_*` variable was needed —
  the LLM key never reaches the frontend.

## Environment variables

- `frontend/.env.example` → `VITE_API_URL=http://localhost:8000`,
  `VITE_WHATSAPP_NUMBER=917382016152` (Phase 8 — public by design, see
  "Phase 8 findings")
- `backend/.env.example` → `DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/portfolio`,
  `ALLOWED_ORIGINS=http://localhost:5173`, `ENVIRONMENT=development`,
  `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY=`, `EMAIL_FROM=`,
  `NOTIFICATION_EMAIL=vineetp.work@gmail.com` (Phase 8 — all four
  optional; see "Phase 8 findings"), `LLM_PROVIDER=`, `LLM_API_KEY=`,
  `LLM_MODEL=` (new, Phase 9 — all three optional; see "Phase 9 findings")
- Neither `.env` file is committed; `.gitignore` at the repo root excludes
  `.env`/`.env.local` everywhere while explicitly keeping `.env.example` files.

## Verification performed this session

All of this was actually run, not just read:

1. `cd frontend && npm run build` — clean (`tsc -b` + `vite build`), both
   before and after the move, and again after adding the contact form/API
   client.
2. Backend venv created (`python -m venv .venv`), `pip install -r
   requirements.txt` succeeded.
3. `from app.main import app` import check — succeeds, 6 routes registered
   (`/api/health`, `/api/contact`, `/docs`, `/redoc`, `/openapi.json`,
   `/docs/oauth2-redirect`).
4. Backend started with `uvicorn` against a **throwaway SQLite DB**
   (`DATABASE_URL=sqlite:///./smoketest.db`) purely as a smoke-test
   substitute for Postgres, which isn't installed in this environment — the
   real config/default is Postgres via `psycopg`, this was not a design
   change.
   - `GET /api/health` → `{"status":"ok"}`
   - `POST /api/contact` with valid payload → `200`, success response, row
     persisted (verified by querying the SQLite file directly).
   - `POST /api/contact` with invalid payload (short name, bad email, bad
     `project_type`, short message) → `422` with per-field Pydantic errors.
   - CORS preflight from `http://localhost:5173` → allowed
     (`access-control-allow-origin` echoes it back).
   - CORS preflight/request from a disallowed origin
     (`http://evil.example.com`) → **no** `access-control-allow-origin`
     header returned, confirming origins are not wildcarded.
5. Ran both dev servers together (frontend on 5173, backend on 8000) and hit
   the backend with an `Origin: http://localhost:5173` header to confirm the
   exact cross-origin path the browser will take — health check and a
   contact submission both succeeded and were logged by uvicorn.
6. All smoke-test artifacts (`smoketest.db`, `e2e_smoketest.db`, log files,
   test uvicorn/vite processes) were cleaned up afterward — nothing from the
   verification runs is left in the repo.

## Design decisions carried over from Phase 1 (unchanged)

- Palette: near-black `#0a0a0a` bg, raised `#121212` for alternating
  sections, warm white `#f3f1ec` ink, single accent `#ff4d1c`.
- Typography: Archivo (display) + Inter (body) + Instrument Serif italic accent.
- No invented brand — nav/footer use the plain "STUDIO." mark.
- Framer Motion only; GSAP/Lenis still not installed, still not needed.
- Selected Work: stacked alternating rows. Services: list-and-detail
  interactive layout with mobile accordion fallback.
- Content honesty rules (no fake clients/stats/testimonials, projects
  labeled CONCEPT/EXPERIMENTAL) — unchanged and unaffected by this phase.

## Local development

**Frontend** (`http://localhost:5173`):
```bash
cd frontend
npm install
npm run dev
```

**Backend** (`http://localhost:8000`, Swagger at `/docs`):
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env    # then edit DATABASE_URL to a real Postgres instance
uvicorn app.main:app --reload --port 8000
```

The backend **requires a reachable PostgreSQL database** to actually start
in real use (table creation happens on startup) — there is no bundled local
DB. A local Postgres install or a free managed instance (e.g. Neon) is
needed to run it beyond the SQLite smoke test described above.

## Phase 2.5 findings — Playwright UI/visual QA

**Setup**: `@playwright/test` + Chromium only, installed in `frontend/`.
Config at `frontend/playwright.config.ts` (baseURL `http://localhost:5173`,
auto-starts `npm run dev` via `webServer`, screenshots/traces on failure).
Tests live in `frontend/tests/`:
- `home.spec.ts` — page load, console/page errors, nav links + scroll-to-section,
  mobile menu, hero headline/CTAs, Selected Work content, Services labels +
  interaction, Process steps, Contact form fields/interaction.
- `images.spec.ts` — every visible `<img>` has non-empty `src`, real alt text,
  and `naturalWidth > 0` (the actual "did it load" signal, not just DOM
  presence); a dedicated wide-viewport check for the 2xl-only hero fragment
  images; a check for failed/4xx image network requests.
- `responsive.spec.ts` — horizontal-overflow check at desktop (1440×900),
  tablet (1024×768), mobile (390×844); nav/CTA usability at each size;
  screenshots of hero, Selected Work, Services+Process, Contact, and mobile
  home for manual visual review (saved under `test-results/screenshots/`,
  gitignored).

Commands (run inside `frontend/`): `npm run test:ui`, `npm run test:ui:headed`.

**Root cause of the broken-image issue (highest priority per this phase's
brief)**: this sandbox's network blocks `images.unsplash.com` and
`images.pexels.com` outright (corporate proxy redirects to a block page) —
the same machine/network the site would be developed and manually tested on,
which is exactly why real screenshots showed broken images even though the
Phase 1 code looked correct. Checking actual image bytes (via an
`images.weserv.nl` proxy, and separately via the Wikimedia Commons API/CDN,
neither of which are blocked here) turned up two distinct problems:
1. One photo ID (`media.process`, not actually rendered anywhere in the UI)
   was a genuine 404 on Unsplash.
2. Several of the *other* 15 IDs were real, loadable images — but not what
   their alt text/Phase-1 description claimed, because they were picked from
   memory without ever being viewed. Concretely: the "Maison" luxury-project
   image was quirky shoe-and-fruit product photography; "Pulse" (fintech) was
   a pile of literal US dollar bills; "Atlas" was a Canon DSLR camera with
   its logo clearly visible; the mobile-capability image was an iPhone home
   screen full of recognizable app icons (Facebook/Instagram/YouTube/etc);
   "AI & Automation" was a toy humanoid robot on a bench; "Ongoing
   Development" was a crowded open-plan office with visible Apple laptop
   logos and many identifiable faces; the final-CTA image was a desk with an
   iMac showing a visible Apple logo. All of these violate the brief's "no
   third-party logos / recognizable brands" rule and several were also just
   the wrong mood entirely.

**Fix**: every image is now a local static file in `frontend/public/images/`
(16 files, ~3.1MB total after resizing to max 1600px wide / quality 78),
referenced from `frontend/src/data/media.ts` via a `local()` helper instead
of a remote Unsplash URL builder. This removes the runtime dependency on any
external image CDN entirely — better for production too (no hotlinking, no
third-party outage risk, no future 404s). Each image was individually viewed
before being kept. Sources, by file:
- **Kept from the original Unsplash picks** (verified good on inspection):
  `hero-background.jpg` (Earth's city lights at night, from orbit — a much
  better "global network" visual than the original alt text described),
  `hero-fragment-code.jpg` (developer desk with code on screen),
  `hero-fragment-staircase.jpg` / `capability-web.jpg` / `capability-ongoing.jpg`
  (same building — a striking geometric glass-and-steel structure, reused
  across 3 slots as a deliberate motif), `project-ai-workspace.jpg` (circuit
  board macro), `project-flow.jpg` (overhead triple-monitor workstation),
  `capability-applications.jpg` (code macro), `capability-design.jpg` (two
  people reviewing a UI mockup on a laptop — kept after re-review since it
  has no logos and faces are out of focus/turned away; the earlier rejection
  was a style preference, not a compliance issue), `approach-team.jpg`
  (group working on laptops, rendered with a grayscale + accent-tint overlay
  in the UI which further reduces the "generic stock photo" feel).
- **Replaced with Wikimedia Commons images** (public domain / openly
  licensed, fetched directly — Commons is not blocked here):
  `project-maison.jpg` (a genuinely elegant, symmetrical hotel lobby),
  `project-atlas.jpg` (aerial resort coastline — cropped to remove a visible
  "Holiday Inn" sign that was in the original frame),
  `capability-mobile.jpg` (hands holding a phone with a plain dark camera-app
  UI, no visible app icons), `capability-ai.jpg` (green PCB macro — cropped
  to remove a "1mm" scale-bar label baked into the original photo).
- **Reused deliberately**: `project-pulse.jpg` and `final-cta-corridor.jpg`
  both reuse other images in this set (a Shanghai-at-night satellite shot,
  and the hero's Earth-at-night shot respectively) as an intentional visual
  rhyme/bookend rather than sourcing something new for every single slot.
- `media.ts`'s `source` field now records `"Unsplash"` or `"Wikimedia Commons"`
  per image so provenance stays traceable; `credit` is left unset (not
  required for either source's typical license, but add one if a specific
  image's license requires attribution before using this commercially).

**Real UI bug found and fixed (not a test problem)**: at common laptop/desktop
widths (roughly 1024–1535px, e.g. Playwright's own default 1280×720 project
viewport), the two floating hero "fragment" images in `Hero.tsx` visually
collided with and partly obscured the giant headline text — one fragment sat
directly behind the word "Digital", the other behind "remembered." This only
looked fine at very wide desktop (≥1536px) or was invisible below `md`
(768px), i.e. it was likely never actually seen during Phase 1 review at a
single wide-desktop resolution. Fixed by moving both fragments into the top
corners (clear of the bottom-anchored headline block regardless of width) and
raising their breakpoint to `2xl` (1536px+) so they only appear once there's
genuinely enough headroom. Verified with screenshots at 1280, 1440, and 1920
wide — no overlap at any of them, and the 1920px version looks like the
originally-intended "layered interface composition."

**Test-quality issues found while writing the suite** (fixed in the tests,
not the app): Framer Motion's per-word text-reveal splits headline text
across many sibling `<span>`s with no space between block-level fragments in
`textContent`, so exact/substring text assertions on concatenated text are
fragile — fixed by asserting on each `RevealText` fragment's own `aria-label`
instead. Several `getByText`/`getByRole` locators were ambiguous (matched a
nav link *and* a footer link, or a service's list button *and* its bullet
list items) — fixed by scoping locators more precisely and adding two small
`data-testid` attributes (`mobile-menu`, `service-detail-desktop` /
`service-detail-mobile`) purely to disambiguate the desktop vs. mobile
service-detail panel, which render the same text in different DOM branches.
A scroll-position assertion used a fixed `waitForTimeout` that was sometimes
too short for the smooth-scroll to settle — replaced with `expect.poll`.

**Final result**: 25/25 Playwright tests passing (Chromium). Full report:

```
UI TEST SUMMARY
Page load:            PASS
Navigation:            PASS
Hero:                  PASS
Images:                FAIL → fixed (see above) → PASS
Selected Work:         PASS
Services:              PASS
Process:               PASS
Contact UI:            PASS
Responsive (3 sizes):  PASS
Horizontal overflow:   PASS
```

**Not covered by this pass** (intentionally, per this phase's brief): no
cross-browser matrix (Chromium only), no backend/API testing, no database
testing, no auth testing, no visual-regression *diffing* (screenshots are
for manual review, not pixel-diffed against a baseline).

## Phase 3 findings — pre-deployment verification against real Neon Postgres

**Scope**: verify the backend against the actual production database
(Neon), not a SQLite stand-in, and check production-start plumbing. No
credential value is recorded anywhere in this document, in any log file
left on disk, or printed to a terminal that persists — every check below
was done by reading booleans/shapes derived from the value, never the value
itself.

**Security / git hygiene**: there is **no git repository in this project
yet** (`git status` fails with "not a git repository" at the project root —
confirmed again this phase, unchanged since Phase 1). So there is nothing to
check with `git ls-files` / `git status`, and no risk of `backend/.env`
having been committed, because nothing has ever been committed. What *is*
true and was verified directly: `backend/.env` exists locally, the root
`.gitignore` lists `.env` (with `!.env.example` to keep the example file
committable once a repo exists), `backend/.env.example` contains only
placeholders, and neither `README.md` nor anything under `docs/` contains a
real hostname, username, or password — only the placeholder example URL.
**Before a repo is initialized and pushed anywhere, re-run this check** (`git
ls-files | grep .env` should show only `.env.example`) since that's the
point at which a real leak becomes possible.

**DATABASE_URL driver-scheme bug (found and fixed)**: the real Neon
connection string uses the bare `postgresql://` scheme (SQLAlchemy's default
driver for that scheme is `psycopg2`, which this project does not install —
it installs `psycopg` v3 via `psycopg[binary]`). Left as-is, this would have
either failed at engine-creation time or silently misbehaved depending on
what's importable. Fixed with a `field_validator` on `Settings.database_url`
in `backend/app/core/config.py` that rewrites any bare `postgres://` or
`postgresql://` prefix to `postgresql+psycopg://` at load time — so the app
now works with whatever scheme a managed Postgres provider (Neon, Render,
Heroku-style) hands out, without editing the `.env` value itself. Verified
by loading `get_settings()` and checking the resulting scheme (never the
full URL).

**Real Neon connection test**: started `uvicorn app.main:app` with the real
`backend/.env` loaded (no SQLite substitution). Startup succeeded (Neon's
TLS handshake over this network takes a few seconds but completes),
`GET /api/health` returned `{"status":"ok"}`, and `sqlalchemy.inspect(engine)`
against the live connection confirmed the actual table name and columns.

- **Table name**: `contacts`
- **Columns**: `id, name, email, company, project_type, message, created_at`
  — matching `app/models/contact.py` exactly.

**Contact insert + persistence proof**: submitted the exact example record
from this phase's brief (name "Deployment Verification", email
`deployment-test@example.com`, project_type `website`) via
`POST /api/contact` — `200`, `{"success": true, ...}`. Then, **independently
of the HTTP response**, ran a raw `SELECT` against the same engine and found
exactly one matching row with the submitted values and a real
`created_at` timestamp — proving the full
`React/API → FastAPI → SQLAlchemy → Neon PostgreSQL` path, not just that the
endpoint returned 200. Also re-verified `422` on invalid input (short name,
bad email, invalid `project_type`, short message) and that CORS still
correctly allows `http://localhost:5173` and omits the CORS header entirely
for a disallowed origin, against the real Neon-backed server.

**Cleanup**: deleted the test row via `DELETE FROM contacts WHERE email =
'deployment-test@example.com'` (1 row affected), then re-queried and
confirmed zero matching rows and zero total rows in the table — the table
was empty before this test and is empty again now; no pre-existing data
existed or was touched.

**Repeated end-to-end from the frontend's exact origin**: re-ran the insert
test with an `Origin: http://localhost:5173` header (the precise cross-origin
path a browser running the Vite dev server would take), confirmed success,
then deleted that row too and re-confirmed the table was empty.

**DB-unreachable error handling**: started the app with a deliberately
invalid `DATABASE_URL` (unreachable host). Startup fails immediately with a
full SQLAlchemy connection-error traceback in the logs and the process does
not come up — a loud, clear failure at the point of the problem, not a
silently-broken running server. This is appropriate for the MVP (per this
phase's brief: no elaborate retry logic); the one consequence worth knowing
is that on a platform like Render, a transient DB blip during deploy would
crash-loop the instance rather than retry — acceptable for now, revisit if
it becomes an actual operational problem.

**Production start config (added)**: there was no production-appropriate
start command before this phase — only the `--reload` dev command. Added
`backend/Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
Verified locally by running the equivalent command with `PORT` set
explicitly and confirming `/api/health` responds on that port with no
`--reload` flag in play.

**Python version**: local backend runs on **Python 3.12.0**. Pinned it for
deployment reproducibility by adding `backend/runtime.txt`
(`python-3.12.0`, the Heroku/Render-style convention) and `backend/.python-version`
(`3.12.0`, for pyenv and tools that read it) — both new this phase. Not an
arbitrary upgrade; it's exactly the version already in use.

**Requirements check**: `backend/requirements.txt` was re-reviewed against
actual imports — `fastapi`, `uvicorn[standard]`, `pydantic`,
`pydantic-settings`, `email-validator` (used by `EmailStr`), `sqlalchemy`,
`psycopg[binary]`, `python-dotenv`. All are runtime-required; nothing
dev-only is listed. No changes needed.

**Frontend re-verified**: `npm run build` clean; all 25 Playwright tests
still passing (they don't submit the contact form to a real backend by
design — see Phase 2.5 — so this run didn't depend on the backend being up).
`frontend/src/services/api.ts` is still the only fetch call site, still
respects `VITE_API_URL` with `http://localhost:8000` as the documented dev
fallback (the only "localhost" string anywhere in `frontend/src`).

## Phase 6A/6B findings — Vercel deployment (frontend + backend, LIVE)

**Platform decision**: both the frontend and backend are deployed as **one
Vercel project using Vercel Services** — not Render, not Docker, not
GitHub. This was chosen in Phase 5's capability check because GitLab and
Bitbucket are blocked on the dev network (so Render's only realistic path,
a Docker image push, needed Docker installed — a real prerequisite gap),
while Vercel's CLI deploys directly from a local directory with no git
involved at all, and Vercel's current Python runtime runs a FastAPI ASGI
app natively (no Mangum adapter, no Docker) via a documented feature
called **Services**, which is exactly built for "one frontend + one Python
backend in the same project, same domain."

**Phase 6A (frontend only)**: deployed first, standalone, from `frontend/`
as its own Vercel root. Login (`vercel login`, email-based auth flow —
GitHub/GitLab/Bitbucket login options are blocked on this network so Email
was used) and the initial `vercel link` were completed manually by the user,
since both require a real browser/email step no agent can perform.
Project: `portfolio-c0d8/port-front`. That standalone frontend deployment
and its `frontend/.vercel/` link were **superseded** by Phase 6B below —
see "Repository structure" for why the old link was deleted.

**Phase 6B (backend added, same project)**: added `vercel.json` at the
**repository root** defining two services:

```json
{
  "services": {
    "frontend": { "root": "frontend/" },
    "backend": { "root": "backend/", "entrypoint": "app.main:app" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

This is the exact pattern from Vercel's current `/docs/services` docs
(fetched and read this phase, not assumed from older training knowledge —
Vercel's Python/Services support has changed over time). Key facts that
shaped the config, confirmed directly from Vercel's docs:
- `entrypoint: "app.main:app"` is a `module:variable` path **relative to the
  service's `root`** — since the FastAPI `app` object lives at
  `backend/app/main.py`, that's `app.main:app`. No file moves, no code
  changes to the backend's existing structure were needed.
- A service-routing rewrite forwards the **full original request path** to
  the service, not a stripped one — Vercel's own docs example states
  `GET /api/users` reaches the backend service "as `/api/users`, not
  `/users`." This means the backend's existing routers (mounted at
  `prefix="/api"` in `main.py`) work completely unchanged — `/api/health`
  and `/api/contact` did not need renaming or a prefix change.
- FastAPI **lifespan events are supported** on Vercel (this is called out
  as a specific, relatively recent capability in Vercel's changelog), so
  `init_db()` running in `main.py`'s lifespan hook — which creates the
  `contacts` table on cold start — works without modification.
- No Mangum or other ASGI-to-WSGI adapter is needed; Vercel's Python
  runtime runs the ASGI app directly as a Vercel Function.

**Relinking (required, not optional)**: Services requires `vercel.json` to
live at the directory you deploy from, so the project had to be **relinked
from the repository root** (`vercel link --yes --project port-front` run
from `portfolio/`, not from `frontend/`) — same existing project, new
effective deploy root. The stale `frontend/.vercel/` link was deleted
afterward (see "Repository structure").

**Real bug found and fixed during first deploy attempt**: the initial
preview deploy failed during the backend build step with `error: No
interpreter found for Python 3.12.0 in managed installations or search
path`. Cause: `backend/.python-version` was pinned to the exact patch
version `3.12.0`, but Vercel's managed Python interpreters are only
available at minor-version granularity (3.12 / 3.13 / 3.14 per their docs).
Fixed by changing `.python-version` to `3.12` (no patch suffix). This is a
one-line, Vercel-compatibility-only fix — the locally-installed Python is
still 3.12.0, unchanged, and `backend/runtime.txt` (the Heroku/Render-style
pin, unused by Vercel) was intentionally left as `python-3.12.0` since that
convention does support patch versions.

**Same-origin API routing (frontend change, config only — no app code
touched)**: because the frontend and backend now share one Vercel domain,
`VITE_API_URL` was set to an **empty string** for both the Production and
Preview environments (`vercel env add VITE_API_URL production --value ""
--yes`, and the same for `preview`). `frontend/src/services/api.ts` builds
requests as `` `${API_URL}${path}` `` where `path` already includes the
leading `/api/...` — with `API_URL` empty, this resolves to a same-origin
relative request (`/api/health`, `/api/contact`), which browsers resolve
against the exact domain they're already on, in both production and every
preview deployment, with zero code changes. Verified directly: downloaded
the built, deployed JS bundle and confirmed **zero occurrences** of
`localhost` and confirmed the literal strings `api/health` / `api/contact`
are present. The local dev fallback (`http://localhost:8000` when
`VITE_API_URL` is unset) in `api.ts` was **not touched** — local
`npm run dev` + local backend still works exactly as before.

**Environment variables actually configured in Vercel** (names only — see
"Security" below for why no values appear anywhere in this document):
- `DATABASE_URL` — Production **and** Preview. Set to the **pooled** Neon
  connection string (the `DATABASE_URL_POOLED` value already present in
  `backend/.env`, which Neon provides specifically for exactly this
  scenario — many short-lived serverless function invocations, which do
  not play well with Postgres's per-connection resource cost the way a
  long-running server does). This is a values-only choice made when
  filling in the Vercel env var; `backend/app/core/config.py` still just
  reads whatever string is in `DATABASE_URL` and normalizes its scheme —
  no code change was needed to prefer the pooled URL.
- `ALLOWED_ORIGINS` — Production only, set to the real production URL
  (`https://port-front-lake.vercel.app`). In practice this is now largely
  moot for the working contact-form flow, because frontend→backend calls
  are same-origin and same-origin requests don't trigger CORS at all — it's
  kept configured anyway as a deliberate, non-wildcard value for any direct
  API testing (e.g. hitting `/docs`'s Swagger UI from a different origin)
  rather than leaving it unset/defaulted.
- `ENVIRONMENT` — Production only, set to `production`. Purely descriptive;
  grepped the codebase and confirmed `settings.environment` is not read
  anywhere in application logic, so this has no behavioral effect — set for
  documentation accuracy only.
- `VITE_API_URL` — Production **and** Preview, both empty strings (same-origin, see above).

**Deployment verification actually performed** (both Preview and
Production, not just one):
- Preview URL: protected by Vercel's standard Deployment Protection for
  team projects (a plain `curl` gets a `302` redirect to an auth wall —
  expected platform behavior, not a bug). Verified instead with
  `vercel curl`, which auto-generates and uses a short-lived, project-scoped
  protection-bypass token — not a user credential, and not printed here.
  `GET /api/health` → `{"status":"ok"}`.
  `POST /api/contact` with a test payload → `200`, success response.
  **Independently queried Neon directly** (not trusting the HTTP response)
  and found the row (`id=3`, matching values, real timestamp) — proving
  the full path through the Preview deployment. Deleted the row, re-queried,
  confirmed the table was empty again.
- Production URL (`https://port-front-lake.vercel.app`, publicly reachable,
  no protection wall): `GET /api/health` → `{"status":"ok"}` via plain
  `curl`. `POST /api/contact` with the brief's exact example payload → `200`.
  **Independently queried Neon directly** again and found the row (`id=4`,
  matching values, real timestamp). Deleted it, re-queried, confirmed the
  table was empty again. Also re-verified `422` on invalid input against
  the live production URL (short name / bad email / bad `project_type` /
  short message all correctly rejected with per-field errors).
  Also confirmed a real static asset (`/images/hero-background.jpg`) serves
  `200 image/jpeg` through the frontend service's routing.

**Playwright**: re-ran the full local suite (`npm run test:ui`, 25 tests)
both before touching `vercel.json`/`.python-version` and is unaffected by
anything in this phase — the suite runs against the local dev server
(`http://localhost:5173`, per `playwright.config.ts`'s `webServer`), never
against the production Neon database, and never submits the real contact
form (by design, since Phase 2.5 — see that section). All 25 passed.
(Note: two runs this session showed transient timeout flakes under heavy
parallel load on this machine — confirmed as environment contention, not
regressions, by rerunning the same specs in isolation and by rerunning the
full suite at reduced worker concurrency, both 25/25 clean. Not a code
issue; noted here in case it recurs.)

**Security checks performed this phase**: no `.env` committed (still no git
repo at all — see "Pending" below); `backend/.env` and the newly-created
`.env.local` (auto-generated by `vercel link` at the repo root, containing a
`VERCEL_OIDC_TOKEN`) are both covered by the root `.gitignore`; `.vercel/`
directories are gitignored; no `DATABASE_URL` or connection string appears
anywhere in source, `vercel.json`, or this document; every secret value was
piped directly into `vercel env add` via stdin from a small Python helper
(never passed as a CLI argument, never echoed to a terminal); `vercel env
ls` was used to confirm variable **names** and target environments only —
its own output shows values as `Hidden` for secrets by design.

**What "future updates" looks like now** (per this phase's explicit
requirement): the whole point of Services is that a future code change —
frontend or backend — redeploys through the exact same one-command
workflow, from the repo root:
```bash
cd frontend && npm run build && npm run test:ui   # verify first
cd ..
vercel                # preview
vercel --prod         # production, only after preview looks right
```
No separate server to rebuild, no Docker image to push, no Render dashboard
to touch. Both services rebuild together as one deployment.

## Phase 7 findings — local Git

**Initialized**: `git init` at the repository root (`portfolio/`). No commits
existed before this phase — confirmed at the start of Phases 3, 6A, and 6B
that `git status` failed with "not a git repository," and that was still
true at the start of this phase too.

**Real bug found and fixed**: the root `.gitignore` had a pattern-ordering
bug. It contained, in this order: `.env` / `.env.local` / `!.env.example`
(a negation, meant to un-ignore the example file) — then, much further down
the same file, a second, broader `.env*` line left over from an earlier
phase. Because gitignore resolves each path by its **last** matching
pattern in the file, that later broad `.env*` re-ignored `.env.example`
despite the negation above it. Verified with `git check-ignore -v` before
fixing: `backend/.env.example` resolved to `IGNORED` (wrong — it must be
trackable). A second, separate `frontend/.gitignore` (auto-generated by
`vercel link` back in Phase 6A) had the same `.env*` pattern with **no**
negation at all, so it was ignoring `frontend/.env.example` unconditionally.

Fixed both files: consolidated the root `.gitignore` into one clearly-ordered
`.env` / `.env.*` / `!.env.example` block with a comment explaining *why*
the negation must stay last, and added the missing `!.env.example` to
`frontend/.gitignore`. Re-verified with `git check-ignore -v` against every
sensitive and every required-trackable path (see table below) before
staging anything.

| Path                          | Must be                | Verified as    |
|--------------------------------|------------------------|-----------------|
| `backend/.env`                 | ignored                 | ✅ ignored       |
| `backend/.env.example`         | **trackable**            | ✅ trackable (bug fixed here) |
| `frontend/.env.local`          | ignored                 | ✅ ignored       |
| `frontend/.env.example`        | **trackable**            | ✅ trackable (bug fixed here) |
| `.env.local` (repo root, the `vercel link` OIDC-token file) | ignored | ✅ ignored |
| `.vercel/project.json`         | ignored                 | ✅ ignored       |
| `backend/.venv/pyvenv.cfg`     | ignored                 | ✅ ignored       |
| `backend/app/__pycache__/*.pyc`| ignored                 | ✅ ignored       |
| `frontend/node_modules/*`      | ignored                 | ✅ ignored       |
| `frontend/dist/*`               | ignored                 | ✅ ignored       |
| `frontend/test-results/*`      | ignored                 | ✅ ignored       |

**Staging discipline**: never ran a blind `git add`. Sequence was: fix and
re-verify `.gitignore` → `git status` (review untracked list) →
`git add -A --dry-run` (see the exact file list `add` would produce, without
staging anything) → scanned every one of those 82 candidate files' actual
content for secret-shaped patterns (Neon hostnames, `neondb_owner`, API-key
prefixes, PEM private-key headers — zero matches) → only then `git add -A`
→ `git status` again to confirm the staged list matched the reviewed list
exactly → `git diff --cached --stat` (82 files, 5720 insertions, 0
deletions, as expected for a root commit) → directly inspected the staged
*content* of both `.env.example` files with `git show :path` (not just their
filenames) to confirm placeholders only, right before committing.

**What's tracked**: all frontend source (`frontend/src/`, `frontend/tests/`,
config files, the 16 local images in `frontend/public/images/`), all backend
source (`backend/app/`), both `.env.example` files, `docs/`, `README.md`,
both `.gitignore` files, `vercel.json`, and the Render-fallback files
(`Procfile`, `runtime.txt`, `.python-version`). **What's excluded**:
`backend/.env` (the real Neon credentials), `.env.local` (the Vercel OIDC
token), `.vercel/` (project link + auth), `backend/.venv/`, `__pycache__/`,
`node_modules/`, `dist/`, Playwright's `test-results/`/`playwright-report/`.

**Commit**: `git commit -m "chore: production release checkpoint"` →
`97109e1b36a016dced56dbb4035fcae4204ac1df` (root commit, no parent). Author
identity was auto-detected by git from the local machine (name/email) since
no global git config existed — not something this session invented; harmless
and expected for a first local commit, but worth setting explicitly
(`git config --global user.name` / `user.email`) if that default isn't
correct before any future push.

**Post-commit verification**: `git ls-files | grep -iE
".env$|.env.local|.vercel|.venv|__pycache__|node_modules|/dist/"` returned
zero matches against the actual committed tree (not just the pre-commit
staging area) — confirming nothing sensitive made it into the commit.

**Not done, deliberately**: no remote was added, nothing was pushed
anywhere (no GitHub, no GitLab, no Bitbucket) — this commit exists only in
the local `.git` directory on this machine, exactly as this phase's brief
required.

## Phase 8 findings — contact notifications + direct WhatsApp CTA

**Scope discipline**: no visual redesign, no AI chatbot, no "Work With
Us"/freelancer feature, no database architecture change, no Docker/Render/
queues/Redis, no WhatsApp Business API or backend WhatsApp service. Exactly
three things changed: contact → database (unchanged, still the primary
operation), contact → best-effort email notification (new), contact area →
direct WhatsApp link (new, frontend-only).

**Email notification — architecture**: `backend/app/services/email_service.py`
(new) is the only place that calls the Resend HTTP API
(`POST https://api.resend.com/emails`, via `httpx`, no SDK dependency
needed). It is intentionally isolated from `contact_service.py` and the
route so the provider could change later without touching the `POST
/api/contact` request/response contract. `contact_service.submit_contact()`
(new) is the coordinator: it calls the existing `create_contact()` (DB
write, unchanged) first, then calls `send_contact_notification()` inside a
`try/except Exception` that only logs — nothing about the email path can
affect the already-committed DB row or the HTTP response. The route
(`app/api/routes/contact.py`) now only distinguishes one failure mode: a
`ContactPersistenceError` (raised by `create_contact()` on a SQLAlchemy
error, with rollback) becomes a `500` with a generic
`"Could not save your enquiry. Please try again."` message — no stack
trace, no DB details leak into the response. Every other path — including
every email failure — returns the normal `200`
`{"success": true, "message": "Your enquiry has been received."}`.

**Email notification — configuration-gated, fails soft**: `email_service.
send_contact_notification()` checks `EMAIL_PROVIDER`, `EMAIL_API_KEY`,
`EMAIL_FROM`, and `NOTIFICATION_EMAIL` are all set (and that
`EMAIL_PROVIDER == "resend"`, the only supported value right now) before
attempting anything; if any is missing it logs a warning and returns
`False` without an HTTP call. A Resend request failure (network error,
non-2xx status) is caught (`httpx.HTTPError`), logged via `logger.
exception(...)` (never logs the API key or the raw response body), and
also returns `False`. The function **never raises** — the defensive
`try/except` in `contact_service.submit_contact()` is a second layer on
top of that, not the only one.

**Email content**: subject `"New project enquiry"`; plain-text body with
`Submission ID / Name / Email / Company / Project type / Message /
Submitted at` in that order (`Company` shows `—` when not provided,
matching the existing optional-field convention). No stack traces, DB
details, environment variable names, or API keys are ever included in the
email body.

**Backend tests — new, `backend/tests/`** (didn't exist before this phase):
`pytest` + FastAPI's `TestClient`, run against an isolated temp-file SQLite
database (`tests/conftest.py` sets `DATABASE_URL` to a fresh
`tempfile.mkstemp()`-created file **before** any `app.*` module is
imported, since `app/db/database.py` builds its SQLAlchemy engine from
`Settings` at import time — the real `backend/.env`/Neon database is never
touched by the test suite). `email_service.httpx.post` is monkeypatched in
individual tests rather than making real Resend calls. 7 tests, all
passing:
```
test_valid_contact_submission_succeeds                          PASS
test_invalid_email_is_rejected                                  PASS
test_valid_submission_is_persisted_to_the_database               PASS
test_email_provider_configured_notification_is_attempted         PASS
test_email_provider_unavailable_does_not_lose_the_enquiry         PASS
test_email_provider_not_configured_submission_still_succeeds      PASS
test_notification_failure_does_not_cause_data_loss                PASS
```
Run with `pytest` from `backend/` (venv activated) — `backend/pytest.ini`
sets `pythonpath = .` so the `app` package resolves regardless of cwd.
`get_settings()` is `lru_cache`d, so `conftest.py` clears that cache in an
autouse fixture before/after every test so per-test `monkeypatch.setenv()`
calls for `EMAIL_PROVIDER`/`EMAIL_API_KEY`/etc. actually take effect. Also
added `httpx==0.28.1` (email calls + required by `TestClient`) and
`pytest==8.3.4` to `backend/requirements.txt`.

**Direct WhatsApp CTA — frontend only, no backend involvement at all**:
`frontend/src/data/contact.ts` (new) exports `whatsappUrl`, built as
`https://wa.me/${VITE_WHATSAPP_NUMBER}` with `917382016152` as the
hardcoded fallback if the env var is ever unset — the number is public by
design (identical to what a plain `wa.me` link already exposes), so this
is the one intentional exception to "no hardcoded config" in this phase.
`frontend/src/components/WhatsAppCta.tsx` (new) renders the brief's exact
copy — "Liked the work? Let's talk." / "Prefer WhatsApp? Connect with us
directly." / a "Chat on WhatsApp →" link — styled with the existing
typographic system (uppercase tracked button, no new visual language).
Mounted inside `FinalCta.tsx`, directly below the existing `ContactForm`,
inside the same section (`#contact`) — additive, not a redesign; the
existing "Have something worth building?" headline and contact form are
completely unchanged. The link is a plain `<a href="https://wa.me/...">`
with `target="_blank" rel="noopener noreferrer"` — no JS, no API key, no
click handler.

**Playwright**: added a new `"Direct WhatsApp CTA"` describe block to
`frontend/tests/home.spec.ts` that asserts both copy lines are visible and
that the link's `href` is exactly `https://wa.me/917382016152` (plus
`target`/`rel`) — it never clicks the link, so no real WhatsApp navigation
happens during the test run. All 26 tests (25 existing + 1 new) pass at
reduced worker concurrency (`--workers=2`); one image test flaked under the
default 4-worker run and passed cleanly both in isolation and in the full
suite at `--workers=2` — this is the same transient-under-load flake
already documented in "Phase 6B findings," not a regression from this
phase's changes.

**Environment variables — what was actually configured in Vercel** (names
only, values never appear here): `VITE_WHATSAPP_NUMBER` (Production **and**
Preview, `917382016152` — public, safe to store as plain Config) and
`EMAIL_PROVIDER` / `NOTIFICATION_EMAIL` (Production only, `resend` /
`vineetp.work@gmail.com`) were added via `vercel env add`, piped through
stdin exactly as Phase 6B's convention — never passed as a CLI argument.
**`EMAIL_API_KEY` and `EMAIL_FROM` were deliberately NOT added** — no real
Resend API key or verified sender domain exists yet (see "Pending" below).
The app was verified to run correctly with these two unset — see
"Deployment verification" below.

**Deployment verification actually performed**: `npm run build` (clean),
backend `pytest` (7/7), Playwright (26/26 at `--workers=2`), then a local
`uvicorn` run against the **real** `backend/.env`/Neon database (not a
SQLite stand-in) confirming `GET /api/health` → `200` and a
deliberately-invalid contact payload → `422`, before deploying — matching
this phase's "verify local FastAPI startup" requirement. Then `vercel`
(preview) → `vercel curl .../api/health` → `200`; `vercel --prod` →
aliased to `https://port-front-lake.vercel.app`. Against the live
production URL: `GET /api/health` → `200`; `POST /api/contact` with a
throwaway test payload (`phase8-deploy-test@example.com`) → `200`,
`{"success":true,...}`. **Independently queried Neon directly** (not
trusting the HTTP response) and found the row (`id=6`, matching values,
real `created_at` timestamp) — proving the full
`Browser → Vercel frontend → /api/contact → FastAPI → Neon` path still
works with the new coordinator function in place. Deleted the test row via
the same script, re-queried, confirmed zero matching rows. Also fetched the
deployed JS bundle directly and confirmed the literal string
`wa.me/917382016152` is present in the built output, proving
`VITE_WHATSAPP_NUMBER` reached the frontend build correctly.
**Email delivery was not tested** — `EMAIL_API_KEY`/`EMAIL_FROM` are unset
in production by design (see above), so this phase does not claim a
notification email was actually sent or received; that check is deferred
until a real Resend key and verified sender exist.

**Security checks performed this phase**: `backend/.env` (now containing
`EMAIL_PROVIDER=resend` plus empty `EMAIL_API_KEY=`/`EMAIL_FROM=` and the
real `NOTIFICATION_EMAIL`) is still covered by the root `.gitignore`
(re-verified with `git check-ignore -v`); the four new lines were appended
to it directly, without ever reading/printing the file's existing
`DATABASE_URL` value in this session. `backend/.env.example` and
`frontend/.env.example` contain placeholders only (`EMAIL_API_KEY=` and
`EMAIL_FROM=` empty; `NOTIFICATION_EMAIL`/`VITE_WHATSAPP_NUMBER` filled in
since neither is a secret). Grepped all changed source and docs for
secret-shaped patterns (API-key prefixes, `postgresql://user:pass@`
connection strings) — zero matches. No API key or DATABASE_URL value is
logged anywhere in `email_service.py` or `contact_service.py` — only
`contact.id` and (on failure) the exception via `logger.exception`, never
response bodies or request payloads to Resend.

**Not done, deliberately** (see "Pending" below for the exact next step):
no real Resend API key was invented; `EMAIL_API_KEY` and `EMAIL_FROM`
remain unset in both `backend/.env` and Vercel Production; no email was
actually sent or verified as delivered.

## Phase 9 findings — Studio Assistant chatbot

**Scope discipline**: no visual redesign, no changes to the contact flow
beyond adding a new, separate `/api/chat` route, no "Work With Us"/
freelancer feature, no database architecture change (nothing chat-related
is written to Postgres), no Docker/Render/queues/Redis/microservices, no
vector database (no pgvector, Pinecone, Weaviate, Milvus, Elasticsearch).

**Chat UI**: `frontend/src/components/ChatWidget.tsx` (new). Closed state
is a small floating circular launcher (`MessageCircle` icon, fixed
bottom-right). Open state is a panel: a full-width bottom sheet on mobile
(`fixed inset-x-0 bottom-0 h-[80vh]`), switching to a fixed 400px
right-side panel from the `md:` breakpoint up — both built from the
existing typographic system (uppercase tracked header, bordered inputs, no
new visual language). The launcher is **hidden while the panel is open**
(fixed to the exact same bottom-right corner as the panel, so keeping both
mounted caused the launcher to visually sit on top of and intercept clicks
on the panel's send button — found via a genuinely failing Playwright test,
not by inspection; fixed by conditionally rendering the launcher only when
closed). Panel includes: the greeting text, four quick-prompt chips (shown
only before the first message), an auto-scrolling message list, a loading
indicator (`Thinking…` + spinner) while a request is in flight, an inline
error message on request failure, a "Clear conversation" button (resets to
the quick-prompt state), and a close button in the header. Conversation
state (`messages`, `input`, `isLoading`, `error`) lives entirely in
component `useState` — nothing persists across a page reload, matching the
brief's V1 conversation-memory scope.

**Chat API — `POST /api/chat`**: `backend/app/api/routes/chat.py`. Request
`{"message": "...", "history"?: [{"role": "user"|"assistant", "content": "..."}]}`
(history optional, capped at 20 messages by the schema, only the last 6 are
actually sent to an LLM — see below). Response
`{"answer": "...", "source": "knowledge" | "llm" | "fallback"}`. The route
itself wraps `chat_service.answer_question()` in a bare `try/except` that
converts *any* unexpected exception into the same safe fallback response
rather than a 500 — a chat failure must never surface as a broken request,
per the brief's error-handling requirement. Wired into `main.py` exactly
like the existing `health`/`contact` routers (`prefix="/api"`); the
frontend's same-origin `/api/...` architecture from Phase 6B needed no
changes.

**Knowledge base — `backend/app/knowledge/`** (new): seven curated
markdown files — `services.md`, `about.md`, `capabilities.md`,
`process.md`, `work.md`, `faq.md`, `contact.md` — written from
`docs/goal.md`'s positioning/services/process and the actual frontend data
files (`services.ts`, `process.ts`, `projects.ts`, `Approach.tsx`,
`Footer.tsx`), not invented. Every concept/experimental project in
`work.md` keeps its exact CONCEPT/EXPERIMENTAL label from `projects.ts`.
No clients, revenue, statistics, testimonials, awards, locations,
guarantees, named team members, or pricing appear anywhere — `about.md`
and `faq.md` explicitly state these don't exist yet rather than staying
silent (e.g. "we don't publish client lists... because none of that exists
yet", "there isn't a public application process for joining the specialist
network yet"), so the chatbot has an honest, grounded answer to give
instead of retrieving nothing and guessing. `faq.md`'s "Can I work with
your team?" entry deliberately does **not** promise a freelancer
application flow, since that feature doesn't exist yet (out of scope for
this phase and the next, per the brief).

**Retrieval — `backend/app/services/knowledge_service.py`** (new,
suggested-path match): no vector database. Markdown files are parsed into
sections at `##`/`###` headings (each section = title + body), loaded once
via `functools.lru_cache`. `retrieve(question)` tokenizes the question and
each section (lowercased, alphanumeric words, a small stopword list
filtered out) and scores every section as
`0.4 × (query-word recall in the section body) + 0.6 × (title Jaccard overlap)`
— title match is weighted higher than body overlap so a section whose
heading closely matches the question (e.g. the question *is* essentially
the heading, like the "How can I start a project?" FAQ entry) reliably
outranks a section that merely mentions the same single word once in an
unrelated body. Sections scoring below `0.12` are dropped; an empty result
means "no useful studio knowledge exists" for that question, which is
exactly the signal `chat_service` uses to decide whether to try the LLM.
Verified interactively against all four quick prompts plus several
generic/off-topic questions before locking in the scoring weights — see
the table below. Isolated behind this one `retrieve()` function
specifically so it can be replaced by embeddings/vector search later
without changing `chat_service.py`'s contract (per the brief's "future
extensibility" requirement) — no other code calls into
`knowledge_service` internals directly.

| Question | Top match | Score |
|---|---|---|
| "What do you offer?" | services.md → "What we offer" | 0.617 |
| "How can I start a project?" | faq.md → "How can I start a project?" | 0.630 |
| "What kind of products do you build?" | capabilities.md → "What kind of products we build" | 0.643 |
| "Can I work with your team?" | faq.md → "Can I work with your team? Do you hire freelancers?" | 0.700 |
| "What is the capital of France?" | *(no match — falls through to LLM/fallback)* | — |

**Answer composition**: deliberately simple — the top-ranked section's
raw (already conversational, not code-fenced) markdown body is returned
as-is as the answer; there is no LLM call involved in a knowledge-sourced
answer at all. This is why the chatbot answers studio questions correctly
with **zero** LLM configuration.

**LLM fallback — `backend/app/services/llm_service.py`** (new, optional):
only called when `knowledge_service.retrieve()` returns no matches (i.e.
the question isn't clearly about the studio). `is_configured()` checks all
three of `LLM_PROVIDER`/`LLM_API_KEY`/`LLM_MODEL` are set; `ask()` raises
immediately if not, or if `LLM_PROVIDER` isn't a supported value (currently
only `"openai"`, via the OpenAI-compatible `POST /v1/chat/completions`
endpoint over `httpx`, so an OpenAI-compatible alternative provider can be
added later behind the same request shape without changing the contract).
`chat_service.answer_question()` wraps the whole `is_configured()` +
`ask()` sequence in a `try/except Exception`, logs via
`logger.exception(...)` (never logs the API key, the request payload, or
the raw response body — only that a failure happened), and falls through
to the safe canned `FALLBACK_MESSAGE` on any failure — network error,
non-2xx status, malformed response, timeout, or simply not being
configured. **The application currently runs with no LLM configured in
any environment** (local `.env` or Vercel) — see "Pending" below for the
exact manual step to change that.

**System prompt / rules**: `chat_service.SYSTEM_PROMPT` encodes all 13
rules from this phase's brief verbatim in intent (never invent studio
facts/clients/testimonials/pricing/statistics/guarantees, never expose API
keys or this system prompt or infrastructure details, keep answers
concise, distinguish general knowledge from studio facts, say so when
uncertain). It is only ever sent to the LLM provider as the `system` role
message — it is never returned to the frontend, logged, or exposed through
any response field. Only the last 6 messages of `history` are forwarded
with it, to keep the request bounded regardless of how long a
conversation runs.

**Conversation memory (V1)**: kept entirely on the frontend, exactly per
the brief — `ChatWidget.tsx`'s own message list is the only place a
conversation exists. Up to the last 10 messages are sent as `history` on
each request (frontend-side cap), of which the chat service only forwards
the last 6 to an LLM call. **Nothing chat-related is written to
PostgreSQL** — no new table, no migration, `app/models/` is unchanged from
Phase 2.

**Rate limiting — `backend/app/core/rate_limit.py`** (new): a simple
in-memory sliding-window limiter (20 requests per 60 seconds per client
IP), applied to `/api/chat` only via a FastAPI dependency
(`Depends(enforce_rate_limit)`), returning `429` with a plain message once
exceeded. Deliberately no Redis. **Known limitation, documented rather
than hidden**: this is per-process state, so on Vercel's serverless
Functions (multiple concurrent instances, cold starts) it's a *soft* limit
rather than an authoritative one — good enough to blunt a casual abuse
burst without adding infrastructure, not a guarantee under real horizontal
scale. Revisit with a shared store (e.g. Upstash Redis) if that ever
becomes a real problem. Verified a 5-request burst against the live
production endpoint completes with `200` every time (nowhere near the
20/window limit), confirming legitimate users aren't throttled.

**Backend tests — `backend/tests/test_chat.py`** (new), 6 tests, all
mocking `app.services.llm_service.httpx.post` rather than calling a real
LLM provider, run against the same isolated SQLite setup as the contact
tests (chat doesn't touch the DB at all, but shares the test app/client
fixture):
```
test_valid_chat_request_returns_an_answer                  PASS
test_studio_question_is_answered_from_knowledge             PASS
test_generic_question_without_llm_returns_the_safe_fallback  PASS
test_missing_llm_configuration_is_handled_gracefully         PASS
test_mocked_llm_success_returns_an_llm_answer                PASS
test_mocked_llm_failure_falls_back_gracefully                 PASS
```
Combined with the 7 existing contact tests: **13/13 passing**. `conftest.py`
now also clears `LLM_PROVIDER`/`LLM_API_KEY`/`LLM_MODEL` (alongside the
existing `EMAIL_*` vars) before each test so per-test `monkeypatch.setenv()`
calls take effect against a clean `get_settings()` cache.

**Playwright — `frontend/tests/chat.spec.ts`** (new), 8 tests, all
mocking `/api/chat` via `page.route()` — no real LLM or backend chat call
is ever made during a UI test run:
```
launcher is visible on load                                          PASS
opens the panel and shows the greeting and quick prompts              PASS
input accepts text                                                    PASS
sending a message shows a loading state, then renders the response    PASS
quick prompt buttons send their message and render the response       PASS
close button hides the panel                                          PASS
clear conversation resets the chat back to quick prompts               PASS
mobile layout: launcher and panel fit within the viewport              PASS
```
Combined with the existing 26: **34/34 passing** at `--workers=2`. One
locator bug was found and fixed while writing these:
`page.getByLabel("Message")` substring-matched **both** the message input
(`aria-label="Message"`) and the send button (`aria-label="Send message"`,
which contains "Message" as a substring) — fixed by switching to
`page.getByRole("textbox", { name: "Message" })`, which is unambiguous
because the button's role is `button`, not `textbox`.

**Deployment verification actually performed**: `npm run build` (clean),
backend `pytest` (13/13), Playwright (34/34 at `--workers=2`), then a
local `uvicorn` run against the **real** `backend/.env`/Neon database
confirming `GET /api/health` → `200`, `POST /api/chat` with a
studio-specific question → `200` with `source: "knowledge"` (no LLM
configured locally either), and a deliberately-invalid contact payload →
`422` — all before deploying. Then `vercel` (preview, build succeeded) →
`vercel --prod` → aliased to `https://port-front-lake.vercel.app`. Against
the **live production URL**, with no `LLM_*` variables set in Vercel at
all: `GET /api/health` → `200`; `POST /api/chat` with "What do you offer?"
→ `200`, `source: "knowledge"`, the correct services answer; `POST
/api/chat` with an off-topic question ("What is the capital of France?")
→ `200`, `source: "fallback"`, the exact safe fallback message (proving
the app doesn't crash or 500 with no LLM configured); `POST /api/chat`
with "How can I start a project?" → `200`, `source: "knowledge"`, the
correct FAQ answer. `POST /api/contact` with a throwaway test payload
(`phase9-deploy-test@example.com`) → `200`, `{"success":true,...}`, and a
deliberately-invalid payload → `422` — **contact flow confirmed unaffected
by this phase**. **Independently queried Neon directly** and found the
test contact row (`id=7`, matching values, real `created_at` timestamp),
then deleted it and re-confirmed zero matching rows. Also fetched the
deployed JS bundle directly and confirmed the literal strings
`"Studio Assistant"`, `chat-launcher`, `"What do you offer"`, and (from
Phase 8) `wa.me/917382016152` are all present — proving the chatbot UI and
the earlier WhatsApp CTA both shipped correctly in the same build. A
5-request burst against the live `/api/chat` endpoint returned `200` every
time, confirming the rate limiter doesn't throttle normal usage.

**Security checks performed this phase**: no `LLM_API_KEY` (or any other
secret) is ever sent to the frontend — `VITE_*` variables are unchanged
from Phase 8 (`VITE_API_URL`, `VITE_WHATSAPP_NUMBER` only); grepped
`frontend/src` and confirmed no `VITE_LLM_*` or any LLM-related string
exists there at all. `backend/.env` (now containing empty
`LLM_PROVIDER=`/`LLM_API_KEY=`/`LLM_MODEL=`) is still covered by the root
`.gitignore` (re-verified with `git check-ignore -v`); the three new lines
were appended to it directly without reading/printing its existing
`DATABASE_URL` value in this session. `backend/.env.example` and
`frontend/.env.example` contain placeholders only. No `LLM_*` environment
variable was added to Vercel at all (none exist there — see above), so
there is currently no LLM secret to leak from production. Grepped all
changed source and docs for secret-shaped patterns — zero matches beyond
this document's own descriptions of the checks themselves.

**Not done, deliberately** (see "Pending" below for the exact next step):
no real LLM API key was invented or configured anywhere (local `.env` or
Vercel); the LLM fallback path is implemented and tested (mocked) but has
never been exercised against a real provider in this session.

## Phase V2 findings — creative work-first redesign

**What this phase was**: a full visual redesign of the frontend only — no
backend changes, no deployment, no new environment variables. The brief was
explicit that this should feel like "a creative studio that happens to
build websites and apps," not another dark, minimal agency template — so
the entire visual system (palette, typography treatment, hero concept,
work presentation, section order) changed, while every piece of backend
functionality (contact API, chat API, database) was left completely
untouched and still passes its own test suite unmodified.

**Business content locked down**: the studio now sells exactly three
services — **Websites** (including web applications and AI-integrated
experiences), **Mobile Apps**, and **UI/UX Design** — replacing the old
six-category "Services" list. No packages, pricing, or tiers are shown
anywhere (enforced by a Playwright assertion, see "Testing" below). The
old six-role "Studio Approach" section was removed entirely; the "dedicated
team" positioning now appears as a single line in the How We Work section
("A dedicated team takes your idea from concept to launch.") — no mention
of the internal specialist/freelancer structure anywhere, per the brief.

**New visual system (`frontend/src/index.css`)**: replaced the V1 dark
near-black theme with a warm cream/paper base and a curated three-accent
palette — cobalt (`--color-accent`, `#2438e0`) as the primary accent,
coral (`--color-coral`, `#ff5a36`) and lime (`--color-lime`, `#cdfb5e`) as
secondary pops reserved for specific moments (service cards, tags), not
used everywhere. `color-scheme` flipped from `dark` to `light` (both in
`index.css` and `index.html`'s meta tag). Because every existing component
already used semantic Tailwind v4 theme tokens (`bg-bg`, `text-ink`,
`border-border`, `bg-accent`, etc.) rather than hardcoded colors, **redefining
the token *values* in one place automatically re-themed the entire site**
— `ContactForm.tsx` and `ChatWidget.tsx` needed **zero code changes** to
pick up the new palette; the "bg-ink text-bg" inverted-button pattern used
throughout (nav CTA, hero CTA, form submit) also kept working correctly
purely because the token semantics (ink = foreground, bg = page background)
stayed consistent even though their actual color values flipped from
light-on-dark to dark-on-light. Typography kept the existing font stack
(Archivo display / Inter body / Instrument Serif italic accent) rather than
sourcing new fonts — a deliberate scope-and-risk tradeoff — but leans much
harder into dramatic scale contrast and the serif-italic accent-color
treatment (e.g. the hero's "*apps.*" in cobalt italic serif, "*We design
and build it.*" in the contact section).

**Hero — full rebuild (`frontend/src/sections/Hero.tsx`)**: replaced the
old "background photo + bottom-anchored text" layout with an immersive
collage of six of the studio's own work images (`media.hero.gallery`,
reusing the same curated local files as the Work/Services sections — the
hero *is* a preview of the work beneath it, not a separate stock photo)
arranged as tilted, layered polaroid-style tiles across the viewport, each
with an independent scroll-parallax speed (`useTransform` against
`scrollYProgress`, four distinct speed tiers) so the collage visibly shifts
and separates as the visitor scrolls. Bold centered typography sits above
the collage: "We make **websites and *apps.***" as the primary message
(exactly per the brief), "Have an idea? We design and build it — start to
finish, by one dedicated team." as the secondary line, with the "Let's
Quick Connect" (→ WhatsApp) and "See our work" (→ `#work`) CTAs below.
Content fades out on scroll (`contentOpacity`) while the collage keeps
moving, matching the brief's "content appears, typography changes
position" scroll-language requirement. Responsive: 2 image tiles on
mobile, 4 from `sm:`, 5 from `md:`, all 6 from `2xl:` — deliberately fewer
on small screens for impact rather than cramming the full collage in (a
real bug was found and fixed here: the bottom-left tile visually collided
with the CTA row on a 390px viewport; fixed by hiding it below `sm:` and
repositioning it — see "Testing" for how this was caught).

**Work section — full rebuild, "Work we've built."
(`frontend/src/sections/SelectedWork.tsx`)**: replaced the alternating
stacked-row layout with a **horizontal scroll track** (native CSS scroll +
`scroll-snap`, not a hijacked/JS-driven horizontal animation — so it stays
keyboard/touch/trackpad-usable, per the brief's own "animation must not
make navigation difficult" caution) of large project cards. Each card is
framed as a **browser-chrome preview** (a small dot-bar + a decorative
`concept/{id}/{page}` label — never a real clickable link) with clickable
"page" tabs (e.g. Home / Workspace / Reports) that swap a subtle color
tint over the image — a lightweight, honest version of the brief's
"page browser" concept. **No project has a "Visit live site" link and none
claim a real deployment** — every card carries an explicit "Concept
exploration — not a live client site." caption. This is a deliberate,
brief-compliant scope reduction: the brief's "Visit live site →" /
real-multi-page-browsing language applies to *real* completed work, and
per `docs/goal.md`'s permanent content-honesty rules (unchanged, still in
force) **no real client work exists yet** — inventing live links or
fabricated distinct per-page screenshots for the five CONCEPT/EXPERIMENTAL
projects would have violated the brief's own "Do not create fake project
claims" rule. All five existing projects (AI Workspace, Maison, Pulse,
Atlas, Flow) are unchanged in substance — same status labels, lightly
tightened copy for tone, plus new `pages` metadata for the tab UI. `docs/
memory.md`'s honesty framing from Phase 1 (concept projects, no real
clients) is unaffected — see `docs/goal.md`, not modified this phase.

**Services — full rebuild, "What We Make"
(`frontend/src/sections/Services.tsx`)**: three color-blocked cards (one
per curated accent — cobalt/coral/lime), each with a bold index, name, one
-line summary, and a click-to-expand detail (items list) — replacing the
old six-item list-and-detail pattern that no longer fit a three-service
model. `data/services.ts` now has exactly three entries; the "Websites"
entry explicitly states it includes web applications and AI-integrated
experiences, per the brief.

**How We Work — full rebuild
(`frontend/src/sections/Process.tsx`)**: five steps (Idea → UI/UX → Design
→ Development → Launch, `data/process.ts` rewritten from the old six-step
Discover/Define/Design/Build/Refine/Launch) presented as a connected
timeline — numbered circular nodes on a connecting line, alternating
vertical offset on desktop for rhythm, collapsing to a simple vertical
connected list on mobile — rather than the old stacked full-width rows.
The "dedicated team" line and the existing team photo (`media.team`,
formerly `media.approach`) sit below the timeline as a single low-key
strip, replacing the deleted standalone Approach/"Studio Approach" section
entirely — `frontend/src/sections/Approach.tsx` was deleted, not just
unmounted.

**Contact / primary CTA
(`frontend/src/sections/FinalCta.tsx`, `Navigation.tsx`,
`components/WhatsAppCta.tsx`)**: the existing `ContactForm.tsx` and its
`POST /api/contact` integration are **completely unchanged** — same
fields, same validation, same success/error states, same API contract.
What changed is everything around it: the section headline is now "Have
an idea? *We design and build it.*" (the brief's own secondary message,
reused deliberately for consistency), and a prominent **"Let's Quick
Connect"** button (→ `https://wa.me/917382016152`, `target="_blank"`) now
appears above the form as the primary path, with the form itself
positioned as the secondary "or tell us about it" path — matching the
brief's "do not replace it with package/pricing CTAs" instruction by
keeping the form as an equal, not replaced, option. The same "Let's Quick
Connect" button (identical destination and label) also appears in the
desktop nav, the mobile menu, and the footer, so the primary CTA is
consistent everywhere per the brief. `WhatsAppCta.tsx`'s copy was updated
to this phase's exact wording — button text changed from "Chat on
WhatsApp →" (Phase 8) to **"Chat with us on WhatsApp →"**, and the
"Prefer WhatsApp? Connect with us directly." supporting line was removed
since the "Liked the work? Let's talk." + button pair alone now matches
the brief precisely. The WhatsApp number and `whatsappUrl` helper
(`data/contact.ts`, `VITE_WHATSAPP_NUMBER`) are unchanged from Phase 8 —
reused, not duplicated.

**Chatbot — preserved, restyled for free**: per the brief's explicit
instruction, `ChatWidget.tsx`'s logic, data-testids, and copy (greeting,
quick prompts, loading/error states) are **completely unchanged** — the
file has a zero-line diff this phase. Its visual restyle to the new cream/
cobalt palette happened automatically through the same token-remap
mechanism described above, verified with a manual screenshot (chat panel
open, cream background, cobalt send button) before relying on it. The
backend `POST /api/chat` contract, knowledge base, and retrieval logic
(Phase 9) are entirely untouched — this phase made zero backend changes.

**Browser title / favicon fix**: `index.html`'s title changed from
"Studio — Digital Product Design & Engineering" to "Studio. — We make
websites and apps" (matching the new core message), and the meta
description was rewritten to the same effect. `frontend/public/favicon.svg`
— previously an unrelated auto-generated purple-blob icon left over from
scaffolding, matching the brief's own description of "the current random
browser icon/name issue" — was replaced with a minimal, clean typographic
placeholder: a rounded cobalt square with a bold "s" and a small coral
accent dot, deliberately temporary and easy to swap once a real brand
identity exists (per the brief: no permanent brand/logo was invented).

**Imagery — centralized, no new sourcing this phase**: per the brief
("temporary image sources may be used if necessary, but document the
source"), this phase **reused the existing 16 locally-hosted, previously-
curated images** (`frontend/public/images/`, sourced and documented back
in Phase 2.5 — Unsplash/Wikimedia Commons, all openly licensed, chosen to
avoid logos/faces/brands) rather than sourcing new photography — no new
network image fetches were attempted, avoiding the network-blocked-CDN
risk documented in Phase 2.5. All imagery remains centralized in
`frontend/src/data/media.ts` (updated this phase: `hero` restructured from
three single images to a six-image `gallery` array reusing the project/
capability files; `approach` renamed to `team`, still used in How We Work;
`finalCta`, `hero.background`, `hero.fragmentOne/Two` removed as unused —
their underlying files, `hero-background.jpg`, `hero-fragment-code.jpg`,
`hero-fragment-staircase.jpg`, `final-cta-corridor.jpg`, are now orphaned
on disk, safe to remove later or reuse for real project imagery once it
exists — no component references them). **Real project screenshots were
not available this session** (no real client work exists yet — see
`docs/goal.md`'s content-honesty rules), so all project imagery remains
the same concept-appropriate stock/Commons photography as before; per the
brief this is acceptable for CONCEPT/EXPERIMENTAL projects and is called
out as pending real curation below.

**Animation**: kept Framer Motion exclusively (GSAP remains installed but
unused, as before — introducing it wasn't worth the added complexity for
what this redesign needed). New patterns this phase: per-tile scroll
parallax at different speeds in the hero (four `useTransform` speed
tiers), a native horizontal scroll-snap track for the Work section (no
custom scroll-hijacking JS), click-to-expand service cards
(`AnimatePresence` height animation, same pattern as the old service
detail panel), and a staggered-reveal connected timeline in How We Work.
`prefers-reduced-motion` handling in `index.css` (global animation/
transition-duration override) is unchanged and still applies to all of
this.

**Testing — nothing weakened, real content changes reflected honestly**:
`frontend/tests/home.spec.ts` was substantially rewritten (not just
patched) because the content itself changed — six services became three,
six process steps became five, "Start a project" became "Let's Quick
Connect," the "Capabilities" nav link and its `#approach` target no longer
exist. New assertions were added, not removed: a dedicated check that no
pricing/package language appears anywhere in Services (`/pricing|starting
at|per month|price/i` → zero matches), a check that all 5 work cards carry
the "Concept exploration — not a live client site." disclaimer, a check
that the Work section's page-preview tabs are actually clickable and
update their label, and a check that the primary "Let's Quick Connect" CTA
is present with the correct `wa.me` href/`target` in the nav, the mobile
menu, the hero, and the contact section. `images.spec.ts` and
`responsive.spec.ts` needed only small, honest updates (a comment/test
name correction for the hero's new "some images visible at all
breakpoints" reality, and updating the CTA-locator text) — their actual
checks (every image loads, no horizontal overflow, CTA stays on-screen)
are unchanged and still enforced. Three real locator bugs were found and
fixed while rewriting (not pre-existing, introduced by this phase's own
copy changes, all caught by actually running the suite, not guessed at):
"Work" nav link text is now a substring of the new "How We Work" link
text, requiring `exact: true`; the new How We Work headline ("*Idea* to
launch. One team.") accidentally contains the word "Idea," colliding with
the process step of the same name, fixed by asserting on the step's
`<h3>` heading role instead of plain text; and the Services no-pricing
regex initially included the word "package," which false-matched the
section's own honest copy ("not a **package**") — narrowed to drop that
word. **Final result: 36/36 Playwright tests passing** (26 existing + 2 new
in Work/Contact, plus the 8 Phase 9 chatbot tests, all at `--workers=2`),
`npm run build` clean, and the backend's own 13/13 pytest suite re-run and
confirmed unaffected (this phase touched zero backend files).

**Remaining visual/manual QA**: reviewed via Playwright screenshots at
desktop (1440×900) and mobile (390×844) — hero, work, services, process,
contact, and the chat panel open state were all visually inspected this
session (not just assertion-checked) and matched the intended direction.
Tablet (1024×768) was checked for overflow/usability only, not visually
screenshotted. No cross-browser check (Chromium-only, unchanged from
Phase 2.5's documented scope).

**Not done, deliberately, per this phase's explicit final requirement**:
**no deployment was performed** — `vercel` / `vercel --prod` were not run.
Production still serves the Phase 9 (pre-V2) design until a separate,
explicit deploy step is requested.

## Phase V3.1 findings — business knowledge + content accuracy update

**What this phase was**: a content/knowledge-only pass, no redesign. The V3
visual system (terminal/window-chrome aesthetic, "We make websites and
apps.") was already the approved direction and untouched. The gap this
phase closed: the **visible frontend copy was already correct** (three
services, no pricing, dedicated-team line, CONCEPT/EXPERIMENTAL labeling —
all already in place from the V2/V3 work), but `backend/app/knowledge/*.md`
— the chatbot's actual source of truth — was still describing the old,
superseded **six-service** business (Websites, Web Applications, Product/
UI-UX Design, Mobile Experiences, AI & Automation, Ongoing Development) and
publicly exposed the internal specialist/freelancer network structure that
the business no longer wants surfaced. The chatbot was answering
questions correctly about a business that no longer exists.

**Finalized business definition (source of truth from here on)**:
- **Exactly three services**: Websites (includes web applications and
  AI-integrated experiences — AI is not a separate service), Mobile Apps,
  UI/UX Design. No fourth service (no standalone "AI & Automation," no
  "Ongoing Development" marketed as a service — see below).
- **Target clients**: startups, small/medium businesses, individual
  founders — anyone needing a website or app. No claimed niche beyond that.
- **Core message**: "We make websites and apps." / "Have an idea? We
  design and build it." Journey: Idea → UI/UX → Design → Development →
  Launch.
- **Engagement model**: fully custom, scoped per project — no packages,
  tiers, or published pricing.
- **Team positioning**: "A dedicated team takes your idea from concept to
  launch." The internal specialist/freelancer network structure is
  **no longer described publicly** — removed from `about.md` and
  `capabilities.md` (previously both explicitly described it).
- **Portfolio**: current Work section is studio-built concept/experimental
  projects only, never presented as real client work — unchanged, already
  correct on the frontend and in `work.md`.
- **Contact**: contact form → Postgres (unchanged) + WhatsApp
  (`wa.me/917382016152`, unchanged). Resend email notifications remain
  **implemented but not configured** (`EMAIL_API_KEY`/`EMAIL_FROM` still
  unset — see "Pending" item 1) — the knowledge base does not claim
  instant email confirmation, only that enquiries are "saved and reviewed."

**Knowledge base rewritten (`backend/app/knowledge/`)**: all six files —
`services.md`, `about.md`, `capabilities.md`, `process.md`, `faq.md`,
`contact.md` — rewritten to the three-service model; `work.md` was already
accurate (CONCEPT/EXPERIMENTAL labeling matches `projects.ts`) and was left
unchanged. `process.md` now mirrors the frontend's actual five-step
Idea→UI/UX→Design→Development→Launch sequence (previously described a
stale six-step Discover/Define/Design/Build/Refine/Launch process that the
frontend had already moved away from in the V2 redesign). `faq.md` was
expanded with one `##` section per test question from this phase's brief
(see below) so each has a directly-matching heading for the keyword-overlap
retrieval to hit.

**Retrieval fix (`backend/app/services/knowledge_service.py`)**: removed
`"do"` from the stopword list. Without it, a question like "What do you
do?" tokenized to an empty set (every word — what/do/you/do — was a
stopword), so `retrieve()` always returned no match and the question fell
through to the fallback message regardless of knowledge-base content. This
is a real, pre-existing retrieval gap (not introduced this phase) that
this phase's own test coverage caught. `"does"`/`"did"` remain stopwords;
only the bare `"do"` form was removed, since it's the only one that
produces a genuinely empty query in common phrasing.

**Test-isolation bug fixed (`backend/tests/conftest.py`)**: the chat
rate limiter (`app/core/rate_limit.py`) keeps its request log in
module-level state that persists for the life of the test process, not
per-test. Once this phase's new test added enough `/api/chat` calls in one
run, later tests started hitting the real 20-requests/60s limit and got
`429` instead of `200` — a real cross-test pollution bug, not a limiter
design problem. Fixed by clearing `rate_limit._request_log` in an autouse
fixture, mirroring the existing `get_settings.cache_clear()` pattern. The
limiter's actual behavior (20 req/60s per client IP) is unchanged.

**New backend tests (`backend/tests/test_chat.py`)**: added
`test_business_definition_questions_are_answered_from_knowledge` (all 15
of this phase's brief's required test questions — "What do you do?",
"Do you build web apps?", "Can I reach you on WhatsApp?", etc. — asserting
each is answered from `source: "knowledge"`, never the LLM/fallback, and
that the answer contains the expected locked-business fragment) and
`test_chatbot_never_claims_a_fourth_service` (asserts the "What services do
you offer?" answer never contains "ongoing development," "automation
service," "cloud," "devops," or "seo"). **15/15 backend tests passing**
(13 pre-existing + 2 new).

**Frontend content-copy fix (`frontend/src/components/ContactForm.tsx`)**:
the "Project type" dropdown's **labels only** were reworded to match the
locked three-service model — e.g. "AI & Automation" → "AI-Integrated
Website / App," "Ongoing Development" → "Ongoing Support for an Existing
Product," "Product / UI/UX Design" → "UI/UX Design," "Mobile Experience" →
"Mobile App." **The underlying `project_type` values and the
`POST /api/contact` request/response contract are completely unchanged**
(still the same seven literals in `backend/app/schemas/contact.py` and
`frontend/src/services/api.ts` — this phase did not touch either file) —
only the human-readable text shown in the `<select>` changed, so existing
data and the API contract are unaffected.

**Everything else on the frontend was already correct** (verified, not
assumed): `frontend/src/data/services.ts` already has exactly three
services worded per the brief; `Hero.tsx`/`FinalCta.tsx`/`Footer.tsx`/
`Navigation.tsx` already use "We make websites and apps." / "Have an idea?
We design and build it." / "let's connect" consistently; `Process.tsx`/
`data/process.ts` already reflect the five-step Idea→UI/UX→Design→
Development→Launch journey; `Services.tsx` already asserts (via Playwright)
zero pricing/package language; `SelectedWork.tsx`/`projects.ts`/`work.md`
already label every project CONCEPT/EXPERIMENTAL and never claim a live
client site. No visual, layout, animation, or color changes were made this
phase, per the brief.

**Verification performed this phase**: `cd frontend && npm run build` —
clean. `cd frontend && npm run test:ui -- --workers=2` — **37/37 Playwright
tests passing** (unchanged from before this phase; the ContactForm label
change didn't affect any locator since tests select by field `id`/label
text, not option label). `cd backend && pytest` — **15/15 passing** (13
pre-existing + 2 new business-definition tests). No database schema, no
contact API contract, no chat API contract, and no Vercel/deployment
config were touched.

**Not done, deliberately, per this phase's explicit final requirement**:
**no deployment** — `vercel`/`vercel --prod` were not run, and **nothing
was committed** (all changes remain in the working tree, per the brief's
"Wait for manual review"). See git status for the exact file list.

## Phase V3.2 findings — UI polish, process characters, chat lead capture

**What this phase was**: a focused refinement on top of the approved V3
"Studio OS" design — no redesign, no layout system change. Four things
changed: (1) UI polish (tighter section spacing, a bit more motion, a
slightly more polished floating nav), (2) the Process section's static
five-step list became a scroll-driven single-active-character sequence,
(3) the Contact section's two actions (WhatsApp, form) became a
side-by-side pair instead of vertically stacked, and (4) the Studio
Assistant chatbot gained lightweight, progressive lead capture. Business
content (Part A/H) was already correct from Phase V3.1 — re-verified this
phase, not re-written (see "Content accuracy re-verified" below).

**UI polish (Part B)**: reduced vertical section padding across Work,
Services, Process, and Contact (`py-24 md:py-32` → `py-20 md:py-28`;
`FinalCta` went from `py-28 md:py-40` → `py-20 md:py-28`) and Footer
(`py-16 md:py-20` → `py-12 md:py-16`), and tightened a few internal
top-margins (Work's index/stage grid, Services' module list, the contact
form's top gap). No section had its content density changed — same
headings, same copy, same number of elements, just less dead air around
them. Added motion where it was previously static: each Services module
now staggers in (`whileInView`, per-card delay) instead of appearing all at
once; the Footer fades/slides in on first view instead of just being
present. `Navigation.tsx`'s scrolled state now also scales the pill down
slightly (`scale: 0.97`) and switches to a stronger `backdrop-blur-xl`,
on top of the existing shadow — a subtle "settling in" transition rather
than an instant shadow snap. Nothing about `prefers-reduced-motion`
handling changed — all new motion goes through the existing Framer Motion
patterns (`whileInView`, `AnimatePresence`) that already respect it.

**Process section — scroll-driven character sequence (Part C, the
headline change this phase)**: replaced the old static/build-log list
(`frontend/src/data/process.ts`, now deleted — superseded) with
`frontend/src/data/processCharacters.ts` (five entries: id, phase number,
pose, color token, title, description — centralized exactly as the brief
asked, so the cast can be edited or replaced later without touching
animation logic) and a new `frontend/src/components/ProcessCharacter.tsx`.

The character system is one shared inline-SVG humanoid template (head,
torso, legs, two arms) re-colored per phase using five new CSS tokens
(`--color-char-blue/green/pink/purple/orange` in `index.css`) and re-posed
via per-phase arm-angle presets, plus a floating icon "prop" badge (Lucide
icons — `Lightbulb` for Idea/planning, `LayoutGrid` for UI/UX,
`Palette` for Design, `Code2` for Development, `Rocket` for Launch) that
signals each phase's responsibility. This is a deliberate, honest
interpretation of "stylized 3D character assets" given no external asset
pipeline or image-generation tool was available this phase: one consistent
local (inline SVG, zero external CDN dependency), re-colorable body
template plus the site's own existing icon language, rather than five
unrelated photos or an actual 3D render — it satisfies "one character
family," "local assets," and "centralized for later replacement" without
inventing fake photorealistic people. **If real 3D character art is
produced later, only `ProcessCharacter.tsx`'s render needs to change — the
data shape in `processCharacters.ts` and the scroll-driving logic in
`Process.tsx` do not.**

`Process.tsx` reuses the exact same `scrollYProgress` → `currentIndex`
mechanism the old build-log timeline already had (five scroll windows over
the section's height), but now drives a `<div data-testid="process-stage">`
that shows **only the current phase's character** via
`AnimatePresence mode="wait"` (opacity + scale + y + a slight rotation on
enter/exit — "one person taking the project through the next stage," per
the brief) plus a small progress-dot row (one dot per phase, filled up to
the current one) and a phase label, all inside one shared bordered "stage"
box — one visual environment, not five stacked images. The stage is
`md:sticky md:top-28` so it stays in view while the phase list scrolls past
it on desktop. On mobile the stage sits above the (now more compact) phase
list at a shorter fixed height (`h-[280px]` vs `sm:h-[340px]`) — still only
one active character, simplified to fit without covering text. The phase
list itself is unchanged in substance (same five titles/descriptions, same
done/running/queued states) but its indicator dots are now colored per
phase instead of a single accent, tying it visually to the active
character above.

**Contact section — side-by-side actions (Part D)**: `WhatsAppCta.tsx` was
rebuilt from a single bottom "Liked the work? Let's talk." + button block
into a two-tile `grid grid-cols-1 sm:grid-cols-2` row — "Chat on WhatsApp"
(external `wa.me` link, unchanged destination) and "Start a conversation"
(a button that smooth-scrolls to and focuses the form's Name field) —
equal visual weight, same bordered-tile treatment, stacked on mobile via
the `sm:` breakpoint. `FinalCta.tsx` now renders this row once, directly
above the form, replacing the old single "let's connect" button at the top
**and** the old duplicate WhatsApp block below the form — removing that
duplication is exactly what closed the "wasted vertical space" the brief
described. The actual `ContactForm.tsx` component, its fields, and its
`POST /api/contact` call are **completely unchanged** except its submit
button label, renamed from "Start a conversation" to **"Send enquiry"**
specifically so it's no longer ambiguous with the new "Start a
conversation" tile above it (both are now distinct, accessible names).

**Content accuracy re-verified, not re-written (Parts A/H)**: `services.ts`,
`Hero.tsx`, `Footer.tsx`, `Navigation.tsx`, and `backend/app/knowledge/*.md`
were already correct per Phase V3.1 (exactly three services, no pricing,
"dedicated team" positioning, CONCEPT/EXPERIMENTAL portfolio labeling).
This phase added backend test coverage for this brief's exact rephrasings
("Do you build AI-integrated websites?", "Do you offer packages?", "Can I
bring only an idea?", "Do you have a dedicated team?") to
`test_business_definition_questions_are_answered_from_knowledge` — all
retrieve correctly from the existing knowledge base with no content changes
needed.

**Chat lead capture — architecture (Part F)**: new table **`chat_leads`**
(`backend/app/models/chat_lead.py`): `id`, `conversation_id` (unique,
indexed), `name` (nullable), `email` (nullable), `phone` (nullable),
`created_at`, `updated_at`. Created automatically by the existing
`init_db()`/`create_all()` path (additive, no Alembic needed — same as
`contacts`). **The conversation itself is never persisted anywhere** — no
messages, no transcript, no history table; only these three contact
fields, exactly per the brief.

New route **`POST /api/chat-lead`** (`backend/app/api/routes/chat_lead.py`)
→ `app/schemas/chat_lead.py` (`ChatLeadUpsert`: `conversation_id` required,
`name`/`email`/`phone` all optional and nullable; `email` validated via
`EmailStr`, `phone` validated server-side via a regex — digits/spaces/`+`/
`-`/parentheses, 7–20 chars) → `app/services/chat_lead_service.py`
(`upsert_lead()`, the only place that touches the table: looks up by
`conversation_id`, creates a row if none exists, and **only overwrites a
field if the payload actually included a non-null value for it** — a
later request that omits a field already saved never blanks it out). The
route never touches the DB directly, matching the existing
`contact.py`/`contact_service.py` pattern.

**Frontend — conversation state, kept off the server**
(`frontend/src/components/ChatWidget.tsx`, fully rewritten): a
`conversation_id` (`crypto.randomUUID()`, regenerated on "Clear
conversation") is generated once per chat session and sent with every
`POST /api/chat-lead` call. Client-side state
(`userMessageCount`, `nameCaptured`, `emailCaptured`, a `phoneCapturedRef`,
and a `pendingCapture`/buffered-original-message pair) drives the entire
capture sequence — **the backend has no idea a capture flow exists at
all**; it only ever receives finished `{conversation_id, name?, email?,
phone?}` upserts. `POST /api/chat` and the knowledge/LLM/fallback logic in
`chat_service.py` are **completely untouched** by this phase.

**Lead capture sequence, exactly as specified**: the first two user
messages behave normally (call `/api/chat` directly). Before answering the
**third** user message, the assistant asks "Before I answer that, what
should I call you?" — the third message itself is buffered
(`pendingMessageRef`), not lost, and rendered in the transcript immediately
so it's visible while the name question is pending. The user's next
message is interpreted as the name reply (not counted toward
`userMessageCount`): if it looks like a decline (`skip`, `prefer not to
say`, `no thanks`, `not now`, `rather not`, `pass`, `don't want` —
case-insensitive, substring match), the field stays `null`, the assistant
says "No problem — let's carry on," and the original third message is
still answered; otherwise the name is saved (`POST /api/chat-lead`), the
assistant replies "Thanks, {name}. " prefixed directly onto the answer to
the original third message. The **fifth** user message (counting only
real content messages, not the name-reply) triggers the same pattern for
email — "One more thing — what's the best email to reach you at?" — with
client-side email regex validation before saving; an invalid email gets
"That email doesn't look quite right. Could you check it?" **without**
discarding the buffered original message or advancing past the capture
state, so the user can simply retry. A valid email is saved and the
original fifth message is answered, prefixed with "Thanks — got it,
{name}. " when the name is already known (a second, deliberately light
touch of personalization — the brief's "do not overuse the name" is
respected by using it only at these two natural confirmation points, not
on every subsequent answer). **Phone is never actively asked for**: any
normal (non-capture) message is checked against a phone-number pattern
(`\+?\d[\d\s().-]{7,14}\d` — long enough to avoid false-positiving on a
stray number like a year), and if one appears, it's saved silently in the
background via `POST /api/chat-lead` with no interruption to the
conversation. Once `nameCaptured`/`emailCaptured` are true (including via
decline), that question is **never asked again** for the rest of the
conversation. "Clear conversation" resets all of this client state and
generates a fresh `conversation_id`, starting an entirely new lead.

**Security (Part F "Security")**: the lead endpoint validates
server-side regardless of what the frontend sends — `EmailStr` rejects a
malformed email with `422` even if the client-side regex were bypassed,
and the phone regex is enforced in `ChatLeadUpsert`, not just in the UI.
No `DATABASE_URL`, `LLM_API_KEY`, or email credential is referenced by any
of this phase's new code, logged, or returned in any response.

**UI integration (Part G)**: the chatbot's existing visual design,
`data-testid`s, and layout are unchanged — the capture prompts and
confirmations are rendered as ordinary assistant/user chat bubbles (same
components, same styling), and the input's placeholder text changes
contextually ("Your name…" / "you@example.com…" / "Ask a question…") as a
small affordance, not a form control swap. There is no separate "lead
form" UI anywhere — it stays a conversation throughout, per the brief.

**Backend tests — new (`backend/tests/test_chat_lead.py`, 9 tests)**:
create with name, update with email, update with phone, same
`conversation_id` updates the same row (not a new one), invalid email
rejected (`422`, no row created), invalid phone rejected (`422`), optional
phone accepted when absent, and a previously-saved field surviving a later
request that omits it (decline/empty-field handling). Also fixed a latent
cross-test pollution risk while adding these: none needed this phase
beyond what Phase V3.1 already fixed for `/api/chat`'s rate limiter, since
`/api/chat-lead` has no rate limiting of its own (not requested by this
brief). **23/23 backend tests passing** (13 pre-existing chat/contact +
2 Phase V3.1 business-definition tests + 4 new Part-H rephrasing cases +
9 new chat-lead tests — some renumbered from Phase V3.1's count as tests
were added across phases).

**Playwright tests — new (`frontend/tests/chat.spec.ts`, 4 new tests under
"Studio Assistant lead capture")**: first two messages stay normal with no
capture prompt; the third message triggers name capture, the original
third message is answered afterward, and the assistant is shown using the
name naturally without asking again; the fifth message triggers email
capture (including an invalid-email retry step) with the original fifth
message answered afterward; phone stays optional and a decline ("prefer
not to say") is respected without being asked again. All mock both
`/api/chat` and the new `/api/chat-lead` via `page.route()` — **no real
backend or LLM call is made during these tests**. Also updated for the
Contact layout change: the old "Direct WhatsApp CTA" describe block in
`home.spec.ts` (asserting the removed "Liked the work? Let's talk." copy)
was replaced with "shows both primary contact actions side by side, equal
weight" (checks both tiles' hrefs/labels and that they sit in the same row
via bounding-box comparison) and a new "start a conversation scrolls to
and focuses the form" test; the existing contact-form test's submit-button
locator was updated from `/start a conversation/i` to `/send enquiry/i` to
match the renamed button. **Final result: 41/41 Playwright tests passing**
(37 pre-existing + 4 new lead-capture tests; two existing tests were
updated in place to match the intentional Contact-layout content change,
not weakened — each still asserts an equivalent or stronger behavior).

**Verification performed this phase**: `cd frontend && npm run build` —
clean. `cd frontend && npx playwright test --workers=2` — **41/41
passing**. `cd backend && pytest` — **23/23 passing**. No database schema
was hand-migrated (the new `chat_leads` table is created the same additive
way `contacts` always has been); the `contacts` table, `POST /api/contact`
request/response contract, and `POST /api/chat` request/response contract
are all byte-for-byte unchanged.

**Database verification (Part E / chat-lead verification)** — safe,
read-only queries against the real Neon database (run via `psql` or any
Postgres client using the connection string already in `backend/.env`,
never printed or committed anywhere):

```sql
-- Most recent contact-form submissions
SELECT * FROM contacts ORDER BY created_at DESC;

-- Most recent chatbot leads
SELECT * FROM chat_leads ORDER BY created_at DESC;
```

Safe test/cleanup approach for either table (used throughout this
project's history — see "Phase 3 findings" above for the original
pattern): submit one throwaway row with an obviously-fake, unique value
(e.g. an email like `phaseV32-test@example.com`, or a `conversation_id`
like `test-conv-<timestamp>`), independently confirm it via the `SELECT`
above (not just the HTTP response), then delete only that exact row and
re-confirm zero matching rows:

```sql
DELETE FROM contacts WHERE email = 'phaseV32-test@example.com';
DELETE FROM chat_leads WHERE conversation_id = 'test-conv-<timestamp>';
```

Never run a bare `DELETE FROM contacts` / `DELETE FROM chat_leads` with no
`WHERE` clause — always target the exact test row by a unique value you
just created. No production secret (the connection string itself) belongs
in this document or any other committed file — only the query shape does.

**Not done, deliberately, per this phase's explicit final requirement**:
**no deployment** — `vercel`/`vercel --prod` were not run, and **nothing
was committed** (all changes remain in the working tree, per "Wait for
manual review"). See git status for the exact file list.

## Phase V3.3 findings — real process assets, copy fixes, goal.md sync

**What this phase was**: a focused execution pass on top of V3.2 — no
redesign, no rebuilt sections. Four things changed: (1) the Process
section's inline-SVG placeholder characters (built in V3.2 as an honest
stand-in, documented as temporary) were replaced with the real production
3D character assets; (2) two copy fixes ("One person, five stages." →
"One team, five stages.", "Windows we've opened." → "Made by our team.");
(3) `docs/goal.md` — never updated since it was originally written — was
finally synchronized with the locked three-service, dedicated-team
business definition; (4) the knowledge base was re-audited against this
phase's exact "must not contain" list and confirmed already clean (no
changes needed there — see below).

**Real 3D character assets integrated**: `frontend/src/assets/process/`
contains five production WebP files, one per phase, supplied for this
phase (not generated by this session):

- `process-planning.webp` → Idea (blue)
- `process-uiux.webp` → UI/UX (green)
- `process-design.webp` → Design (pink)
- `process-development.webp` → Development (purple)
- `process-launch.webp` → Launch (orange)

`frontend/src/data/processCharacters.ts` now imports these via Vite asset
imports (so they get hashed filenames and are bundled properly, not raw
public-path strings) and centralizes `{ id, phase, image, alt, color,
title, description }` per phase — the mapping the brief asked for.
`frontend/src/components/ProcessCharacter.tsx` was rewritten from the
V3.2 inline-SVG-humanoid-plus-Lucide-icon placeholder to render the real
`<img>` inside a phase-colored radial-gradient "stage glow" (so a plain
cutout PNG/WebP reads as part of the Studio OS environment, not a pasted
sticker) with a drop-shadow for depth. **The old inline SVG character
template and its Lucide-icon "prop" system are fully removed** — no dead
code left behind.

**Idle motion — deliberately removed, not added**: an initial version of
this phase gave the active character a continuous looping float
(`y: [0, -8, 0]`, `repeat: Infinity`). This was reverted for two concrete
reasons found this session, not a guess: (1) the brief explicitly says
"do not make the characters continuously bounce," and (2) it broke
`images.spec.ts`'s existing image-load test in practice — Playwright's
`scrollIntoViewIfNeeded`/actionability checks wait for an element's
bounding box to stop changing, and a never-ending transform animation
never satisfies that, so the test timed out at 30s waiting for the image
to "stabilize." The only motion the character now gets is a one-time
spring "settle" on entry (`type: "spring", stiffness: 180, damping: 16`,
via the existing `AnimatePresence` enter transition in `Process.tsx`) —
a soft overshoot-and-settle, not a loop, and it's skipped entirely under
`prefers-reduced-motion` (a flat 0.3s fade instead).

**Process section — copy and layout (Part 3/10)**: heading corrected from
"One person, five stages." to **"One team, five stages."**, with a new
one-line subhead — "One dedicated team takes your idea from concept to
launch — not five separate hand-offs." — reinforcing that one individual
does not personally perform every stage (the character sequence
illustrates *which phase is active*, not *who* is doing it). Section
padding tightened again (`py-20 md:py-28` → `py-16 md:py-24`), the
heading-to-content gap tightened, and the character stage was made
noticeably larger (`h-[280px] sm:h-[340px]` → `h-[360px] sm:h-[440px]
md:h-[500px]`, max character width `220px` → `280px`) so it reads as the
section's visual centerpiece, per the brief. The stage stays
`md:sticky md:top-28`, confirmed (new Playwright test, see below) to sit
below the floating nav pill with no overlap at any breakpoint tested.

**Work section — copy and spacing (Part 2/9)**: heading changed from
"Windows we've opened." to **"Made by our team."**, with a new supporting
line under it — "From early ideas to larger digital products, we design
and build websites and apps from start to finish." — and the existing
honesty note tightened to "Studio-built concepts and experiments — a look
at how we think, design, and build. Not real client work." **No client
names, live deployments, testimonials, or statistics were introduced** —
the CONCEPT/EXPERIMENTAL labels and the "not a live client site" caption
on every project card are unchanged. Section padding tightened
(`py-20 md:py-28` → `py-16 md:py-24`) and the index/stage grid's top
margin reduced (`mt-10 md:mt-14` → `mt-8 md:mt-10`).

**`docs/goal.md` synchronized (Part 14)** — this was the one real content
gap left in the documentation: `goal.md` had never been updated since its
original write-up and still described the superseded **six-service**
model and the **public** "specialist freelancer network" positioning that
`docs/memory.md`'s own phase notes (V2 onward) had already moved away from
in the actual site and knowledge base. Fixed in place: "Positioning" now
states the locked core/supporting message and "one cohesive team" framing
(internal delivery structure never described publicly — called out as a
**permanent** constraint, not phase-specific), "Core services" now lists
exactly the three locked services with the explicit "do not market as
separate services" list, and "Site structure" was corrected to match the
actual current section order (the standalone "Studio Approach" section,
removed back in Phase V2, was still listed here until now). `goal.md`'s
purpose (long-term vision, changes rarely) is preserved — this was a
one-time correction to match reality, not a new status-tracking habit;
day-to-day state continues to live only in this file.

**Knowledge base — audited, no changes needed**: re-checked
`backend/app/knowledge/*.md` against this phase's exact "must not
contain" list (six services, freelancer marketplace, specialist network
as a public structure, ongoing development/automation/cloud/DevOps/SEO as
separate services). All clear — the only matches found by a full-repo
grep were legitimate: `capabilities.md`'s honest "not a marketplace of
freelancers" denial, and "web applications" appearing correctly as part of
the Websites service (not as its own item). No knowledge file edits were
needed this phase.

**Playwright — new tests**: `home.spec.ts` gained "shows the corrected
process heading, not the old one-person wording" (asserts the H2 text and
that "one person, five stages" appears nowhere on the page), "shows the
corrected heading and honest, non-client-claiming supporting copy" for
Work (asserts the H2 text, that "windows we've opened" appears nowhere,
and that "not real client work" is visible), "only one process character
is active/visible at a time, and it actually loads" (asserts exactly one
`process-active-character` element, its `<img>` has `naturalWidth > 0`,
and its `src` matches one of the five real asset filenames), and "the
process stage does not overlap the navigation" (bounding-box check).
`responsive.spec.ts` gained a new "Process on mobile" describe block: one
character stays within the mobile viewport with no horizontal overflow,
and the stage still renders correctly under
`page.emulateMedia({ reducedMotion: "reduce" })`. **Final result: 47/47
Playwright tests passing** (41 pre-existing from V3.2 + 6 new).

**Verification performed this phase**: `cd frontend && npm run build` —
clean (the five WebP assets are bundled with hashed filenames, confirmed
in the build output). `cd frontend && npx playwright test --workers=2` —
**47/47 passing**. `cd backend && pytest` — **23/23 passing**, unaffected
(this phase touched zero backend files — contact API, chat API, and
chat-lead API contracts are all byte-for-byte unchanged from V3.2).

**Known limitation, noted rather than fixed this phase**: the five WebP
assets are large as supplied (832KB–1.99MB each, ~7MB total for the whole
set) — noticeably heavier than every other image on the site (all ≤1600px/
quality-78 JPEGs from Phase 2.5). Only one is ever loaded/rendered at a
time (`AnimatePresence mode="wait"` unmounts the previous character before
mounting the next), so this is a page-weight/load-time concern, not a
functional or duplicate-loading one. Worth re-compressing or re-exporting
at a smaller resolution in a future phase if load time on slower
connections becomes a concern — out of scope for this brief, which said
to use the assets as given.

**Not done, deliberately, per this phase's explicit final requirement**:
**no deployment** — `vercel`/`vercel --prod` were not run, and **nothing
was committed** (all changes remain in the working tree, per "Wait for
manual review" / "DO NOT commit"). See git status for the exact file list.

## Phase V3.4 findings — kinetic Work stage + Process scroll pacing

**Scope**: frontend-only, two sections. No backend/API/knowledge/asset
changes (per this phase's explicit "do not touch" list).

**Work section rebuilt** (`SelectedWork.tsx`): replaced the tall stacked
index+card layout with a "kinetic project stage" — a fixed-height scroll
track (`md:h-[220vh]`) with the index list + a stage sticky-pinned
(`md:sticky md:top-28`) inside it. `activeIndex` is driven by
`useScroll`/`scrollYProgress` over that track (same pattern as Process),
mapping 0–100% scroll to the five projects. The active project window
transitions via `AnimatePresence` with a spring (scale/translate/rotate/
opacity) instead of a plain fade — "one window replacing another." Two
secondary windows (previous/next project only, not all five) sit behind it
at reduced scale/opacity/rotation for depth, hidden entirely under
`prefers-reduced-motion`. Clicking an index item calls `goToIndex()`,
which sets state immediately and also scrolls the page to that project's
band so continued scrolling stays in sync — **fixed a real bug** here
during testing: the scroll-target math initially divided by the track's
full height instead of `trackHeight - viewportHeight` (the actual pin
range for `useScroll`'s `"start start"→"end end"` offsets), which
intermittently landed on the wrong project. All existing testids
(`work-index-*`, `work-active-window`, `work-status-badge`) and the page
tabs are unchanged in behavior.

**Process pacing fixed** (`Process.tsx`): the character stage and phase
list are now both inside one `md:h-[170vh]` fixed-height track with the
whole grid `md:sticky`, replacing the old `logRef`-on-natural-content-
height approach. This decouples scroll length from copy length — the
five-phase journey is now a controlled ~1.5–2 viewport heights regardless
of description length. The phase list is now a static five-item stepper
(all titles always visible; only the *current* phase shows its
description) rather than a scroll-past list, since the whole block is
pinned as one unit.

**Testing**: `home.spec.ts` gained new Work tests (keyboard-operable
selection, compact scroll-length bound, single-dominant-window check) and
new Process tests (compact scroll-length bound, full reach-all-five-phases
via simulated wheel scroll). Two real test bugs were found and fixed while
writing these — not pre-existing, both artifacts of the new pinned-track
pattern: (1) `scrollIntoViewIfNeeded()` on the tall Work section can land
mid-track instead of at project 0, fixed by aligning explicitly to the
section's top for the one test that depends on the default active
project; (2) the decorative secondary/background project images had been
given `alt=""` since they're duplicates of the active image, but
`images.spec.ts` requires real alt text on every `<img>` with no
decorative exemption — fixed by reusing each project's real `alt` text.
**Final result: 52/52 Playwright tests passing** (47 pre-existing/updated
+ 5 new), `npm run build` clean, and `cd backend && pytest` **23/23
passing, untouched** (this phase touched zero backend files).

**Not done, deliberately**: no deployment, nothing committed.

## Phase V3.5 findings — general AI + RAG chatbot (checkpoint, 2026-10-01)

**Goal**: turn the Studio Assistant from knowledge-base-first (LLM only
when retrieval found nothing) into a general AI assistant that still knows
the studio — see `docs/goal.md` "Studio Assistant chatbot". Backend-only
change; no frontend, UI, knowledge-file, lead-capture, rate-limit, schema,
database, dependency, or Vercel changes.

**Implemented**

- `backend/app/services/chat_service.py` — new orchestration in
  `answer_question()`:
  1. **LLM configured** → every message goes to the LLM. The system prompt
     is `SYSTEM_PROMPT` (general-assistant behavior + the honesty rules)
     plus a "Studio knowledge" block holding up to 4 retrieved sections
     (`_retrieve_context()`: sections for the current message plus the
     previous user message, de-duplicated, so follow-ups keep their studio
     context), or `(No studio knowledge matched this message.)` when none
     match. The prompt tells the model to answer general questions from
     its own knowledge without bringing up the studio, answer studio
     questions only from the knowledge block (otherwise say it doesn't
     know and point to the contact form/WhatsApp), ignore irrelevant
     retrieved sections, and separate studio facts from general knowledge.
     The last 6 history messages are sent. Returns `source: "llm"`.
  2. **LLM unconfigured, failing, or empty answer** → the pre-V3.5
     behavior: top knowledge section verbatim (`source: "knowledge"`),
     else `FALLBACK_MESSAGE` (`source: "fallback"`).
  - **Bug fixed**: the widget's `history` already ends with the message
    being asked, and the backend appended it again as the final user turn,
    so the LLM saw it twice. `_format_history()` now drops that trailing
    duplicate.
- `backend/app/services/llm_service.py` — `_PROVIDER_ENDPOINTS` maps
  `openai` → `https://api.openai.com/v1/chat/completions` and `gemini` →
  Gemini's official OpenAI-compatible endpoint
  (`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
  `Authorization: Bearer <key>`). Before this, `LLM_PROVIDER=gemini` (what
  `backend/.env` uses) raised `Unsupported LLM_PROVIDER`, so the LLM was
  never actually called. Timeout 15 → 20 s, `max_tokens` 400 → 600.
- `backend/.env.example` — comment updated (both providers, current
  Gemini models).
- `backend/tests/test_chat.py` — 6 new tests (general question gets the
  "no studio knowledge" note; studio question gets knowledge in the
  prompt; LLM failure on a studio question → verbatim knowledge;
  follow-up history sent once with the previous turn's context; Gemini
  endpoint; unsupported provider → fallback). All existing tests,
  including the 19 locked business-fact cases (which run with no LLM),
  unchanged.

**Provider research (official Google docs, 2026-10-01)**: the
OpenAI-compatible endpoint is officially supported; Google recommends the
native API only when you aren't already on the OpenAI format, so the
endpoint was kept. The key in `backend/.env` is an "auth key" (`AQ.`
prefix) — AI Studio creates these by default since 2026-05-28; the format
is fine. The 2.5 models are limited to projects that already used them;
new projects should use `gemini-3.5-flash-lite` / `gemini-3.8-flash`.

**Externally blocked — real AI generation**

| Request | Result |
|---|---|
| List models / get model metadata (compat and native API) | 200 — key authenticates |
| Generate, `gemini-2.5-flash` (the configured model) | 404 — "no longer available to new users" |
| Generate, `gemini-3.8-flash` / `gemini-flash-latest` / `gemini-3.5-flash-lite`, compat and native API (`x-goog-api-key`) | 403 `PERMISSION_DENIED` — "Your project has been denied access. Please contact support." |

The 403 is a Google project-level restriction (same on both API surfaces,
every model); there is no application-side fix and it must not be
bypassed. A key from a project that isn't denied access (or an OpenAI key)
is required. `backend/.env` was **not** changed (still
`gemini-2.5-flash`).

**Tested (2026-10-01)**: backend pytest 29/29; `oxlint` clean;
`tsc -b && vite build` pass; Playwright 51/52 in one full run (the
image-loading check failed once, then passed 3/3 alone and in the previous
full run — flaky, unrelated: no frontend changes), 52/52 in the run before;
local real-backend run with the real `.env` → Gemini fails, logged
(`LLM call failed; answering from studio knowledge…`), studio questions get
the right knowledge section, no crash. Retrieval check — no sections for
"difference between Python and Java" or "pancake recipe"; the right
sections for studio services, AI Workspace, "bring just an idea", and a
Pulse follow-up. Security: the key value is absent from Git history, the
diff, `frontend/src`, `frontend/dist`, backend code/tests and server logs;
`backend/.env` is gitignored; the frontend only uses `VITE_API_URL` /
`VITE_WHATSAPP_NUMBER`.

**Unverified**: everything that needs real generation — naturalness,
general-question quality, studio-fact accuracy, keeping the studio out of
unrelated answers, mixed questions, follow-up quality.

**Known limitations**

- Keyword retrieval makes weak matches. In fallback mode (no working LLM)
  "How do I make pancakes?" returns the "We make websites and apps…"
  section (via "make"), and "reverse a linked list in C" retrieves the
  pricing FAQ (via "list"). Pre-existing — the old code also checked the
  knowledge base first. With a working LLM the prompt tells the model to
  ignore irrelevant sections. No embeddings by design.
- `source` is `"llm"` for every LLM answer, including knowledge-grounded
  ones; the frontend doesn't display it.

**Production**: not deployed, no Vercel env changes, no database changes.

## Pending / not yet done

0. **V2 redesign is not deployed yet** — it exists only in the local
   working tree (uncommitted as of this phase), fully built and tested.
   Deploying is a separate, explicit next step: review locally
   (`npm run dev` from `frontend/`), commit, then `vercel` (preview) →
   verify → `vercel --prod`, exactly like every prior phase's deploy
   workflow. No environment variables need to change for this deploy —
   V2 is frontend-only.
0b. **Real project imagery still not curated** — all five Work section
   projects still use the same concept-appropriate stock/Commons
   photography from Phase 2.5, reused rather than replaced this phase (see
   "Phase V2 findings"). Acceptable for CONCEPT/EXPERIMENTAL projects per
   the brief, but real screenshots should replace them once real client
   work exists — update `frontend/src/data/media.ts` and `projects.ts`,
   nothing else needs to change (imagery is fully centralized).
0c. **Four image files are now orphaned** (no longer referenced by any
   component after the V2 hero rebuild): `hero-background.jpg`,
   `hero-fragment-code.jpg`, `hero-fragment-staircase.jpg`,
   `final-cta-corridor.jpg` — still present in `frontend/public/images/`,
   safe to delete or repurpose later.
1. **Resend API key and verified sender still required (manual, human-only
   step)** — email notifications are fully implemented and will start
   working the moment these two Vercel Production env vars are set:
   - `EMAIL_API_KEY` — a real Resend API key (create one at resend.com;
     needs an account signup, which this session cannot do).
   - `EMAIL_FROM` — a sender address on a **domain verified in Resend**
     (Resend rejects sends from unverified domains) — e.g.
     `hello@yourdomain.com` once that domain's DNS records are added in the
     Resend dashboard. A resend.dev sandbox address only delivers to the
     account owner's own inbox, so a real verified domain is needed for
     `vineetp.work@gmail.com` to reliably receive notifications long-term.
   Set with `vercel env add EMAIL_API_KEY production` /
   `vercel env add EMAIL_FROM production` (value via stdin, never as a CLI
   arg — see "Phase 8 findings"), then also add the same two to
   `backend/.env` locally if local testing of real delivery is wanted, and
   redeploy (`vercel --prod`). Until then, contact submissions keep working
   exactly as before — the DB write always succeeds; only the email step is
   skipped (logged as a warning, not an error).
2. **Working LLM key needed for the general AI + RAG chatbot (manual,
   human-only step — the V3.5 next milestone)** — the chatbot is fully
   functional today with **zero** LLM configuration (studio questions are
   answered from the knowledge base; anything else gets the safe fallback
   message), but general questions need a working LLM. The current Gemini
   key in `backend/.env` is blocked by Google (see "Phase V3.5 findings").
   Provide a key that can actually generate:
   - `LLM_PROVIDER=gemini` or `openai` (see `app/services/llm_service.py`).
   - `LLM_API_KEY` — from a Google project that isn't denied access, or an
     OpenAI key.
   - `LLM_MODEL` — e.g. `gemini-3.5-flash-lite` / `gemini-3.8-flash` (the
     2.5 models are closed to new projects), or `gpt-4o-mini`.
   Then: run the real-AI quality checks locally **before** touching
   production; only once they pass, set the three values with
   `vercel env add LLM_PROVIDER production` / `LLM_API_KEY` / `LLM_MODEL`
   (value via stdin, never as a CLI arg — same convention as Phase 8),
   redeploy (`vercel --prod`), and smoke-test the live chatbot.
3. **No remote configured yet** — this is a local-only git checkpoint (see
   "Phase 7 findings"). Before ever pushing anywhere, re-run
   `git ls-files | grep env` (should show only the two `.env.example` files)
   as a final gate — that's the point a real leak becomes possible.
4. **No Alembic yet** — intentional for now; `init_db()`'s
   `create_all()` is additive-only and will not handle a future column
   rename/drop safely against the real Neon database.
5. **No auth, no lead-management/admin UI, no rate limiting** on
   `/api/contact` — out of scope for this phase, called out in the original
   brief as future work. (`/api/chat` does have a lightweight in-memory
   rate limit as of Phase 9 — see "Phase 9 findings.")
6. **No cross-browser/visual-regression testing** — Chromium-only Playwright
   suite with manual-review screenshots; add Firefox/WebKit projects or a
   pixel-diffing tool later if that becomes worth the maintenance cost.
7. **DB-unreachable startup is fail-fast, not fail-soft** — acceptable for
   MVP scope (see "Phase 3 findings"); on Vercel this means a Neon outage
   would surface as a Function error on every backend request until Neon
   recovers, not a graceful degradation. Acceptable for now.
8. **Preview and Production currently share the same Neon database** — there
   is no separate preview/staging database yet. Neon supports database
   branching for exactly this; worth setting up if preview-environment
   testing becomes frequent enough that test data pollution is a concern.
9. **Chat rate limiting is per-process, not authoritative** — see "Phase 9
   findings"; fine for an MVP abuse-deterrent, would need a shared store
   (e.g. Upstash Redis) to be a hard guarantee under real serverless scale.
10. **Knowledge retrieval is keyword-overlap, not embeddings** — deliberately
    simple per this phase's brief (weak matches observed in V3.5 — see
    "Phase V3.5 findings" / Known limitations); isolated behind
    `knowledge_service.retrieve()` specifically so it can be swapped for
    vector search later (see "Phase 9 findings" / "Future extensibility").
11. **No chat history persistence, analytics, tool calling, or lead
    qualification** — all explicitly out of scope for Phase 9's V1; the
    architecture (isolated retrieval service, isolated LLM service, a
    single orchestration function) is deliberately kept ready for these
    without having built any of them yet.
12. **`backend/Procfile` and `backend/runtime.txt` are now unused** by the
   actual deployment path (Vercel reads `.python-version`, not `runtime.txt`,
   and doesn't use a `Procfile` at all) — left in place as harmless,
   documented artifacts of the Render-shaped path that was evaluated and not
   taken, not because they're required. Safe to remove later if they become
   confusing.
13. Real brand name, logo, and identity are still undecided — do not add them
    speculatively.

## Commands

- Frontend (local dev): `npm run dev` / `npm run build` / `npm run preview` (run inside `frontend/`)
- Frontend UI tests: `npm run test:ui` / `npm run test:ui:headed` (run inside `frontend/`)
- Backend (local dev): `uvicorn app.main:app --reload --port 8000` (run inside `backend/`, venv activated)
- Backend tests: `pytest` (run inside `backend/`, venv activated — uses an isolated temp SQLite DB, never the real Neon database; see "Phase 8 findings")
- Backend (production-style, standalone fallback only — not what Vercel runs):
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (see `backend/Procfile`)
- **Deploy (the real path — from the repository root, `portfolio/`)**:
  ```bash
  vercel            # preview deployment
  vercel --prod     # production deployment
  ```
- Local full-stack dev via Vercel (optional, documented per this phase's
  brief — the existing `npm run dev` / `uvicorn --reload` commands above
  still work and are not being replaced by this):
  ```bash
  vercel dev        # runs both services together locally, from the repo root
  ```
- Manage environment variables: `vercel env add <NAME> <production|preview|development>`,
  `vercel env ls` (lists names/scopes only, never prints secret values)
- Git (local only — no remote configured, see "Phase 7 findings"):
  `git status` / `git log --oneline` / `git diff --cached --stat`. Before
  ever adding a remote or pushing: `git ls-files | grep env` should show
  only `backend/.env.example` and `frontend/.env.example`.

## Phase V3.6 findings — Groq AI chatbot

**What changed**
- `llm_service.py`: new `groq` provider (OpenAI-compatible endpoint
  `https://api.groq.com/openai/v1/chat/completions`). For gpt-oss models:
  `reasoning_effort="low"`, `include_reasoning=false`, `max_tokens=1200`
  (hidden reasoning tokens count against the completion budget — measured
  ~75–100 reasoning tokens even for a five-word reply). Temperature 0.4 →
  0.2 for steadier grounding. Timeout 20s → 25s (free-tier queue time was
  observed up to ~17s once). One retry on HTTP 429 only when `retry-after`
  ≤ 2s; otherwise the request falls back. Empty content raises → fallback.
- `knowledge_service.py`: token overlap is now IDF-weighted across
  sections. Fixes the known "generic word" weakness — e.g. "What technology
  do you use?" previously matched FAQ entries on the word "do" and missed
  the tech-stack section; "a poem about launch day" no longer pulls in the
  "5. Launch" process step. All locked business-fact tests unchanged and
  passing.
- `capabilities.md`: heading "Technical range" → "Technology, tech stack and
  technical range" (retrieval only; no new facts).
- `chat_service.py` system prompt: stay close to the knowledge (no added
  steps/deliverables/durations/tools), don't stretch a fact beyond its
  stated scope, treat follow-ups about the studio as studio questions,
  label general industry context explicitly ("In general"), ~200-word
  default length.
- **Test isolation bug fixed**: `tests/conftest.py` popped the `LLM_*` /
  `EMAIL_*` env vars, but pydantic-settings then read them from
  `backend/.env` — once a real key was in `.env`, the suite called real
  Groq. They are now set to empty strings (env vars beat `.env`).

**Real AI quality results (live Groq)**: services → exactly the three
locked services; technology → React/TypeScript, FastAPI, PostgreSQL;
pricing → not published, scoped individually (no figures); process → the
five steps; recursion in Java and "build an AI chatbot" → normal general
answers; mixed → studio services and general AI ideas in separate labelled
parts; follow-ups ("the second step", "that for iOS") resolved from
history; office location / team size / client names → "not documented",
nothing invented; poem / database-design questions → no studio content
forced in; prompt-injection request for the key/system prompt → refused.

**Plain-text answers**: the chat widget renders `whitespace-pre-wrap`
plain text, but gpt-oss answers in Markdown — the first production smoke
test showed literal `**Websites**` in the widget. Fixed backend-only
(no UI change): system-prompt rule 9 asks for plain text, and
`chat_service._to_plain_text()` strips leftover bold markers, heading
hashes and code-fence lines from LLM answers (code itself is kept).

**Deployment**: commit `cefff20` → preview (Groq answers verified via
`vercel curl`) → production; then `a3a14fa` (plain-text fix) → production;
then `73f5f43` (pricing fix) → production — the final deployment, re-smoke-
tested with the checks below.
Production smoke: homepage 200 + sections present; chatbot opens; general
(recursion, TCP/UDP), portfolio (services), pricing (no figures), mixed and
follow-up (name prompt declined with "skip") answered by `source: llm`;
chat API 500 → widget shows "Something went wrong. Please try again.";
422 on empty / too-long / malformed requests; no console errors, no HTTP
≥400, no `localhost`, no `gsk_` / key / provider name in HTML or JS
bundles. `/api/chat-lead` was blocked at the network layer in the browser
test, so no production rows were written.

**Pricing**: after the first deploy, "How much does a website cost with
you?" said the studio has no published pricing but then added "In general"
market ranges ("a few thousand dollars … tens of thousands"), which reads
as a price anchor. System-prompt rule 3 now forbids price figures or cost
ranges entirely for studio questions; re-verified in production.

**Known limitations**
- An explicitly general market question ("what does a typical website cost
  in general?") can still get broad industry ranges — never presented as
  the studio's prices.
- The model occasionally elaborates a studio step with industry-typical
  activities (e.g. "wireframes" for the UI/UX step, whose knowledge text
  says "flows, structure"). It does not invent prices, clients, timelines,
  team size or metrics in testing.
- Free-tier 8K tokens/min ≈ a few chats/minute across all visitors; bursts
  beyond that fall back to knowledge-base answers.
- Keyword retrieval (now IDF-weighted) still can't resolve ordinal
  follow-ups like "the second step" by itself; the model resolves them from
  history.

