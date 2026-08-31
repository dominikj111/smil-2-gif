/**
 * memory-hierarchy — "the memory hierarchy" of a local LLM workflow.
 *
 * Story: how an LLM agent is steered locally.
 *   L1 internal weights · L2 fine-tuned weights live inside the model, L3 =
 *   the provider cache; the authored files — the ICM layer (AGENTS.md global
 *   router + the engineering / operations / ideas workspaces) — and the chat
 *   session it feeds. The session assembles a narrow scoped prompt and sends
 *   it to the LLM provider. A memory pipeline keeps the knowledge base
 *   alive: three paths, one shape. Column 1 — the mirror (self · facts):
 *   profile learning (auto) → personas + distillation (weekly) →
 *   CONVERGING MIRROR. Column 2 — the workspaces (practice · global):
 *   note-taking global (auto) → melt (weekly) → CONVERGING WORKSPACES.
 *   Column 3 — the project knowledge (local): note-taking project (auto) →
 *   melt (weekly, same skill) → CONVERGING PROJECT KNOWLEDGE (docs · AGENTS ·
 *   proposals). Every path: auto capture → weekly consolidation → narrowed
 *   surface. The results: 1.3B tokens/28d, 98.8% cache,
 *   ~$20/month — and a moat (providers approximate, never clone).
 *
 * Static diagram with ambient motion: every section stays fully visible and
 * readable at all times — only the flow dots (and the provider's cache glow)
 * move. Loop period 12s keeps every dot cycle (0.8/1.2s) and the 3s glow
 * seamless at the wrap.
 */

const W = 960
const H = 790

// ── palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#020617',
  card: '#1e293b',
  cardStroke: '#334155',
  dim: '#94a3b8',
  faint: '#475569',
  containerStroke: '#2d3f55',
  nn: '#a78bfa', // violet — inside the model
  icm: '#f77f00', // orange — the authored layer
  sky: '#60a5fa', // routing / session
  pipe: '#34d399', // memory pipeline
  res: '#fbbf24', // results / money
  orange: '#fb923c',
}

// ── layout ──────────────────────────────────────────────────────────────────
const LEFT = { x: 10, y: 60, w: 280, h: 304 } // zone: the ICM layer
const L3 = { x: 16, y: 84, w: 268, h: 272 } // the files card
const AGENTS = { x: 26, y: 134, w: 248, h: 42 } // global router row, inside L3
const WS_ROWS = [
  { y: 198, label: 'engineering', sub: 'patterns & techniques · enforced', accent: C.nn },
  { y: 240, label: 'operations', sub: 'decisions · reasoning · standups · wiki', accent: C.pipe },
  { y: 282, label: 'ideas', sub: 'future opportunities — a bin for the head', accent: C.orange },
]
const MID = { x: 306, y: 60, w: 300, h: 304 } // zone: the session
const SESSION = { x: 312, y: 140, w: 288, h: 90 }
const RIGHT = { x: 622, y: 60, w: 328, h: 304 } // zone: the model
const L1 = { x: 642, y: 108, w: 290, h: 46 } // behind the provider
const L2 = { x: 642, y: 242, w: 290, h: 46 } // behind the provider
const PROVIDER = { x: 656, y: 150, w: 262, h: 96 }
const PIPELINE = { x: 10, y: 374, w: 940, h: 306 } // three paths, one shape: auto → weekly → narrowed surface
// column 1 — the mirror (self · facts)
const PROFILE = { x: 50, y: 400, w: 260, h: 40 }
const PERSONAS = { x: 50, y: 448, w: 260, h: 40 }
const DISTILL = { x: 50, y: 496, w: 260, h: 40 }
const MIRROR = { x: 50, y: 560, w: 260, h: 40 }
// column 2 — the workspaces (practice · global)
const NOTE_GLOBAL = { x: 350, y: 400, w: 260, h: 40 }
const MELT_GLOBAL = { x: 350, y: 496, w: 260, h: 40 }
const WORKSPACES = { x: 350, y: 560, w: 260, h: 40 }
// column 3 — the project knowledge (local)
const NOTE_PROJECT = { x: 650, y: 400, w: 260, h: 40 }
const MELT_PROJECT = { x: 650, y: 496, w: 260, h: 40 }
const PROJECT_KNOWLEDGE = { x: 650, y: 560, w: 260, h: 40 }
const ICM_LABEL = { x: 50, y: 640, w: 860, h: 38 } // write-back target — inset, symmetric margins
const RESULTS = { x: 10, y: 690, w: 940, h: 92 }
const CHIPS = [
  { x: 50, big: '1.3B', sub: 'input tokens in 28 days' },
  { x: 350, big: '98.8%', sub: 'served from provider cache' },
  { x: 650, big: '≈ $20 / month', sub: '≈ 70¢ a day — full-time AI partner' },
]
const CHIP_W = 260
const CHIP_H = 42
const CHIP_Y = 708
const NOTE = { x: 50, y: 756, w: 860, h: 18 }

const tag = (x: number, y: number, s: string) =>
  `<text x="${x}" y="${y}" fill="${C.faint}" font-size="9.5" letter-spacing="0.09em">${s}</text>`

// ── sections ────────────────────────────────────────────────────────────────
function header(): string {
  return `
  <text x="16" y="28" fill="white" font-size="19" font-weight="700" letter-spacing="0.02em">THE MEMORY HIERARCHY</text>
  <text x="16" y="46" fill="${C.dim}" font-size="11.5">steering an LLM agent locally — files → session → model · three converging surfaces: the mirror · the workspaces · the project</text>`
}

function icmZone(): string {
  const wsRows = WS_ROWS.map((w) => `
  <g>
    <rect x="26" y="${w.y}" width="248" height="38" rx="8" fill="${C.card}" stroke="${C.cardStroke}" stroke-width="1"/>
    <rect x="26" y="${w.y}" width="4" height="38" rx="2" fill="${w.accent}" fill-opacity="0.6"/>
    <text x="38" y="${w.y + 16}" fill="white" font-size="12" font-weight="600">${w.label}</text>
    <text x="38" y="${w.y + 30}" fill="${C.dim}" font-size="9.5">${w.sub}</text>
  </g>`).join('\n')

  return `
  <g>
    <rect x="${LEFT.x}" y="${LEFT.y}" width="${LEFT.w}" height="${LEFT.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(LEFT.x + 8, LEFT.y + 14, 'THE ICM LAYER — PRIVATE')}
  </g>
  <g>
    <rect x="${L3.x}" y="${L3.y}" width="${L3.w}" height="${L3.h}" rx="10" fill="${C.card}" stroke="${C.icm}88" stroke-width="1"/>
    <rect x="${L3.x}" y="${L3.y}" width="4" height="${L3.h}" rx="2" fill="${C.icm}" fill-opacity="0.7"/>
    <text x="${L3.x + 12}" y="${L3.y + 24}" fill="white" font-size="13.5" font-weight="700">ICM — the files</text>
    <text x="${L3.x + 12}" y="${L3.y + 40}" fill="${C.dim}" font-size="10.5">authored · local · private</text>
    <rect x="${L3.x + L3.w - 28}" y="${L3.y + 34}" width="13" height="11" rx="2.5" fill="none" stroke="${C.res}" stroke-width="1.6"/>
    <path d="M ${L3.x + L3.w - 24} ${L3.y + 34} a 3.5 3.5 0 0 1 7 0" fill="none" stroke="${C.res}" stroke-width="1.6"/>
  </g>
  <g>
    <rect x="${AGENTS.x}" y="${AGENTS.y}" width="${AGENTS.w}" height="${AGENTS.h}" rx="8" fill="${C.card}" stroke="${C.sky}55" stroke-width="1"/>
    <rect x="${AGENTS.x}" y="${AGENTS.y}" width="4" height="${AGENTS.h}" rx="2" fill="${C.sky}" fill-opacity="0.7"/>
    <text x="${AGENTS.x + 12}" y="${AGENTS.y + 18}" fill="white" font-size="12" font-weight="600">AGENTS.md — global router</text>
    <text x="${AGENTS.x + 12}" y="${AGENTS.y + 32}" fill="${C.dim}" font-size="9">loaded into every session</text>
    <rect x="${AGENTS.x + AGENTS.w - 56}" y="${AGENTS.y + 10}" width="52" height="22" rx="11" fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.4)" stroke-width="1"/>
    <text x="${AGENTS.x + AGENTS.w - 30}" y="${AGENTS.y + 25}" text-anchor="middle" fill="${C.sky}" font-size="8.5" font-weight="600">routing</text>
  </g>
  <text x="26" y="190" fill="${C.faint}" font-size="9" letter-spacing="0.09em">THE WORKSPACES</text>
  ${wsRows}
  <text x="28" y="344" fill="${C.faint}" font-size="9">the source of truth — the cache is a copy, never the source</text>`
}

function sessionZone(): string {
  return `
  <g>
    <rect x="${MID.x}" y="${MID.y}" width="${MID.w}" height="${MID.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(MID.x + 8, MID.y + 14, 'THE SESSION')}
    <rect x="${SESSION.x}" y="${SESSION.y}" width="${SESSION.w}" height="${SESSION.h}" rx="10" fill="${C.card}" stroke="${C.sky}66" stroke-width="1"/>
    <rect x="${SESSION.x}" y="${SESSION.y}" width="4" height="${SESSION.h}" rx="2" fill="${C.sky}" fill-opacity="0.7"/>
    <text x="${SESSION.x + 14}" y="${SESSION.y + 28}" fill="white" font-size="13.5" font-weight="700">Chat session</text>
    <text x="${SESSION.x + 14}" y="${SESSION.y + 46}" fill="white" font-size="12" font-weight="600">session context</text>
    <text x="${SESSION.x + 14}" y="${SESSION.y + 64}" fill="${C.dim}" font-size="10">narrow, scoped prompt per task</text>
  </g>`
}

function modelZone(): string {
  const layerCard = (r: { x: number; y: number; w: number; h: number }, label: string, sub: string) => `
  <g>
    <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="9" fill="${C.card}" stroke="${C.nn}55" stroke-width="1"/>
    <rect x="${r.x}" y="${r.y}" width="4" height="${r.h}" rx="2" fill="${C.nn}" fill-opacity="0.6"/>
    <text x="${r.x + 14}" y="${r.y + 18}" fill="white" font-size="12" font-weight="600">${label}</text>
    <text x="${r.x + 14}" y="${r.y + 32}" fill="${C.dim}" font-size="9">${sub}</text>
  </g>`

  const provider = `
  <g>
    <rect x="${PROVIDER.x - 4}" y="${PROVIDER.y - 4}" width="${PROVIDER.w + 8}" height="${PROVIDER.h + 8}" rx="14" fill="none" stroke="rgba(251,191,36,0.5)" stroke-width="1.5" filter="url(#glow-amber)">
      <animate attributeName="opacity" values="0.12; 0.55; 0.12" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="${PROVIDER.x}" y="${PROVIDER.y}" width="${PROVIDER.w}" height="${PROVIDER.h}" rx="10" fill="${C.card}" stroke="rgba(251,191,36,0.55)" stroke-width="1"/>
    <rect x="${PROVIDER.x}" y="${PROVIDER.y}" width="4" height="${PROVIDER.h}" rx="2" fill="${C.res}" fill-opacity="0.7"/>
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 24}" fill="white" font-size="13.5" font-weight="700">LLM provider</text>
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 42}" fill="${C.dim}" font-size="10">narrow prompt only — files stay local</text>
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 58}" fill="${C.res}" font-size="10" font-weight="600">L3 = provider cache — the working set</text>
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 78}" fill="${C.faint}" font-size="9">L1 · L2 live inside the model</text>
  </g>`

  return `
  <g>
    <rect x="${RIGHT.x}" y="${RIGHT.y}" width="${RIGHT.w}" height="${RIGHT.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(RIGHT.x + 8, RIGHT.y + 14, 'THE MODEL — FIXED · SHARED')}
    ${layerCard(L1, 'L1 · internal weights', 'virtual layer — inside the NN')}
    ${layerCard(L2, 'L2 · fine-tuned weights', 'modified weights — still inside the NN')}
    ${provider}
    <text x="630" y="322" fill="${C.faint}" font-size="9">fixed · shared — the same weights for everyone</text>
  </g>`
}

function flowPath(id: string, d: string, color: string, o: number): string {
  return `
  <path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4" opacity="${o}"/>`
}

function flowDots(id: string, color: string, o: number, dur: number, r: number, begins: number[]): string {
  return begins
    .map((b) => `
  <circle r="${r}" fill="${color}" opacity="${o}">
    <animateMotion dur="${dur}s" begin="${b}s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion>
  </circle>`)
    .join('\n')
}

function flows(): string {
  return `
  ${flowPath('p-l3s', 'M 284 185 L 312 185', C.icm, 0.55)}
  ${flowDots('p-l3s', C.icm, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-sp', 'M 600 185 L 656 185', C.res, 0.55)}
  ${flowDots('p-sp', C.res, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-sd-mirror', 'M 180 536 L 180 560', C.pipe, 0.55)}
  ${flowDots('p-sd-mirror', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-ng-melt', 'M 480 440 L 480 496', C.pipe, 0.55)}
  ${flowDots('p-ng-melt', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-np-melt', 'M 780 440 L 780 496', C.pipe, 0.55)}
  ${flowDots('p-np-melt', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-melt-ws', 'M 480 536 L 480 560', C.pipe, 0.55)}
  ${flowDots('p-melt-ws', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-melt-pk', 'M 780 536 L 780 560', C.pipe, 0.55)}
  ${flowDots('p-melt-pk', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-ws-down', 'M 480 600 L 480 640', C.icm, 0.45)}
  ${flowDots('p-ws-down', C.icm, 0.45, 1.0, 2, [0, 0.5])}
  ${flowPath('p-mirror-down', 'M 180 600 L 180 640', C.icm, 0.45)}
  ${flowDots('p-mirror-down', C.icm, 0.45, 1.0, 2, [0, 0.5])}
  ${flowPath('p-pk-down', 'M 780 600 L 780 640', C.icm, 0.45)}
  ${flowDots('p-pk-down', C.icm, 0.45, 1.0, 2, [0, 0.5])}`
}

function pipelineZone(): string {
  const skillCard = (x: number, y: number, label: string, sub: string, chip: string, chipColor: string) => `
  <g>
    <rect x="${x}" y="${y}" width="260" height="40" rx="9" fill="${C.card}" stroke="${C.cardStroke}" stroke-width="1"/>
    <rect x="${x}" y="${y}" width="4" height="40" rx="2" fill="${C.pipe}" fill-opacity="0.65"/>
    <text x="${x + 14}" y="${y + 16}" fill="white" font-size="12.5" font-weight="700">${label}</text>
    <text x="${x + 14}" y="${y + 31}" fill="${C.dim}" font-size="10">${sub}</text>
    <rect x="${x + 166}" y="${y + 3}" width="88" height="18" rx="9" fill="${chipColor}1f" stroke="${chipColor}66" stroke-width="1"/>
    <text x="${x + 210}" y="${y + 16}" text-anchor="middle" fill="${chipColor}" font-size="8.5" font-weight="600">${chip}</text>
  </g>`
  const surface = (x: number, y: number, title: string, sub: string, accent: string, stroke: string) => `
  <g>
    <rect x="${x}" y="${y}" width="260" height="40" rx="9" fill="${C.card}" stroke="${stroke}" stroke-width="1"/>
    <rect x="${x}" y="${y}" width="4" height="40" rx="2" fill="${accent}" fill-opacity="0.8"/>
    <text x="${x + 130}" y="${y + 17}" text-anchor="middle" fill="${accent}" font-size="12" font-weight="700">${title}</text>
    <text x="${x + 130}" y="${y + 32}" text-anchor="middle" fill="${C.dim}" font-size="9.5">${sub}</text>
  </g>`

  return `
  <g>
    <rect x="${PIPELINE.x}" y="${PIPELINE.y}" width="${PIPELINE.w}" height="${PIPELINE.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(PIPELINE.x + 8, PIPELINE.y + 14, 'THE MEMORY PIPELINE — THREE PATHS, ONE SHAPE: AUTO → WEEKLY → NARROWED')}
    <!-- column 1 — the mirror (self · facts) -->
    ${skillCard(PROFILE.x, PROFILE.y, 'profile learning', 'live — the mirror', 'auto', C.pipe)}
    ${skillCard(PERSONAS.x, PERSONAS.y, 'personas aggregation', 'consolidates the personas', 'manual', C.res)}
    ${skillCard(DISTILL.x, DISTILL.y, 'session distillation', 'weekly — feeds the mirror', 'manual', C.res)}
    ${surface(MIRROR.x, MIRROR.y, 'CONVERGING MIRROR', 'an accurate model of how you think', C.pipe, `${C.pipe}88`)}
    <!-- column 2 — the workspaces (practice · global) -->
    ${skillCard(NOTE_GLOBAL.x, NOTE_GLOBAL.y, 'note-taking — global', 'patterns · durable · cross-project', 'auto', C.pipe)}
    ${skillCard(MELT_GLOBAL.x, MELT_GLOBAL.y, 'melt — global', 'weekly · clears the notes', 'weekly', C.res)}
    ${surface(WORKSPACES.x, WORKSPACES.y, 'CONVERGING WORKSPACES', 'narrowed in place · staging cleared', C.icm, `${C.icm}88`)}
    <!-- column 3 — the project knowledge (local) -->
    ${skillCard(NOTE_PROJECT.x, NOTE_PROJECT.y, 'note-taking — project', 'repo-scoped · stays in the repo', 'auto', C.pipe)}
    ${skillCard(MELT_PROJECT.x, MELT_PROJECT.y, 'melt — project', 'weekly · docs · AGENTS · proposal', 'weekly', C.res)}
    ${surface(PROJECT_KNOWLEDGE.x, PROJECT_KNOWLEDGE.y, 'CONVERGING PROJECT KNOWLEDGE', 'the project docs converge', C.res, `${C.res}88`)}
    <g>
      <rect x="${ICM_LABEL.x}" y="${ICM_LABEL.y}" width="${ICM_LABEL.w}" height="${ICM_LABEL.h}" rx="10" fill="${C.card}" stroke="${C.icm}88" stroke-width="1"/>
      <rect x="${ICM_LABEL.x}" y="${ICM_LABEL.y}" width="4" height="${ICM_LABEL.h}" rx="2" fill="${C.icm}" fill-opacity="0.8"/>
      <text x="${ICM_LABEL.x + ICM_LABEL.w / 2}" y="${ICM_LABEL.y + 18}" text-anchor="middle" fill="${C.icm}" font-size="12" font-weight="700">ICM — the files</text>
      <text x="${ICM_LABEL.x + ICM_LABEL.w / 2}" y="${ICM_LABEL.y + 31}" text-anchor="middle" fill="${C.dim}" font-size="9.5">the source of truth — the cache is a copy, never the source</text>
    </g>
    <text x="${PIPELINE.x + PIPELINE.w - 12}" y="${PIPELINE.y + 14}" text-anchor="end" fill="${C.faint}" font-size="9.5">auto grows · weekly melt + personas · each surface narrows in place</text>
  </g>`
}

function resultsZone(): string {
  const chip = (x: number, big: string, sub: string) => `
  <g>
    <rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="10" fill="${C.card}" stroke="${C.cardStroke}" stroke-width="1"/>
    <text x="${x + 20}" y="${CHIP_Y + 24}" fill="${C.res}" font-size="18" font-weight="700">${big}</text>
    <text x="${x + 20}" y="${CHIP_Y + 38}" fill="${C.dim}" font-size="9.5">${sub}</text>
  </g>`

  return `
  <g>
    <rect x="${RESULTS.x}" y="${RESULTS.y}" width="${RESULTS.w}" height="${RESULTS.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(RESULTS.x + 8, RESULTS.y + 14, 'THE RESULTS — WHAT THE METHOD BUYS')}
    ${CHIPS.map((c) => chip(c.x, c.big, c.sub)).join('\n')}
    <rect x="${NOTE.x}" y="${NOTE.y}" width="${NOTE.w}" height="${NOTE.h}" rx="9" fill="rgba(15,23,42,0.55)" stroke="${C.faint}" stroke-width="1"/>
    <circle cx="${NOTE.x + 18}" cy="${NOTE.y + NOTE.h / 2}" r="3.5" fill="${C.res}"/>
    <text x="${NOTE.x + 32}" y="${NOTE.y + 13}" fill="${C.dim}" font-size="9.5">the moat — decisions &amp; reasoning stay in your files · providers see only narrow prompts · they can approximate you, never clone the business</text>
  </g>`
}

// ── assembly ────────────────────────────────────────────────────────────────
export function generate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text { font-family: 'DejaVu Sans', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
  <defs>
    <path id="p-l3s" d="M 284 185 L 312 185" fill="none"/>
    <path id="p-sp" d="M 600 185 L 656 185" fill="none"/>
    <path id="p-sd-mirror" d="M 180 536 L 180 560" fill="none"/>
    <path id="p-ng-melt" d="M 480 440 L 480 496" fill="none"/>
    <path id="p-np-melt" d="M 780 440 L 780 496" fill="none"/>
    <path id="p-melt-ws" d="M 480 536 L 480 560" fill="none"/>
    <path id="p-melt-pk" d="M 780 536 L 780 560" fill="none"/>
    <path id="p-ws-down" d="M 480 600 L 480 640" fill="none"/>
    <path id="p-mirror-down" d="M 180 600 L 180 640" fill="none"/>
    <path id="p-pk-down" d="M 780 600 L 780 640" fill="none"/>
    <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${header()}
  ${icmZone()}
  ${sessionZone()}
  ${modelZone()}
  ${flows()}
  ${pipelineZone()}
  ${resultsZone()}
</svg>
`
}
