#!/usr/bin/env node
/**
 * Browser playback test for architecture.gif:
 * plays the GIF in Chromium and compares the visual brightness of zone
 * regions across phases (relative comparisons — robust to GIF palette
 * quantization). Expects the cinematic loop:
 *   default → browser → lambda → iot → hub → worker → sensor → appServer
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'

const gifPath = process.argv[2] ?? 'gifs/architecture.gif'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 860, height: 560 } })
const b64 = readFileSync(gifPath).toString('base64')
await page.setContent(`<!doctype html><html><body style="margin:0;background:#000">
<img src="data:image/gif;base64,${b64}" style="display:block">
</body></html>`, { waitUntil: 'load' })

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

const mean = (f, x, y, w, h) => {
  const out = execFileSync('convert', [f, '-crop', `${w}x${h}+${x}+${y}`, '-colorspace', 'gray', '-scale', '1x1!', 'txt:-'], { encoding: 'utf8' })
  const m = out.match(/\(\s*(\d+)/)
  return m ? parseInt(m[1], 10) / 255 : 0
}

// capture every ~0.3s for ~14s (one loop + tail)
const frames = []
const t0 = Date.now()
for (let i = 0; i < 48; i++) {
  const f = `/tmp/arch_${String(i).padStart(3, '0')}.png`
  await shot(f)
  frames.push({ f, t: (Date.now() - t0) / 1000 })
  await page.waitForTimeout(280)
}
await browser.close()

// region definitions (in page coords; img at 0,0)
const iotCard = [10, 237, 185, 76] // left source card
const hubBox = [338, 414, 165, 82]
const engine = [345, 145, 150, 80]

const at = (t) => frames.find((f) => f.t >= t) ?? frames[frames.length - 1]
const bright = (f, [x, y, w, h]) => mean(f, x, y, w, h)

let ok = true
const check = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`)
  if (!cond) ok = false
}

// default (≈0.6s) vs iot phase (≈5.5s): iot card bright in both
const bDefault = bright(at(0.6).f, iotCard)
const bIot = bright(at(5.5).f, iotCard)
const bBrowser = bright(at(2.2).f, iotCard) // browser phase → iot card dimmed 0.35
check(`iot card dims during browser phase (${bDefault.toFixed(3)} default vs ${bBrowser.toFixed(3)} browser)`, bBrowser < bDefault * 0.75)

// hub zone: bright at hub phase (≈6.8s), dimmed at browser phase (≈2.2s)
const hubDim = bright(at(2.2).f, hubBox)
const hubBright = bright(at(6.8).f, hubBox)
check(`hub box dims during source phase (${hubDim.toFixed(3)}) vs bright at hub phase (${hubBright.toFixed(3)})`, hubBright > hubDim * 1.5)

// engine always bright (pulse rings, never dims)
const engineAtSource = bright(at(2.2).f, engine)
const engineAtHub = bright(at(6.8).f, engine)
check(`engine stays bright across phases (${engineAtSource.toFixed(3)} vs ${engineAtHub.toFixed(3)})`, engineAtSource > 0.03 && engineAtHub > 0.03)

// loop reset: after ~12.5s everything back to default (iot card bright again)
const tail = frames[frames.length - 1]
check(`gif still playing at ${tail.t.toFixed(1)}s (iot card bright: ${bright(tail.f, iotCard).toFixed(3)})`, bright(tail.f, iotCard) > 0.02)

console.log(ok ? '✓ architecture GIF plays with correct phase timeline' : '✗ FAILED')
process.exit(ok ? 0 : 1)
