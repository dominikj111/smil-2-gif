/**
 * memory-hierarchy — "the memory hierarchy" of a local LLM workflow.
 *
 * Story: how an LLM agent is steered locally.
 *   L3 ICM — the authored files (AGENTS.md global router + the engineering /
 *   operations / ideas workspaces) — and the chat session it feeds. The
 *   session assembles a narrow scoped prompt and sends it to the LLM provider.
 *   L1 base weights and L2 fine-tuning live inside the model, behind the
 *   provider (fixed, shared). A memory pipeline keeps the knowledge base
 *   alive: note-taking and profile learning trigger automatically in-session
 *   (note-taking only enriches the current project's log), session
 *   distillation runs manually (weekly) — profile learning and session
 *   distillation converge on one mirror: an accurate model of how the
 *   operator thinks. The results: 1.3B tokens/28d, 98.8% cache,
 *   ~$20/month — and a moat (providers approximate, never clone).
 *
 * Static diagram with ambient motion: every section stays fully visible and
 * readable at all times — only the flow dots (and the provider's cache glow)
 * move. Loop period 12s keeps every dot cycle (0.8/1.2s) and the 3s glow
 * seamless at the wrap.
 */

const W = 960
const H = 640

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
const LEFT = { x: 10, y: 60, w: 280, h: 314 } // zone: the ICM layer
const L3 = { x: 16, y: 84, w: 268, h: 272 } // the files card
const AGENTS = { x: 26, y: 134, w: 248, h: 42 } // global router row, inside L3
const WS_ROWS = [
  { y: 198, label: 'engineering', sub: 'patterns & techniques · enforced', accent: C.nn },
  { y: 240, label: 'operations', sub: 'decisions · reasoning · standups · wiki', accent: C.pipe },
  { y: 282, label: 'ideas', sub: 'future opportunities — a bin for the head', accent: C.orange },
]
const MID = { x: 306, y: 60, w: 300, h: 314 } // zone: the session
const SESSION = { x: 312, y: 140, w: 288, h: 90 }
const RIGHT = { x: 622, y: 60, w: 328, h: 314 } // zone: the model
const L1 = { x: 642, y: 108, w: 290, h: 46 } // behind the provider
const L2 = { x: 642, y: 242, w: 290, h: 46 } // behind the provider
const PROVIDER = { x: 656, y: 150, w: 262, h: 96 }
const PIPELINE = { x: 10, y: 370, w: 940, h: 176 } // note-taking/project-log left col · mirror middle · right col of learners
const NOTE_TAKING = { x: 30, y: 436, w: 260, h: 40 } // left col, aligned with the mirror
const PROJ_TAG = { x: 196, y: 459, w: 88, h: 15 } // "project log" pill under the auto tag, inside note-taking
const PROFILE = { x: 650, y: 392, w: 260, h: 40 } // right col row1
const PERSONAS = { x: 650, y: 436, w: 260, h: 40 } // right col row2 — the middle card
const DISTILL = { x: 650, y: 480, w: 260, h: 40 } // right col row3
const MIRROR = { x: 350, y: 436, w: 240, h: 40 } // aligned with the middle card (personas)
const L3_LABEL = { x: 760, y: 522, w: 180, h: 24 } // the return line's target
const RESULTS = { x: 10, y: 552, w: 940, h: 88 }
const CHIPS = [
  { x: 30, big: '1.3B', sub: 'input tokens in 28 days' },
  { x: 342, big: '98.8%', sub: 'served from provider cache' },
  { x: 654, big: '≈ $20 / month', sub: '≈ 70¢ a day — full-time AI partner' },
]
const CHIP_W = 290
const CHIP_H = 46
const CHIP_Y = 570
const NOTE = { x: 30, y: 622, w: 900, h: 18 }

const tag = (x: number, y: number, s: string) =>
  `<text x="${x}" y="${y}" fill="${C.faint}" font-size="9.5" letter-spacing="0.09em">${s}</text>`

// ── sections ────────────────────────────────────────────────────────────────
function header(): string {
  return `
  <text x="16" y="28" fill="white" font-size="19" font-weight="700" letter-spacing="0.02em">THE MEMORY HIERARCHY</text>
  <text x="16" y="46" fill="${C.dim}" font-size="11.5">steering an LLM agent locally — files → session → model · one converging mirror</text>`
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
    ${tag(LEFT.x + 8, LEFT.y + 14, 'L3 · THE ICM LAYER — PRIVATE')}
  </g>
  <g>
    <rect x="${L3.x}" y="${L3.y}" width="${L3.w}" height="${L3.h}" rx="10" fill="${C.card}" stroke="${C.icm}88" stroke-width="1"/>
    <rect x="${L3.x}" y="${L3.y}" width="4" height="${L3.h}" rx="2" fill="${C.icm}" fill-opacity="0.7"/>
    <text x="${L3.x + 12}" y="${L3.y + 24}" fill="white" font-size="13.5" font-weight="700">L3 · ICM — the files</text>
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
  <text x="28" y="344" fill="${C.faint}" font-size="9">you control only layer 3 — the rest is shared</text>`
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
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 58}" fill="${C.res}" font-size="10" font-weight="600">cache-first — stable context hits</text>
    <text x="${PROVIDER.x + 14}" y="${PROVIDER.y + 78}" fill="${C.faint}" font-size="9">L1 · L2 live inside the model</text>
  </g>`

  return `
  <g>
    <rect x="${RIGHT.x}" y="${RIGHT.y}" width="${RIGHT.w}" height="${RIGHT.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(RIGHT.x + 8, RIGHT.y + 14, 'THE MODEL — FIXED · SHARED')}
    ${layerCard(L1, 'L1 · base weights', 'virtual layer — inside the NN')}
    ${layerCard(L2, 'L2 · fine-tuning', 'modified weights — still inside the NN')}
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
  ${flowPath('p-pl2m', 'M 650 410 C 624 412 616 444 590 448', C.pipe, 0.55)}
  ${flowDots('p-pl2m', C.pipe, 0.55, 1.5, 2.5, [0, 0.75])}
  ${flowPath('p-sd2m', 'M 650 500 C 624 502 616 462 590 460', C.pipe, 0.55)}
  ${flowDots('p-sd2m', C.pipe, 0.55, 1.2, 2.5, [0, 0.6])}
  ${flowPath('p-log-down', 'M 160 476 L 160 528', C.icm, 0.45)}
  ${flowDots('p-log-down', C.icm, 0.45, 1.0, 2, [0, 0.5])}
  ${flowPath('p-mirror-down', 'M 470 476 L 470 528', C.icm, 0.45)}
  ${flowDots('p-mirror-down', C.icm, 0.45, 1.0, 2, [0, 0.5])}
  ${flowPath('p-back', 'M 160 528 L 758 528', C.icm, 0.45)}
  ${flowDots('p-back', C.icm, 0.45, 2.4, 2, [0, 1.2])}
  <path d="M 752 523 L 764 528 L 752 533 Z" fill="rgba(247,127,0,0.45)"/>`
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

  return `
  <g>
    <rect x="${PIPELINE.x}" y="${PIPELINE.y}" width="${PIPELINE.w}" height="${PIPELINE.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(PIPELINE.x + 8, PIPELINE.y + 14, 'THE MEMORY PIPELINE — TWO PATHS: THE MIRROR AND THE FILES')}
    ${skillCard(NOTE_TAKING.x, NOTE_TAKING.y, 'note-taking', 'logs the current focus', 'auto · in-session', C.pipe)}
    <rect x="${PROJ_TAG.x}" y="${PROJ_TAG.y}" width="${PROJ_TAG.w}" height="${PROJ_TAG.h}" rx="7.5" fill="rgba(247,127,0,0.1)" stroke="rgba(247,127,0,0.45)" stroke-width="1"/>
    <text x="240" y="470" text-anchor="middle" fill="${C.icm}" font-size="8.5" font-weight="600">project log</text>
    ${skillCard(PROFILE.x, PROFILE.y, 'profile learning', 'live — the mirror', 'auto · in-session', C.pipe)}
    ${skillCard(PERSONAS.x, PERSONAS.y, 'personas aggregation', 'consolidates the personas', 'manual · weekly', C.res)}
    ${skillCard(DISTILL.x, DISTILL.y, 'session distillation', 'weekly — feeds the mirror', 'manual · weekly', C.res)}
    <g>
      <rect x="${MIRROR.x}" y="${MIRROR.y}" width="${MIRROR.w}" height="${MIRROR.h}" rx="9" fill="${C.card}" stroke="${C.pipe}88" stroke-width="1"/>
      <rect x="${MIRROR.x}" y="${MIRROR.y}" width="4" height="${MIRROR.h}" rx="2" fill="${C.pipe}" fill-opacity="0.8"/>
      <text x="${MIRROR.x + MIRROR.w / 2}" y="${MIRROR.y + 17}" text-anchor="middle" fill="${C.pipe}" font-size="13" font-weight="700">CONVERGING MIRROR</text>
      <text x="${MIRROR.x + MIRROR.w / 2}" y="${MIRROR.y + 32}" text-anchor="middle" fill="${C.dim}" font-size="9.5">an accurate model of how you think</text>
    </g>
    <g>
      <rect x="${L3_LABEL.x}" y="${L3_LABEL.y}" width="${L3_LABEL.w}" height="${L3_LABEL.h}" rx="9" fill="${C.card}" stroke="${C.icm}88" stroke-width="1"/>
      <rect x="${L3_LABEL.x}" y="${L3_LABEL.y}" width="4" height="${L3_LABEL.h}" rx="2" fill="${C.icm}" fill-opacity="0.8"/>
      <text x="${L3_LABEL.x + L3_LABEL.w / 2}" y="${L3_LABEL.y + 17}" text-anchor="middle" fill="${C.icm}" font-size="10.5" font-weight="700">L3 · ICM — the files</text>
    </g>
    <text x="${PIPELINE.x + PIPELINE.w - 12}" y="${PIPELINE.y + 14}" text-anchor="end" fill="${C.faint}" font-size="9.5">note-taking → project log · profile learning + personas + session distillation → mirror · all of it lives in the files</text>
  </g>`
}

function resultsZone(): string {
  const chip = (x: number, big: string, sub: string) => `
  <g>
    <rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="10" fill="${C.card}" stroke="${C.cardStroke}" stroke-width="1"/>
    <text x="${x + 20}" y="${CHIP_Y + 24}" fill="${C.res}" font-size="18" font-weight="700">${big}</text>
    <text x="${x + 20}" y="${CHIP_Y + 39}" fill="${C.dim}" font-size="9.5">${sub}</text>
  </g>`

  return `
  <g>
    <rect x="${RESULTS.x}" y="${RESULTS.y}" width="${RESULTS.w}" height="${RESULTS.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    ${tag(RESULTS.x + 8, RESULTS.y + 14, 'THE RESULTS — WHAT THE METHOD BUYS')}
    ${CHIPS.map((c) => chip(c.x, c.big, c.sub)).join('\n')}
    <rect x="${NOTE.x}" y="${NOTE.y}" width="${NOTE.w}" height="${NOTE.h}" rx="8" fill="rgba(15,23,42,0.55)" stroke="${C.faint}" stroke-width="1"/>
    <text x="${NOTE.x + NOTE.w / 2}" y="${NOTE.y + 12}" text-anchor="middle" fill="${C.dim}" font-size="9.5">the moat — decisions &amp; reasoning stay in your files · providers see only narrow prompts · they can approximate you, never clone the business</text>
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
    <path id="p-pl2m" d="M 650 410 C 624 412 616 444 590 448" fill="none"/>
    <path id="p-sd2m" d="M 650 500 C 624 502 616 462 590 460" fill="none"/>
    <path id="p-log-down" d="M 160 476 L 160 528" fill="none"/>
    <path id="p-mirror-down" d="M 470 476 L 470 528" fill="none"/>
    <path id="p-back" d="M 160 528 L 758 528" fill="none"/>
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
