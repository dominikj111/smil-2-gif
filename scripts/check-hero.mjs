#!/usr/bin/env node
/**
 * Layout + timing verification for hero-terminal.svg.
 * Row groups are <g> containing an accent <rect width="2"> (event rows)
 * or the CASCADE text (cascade row).
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const svg = readFileSync('src/diagrams/hero-terminal/hero-terminal.svg', 'utf8')
const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000}
</style></head><body>${svg}</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 640, height: 318 } })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(200)

let issues = 0
const inRange = (v, lo, hi, what) => {
  if (v < lo || v > hi) { console.log(`  ✗ ${what}: ${v.toFixed(1)} (bounds ${lo}..${hi})`); issues++ }
}

// 1. text bboxes
const rects = await page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((el) => {
    const r = el.getBoundingClientRect()
    return { t: el.textContent, x: r.x, y: r.y, w: r.width, h: r.height }
  })
)
for (const r of rects) {
  const t = r.t
  if (t === 'LEVEL') inRange(r.x, 14, 40, `header "${t}"`)
  if (t === 'SCOPE') inRange(r.x, 82, 120, `header "${t}"`)
  if (t === 'MESSAGE') inRange(r.x, 174, 220, `header "${t}"`)
  if (t === 'TIME') inRange(r.x + r.w, 600, 626, `header "${t}"`)
  if (t === 'Events') inRange(r.x, 14, 60, '"Events"')
  if (['db', 'api-server', 'worker', 'browser'].includes(t)) inRange(r.x, 82, 166, `scope "${t}"`)
  if (t.includes('14:03:')) inRange(r.x + r.w, 600, 626, `time "${t}"`)
  if (r.x + r.w > 640) { console.log(`  ✗ text past right edge: "${t}"`); issues++ }
  if (r.y + r.h > 318) { console.log(`  ✗ text past bottom: "${t}"`); issues++ }
}
console.log(`✓ text bboxes (${rects.length} texts)`)

// 2. row group computed opacity over time
//    expect: 0 = hidden, 1 = fully visible, f = mid-fade (0.3..0.9)
const rowOps = async (t) => {
  await page.evaluate((tt) => { try { document.querySelector('svg').setCurrentTime(tt) } catch {} }, t)
  return page.evaluate(() => {
    const all = [...document.querySelectorAll('g[clip-path] > g')]
    const rows = all.filter((g) => g.querySelector('rect[width="2"]'))
    const cascade = all.find((g) => g.textContent.includes('CASCADE'))
    return [...rows.map((g) => Number(getComputedStyle(g).opacity)), Number(getComputedStyle(cascade).opacity)]
  })
}
const EXPECT = {
  0: [0, 0, 0, 0, 0, 0, 0],
  1.0: [1, 0, 0, 0, 0, 0, 0],
  1.18: [1, 'f', 0, 0, 0, 0, 0],
  3.3: [1, 1, 1, 1, 'f', 0, 0],
  4.6: [1, 1, 1, 1, 1, 1, 'f'],
  7.4: [1, 1, 1, 1, 1, 1, 1],
}
for (const [t, expected] of Object.entries(EXPECT)) {
  const ops = await rowOps(parseFloat(t))
  const ok = ops.every((o, i) => {
    const e = expected[i]
    if (e === 0) return o < 0.05
    if (e === 1) return o > 0.95
    return o > 0.3 && o < 0.9 // mid-fade
  })
  console.log(`${ok ? '✓' : '✗'} t=${t}: opacities ${ops.map((o) => o.toFixed(2)).join(' ')} (expect ${expected.join(' ')})`)
  if (!ok) issues++
}

// 3. pixel sampling — capture all frames first, then sample with ImageMagick
const sample = (file, x, y) => {
  const out = execFileSync('convert', [file, '-crop', `1x1+${x}+${y}`, 'txt:-'], { encoding: 'utf8' })
  return out.match(/#[0-9A-Fa-f]{6}/)?.[0]
}
const pts = { r1: [1, 78], r2: [1, 110], r3: [1, 142], r4: [1, 174], r5: [1, 206], r6: [1, 238] }
const times = [0, 1.0, 3.3, 4.6, 7.4]
for (const t of times) {
  await page.evaluate((tt) => { try { document.querySelector('svg').setCurrentTime(tt) } catch {} }, t)
  await page.screenshot({ path: `/tmp/px_${t}.png` })
}
for (const t of times) {
  const colors = {}
  for (const [name, [x, y]] of Object.entries(pts)) colors[name] = sample(`/tmp/px_${t}.png`, x, y)
  const cascade = sample(`/tmp/px_${t}.png`, 320, 270)
  console.log(`t=${t}: accent=${JSON.stringify(colors)} cascade=${cascade}`)
}

await browser.close()
process.exit(issues > 0 ? 1 : 0)
