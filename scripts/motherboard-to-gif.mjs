#!/usr/bin/env node
/**
 * html/motherboard.html -> GIF/WebM/MP4 — captures only the board diagram
 * (the .pcb element), never the full review page.
 *
 * Authoring front-end for the html review artifacts: the board uses CSS
 * keyframe animations (dots on the buses, 2s loop). CSS animations are not
 * SMIL-seekable, so instead of wall-clock recording we drive them
 * deterministically through the Web Animations API: pause every animation and
 * set currentTime = t for each frame — the HTML analog of svg.setCurrentTime.
 * A 2s loop is seamless (every bus animation cycles in exactly 2s).
 *
 * Usage:
 *   node scripts/motherboard-to-gif.mjs [output.gif] [--duration 2] [--fps 24]
 */

import { chromium } from 'playwright'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { captureLoop, DEFAULTS, encodeFrames, ensureOutputDir, validate } from './lib/encoder.mjs'

const HTML = resolve('html/motherboard.html')
const OUTPUT = resolve(process.argv[2] ?? 'gifs/motherboard.gif')

const opts = validate({
  ...DEFAULTS,
  duration: 2, // every bus animation loops in exactly 2s -> seamless GIF loop
  fps: 24,
  dither: 'none', // flat PCB surface
})

const framesDir = mkdtempSync(join(tmpdir(), 'motherboard-to-video-'))

try {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: opts.dpr,
  })
  const page = await context.newPage()
  await page.emulateMedia({ colorScheme: opts.scheme })

  const html = readFileSync(HTML, 'utf8')
  await page.setContent(html, { waitUntil: 'load' })
  await page.waitForTimeout(250)

  // derive the diagram box + output size from the actual element
  const box = await page.locator('.pcb').boundingBox()
  if (!box) throw new Error('.pcb element not found in ' + HTML)
  opts.width = Math.round(box.width)
  opts.height = Math.round(box.height)

  console.error(`Input:   ${HTML}`)
  console.error(`Output:  ${OUTPUT}`)
  console.error(`Diagram: .pcb @ ${box.width.toFixed(0)}x${box.height.toFixed(0)} CSS px (capture @${opts.dpr}x)`)
  console.error(`Format:  ${opts.format} | ${opts.duration}s | ${opts.fps} fps | ${opts.totalFrames} frames`)

  // deterministic seek: pause every CSS animation, drive currentTime per frame
  const seek = (t) =>
    page.evaluate((ms) => {
      for (const a of document.getAnimations()) {
        a.pause()
        a.currentTime = ms
      }
    }, Math.round(t * 1000))

  await captureLoop({
    page,
    framesDir,
    opts,
    perFrame: seek,
    settle: async () => page.waitForTimeout(20),
    clip: { x: box.x, y: box.y, width: box.width, height: box.height }, // only the board, never the page chrome
  })

  encodeFrames({ framesDir, outputPath: OUTPUT, opts })

  console.error('Done -> ' + OUTPUT)
} finally {
  rmSync(framesDir, { recursive: true, force: true })
}
