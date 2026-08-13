# smil-2-gif

Animated SVG diagrams (SMIL) → GIF/WebM/MP4. A tiny authoring pipeline for animated SVG diagrams:

```
src/diagrams/<name>/gen.ts   TS generator  ── npm run gen ──►  src/diagrams/<name>/<name>.svg
                                                                    │
                                        ┌───────────────────────────┼───────────────────────────┐
                                        ▼                           ▼                           ▼
                        review in browser (npm run dev)   gifs/<name>.gif (npm run gif:<name>)   automated checks
```

The canonical artifact is the **standalone SVG** (with SMIL animations). The same file is
reviewed live in the browser and fed to the converter — no duplication.

## Prerequisites

- Node ≥ 23.6 (native TS type-stripping is used by the generator runner)
- `ffmpeg` on PATH
- `gifsicle` on PATH (optional; the npm `gifsicle` devDependency provides it as
  `node_modules/.bin/gifsicle`, which npm scripts can see)
- Playwright Chromium: `npx playwright install chromium` (after `npm install`)

## Diagrams

| Diagram | Source | Loop | Notes |
|---------|--------|------|-------|
| `hero-terminal` | `Hero.tsx` (`TerminalDemo`) | 7.5s | sequential log rows + cascade detection; row appear times from `STEP_DELAYS` |
| `architecture` | `Architecture.tsx` | 12.5s | SurfLogs data-flow diagram; hover interactions converted to a timed showcase: default → Browser → Lambda → IoT → Hub → Worker → Sensor → App Server |

## Workflow

1. **Author** — edit `src/diagrams/<name>/gen.ts` to produce an SVG string via `generate()`.
   Add `scripts` to `package.json` for convenience (`gif:<name>`).

2. **Generate** — `npm run gen` writes `src/diagrams/<name>/<name>.svg` for every diagram.

3. **Review** — `npm run dev` (Vite). `src/main.ts` auto-discovers all `*.svg` under
   `src/diagrams/` and embeds them on a dark page; SMIL animations run live. Edit the
   generator and the page hot-reloads.

4. **Verify layout/timing** — `node scripts/check-hero.mjs` checks text overflow, cascade
   fit, and per-row appear timing (fast, no GIF needed).

5. **Export GIF** — `npm run gif:architecture` produces `gifs/architecture.gif`:

   ```bash
   node scripts/svg-to-gif.mjs input.svg output.gif [options]
   ```

   Options: `--duration <sec>`, `--fps <n>`, `--width/--height <px>`, `--scheme`,
   `--format gif|webm|mp4`, `--scale-strategy`, `--dpr <n>` (capture supersampling,
   default 2), `--palette/--no-palette`, `--dither none|bayer|sierra2_4a` (GIF
   dithering; `none` is smaller but bands gradients), `--no-gifsicle`,
   `--preview <path> [--preview-at <sec>]` (dump one PNG frame for a fast check).
   Defaults come from `svg-to-gif.config.json`, overridden by CLI flags.

   Size notes: the architecture GIF is ~2 MB at 24 fps — the moving dots and
   pulsing rings change many pixels per frame, so GIF compression is limited.
   Lower fps (15-20) or a smaller `--width` to shrink it.

6. **Verify playback** — `node scripts/playback-check.mjs` (hero) / `node scripts/playback-architecture.mjs` (architecture) play the GIF in Chromium and
   assert the visible timeline (row appear times, cascade, loop reset / phase dimming).

## How the converter works

- Loads the SVG into headless Chromium (Playwright) at native size with
  `deviceScaleFactor` for crisp text.
- `svg.pauseAnimations()` freezes the SMIL timeline — this is **essential**. Without it
  the timeline keeps playing while screenshots are taken, so each frame drifts forward
  (the slow first frame drifts 0.5s+ and the loop wraps at the end).
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
src/diagrams/<name>/gen.ts   generator (exports `generate(): string`)
src/diagrams/<name>/<name>.svg   generated artifact (committed)
scripts/gen-all.mjs          runs all generators
scripts/svg-to-gif.mjs       Playwright + ffmpeg converter
scripts/check-hero.mjs       layout/timing assertions for the hero-terminal diagram
scripts/check-architecture.mjs   phase-by-phase opacity assertions for architecture
scripts/playback-check.mjs   browser playback assertions for a hero GIF
scripts/playback-architecture.mjs   browser playback assertions for the architecture GIF
gifs/                        output (gitignored)
```

## Porting hover interactions (Architecture.tsx)

The React diagram dims everything except the hovered zone (opacity helpers like
`sourcePathOpacity`, `hubZoneOpacity`, ...). For the GIF these become a timed
loop: `PHASES` in `gen.ts` lists `[phase, startTime]` pairs, and the `curve()`
helper turns any `(phase) => value` function into a keyTimes/values animation
with 0.25s fades at phase boundaries. Add a phase → the whole diagram follows.
