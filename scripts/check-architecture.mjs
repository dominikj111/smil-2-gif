#!/usr/bin/env node
/**
 * Verification for architecture.svg:
 *  - text bounding boxes fit within the canvas
 *  - per-phase opacity of cards/paths/zones matches the Architecture.tsx logic
 *    (converted to the cinematic loop: default → browser → lambda → iot →
 *     hub → worker → sensor → appServer → default)
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync('src/diagrams/architecture/architecture.svg', 'utf8')
const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000}
</style></head><body>${svg}</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 840, height: 540 } })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(200)

let issues = 0
const near = (v, e, tol = 0.05, what) => {
  const ok = Math.abs(v - e) <= tol
  if (!ok) { console.log(`  ✗ ${what}: got ${v.toFixed(3)}, expect ${e}`); issues++ }
}

// 1. text bboxes fit
const rects = await page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((el) => {
    const r = el.getBoundingClientRect()
    return { t: el.textContent, x: r.x, y: r.y, w: r.width, h: r.height }
  })
)
for (const r of rects) {
  if (r.x + r.w > 840) { console.log(`  ✗ text past right edge: "${r.t}" (ends ${(r.x + r.w).toFixed(0)})`); issues++ }
  if (r.y + r.h > 540) { console.log(`  ✗ text past bottom: "${r.t}"`); issues++ }
}
console.log(`✓ text bboxes (${rects.length} texts)`)

// 2. probes: group opacity by contained text, path opacity by d attribute
const seek = async (t) => {
  await page.evaluate((tt) => { try { document.querySelector('svg').setCurrentTime(tt) } catch {} }, t)
  return page.evaluate(() => {
    const gOf = (label) => {
      const t = [...document.querySelectorAll('text')].find((e) => e.textContent.trim() === label)
      if (!t) return null
      let g = t.closest('g')
      while (g && !g.querySelector('animate')) g = g.parentElement
      return g
    }
    const op = (el) => (el ? Number(getComputedStyle(el).opacity) : NaN)
    const pathOp = (d) => {
      const p = [...document.querySelectorAll('path')].find((e) => !e.closest('defs') && e.getAttribute('d') === d)
      return p ? Number(getComputedStyle(p).opacity) : NaN
    }
    return {
      browserCard: op(gOf('Browser SDK')),
      lambdaCard: op(gOf('AWS Lambda')),
      iotCard: op(gOf('IoT / Edge Device')),
      workerCard: op(gOf('Worker / Job')),
      sensorCard: op(gOf('Sensor / Device')),
      appZone: op(gOf('App Server')),
      hubZone: op(gOf('local infrastructure')),
      browserPath: pathOp('M 195 95 C 265 95 305 185 345 185'),
      lambdaPath: pathOp('M 195 185 L 345 185'),
      conv0: pathOp('M 170 430 C 235 430 298 455 338 455'),
      conv1: pathOp('M 170 480 C 235 480 298 455 338 455'),
      hubPath: pathOp('M 420 414 L 420 225'),
      iotBack: pathOp('M 345 193 C 305 193 265 283 195 283'),
      hubBack: pathOp('M 338 463 C 298 463 235 488 170 488'),
      appConv: pathOp('M 228 365 C 273 365 298 455 338 455'),
    }
  })
}

const cases = [
  { t: 0.5, e: { browserCard: 1, lambdaCard: 1, iotCard: 1, workerCard: 1, sensorCard: 1, appZone: 1, hubZone: 1, browserPath: 0.18, lambdaPath: 0.18, conv0: 0.12, conv1: 0.12, hubPath: 0.18, iotBack: 0.12, hubBack: 0.12, appConv: 0.12 }, name: 'default' },
  { t: 1.5, e: { browserCard: 1, lambdaCard: 0.35, iotCard: 0.35, workerCard: 1, sensorCard: 1, appZone: 1, hubZone: 0.35, browserPath: 0.75, lambdaPath: 0.06, conv0: 0.12, hubPath: 0.12, iotBack: 0.04 }, name: 'browser' },
  { t: 3.0, e: { browserCard: 0.35, lambdaCard: 1, iotCard: 0.35, hubZone: 0.35, lambdaPath: 0.75, browserPath: 0.06 }, name: 'lambda' },
  { t: 5.0, e: { browserCard: 0.35, lambdaCard: 0.35, iotCard: 1, hubZone: 0.35, iotBack: 0.65 }, name: 'iot' },
  { t: 6.5, e: { workerCard: 0.5, sensorCard: 0.5, appZone: 0.5, hubZone: 1, conv0: 0.15, hubPath: 0.8, hubBack: 0.35, browserCard: 0.35 }, name: 'hub' },
  { t: 8.0, e: { workerCard: 1, sensorCard: 0.3, appZone: 0.3, hubZone: 1, conv0: 0.8, conv1: 0.05, hubPath: 0.8, hubBack: 0.04 }, name: 'worker' },
  { t: 9.5, e: { workerCard: 0.3, sensorCard: 1, appZone: 0.3, hubZone: 1, conv1: 0.8, conv0: 0.05, hubPath: 0.8, hubBack: 0.75 }, name: 'sensor' },
  { t: 11.0, e: { workerCard: 0.3, sensorCard: 0.3, appZone: 1, hubZone: 1, appConv: 0.8, conv0: 0.05, hubPath: 0.8 }, name: 'appServer' },
]

for (const { t, e, name } of cases) {
  const p = await seek(t)
  const parts = Object.entries(e).map(([k, v]) => {
    const ok = Math.abs(p[k] - v) <= 0.05
    if (!ok) issues++
    return `${k}=${p[k].toFixed(2)}${ok ? '' : `(exp ${v})`}`
  })
  const failed = parts.filter((s) => s.includes('(exp'))
  console.log(`${failed.length === 0 ? '✓' : '✗'} ${name} (t=${t}s): ${failed.length === 0 ? 'all match' : failed.join(', ')}`)
}

await browser.close()
process.exit(issues > 0 ? 1 : 0)
