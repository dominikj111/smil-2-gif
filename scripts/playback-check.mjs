#!/usr/bin/env node
/**
 * Browser playback test: load the final GIF in Chromium as an <img>,
 * sample accent-bar pixels every ~150ms for one full loop (7.5s + tail),
 * and report when each row becomes visible. Proves the GIF plays
 * with the intended timeline in a real browser.
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'


const gifPath = process.argv[2] ?? 'gifs/hero-terminal.gif'


const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 700, height: 400 } })
// embed the GIF as a data URL (no file:// or route tricks needed)
const b64 = readFileSync(gifPath).toString('base64')
await page.setContent(`<!doctype html><html><body style="margin:0;background:#000">
<img id="g" src="data:image/gif;base64,${b64}" style="display:block">
</body></html>`, { waitUntil: 'load' })
await page.waitForTimeout(500)

async function shot(f) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.screenshot({ path: f })
      return
    } catch (err) {
      if (attempt === 4) throw err
      await page.waitForTimeout(300)
    }
  }
}

const sample = (f, x, y) =>
  execFileSync('convert', [f, '-crop', `1x1+${x}+${y}`, 'txt:-'], { encoding: 'utf8' }).match(/#[0-9A-Fa-f]{6}/)?.[0]

// capture playback for ~9s (one full loop + reset) at ~150ms intervals
const frames = []
const t0 = Date.now()
for (let i = 0; i < 60; i++) {
  const f = `/tmp/play_${String(i).padStart(3, '0')}.png`
  await shot(f)
  frames.push({ f, t: (Date.now() - t0) / 1000 })
  await page.waitForTimeout(150)
}
await browser.close()

// classify: r1 amber from 0.65s, r3 red from 1.95s, cascade tint from 4.65s
const amberish = (c) => {
  const [r, g, b] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  return r > 180 && g > 110 && g < 200 && b < 90
}
const reddish = (c) => {
  const [r, g, b] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  return r > 120 && r > g * 1.5 && r > b * 1.5
}

let seen = { r1: null, r3: null, cascade: null, reset: null }
let firstPassDone = false
for (let i = 0; i < frames.length; i++) {
  const t = frames[i].t // absolute wall time
  const r1 = sample(frames[i].f, 1, 78)
  const r3 = sample(frames[i].f, 1, 142)
  const casc = sample(frames[i].f, 320, 270)
  if (seen.r1 === null && amberish(r1)) seen.r1 = t
  if (seen.r3 === null && reddish(r3)) seen.r3 = t
  if (seen.cascade === null && reddish(casc) && i > 20) seen.cascade = t
  // full state visible ~7.5s, then reset
  const allVisible = amberish(r1) && reddish(r3)
  if (allVisible && !firstPassDone) { firstPassDone = true }
  if (firstPassDone && !amberish(r1) && !reddish(r3) && seen.reset === null) { seen.reset = t; break }
}
console.log('row1 visible at ~', seen.r1?.toFixed(2), 's (expect ~0.65)')
console.log('row3 visible at ~', seen.r3?.toFixed(2), 's (expect ~1.95)')
console.log('cascade visible at ~', seen.cascade?.toFixed(2), 's (expect ~4.65)')
console.log('reset (loop restart) at ~', seen.reset?.toFixed(2), 's (expect ~7.5)')

const ok = seen.r1 && seen.r1 > 0.4 && seen.r1 < 1.0 && seen.r3 && seen.r3 > 1.5 && seen.r3 < 2.6 && seen.cascade && seen.cascade > 4.0 && seen.cascade < 5.6 && seen.reset && seen.reset > 6.9 && seen.reset < 8.3
console.log(ok ? '✓ GIF plays with correct timeline in browser' : '✗ TIMELINE MISMATCH')
process.exit(ok ? 0 : 1)
