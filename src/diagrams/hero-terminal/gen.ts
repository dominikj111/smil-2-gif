/**
 * hero-terminal — the animated cascade-detection log from
 * surflogs/web2/src/pages/landing/sections/Hero.tsx (TerminalDemo),
 * recreated as a self-contained SMIL SVG.
 *
 * SMIL (not CSS) is mandatory: the GIF exporter drives the animation
 * with `svg.setCurrentTime(t)`, which only seeks the SMIL timeline.
 *
 * Loop timing mirrors the React component:
 *   STEP_DELAYS = [500, 600, 700, 700, 700, 700, 600] ms  -> rows appear at 0.5..4.5s
 *   LOOP_PAUSE  = 2800 ms                                  -> hold, then hard reset
 *   T = 7.5s total loop period
 */

const T = 7.5 // loop period (seconds)
const FADE = 0.15
const APPEAR = [0.5, 1.1, 1.8, 2.5, 3.2, 3.9, 4.5] // row appear times (7 rows)

const W = 640
const H = 318
const ROWS_Y = 62
const ROW_H = 32

// ── palette (tailwind slate/red/amber/emerald used in Hero.tsx) ────────────
const C = {
  bg: '#0f172a',
  headerBg: 'rgba(30,41,59,0.72)',
  headerBg2: 'rgba(15,23,42,0.85)',
  border: '#334155',
  borderSoft: 'rgba(51,65,85,0.8)',
  borderRow: 'rgba(30,41,59,0.5)',
  textBright: '#e2e8f0',
  text: '#cbd5e1',
  textDim: '#94a3b8',
  textFaint: '#64748b',
  textDimmer: '#475569',
  badge: '#334155',
  emerald: '#34d399',
  red: '#f87171',
  amber: '#fbbf24',
}

const LEVEL: Record<'error' | 'warn', { label: string; text: string; bg: string; ring: string }> = {
  error: { label: 'ERR', text: '#f87171', bg: 'rgba(239,68,68,0.15)', ring: 'rgba(239,68,68,0.3)' },
  warn:  { label: 'WRN', text: '#fbbf24', bg: 'rgba(245,158,11,0.15)', ring: 'rgba(245,158,11,0.3)' },
}

interface EventRow {
  level: 'error' | 'warn'
  scope: string
  message: string
  time: string
}

const EVENTS: EventRow[] = [
  { level: 'warn',  scope: 'db',         message: 'DB connection pool at 90% capacity',             time: '14:03:20.190' },
  { level: 'warn',  scope: 'db',         message: 'Slow query detected: 1843ms (threshold 500ms)',  time: '14:03:20.881' },
  { level: 'error', scope: 'api-server', message: 'POST /api/orders → 500 Internal Server Error',   time: '14:03:21.441' },
  { level: 'warn',  scope: 'worker',     message: 'Promise rejected — order confirmation not sent', time: '14:03:21.509' },
  { level: 'error', scope: 'browser',    message: "Cannot read properties of null: 'id'",           time: '14:03:21.612' },
  { level: 'error', scope: 'browser',    message: 'Unhandled rejection: TypeError in checkout flow', time: '14:03:21.790' },
]

const CASCADE_TEXT = 'CASCADE DETECTED — root cause: POST /api/orders'

// ── SMIL helpers ────────────────────────────────────────────────────────────
// NOTE: SMIL interpolates between adjacent keyTimes. To get an instant
// appearance (a step), use a zero-length segment = duplicate keyTimes.
const kt = (t: number) => (t / T).toFixed(4)

/** fade 0→1 over FADE starting at a, then hold 1 until loop end */
const fadeIn = (a: number) =>
  `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a + FADE)}; 1" values="0; 0; 1; 1"/>`

/** slide up (from→0) over FADE starting at a, then hold */
const slideIn = (a: number, from = 6) =>
  `<animateTransform attributeName="transform" type="translate" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a + FADE)}; 1" values="0 ${from}; 0 ${from}; 0 0; 0 0"/>`

/** visible [a, b): step on at a, step off at b (zero-length segments) */
const showWindow = (a: number, b: number) =>
  `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a)}; ${kt(b)}; ${kt(b)}; 1" values="0; 0; 1; 1; 0; 0"/>`

/** visible from a until loop end: step on at a */
const showFrom = (a: number) =>
  `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a)}; 1" values="0; 0; 1; 1"/>`

/** fade in over FADE at a, visible until b, step off at b */
const fadeWindow = (a: number, b: number) =>
  `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a + FADE)}; ${kt(b)}; ${kt(b)}; 1" values="0; 0; 1; 1; 0; 0"/>`

/** fade in over FADE at a, visible until loop end */
const fadeFrom = (a: number) =>
  `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" keyTimes="0; ${kt(a)}; ${kt(a + FADE)}; 1" values="0; 0; 1; 1"/>`

/** looping pulse (values cycle, e.g. "1; 0.5; 1") */
const pulse = (values: string, dur: number) =>
  `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" values="${values}"/>`

const rowGroup = (a: number, inner: string) => `<g>${fadeIn(a)}${slideIn(a)}${inner}</g>`

// ── sections ────────────────────────────────────────────────────────────────
function eventRow(row: EventRow, i: number): string {
  const y = ROWS_Y + i * ROW_H
  const cy = y + ROW_H / 2
  const m = LEVEL[row.level]
  return rowGroup(
    APPEAR[i],
    `
    <rect x="0" y="${y}" width="2" height="${ROW_H}" rx="1" fill="${m.text}"/>
    <line x1="0" y1="${y + ROW_H}" x2="${W}" y2="${y + ROW_H}" stroke="${C.borderRow}"/>
    <rect x="27" y="${cy - 7.5}" width="34" height="15" rx="3" fill="${m.bg}" stroke="${m.ring}"/>
    <text x="44" y="${cy}" font-size="9.6" font-weight="700" fill="${m.text}" text-anchor="middle" dominant-baseline="central">${m.label}</text>
    <text x="84" y="${cy}" font-size="11" fill="${C.textDim}">${row.scope}</text>
    <text x="176" y="${cy}" font-size="12" fill="${C.text}" class="sans">${row.message}</text>
    <text x="624" y="${cy}" font-size="11" fill="${C.textDimmer}" text-anchor="end" dominant-baseline="central" style="font-variant-numeric: tabular-nums">${row.time}</text>
  `,
  )
}

function cascadeRow(): string {
  const y = ROWS_Y + 6 * ROW_H
  const cy = y + ROW_H / 2
  return rowGroup(
    APPEAR[6],
    `
    <g>
      <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="1; 0.5; 1"/>
      <rect x="142" y="${cy - 12}" width="356" height="24" rx="4" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.4)"/>
      <circle cx="158" cy="${cy}" r="3" fill="${C.red}"/>
      <text x="170" y="${cy}" font-size="11" font-weight="600" fill="${C.red}" dominant-baseline="central" class="sans">${CASCADE_TEXT}</text>
    </g>
  `,
  )
}

function header(): string {
  // count badge: bg fades in at 0.5, digits change per event (only one visible at a time)
  const countDigits = [1, 2, 3, 4, 5, 6].map((k, i) => {
    const anim = i < 5 ? fadeWindow(APPEAR[i], APPEAR[i + 1]) : fadeFrom(APPEAR[i])
    return `<text x="84" y="20" font-size="11" fill="${C.text}" text-anchor="middle" dominant-baseline="central" style="font-variant-numeric: tabular-nums">${k}${anim}</text>`
  })

  return `
  <rect width="${W}" height="40" fill="${C.headerBg}"/>
  <line x1="0" y1="40" x2="${W}" y2="40" stroke="${C.borderSoft}"/>
  <text x="16" y="21" font-size="13" font-weight="600" fill="${C.textBright}" dominant-baseline="central" class="sans">Events</text>
  <g>${showFrom(0.5)}<rect x="70" y="11" width="28" height="18" rx="9" fill="${C.badge}"/></g>
  ${countDigits.join('\n')}
  <circle cx="107" cy="20" r="3" fill="${C.emerald}">${pulse('1; 0.5; 1', 2)}</circle>
  <text x="115" y="21" font-size="12" fill="${C.textFaint}" dominant-baseline="central" class="sans">live</text>
  <svg x="596" y="14" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/>
    <circle cx="10" cy="4" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="16" cy="20" r="2"/>
  </svg>
  <svg x="612" y="14" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 16 4 4 4-4M7 20V4m14 4-4-4-4 4M17 4v16"/>
  </svg>
`
}

function colHeader(): string {
  const s = 'font-size="10.5" fill="#475569" dominant-baseline="central" class="sans" style="letter-spacing: 0.06em"'
  return `
  <rect y="40" width="${W}" height="22" fill="${C.headerBg2}"/>
  <text x="16" y="51" ${s}>LEVEL</text>
  <text x="84" y="51" ${s}>SCOPE</text>
  <text x="176" y="51" ${s}>MESSAGE</text>
  <text x="624" y="51" ${s} text-anchor="end">TIME</text>
  <line x1="0" y1="62" x2="${W}" y2="62" stroke="${C.borderRow}"/>
`
}

function statusBar(): string {
  const counts = [1, 2, 3, 4, 5, 6].map((k, i) => {
    const label = k === 1 ? '1 event' : `${k} events`
    const anim = i < 5 ? fadeWindow(APPEAR[i], APPEAR[i + 1]) : fadeFrom(APPEAR[i])
    return `<text x="26" y="302" font-size="10.5" fill="${C.textDimmer}" dominant-baseline="central">${label}${anim}</text>`
  })
  return `
  <rect y="286" width="${W}" height="32" fill="rgba(15,23,42,0.6)"/>
  <line x1="0" y1="286" x2="${W}" y2="286" stroke="${C.borderRow}"/>
  <circle cx="16" cy="302" r="3" fill="${C.emerald}" opacity="0.6">${pulse('0.6; 0.3; 0.6', 1.6)}</circle>
  <text x="26" y="302" font-size="10.5" fill="${C.textDimmer}" dominant-baseline="central">0 events</text>
  ${counts.join('\n')}
`
}

// ── assembly ────────────────────────────────────────────────────────────────
export function generate(): string {
  const body = [
    header(),
    colHeader(),
    ...EVENTS.map(eventRow),
    cascadeRow(),
    statusBar(),
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text { font-family: 'RobotoMono Nerd Font', 'DejaVu Sans Mono', ui-monospace, monospace; }
    .sans { font-family: 'DejaVu Sans', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
  <defs>
    <clipPath id="clip"><rect width="${W}" height="${H}" rx="12"/></clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${C.bg}" stroke="${C.border}"/>
  <g clip-path="url(#clip)">
${body}
  </g>
</svg>
`
}
