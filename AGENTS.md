# AGENTS.md — smil-2-gif

## Purpose

Animated mockup & showcase generator for client deliverables: diagrams (SMIL
SVG authored in TS) and mock pages (React, real ui-components-library
components) captured deterministically into GIF/WebM/MP4, plus standalone HTML
review artifacts. Nothing half-finished gets exposed to clients — the pipeline
is the gate. Success: a finished, check-verified media file (or review page)
per diagram/mockup.

## Navigation

| Need | Read |
|------|------|
| Understand the pipeline | `README.md` |
| Design contract & decisions | `docs/proposal.md` → `docs/index.md` |
| What's done / what's next | `roadmap/ROADMAP.md` + newest `roadmap/handoffs/` |
| Author a diagram | `src/diagrams/<name>/gen.ts` (TS generator → svg) |
| Author a mockup | `src/mockups/<name>/Mockup.tsx` (React + library components, `useDemoClock`) |
| Export + verification | `scripts/` (`svg-to-gif.mjs`, `mockup-to-video.mjs`, `check-*.mjs`) |
| HTML review artifacts | `html/` — standalone pages, never through the pipeline |

## Rules

- `html/` = review-artifact mode: **never** run through the gif/video pipeline
  or export — these are the "just html" deliverables.
- Sources are authored (`gen.ts` / `Mockup.tsx`); outputs (`gifs/`, `html/`)
  are generated — never hand-edit an output.
- A diagram is not exportable until `npm run check:<name>` passes (fail-loud:
  text bboxes in canvas, zones visible at all sampled times, flow paths keep
  opacities).
- ui-components-library is consumed as raw TS via the vite aliases — changing
  the alias contract needs a matching library change, not just here.
- Infographic diagrams stay **generic, never personal** — no first person, no
  private business data that could leave the machine.
- Capture is deterministic only: SMIL `setCurrentTime()` for diagrams, the
  shared demo clock (`useDemoClock` / `window.__demoClock`) for mockups. Never
  wall-clock animation.
- **Not** a component library (that is ui-components-library), not a business
  product, not production web — a deliverable generator.

## Workflow

Read the current story card + latest hand-off → the proposal §N cited on the
card → smallest coherent change → validate (checks + typecheck + gen).

## Validation

- `npm run typecheck` · `npm run gen` (regenerates all SVGs)
- `npm run check:<name>` — fail-loud diagram verification
- `npm run gif:<name>` / `npm run video:<name>` — export to `gifs/`

## Context

TypeScript-functional, web-frontend and ICM/MWP guidelines (workspace profile,
by topic name). Design lives in `docs/`, status in `roadmap/`; do not duplicate
the profile's conventions here.
