# Redesign — "The site that builds itself"

Branch: `redesign/builds-itself`

Most studio sites show finished work. This one shows the work **being made**,
in front of the visitor. The page opens on a blank sheet of paper, sketches
an idea, straightens it into a wireframe, floods it with real design, exposes
the code underneath, and ships it — the studio's own process
(Idea → UI/UX → Design → Development → Launch) told by the page itself.

The site still *ends* dark with one accent (see `docs/goal.md`); only the
opening is on paper. Every feature below is an enhancement: with
`prefers-reduced-motion`, on touch, or with JS slow to start, the visitor
gets the finished design and every link still works.

Unchanged by the redesign: the three services, CONCEPT / EXPERIMENTAL labels,
the content-honesty rules, the Studio Assistant chatbot and its backend, ⌘K.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## 1. Build-sequence hero (replaces Hero + Process)

- [x] **1.1 Paper opening** — the first screen is a warm off-white sheet with
  a faint ruled grid, not the dark screen everyone expects.
- [x] **1.2 Self-scribbling headline** — "Have an idea?" draws itself on the
  page in handwriting, followed by doodles: a circled word, an arrow, a
  lightbulb, a sticky note.
- [x] **1.3 Pencil cursor + graphite trail** — on a mouse, the cursor becomes
  a pencil while the page is still a sketch, and leaves a faint trail that
  fades away. Mouse only; never replaces the native cursor on links.
- [x] **1.4 Scroll-driven build, five stages** — the hero pins and the scroll
  runs the process on one artboard:
  - **Idea** — loose, wobbly pencil sketch of a website.
  - **UI/UX** — the wobble settles; lines snap straight into a labelled
    grey wireframe.
  - **Design** — colour and real type flood in; the paper turns into the
    dark interface.
  - **Development** — an X-ray lens follows the cursor and shows the layout
    lines and component code under the finished UI (it wanders on its own on
    touch).
  - **Launch** — a deploy log ticks to "live ✓" and the CTAs come alive.
- [x] **1.5 Stage rail** — a side rail names the five stages with a progress
  line, carrying the old Process copy and the "one dedicated team" line, so
  the separate Process section can go.
- [x] **1.6 Reduced-motion / no-JS fallback** — no pinning, no scribbling:
  the finished hero renders directly, with the same h1, text and CTAs.
- [x] **1.7 Retire the old intro** — remove the Preloader (the hero is the
  intro now) and the old Process section; update the hero tests.

## 2. Fidelity dial (site-wide)

- [ ] **2.1 Dial in the nav** — three positions: Sketch / Wireframe / Final.
- [ ] **2.2 Whole-site redraw** — flipping the dial redraws every section at
  that fidelity: pencil-and-paper, grey boxes with labels, or finished design.
- [ ] **2.3 Remember the choice** for the session (per-viewer convenience
  only; the page defaults to Final).
- [ ] **2.4 Keyboard + screen-reader friendly** — a real radio group, with
  the content itself unchanged at every fidelity.

## 3. Selected Work — "Five ideas, five different worlds"

Replaces the old one-project-at-a-time scroll track (too much scrolling).

- [x] **3.1 One screen, no scroll track** — all five projects at once in a
  bento collage on desktop; a sideways swipe on mobile.
- [x] **3.2 Live mini-sites, not screenshots** — each tile is a small working
  UI built in code, each in a completely different visual language:
  - **AI Workspace** — dark chat app; the answer streams in, a chart builds.
  - **Maison** — cream, serif luxury storefront; "add to bag" works.
  - **Pulse** — black/green trading terminal; prices tick live.
  - **Atlas** — phone app with swipeable stay cards.
  - **Flow** — lime node canvas; drag nodes and the wires follow.
- [x] **3.3 Cobalt section + brand takeover** — the section is cobalt blue;
  hovering a project floods the whole section in that project's colours.
- [x] **3.4 "Open case" overlay** — full-screen case view per project (image,
  description, tags), keyboard and Esc friendly.
- [x] **3.5 Keep CONCEPT / EXPERIMENTAL labels** on every tile and in the case
  view, plus the "not real client work" line.
- [x] **3.6 Calm when needed** — loops pause off-screen; reduced motion shows
  each mini-site in a still, finished state.

## 4. Services — three drawn objects

- [ ] **4.1 Browser, phone, pen tool** — each of the three services is a
  hand-drawn object that "inks in" as it enters the view.
- [ ] **4.2 Exactly three services** — no new ones (see `docs/goal.md`).

## 5. Under the hood — the X-ray lens

- [ ] **5.1 The section *is* the lens** — moving over it reveals this site's
  real stack and layout underneath the finished surface.
- [ ] **5.2 Real stack only** — no vendor or hosting names.

## 6. FAQ — margin notes

- [ ] **6.1 Questions as handwritten margin notes** that expand into answers.
- [ ] **6.2 Stay in sync** with `backend/app/knowledge/faq.md`.

## 7. Final CTA — "Your idea goes here"

- [ ] **7.1 A blank sheet** the visitor types their idea onto.
- [ ] **7.2 Hand off** — one click sends that text to the Studio Assistant
  or WhatsApp, already filled in.

## 8. Site-wide polish

- [ ] **8.1 Nav restyle** to match the new language (and host the dial).
- [ ] **8.2 Footer restyle.**
- [x] **8.3 Cursor** — the ring cursor hides while the pencil is active.
- [ ] **8.4 Performance pass** — no layout thrash on scroll, images lazy,
  canvas/filters paused off-screen.
- [ ] **8.5 Full Playwright suite green**, plus fresh screenshots at
  mobile, tablet and desktop.
- [ ] **8.6 Update `docs/goal.md` / `docs/memory.md`** with the new
  structure once it settles.
