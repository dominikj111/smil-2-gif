# smil-2-gif

Animated mockup & showcase generator for client deliverables — diagrams (SMIL
SVG) and mock pages (React, real ui-components-library components) captured
deterministically into GIF/WebM/MP4, plus standalone HTML review artifacts.

*Private project — client-deliverable tooling; the pipeline is the gate, nothing
half-finished gets exposed.*

## Requirements

- Node ≥ 23.6 (native TS type-stripping for the generator runner)
- `ffmpeg` + `gifsicle` on PATH (gifsicle also ships as an npm devDependency)
- Playwright Chromium: `npx playwright install chromium` (after `npm install`)
- `ui-components-library` at `/development/ui-components-library` (consumed as
  raw TS via vite aliases — the `vite.config.ts` alias contract is a dependency)

## Run dev

```bash
npm install
npm run dev        # localhost:5173 — review page (diagram + mockup galleries)
```

## Author a diagram (SMIL SVG)

1. Write `src/diagrams/<name>/gen.ts` (`generate()` → SVG string; SMIL, not CSS).
2. `npm run gen` → writes `src/diagrams/<name>/<name>.svg`.
3. Review in the dev page; verify: `npm run check:<name>`.
4. Export: `npm run gif:<name>` / `npm run video:<name>` → `gifs/`.

## Author a mockup (React)

1. Write `src/mockups/<name>/Mockup.tsx` (library components + `useDemoClock`).
2. Export: `npm run video:<name>` (mp4 — primary deliverable), `webm:`, `gif:`.

## HTML review artifacts

Standalone pages in `html/` (inline CSS, no build) — linked from the review
page under "HTML artifacts". These never go through the gif pipeline.

## Similar tools

- Storybook / Ladle — component showcase dev servers (this repo *captures*, it
  does not host)
- Figma — the external tool this pipeline replaces for animated deliverables
- playwright-video / ffmpeg — the capture substrate underneath

## For contributors

- Design contract: `docs/proposal.md` → `docs/index.md` (export chain §3,
  checks §4)
- Status & stories: `roadmap/ROADMAP.md` + `roadmap/handoffs/`
- AI operating rules: `AGENTS.md` (loaded every session — read it first)
- Read order for new work: current story card + latest hand-off → proposal §N →
  trace before abstracting → smallest coherent change → validate.
