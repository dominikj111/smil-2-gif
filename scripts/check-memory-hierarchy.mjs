#!/usr/bin/env node
/**
 * Verification for memory-hierarchy.svg (static + ambient version):
 *  - text bounding boxes fit within the 960×700 canvas
 *  - every zone stays fully visible (opacity 1) at all times
 *  - the ambient flow paths keep their static opacities
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync('src/diagrams/memory-hierarchy/memory-hierarchy.svg', 'utf8')
const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000}
</style></head><body>${svg}</body></html>`

const W = 960
const H = 790
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(200)

let issues = 0

// 1. text bboxes fit
const rects = await page.evaluate(() =>
  [...document.querySelectorAll('svg text')].map((el) => {
    const r = el.getBoundingClientRect()
    return { t: el.textContent, x: r.x, y: r.y, w: r.width, h: r.height }
  })
)
for (const r of rects) {
  if (r.x + r.w > W) { console.log(`  ✗ text past right edge: "${r.t}" (ends ${(r.x + r.w).toFixed(0)}/${W})`); issues++ }
  if (r.y + r.h > H) { console.log(`  ✗ text past bottom: "${r.t}"`); issues++ }
  if (r.x < 0 || r.y < 0) { console.log(`  ✗ text off-screen: "${r.t}"`); issues++ }
}
console.log(`✓ text bboxes (${rects.length} texts)`)

// 2. opacity probes — every zone must be 1 at every sampled time
const labels = [
  'ICM — the files',
  'AGENTS.md — global router',
  'engineering',
  'operations',
  'ideas',
  'Chat session',
  'LLM provider',
  'L1 · internal weights',
  'L2 · fine-tuned weights',
  'profile learning',
  'personas aggregation',
  'session distillation',
  'CONVERGING MIRROR',
  'note-taking — global',
  'melt — global',
  'CONVERGING WORKSPACES',
  'note-taking — project',
  'CONVERGING PROJECT KNOWLEDGE',
  '1.3B',
  '98.8%',
  '≈ $20 / month',
]

const seek = async (t) => {
  await page.evaluate((tt) => { try { document.querySelector('svg').setCurrentTime(tt) } catch {} }, t)
  return page.evaluate((labels) => {
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
    const zones = Object.fromEntries(labels.map((l) => [l, op(gOf(l))]))
    zones['flow-l3s'] = pathOp('M 284 185 L 312 185')
    zones['flow-sp'] = pathOp('M 600 185 L 656 185')
    zones['flow-profpers'] = pathOp('M 180 440 L 180 448')
    zones['flow-persdist'] = pathOp('M 180 488 L 180 496')
    zones['flow-sdm'] = pathOp('M 180 536 L 180 560')
    zones['flow-ngm'] = pathOp('M 480 440 L 480 496')
    zones['flow-nppk'] = pathOp('M 780 440 L 780 560')
    zones['flow-meltws'] = pathOp('M 480 536 L 480 560')
    zones['flow-wsdown'] = pathOp('M 480 600 L 480 640')
    zones['flow-mirrordown'] = pathOp('M 180 600 L 180 640')
    zones['flow-pkdown'] = pathOp('M 780 600 L 780 640')
    return zones
  }, labels)
}

const times = [0.2, 3, 6, 9, 12, 13.5]
for (const t of times) {
  const p = await seek(t)
  const failed = labels.filter((l) => !(Math.abs(p[l] - 1) <= 0.05)).map((l) => `${l}=${p[l].toFixed(2)}`)
  const flowExpect = { 'flow-l3s': 0.55, 'flow-sp': 0.55, 'flow-profpers': 0.55, 'flow-persdist': 0.55, 'flow-sdm': 0.55, 'flow-ngm': 0.55, 'flow-nppk': 0.55, 'flow-meltws': 0.55, 'flow-wsdown': 0.45, 'flow-mirrordown': 0.45, 'flow-pkdown': 0.45 }
  for (const [k, v] of Object.entries(flowExpect)) {
    if (!(Math.abs(p[k] - v) <= 0.05)) failed.push(`${k}=${p[k].toFixed(2)}(exp ${v})`)
  }
  if (failed.length) issues += failed.length
  console.log(`${failed.length === 0 ? '✓' : '✗'} t=${t}s${failed.length ? ': ' + failed.join(', ') : ''}`)
}

await browser.close()
process.exit(issues > 0 ? 1 : 0)
