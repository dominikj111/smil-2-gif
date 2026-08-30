# smil-2-gif — Proposal

The design contract for the animated mockup & showcase generator. Authoritative
when implementation conflicts with the current code; amended deliberately.

## 1. Purpose

Client deliverables built in-house, not with Figma: animated mockups and
diagrams, captured deterministically into finished media (GIF/WebM/MP4) and
standalone HTML review pages. The pipeline is the quality gate — nothing
half-finished reaches a client. Future: an automated showcase demonstrating
mock pages built from real components.

## 2. Authoring front-ends

- **SMIL SVG diagrams** — `src/diagrams/<name>/gen.ts` (TS generator emitting
  an SVG string via `generate()`). Animated with SMIL (`animate` /
  `animateMotion`); loop period T equals the export duration.
- **React mockups** — `src/mockups/<name>/Mockup.tsx`, built from
  `@ui-components-library/react` components + TanStack Charts, driven by the
  shared demo clock (`useDemoClock`). `/?isolated=<name>` renders only that
  mockup full-window — what the exporter drives.
- **HTML review artifacts** — `html/` standalone pages (inline CSS, no build,
  no export contract). The "just html" mode for diagram/reasoning iterations
  that should not become gifs.

## 3. Export chain — deterministic capture

Playwright opens the artifact at native size (`deviceScaleFactor` for crisp
text). Per frame the timeline is **sought, never played**:

- diagrams: `svg.pauseAnimations()` then `svg.setCurrentTime(i/fps)` — without
  the pause the timeline drifts while screenshots are taken;
- mockups: `window.__demoClock` is injected **before** app scripts; the
  library's `useDemoClock` detects the bridge and the exporter advances with
  `driver.step(dt)` per frame (double rAF settle so React commits + canvas
  redraws);

then a screenshot → shared encoder (`scripts/lib/encoder.mjs`) → ffmpeg
(palettegen/paletteuse for GIF, `-gifflags -offsetting-transdiff` for full
frames) → gifsicle -O3. Wall-clock animation is forbidden — review must equal
export.

## 4. Verification philosophy

Fail-loud checks per diagram (`scripts/check-<name>.mjs`): text bounding boxes
fit the canvas, every zone visible (opacity 1) at all sampled times, flow
paths keep expected opacities. A check failure blocks export. Playback checks
assert the exported GIF itself.

## 5. Future — client showcase automation

Automate a showcase that demonstrates mock pages built from real components:
one command → a deterministic showcase artifact (HTML and/or video) presenting
the diagrams and mockups as client-facing deliverables.

## 6. Non-goals

Not a component library (ui-components-library is), not a business product,
not production web — a deliverable generator.

## 7. SMIL requirements (learned the hard way)

- Use **SMIL, not CSS animations** — `setCurrentTime()` only seeks the SMIL timeline.
- Instant appear/hide needs a zero-length keyTimes segment: `0; a; a; b; b; 1`.
- Put `<animate>` **inside** the element it animates (a sibling animates the parent).
- Uniform period T with `repeatCount="indefinite"`; export duration equals T.
