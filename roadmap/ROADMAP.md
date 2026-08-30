# smil-2-gif Roadmap

Story cards with statuses, acceptance criteria, and proposal § refs. One story
at a time — a story is done only when **confirmed implemented** (acceptance
met + checks green + user sign-off).

Story statuses: ⬜ backlog / 🔄 in progress / ✅ done

## Current state

The pipeline works end-to-end: SMIL SVG diagrams → GIF/WebM/MP4 and React
mockups (real ui-components-library components) → video, both captured
deterministically (SMIL `setCurrentTime` / shared demo clock) and verified by
fail-loud checks. HTML review artifacts mode added (2026-08-30): standalone
pages under `html/` that never go through the gif pipeline. **Next: automate
the client showcase** — demonstrate mock pages built from real components
(S-06).

---

### S-01 — SVG diagram pipeline ✅

- **Status:** ✅ 2026-08-14
- **Goal:** Produce animated diagrams as deliverable media from TS-authored SMIL SVGs.
- **Deliverables:** `src/diagrams/{hero-terminal,architecture}/gen.ts` → svg; `scripts/svg-to-gif.mjs`; shared `scripts/lib/encoder.mjs`.
- **Acceptance:** `npm run gif:hero` / `npm run gif:architecture` produce loop-synced GIFs; playback checks pass.
- **Design refs:** proposal §3 (export chain), §7 (SMIL requirements)
- **Hand-off:** None

### S-02 — React mockup pipeline ✅

- **Status:** ✅ 2026-08-18
- **Goal:** Author real web-page mockups in React and export them as deterministic video.
- **Deliverables:** `src/mockups/chart-lab/Mockup.tsx` (library components + TanStack Charts + `useDemoClock`); `scripts/mockup-to-video.mjs`; `/?isolated=<name>` mode; `window.__demoClock` bridge.
- **Acceptance:** `npm run video:chart-lab` produces mp4/webm/gif; what you review is what you export (review == export).
- **Design refs:** proposal §2 (React mockups), §3 (deterministic capture)
- **Hand-off:** None

### S-03 — Fail-loud verification ✅

- **Status:** ✅ 2026-08-29
- **Goal:** A diagram is not exportable until layout/timing assertions pass.
- **Deliverables:** `scripts/check-<name>.mjs` (text bboxes, zone opacity, flow paths) + `scripts/playback-*.mjs`.
- **Acceptance:** `npm run check:<name>` fails loudly on a broken diagram; green = safe to export.
- **Design refs:** proposal §4 (verification philosophy)
- **Hand-off:** None

### S-04 — memory-hierarchy diagram ✅

- **Status:** ✅ 2026-08-29
- **Goal:** The memory-hierarchy infographic as a delivered diagram (static + ambient).
- **Deliverables:** `src/diagrams/memory-hierarchy/{gen.ts,memory-hierarchy.svg}`; `npm run gif:memory-hierarchy`.
- **Acceptance:** check passes; gif/webm exported.
- **Design refs:** proposal §2 (SMIL diagrams)
- **Hand-off:** None

### S-05 — HTML review artifacts ✅

- **Status:** ✅ 2026-08-30
- **Goal:** A "just html" authoring mode — standalone review pages that never go through the gif pipeline.
- **Deliverables:** `html/` (`memory-hierarchy-v2.html`, `context-linker-sketch.html`, `motherboard.html`); links from the review page.
- **Acceptance:** each page opens standalone (inline CSS, no build); the gif pipeline never touches `html/`.
- **Design refs:** proposal §2 (HTML review artifacts)
- **Hand-off:** [handoffs/01-html-review-artifacts.md](handoffs/01-html-review-artifacts.md)

### S-06 — Client showcase automation ⬜

- **Status:** ⬜ backlog
- **Goal:** The project's main purpose — automate a showcase that demonstrates mock pages built from real components, so clients see how the generator works.
- **Deliverables:** a showcase mode (script + entry) producing a deterministic showcase artifact (HTML and/or video) that presents diagrams + mockups as client-facing deliverables.
- **Acceptance:** one command (`npm run showcase`) produces the artifact deterministically; a page built from a real ui-components-library component renders and is captured; the showcase is the client-facing surface.
- **Design refs:** proposal §5 (client showcase automation), `docs/development.md` (confirmed implementation plan — shared infographic authoring layer + reference artifact, §9 work sequence)
- **Hand-off:** pending
