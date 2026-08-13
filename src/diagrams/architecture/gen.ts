/**
 * architecture — SurfLogs architecture diagram from
 * surflogs/web2/src/pages/landing/sections/Architecture.tsx,
 * recreated as a self-contained SMIL SVG.
 *
 * The React component's hover interactions (dim everything except the
 * hovered zone, boost its path/dots) are converted into a timed
 * cinematic loop so the story can be exported as a GIF:
 *
 *   default → Browser → Lambda → IoT → Hub → Worker → Sensor → App Server → default
 *
 * Loop period T = 12.5s, 1.5s per highlight, 0.25s fades (mirrors the
 * React `transition: opacity 0.25s`).
 *
 * Moving dots use SMIL animateMotion + mpath (already SMIL in the React
 * source); zone emphasis uses keyTimes/values opacity curves with
 * zero-length segments at phase boundaries (see README).
 */

const W = 840
const H = 540
const T = 12.5
const FADE = 0.25

type SourceId = 'browser' | 'lambda' | 'iot'
type Phase =
  | null
  | { kind: 'source'; id: SourceId }
  | { kind: 'hub' }
  | { kind: 'mini'; index: number }

const PHASES: { phase: Phase; t: number }[] = [
  { phase: null, t: 0 },
  { phase: { kind: 'source', id: 'browser' }, t: 1.0 },
  { phase: { kind: 'source', id: 'lambda' }, t: 2.5 },
  { phase: { kind: 'source', id: 'iot' }, t: 4.0 },
  { phase: { kind: 'hub' }, t: 5.5 },
  { phase: { kind: 'mini', index: 0 }, t: 7.0 },
  { phase: { kind: 'mini', index: 1 }, t: 8.5 },
  { phase: { kind: 'mini', index: 2 }, t: 10.0 },
  { phase: null, t: 11.5 },
]

// ── palette ─────────────────────────────────────────────────────────────────
const C = {
  card: '#1e293b',
  cardStroke: '#334155',
  engine: '#f77f00',
  dash: '#60a5fa',
  notify: '#fbbf24',
  hub: '#22d3ee',
  native: '#34d399',
  iot: '#fb923c',
  lambda: '#a78bfa',
  dim: '#94a3b8',
  faint: '#475569',
  containerStroke: '#2d3f55',
  bg: '#020617',
}

const SOURCES: { id: SourceId; label: string; sublabel: string; color: string; cy: number; pathD: string }[] = [
  { id: 'browser', label: 'Browser SDK', sublabel: 'JS + legacy IE11', color: C.dash, cy: 95, pathD: 'M 195 95 C 265 95 305 185 345 185' },
  { id: 'lambda', label: 'AWS Lambda', sublabel: 'Serverless ingest', color: C.lambda, cy: 185, pathD: 'M 195 185 L 345 185' },
  { id: 'iot', label: 'IoT / Edge Device', sublabel: 'Daemon · OS logs · metrics', color: C.iot, cy: 275, pathD: 'M 195 275 C 265 275 305 185 345 185' },
]

const APP_ZONE = { x: 10, y: 335, w: 218, h: 60 }
const APP_SERVER = { x: 16, cy: 365, w: 82, h: 40 }
const APP_DASH = { x: 106, cy: 365, w: 114, h: 40 }
const APP_ZONE_CONV_PATH = 'M 228 365 C 273 365 298 455 338 455'

const MINI_NODES = [
  { label: 'Worker / Job', sublabel: 'Queue · cron', cy: 430 },
  { label: 'Sensor / Device', sublabel: 'IoT · OS logs', cy: 480 },
]
const CONV_PATHS = [
  'M 170 430 C 235 430 298 455 338 455',
  'M 170 480 C 235 480 298 455 338 455',
]

const HUB_X = 338
const HUB_CY = 455
const HUB_W = 165
const HUB_H = 82
const HUB_PATH_D = 'M 420 414 L 420 225'

const NATIVE_X = 619
const NATIVE_CY = 455
const NATIVE_W = 152
const NATIVE_H = 70

const CONTAINER = { x: 2, y: 323, w: 836, h: 205 }

// ── opacity functions (ported 1:1 from Architecture.tsx) ────────────────────
const isSource = (p: Phase, id: SourceId) => p !== null && p.kind === 'source' && p.id === id
const isMini = (p: Phase, i: number) => p !== null && p.kind === 'mini' && p.index === i
const isHub = (p: Phase) => p !== null && p.kind === 'hub'

const srcCard = (id: SourceId) => (p: Phase) => (p === null ? 1 : isSource(p, id) ? 1 : 0.35)
const srcPath = (id: SourceId) => (p: Phase) => (p === null ? 0.18 : isSource(p, id) ? 0.75 : 0.06)
const srcDot = (id: SourceId) => (p: Phase) => (p === null ? 0.85 : isSource(p, id) ? 1 : 0.1)
const hubZone = (p: Phase) => (p !== null && p.kind === 'source' ? 0.35 : 1)

const miniCard = (i: number) => (p: Phase) => {
  if (p === null) return 1
  if (isMini(p, i)) return 1
  if (p.kind === 'mini') return 0.3
  if (isHub(p)) return 0.5
  return 1
}
const convLine = (i: number) => (p: Phase) => {
  if (p === null) return 0.12
  if (isMini(p, i)) return 0.8
  if (p.kind === 'mini') return 0.05
  if (isHub(p)) return 0.15
  return 0.12
}
const convDot = (i: number) => (p: Phase) => {
  if (p === null) return 0.6
  if (isMini(p, i)) return 1
  if (p.kind === 'mini') return 0.05
  if (isHub(p)) return 0.25
  return 0.6
}
const hubPath = (p: Phase) => {
  if (p === null) return 0.18
  if (p.kind === 'hub' || p.kind === 'mini') return 0.8
  return 0.12 // source active → dimmed
}
const hubDot = (p: Phase) => {
  if (p === null) return 0.7
  if (p.kind === 'hub' || p.kind === 'mini') return 1
  return 0.1
}
const backLine = (p: Phase) => {
  if (p === null) return 0.12
  if (isMini(p, 1)) return 0.75
  if (isHub(p)) return 0.35
  return 0.04
}
const backDot = (p: Phase) => {
  if (p === null) return 0.55
  if (isMini(p, 1)) return 1
  if (isHub(p)) return 0.7
  return 0.05
}
const appZoneGroup = (p: Phase) => {
  if (p === null) return 1
  if (isMini(p, 2)) return 1
  if (p.kind === 'mini') return 0.3
  if (isHub(p)) return 0.5
  return 1
}
const appZoneConv = (p: Phase) => {
  if (p === null) return 0.12
  if (isMini(p, 2)) return 0.8
  if (p.kind === 'mini') return 0.05
  if (isHub(p)) return 0.2
  return 0.12
}
const appZoneConvDot = (p: Phase) => {
  if (p === null) return 0.55
  if (isMini(p, 2)) return 1
  if (p.kind === 'mini') return 0.05
  if (isHub(p)) return 0.3
  return 0.55
}
const iotBackLine = (p: Phase) => (p === null ? 0.12 : isSource(p, 'iot') ? 0.65 : 0.04)
const iotBackDot = (p: Phase) => (p === null ? 0.6 : isSource(p, 'iot') ? 1 : 0.06)

// ── SMIL curve builder ──────────────────────────────────────────────────────
function curve(fn: (p: Phase) => string | number, attr: string): string {
  const kt: number[] = [0]
  const vals: (string | number)[] = [fn(PHASES[0].phase)]
  for (let i = 1; i < PHASES.length; i++) {
    const { phase, t } = PHASES[i]
    const prev = fn(PHASES[i - 1].phase)
    const cur = fn(phase)
    if (String(prev) === String(cur)) {
      kt.push(t / T)
      vals.push(cur)
    } else {
      kt.push(t / T, Math.min((t + FADE) / T, 1))
      vals.push(prev, cur)
    }
  }
  kt.push(1)
  vals.push(fn(PHASES[PHASES.length - 1].phase))
  return `<animate attributeName="${attr}" dur="${T}s" repeatCount="indefinite" keyTimes="${kt.map((k) => k.toFixed(4)).join('; ')}" values="${vals.join('; ')}"/>`
}

const op = (fn: (p: Phase) => number) => curve(fn, 'opacity')
const stroke = (fn: (p: Phase) => string) => curve(fn, 'stroke')

// ── section builders ────────────────────────────────────────────────────────
function sourceCards(): string {
  return SOURCES.map((s) => {
    const active = (p: Phase) => (isSource(p, s.id) ? s.color : C.cardStroke)
    const width = (p: Phase) => (isSource(p, s.id) ? 1.5 : 1)
    const accent = (p: Phase) => (isSource(p, s.id) ? 1 : 0.6)
    return `
  <g>
    ${op(srcCard(s.id))}
    <rect x="10" y="${s.cy - 38}" width="185" height="76" rx="10" fill="${C.card}" stroke-width="1">
      ${stroke(active)}${curve(width, 'stroke-width')}
    </rect>
    <rect x="10" y="${s.cy - 38}" width="4" height="76" rx="2" fill="${s.color}" fill-opacity="0.6">
      ${curve(accent, 'fill-opacity')}
    </rect>
    <text x="28" y="${s.cy - 8}" fill="white" font-size="13" font-weight="600">${s.label}</text>
    <text x="28" y="${s.cy + 12}" fill="${C.dim}" font-size="11">${s.sublabel}</text>
  </g>`
  }).join('\n')
}

function sourcePathsAndDots(): string {
  return SOURCES.map((s) => `
  <path d="${s.pathD}" fill="none" stroke="${s.color}" stroke-width="1.5" stroke-dasharray="5 4">
    ${op(srcPath(s.id))}
  </path>
  ${[0, 0.9].map((begin) => `
  <circle r="3" fill="${s.color}">
    ${op(srcDot(s.id))}
    <animateMotion dur="1.8s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-${s.id}"/></animateMotion>
  </circle>`).join('\n')}`).join('\n')
}

function engineBox(): string {
  return `
  <rect x="345" y="145" width="150" height="80" rx="12" fill="${C.card}" stroke="rgba(247,127,0,0.6)" stroke-width="1.5"/>
  <rect x="340" y="140" width="160" height="90" rx="15" fill="none" stroke="rgba(247,127,0,0.6)" stroke-width="1.5" filter="url(#glow-orange)">
    <animate attributeName="opacity" values="0.15; 0.75; 0.15" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="1; 3; 1" dur="3s" repeatCount="indefinite"/>
  </rect>
  <rect x="333" y="133" width="174" height="104" rx="18" fill="none" stroke="rgba(247,127,0,0.35)" stroke-width="1" filter="url(#glow-orange)">
    <animate attributeName="opacity" values="0.05; 0.5; 0.05" dur="3s" begin="1.5s" repeatCount="indefinite"/>
    <animate attributeName="stroke-width" values="0.5; 2; 0.5" dur="3s" begin="1.5s" repeatCount="indefinite"/>
  </rect>
  <text x="420" y="177" text-anchor="middle" fill="${C.engine}" font-size="12" font-weight="700">SurfLogs</text>
  <text x="420" y="193" text-anchor="middle" fill="white" font-size="13" font-weight="600">Cloud Engine</text>
  <text x="420" y="210" text-anchor="middle" fill="${C.dim}" font-size="10">Filter · correlate · signal</text>`
}

function outputs(): string {
  return `
  <path d="M 495 185 C 545 185 560 95 600 95" fill="none" stroke="rgba(96,165,250,0.5)" stroke-width="1.5"/>
  <rect x="600" y="55" width="190" height="80" rx="12" fill="${C.card}" stroke="rgba(96,165,250,0.5)" stroke-width="1.5"/>
  <text x="695" y="87" text-anchor="middle" fill="${C.dash}" font-size="12" font-weight="700">Developer</text>
  <text x="695" y="103" text-anchor="middle" fill="white" font-size="13" font-weight="600">Dashboard</text>
  <text x="695" y="119" text-anchor="middle" fill="${C.dim}" font-size="10">Query · cluster · signal</text>

  <path d="M 495 185 C 545 185 560 273 600 273" fill="none" stroke="rgba(251,191,36,0.5)" stroke-width="1.5"/>
  <rect x="600" y="235" width="190" height="76" rx="12" fill="${C.card}" stroke="rgba(251,191,36,0.45)" stroke-width="1"/>
  <text x="695" y="260" text-anchor="middle" fill="${C.notify}" font-size="12" font-weight="700">Notifications</text>
  <text x="695" y="278" text-anchor="middle" fill="white" font-size="11" font-weight="600">Signal fired</text>
  <text x="695" y="294" text-anchor="middle" fill="${C.dim}" font-size="10">Webhook · Email · Push</text>`
}

function iotBackStream(): string {
  return `
  <path d="M 345 193 C 305 193 265 283 195 283" fill="none" stroke="${C.iot}" stroke-width="1.5" stroke-dasharray="3 5">
    ${op(iotBackLine)}
  </path>
  ${[0, 1.2].map((begin) => `
  <circle r="2.5" fill="${C.iot}">
    ${op(iotBackDot)}
    <animateMotion dur="2.4s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-iot-back"/></animateMotion>
  </circle>`).join('\n')}`
}

function localInfraZone(): string {
  // mini cards
  const miniCards = MINI_NODES.map((node, i) => `
    <g>
      ${op(miniCard(i))}
      <rect x="10" y="${node.cy - 22}" width="160" height="44" rx="8" fill="${C.card}" stroke="${C.hub}45" stroke-width="1">
        ${curve((p) => (isMini(p, i) ? 1.5 : 1), 'stroke-width')}
      </rect>
      <rect x="10" y="${node.cy - 22}" width="4" height="44" rx="2" fill="${C.hub}" fill-opacity="0.4">
        ${curve((p) => (isMini(p, i) ? 0.9 : 0.4), 'fill-opacity')}
      </rect>
      <text x="28" y="${node.cy - 4}" fill="white" font-size="11" font-weight="600">${node.label}</text>
      <text x="28" y="${node.cy + 13}" fill="${C.dim}" font-size="10">${node.sublabel}</text>
    </g>`).join('\n')

  // convergence lines + dots
  const convs = CONV_PATHS.map((d, i) => `
    <g>
      <path d="${d}" fill="none" stroke="${C.hub}" stroke-width="1" stroke-dasharray="3 3">
        ${op(convLine(i))}
      </path>
      ${[0, 0.3, 0.6].map((begin) => `
      <circle r="2" fill="${C.hub}">
        ${op(convDot(i))}
        <animateMotion dur="0.9s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-conv-${i}"/></animateMotion>
      </circle>`).join('\n')}
    </g>`).join('\n')

  // hub → sensor back-stream
  const backStream = `
    <path d="M 338 463 C 298 463 235 488 170 488" fill="none" stroke="${C.hub}" stroke-width="1.5" stroke-dasharray="3 5">
      ${op(backLine)}
    </path>
    ${[0, 1.2].map((begin) => `
    <circle r="2.5" fill="${C.hub}">
      ${op(backDot)}
      <animateMotion dur="2.4s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-hub-sensor-back"/></animateMotion>
    </circle>`).join('\n')}`

  // hub box
  const hubBox = `
    <g>
      <rect x="${HUB_X}" y="${HUB_CY - HUB_H / 2}" width="${HUB_W}" height="${HUB_H}" rx="10" fill="${C.card}" stroke="${C.hub}55" stroke-width="1">
        ${curve((p) => (p !== null && (p.kind === 'hub' || p.kind === 'mini') ? 1.5 : 1), 'stroke-width')}
      </rect>
      <rect x="${HUB_X}" y="${HUB_CY - HUB_H / 2}" width="4" height="${HUB_H}" rx="2" fill="${C.hub}" fill-opacity="0.55">
        ${curve((p) => (p !== null && (p.kind === 'hub' || p.kind === 'mini') ? 1 : 0.55), 'fill-opacity')}
      </rect>
      <text x="${HUB_X + HUB_W / 2 + 2}" y="${HUB_CY - 6}" text-anchor="middle" fill="${C.hub}" font-size="12" font-weight="700">SurfLogs Hub</text>
      <text x="${HUB_X + HUB_W / 2 + 2}" y="${HUB_CY + 12}" text-anchor="middle" fill="${C.dim}" font-size="10">On-prem · filtered push</text>
    </g>`

  // native app + hub↔native connection
  const native = `
    <g>
      <line x1="${HUB_X + HUB_W}" y1="${HUB_CY}" x2="${NATIVE_X}" y2="${NATIVE_CY}" stroke="${C.native}80" stroke-width="1.5"/>
      <rect x="${NATIVE_X}" y="${NATIVE_CY - NATIVE_H / 2}" width="${NATIVE_W}" height="${NATIVE_H}" rx="10" fill="${C.card}" stroke="${C.native}80" stroke-width="1.5"/>
      <text x="${NATIVE_X + NATIVE_W / 2 + 2}" y="${NATIVE_CY - 8}" text-anchor="middle" fill="${C.native}" font-size="12" font-weight="700">Native App</text>
      <text x="${NATIVE_X + NATIVE_W / 2 + 2}" y="${NATIVE_CY + 10}" text-anchor="middle" fill="white" font-size="11" font-weight="600">Local Dashboard</text>
      <text x="${NATIVE_X + NATIVE_W / 2 + 2}" y="${NATIVE_CY + 25}" text-anchor="middle" fill="${C.dim}" font-size="9">Any daemon · inspect · manage</text>
    </g>`

  // app server sub-zone
  const appZone = `
    <g>
      ${op(appZoneGroup)}
      <rect x="${APP_ZONE.x}" y="${APP_ZONE.y}" width="${APP_ZONE.w}" height="${APP_ZONE.h}" rx="8" fill="rgba(15,23,42,0.5)" stroke="${C.hub}30" stroke-width="1" stroke-dasharray="4 3">
        ${curve((p) => (isMini(p, 2) ? 1.5 : 1), 'stroke-width')}
      </rect>
      <rect x="${APP_SERVER.x}" y="${APP_SERVER.cy - APP_SERVER.h / 2}" width="${APP_SERVER.w}" height="${APP_SERVER.h}" rx="6" fill="${C.card}" stroke="${C.hub}45" stroke-width="1"/>
      <rect x="${APP_SERVER.x}" y="${APP_SERVER.cy - APP_SERVER.h / 2}" width="3" height="${APP_SERVER.h}" rx="1" fill="${C.hub}" fill-opacity="0.4">
        ${curve((p) => (isMini(p, 2) ? 0.9 : 0.4), 'fill-opacity')}
      </rect>
      <text x="${APP_SERVER.x + 10}" y="${APP_SERVER.cy + 4}" fill="white" font-size="10" font-weight="600">App Server</text>
      <line x1="${APP_SERVER.x + APP_SERVER.w}" y1="${APP_SERVER.cy}" x2="${APP_DASH.x}" y2="${APP_DASH.cy}" stroke="${C.native}80" stroke-width="1.5"/>
      <rect x="${APP_DASH.x}" y="${APP_DASH.cy - APP_DASH.h / 2}" width="${APP_DASH.w}" height="${APP_DASH.h}" rx="6" fill="${C.card}" stroke="${C.native}55" stroke-width="1"/>
      <text x="${APP_DASH.x + APP_DASH.w / 2}" y="${APP_DASH.cy - 3}" text-anchor="middle" fill="${C.native}" font-size="10" font-weight="700">Local View</text>
      <text x="${APP_DASH.x + APP_DASH.w / 2}" y="${APP_DASH.cy + 11}" text-anchor="middle" fill="${C.dim}" font-size="8">this daemon only</text>
      <path d="${APP_ZONE_CONV_PATH}" fill="none" stroke="${C.hub}" stroke-width="1" stroke-dasharray="3 3">
        ${op(appZoneConv)}
      </path>
      ${[0, 0.3, 0.6].map((begin) => `
      <circle r="2" fill="${C.hub}">
        ${op(appZoneConvDot)}
        <animateMotion dur="0.9s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-conv-app-zone"/></animateMotion>
      </circle>`).join('\n')}
    </g>`

  return `
  <g>
    ${op(hubZone)}
    <rect x="${CONTAINER.x}" y="${CONTAINER.y}" width="${CONTAINER.w}" height="${CONTAINER.h}" rx="12" fill="rgba(15,23,42,0.5)" stroke="${C.containerStroke}" stroke-width="1" stroke-dasharray="4 3"/>
    <text x="${CONTAINER.x + CONTAINER.w - 12}" y="${CONTAINER.y + 14}" text-anchor="end" fill="${C.faint}" font-size="9" letter-spacing="0.05em">local infrastructure</text>
    ${appZone}
    ${miniCards}
    ${convs}
    ${backStream}
    ${hubBox}
    ${native}
  </g>`
}

function hubToEngine(): string {
  return `
  <path d="${HUB_PATH_D}" fill="none" stroke="${C.hub}" stroke-width="1.5" stroke-dasharray="5 4">
    ${op(hubPath)}
  </path>
  ${[0, 1.5].map((begin) => `
  <circle r="3" fill="${C.hub}">
    ${op(hubDot)}
    <animateMotion dur="3.0s" begin="${begin}s" repeatCount="indefinite"><mpath href="#path-hub"/></animateMotion>
  </circle>`).join('\n')}`
}

function endpointDots(): string {
  return SOURCES.map((s) => `<circle cx="345" cy="185" r="2" fill="${s.color}" opacity="0.4"/>`).join('\n')
}

// ── assembly ────────────────────────────────────────────────────────────────
export function generate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text { font-family: 'DejaVu Sans', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
  <defs>
    ${SOURCES.map((s) => `<path id="path-${s.id}" d="${s.pathD}" fill="none"/>`).join('\n')}
    <path id="path-iot-back" d="M 345 193 C 305 193 265 283 195 283" fill="none"/>
    <path id="path-hub" d="${HUB_PATH_D}" fill="none"/>
    <path id="path-hub-sensor-back" d="M 338 463 C 298 463 235 488 170 488" fill="none"/>
    <path id="path-conv-app-zone" d="${APP_ZONE_CONV_PATH}" fill="none"/>
    ${CONV_PATHS.map((d, i) => `<path id="path-conv-${i}" d="${d}" fill="none"/>`).join('\n')}
    <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${sourceCards()}
  ${sourcePathsAndDots()}
  ${engineBox()}
  ${outputs()}
  ${iotBackStream()}
  ${localInfraZone()}
  ${hubToEngine()}
  ${endpointDots()}
</svg>
`
}
