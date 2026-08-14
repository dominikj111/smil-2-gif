# smil-2-gif

Animated mockup pipeline: **diagrams and web-page mockups → GIF/WebM/MP4**.
One deterministic frame pipeline, two authoring front-ends:

```
┌─ Authoring front-end #1: SMIL SVG diagrams ─────────────────────────────┐
│ src/diagrams/<name>/gen.ts   TS generator ── npm run gen ──►  *.svg     │
│                                   │                                     │
│        review (npm run dev) ◄─────┴─────►  gifs/<name>.gif (npm run gif:<name>) │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Authoring front-end #2: React mockups ─────────────────────────────────┐
│ src/mockups/<name>/Mockup.tsx   real components (ui-components-library, │
│                                  TanStack Charts, useDemoClock)          │
│                                   │                                      │
│        review (npm run dev) ◄─────┴─────► gifs/<name>.mp4/webm/gif       │
│                                            (npm run video:<name>)        │
└──────────────────────────────────────────────────────────────────────────┘
```

The canonical artifact of each mockup is the **React component itself** — the
same code runs live in the browser (client review) and is captured frame-by-frame
by the exporter (client deliverable). Nothing partially implemented leaks: the
deliverables are finished media files.

## Prerequisites

- Node ≥ 23.6 (native TS type-stripping is used by the generator runner)
- `ffmpeg` on PATH
- `gifsicle` on PATH (optional; the npm `gifsicle` devDependency provides it as
  `node_modules/.bin/gifsicle`)
- Playwright Chromium: `npx playwright install chromium` (after `npm install`)
- `ui-components-library` at `/development/ui-components-library` (consumed as
  raw TS source via Vite aliases, like the library's own dev playground)

## Diagrams (SMIL authoring)

| Diagram | Source | Loop | Notes |
|---------|--------|------|-------|
| `hero-terminal` | `Hero.tsx` (`TerminalDemo`) | 7.5s | sequential log rows + cascade detection |
| `architecture` | `Architecture.tsx` | 12.5s | SurfLogs data-flow diagram; hover interactions converted to a timed showcase |

Workflow:

1. **Author** — edit `src/diagrams/<name>/gen.ts` to produce an SVG string via
   `generate()`. Add a `gif:<name>` script to `package.json`.
2. **Generate** — `npm run gen` writes `src/diagrams/<name>/<name>.svg`.
3. **Review** — `npm run dev` (Vite); SMIL animations run live.
4. **Export** — `npm run gif:<name>`:

   ```bash
   node scripts/svg-to-gif.mjs input.svg output.gif [options]
   ```

   Options: `--duration`, `--fps`, `--width/--height`, `--scheme`,
   `--format gif|webm|mp4`, `--scale-strategy`, `--dpr`, `--palette/--no-palette`,
   `--dither`, `--no-gifsicle`, `--preview <path> [--preview-at <sec>]`.
   Defaults from `svg-to-gif.config.json`, overridden by CLI flags.

## Mockups (React authoring)

Author a real web page mockup as a React component in
`src/mockups/<name>/Mockup.tsx`, built from `@ui-components-library/react`
components, TanStack Charts, and `useDemoClock`. The dev page mounts every
mockup in a gallery (plus an isolated full-window mode at `/?isolated=<name>`
that the exporter drives).

Export:

```bash
npm run video:chart-lab    # mp4 (primary client deliverable)
npm run webm:chart-lab     # webm
npm run gif:chart-lab      # gif — small loops only; UI churn makes GIFs huge
node scripts/mockup-to-video.mjs --mockup chart-lab --duration 8 --fps 30 \
  --width 1200 --height 720 --format mp4 --preview gifs/chart-lab.png
```

Options: `--mockup <name>`, `--duration`, `--fps`, `--width/--height`,
`--scheme`, `--format`, `--out`, `--dpr`, `--preview`, `--preview-at`,
`--port` (Vite dev port; ephemeral by default), `--url <url>` (reuse a running
server), `--keep-frames <dir>` (debug), `--wait <ms>`.

### How mockup capture works

- The exporter starts an in-process Vite dev server and opens
  `/?isolated=<mockup>` — only that mockup, full-window, `.dark` theme class.
- It injects `window.__demoClock` **before** app scripts run. The library's
  `useDemoClock` hook detects the bridge, hands it a driver, and stops its
  `requestAnimationFrame` loop. The exporter then advances the timeline
  deterministically with `driver.step(dt)` per frame — the exact analogue of
  SMIL `svg.setCurrentTime()` in the diagram mode. Live browser mode uses the
  same hook via rAF, so what you review is what you export.
- After each step it settles (double rAF so React commits and the canvas
  redraws), screenshots, and hands the PNG frames to the shared encoder.

### useDemoClock (in ui-components-library)

`useDemoClock({ duration, loop })` — a module-level, steppable demo clock. Every
hook on the page shares one timeline; each maps the global phase onto its own
`duration`. Transport controls via `useDemoClockTransport()` (play/pause/
restart/speed). See the library playground page `/demo-clock`.

### TanStack Charts

`chart-lab` uses the Canvas surface (`@tanstack/charts/react/canvas`): marks
(`lineY`/`areaY`/`barY`/`dot`) consume data, channels describe encodings, and
scales come from compact subpaths (`@tanstack/charts/scales/*`). The definition
is memoized and rebuilt only when captured data or visual policy changes
(definition identity is the update boundary). Live-streamed data is passed
directly — no tweening (motion would imply false continuity).

## Shared encoder

`scripts/lib/encoder.mjs` owns option parsing/validation, the deterministic
frame-capture loop (progress + preview), and ffmpeg/gifsicle encoding for
GIF/WebM/MP4. Both front-ends call it; new authoring modes just provide a
different `perFrame(t)` timeline driver.

## How the SMIL converter works

- Loads the SVG into headless Chromium (Playwright) at native size with
  `deviceScaleFactor` for crisp text.
- `svg.pauseAnimations()` freezes the SMIL timeline — **essential**. Without it
  the timeline keeps playing while screenshots are taken, so each frame drifts
  forward (the slow first frame drifts 0.5s+ and the loop wraps at the end).
- Per frame: `svg.setCurrentTime(i / fps)` → screenshot → ffmpeg encodes
  (palettegen + paletteuse for GIF), then `gifsicle -O3`.

## SMIL requirements & gotchas (learned the hard way)

- **Use SMIL, not CSS animations.** `setCurrentTime()` only seeks the SMIL timeline.
- SMIL interpolates between adjacent `keyTimes`. For an *instant* appear/hide use a
  zero-length segment (duplicate keyTime): `keyTimes="0; a; a; b; b; 1" values="0; 0; 1; 1; 0; 0"`.
- Put `<animate>` **inside** the element it animates. Emitted as a sibling it animates
  the *parent*, silently corrupting whole groups.
- Loop pattern: give every animation `dur="T" repeatCount="indefinite"` with the same
  period T, so seeking and looping stay in sync. `--duration` for export should equal T.
- ffmpeg's gif muxer writes delta patches + transparency by default, which confuses some
  decoders; the converter passes `-gifflags -offsetting-transdiff` to force full frames.

## Layout

```
src/diagrams/<name>/gen.ts          SMIL diagram generator (exports generate())
src/diagrams/<name>/<name>.svg      generated artifact (committed)
src/mockups/<name>/Mockup.tsx       React mockup (default export; isolated at ?isolated=<name>)
src/main.tsx                        review page: diagram + mockup galleries, transport strip
scripts/gen-all.mjs                 runs all generators
scripts/svg-to-gif.mjs              SMIL authoring → frames → encoder
scripts/mockup-to-video.mjs         React mockup authoring → frames → encoder
scripts/lib/encoder.mjs             shared capture loop + ffmpeg/gifsicle encoding
scripts/check-*.mjs                 layout/timing assertions per diagram
scripts/playback-*.mjs              browser playback assertions per GIF
gifs/                               output (gitignored)
```
